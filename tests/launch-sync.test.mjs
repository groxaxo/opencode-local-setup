import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { getAutoDisplayName } from "../scripts/sync-core.mjs";

const repoDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const execFileAsync = promisify(execFile);

async function startModelServer(modelsByPath) {
  const server = http.createServer((request, response) => {
    const models = modelsByPath[request.url];
    if (!models) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not found" }));
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ data: models }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  return {
    close: () => new Promise((resolve, reject) => {
      server.closeAllConnections?.();
      server.close((error) => error ? reject(error) : resolve());
    }),
    urlFor: (requestPath = "/v1") => `http://127.0.0.1:${port}${requestPath}`,
  };
}

test("sync-provider refreshes model names and removes stale models", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sync-provider-"));
  const configPath = path.join(tempDir, "opencode.json");
  const server = await startModelServer({
    "/v1/models": [
      { id: "latest-chat", name: "Latest Chat", function_calling: true },
      { id: "embed-small", name: "Embed Small", function_calling: false },
    ],
  });

  try {
    await fs.writeFile(configPath, JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      provider: {
        local: {
          npm: "@ai-sdk/openai-compatible",
          name: "Local",
          options: {
            baseURL: server.urlFor("/v1"),
          },
          models: {
            "latest-chat": {
              name: "Old Name",
              tools: false,
            },
            "stale-model": {
              name: "Stale",
              tools: true,
            },
          },
        },
      },
    }, null, 2));

    await execFileAsync("node", ["scripts/sync-provider.mjs"], {
      cwd: repoDir,
      env: {
        ...process.env,
        OPENCODE_CONFIG: configPath,
        LOCAL_API_BASE: server.urlFor("/v1"),
        OPENCODE_PROVIDER_ID: "local",
        OPENCODE_PROVIDER_NAME: "Local",
      },
      encoding: "utf8",
    });

    const config = JSON.parse(await fs.readFile(configPath, "utf8"));
    assert.deepEqual(config.provider.local.models, {
      "latest-chat": {
        name: "Latest Chat",
        tools: true,
      },
      "embed-small": {
        name: "Embed Small",
        tools: false,
      },
    });
  } finally {
    await server.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("sync-on-launch refreshes every configured checkpoint without renaming providers", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "launch-sync-"));
  const configPath = path.join(tempDir, "opencode.json");
  const serverA = await startModelServer({
    "/a/models": [
      { id: "checkpoint-a", name: "Checkpoint A Latest", function_calling: true },
    ],
  });
  const serverB = await startModelServer({
    "/b/models": [
      { id: "checkpoint-b", name: "Checkpoint B Latest", function_calling: false },
    ],
  });

  try {
    await fs.writeFile(configPath, JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      provider: {
        "checkpoint-alpha": {
          npm: "@ai-sdk/openai-compatible",
          name: "Alpha Checkpoint",
          options: {
            baseURL: serverA.urlFor("/a"),
          },
          models: {
            "checkpoint-a": {
              name: "Outdated Alpha",
              tools: false,
            },
          },
        },
        "checkpoint-beta": {
          npm: "@ai-sdk/openai-compatible",
          name: "Beta Checkpoint",
          options: {
            baseURL: serverB.urlFor("/b"),
          },
          models: {},
        },
      },
    }, null, 2));

    await execFileAsync("node", ["scripts/sync-on-launch.mjs"], {
      cwd: repoDir,
      env: {
        ...process.env,
        OPENCODE_CONFIG: configPath,
        OPENCODE_TAILSCALE_DISCOVERY: "0",
      },
      encoding: "utf8",
    });

    const config = JSON.parse(await fs.readFile(configPath, "utf8"));
    assert.equal(config.provider["checkpoint-alpha"].name, "Alpha Checkpoint");
    assert.equal(config.provider["checkpoint-beta"].name, "Beta Checkpoint");
    assert.deepEqual(config.provider["checkpoint-alpha"].models, {
      "checkpoint-a": {
        name: "Checkpoint A Latest",
        tools: true,
      },
    });
    assert.deepEqual(config.provider["checkpoint-beta"].models, {
      "checkpoint-b": {
        name: "Checkpoint B Latest",
        tools: false,
      },
    });
  } finally {
    await Promise.all([serverA.close(), serverB.close()]);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("getAutoDisplayName prefixes Tailscale endpoints", () => {
  assert.equal(
    getAutoDisplayName("http://100.100.100.100:1234/v1", "Remote OpenAI-Compatible"),
    "Tailscale - 100.100.100.100:1234",
  );
});

test("sync-on-launch auto-discovers Tailscale peers in the configured port range", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "launch-sync-tailscale-"));
  const configPath = path.join(tempDir, "opencode.json");
  const server = await startModelServer({
    "/v1/models": [
      { id: "qwen-remote", name: "Qwen Remote", function_calling: true },
    ],
  });

  try {
    await fs.writeFile(configPath, JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      provider: {},
    }, null, 2));

    const tailscaleStatus = {
      Peer: {
        testPeer: {
          HostName: "gpu-box",
          Online: true,
          TailscaleIPs: ["127.0.0.1"],
        },
      },
    };

    await execFileAsync("node", ["scripts/sync-on-launch.mjs"], {
      cwd: repoDir,
      env: {
        ...process.env,
        OPENCODE_CONFIG: configPath,
        OPENCODE_TAILSCALE_STATUS_JSON: JSON.stringify(tailscaleStatus),
        OPENCODE_TAILSCALE_PORTS: String(new URL(server.urlFor("/v1")).port),
        OPENCODE_TAILSCALE_TIMEOUT_MS: "50",
        OPENCODE_TAILSCALE_HTTP_TIMEOUT_MS: "500",
      },
      encoding: "utf8",
    });

    const discoveredPort = String(new URL(server.urlFor("/v1")).port);
    const config = JSON.parse(await fs.readFile(configPath, "utf8"));
    const providerKey = `tailscale-gpu-box-${discoveredPort}`;

    assert.equal(config.provider[providerKey].name, `Tailscale - gpu-box:${discoveredPort}`);
    assert.equal(config.provider[providerKey].options.baseURL, `http://127.0.0.1:${discoveredPort}/v1`);
    assert.deepEqual(config.provider[providerKey].models, {
      "qwen-remote": {
        name: "Qwen Remote",
        tools: true,
      },
    });
  } finally {
    await server.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
