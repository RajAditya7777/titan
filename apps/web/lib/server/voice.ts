import "server-only";

/**
 * Server-side speech providers (OpenAI-compatible audio APIs: Groq, OpenAI, …).
 * Keys never reach the browser: the browser sends audio/text to our routes, which call these.
 * Each capability is opt-in via env, so an unconfigured server cleanly falls back to the
 * browser's built-in Web Speech engine.
 */

export interface VoiceConfig {
  baseUrl: string;
  apiKey: string;
  sttModel: string | null;
  /** ISO-639-1 hint ("en"). Pinning it stops Whisper guessing Hindi on accented English and
   *  replying in Devanagari; set STT_LANGUAGE=auto to let it detect. */
  sttLanguage: string | null;
  ttsModel: string | null;
  ttsVoice: string;
}

export function voiceConfigFromEnv(env = process.env): VoiceConfig | null {
  const apiKey = env.VOICE_API_KEY || env.LLM_API_KEY;
  if (!apiKey) return null;
  return {
    baseUrl: (env.VOICE_BASE_URL || env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    apiKey,
    sttModel: env.STT_MODEL || null,
    sttLanguage: env.STT_LANGUAGE === "auto" ? null : env.STT_LANGUAGE || "en",
    ttsModel: env.TTS_MODEL || null,
    ttsVoice: env.TTS_VOICE || "alloy",
  };
}

/**
 * Which text-to-speech engine serves /api/tts:
 * - "provider": an OpenAI-compatible speech API (needs TTS_MODEL and a key);
 * - "kokoro": the local open-source model (default: no key, no per-request cost);
 * - null: off, the browser speaks with its own voice.
 */
export type TtsEngine = "provider" | "kokoro" | null;

export function ttsEngineFromEnv(env = process.env): TtsEngine {
  const choice = env.TTS_ENGINE || (env.TTS_MODEL ? "provider" : "kokoro");
  if (choice === "off") return null;
  if (choice === "provider") return voiceConfigFromEnv(env)?.ttsModel ? "provider" : null;
  return "kokoro";
}

/**
 * Whisper treats the prompt as "the text that came before", so a natural sentence using the
 * product's words biases it better than a bare word list (without it, "mint" comes back as "mend"
 * or "Ming"). Measured on Indian-English clips: 16.3% → 9.2% word errors with whisper-large-v3.
 */
export const STT_VOCABULARY =
  "Hi, I'd like to mint 100 USDC into USDC+ on Reflect. Redeem my USDC+, show the APY and yield, create a whitelabel yieldcoin on Solana, explain the stablecoin risks.";

export class VoiceProviderError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`Voice provider returned HTTP ${status}${detail ? `: ${detail}` : ""}`);
  }
}

async function providerError(res: Response) {
  const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return new VoiceProviderError(res.status, (body?.error?.message ?? "").slice(0, 200));
}

export async function transcribe(cfg: VoiceConfig, audio: Blob, filename: string, signal?: AbortSignal): Promise<string> {
  if (!cfg.sttModel) throw new VoiceProviderError(501, "speech-to-text is not configured");
  const form = new FormData();
  form.set("model", cfg.sttModel);
  form.set("response_format", "json");
  if (cfg.sttLanguage) form.set("language", cfg.sttLanguage);
  form.set("temperature", "0");
  form.set("prompt", STT_VOCABULARY);
  form.set("file", audio, filename);
  const res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.apiKey}` },
    body: form,
    signal,
  });
  if (!res.ok) throw await providerError(res);
  const json = (await res.json()) as { text?: string };
  return normaliseTranscript(json.text ?? "");
}

export async function synthesize(cfg: VoiceConfig, text: string, signal?: AbortSignal): Promise<Response> {
  if (!cfg.ttsModel) throw new VoiceProviderError(501, "text-to-speech is not configured");
  const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: cfg.ttsModel, voice: cfg.ttsVoice, input: text, response_format: "wav" }),
    signal,
  });
  if (!res.ok) throw await providerError(res);
  return res;
}

/**
 * Whisper quirks: leading space, trailing period on commands ("Stop."), and hallucinated
 * sign-offs on silence ("Thank you.", "you"). Silence must become empty, not a fake utterance.
 */
export function normaliseTranscript(text: string): string {
  const t = text.trim();
  if (/^(thank you\.?|(thank you|thanks) for watching[.!]?|you|\.+)$/i.test(t)) return "";
  return applyDomainCorrections(t);
}

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, five: 5, ten: 10 };

/**
 * Narrow fixes for product words speech models mishear. Each rule requires context that only makes
 * sense in this app (an amount or token after it), so ordinary speech ("I changed my mind") is untouched.
 * Indian-English amounts in lakhs ("mint 1 lakh") become plain numbers the quote tools accept.
 */
export function applyDomainCorrections(text: string): string {
  return text
    .replace(/\b(\d+(?:\.\d+)?|one|two|five|ten)\s+lakhs?\b/gi, (_, n: string) => String(Math.round(Number(WORD_NUMBERS[n.toLowerCase()] ?? n) * 100_000)))
    .replace(/\b(mend|mind|meant|mins?|minced|ming|men)\b(?=\s+(\d|one|two|three|four|five|ten|twenty|fifty|a hundred|hundred|some|usdc|usdt))/gi, "mint")
    .replace(/\bU\.?\s?S\.?\s?D\.?\s?C\.?\s?(\+|plus)/gi, "USDC+")
    .replace(/\bU\.?\s?S\.?\s?D\.?\s?T\.?\s?(\+|plus)/gi, "USDT+")
    .replace(/\b(re-?deem|redeam)\b/gi, "redeem")
    .replace(/\byield ?coin\b/gi, "yieldcoin")
    .replace(/\bA\.?\s?P\.?\s?Y\b/g, "APY");
}
