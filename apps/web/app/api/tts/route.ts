import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, limiter, tooMany } from "@/lib/server/rate-limit";
import { kokoro, kokoroConfigFromEnv, speechText, TtsBusyError } from "@/lib/server/tts/kokoro";
import { synthesize, ttsEngineFromEnv, voiceConfigFromEnv, VoiceProviderError } from "@/lib/server/voice";

export const runtime = "nodejs";

/** Companion lines are short; the cap keeps cost bounded and blocks using this as a free TTS API. */
const Body = z.object({ text: z.string().trim().min(1).max(600) });

/** Text → audio. Any failure is a 5xx, and the browser falls back to its own voice. */
export async function POST(req: Request) {
  const rl = limiter("tts", { burst: 20, perMinute: 80 }).take(clientKey(req));
  if (!rl.ok) return tooMany(rl.retryAfterMs);

  const engine = ttsEngineFromEnv();
  if (!engine) return NextResponse.json({ ok: false, error: { code: "NOT_CONFIGURED", message: "Server text-to-speech is off" } }, { status: 501 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "text must be 1-600 characters" } }, { status: 400 });

  const started = Date.now();
  try {
    if (engine === "kokoro") {
      const wav = await kokoro.synth(speechText(parsed.data.text), kokoroConfigFromEnv());
      console.info(`[voice] tts kokoro ${parsed.data.text.length} chars ${Date.now() - started}ms`);
      return new Response(new Uint8Array(wav), { headers: { "content-type": "audio/wav", "cache-control": "no-store" } });
    }
    const upstream = await synthesize(voiceConfigFromEnv()!, parsed.data.text, AbortSignal.timeout(15_000));
    return new Response(upstream.body, {
      headers: { "content-type": upstream.headers.get("content-type") ?? "audio/wav", "cache-control": "no-store" },
    });
  } catch (err) {
    const status = err instanceof VoiceProviderError ? err.status : err instanceof TtsBusyError ? 503 : 502;
    console.error(`[voice] tts (${engine}) failed:`, (err as Error).message);
    return NextResponse.json(
      { ok: false, error: { code: "TTS_FAILED", message: "Couldn't synthesize speech", retryable: status >= 500 || status === 429 } },
      { status: status === 429 ? 429 : status === 503 ? 503 : 502 },
    );
  }
}
