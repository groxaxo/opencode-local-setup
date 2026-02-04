# OpenCode Authentication Providers Reference

This document provides detailed information about authentication methods for all providers supported by OpenCode.

## Table of Contents

1. [Overview](#overview)
2. [OAuth 2.0 Providers](#oauth-20-providers)
   - [GitHub Copilot](#github-copilot)
   - [OpenAI/ChatGPT](#openaichatgpt)
   - [Anthropic (Claude)](#anthropic-claude)
   - [GitLab Duo](#gitlab-duo)
3. [API Key Providers](#api-key-providers)
4. [Local Providers](#local-providers)
5. [Credential Storage](#credential-storage)

---

## Overview

OpenCode supports multiple authentication methods:

| Method | Description | Use Case |
|--------|-------------|----------|
| **OAuth 2.0** | Browser-based or device code flow | GitHub Copilot, ChatGPT Plus, Claude Max |
| **API Key** | Static key in environment variable | Most cloud providers |
| **Well-Known** | Custom `.well-known/opencode` endpoint | Self-hosted/enterprise |
| **None** | No authentication required | Local servers (Ollama, LM Studio) |

---

## OAuth 2.0 Providers

### GitHub Copilot

**Provider ID**: `github-copilot`  
**Auth Type**: OAuth 2.0 (Device Flow)  
**Subscription Required**: GitHub Copilot Individual/Business/Enterprise

#### Authentication Flow

1. Run: `opencode auth login`
2. Select "GitHub Copilot"
3. Open the verification URL in browser
4. Enter the device code displayed in terminal
5. Authorize the application
6. Terminal completes automatically

#### Technical Details

| Parameter | Value |
|-----------|-------|
| Device Code URL | `https://github.com/login/device/code` |
| Token URL | `https://github.com/login/oauth/access_token` |
| Client ID | `Ov23li8tweQw6odWQebz` |
| Scope | `read:user` |
| Grant Type | `urn:ietf:params:oauth:grant-type:device_code` |

#### Enterprise Configuration

For GitHub Enterprise:
- Device Code: `https://{your-domain}/login/device/code`
- Token URL: `https://{your-domain}/login/oauth/access_token`
- API Base: `https://copilot-api.{your-domain}`

---

### OpenAI/ChatGPT

**Provider ID**: `openai`  
**Auth Types**: OAuth 2.0 (PKCE or Device) / API Key

OpenAI supports three authentication methods:

#### Method 1: ChatGPT Browser Flow (PKCE)

Best for users with ChatGPT Plus/Pro subscription.

1. Run: `opencode auth login`
2. Select "OpenAI" → "ChatGPT Pro/Plus (browser)"
3. Browser opens automatically
4. Complete sign-in at auth.openai.com
5. Window closes automatically on success

**Technical Details:**

| Parameter | Value |
|-----------|-------|
| Issuer | `https://auth.openai.com` |
| Authorization URL | `https://auth.openai.com/oauth/authorize` |
| Token URL | `https://auth.openai.com/oauth/token` |
| Client ID | `app_EMoamEEZ73f0CkXaXp7hrann` |
| Scope | `openid profile email offline_access` |
| PKCE Method | S256 |
| Redirect Port | 1455 |

#### Method 2: ChatGPT Headless Flow

For environments without browser access.

1. Run: `opencode auth login`
2. Select "OpenAI" → "ChatGPT Pro/Plus (headless)"
3. Open `https://auth.openai.com/codex/device` in any browser
4. Enter the displayed code
5. Terminal completes automatically

**Technical Details:**

| Parameter | Value |
|-----------|-------|
| Device Code URL | `https://auth.openai.com/api/accounts/deviceauth/usercode` |
| Device Token URL | `https://auth.openai.com/api/accounts/deviceauth/token` |
| Device Auth Page | `https://auth.openai.com/codex/device` |

#### Method 3: API Key

For programmatic access with an API key.

```bash
export OPENAI_API_KEY="sk-..."
./scripts/sync-all-providers.sh
```

---

### Anthropic (Claude)

**Provider ID**: `anthropic`  
**Auth Types**: OAuth 2.0 / API Key

#### Method 1: Claude Max (OAuth)

For Claude Max subscribers:

1. Run: `opencode auth login`
2. Select "Anthropic"
3. Complete browser-based OAuth flow
4. Authorization stores tokens automatically

**Note:** Uses external plugin `opencode-anthropic-auth@0.0.13`.

#### Method 2: API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Available Models:**
- claude-sonnet-4-20250514
- claude-3-7-sonnet-20250219
- claude-3-5-sonnet-20241022
- claude-3-5-haiku-20241022
- claude-3-opus-20240229
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

---

### GitLab Duo

**Provider ID**: `gitlab`  
**Auth Type**: OAuth 2.0

**Requirements:**
- GitLab Premium or Ultimate subscription
- GitLab Duo feature enabled

#### Authentication Flow

1. Run: `opencode auth login`
2. Select "GitLab"
3. Complete GitLab OAuth authorization
4. Tokens stored automatically

**Note:** Uses external plugin `@gitlab/opencode-gitlab-auth@1.3.2`.

---

## API Key Providers

These providers use simple API key authentication.

### Configuration

Set environment variables before syncing:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Fireworks AI
export FIREWORKS_API_KEY="fw_..."

# DeepSeek
export DEEPSEEK_API_KEY="sk-..."

# xAI (Grok)
export XAI_API_KEY="xai-..."

# Groq
export GROQ_API_KEY="gsk_..."

# Together AI
export TOGETHER_API_KEY="..."

# Mistral AI
export MISTRAL_API_KEY="..."

# OpenRouter
export OPENROUTER_API_KEY="sk-or-..."

# Perplexity
export PERPLEXITY_API_KEY="pplx-..."

# Google/Gemini
export GOOGLE_API_KEY="..."
# or
export GEMINI_API_KEY="..."

# Cohere
export COHERE_API_KEY="..."

# Vercel AI Gateway
export VERCEL_API_KEY="..."

# Cloudflare
export CLOUDFLARE_API_TOKEN="..."
export CLOUDFLARE_ACCOUNT_ID="..."
export CLOUDFLARE_GATEWAY_ID="..."  # For AI Gateway

# Azure OpenAI
export AZURE_OPENAI_API_KEY="..."
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
```

### Provider Endpoints

| Provider | API Base URL | Models Endpoint |
|----------|--------------|-----------------|
| OpenAI | `https://api.openai.com/v1` | `/v1/models` |
| Fireworks | `https://api.fireworks.ai/inference/v1` | `/v1/models` |
| DeepSeek | `https://api.deepseek.com/v1` | `/v1/models` |
| xAI | `https://api.x.ai/v1` | `/v1/models` |
| Groq | `https://api.groq.com/openai/v1` | `/v1/models` |
| Together | `https://api.together.xyz/v1` | `/v1/models` |
| Mistral | `https://api.mistral.ai/v1` | `/v1/models` |
| OpenRouter | `https://openrouter.ai/api/v1` | `/v1/models` |
| Perplexity | `https://api.perplexity.ai` | N/A |

---

## Local Providers

Local providers typically require no authentication.

### Ollama

```bash
# Default endpoint
export LOCAL_API_BASE="http://localhost:11434/v1"

# Start Ollama
ollama serve

# Sync models
./scripts/sync-all-providers.sh
```

### LM Studio

```bash
# Default endpoint
export LOCAL_API_BASE="http://localhost:1234/v1"

# Enable Local Server in LM Studio GUI
# Then sync
./scripts/sync-all-providers.sh
```

### vLLM

```bash
# Default endpoint
export LOCAL_API_BASE="http://localhost:8000/v1"

# Start vLLM
vllm serve meta-llama/Meta-Llama-3.1-8B-Instruct

# Sync models
./scripts/sync-all-providers.sh
```

---

## Credential Storage

### Location

OpenCode stores credentials in:
```
~/.local/share/opencode/auth.json
```

**File Permissions:** `0o600` (read/write for owner only)

### Credential Types

#### OAuth Credentials
```json
{
  "provider-id": {
    "type": "oauth",
    "refresh": "refresh_token_here",
    "access": "access_token_here",
    "expires": 1234567890000,
    "accountId": "optional_account_id",
    "enterpriseUrl": "optional_enterprise_url"
  }
}
```

#### API Key Credentials
```json
{
  "provider-id": {
    "type": "api",
    "key": "sk-..."
  }
}
```

#### Well-Known Credentials
```json
{
  "custom-url": {
    "type": "wellknown",
    "key": "ENV_VAR_NAME",
    "token": "token_value"
  }
}
```

### Managing Credentials

```bash
# List all authenticated providers
opencode auth list

# Login to a provider
opencode auth login

# Logout from a provider
opencode auth logout

# Check environment variables
opencode auth list  # Shows env var status
```

---

## Well-Known Provider Support

For self-hosted or custom providers, OpenCode supports `.well-known/opencode` endpoint:

```bash
# Authenticate with a custom provider
opencode auth login --url https://your-provider.com
```

The provider must expose:
```
GET https://your-provider.com/.well-known/opencode
```

Response format:
```json
{
  "auth": {
    "command": ["some-auth-command", "arg1"],
    "env": "YOUR_TOKEN_ENV_VAR"
  }
}
```

---

## Troubleshooting

### OAuth Issues

**Problem:** Browser doesn't open automatically

**Solution:**
1. Use headless device flow if available
2. Manually open the URL shown in terminal
3. Check if `xdg-open` or `open` command works

**Problem:** "Authorization pending" timeout

**Solution:**
1. Complete authorization within 15 minutes
2. Check network connectivity
3. Try again with fresh device code

### API Key Issues

**Problem:** "Unauthorized" or "Invalid API key"

**Solution:**
1. Verify key is correctly set: `echo $OPENAI_API_KEY`
2. Check key hasn't expired
3. Verify key has required permissions

**Problem:** Provider not syncing

**Solution:**
1. Check endpoint is reachable: `curl https://api.provider.com/v1/models`
2. Verify environment variable name matches provider
3. Run sync with verbose output to see errors

### Local Provider Issues

**Problem:** "Connection refused"

**Solution:**
1. Ensure server is running
2. Check correct port is used
3. Verify firewall allows connection
4. Test with: `curl http://localhost:PORT/v1/models`
