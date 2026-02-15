#!/bin/bash

# Sync all OpenCode providers automatically
# Supports all providers defined in OpenCode including OAuth and API-key based providers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source bashrc if it exists for environment variables
if [ -f ~/.bashrc ]; then
  source ~/.bashrc 2>/dev/null || true
fi

# ============================================
# Provider Definitions
# Format: "name|baseurl|env_key"
# Use NO_KEY_NEEDED for local providers
# ============================================

PROVIDERS=(
  # Cloud API Providers (API Key)
  "openai|https://api.openai.com/v1|OPENAI_API_KEY"
  "fireworks|https://api.fireworks.ai/inference/v1|FIREWORKS_API_KEY"
  "deepseek|https://api.deepseek.com/v1|DEEPSEEK_API_KEY"
  "xai|https://api.x.ai/v1|XAI_API_KEY"
  "groq|https://api.groq.com/openai/v1|GROQ_API_KEY"
  "together|https://api.together.xyz/v1|TOGETHER_API_KEY"
  "mistral|https://api.mistral.ai/v1|MISTRAL_API_KEY"
  "openrouter|https://openrouter.ai/api/v1|OPENROUTER_API_KEY"
  "perplexity|https://api.perplexity.ai|PERPLEXITY_API_KEY"
  
  # Local Providers (No API Key)
  "ollama|http://127.0.0.1:11434/v1|NO_KEY_NEEDED"
  "lmstudio|http://127.0.0.1:1234/v1|NO_KEY_NEEDED"
  "vllm|http://127.0.0.1:8000/v1|NO_KEY_NEEDED"
)

# OAuth providers that require special auth flow (via `opencode auth login`)
OAUTH_PROVIDERS=(
  "github-copilot|GitHub Copilot|opencode auth login"
  "anthropic|Anthropic Claude|opencode auth login"
  "gitlab|GitLab Duo|opencode auth login"
)

echo "🚀 OpenCode Provider Auto-Detection & Sync"
echo "==========================================="
echo ""

# Count available providers
available_count=0
synced_count=0
failed_count=0
skipped_count=0

# Check for OAuth providers first
echo "📋 Checking OAuth Providers..."
echo "   These providers require 'opencode auth login' for authentication:"
echo ""

for oauth_provider in "${OAUTH_PROVIDERS[@]}"; do
  IFS='|' read -r name display_name auth_cmd <<< "$oauth_provider"
  echo "   • $display_name ($name)"
  echo "     Auth: $auth_cmd"
done

echo ""
echo "📋 Syncing API-Compatible Providers..."
echo "==========================================="

for provider in "${PROVIDERS[@]}"; do
  IFS='|' read -r name baseurl env_key <<< "$provider"
  
  echo ""
  echo "🔍 Provider: $name"
  echo "   URL: $baseurl"
  
  # Check if API key is needed and available
  if [[ "$env_key" == "NO_KEY_NEEDED" ]]; then
    api_key=""
    echo "   Key: Not required (local)"
    
    # For local providers, check if server is reachable
    if ! curl -s --connect-timeout 2 "$baseurl/models" >/dev/null 2>&1; then
      echo "   ⏭️  Skipped (server not running)"
      ((skipped_count++))
      continue
    fi
  else
    api_key="${!env_key}"
    if [[ -z "$api_key" ]]; then
      echo "   Key: ❌ Not configured ($env_key)"
      echo "   ⏭️  Skipped (no API key)"
      ((skipped_count++))
      continue
    fi
    echo "   Key: ✅ Found (${#api_key} chars)"
  fi
  
  ((available_count++))
  
  # Run sync
  if [[ -n "$api_key" ]]; then
    output=$(LOCAL_API_BASE="$baseurl" node "$SCRIPT_DIR/sync-provider.mjs" 2>&1)
  else
    output=$(LOCAL_API_BASE="$baseurl" node "$SCRIPT_DIR/sync-provider.mjs" 2>&1)
  fi
  
  exit_code=$?
  
  if [[ $exit_code -eq 0 ]] && [[ $output != *"❌"* ]]; then
    model_count=$(echo "$output" | grep -oP "Found \K[0-9]+" | head -1 || echo "0")
    echo "   ✅ Synced: $model_count models"
    ((synced_count++))
  else
    error_msg=$(echo "$output" | grep "❌" | head -1 || echo "Unknown error")
    echo "   ❌ Failed: $error_msg"
    ((failed_count++))
  fi
done

echo ""
echo "==========================================="
echo "📊 Summary"
echo "==========================================="
echo "   ✅ Synced:  $synced_count providers"
echo "   ⏭️  Skipped: $skipped_count providers"
echo "   ❌ Failed:  $failed_count providers"
echo ""

# Show final configuration
CONFIG_FILE="${OPENCODE_CONFIG:-$HOME/.config/opencode/opencode.json}"
if [ -f "$CONFIG_FILE" ]; then
  echo "📄 Active Providers:"
  if command -v jq &> /dev/null; then
    jq -r '.provider | keys[]' "$CONFIG_FILE" 2>/dev/null | sed 's/^/   • /'
  else
    echo "   (install jq to see provider list)"
  fi
else
  echo "   ⚠️  No config file found at $CONFIG_FILE"
fi

echo ""
echo "🎉 Sync complete!"
echo ""
echo "📖 Usage:"
echo "   Try: opencode -m <provider>/<model>"
echo "   Or:  oc-local <prompt>  (uses local provider)"
echo "   opencode auth login                   # Authenticate OAuth providers"
echo "   opencode auth list                    # View authenticated providers"
echo ""
echo "🔐 OAuth Providers (GitHub Copilot, Claude, GitLab):"
echo "   Run: opencode auth login"
echo ""
