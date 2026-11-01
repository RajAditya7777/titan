import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, limiter, tooMany } from "@/lib/server/rate-limit";
import { synthesize, voiceConfigFromEnv, VoiceProviderError } from "@/lib/server/voice";

export const runtime = "nodejs";

/** Companion lines are short; the cap keeps cost bounded and blocks using this as a free TTS API. */
const Body = z.object({ text: z.string().trim().min(1).max(600) });

/** Text → audio, streamed straight through from the provider. */
export async function POST(req: Request) {
  const rl = limiter("tts", { burst: 10, perMinute: 40 }).take(clientKey(req));
  if (!rl.ok) return tooMany(rl.retryAfterMs);

  const cfg = voiceConfigFromEnv();
  if (!cfg?.ttsModel) return NextResponse.json({ ok: false, error: { code: "NOT_CONFIGURED", message: "Server text-to-speech is off" } }, { status: 501 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "text must be 1-600 characters" } }, { status: 400 });

  try {
    const upstream = await synthesize(cfg, parsed.data.text, AbortSignal.timeout(15_000));
    return new Response(upstream.body, {
      headers: { "content-type": upstream.headers.get("content-type") ?? "audio/wav", "cache-control": "no-store" },
    });
  } catch (err) {
    const status = err instanceof VoiceProviderError ? err.status : 502;
    console.error("[voice] tts failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: { code: "TTS_FAILED", message: "Couldn't synthesize speech", retryable: status >= 500 || status === 429 } }, { status: status === 429 ? 429 : 502 });
  }
}
