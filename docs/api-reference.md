# API Reference

## Environment Variables

### LOCAL_API_BASE
**Default:** `http://127.0.0.1:1234/v1`

Your OpenAI-compatible API endpoint. Can be set to any OpenAI-compatible server:

```bash
# LM Studio (default)
export LOCAL_API_BASE=http://localhost:1234/v1

# Ollama
export LOCAL_API_BASE=http://localhost:11434/v1

# vLLM
export LOCAL_API_BASE=http://localhost:8000/v1

# Custom OpenAI-compatible service
export LOCAL_API_BASE=https://api.your-service.com/v1
```

### OPENCODE_CONFIG
**Default:** `~/.config/opencode/opencode.json`

Custom path to OpenCode configuration file:

```bash
# Use custom config location
export OPENCODE_CONFIG=/path/to/custom/opencode.json
```

### XDG_CONFIG_HOME
**Default:** `~/.config`

Custom config directory location:

```bash
# Use custom config directory
export XDG_CONFIG_HOME=/home/user/my-configs
# Config will be at: $XDG_CONFIG_HOME/opencode/opencode.json
```

## Configuration Schema

OpenCode uses JSON configuration files. Here's the complete schema for local providers:

### Basic Structure

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Local Provider Name",
      "options": {
        "baseURL": "http://localhost:1234/v1"
      },
      "models": {
        "model-id": {
          "name": "Display Name",
          "tools": true
        }
      }
    }
  }
}
```

### Provider Configuration

#### local
**Type:** Object
**Description:** Configuration for your local AI provider

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `npm` | string | Yes | Must be `@ai-sdk/openai-compatible` |
| `name` | string | Yes | Display name for the provider |
| `options` | object | Yes | Provider-specific options |
| `models` | object | Yes | Available models configuration |

#### options
**Type:** Object
**Description:** Connection options for the provider

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `baseURL` | string | Yes | OpenAI-compatible API endpoint |

#### models
**Type:** Object
**Description:** Model configurations indexed by model ID

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Display name (defaults to model ID) |
| `tools` | boolean | No | Enable tool calling (default: true) |

## Model Configuration Examples

### Standard LLM (with tool support)
```json
{
  "llama-3.1-8b-instruct": {
    "name": "Llama 3.1 8B Instruct",
    "tools": true
  }
}
```

### Vision Model
```json
{
  "llava-7b": {
    "name": "LLaVA 7B Vision",
    "tools": false
  }
}
```

### Embedding Model (no tools)
```json
{
  "nomic-embed-text": {
    "name": "Nomic Embed Text",
    "tools": false
  }
}
```

## Multi-Provider Setup

You can configure multiple providers simultaneously:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "local-lmstudio": {
      "npm": "@ai-sdk/openable-compatible",
      "name": "LM Studio",
      "options": {
        "baseURL": "http://localhost:1234/v1"
      },
      "models": {}
    },
    "local-ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama",
      "options": {
        "baseURL": "http://localhost:11434/v1"
      },
      "models": {}
    },
    "fireworks": {
      "baseURL": "https://api.fireworks.ai/inference/v1",
      "models": {
        "deepseek-v3p2": {
          "name": "DeepSeek V3.2"
        }
      }
    }
  }
}
```

## Using Multiple Endpoints

The sync script only updates the "local" provider. For multiple local endpoints, create multiple providers:

```bash
# Sync LM Studio
cd /path/to/opencode-local-setup
LOCAL_API_BASE=http://localhost:1234/v1 node scripts/sync-local-models.mjs

# Sync Ollama  
LOCAL_API_BASE=http://localhost:11434/v1 node scripts/sync-local-models.mjs ~/.opencode-ollama.json

# Use different configs
OPENCODE_CONFIG=~/.opencode-lmstudio.json opencode
OPENCODE_CONFIG=~/.opencode-ollama.json opencode
```

## Provider Resolution

When multiple models have the same ID, OpenCode uses the first matching provider. Use prefixes to disambiguate:

```bash
# In OpenCode
/models list                    # Shows all models
/models use local/llama-3.1     # Use local provider
/models use fireworks/deepseek  # Use fireworks provider
```

## Advanced Options

### Custom Headers
For providers requiring authentication:

```json
{
  "provider": {
    "custom": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Custom Provider",
      "options": {
        "baseURL": "https://api.custom.com/v1",
        "headers": {
          "Authorization": "Bearer YOUR_API_KEY"
        }
      }
    }
  }
}
```

### Model-Specific Settings
Some models may need specific configuration:

```json
{
  "models": {
    "qwen-long-writer": {
      "name": "Qwen Long Writer",
      "tools": true,
      "contextWindow": 32000
    }
  }
}
```

## Command-Line Usage

### Basic Usage
```bash
# Use default local model
opencode -p local

# Use specific model
opencode -p local -m llama-3.1-8b-instruct

# Use cloud provider
opencode -p fireworks
```

### Using Convenience Functions
```bash
# After installation
local                      # Uses local provider
deepseek                   # Uses Fireworks DeepSeek
```

### With Custom Endpoints
```bash
# Temporarily override endpoint
LOCAL_API_BASE=http://localhost:8000/v1 opencode

# With custom config
OPENCODE_CONFIG=/path/to/config.json opencode
```

## API Endpoints

### Standard OpenAI-Compatible
- **GET** `/v1/models` - List available models
- **POST** `/v1/chat/completions` - Chat completion
- **POST** `/v1/embeddings` - Text embeddings

### Provider-Specific
- **LM Studio:** Full OpenAI compatibility at `http://localhost:1234/v1`
- **Ollama:** OpenAI compatibility at `http://localhost:11434/v1`
- **vLLM:** Full OpenAI compatibility, configurable port (default: 8000)
