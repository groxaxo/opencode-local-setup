import { detectProviderFromUrl } from "./providers.mjs";
import {
  fetchModels,
  getAutoDisplayName,
  getConfigPath,
  normalizeBaseURL,
  readConfig,
  resolveRequestHeaders,
  syncProviderModels,
  writeConfig,
} from "./sync-core.mjs";

const baseURL = normalizeBaseURL(process.env.LOCAL_API_BASE ?? "http://127.0.0.1:1234/v1");
const detectedProvider = detectProviderFromUrl(baseURL);
const providerName = process.env.OPENCODE_PROVIDER_ID || detectedProvider?.id || "local";
const displayName = process.env.OPENCODE_PROVIDER_NAME
  || getAutoDisplayName(baseURL, detectedProvider?.name || "Local Provider");
const configPath = getConfigPath();

console.log(`🔄 Syncing models from: ${baseURL}`);
console.log(`📊 Detected provider: ${displayName} (${providerName})`);

try {
  const cfg = await readConfig(configPath);
  const providerConfig = cfg.provider?.[providerName];
  const headers = resolveRequestHeaders({ detectedProvider, providerConfig });
  const models = await fetchModels({ baseURL, headers });

  if (models.length === 0) {
    console.log(`⚠️  No models found at ${baseURL}/models`);
    process.exit(0);
  }

  console.log(`✅ Found ${models.length} models`);

  const result = syncProviderModels({
    cfg,
    providerKey: providerName,
    baseURL,
    models,
    detectedProvider,
    providerConfig,
    displayName,
    headers,
  });

  await writeConfig(cfg, configPath);

  console.log(`\n✅ Config updated: ${configPath}`);
  console.log(`   Added: ${result.addedCount} | Updated: ${result.updatedCount} | Removed: ${result.removedCount}`);
  console.log(`\n🎉 Provider "${providerName}" now has ${result.modelCount} models`);
} catch (error) {
  console.error(`\n❌ Sync failed: ${error.message}`);
  process.exit(1);
}
