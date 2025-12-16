# OpenCode Local AI Provider Setup

This repository provides a complete solution for integrating local and cloud AI providers with [OpenCode](https://opencode.ai/), the terminal-based AI coding agent. Automatically sync models from **any OpenAI-compatible API endpoint** including LM Studio, vLLM, Ollama, OpenAI, Fireworks AI, xAI, DeepSeek, and more.

## 🚀 Features

- **🔌 Universal Provider Support**: Works with **any OpenAI-compatible API endpoint**
- **🔄 Automatic Model Discovery**: Syncs models from local/cloud servers automatically
- **⚡ Auto-Sync on Launch**: Models refresh every time you start OpenCode
- **📦 Multi-Provider Management**: Configure and use multiple providers simultaneously
- **🎯 Smart Model Detection**: Auto-detects tool capabilities and model types
- **🔐 Secure**: API keys stay in your environment, never in config files
- **🛠️ Bash Shortcuts**: Convenient shell functions for common providers

## 📊 Supported Providers

| Provider | Endpoint | Models | Status |
|----------|----------|--------|--------|
| **OpenAI** | `https://api.openai.com/v1` | GPT-4, GPT-3.5, etc | ✅ |
| **Fireworks AI** | `https://api.fireworks.ai/inference/v1` | DeepSeek, Llama, etc | ✅ |
| **xAI (Grok)** | `https://api.x.ai/v1` | Grok-2, Grok-Beta | ✅ |
| **DeepSeek** | `https://api.deepseek.com/v1` | DeepSeek-Chat, DeepSeek-Coder | ✅ |
| **LM Studio** | `http://localhost:1234/v1` | Any loaded GGUF | ✅ |
| **vLLM** | `http://localhost:8000/v1` | Any served model | ✅ |
| **Ollama** | `http://localhost:11434/v1` | Local models | ✅ |

## ⚡ Quick Start

```bash
# Clone and install
git clone https://github.com/groxaxo/opencode-local-setup.git
cd opencode-local-setup
./scripts/install.sh

# Sync all your providers (reads API keys from environment)
./scripts/sync-all-providers.sh

# Launch OpenCode with auto-sync
opencode
```

### Alternative: Manual Setup

```bash
# Install
./scripts/install.sh

# Sync a single provider
export LOCAL_API_BASE="https://api.openai.com/v1"
export OPENAI_API_KEY="your-key-here"
node scripts/sync-provider.mjs

# Use it
opencode -p openai -m gpt-4o
```

## 🔧 Configuration

### Environment Variables

Set these in your `~/.bashrc` or export them before running sync:

```bash
# Your OpenAI-compatible API endpoint
export LOCAL_API_BASE="http://localhost:1234/v1"  # Default: LM Studio

# Provider API keys (optional, used for cloud providers)
export OPENAI_API_KEY="sk-..."           # For OpenAI
export FIREWORKS_API_KEY="fw_..."         # For Fireworks AI  
export XAI_API_KEY="xai-..."              # For xAI/Grok
export DEEPSEEK_API_KEY="sk-..."          # For DeepSeek

# Config path (optional)
export OPENCODE_CONFIG="/path/to/config.json"

# Custom config directory (optional)
export XDG_CONFIG_HOME="/home/user/my-configs"
```

### Configuration Files

OpenCode uses JSON configuration files. Place them in:

1. **Global config**: `~/.config/opencode/opencode.json` (default)
2. **Per-project config**: `./opencode.json` in your project root
3. **Custom path**: Set `OPENCODE_CONFIG=/path/to/config.json`

### Sample Multi-Provider Config

After syncing multiple providers, your config will look like:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenAI",
      "options": {
        "baseURL": "https://api.openai.com/v1",
        "headers": { "Authorization": "Bearer sk-..." }
      },
      "models": {
        "gpt-4o": { "name": "GPT-4o", "tools": true },
        "gpt-3.5-turbo": { "name": "GPT-3.5 Turbo", "tools": true }
      }
    },
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama Local",
      "options": { "baseURL": "http://localhost:11434/v1" },
      "models": {
        "llama3.1:8b": { "name": "Llama 3.1 8B", "tools": false },
        "qwen3:latest": { "name": "Qwen3", "tools": true }
      }
    }
  }
}
```

## 📁 Directory Structure

```
opencode-local-setup/
├── README.md                          # This file
├── scripts/
│   ├── sync-provider.mjs             # Universal provider sync script
│   ├── sync-all-providers.sh         # Sync all providers at once
│   ├── install.sh                     # Automated installation
│   └── opencode-wrapper.sh           # Shell wrapper functions
├── configs/
│   ├── opencode.json.example          # Basic local setup
│   ├── opencode-fireworks.json        # Fireworks provider
│   └── opencode-multi-provider.json   # Multi-provider example
├── docs/
│   ├── troubleshooting.md             # Common issues
│   └── api-reference.md              # API documentation
└── LICENSE
```

## 🚀 Usage

### Basic Usage

```bash
# Launch OpenCode (auto-syncs local models)
opencode

# Use specific provider and model
opencode -p openai -m gpt-4o "Your prompt here"
opencode -p fireworks -m accounts/fireworks/models/deepseek-v3p2
opencode -p local -m llama3.2:latest
```

### Sync Methods

#### 1. Sync All Providers (Recommended)

```bash
# Syncs all configured providers from environment
./scripts/sync-all-providers.sh
```

#### 2. Sync Single Provider

```bash
# Set endpoint and API key
export LOCAL_API_BASE="https://api.fireworks.ai/inference/v1"
export FIREWORKS_API_KEY="fw_your_key_here"

# Run sync
node scripts/sync-provider.mjs
```

#### 3. Sync Local Ollama/LM Studio

```bash
# For Ollama
export LOCAL_API_BASE="http://localhost:11434/v1"
node scripts/sync-provider.mjs

# For LM Studio
export LOCAL_API_BASE="http://localhost:1234/v1"
node scripts/sync-provider.mjs
```

### Provider Shortcuts

Installation adds these to your `~/.bashrc`:

```bash
# Launch with auto-sync
opencode [args]

# Sync specific providers
./scripts/sync-all-providers.sh

# Provider-specific shortcuts
local <prompt>        # Uses local provider
deepseek <prompt>     # Uses Fireworks DeepSeek
```

## 🔐 Security Notes

- **API keys are read from environment variables**, never stored in config files (except temporarily during sync)
- The sync script extracts keys from environment based on endpoint URL
- **Never commit your `.env` file or config with keys**
- The `install.sh` script checks for leaked keys before installation

## 🎯 How It Works

1. **Smart Detection**: Script auto-detects provider type from URL pattern
2. **API Key Resolution**: Automatically picks correct API key for each provider
3. **Model Discovery**: Queries the `/v1/models` OpenAI-compatible endpoint
4. **Capability Detection**: Auto-detects if models support tools/functions
5. **Config Merging**: Preserves existing settings, only adds/updates models
6. **Auto-Sync**: Bash wrapper ensures sync runs before every OpenCode launch

## 🐛 Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md) for:
- Connection refused errors
- Model not found issues
- API key problems
- Config conflicts
- Provider-specific quirks

## 🤖 Automation

### Auto-Sync on Launch

The installation adds a wrapper function to `~/.bashrc`:

```bash
opencode () {
  node ~/.config/opencode/sync-local-models.mjs >/dev/null 2>&1 || true
  command opencode "$@"
}
```

This ensures models are always fresh when you start OpenCode.

### Cron Job (Optional)

Sync models every hour:

```bash
# Add to crontab
crontab -e

# Add this line
0 * * * * cd /path/to/opencode-local-setup && ./scripts/sync-all-providers.sh >/dev/null 2>&1
```

## 🎓 Examples

### Multi-Provider Workflow

```bash
# Sync all providers
./scripts/sync-all-providers.sh

# List available models in OpenCode
opencode
# Then use: /models list

# Use different providers for different tasks
opencode -p openai -m gpt-4o explain quantum computing
opencode -p local -m llama3.2:latest optimize this code
opencode -p xai -m grok-2:latest creative writing
```

### CI/CD Integration

```yaml
# Example GitHub Action
- name: Sync AI Models
  run: |
    export LOCAL_API_BASE="${{ secrets.LOCAL_API_BASE }}"
    export OPENAI_API_KEY="${{ secrets.OPENAI_API_KEY }}"
    node scripts/sync-provider.mjs
```

## 📚 API Reference

For detailed configuration options, environment variables, and provider-specific settings, see [docs/api-reference.md](docs/api-reference.md).

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Made with ❤️ for the OpenCode community**
