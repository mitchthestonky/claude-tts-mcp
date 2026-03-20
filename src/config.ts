import * as path from "path";
import * as os from "os";
import * as fs from "fs";

export const VOICES = [
  // American English (female)
  "af_alloy", "af_aoede", "af_bella", "af_heart", "af_jessica",
  "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
  // American English (male)
  "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam",
  "am_michael", "am_onyx", "am_puck", "am_santa",
  // British English (female)
  "bf_alice", "bf_emma", "bf_isabella", "bf_lily",
  // British English (male)
  "bm_daniel", "bm_fable", "bm_george", "bm_lewis",
  // Spanish
  "ef_dora", "em_alex", "em_santa",
  // French
  "ff_siwis",
  // Hindi
  "hf_alpha", "hf_beta", "hm_omega", "hm_psi",
  // Italian
  "if_sara", "im_nicola",
  // Japanese
  "jf_alpha", "jf_gongitsune", "jf_nezumi", "jf_tebukuro", "jm_kumo",
  // Portuguese
  "pf_dora", "pm_alex", "pm_santa",
  // Mandarin Chinese
  "zf_xiaobei", "zf_xiaoni", "zf_xiaoxiao", "zf_xiaoyi",
] as const;

export type VoiceId = typeof VOICES[number];

export interface Config {
  voice: string;
  speed: number;
  baseDir: string;
  venvDir: string;
  modelDir: string;
  pythonDir: string;
}

export interface TtsState {
  enabled: boolean;
  auto: boolean;
  voice: string;
  speed: number;
}

function statePath(baseDir: string): string {
  return path.join(baseDir, "state.json");
}

export function loadState(baseDir: string): TtsState {
  const defaults: TtsState = {
    enabled: process.env.TTS_ENABLED !== "false",
    auto: process.env.TTS_AUTO === "true",
    voice: process.env.TTS_VOICE || "af_heart",
    speed: Math.max(0.5, Math.min(2.0, parseFloat(process.env.TTS_SPEED || "1.0") || 1.0)),
  };

  const file = statePath(baseDir);
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
    return {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
      auto: typeof raw.auto === "boolean" ? raw.auto : defaults.auto,
      voice: VOICES.includes(raw.voice) ? raw.voice : defaults.voice,
      speed: typeof raw.speed === "number" ? Math.max(0.5, Math.min(2.0, raw.speed)) : defaults.speed,
    };
  } catch {
    return defaults;
  }
}

export function saveState(baseDir: string, state: TtsState): void {
  const file = statePath(baseDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
}

export function loadConfig(): Config {
  const baseDir =
    process.env.TTS_BASE_DIR || path.join(os.homedir(), ".claude-tts");
  const state = loadState(baseDir);

  return {
    voice: state.voice,
    speed: state.speed,
    baseDir,
    venvDir: path.join(baseDir, "venv"),
    modelDir: path.join(baseDir, "models"),
    pythonDir: path.join(__dirname, "..", "python"),
  };
}
