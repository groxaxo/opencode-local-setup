#!/bin/bash

# Sync all OpenAI-compatible providers from configuration

source ~/.bashrc

PROVIDERS=(
  "fireworks|https://api.fireworks.ai/inference/v1|FIREWORKS_API_KEY"
  "deepseek|https://api.deepseek.com/v1|DEEPSEEK_API_KEY"  
  "xai|https://api.x.ai/v1|XAI_API_KEY"
  "openai|https://api.openai.com/v1|OPENAI_API_KEY"
  "ollama|http://127.0.0.1:11434/v1|NO_KEY_NEEDED"
)

echo "🚀 Syncing all OpenAI-compatible providers..."
echo "================================================"

for provider in "${PROVIDERS[@]}"; do
  IFS='|' read -r name baseurl env_key <<< "$provider"
  
  if [[ "$env_key" == "NO_KEY_NEEDED" ]]; then
    api_key=""
  else
    api_key="${!env_key}"
  fi
  
  echo ""
  echo "🔍 Syncing $name..."
  echo "   URL: $baseurl"
  
  if [[ -n "$api_key" ]]; then
    echo "   Key: ✅ (${#api_key} chars)"
    output=$(LOCAL_API_BASE="$baseurl" OPENAI_API_KEY="$api_key" node scripts/sync-provider.mjs 2>&1)
  else
    echo "   Key: ❌ (no key)"
    output=$(LOCAL_API_BASE="$baseurl" node scripts/sync-provider.mjs 2>&1)
  fi
  
  if [[ $output == *"❌"* ]]; then
    echo "   ❌ Failed"
    echo "   Error: $(echo "$output" | grep "❌" | head -1)"
  else
    model_count=$(echo "$output" | grep "Found" | grep -o "[0-9]*" | head -1 || echo "0")
    echo "   ✅ Success: $model_count models"
  fi
done

echo ""
echo "✅ All providers synced!"
echo ""
echo "📊 Final configuration:"
cat ~/.config/opencode/opencode.json | jq '.provider | keys' 2>/dev/null | grep -v "null" || echo "Unable to read config"

echo ""
echo "🎉 Ready to use!"
echo "   Try: opencode -p <provider> -m <model>"
echo "   Or:  local <prompt>  (uses local provider)"
