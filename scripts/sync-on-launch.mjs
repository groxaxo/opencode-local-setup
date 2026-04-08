import { URL } from "node:url";
import { detectProviderFromUrl } from "./providers.mjs";
import {
  canSyncBaseURL,
  fetchModels,
  getConfigPath,
  normalizeBaseURL,
  readConfig,
  resolveRequestHeaders,
  syncProviderModels,
  writeConfig,
} from "./sync-core.mjs";

function getLaunchTargets(cfg) {
  const targets = [];
  const seen = new Set();

  for (const [providerKey, providerConfig] of Object.entries(cfg.provider ?? {})) {
    const baseURL = normalizeBaseURL(providerConfig?.options?.baseURL ?? providerConfig?.baseURL);
    if (!baseURL || !canSyncBaseURL(baseURL)) {
      continue;
    }

    const dedupeKey = `${providerKey}:${baseURL}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
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

    if (!seen.has(dedupeKey)) {
      targets.push({
        providerKey,
        baseURL: fallbackBaseURL,
        providerConfig: cfg.provider?.[providerKey],
        displayName: process.env.OPENCODE_PROVIDER_NAME,
      });
    }
  }

  return targets;
}

const configPath = getConfigPath();

try {
  const cfg = await readConfig(configPath);
  const targets = getLaunchTargets(cfg);

  if (targets.length === 0) {
    process.exit(0);
  }

  let syncedCount = 0;

  for (const target of targets) {
    try {
      const detectedProvider = detectProviderFromUrl(target.baseURL);
      const headers = resolveRequestHeaders({ detectedProvider, providerConfig: target.providerConfig });
      const models = await fetchModels({ baseURL: target.baseURL, headers });

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
        displayName: target.displayName ?? detectedProvider?.name ?? `Local (${new URL(target.baseURL).hostname})`,
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
