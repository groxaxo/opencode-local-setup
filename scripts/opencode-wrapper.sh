#!/bin/bash

# OpenCode Wrapper Functions
# Source this file or add to ~/.bashrc

# Configuration
OPENCODE_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
SYNC_SCRIPT="$OPENCODE_CONFIG_DIR/sync-local-models.mjs"

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

# Convenience shortcuts for common providers/models
deepseek() {
  opencode -p fireworks -m deepseek-v3p2 "$@"
}

local() {
  local model="${1:-}"
  if [ -n "$model" ]; then
    opencode -p local -m "$model" "${@:2}"
  else
    opencode -p local "$@"
  fi
}

# Quick sync-and-launch for local models
lmstudio() {
  LOCAL_API_BASE="http://localhost:1234/v1" sync-models
  opencode -p local "$@"
}

ollama() {
  LOCAL_API_BASE="http://localhost:11434/v1" sync-models
  opencode -p local "$@"
}

vllm() {
  LOCAL_API_BASE="http://localhost:8000/v1" sync-models
  opencode -p local "$@"
}

# List available local models
list-local-models() {
  local api_base="${LOCAL_API_BASE:-http://localhost:1234/v1}"
  echo "Listing models from: $api_base"
  curl -s "$api_base/models" 2>&1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4
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

# Export functions for use in subshells
export -f opencode
export -f sync-models
export -f deepseek
export -f local
export -f lmstudio
export -f ollama
export -f vllm
export -f list-local-models
export -f code-config
export -f code-config-edit
