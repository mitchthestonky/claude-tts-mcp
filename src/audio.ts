import { spawn } from "child_process";
import * as fs from "fs";

export async function playAudio(wavPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("afplay", [wavPath]);

    proc.on("close", (code: number | null) => {
      // Clean up temp file
      try {
        fs.unlinkSync(wavPath);
      } catch {
        // ignore cleanup errors
      }

      if (code !== 0) {
        reject(new Error(`afplay failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on("error", (err: Error) => {
      reject(
        new Error(
          `Failed to play audio: ${err.message}. Is afplay available (macOS only)?`
        )
      );
    });
  });
}
