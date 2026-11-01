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
    ttsModel: env.TTS_MODEL || null,
    ttsVoice: env.TTS_VOICE || "alloy",
  };
}

/**
 * Domain vocabulary biases recognition toward the words this product actually uses
 * (without it, Whisper hears "mint" as "mend").
 */
export const STT_VOCABULARY =
  "Reflect, Reflect Money, USDC, USDC+, USDT+, mint, redeem, APY, yield, yieldcoin, whitelabel, stablecoin, Solana, basis points.";

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
  form.set("language", "en");
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
  if (/^(thank you\.?|thanks for watching!?|you|\.+)$/i.test(t)) return "";
  return applyDomainCorrections(t);
}

/**
 * Narrow fixes for product words speech models mishear. Each rule requires context that only makes
 * sense in this app (an amount or token after it), so ordinary speech ("I changed my mind") is untouched.
 */
export function applyDomainCorrections(text: string): string {
  return text
    .replace(/\b(mend|mind|meant|mins?|minced)\b(?=\s+(\d|one|two|three|four|five|ten|twenty|fifty|a hundred|hundred|some|usdc|usdt))/gi, "mint")
    .replace(/\bU\.?\s?S\.?\s?D\.?\s?C\.?\s?(\+|plus)/gi, "USDC+")
    .replace(/\bU\.?\s?S\.?\s?D\.?\s?T\.?\s?(\+|plus)/gi, "USDT+")
    .replace(/\b(re-?deem|redeam)\b/gi, "redeem")
    .replace(/\byield ?coin\b/gi, "yieldcoin");
}
