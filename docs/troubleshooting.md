# Troubleshooting Guide

## Common Issues and Solutions

### 1. Sync Script Fails: "fetch failed" or "ECONNREFUSED"

**Symptom:**
```
❌ Sync failed: fetch failed
   Error: connect ECONNREFUSED 127.0.0.1:1234
```

**Cause:** Your AI server is not running or not accessible.

**Solutions:**
1. Start your AI server:
   ```bash
   # For LM Studio: Start the application and enable Local Server
   # For Ollama: ollama serve
   # For vLLM: python -m vllm.entrypoints.openai.api_server --model your-model
   ```

2. Verify endpoint:
   ```bash
   curl http://localhost:1234/v1/models
   # Should return JSON with available models
   ```

3. Check firewall/network:
   ```bash
   # Ensure port is accessible
   nc -zv localhost 1234
   ```

### 2. "No models found at http://.../v1/models"

**Symptom:**
```
⚠️  No models found at http://localhost:1234/v1/models
    Make sure your AI server is running and accessible
```

**Cause:** Server running but no models loaded.

**Solutions:**
1. **For LM Studio:** Load a model in the UI
2. **For Ollama:** Pull a model first:
   ```bash
   ollama pull llama3.1:8b
   ```
3. **For vLLM:** Specify model on startup:
   ```bash
   vllm serve meta-llama/Meta-Llama-3.1-8B-Instruct
   ```

### 3. Sync Works But Models Don't Show in OpenCode

**Cause:** OpenCode is using a different config file.

**Solutions:**
1. Check which config OpenCode is using:
   ```bash
   # Open using custom location
   OPENCODE_CONFIG=~/.config/opencode/opencode.json opencode
   ```

2. Verify sync script updated the correct file:
   ```bash
   cat ~/.config/opencode/opencode.json | jq '.provider.local.models'
   ```

3. In OpenCode, check available models:
   ```bash
   # Use /models command within OpenCode
   ```

### 4. "Error reading config (might contain JSON comments?)"

**Symptom:**
```
❌ Error reading config (might contain JSON comments?): Unexpected token
```

**Cause:** Config file contains comments (JSONC format) that strict JSON parser can't handle.

**Solution:**
1. Remove comments from `opencode.json`
2. Or use a tool to strip comments before syncing:
   ```bash
   npm install -g strip-json-comments-cli
   strip-json-comments ~/.config/opencode/opencode.json > ~/.config/opencode/opencode.json.clean
   ```

### 5. Bash Functions Not Working After Install

**Symptom:**
```bash
$ opencode
bash: opencode: command not found
```

**Cause:** Bash functions not sourced or PATH not updated.

**Solutions:**
1. Source your bashrc:
   ```bash
   source ~/.bashrc
   ```

2. Check if functions exist:
   ```bash
   type opencode
   # Should show: opencode is a function
   ```

3. Verify OpenCode installation:
   ```bash
   which opencode
   # Should show path like /home/user/.opencode/bin/opencode
   ```

### 6. "tools ??= true" Causing Issues

**Symptom:** Model behaves strangely or tries to call non-existent tools.

**Cause:** Your model doesn't support tool/function calling.

**Solution:**
1. Edit `opencode.json` and set `tools: false` for problematic models:
   ```json
   {
     "provider": {
       "local": {
         "models": {
           "my-small-model": {
             "name": "my-small-model",
             "tools": false
           }
         }
       }
     }
   }
   ```

2. Or modify the sync script to detect model capabilities.

### 7. "Cannot find module '/path/to/sync-local-models.mjs'"

**Symptom:**
```
Error: Cannot find module '/home/user/.config/opencode/sync-local-models.mjs'
```

**Cause:** Script not installed or path incorrect.

**Solution:**
1. Re-run install script:
   ```bash
   ./scripts/install.sh
   ```

2. Or manually copy the script:
   ```bash
   cp scripts/sync-local-models.mjs ~/.config/opencode/
   ```

## Debugging Tips

### Enable Verbose Output

Run sync script with more output:
```bash
node ~/.config/opencode/sync-local-models.mjs
```

### Check API Directly

Test your API endpoint:
```bash
curl -s http://localhost:1234/v1/models | jq
```

### Verify Config

Check final config:
```bash
cat ~/.config/opencode/opencode.json | jq '.provider.local'
```

### Test with Different Endpoints

Override endpoint temporarily:
```bash
LOCAL_API_BASE=http://localhost:11434/v1 node scripts/sync-local-models.mjs
```

## Getting Help

If you still have issues:

1. Check the [API Reference](api-reference.md)
2. Review OpenCode docs: https://opencode.ai/docs/
3. Open an issue with:
   - Command you're running
   - Full error output
   - `node --version`
   - `curl $LOCAL_API_BASE/v1/models` output
   - Contents of `opencode.json`
