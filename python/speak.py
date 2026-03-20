"""Kokoro TTS inference script. Called by the MCP server as a subprocess."""

import argparse
import sys
import os
import soundfile as sf


def main():
    parser = argparse.ArgumentParser(description="Generate speech with Kokoro TTS")
    parser.add_argument("--text", required=True, help="Text to speak")
    parser.add_argument("--voice", default="af_heart", help="Kokoro voice ID")
    parser.add_argument("--speed", type=float, default=1.0, help="Speed multiplier")
    parser.add_argument("--output", required=True, help="Output WAV file path")
    parser.add_argument("--model-dir", default=None, help="Directory containing model weights")
    args = parser.parse_args()

    try:
        from kokoro import KPipeline

        # Determine language code from voice prefix
        lang_map = {
            "a": "a",  # American English
            "b": "b",  # British English
            "j": "j",  # Japanese
            "z": "z",  # Mandarin Chinese
            "e": "e",  # Spanish
            "f": "f",  # French
            "h": "h",  # Hindi
            "i": "i",  # Italian
            "p": "p",  # Brazilian Portuguese
        }
        lang_code = lang_map.get(args.voice[0], "a")

        pipeline = KPipeline(lang_code=lang_code)

        # Generate audio
        samples = []
        for chunk in pipeline(args.text, voice=args.voice, speed=args.speed):
            if chunk.audio is not None:
                samples.append(chunk.audio)

        if not samples:
            print("ERROR: No audio generated", file=sys.stderr)
            sys.exit(1)

        # Concatenate and write
        import numpy as np
        audio = np.concatenate(samples)
        sf.write(args.output, audio, 24000)

        # Output duration for the MCP server
        duration = len(audio) / 24000
        print(f"OK duration={duration:.2f}")

    except ImportError as e:
        print(f"ERROR: Missing dependency: {e}", file=sys.stderr)
        print("Run: claude-tts-mcp init", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
