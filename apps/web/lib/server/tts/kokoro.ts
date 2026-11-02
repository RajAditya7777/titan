import "server-only";
import path from "node:path";
import { Worker } from "node:worker_threads";

/**
 * Local, open-source text-to-speech: Kokoro-82M in a worker thread (see kokoro-worker.mjs for why).
 * No API key and no per-request cost; the model (~90 MB) downloads once into apps/web/.models.
 *
 * Failure model: every error rejects, and /api/tts turns that into a 5xx, so the browser falls back
 * to its own voice. Speech can degrade; the conversation never breaks.
 */

export interface KokoroConfig {
  voice: string;
  speed: number;
}

export function kokoroConfigFromEnv(env = process.env): KokoroConfig {
  const speed = Number(env.KOKORO_SPEED);
  return {
    // af_heart: Kokoro's clearest standard English voice. Set KOKORO_VOICE=hf_alpha for Indian-accented English.
    voice: env.KOKORO_VOICE || "af_heart",
    speed: Number.isFinite(speed) && speed >= 0.5 && speed <= 2 ? speed : 1,
  };
}

export class TtsBusyError extends Error {}

const MAX_PENDING = 4; // beyond this, a new request would wait seconds: fail fast, use the browser voice
const REQUEST_TIMEOUT_MS = 30_000; // first request may include loading the model
const CACHE_ENTRIES = 64; // guide lines repeat (every mint walkthrough says the same things)
const RESPAWN_BACKOFF_MS = 30_000;

type Pending = { resolve: (wav: Uint8Array) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

class KokoroEngine {
  private worker: Worker | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private cache = new Map<string, Uint8Array>();
  private crashedAt = 0;

  private spawn(cfg: KokoroConfig): Worker {
    if (this.worker) return this.worker;
    if (Date.now() - this.crashedAt < RESPAWN_BACKOFF_MS) throw new Error("TTS worker recently crashed; backing off");
    const cwd = process.cwd();
    const worker = new Worker(path.join(cwd, "lib/server/tts/kokoro-worker.mjs"), {
      workerData: { cacheDir: path.join(cwd, ".models"), voice: cfg.voice, dtype: "q8" },
    });
    worker.unref(); // never keep the server process alive on its own
    worker.on("message", (msg: { id: number; ok: boolean; wav?: Uint8Array; error?: string }) => {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.ok) p.resolve(msg.wav ?? new Uint8Array());
      else p.reject(new Error(msg.error ?? "TTS failed"));
    });
    const fail = (err: Error) => {
      this.crashedAt = Date.now();
      this.worker = null;
      for (const p of this.pending.values()) {
        clearTimeout(p.timer);
        p.reject(err);
      }
      this.pending.clear();
    };
    worker.on("error", fail);
    worker.on("exit", (code) => code !== 0 && fail(new Error(`TTS worker exited with code ${code}`)));
    this.worker = worker;
    return worker;
  }

  private request(cfg: KokoroConfig, msg: Record<string, unknown>): Promise<Uint8Array> {
    if (this.pending.size >= MAX_PENDING) return Promise.reject(new TtsBusyError("TTS queue is full"));
    const worker = this.spawn(cfg);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("TTS timed out"));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, ...msg });
    });
  }

  async synth(text: string, cfg: KokoroConfig): Promise<Uint8Array> {
    const key = `${cfg.voice}|${cfg.speed}|${text}`;
    const hit = this.cache.get(key);
    if (hit) {
      this.cache.delete(key); // refresh LRU position
      this.cache.set(key, hit);
      return hit;
    }
    const wav = await this.request(cfg, { type: "synth", text, voice: cfg.voice, speed: cfg.speed });
    this.cache.set(key, wav);
    if (this.cache.size > CACHE_ENTRIES) this.cache.delete(this.cache.keys().next().value!);
    return wav;
  }

  async warm(cfg: KokoroConfig): Promise<void> {
    await this.request(cfg, { type: "warm" });
  }
}

// One engine per server process, surviving dev hot-reloads (else each edit would spawn a worker).
const g = globalThis as unknown as { __kokoro?: KokoroEngine };
export const kokoro = (g.__kokoro ??= new KokoroEngine());

/**
 * Text as it should be *said*. Kokoro reads "USDC+" as one word ("yusdik") and drops symbols, so
 * tickers are spelled out and symbols become words. Display text is untouched; only audio changes.
 */
export function speechText(text: string): string {
  return text
    .replace(/\b(USDC|USDT)\+/g, (_, t: string) => `${t.split("").join(" ")} plus`)
    .replace(/\b(USDC|USDT|APY|USD|API)\b/g, (t) => t.split("").join(" "))
    .replace(/(\d)\s?%/g, "$1 percent")
    .replace(/\bbps\b/gi, "basis points")
    .replace(/\s+/g, " ")
    .trim();
}
