#!/bin/bash

# OpenCode Wrapper Functions
# Source this file or add to ~/.bashrc

# Configuration
OPENCODE_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
SYNC_SCRIPT="$OPENCODE_CONFIG_DIR/sync-local-models.mjs"

# Ensure legacy local() shortcut does not override bash's local builtin
if declare -F local >/dev/null; then
  unset -f local
fi

# OpenCode wrapper - auto-syncs local models before launch
opencode() {
  if [ -f "$SYNC_SCRIPT" ]; then
    node "$SYNC_SCRIPT" >/dev/null 2>&1 || true
  fi
  command opencode "$@"
}

# Sync models manually
sync-models() {
  local api_base="$1"
  if [ -n "$api_base" ]; then
    LOCAL_API_BASE="$api_base" node "$SYNC_SCRIPT"
  else
    node "$SYNC_SCRIPT"
  fi
}

# Resolve provider/model for current OpenCode CLI (`-m provider/model`)
oc-provider() {
  local provider="$1"
  shift || true
  local model="${1:-}"
  if [ -n "$model" ] && [[ "$model" != -* ]]; then
    if [[ "$model" == */* ]]; then
      opencode -m "$model" "${@:2}"
    else
      opencode -m "$provider/$model" "${@:2}"
    fi
  else
    local default_model
    default_model="$(command opencode models "$provider" 2>/dev/null | head -n 1)"
    if [ -z "$default_model" ]; then
      echo "No models found for provider '$provider'. Run sync or pass a model: ${provider} <model>" >&2
      return 1
    fi
    opencode -m "$default_model" "$@"
  fi
}

# ============================================
# Provider Shortcuts
# ============================================

# Local provider shortcut
oc-local() {
  oc-provider local "$@"
}

# Quick sync-and-launch for local models
lmstudio() {
  LOCAL_API_BASE="http://localhost:1234/v1" sync-models
  oc-local "$@"
}

ollama() {
  LOCAL_API_BASE="http://localhost:11434/v1" sync-models
  oc-local "$@"
}

vllm() {
  LOCAL_API_BASE="http://localhost:8000/v1" sync-models
  oc-local "$@"
}

# Cloud provider shortcuts
deepseek() {
  opencode -m fireworks/accounts/fireworks/models/deepseek-v3p2 "$@"
}

fireworks() {
  oc-provider fireworks "$@"
}

groq() {
  oc-provider groq "$@"
}

together() {
  oc-provider together "$@"
}

mistral() {
  oc-provider mistral "$@"
}

xai() {
  oc-provider xai "$@"
}

openrouter() {
  oc-provider openrouter "$@"
}

perplexity() {
  oc-provider perplexity "$@"
}

# List available local models
list-local-models() {
  local api_base="${LOCAL_API_BASE:-http://localhost:1234/v1}"
  echo "Listing models from: $api_base"
  curl -s "$api_base/models" 2>&1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4
}

# List all synced providers
list-providers() {
  local config_file="${OPENCODE_CONFIG:-$OPENCODE_CONFIG_DIR/opencode.json}"
  if [ -f "$config_file" ]; then
    echo "📦 Configured Providers:"
    if command -v jq &> /dev/null; then
      jq -r '.provider | to_entries[] | "   • \(.key): \(.value.name // .key)"' "$config_file" 2>/dev/null
    else
      grep -o '"[^"]*":' "$config_file" | head -20 | tr -d '":' | sed 's/^/   • /'
    fi
  else
    echo "Config not found: $config_file"
    return 1
  fi
}

# Show OpenCode config
code-config() {
  local config_file="${OPENCODE_CONFIG:-$OPENCODE_CONFIG_DIR/opencode.json}"
  if [ -f "$config_file" ]; then
    cat "$config_file"
  else
    echo "Config not found: $config_file"
    return 1
  fi
}

# Edit OpenCode config
code-config-edit() {
  local editor="${EDITOR:-nano}"
  local config_file="${OPENCODE_CONFIG:-$OPENCODE_CONFIG_DIR/opencode.json}"
  if [ -f "$config_file" ]; then
    "$editor" "$config_file"
  else
    echo "Config not found: $config_file"
    return 1
  fi
}

# Quick auth login
code-login() {
  command opencode auth login
}

# List authenticated providers
code-auth() {
  command opencode auth list
}

# Export functions for use in subshells
export -f opencode
export -f sync-models
export -f oc-provider
export -f oc-local
export -f lmstudio
export -f ollama
export -f vllm
export -f deepseek
export -f fireworks
export -f groq
export -f together
export -f mistral
export -f xai
export -f openrouter
export -f perplexity
export -f list-local-models
export -f list-providers
export -f code-config
export -f code-config-edit
export -f code-login
export -f code-auth
