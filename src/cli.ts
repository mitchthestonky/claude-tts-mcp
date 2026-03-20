#!/usr/bin/env node
import { init } from "./init";

const command = process.argv[2];

if (command === "init") {
  init().catch((err) => {
    console.error("Init failed:", err.message);
    process.exit(1);
  });
} else if (command === "--help" || command === "-h") {
  console.log(`claude-tts-mcp - Local TTS for Claude Code

Usage:
  claude-tts-mcp init    Download and set up Kokoro TTS (~200MB, one-time)
  claude-tts-mcp         Start MCP server (used by Claude Code)

Environment variables:
  TTS_VOICE    Kokoro voice ID (default: af_heart)
  TTS_SPEED    Playback speed 0.5-2.0 (default: 1.0)

Voices:
  af_heart     American English female (Grade A, recommended)
  af_bella     American English female (Grade A-)
  bf_emma      British English female (Grade B-)
  am_michael   American English male (Grade C+)
  am_puck      American English male (Grade C+)

  Full list: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md`);
} else {
  // Default: start MCP server
  require("./index");
}
