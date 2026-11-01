"use client";

/**
 * Audio layer, deliberately separate from orchestration: the engine only sees these two
 * interfaces. Swap BrowserSpeechToText for a realtime/cloud adapter (Deepgram, OpenAI
 * Realtime, Azure…) by implementing the same interface behind a server-issued token.
 */

export interface SpeechToText {
  readonly supported: boolean;
  start(): void;
  stop(): void;
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onStateChange?: (listening: boolean) => void;
  onError?: (kind: "not-allowed" | "no-speech" | "network" | "unsupported" | "other", detail?: string) => void;
}

export interface TextToSpeech {
  readonly supported: boolean;
  /** Resolves when speech finishes or is cancelled. */
  speak(text: string, hooks?: { onBoundary?: () => void }): Promise<void>;
  cancel(): void;
  readonly speaking: boolean;
}

// ───────────────────────────── Web Speech: recognition ─────────────────────────────

type RecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

export class BrowserSpeechToText implements SpeechToText {
  readonly supported: boolean;
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onStateChange?: (listening: boolean) => void;
  onError?: SpeechToText["onError"];

  private rec: InstanceType<RecognitionCtor> | null = null;
  private wanted = false;
  private restarts = 0;

  /** `continuous` keeps the mic open (hands-free); the browser still ends sessions on silence, so we restart. */
  constructor(private readonly opts: { lang?: string; continuous?: boolean } = {}) {
    const w = typeof window !== "undefined" ? (window as any) : {};
    const Ctor: RecognitionCtor | undefined = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    this.supported = Boolean(Ctor);
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = opts.lang ?? "en-US";
    rec.continuous = opts.continuous ?? false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => this.onStateChange?.(true);
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) this.onFinal?.(r[0].transcript.trim());
        else interim += r[0].transcript;
      }
      if (interim) this.onInterim?.(interim.trim());
      this.restarts = 0;
    };
    rec.onerror = (e: any) => {
      const kind = e.error === "not-allowed" || e.error === "service-not-allowed" ? "not-allowed" : e.error === "no-speech" ? "no-speech" : e.error === "network" ? "network" : "other";
      if (kind === "not-allowed") this.wanted = false;
      if (kind !== "no-speech") this.onError?.(kind, e.error);
    };
    rec.onend = () => {
      // Browsers end recognition after silence. Restart while the user still wants hands-free,
      // with a cap so a persistent failure can't spin.
      if (this.wanted && this.opts.continuous && this.restarts < 20) {
        this.restarts++;
        setTimeout(() => this.wanted && this.safeStart(), 250);
        return;
      }
      this.wanted = false;
      this.onStateChange?.(false);
    };
    this.rec = rec;
  }

  start() {
    if (!this.rec) return this.onError?.("unsupported");
    this.wanted = true;
    this.restarts = 0;
    this.safeStart();
  }

  stop() {
    this.wanted = false;
    this.rec?.abort();
    this.onStateChange?.(false);
  }

  private safeStart() {
    try {
      this.rec?.start();
    } catch {
      /* already started: harmless */
    }
  }
}

// ───────────────────────────── Web Speech: synthesis ─────────────────────────────

export class BrowserTextToSpeech implements TextToSpeech {
  readonly supported = typeof window !== "undefined" && "speechSynthesis" in window;
  private current: SpeechSynthesisUtterance | null = null;
  private resolveCurrent: (() => void) | null = null;
  muted = false;

  get speaking() {
    return this.current !== null;
  }

  /** Prefer natural-sounding English voices when the OS provides them. */
  private pickVoice(): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis.getVoices();
    const preferred = [/Samantha/i, /Google US English/i, /Microsoft (Aria|Jenny)/i, /Ava/i, /Allison/i, /Karen/i, /Daniel/i];
    for (const re of preferred) {
      const v = voices.find((x) => re.test(x.name) && x.lang.startsWith("en"));
      if (v) return v;
    }
    return voices.find((v) => v.lang.startsWith("en") && v.localService) ?? voices.find((v) => v.lang.startsWith("en"));
  }

  speak(text: string, hooks: { onBoundary?: () => void } = {}): Promise<void> {
    this.cancel();
    // Muted or unsupported: still "take time", so captions remain readable and pacing holds.
    if (!this.supported || this.muted) {
      return new Promise((resolve) => {
        const ms = Math.min(9_000, 900 + text.split(/\s+/).length * 230);
        const timer = setTimeout(resolve, ms);
        this.resolveCurrent = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    }
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      const voice = this.pickVoice();
      if (voice) u.voice = voice;
      u.rate = 1.04;
      u.pitch = 1.08;
      u.onboundary = () => hooks.onBoundary?.();
      const done = () => {
        if (this.current === u) this.current = null;
        this.resolveCurrent = null;
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      this.current = u;
      this.resolveCurrent = done;
      window.speechSynthesis.speak(u);
      // Chrome bug: long utterances can stall silently. Resolve on a generous timeout.
      setTimeout(() => this.current === u && done(), 4_000 + text.length * 90);
    });
  }

  cancel() {
    if (this.supported) window.speechSynthesis.cancel();
    this.current = null;
    const r = this.resolveCurrent;
    this.resolveCurrent = null;
    r?.();
  }
}

/** Heuristic echo filter: ignore what the mic hears if it's just the companion's own voice. */
export function isLikelyEcho(heard: string, spoken: string | null): boolean {
  if (!spoken) return false;
  const words = heard.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const said = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const overlap = words.filter((w) => said.includes(w)).length / words.length;
  return overlap >= 0.6;
}
