/**
 * OpenCode Provider Definitions
 * 
 * Comprehensive list of all providers supported by OpenCode, including
 * authentication methods, endpoints, and configuration.
 * 
 * Based on OpenCode auth analysis: https://opencode.ai/
 */

export const PROVIDERS = {
  // ============================================
  // OAuth 2.0 Providers (Device Flow / PKCE)
  // ============================================
  
  "github-copilot": {
    id: "github-copilot",
    name: "GitHub Copilot",
    authType: "oauth",
    authMethod: "device",
    apiBase: "https://api.githubcopilot.com",
    endpoints: {
      deviceCode: "https://github.com/login/device/code",
      accessToken: "https://github.com/login/oauth/access_token",
    },
    clientId: "Ov23li8tweQw6odWQebz",
    scope: "read:user",
    grantType: "urn:ietf:params:oauth:grant-type:device_code",
    envVars: ["GITHUB_COPILOT_TOKEN", "GITHUB_TOKEN"],
    npm: null, // Built-in plugin
    modelsEndpoint: null, // Uses custom API
    notes: "Requires GitHub Copilot subscription. Uses device code flow.",
  },

  "github-copilot-enterprise": {
    id: "github-copilot-enterprise",
    name: "GitHub Copilot Enterprise",
    authType: "oauth",
    authMethod: "device",
    apiBase: "https://copilot-api.{domain}",
    endpoints: {
      deviceCode: "https://{domain}/login/device/code",
      accessToken: "https://{domain}/login/oauth/access_token",
    },
    clientId: "Ov23li8tweQw6odWQebz",
    scope: "read:user",
    grantType: "urn:ietf:params:oauth:grant-type:device_code",
    envVars: ["GITHUB_COPILOT_TOKEN", "GITHUB_TOKEN"],
    npm: null, // Built-in plugin
    requiresEnterpriseUrl: true,
    notes: "Requires GitHub Enterprise with Copilot. Uses device code flow.",
  },

  "openai": {
    id: "openai",
    name: "OpenAI",
    authType: "multi", // Supports both OAuth and API key
    authMethods: [
      {
        type: "oauth",
        label: "ChatGPT Pro/Plus (browser)",
        method: "pkce",
        issuer: "https://auth.openai.com",
        endpoints: {
          authorize: "https://auth.openai.com/oauth/authorize",
          token: "https://auth.openai.com/oauth/token",
        },
        clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
        scope: "openid profile email offline_access",
        redirectPort: 1455,
      },
      {
        type: "oauth",
        label: "ChatGPT Pro/Plus (headless)",
        method: "device",
        issuer: "https://auth.openai.com",
        endpoints: {
          deviceCode: "https://auth.openai.com/api/accounts/deviceauth/usercode",
          deviceToken: "https://auth.openai.com/api/accounts/deviceauth/token",
          token: "https://auth.openai.com/oauth/token",
          deviceAuthPage: "https://auth.openai.com/codex/device",
        },
        clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
      },
      {
        type: "api",
        label: "API Key",
      },
    ],
    apiBase: "https://api.openai.com/v1",
    codexApi: "https://chatgpt.com/backend-api/codex/responses",
    envVars: ["OPENAI_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "Supports ChatGPT Plus/Pro OAuth or API key authentication.",
  },

  "anthropic": {
    id: "anthropic",
    name: "Anthropic (Claude)",
    authType: "multi", // Supports OAuth (Claude Max) and API key
    authMethods: [
      {
        type: "oauth",
        label: "Claude Max",
        plugin: "opencode-anthropic-auth@0.0.13",
      },
      {
        type: "api",
        label: "API Key",
      },
    ],
    apiBase: "https://api.anthropic.com/v1",
    envVars: ["ANTHROPIC_API_KEY"],
    npm: "@ai-sdk/anthropic",
    modelsEndpoint: null, // Anthropic doesn't have /models endpoint
    predefinedModels: [
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
    notes: "Supports Claude Max OAuth or API key. External plugin for OAuth.",
  },

  "gitlab": {
    id: "gitlab",
    name: "GitLab Duo",
    authType: "oauth",
    authMethod: "oauth",
    plugin: "@gitlab/opencode-gitlab-auth@1.3.2",
    envVars: ["GITLAB_TOKEN"],
    npm: null, // External plugin
    notes: "Uses external GitLab OAuth plugin.",
  },

  // ============================================
  // API Key Only Providers
  // ============================================

  "google": {
    id: "google",
    name: "Google (Gemini)",
    authType: "api",
    apiBase: "https://generativelanguage.googleapis.com/v1beta",
    envVars: ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
    npm: "@ai-sdk/google",
    modelsEndpoint: null, // Uses custom API format
    predefinedModels: [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
    ],
    notes: "Google AI Studio API key authentication.",
  },

  "openrouter": {
    id: "openrouter",
    name: "OpenRouter",
    authType: "api",
    apiBase: "https://openrouter.ai/api/v1",
    envVars: ["OPENROUTER_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "OpenRouter aggregates many AI models under one API.",
  },

  "vercel": {
    id: "vercel",
    name: "Vercel AI Gateway",
    authType: "api",
    apiBase: "https://api.vercel.ai/v1",
    envVars: ["VERCEL_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "Create API key at https://vercel.link/ai-gateway-token",
  },

  "fireworks": {
    id: "fireworks",
    name: "Fireworks AI",
    authType: "api",
    apiBase: "https://api.fireworks.ai/inference/v1",
    envVars: ["FIREWORKS_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "High-performance inference for open models.",
  },

  "deepseek": {
    id: "deepseek",
    name: "DeepSeek",
    authType: "api",
    apiBase: "https://api.deepseek.com/v1",
    envVars: ["DEEPSEEK_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "DeepSeek AI API.",
  },

  "xai": {
    id: "xai",
    name: "xAI (Grok)",
    authType: "api",
    apiBase: "https://api.x.ai/v1",
    envVars: ["XAI_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "xAI Grok models API.",
  },

  "cloudflare": {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    authType: "api",
    apiBase: "https://api.cloudflare.com/client/v4/accounts/{accountId}/ai",
    envVars: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: null,
    notes: "Requires CLOUDFLARE_GATEWAY_ID and CLOUDFLARE_ACCOUNT_ID.",
  },

  "cloudflare-ai-gateway": {
    id: "cloudflare-ai-gateway",
    name: "Cloudflare AI Gateway",
    authType: "api",
    apiBase: "https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}",
    envVars: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_GATEWAY_ID"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: null,
    notes: "Cloudflare AI Gateway proxy. Read more: https://opencode.ai/docs/providers/#cloudflare-ai-gateway",
  },

  "amazon-bedrock": {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    authType: "aws",
    authMethods: [
      {
        type: "bearer",
        label: "Bearer Token",
        envVars: ["AWS_BEARER_TOKEN_BEDROCK"],
      },
      {
        type: "aws-credentials",
        label: "AWS Credential Chain",
        envVars: ["AWS_PROFILE", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_WEB_IDENTITY_TOKEN_FILE"],
      },
    ],
    envVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
    npm: "@ai-sdk/amazon-bedrock",
    modelsEndpoint: null,
    notes: "Uses AWS credential chain: Bearer token > profile > access keys > IAM roles > EKS IRSA.",
  },

  "azure": {
    id: "azure",
    name: "Azure OpenAI",
    authType: "api",
    apiBase: "https://{resourceName}.openai.azure.com",
    envVars: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
    npm: "@ai-sdk/azure",
    modelsEndpoint: null,
    notes: "Azure OpenAI Service. Requires deployment name configuration.",
  },

  "groq": {
    id: "groq",
    name: "Groq",
    authType: "api",
    apiBase: "https://api.groq.com/openai/v1",
    envVars: ["GROQ_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "Ultra-fast inference with Groq LPU.",
  },

  "together": {
    id: "together",
    name: "Together AI",
    authType: "api",
    apiBase: "https://api.together.xyz/v1",
    envVars: ["TOGETHER_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "Together AI inference platform.",
  },

  "mistral": {
    id: "mistral",
    name: "Mistral AI",
    authType: "api",
    apiBase: "https://api.mistral.ai/v1",
    envVars: ["MISTRAL_API_KEY"],
    npm: "@ai-sdk/mistral",
    modelsEndpoint: "/v1/models",
    notes: "Mistral AI official API.",
  },

  "cohere": {
    id: "cohere",
    name: "Cohere",
    authType: "api",
    apiBase: "https://api.cohere.ai/v1",
    envVars: ["COHERE_API_KEY"],
    npm: "@ai-sdk/cohere",
    modelsEndpoint: null,
    predefinedModels: ["command-r-plus", "command-r", "command-light", "command"],
    notes: "Cohere AI for enterprise.",
  },

  "perplexity": {
    id: "perplexity",
    name: "Perplexity",
    authType: "api",
    apiBase: "https://api.perplexity.ai",
    envVars: ["PERPLEXITY_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: null,
    predefinedModels: ["llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-large-128k-online"],
    notes: "Perplexity AI search-augmented models.",
  },

  // ============================================
  // Local / Self-Hosted Providers
  // ============================================

  "ollama": {
    id: "ollama",
    name: "Ollama",
    authType: "none",
    apiBase: "http://localhost:11434/v1",
    envVars: [],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    isLocal: true,
    notes: "Local Ollama server. No authentication required.",
  },

  "lmstudio": {
    id: "lmstudio",
    name: "LM Studio",
    authType: "none",
    apiBase: "http://localhost:1234/v1",
    envVars: [],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    isLocal: true,
    notes: "Local LM Studio server. No authentication required.",
  },

  "vllm": {
    id: "vllm",
    name: "vLLM",
    authType: "none",
    apiBase: "http://localhost:8000/v1",
    envVars: [],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    isLocal: true,
    notes: "Local vLLM server. No authentication required.",
  },

  "local": {
    id: "local",
    name: "Local OpenAI-Compatible",
    authType: "optional",
    apiBase: null, // Configured via LOCAL_API_BASE
    envVars: ["LOCAL_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    isLocal: true,
    notes: "Generic local OpenAI-compatible endpoint.",
  },

  "alibaba": {
    id: "alibaba",
    name: "Alibaba DashScope",
    authType: "api",
    apiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    envVars: ["DASHSCOPE_API_KEY", "ALIBABA_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    modelsEndpoint: "/v1/models",
    notes: "Alibaba Cloud DashScope AI models (Qwen, etc.).",
  },
};

/**
 * Provider priority for display ordering (lower = higher priority)
 */
export const PROVIDER_PRIORITY = {
  "github-copilot": 0,
  anthropic: 1,
  openai: 2,
  google: 3,
  openrouter: 4,
  fireworks: 5,
  vercel: 6,
  deepseek: 7,
  xai: 8,
  groq: 9,
  together: 10,
  mistral: 11,
  gitlab: 12,
  "amazon-bedrock": 13,
  azure: 14,
  cloudflare: 15,
  cohere: 16,
  perplexity: 17,
  alibaba: 18,
  ollama: 50,
  lmstudio: 51,
  vllm: 52,
  local: 99,
};

/**
 * Built-in auth plugins bundled with OpenCode
 */
export const BUILTIN_PLUGINS = [
  "opencode-anthropic-auth@0.0.13",
  "@gitlab/opencode-gitlab-auth@1.3.2",
];

/**
 * Get provider by ID
 */
export function getProvider(id) {
  return PROVIDERS[id] || null;
}

/**
 * Get all providers sorted by priority
 */
export function getAllProviders() {
  return Object.values(PROVIDERS).sort((a, b) => {
    const priorityA = PROVIDER_PRIORITY[a.id] ?? 99;
    const priorityB = PROVIDER_PRIORITY[b.id] ?? 99;
    return priorityA - priorityB || a.name.localeCompare(b.name);
  });
}

/**
 * Get providers that support OpenAI-compatible /v1/models endpoint
 */
export function getOpenAICompatibleProviders() {
  return Object.values(PROVIDERS).filter(p => p.modelsEndpoint);
}

/**
 * Get providers that have API keys configured in environment
 */
export function getConfiguredProviders() {
  return Object.values(PROVIDERS).filter(provider => {
    if (provider.isLocal) return true;
    if (!provider.envVars || provider.envVars.length === 0) return true;
    return provider.envVars.some(envVar => process.env[envVar]);
  });
}

/**
 * Detect provider from base URL
 */
export function detectProviderFromUrl(url) {
  if (!url) return null;
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes("api.openai.com")) return PROVIDERS.openai;
  if (lowerUrl.includes("api.anthropic.com")) return PROVIDERS.anthropic;
  if (lowerUrl.includes("api.fireworks.ai")) return PROVIDERS.fireworks;
  if (lowerUrl.includes("api.x.ai")) return PROVIDERS.xai;
  if (lowerUrl.includes("api.deepseek.com")) return PROVIDERS.deepseek;
  if (lowerUrl.includes("api.groq.com")) return PROVIDERS.groq;
  if (lowerUrl.includes("api.together.xyz")) return PROVIDERS.together;
  if (lowerUrl.includes("api.mistral.ai")) return PROVIDERS.mistral;
  if (lowerUrl.includes("openrouter.ai")) return PROVIDERS.openrouter;
  if (lowerUrl.includes("api.perplexity.ai")) return PROVIDERS.perplexity;
  if (lowerUrl.includes("api.cohere.ai")) return PROVIDERS.cohere;
  if (lowerUrl.includes("generativelanguage.googleapis.com")) return PROVIDERS.google;
  if (lowerUrl.includes("openai.azure.com")) return PROVIDERS.azure;
  if (lowerUrl.includes("api.cloudflare.com")) return PROVIDERS.cloudflare;
  if (lowerUrl.includes("gateway.ai.cloudflare.com")) return PROVIDERS["cloudflare-ai-gateway"];
  if (lowerUrl.includes("api.vercel.ai")) return PROVIDERS.vercel;
  if (lowerUrl.includes("localhost:11434") || lowerUrl.includes("127.0.0.1:11434")) return PROVIDERS.ollama;
  if (lowerUrl.includes("localhost:1234") || lowerUrl.includes("127.0.0.1:1234")) return PROVIDERS.lmstudio;
  if (lowerUrl.includes("localhost:8000") || lowerUrl.includes("127.0.0.1:8000")) return PROVIDERS.vllm;
  if (lowerUrl.includes("githubcopilot.com")) return PROVIDERS["github-copilot"];
  if (lowerUrl.includes("dashscope")) return PROVIDERS.alibaba;
  
  // Default to generic local provider
  return PROVIDERS.local;
}

/**
 * Get API key for a provider from environment
 */
export function getApiKeyForProvider(provider) {
  if (!provider || !provider.envVars) return null;
  
  for (const envVar of provider.envVars) {
    if (process.env[envVar]) {
      return process.env[envVar];
    }
  }
  return null;
}

/**
 * Check if a provider requires authentication
 */
export function requiresAuth(provider) {
  if (!provider) return false;
  return provider.authType !== "none" && provider.authType !== "optional";
}

/**
 * Get credential storage information
 */
export const CREDENTIAL_STORAGE = {
  path: "~/.local/share/opencode/auth.json",
  permissions: 0o600,
  types: {
    oauth: {
      fields: ["refresh", "access", "expires", "accountId", "enterpriseUrl"],
    },
    api: {
      fields: ["key"],
    },
    wellknown: {
      fields: ["key", "token"],
    },
  },
};

export default PROVIDERS;
