# claude-tts-mcp

**Give Claude Code a voice — free, local, no API keys.**

A local-first MCP server that adds text-to-speech to Claude Code using [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) (82M parameters, Apache 2.0). Runs entirely on your machine. Works offline. Zero cost.

## Quick start

```bash
# 1. Initialise (downloads model weights ~200MB, one-time)
npx claude-tts-mcp init

# 2. Add to Claude Code
claude mcp add tts -- npx claude-tts-mcp
```

That's it. Ask Claude to "read that back" or "say hello" and it will speak.

## Why this one?

| Project | Engine | Cost | Local |
|---|---|---|---|
| claude-code-tts | OpenAI TTS | ~$15/M chars | No |
| blacktop/mcp-tts | Google Gemini | Pay per use | No |
| VoiceMode MCP | OpenAI | Pay per use | No |
| **claude-tts-mcp** | **Kokoro** | **Free** | **Yes** |

## Features

- **54 voices, 8 languages** — American/British English, Spanish, French, Hindi, Italian, Japanese, Portuguese, Mandarin
- **Speed control** — 0.5x to 2.0x playback
- **Auto-speak mode** — Claude reads every response aloud automatically
- **Mute/unmute** — toggle TTS on and off without removing the server
- **Fully offline** — no network requests after initial model download

## Tools

### `speak`

Converts text to speech and plays it through your speakers.

```
"Read this code explanation back to me"
"Say hello in a British voice"
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `text` | string | yes | Text to speak |
| `voice` | string | no | Voice ID (default: `af_heart`) |
| `speed` | number | no | 0.5–2.0 (default: 1.0) |

### `tts_config`

View or change settings at runtime.

```
"Change voice to bf_emma"
"Set speed to 1.5"
"Turn on auto-speak"
"Mute TTS"
```

| Parameter | Type | Description |
|---|---|---|
| `enabled` | boolean | Enable/disable TTS |
| `auto` | boolean | Auto-speak every response |
| `voice` | string | Default voice ID |
| `speed` | number | Default speed |

## Voices

Voice IDs follow the pattern `{language}{gender}_{name}`:

| Prefix | Language | Example |
|---|---|---|
| `af` / `am` | American English | `af_heart`, `am_michael` |
| `bf` / `bm` | British English | `bf_emma`, `bm_george` |
| `ef` / `em` | Spanish | `ef_dora`, `em_alex` |
| `ff` | French | `ff_siwis` |
| `hf` / `hm` | Hindi | `hf_alpha`, `hm_omega` |
| `if` / `im` | Italian | `if_sara`, `im_nicola` |
| `jf` / `jm` | Japanese | `jf_alpha`, `jm_kumo` |
| `pf` / `pm` | Portuguese | `pf_dora`, `pm_alex` |
| `zf` | Mandarin | `zf_xiaobei` |

## Configuration

### Environment variables

Set these in your MCP config for persistent defaults:

```json
{
  "mcpServers": {
    "tts": {
      "command": "npx",
      "args": ["claude-tts-mcp"],
      "env": {
        "TTS_VOICE": "bf_emma",
        "TTS_SPEED": "1.2"
      }
    }
  }
}
```

## Requirements

- **Node.js** 18+
- **Python** 3.10+
- **macOS** (Linux and Windows support planned)

## How it works

```
Claude Code  →  MCP (stdio)  →  claude-tts-mcp (Node.js)
                                        ↓
                                Python venv + Kokoro
                                        ↓
                                   WAV file → afplay → Speakers
```

On first run, `init` creates a Python virtual environment at `~/.claude-tts/`, installs Kokoro, and downloads model weights from Hugging Face. Each `speak` call spawns a Python process to generate audio, then plays it through your system speakers.

## Licence

Apache 2.0
