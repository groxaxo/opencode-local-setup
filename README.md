<div align="center">
  <img src="docs/assets/hero.svg" alt="Run your own AI models in OpenCode" width="100%" />

  <br />

  [![CI](https://github.com/groxaxo/opencode-local-setup/actions/workflows/ci.yml/badge.svg)](https://github.com/groxaxo/opencode-local-setup/actions/workflows/ci.yml)
  [![OpenCode compatible](https://img.shields.io/badge/OpenCode-current%20schema-65e8c4)](https://opencode.ai/config.json)
  [![Node 18+](https://img.shields.io/badge/Node-18%2B-69a7ff)](https://nodejs.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-b281ff.svg)](LICENSE)

  ### Use the models you already run — directly inside OpenCode.

  LM Studio, Ollama, vLLM, llama.cpp, a machine on your LAN, or a GPU box over Tailscale.

  **No hand-written model lists. No API keys copied into config files. No fighting stale setup.**

  [Get started](#get-started) · [See how it works](#what-happens-behind-the-scenes) · [Troubleshooting](docs/troubleshooting.md)
</div>

---

## What problem does this solve?

OpenCode works beautifully with built-in providers. Local models are a little messier.

You load a different model in LM Studio. You restart Ollama. You move vLLM to another machine. The model name changes, but your OpenCode configuration does not.

**OpenCode Local Setup keeps the two in sync.**

When you open OpenCode, it checks the model servers you configured, discovers what is actually available, and updates only the relevant part of your `opencode.json`.

```text
Your model server  →  discovers live models  →  OpenCode is ready
```

It leaves the rest of your OpenCode setup alone.

## Get started

### 1. Install OpenCode

```bash
curl -fsSL https://opencode.ai/install | bash
```

### 2. Install this helper

```bash
git clone https://github.com/groxaxo/opencode-local-setup.git
cd opencode-local-setup
./scripts/install.sh
```

### 3. Start your model server and open OpenCode

```bash
opencode
```

That is it. The default setup looks for LM Studio at:

```text
http://127.0.0.1:1234/v1
```

Inside OpenCode, use `/models` to choose a model.

> [!NOTE]
> This project connects OpenCode to your model server. It does not install LM Studio, Ollama, vLLM, llama.cpp, or the models themselves.

## Pick the setup you use

| You run | Start with | Helper command |
|---|---|---|
| **LM Studio** | `http://127.0.0.1:1234/v1` | `oc-lmstudio` |
| **Ollama** | `http://127.0.0.1:11434/v1` | `oc-ollama` |
| **vLLM** | `http://127.0.0.1:8000/v1` | `oc-vllm` |
| **llama.cpp** | `http://127.0.0.1:8080/v1` | `oc-llamacpp` |
| **Remote GPU server** | Any reachable OpenAI-compatible URL | Add it to `opencode.json` |

The helper commands synchronize that server and launch OpenCode:

```bash
oc-ollama
oc-vllm
oc-lmstudio "Review this repository"
```

They are prefixed with `oc-`, so they never replace the real `ollama`, `vllm`, or server commands on your computer.

## What you get

### Your model list stays fresh

Load or remove a model on the server and OpenCode sees the change on the next sync.

### Your existing configuration is respected

The synchronizer updates provider models without replacing unrelated settings, agents, MCP servers, permissions, themes, or keybindings.

### Secrets stay out of the file

API keys remain in environment variables or OpenCode's own credential store. Generated provider entries use safe references such as:

```json
"apiKey": "{env:REMOTE_API_KEY}"
```

### Local and remote machines work the same way

A model can run on your laptop, desktop, home server, LAN workstation, or trusted Tailscale machine. If the endpoint is reachable and OpenAI-compatible, it can be synchronized.

### It is designed to fail quietly

A sleeping GPU box or closed LM Studio window should not stop OpenCode from opening. Launch checks use short timeouts and skip unavailable endpoints.

## What happens behind the scenes?

```mermaid
flowchart LR
  A[Your model server] -->|lists available models| B[OpenCode Local Setup]
  B -->|updates only provider models| C[Your opencode.json]
  C --> D[OpenCode]
  E[Environment variables] -->|safe secret references| C
```

In plain English:

1. It reads the OpenCode configuration you already use.
2. It accepts normal JSON or JSONC with comments and trailing commas.
3. It asks each configured server for its live model list.
4. It refreshes model names and supported metadata.
5. It removes models that are no longer served, unless configured otherwise.
6. It writes the file safely and keeps it private to your user account.

## Commands you will actually use

```bash
opencode                         # Open OpenCode with a quick pre-launch sync
sync-models                      # Refresh your configured compatible servers
opencode models                  # Show available provider/model IDs
opencode models --refresh        # Refresh OpenCode's built-in provider cache
opencode auth login              # Connect a built-in cloud provider
oc-doctor                        # Check config health and secret hygiene
opencode upgrade                 # Upgrade OpenCode
```

## Change the default server

Edit the small environment file created by the installer:

```bash
$EDITOR ~/.config/opencode/local-setup/.env.local
```

For example:

```bash
LOCAL_API_BASE=http://127.0.0.1:11434/v1
OPENCODE_PROVIDER_ID=ollama
OPENCODE_PROVIDER_NAME="Ollama"
```

Then run:

```bash
sync-models
```

## Connect a remote GPU machine

Add a provider to `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "gpu-box": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "My GPU Box",
      "options": {
        "baseURL": "http://100.100.100.100:8000/v1",
        "apiKey": "{env:REMOTE_API_KEY}"
      },
      "models": {}
    }
  }
}
```

Export the key only when the server requires one:

```bash
export REMOTE_API_KEY="your-key"
sync-models
```

Tailscale discovery is available for trusted networks, but remains off by default. Explicit providers work without any scanning.

<details>
<summary><strong>Enable narrowly scoped Tailscale discovery</strong></summary>

```bash
export OPENCODE_TAILSCALE_DISCOVERY=1
export OPENCODE_TAILSCALE_PORTS=1234,8000,8080,11434
sync-models
```

Only online peers and the ports you list are checked.

</details>

## Safe by default

- Raw API keys are not written into generated configuration.
- Existing OpenCode settings are preserved.
- Config updates are atomic, reducing the chance of a half-written file.
- File permissions are restricted to your user.
- Tailscale discovery is opt-in.
- Post-exit synchronization is opt-in.
- Automatic session sharing is not enabled.

Run the built-in health check whenever something feels wrong:

```bash
oc-doctor
```

## Already installed an older version?

```bash
cd opencode-local-setup
git pull
./scripts/install.sh
oc-doctor
```

Your existing `opencode.json` and local environment file are preserved.

## Built for people who

- Run private or local models while coding.
- Swap models frequently in LM Studio or Ollama.
- Serve models with vLLM or llama.cpp.
- Use a separate GPU workstation or home server.
- Want a clean OpenCode setup without maintaining model IDs by hand.

## For contributors

```bash
npm run validate
```

The validation suite covers JSONC parsing, model metadata migration, secure credential handling, atomic writes, multi-provider refresh, installation behavior, and opt-in Tailscale discovery.

## More documentation

- [Configuration and script reference](docs/api-reference.md)
- [Authentication and credentials](docs/auth-providers.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Example configurations](configs/)

## License

[MIT](LICENSE)
