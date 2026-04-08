import { detectProviderFromUrl } from "./providers.mjs";
import {
  fetchModels,
  getConfigPath,
  normalizeBaseURL,
  readConfig,
  resolveRequestHeaders,
  syncProviderModels,
  writeConfig,
} from "./sync-core.mjs";

const baseURL = normalizeBaseURL(process.env.LOCAL_API_BASE ?? "http://127.0.0.1:1234/v1");
const configPath = getConfigPath();
const detectedProvider = detectProviderFromUrl(baseURL);
const displayName = process.env.OPENCODE_PROVIDER_NAME || `Local (${new URL(baseURL).hostname})`;

console.log(`🔄 Syncing models from: ${baseURL}`);

try {
  const cfg = await readConfig(configPath);
  const providerConfig = cfg.provider?.local;
  const headers = resolveRequestHeaders({ detectedProvider, providerConfig });
  const models = await fetchModels({ baseURL, headers });

  if (models.length === 0) {
    console.log(`⚠️  No models found at ${baseURL}/models`);
    console.log("   Make sure your AI server is running and accessible");
    process.exit(0);
  }

  console.log(`✅ Found ${models.length} models`);

  const result = syncProviderModels({
    cfg,
    providerKey: "local",
    baseURL,
    models,
    detectedProvider,
    providerConfig,
    displayName,
    npmPackage: "@ai-sdk/openai-compatible",
    headers,
  });

  await writeConfig(cfg, configPath);

  console.log(`\n✅ Config updated: ${configPath}`);
  console.log(`   Added: ${result.addedCount} | Updated: ${result.updatedCount} | Removed: ${result.removedCount}`);
  console.log(`\n🎉 Next steps:`);
  console.log(`   1. Run: \x1b[1mopencode\x1b[0m (configured checkpoints will auto-sync)`);
  console.log(`   2. In OpenCode use: \x1b[1m/models\x1b[0m to select local/<model-name>`);
} catch (error) {
  console.error(`\n❌ Sync failed: ${error.message}`);
  console.log("\n🔧 Troubleshooting:");
  console.log("   • Check if your AI server is running");
  console.log("   • Verify the endpoint URL is correct");
  console.log("   • Test with: curl -s <YOUR-URL>/v1/models");
  process.exit(1);
}
