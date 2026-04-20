import { execFile } from "node:child_process";
import net from "node:net";
import { promisify } from "node:util";
import { detectProviderFromUrl } from "./providers.mjs";
import {
  canSyncBaseURL,
  fetchModels,
  getAutoDisplayName,
  getConfigPath,
  normalizeBaseURL,
  readConfig,
  resolveRequestHeaders,
  syncProviderModels,
  writeConfig,
} from "./sync-core.mjs";

const DEFAULT_TAILSCALE_PORTS = "1200-1300,8000-8100,8880-8900";
const DEFAULT_TAILSCALE_TIMEOUT_MS = 250;
const DEFAULT_TAILSCALE_CONCURRENCY = 32;
const execFileAsync = promisify(execFile);

function parsePortRanges(rangeSpec = DEFAULT_TAILSCALE_PORTS) {
  const ports = new Set();

  for (const rawSegment of String(rangeSpec).split(",")) {
    const segment = rawSegment.trim();
    if (!segment) {
      continue;
    }

    if (segment.includes("-")) {
      const [startRaw, endRaw] = segment.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw);

      if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0 || start > end) {
        continue;
      }

      for (let port = start; port <= end; port += 1) {
        ports.add(port);
      }
      continue;
    }

    const port = Number(segment);
    if (Number.isInteger(port) && port > 0) {
      ports.add(port);
    }
  }

  return [...ports].sort((left, right) => left - right);
}

function sanitizeProviderKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "node";
}

function getLaunchTargets(cfg) {
  const targets = [];
  const seenKeys = new Set();
  const seenBaseURLs = new Set();

  for (const [providerKey, providerConfig] of Object.entries(cfg.provider ?? {})) {
    const baseURL = normalizeBaseURL(providerConfig?.options?.baseURL ?? providerConfig?.baseURL);
    if (!baseURL || !canSyncBaseURL(baseURL)) {
      continue;
    }

    const dedupeKey = `${providerKey}:${baseURL}`;
    if (seenKeys.has(dedupeKey)) {
      continue;
    }

    seenKeys.add(dedupeKey);
    seenBaseURLs.add(baseURL);
    targets.push({
      providerKey,
      baseURL,
      providerConfig,
      displayName: providerConfig?.name,
    });
  }

  const fallbackBaseURL = normalizeBaseURL(process.env.LOCAL_API_BASE);
  if (fallbackBaseURL && canSyncBaseURL(fallbackBaseURL)) {
    const providerKey = process.env.OPENCODE_PROVIDER_ID || detectProviderFromUrl(fallbackBaseURL)?.id || "local";
    const dedupeKey = `${providerKey}:${fallbackBaseURL}`;

    if (!seenKeys.has(dedupeKey)) {
      seenKeys.add(dedupeKey);
      seenBaseURLs.add(fallbackBaseURL);
      targets.push({
        providerKey,
        baseURL: fallbackBaseURL,
        providerConfig: cfg.provider?.[providerKey],
        displayName: process.env.OPENCODE_PROVIDER_NAME,
      });
    }
  }

  return { targets, seenBaseURLs };
}

function getDisplayName(target, detectedProvider) {
  if (target.displayName) {
    return target.displayName;
  }

  return getAutoDisplayName(target.baseURL, detectedProvider?.name ?? target.providerKey);
}

async function getTailscaleStatus() {
  if (process.env.OPENCODE_TAILSCALE_STATUS_JSON) {
    return JSON.parse(process.env.OPENCODE_TAILSCALE_STATUS_JSON);
  }

  try {
    const { stdout } = await execFileAsync("tailscale", ["status", "--json"], {
      encoding: "utf8",
      timeout: 4000,
      maxBuffer: 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function getTailscalePeers(status) {
  const peers = [];
  const peerMap = status?.Peer ?? {};

  for (const peer of Object.values(peerMap)) {
    if (!peer || peer.Online === false) {
      continue;
    }

    const label = String(peer.HostName || peer.DNSName || "").replace(/\.$/, "") || null;
    for (const ip of peer.TailscaleIPs ?? []) {
      if (!ip || typeof ip !== "string") {
        continue;
      }

      peers.push({
        ip,
        label: label || ip,
      });
    }
  }

  const dedupedPeers = new Map();
  for (const peer of peers) {
    dedupedPeers.set(peer.ip, peer);
  }
  return [...dedupedPeers.values()];
}

function isTcpPortOpen(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let settled = false;

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function discoverTailscaleTargets(cfg, seenBaseURLs) {
  if (process.env.OPENCODE_TAILSCALE_DISCOVERY === "0") {
    return [];
  }

  const status = await getTailscaleStatus();
  if (!status) {
    return [];
  }

  const peers = getTailscalePeers(status);
  if (peers.length === 0) {
    return [];
  }

  const timeoutMs = Number(process.env.OPENCODE_TAILSCALE_TIMEOUT_MS || DEFAULT_TAILSCALE_TIMEOUT_MS);
  const concurrency = Number(process.env.OPENCODE_TAILSCALE_CONCURRENCY || DEFAULT_TAILSCALE_CONCURRENCY);
  const ports = parsePortRanges(process.env.OPENCODE_TAILSCALE_PORTS || DEFAULT_TAILSCALE_PORTS);
  const candidates = [];

  for (const peer of peers) {
    for (const port of ports) {
      const baseURL = `http://${peer.ip}:${port}/v1`;
      if (seenBaseURLs.has(baseURL)) {
        continue;
      }

      candidates.push({
        providerKey: `tailscale-${sanitizeProviderKey(peer.label)}-${port}`,
        baseURL,
        providerConfig: cfg.provider?.[`tailscale-${sanitizeProviderKey(peer.label)}-${port}`],
        displayName: `Tailscale - ${peer.label}:${port}`,
        host: peer.ip,
        port,
      });
    }
  }

  const discoveredTargets = [];
  for (let index = 0; index < candidates.length; index += concurrency) {
    const batch = candidates.slice(index, index + concurrency);
    const results = await Promise.all(batch.map(async (candidate) => {
      const isReachable = await isTcpPortOpen(candidate.host, candidate.port, timeoutMs);
      return isReachable ? candidate : null;
    }));

    for (const result of results) {
      if (!result || seenBaseURLs.has(result.baseURL)) {
        continue;
      }
      seenBaseURLs.add(result.baseURL);
      discoveredTargets.push(result);
    }
  }

  return discoveredTargets;
}

function createFetchWithTimeout(timeoutMs) {
  return async (url, options = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };
}

const configPath = getConfigPath();

try {
  const cfg = await readConfig(configPath);
  const { targets: configuredTargets, seenBaseURLs } = getLaunchTargets(cfg);
  const tailscaleTargets = await discoverTailscaleTargets(cfg, seenBaseURLs);
  const targets = [...configuredTargets, ...tailscaleTargets];

  if (targets.length === 0) {
    process.exit(0);
  }

  let syncedCount = 0;

  for (const target of targets) {
    try {
      const detectedProvider = detectProviderFromUrl(target.baseURL);
      const headers = resolveRequestHeaders({ detectedProvider, providerConfig: target.providerConfig });
      const timeoutMs = target.displayName?.startsWith("Tailscale - ")
        ? Number(process.env.OPENCODE_TAILSCALE_HTTP_TIMEOUT_MS || 750)
        : 3000;
      const models = await fetchModels({
        baseURL: target.baseURL,
        headers,
        fetchImpl: createFetchWithTimeout(timeoutMs),
      });

      if (models.length === 0) {
        continue;
      }

      syncProviderModels({
        cfg,
        providerKey: target.providerKey,
        baseURL: target.baseURL,
        models,
        detectedProvider,
        providerConfig: target.providerConfig,
        displayName: getDisplayName(target, detectedProvider),
        headers,
      });

      syncedCount += 1;
    } catch (error) {
      console.error(`⚠️  Launch sync skipped ${target.providerKey}: ${error.message}`);
    }
  }

  if (syncedCount > 0) {
    await writeConfig(cfg, configPath);
  }
} catch (error) {
  console.error(`⚠️  Launch sync failed: ${error.message}`);
}
