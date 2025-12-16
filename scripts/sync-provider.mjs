import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Configure your API endpoint via environment variable
const baseURL = process.env.LOCAL_API_BASE?.replace(/\/$/, "") ?? "http://127.0.0.1:1234/v1";

// Get the specific API key for this endpoint
let apiKey = process.env.FIREWORKS_API_KEY;
if (baseURL.includes('openai.com')) {
  apiKey = process.env.OPENAI_API_KEY;
} else if (baseURL.includes('x.ai')) {
  apiKey = process.env.XAI_API_KEY;
} else if (baseURL.includes('deepseek.com')) {
  apiKey = process.env.DEEPSEEK_API_KEY;
} else if (baseURL.includes('fireworks.ai')) {
  apiKey = process.env.FIREWORKS_API_KEY;
} else if (baseURL.includes('dashscope')) {
  apiKey = process.env.OLLAMA_API_KEY;
}

const configPath = process.env.OPENCODE_CONFIG 
  ?? path.join(
      process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"),
      "opencode",
      "opencode.json"
    );

const modelsURL = `${baseURL}/models`;

console.log(`🔄 Syncing models from: ${baseURL}`);
if (apiKey) {
  console.log(`🔑 Using API key (length: ${apiKey.length})`);
}

try {
  const headers = {};
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  const res = await fetch(modelsURL, { headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GET ${modelsURL} failed: ${res.status} ${errorText}`);
  }

  const body = await res.json();
  const ids = (body?.data ?? []).map((m) => m?.id).filter(Boolean);

  if (ids.length === 0) {
    console.log(`⚠️  No models found at ${modelsURL}`);
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
      console.error("❌ Error reading config:", err.message);
      process.exit(1);
    }
  }

  cfg.$schema ??= "https://opencode.ai/config.json";
  cfg.provider ??= {};
  
  // Auto-detect provider name
  let providerName = 'local';
  let displayName = 'Local Provider';
  
  if (baseURL.includes('fireworks.ai')) {
    providerName = 'fireworks';
    displayName = 'Fireworks AI';
  } else if (baseURL.includes('openai.com')) {
    providerName = 'openai';
    displayName = 'OpenAI';
  } else if (baseURL.includes('deepseek.com')) {
    providerName = 'deepseek';
    displayName = 'DeepSeek';
  } else if (baseURL.includes('x.ai')) {
    providerName = 'xai';
    displayName = 'xAI (Grok)';
  } else if (baseURL.includes('anthropic')) {
    providerName = 'anthropic';
    displayName = 'Anthropic';
  } else if (baseURL.includes('dashscope')) {
    providerName = 'alibaba';
    displayName = 'Alibaba DashScope';
  }
  
  console.log(`📊 Provider: ${displayName} (${providerName})`);
  console.log(`   ${baseURL}`)

  cfg.provider[providerName] ??= {
    npm: "@ai-sdk/openai-compatible",
    name: displayName,
    options: { baseURL },
    models: {}
  };

  cfg.provider[providerName].options ??= {};
  cfg.provider[providerName].options.baseURL = baseURL;
  
  // Add API key to config if present
  if (apiKey) {
    cfg.provider[providerName].options.headers = {
      Authorization: `Bearer ${apiKey}`
    };
  }
  
  cfg.provider[providerName].models ??= {};

  let addedCount = 0;
  let updatedCount = 0;

  for (const id of ids) {
    const wasNew = !cfg.provider[providerName].models[id];
    cfg.provider[providerName].models[id] ??= {};
    cfg.provider[providerName].models[id].name ??= id;
    
    // Try to detect tool support
    const supportsTools = !id.toLowerCase().includes('embedding') && 
                          !id.toLowerCase().includes('reranker') &&
                          !(id.toLowerCase().includes('anthropic') && id.toLowerCase().includes('claude'));
    cfg.provider[providerName].models[id].tools ??= supportsTools;
    
    if (wasNew) {
      addedCount++;
    } else {
      updatedCount++;
    }
  }

  const serverModelIds = new Set(ids);
  let removedCount = 0;
  
  for (const modelId in cfg.provider[providerName].models) {
    if (!serverModelIds.has(modelId)) {
      delete cfg.provider[providerName].models[modelId];
      removedCount++;
    }
  }

  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");

  console.log(`\n✅ Config updated: ${configPath}`);
  console.log(`   Added: ${addedCount} | Updated: ${updatedCount} | Removed: ${removedCount}`);
  console.log(`\n🎉 Provider "${providerName}" now has ${ids.length} models`);

} catch (error) {
  console.error(`\n❌ Sync failed: ${error.message}`);
  process.exit(1);
}
