# OpenCode Local AI Provider Setup

This repository provides a complete solution for integrating local AI providers (LM Studio, vLLM, Ollama, etc.) with [OpenCode](https://opencode.ai/), the terminal-based AI coding agent.

## Features

- **Automatic Model Discovery**: Syncs models from your local AI server automatically
- **Provider Flexibility**: Works with any OpenAI-compatible API endpoint
- **Seamless Integration**: Auto-syncs models every time you launch OpenCode
- **Bash Shortcuts**: Convenient shell functions for common providers

## Quick Start

```bash
git clone <repository-url>
cd opencode-local-setup
./install.sh

# Configure your endpoint
export LOCAL_API_BASE="http://localhost:1234/v1"  # For LM Studio
# OR
export LOCAL_API_BASE="http://localhost:11434/v1"  # For Ollama

# Run the sync script
node scripts/sync-local-models.mjs

# Launch OpenCode with auto-sync
opencode
```

## Directory Structure

```
opencode-local-setup/
├── README.md                          # This file
├── scripts/
│   ├── sync-local-models.mjs         # Main sync script
│   ├── install.sh                     # Installation script
│   └── opencode-wrapper.sh           # Shell wrapper functions
├── configs/
│   ├── opencode.json.example          # Basic config example
│   ├── opencode-fireworks.json        # Fireworks provider example
│   └── opencode-multi-provider.json   # Multi-provider setup
├── docs/
│   ├── troubleshooting.md             # Common issues & solutions
│   └── api-reference.md              # Configuration reference
└── LICENSE
```

## Configuration

### Environment Variables

- `LOCAL_API_BASE`: Your OpenAI-compatible API endpoint (default: `http://localhost:1234/v1`)
- `OPENCODE_CONFIG`: Custom path to OpenCode config file (optional)
- `XDG_CONFIG_HOME`: Custom config directory (default: `~/.config`)

### Configuration Files

Place your configuration in one of these locations:

1. **Global config**: `~/.config/opencode/opencode.json` (default)
2. **Per-project config**: `./opencode.json` in your project root
3. **Custom path**: Set `OPENCODE_CONFIG=/path/to/config.json`

## Providers Supported

### Local Providers
- **LM Studio** - Default at `http://localhost:1234/v1`
- **vLLM** - Typically at `http://localhost:8000/v1`
- **Ollama** - Typically at `http://localhost:11434/v1`
- **Any OpenAI-compatible endpoint**

### Cloud Providers (Examples)
- **Fireworks AI** - `https://api.fireworks.ai/inference/v1`
- **OpenAI** - `https://api.openai.com/v1`
- **Anthropic** - Via compatible endpoints

## Bash Functions

The installation adds these shortcuts to your `~/.bashrc`:

```bash
# Launch OpenCode with auto-sync
opencode [args]

# Direct shortcuts
local [args]        # Use local provider
deepseek [args]     # Use Fireworks DeepSeek model
```

## How It Works

1. **Sync Script** queries your local AI server's `/v1/models` endpoint
2. **Updates Config** with discovered models, preserving existing settings
3. **BashWrapper** ensures sync runs before every OpenCode launch
4. **Model Selection** appears in OpenCode's `/models` command

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md) for common issues.

## License

MIT License - See LICENSE file for details.
