#!/bin/bash

# OpenCode Local AI Setup Script
# This script sets up automatic model syncing for OpenCode with local AI providers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
SYNC_SCRIPT="${CONFIG_DIR}/sync-local-models.mjs"
LAUNCH_SYNC_SCRIPT="${CONFIG_DIR}/sync-on-launch.mjs"

echo "🚀 OpenCode Local AI Provider Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version (needs 18+ for fetch)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check if OpenCode is installed
if ! command -v opencode &> /dev/null; then
    echo "⚠️  OpenCode not found in PATH"
    echo "   Install from: https://opencode.ai/"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ OpenCode found: $(which opencode)"
fi

# Create config directory
echo "📁 Creating config directory: $CONFIG_DIR"
mkdir -p "$CONFIG_DIR"

# Copy sync scripts
echo "📄 Installing sync scripts..."
echo "# For any OpenAI-compatible API endpoint" > "${CONFIG_DIR}/.env.local"
echo "# Examples:" >> "${CONFIG_DIR}/.env.local"
echo "# LOCAL_API_BASE=http://localhost:1234/v1  # LM Studio" >> "${CONFIG_DIR}/.env.local"  
echo "# LOCAL_API_BASE=http://localhost:11434/v1  # Ollama" >> "${CONFIG_DIR}/.env.local"
echo "# LOCAL_API_BASE=http://localhost:8000/v1   # vLLM" >> "${CONFIG_DIR}/.env.local"
echo "" >> "${CONFIG_DIR}/.env.local"
echo "LOCAL_API_BASE=http://localhost:1234/v1" >> "${CONFIG_DIR}/.env.local"

for script_name in providers.mjs sync-core.mjs sync-provider.mjs sync-local-models.mjs sync-on-launch.mjs; do
    cp "${REPO_DIR}/scripts/${script_name}" "${CONFIG_DIR}/${script_name}"
    chmod +x "${CONFIG_DIR}/${script_name}"
done

# Install shell wrapper script
WRAPPER_SCRIPT="${CONFIG_DIR}/opencode-functions.sh"
cp "${REPO_DIR}/scripts/opencode-wrapper.sh" "$WRAPPER_SCRIPT"
chmod +x "$WRAPPER_SCRIPT"

# Create basic config if it doesn't exist
if [ ! -f "${CONFIG_DIR}/opencode.json" ]; then
    echo "📄 Creating base config..."
    cat > "${CONFIG_DIR}/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Local AI Provider",
      "options": {
        "baseURL": "http://localhost:1234/v1"
      },
      "models": {}
    }
  }
}
EOF
fi

# Add bash wrapper source block to ~/.bashrc
BASHRC="$HOME/.bashrc"
if [ -f "$BASHRC" ]; then
    START_MARKER="# >>> opencode-local-setup >>>"
    END_MARKER="# <<< opencode-local-setup <<<"

    # Remove legacy shortcut that overrides bash's local builtin
    sed -i '/^local() {/,/^}$/d' "$BASHRC"

    # Replace previously managed block
    sed -i "/^${START_MARKER}$/,/^${END_MARKER}$/d" "$BASHRC"

    echo "📄 Adding wrapper source block to $BASHRC..."
    cat >> "$BASHRC" << EOF

$START_MARKER
if [ -f "$WRAPPER_SCRIPT" ]; then
  source "$WRAPPER_SCRIPT"
fi
$END_MARKER
EOF
fi

# Test the setup
echo ""
echo "🔍 Testing setup..."
if [ -f "${CONFIG_DIR}/.env.local" ]; then
    source "${CONFIG_DIR}/.env.local"
fi

if node "$LAUNCH_SYNC_SCRIPT" 2>/dev/null; then
    echo "✅ Setup successful!"
else
    echo "⚠️  Setup complete, but initial sync failed (server might not be running)"
fi

# Final instructions
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit: $CONFIG_DIR/.env.local"
echo "      Set LOCAL_API_BASE to your AI server URL"
echo ""
echo "   2. Sync models manually (optional):"
echo "      node $LAUNCH_SYNC_SCRIPT"
echo ""
echo "   3. Run OpenCode with auto-sync (syncs on launch and exit):"
echo "      opencode"
echo ""
echo "   4. In OpenCode, use /models to see your local models"
echo ""
echo "   5. Use shortcuts:"
echo "      oc-local <prompt> # Use local provider"
echo "      deepseek <prompt> # Use Fireworks DeepSeek"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Check docs/troubleshooting.md"
echo "   - Ensure your AI server is running:"
echo "     curl \$LOCAL_API_BASE/v1/models"
echo ""
