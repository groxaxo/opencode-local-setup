import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { detectProviderFromUrl, getApiKeyForProvider } from "./providers.mjs";

const DEFAULT_SCHEMA = "https://opencode.ai/config.json";

export function getConfigPath() {
  return process.env.OPENCODE_CONFIG ?? path.join(
    process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"),
    "opencode",
    "opencode.json",
  );
}

export function normalizeBaseURL(baseURL) {
  return baseURL?.replace(/\/$/, "");
}

export function createDefaultConfig() {
  return {
    $schema: DEFAULT_SCHEMA,
    provider: {},
  };
}

export async function readConfig(configPath = getConfigPath()) {
  try {
    const fileContent = await fs.readFile(configPath, "utf8");
    const cfg = JSON.parse(fileContent);
    cfg.$schema ??= DEFAULT_SCHEMA;
    getProviderMap(cfg);
    return cfg;
  } catch (error) {
    if (error.code === "ENOENT") {
      return createDefaultConfig();
    }
    throw error;
  }
}

export async function writeConfig(cfg, configPath = getConfigPath()) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

export function getProviderMap(cfg) {
  if (cfg.provider && typeof cfg.provider === "object") {
    return cfg.provider;
  }
  if (cfg.providers && typeof cfg.providers === "object") {
    cfg.provider = cfg.providers;
    delete cfg.providers;
    return cfg.provider;
  }
  cfg.provider = {};
  return cfg.provider;
}

export function collectModels(responseBody) {
  if (Array.isArray(responseBody?.data)) {
    return responseBody.data.filter((model) => model?.id);
  }
  if (Array.isArray(responseBody?.models)) {
    return responseBody.models.filter((model) => model?.id);
  }
  return [];
}

export function resolveModelName(model) {
  return [
    model?.name,
    model?.display_name,
    model?.displayName,
    model?.label,
    model?.id,
  ].find((value) => typeof value === "string" && value.trim())?.trim() ?? model?.id;
}

export function resolveModelToolSupport(model) {
  const explicitBoolean = [
    model?.tools,
    model?.supports_tools,
    model?.supportsTools,
    model?.tool_calls,
    model?.toolCalls,
    model?.function_calling,
    model?.functionCalling,
  ].find((value) => typeof value === "boolean");

  if (typeof explicitBoolean === "boolean") {
    return explicitBoolean;
  }

  const loweredId = String(model?.id ?? "").toLowerCase();
  return !loweredId.includes("embedding")
    && !loweredId.includes("embed")
    && !loweredId.includes("reranker")
    && !loweredId.includes("rerank")
    && !loweredId.includes("moderation");
}

export function resolveRequestHeaders({ detectedProvider, providerConfig }) {
  const headers = { ...(providerConfig?.options?.headers ?? {}) };
  let apiKey = getApiKeyForProvider(detectedProvider);

  if (!apiKey && detectedProvider?.isLocal) {
    apiKey = process.env.LOCAL_API_KEY || process.env.API_KEY;
  }

  if (!apiKey && !detectedProvider) {
    apiKey = process.env.LOCAL_API_KEY || process.env.API_KEY;
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

export async function fetchModels({ baseURL, headers, fetchImpl = fetch }) {
  const modelsURL = `${normalizeBaseURL(baseURL)}/models`;
  const response = await fetchImpl(modelsURL, headers ? { headers } : {});

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GET ${modelsURL} failed: ${response.status} ${errorText}`);
  }

  const body = await response.json();
  return collectModels(body);
}

export function syncProviderModels({
  cfg,
  providerKey,
  baseURL,
  models,
  detectedProvider,
  providerConfig,
  displayName,
  npmPackage,
  headers,
}) {
  const providers = getProviderMap(cfg);
  const existingProvider = providers[providerKey] ?? providerConfig ?? {};
  const existingModels = existingProvider.models ?? {};

  providers[providerKey] = {
    ...existingProvider,
    npm: existingProvider.npm ?? npmPackage ?? detectedProvider?.npm ?? "@ai-sdk/openai-compatible",
    name: displayName ?? existingProvider.name ?? detectedProvider?.name ?? providerKey,
    options: {
      ...(existingProvider.options ?? {}),
      baseURL,
    },
    models: {},
  };

  if (headers) {
    providers[providerKey].options.headers = headers;
  }

  if (!headers) {
    delete providers[providerKey].options.headers;
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const model of models) {
    const previousModel = existingModels[model.id] ?? {};
    const nextModel = {
      ...previousModel,
      name: resolveModelName(model),
      tools: resolveModelToolSupport(model),
    };

    if (!existingModels[model.id]) {
      addedCount += 1;
    } else {
      updatedCount += 1;
    }

    providers[providerKey].models[model.id] = nextModel;
  }

  const removedCount = Object.keys(existingModels).filter((modelId) => !providers[providerKey].models[modelId]).length;

  return {
    providerKey,
    modelCount: models.length,
    addedCount,
    updatedCount,
    removedCount,
  };
}

export function canSyncBaseURL(baseURL) {
  const detectedProvider = detectProviderFromUrl(baseURL);
  return detectedProvider?.modelsEndpoint !== null;
}
