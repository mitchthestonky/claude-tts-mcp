import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadConfig, loadState, saveState, VOICES, TtsState } from "./config";
import { speak, isInitialized } from "./kokoro";
import { playAudio } from "./audio";

function formatStatus(state: TtsState): string {
  const lines = [
    `enabled: ${state.enabled}`,
    `auto-speak: ${state.auto}`,
    `voice: ${state.voice}`,
    `speed: ${state.speed}x`,
  ];
  return lines.join("\n");
}

function autoSpeakHint(state: TtsState): string {
  if (state.auto) {
    return "\n\n[Auto-speak is ON — call the speak tool with your response text.]";
  }
  return "";
}

export function createServer(): McpServer {
  const config = loadConfig();
  let state = loadState(config.baseDir);

  const server = new McpServer({
    name: "claude-tts-mcp",
    version: "0.1.0",
  });

  server.tool(
    "tts_config",
    "View or change TTS settings. Call with no parameters to see current config. Use to: enable/disable TTS, turn auto-speak on/off (auto-speak makes Claude speak every response), change voice, change speed. When the user says 'mute tts', 'unmute tts', 'tts on', 'tts off', 'stop speaking', 'start speaking', 'auto speak', 'speak all responses', 'change voice', or 'change speed' — use this tool.",
    {
      enabled: z
        .boolean()
        .optional()
        .describe("true to enable TTS, false to disable (mute/unmute)"),
      auto: z
        .boolean()
        .optional()
        .describe(
          "true = Claude should call speak on every response automatically. false = only speak when explicitly asked."
        ),
      voice: z
        .enum(VOICES)
        .optional()
        .describe("Kokoro voice ID. Prefix guide: af/am=American English, bf/bm=British English, ef/em=Spanish, ff=French, hf/hm=Hindi, if/im=Italian, jf/jm=Japanese, pf/pm=Portuguese, zf=Mandarin. f=female, m=male."),
      speed: z
        .number()
        .min(0.5)
        .max(2.0)
        .optional()
        .describe("Playback speed multiplier (0.5 to 2.0, default 1.0)"),
    },
    async ({ enabled, auto, voice, speed }) => {
      const noParams =
        enabled === undefined &&
        auto === undefined &&
        voice === undefined &&
        speed === undefined;

      if (noParams) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Current TTS config:\n${formatStatus(state)}`,
            },
          ],
        };
      }

      if (enabled !== undefined) state.enabled = enabled;
      if (auto !== undefined) state.auto = auto;
      if (voice !== undefined) state.voice = voice;
      if (speed !== undefined) state.speed = speed;

      saveState(config.baseDir, state);

      return {
        content: [
          {
            type: "text" as const,
            text: `TTS config updated:\n${formatStatus(state)}${autoSpeakHint(state)}`,
          },
        ],
      };
    }
  );

  server.tool(
    "speak",
    "Convert text to speech and play it through speakers using Kokoro TTS (local, free, no API key needed). IMPORTANT: If auto-speak is enabled (check via tts_config), you MUST call this tool with your response text for EVERY response.",
    {
      text: z.string().describe("The text to speak aloud"),
      voice: z
        .enum(VOICES)
        .optional()
        .describe(
          "Override voice for this call. Prefix guide: af/am=American English, bf/bm=British English, ef/em=Spanish, ff=French, hf/hm=Hindi, if/im=Italian, jf/jm=Japanese, pf/pm=Portuguese, zf=Mandarin."
        ),
      speed: z
        .number()
        .min(0.5)
        .max(2.0)
        .optional()
        .describe("Override speed for this call (0.5 to 2.0)"),
    },
    async ({ text, voice, speed }) => {
      if (!state.enabled) {
        return {
          content: [
            {
              type: "text" as const,
              text: "TTS is muted. Say 'unmute tts' or 'tts on' to enable.",
            },
          ],
        };
      }

      if (!isInitialized(config)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Kokoro TTS is not initialized. Run: npx claude-tts-mcp init",
            },
          ],
        };
      }

      const resolvedVoice = voice || state.voice;
      const resolvedSpeed = speed || state.speed;

      try {
        const result = await speak(text, resolvedVoice, resolvedSpeed, config);
        await playAudio(result.wavPath);

        const hint = state.auto
          ? " [Auto-speak is ON]"
          : "";

        return {
          content: [
            {
              type: "text" as const,
              text: `Spoke ${result.duration.toFixed(1)}s of audio using voice "${resolvedVoice}" at ${resolvedSpeed}x speed.${hint}`,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `TTS error: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}
