"use client";

import { BrowserSpeechToText, BrowserTextToSpeech, VOICE_LOCALE, type SpeechToText, type TextToSpeech } from "./voice";

/**
 * Server-backed voice adapters (Whisper-class STT, neural TTS via our /api routes).
 * Same interfaces as the Web Speech adapters, so the companion engine is unchanged.
 *
 * Why server STT: works in every browser with a mic (Web Speech recognition is Chrome/Edge-only)
 * and is markedly more accurate on product words once biased with domain vocabulary.
 */

// ───────────────────────────── Voice activity detection ─────────────────────────────

/** Pure decision logic, separated from Web Audio so it can be unit-tested. */
export class VoiceActivityDetector {
  private speaking = false;
  private speechMs = 0;
  private silenceMs = 0;

  constructor(
    private readonly opts = { threshold: 0.035, minSpeechMs: 250, endSilenceMs: 900, maxUtteranceMs: 15_000 },
  ) {}

  /** Feed one frame's RMS level; returns what happened in this frame. */
  push(level: number, frameMs: number): "idle" | "start" | "speaking" | "end" {
    if (level >= this.opts.threshold) {
      this.speechMs += frameMs;
      this.silenceMs = 0;
      if (!this.speaking && this.speechMs >= this.opts.minSpeechMs) {
        this.speaking = true;
        return "start";
      }
    } else if (this.speaking) {
      this.silenceMs += frameMs;
    } else {
      this.speechMs = 0; // a click or a cough, not speech
    }
    if (this.speaking) {
      if (this.silenceMs >= this.opts.endSilenceMs || this.speechMs + this.silenceMs >= this.opts.maxUtteranceMs) {
        this.reset();
        return "end";
      }
      return "speaking";
    }
    return "idle";
  }

  reset() {
    this.speaking = false;
    this.speechMs = 0;
    this.silenceMs = 0;
  }
}

// ───────────────────────────── STT ─────────────────────────────

export class ServerSpeechToText implements SpeechToText {
  readonly supported =
    typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onStateChange?: (listening: boolean) => void;
  onError?: SpeechToText["onError"];
  /** 0..1 microphone level, ~30 times a second, for visual feedback. */
  onLevel?: (level: number) => void;

  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private raf: number | null = null;
  private vad = new VoiceActivityDetector();
  private active = false;

  constructor(private readonly opts: { continuous?: boolean } = {}) {}

  async start() {
    if (!this.supported) return this.onError?.("unsupported");
    if (this.active) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        // Echo cancellation keeps the companion's own voice out of the transcript.
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
    } catch (e) {
      const name = (e as DOMException).name;
      return this.onError?.(name === "NotAllowedError" || name === "SecurityError" ? "not-allowed" : "other", name);
    }
    this.active = true;
    this.onStateChange?.(true);

    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(this.stream);
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let last = performance.now();

    const loop = () => {
      if (!this.active) return;
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const rms = Math.sqrt(sum / buf.length);
      this.onLevel?.(Math.min(1, rms * 8));
      const t = performance.now();
      const event = this.vad.push(rms, t - last);
      last = t;
      if (event === "start") this.beginClip();
      if (event === "speaking") this.onInterim?.("…");
      if (event === "end") this.endClip();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.active = false;
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.recorder?.state === "recording" && this.recorder.stop();
    this.recorder = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close();
    this.ctx = null;
    this.vad.reset();
    this.onLevel?.(0);
    this.onStateChange?.(false);
  }

  private beginClip() {
    if (!this.stream) return;
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.recorder.onstop = () => void this.upload(new Blob(this.chunks, { type: this.recorder?.mimeType || mime || "audio/webm" }));
    this.recorder.start();
  }

  private endClip() {
    if (this.recorder?.state === "recording") this.recorder.stop();
    if (!this.opts.continuous) this.stop();
  }

  private async upload(blob: Blob) {
    if (blob.size < 2_000) return; // too short to contain words
    this.onInterim?.("Transcribing…");
    const form = new FormData();
    form.set("audio", new File([blob], "speech", { type: blob.type.split(";")[0] }));
    try {
      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = (await res.json()) as { ok?: boolean; text?: string };
      this.onInterim?.("");
      if (!res.ok || !data.ok) return this.onError?.(res.status === 429 ? "network" : "other", `stt ${res.status}`);
      if (data.text) this.onFinal?.(data.text);
    } catch {
      this.onInterim?.("");
      this.onError?.("network");
    }
  }
}

// ───────────────────────────── TTS ─────────────────────────────

/**
 * Splits a reply into sentence-sized pieces for pipelined speech: piece 1 plays while piece 2
 * renders, so the first word is heard after one short synthesis instead of the whole reply's.
 * Tiny fragments ("Done.") are merged into the next piece, since each request has fixed overhead.
 * Splits only on punctuation followed by whitespace, so "1.7%" stays intact.
 */
export function splitForSpeech(text: string, minChars = 28): string[] {
  const out: string[] = [];
  let carry = "";
  for (const s of text.trim().split(/(?<=[.!?])\s+/)) {
    carry = carry ? `${carry} ${s}` : s;
    if (carry.length >= minChars) {
      out.push(carry);
      carry = "";
    }
  }
  if (carry) out.length ? (out[out.length - 1] += ` ${carry}`) : out.push(carry);
  return out.filter(Boolean);
}

/**
 * Neural TTS via /api/tts (local Kokoro or a provider), with automatic fallback to the browser
 * voice if the server call fails, so a hiccup degrades the voice quality, never the conversation.
 */
export class ServerTextToSpeech implements TextToSpeech {
  readonly supported = typeof window !== "undefined" && typeof Audio !== "undefined";
  muted = false;
  private resolveCurrent: (() => void) | null = null;
  private abort: AbortController | null = null;
  private readonly fallback = new BrowserTextToSpeech();

  get speaking() {
    return this.abort !== null || this.fallback.speaking;
  }

  async speak(text: string, hooks: { onBoundary?: () => void } = {}): Promise<void> {
    this.cancel();
    if (this.muted) {
      this.fallback.muted = true;
      return this.fallback.speak(text, hooks);
    }
    const abort = new AbortController();
    this.abort = abort;
    const parts = splitForSpeech(text);
    const render = (t: string) => {
      const p = fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t }),
        signal: abort.signal,
      }).then((res) => {
        if (!res.ok) throw new Error(`tts ${res.status}`);
        return res.blob();
      });
      p.catch(() => {}); // a prefetch abandoned by cancel() must not surface as an unhandled rejection
      return p;
    };

    let i = 0;
    try {
      let next = render(parts[0]!);
      for (; i < parts.length; i++) {
        const blob = await next;
        if (abort.signal.aborted) return;
        if (i + 1 < parts.length) next = render(parts[i + 1]!);
        hooks.onBoundary?.();
        await this.play(blob);
        if (abort.signal.aborted) return;
      }
    } catch (e) {
      if (abort.signal.aborted || (e as Error).name === "AbortError") return;
      // Say whatever is left with the browser voice rather than going silent mid-reply.
      this.fallback.muted = false;
      await this.fallback.speak(parts.slice(i).join(" "), hooks);
    } finally {
      if (this.abort === abort) this.abort = null;
    }
  }

  private play(blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob);
    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      const done = () => {
        URL.revokeObjectURL(url);
        if (this.resolveCurrent === stop) this.resolveCurrent = null;
        resolve();
      };
      const stop = () => {
        audio.pause();
        done();
      };
      audio.onended = done;
      audio.onerror = done;
      this.resolveCurrent = stop;
      void audio.play().catch(done);
    });
  }

  cancel() {
    this.abort?.abort();
    this.abort = null;
    const r = this.resolveCurrent;
    this.resolveCurrent = null;
    r?.();
    this.fallback.cancel();
  }
}

// ───────────────────────────── Selection ─────────────────────────────

/** Ask the server what it offers; prefer server engines, fall back to Web Speech. */
export async function createVoiceEngines(): Promise<{ stt: SpeechToText & { onLevel?: (l: number) => void }; tts: TextToSpeech & { muted: boolean }; kind: { stt: "server" | "browser"; tts: "server" | "browser" } }> {
  let caps = { stt: false, tts: false };
  try {
    caps = await fetch("/api/voice").then((r) => r.json());
  } catch {
    /* offline → browser engines */
  }
  const serverStt = new ServerSpeechToText({ continuous: true });
  const useServerStt = caps.stt && serverStt.supported;
  return {
    stt: useServerStt ? serverStt : new BrowserSpeechToText({ continuous: true, lang: VOICE_LOCALE }),
    tts: caps.tts ? new ServerTextToSpeech() : new BrowserTextToSpeech(),
    kind: { stt: useServerStt ? "server" : "browser", tts: caps.tts ? "server" : "browser" },
  };
}
