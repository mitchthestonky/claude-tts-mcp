import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as os from "os";
import { Config } from "./config";

export interface SpeakResult {
  wavPath: string;
  duration: number;
}

export function isInitialized(config: Config): boolean {
  const pythonBin = path.join(config.venvDir, "bin", "python");
  return fs.existsSync(pythonBin);
}

export async function speak(
  text: string,
  voice: string,
  speed: number,
  config: Config
): Promise<SpeakResult> {
  const pythonBin = path.join(config.venvDir, "bin", "python");
  const speakScript = path.join(config.pythonDir, "speak.py");
  const wavPath = path.join(os.tmpdir(), `claude-tts-${uuidv4()}.wav`);

  if (!fs.existsSync(pythonBin)) {
    throw new Error(
      "Kokoro not initialized. Run: npx claude-tts-mcp init"
    );
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonBin, [
      speakScript,
      "--text",
      text,
      "--voice",
      voice,
      "--speed",
      speed.toString(),
      "--output",
      wavPath,
      "--model-dir",
      config.modelDir,
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`Kokoro failed: ${stderr.trim() || `exit code ${code}`}`));
        return;
      }

      const match = stdout.match(/OK duration=([\d.]+)/);
      const duration = match ? parseFloat(match[1]) : 0;

      resolve({ wavPath, duration });
    });

    proc.on("error", (err: Error) => {
      reject(new Error(`Failed to spawn Python: ${err.message}`));
    });
  });
}
