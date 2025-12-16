import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Configure your API endpoint via environment variable or default
const baseURL = process.env.LOCAL_API_BASE?.replace(/\/$/, "") ?? "http://127.0.0.1:1234/v1";

// Configure config path via environment variable or default XDG location
const configPath = process.env.OPENCODE_CONFIG 
  ?? path.join(
      process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"),
      "opencode",
      "opencode.json"
    );

// Fetch models from OpenAI-compatible endpoint
const modelsURL = `${baseURL}/models`;

console.log(`🔄 Syncing models from: ${baseURL}`);

try {
  const res = await fetch(modelsURL);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GET ${modelsURL} failed: ${res.status} ${errorText}`);
  }

  const body = await res.json();
  const ids = (body?.data ?? []).map((m) => m?.id).filter(Boolean);

  if (ids.length === 0) {
    console.log(`⚠️  No models found at ${modelsURL}`);
    console.log("   Make sure your AI server is running and accessible");
    process.exit(0);
  }

  console.log(`✅ Found ${ids.length} models`);

  let cfg = {
    $schema: "https://opencode.ai/config.json",
    provider: {}
  };

  try {
    const fileContent = await fs.readFile(configPath, "utf8");
    cfg = JSON.parse(fileContent);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error("❌ Error reading config (might contain JSON comments? Use strict JSON):", err.message);
      process.exit(1);
    }
    console.log(`📄 Creating new config at: ${configPath}`);
  }

  // Ensure schema and provider structure
  cfg.$schema ??= "https://opencode.ai/config.json";
  cfg.provider ??= {};
  cfg.provider.local ??= {
    npm: "@ai-sdk/openai-compatible",
    name: `Local (${new URL(baseURL).hostname})`,
    options: { baseURL },
    models: {}
  };

  // Update base URL if changed
  cfg.provider.local.options ??= {};
  cfg.provider.local.options.baseURL = baseURL;
  cfg.provider.local.models ??= {};

  // Add/update models
  let addedCount = 0;
  let updatedCount = 0;

  for (const id of ids) {
    const wasNew = !cfg.provider.local.models[id];
    cfg.provider.local.models[id] ??= {};
    cfg.provider.local.models[id].name ??= id;
    cfg.provider.local.models[id].tools ??= true;
    
    if (wasNew) {
      addedCount++;
    } else {
      updatedCount++;
    }
  }

  // Remove models that no longer exist on the server
  const serverModelIds = new Set(ids);
  let removedCount = 0;
  
  for (const modelId in cfg.provider.local.models) {
    if (!serverModelIds.has(modelId)) {
      delete cfg.provider.local.models[modelId];
      removedCount++;
    }
  }

  // Write config
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");

  console.log(`\n✅ Config updated: ${configPath}`);
  console.log(`   Added: ${addedCount} | Updated: ${updatedCount} | Removed: ${removedCount}`);
  console.log(`\n🎉 Next steps:`);
  console.log(`   1. Run: \x1b[1mopencode\x1b[0m (models will auto-sync)`);
  console.log(`   2. In OpenCode use: \x1b[1m/models\x1b[0m to select local/<model-name>`);

} catch (error) {
  console.error(`\n❌ Sync failed: ${error.message}`);
  console.log("\n🔧 Troubleshooting:");
  console.log("   • Check if your AI server is running");
  console.log("   • Verify the endpoint URL is correct");
  console.log("   • Test with: curl -s <YOUR-URL>/v1/models");
  process.exit(1);
}
