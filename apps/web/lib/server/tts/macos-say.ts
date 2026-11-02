import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * macOS's built-in `say` as a server voice: on every Mac, no key, no model download, ~1-2 s per
 * line. For local demos where Kokoro is too slow and an embedded browser can't play Web Speech.
 * The text is passed as an argument (never through a shell), so it can't inject commands.
 */
export function sayConfigFromEnv(env = process.env) {
  const rate = Number(env.SAY_RATE);
  return { voice: env.SAY_VOICE || "Samantha", rate: Number.isFinite(rate) && rate >= 120 && rate <= 300 ? rate : 190 };
}

export async function sayToWav(text: string, cfg = sayConfigFromEnv()): Promise<Uint8Array> {
  if (process.platform !== "darwin") throw new Error("macOS say is only available on macOS");
  const dir = await mkdtemp(path.join(tmpdir(), "say-"));
  const out = path.join(dir, "speech.wav");
  try {
    await new Promise<void>((resolve, reject) =>
      execFile("/usr/bin/say", ["-v", cfg.voice, "-r", String(cfg.rate), "-o", out, "--data-format=LEI16@22050", "--", text], { timeout: 15_000 }, (err) =>
        err ? reject(err) : resolve(),
      ),
    );
    return new Uint8Array(await readFile(out));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
