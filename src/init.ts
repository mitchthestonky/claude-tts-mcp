import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { loadConfig } from "./config";

function findPython(): string {
  for (const cmd of ["python3.12", "python3.11", "python3.10", "python3", "python"]) {
    try {
      const result = spawnSync(cmd, ["--version"], { encoding: "utf-8" });
      if (result.status === 0) {
        const version = result.stdout.trim() || result.stderr.trim();
        const match = version.match(/(\d+)\.(\d+)/);
        if (match) {
          const major = parseInt(match[1]);
          const minor = parseInt(match[2]);
          if (major === 3 && minor >= 10 && minor <= 12) {
            return cmd;
          }
        }
      }
    } catch {
      continue;
    }
  }
  throw new Error(
    "Python 3.10+ is required but not found. Install it from https://python.org"
  );
}

export async function init() {
  const config = loadConfig();

  console.log("claude-tts-mcp init");
  console.log("===================\n");

  // 1. Find Python
  console.log("Checking Python...");
  const python = findPython();
  const pyVersion = spawnSync(python, ["--version"], { encoding: "utf-8" });
  console.log(`  Found: ${(pyVersion.stdout || pyVersion.stderr).trim()}\n`);

  // 2. Create base directory
  if (!fs.existsSync(config.baseDir)) {
    fs.mkdirSync(config.baseDir, { recursive: true });
    console.log(`Created: ${config.baseDir}`);
  }

  // 3. Create venv
  console.log("Creating Python virtual environment...");
  if (fs.existsSync(config.venvDir)) {
    console.log("  Venv already exists, skipping.\n");
  } else {
    execSync(`${python} -m venv "${config.venvDir}"`, { stdio: "inherit" });
    console.log(`  Created: ${config.venvDir}\n`);
  }

  // 4. Install dependencies
  console.log("Installing Kokoro TTS...");
  const pip = path.join(config.venvDir, "bin", "pip");
  const requirementsFile = path.join(config.pythonDir, "requirements.txt");
  execSync(`"${pip}" install -r "${requirementsFile}"`, {
    stdio: "inherit",
  });
  console.log("");

  // 5. Verify installation
  console.log("Verifying installation...");
  const venvPython = path.join(config.venvDir, "bin", "python");
  const verify = spawnSync(
    venvPython,
    ["-c", "from kokoro import KPipeline; print('OK')"],
    { encoding: "utf-8" }
  );

  if (verify.status !== 0) {
    console.error("  Verification failed:", verify.stderr);
    process.exit(1);
  }
  console.log("  Kokoro TTS installed successfully.\n");

  // 6. Print config
  console.log("Setup complete!\n");
  console.log("Add this to your Claude Code MCP config:\n");
  console.log("  claude mcp add tts -- npx claude-tts-mcp\n");
  console.log("Or add manually to ~/.claude.json:\n");
  console.log(
    JSON.stringify(
      {
        mcpServers: {
          tts: {
            command: "npx",
            args: ["claude-tts-mcp"],
            env: {
              TTS_VOICE: "af_heart",
              TTS_SPEED: "1.0",
            },
          },
        },
      },
      null,
      2
    )
  );
  console.log("");
}
