import { NextResponse } from "next/server";
import { clientKey, limiter, tooMany } from "@/lib/server/rate-limit";
import { transcribe, voiceConfigFromEnv, VoiceProviderError } from "@/lib/server/voice";

export const runtime = "nodejs";

/** ~60s of compressed speech. Anything larger is not a voice command. */
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = /^audio\/(webm|ogg|mp4|mpeg|wav|x-wav|m4a|aac)(;.*)?$/;

/** Browser audio → text. The provider key stays on the server. */
export async function POST(req: Request) {
  const rl = limiter("stt", { burst: 6, perMinute: 20 }).take(clientKey(req));
  if (!rl.ok) return tooMany(rl.retryAfterMs);

  const cfg = voiceConfigFromEnv();
  if (!cfg?.sttModel) return NextResponse.json({ ok: false, error: { code: "NOT_CONFIGURED", message: "Server speech-to-text is off" } }, { status: 501 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof Blob)) return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "Missing audio" } }, { status: 400 });
  if (file.size === 0 || file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "Audio is empty or too long" } }, { status: 413 });
  if (!ALLOWED.test(file.type)) return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: `Unsupported audio type ${file.type || "unknown"}` } }, { status: 415 });

  const ext = file.type.includes("wav") ? "wav" : file.type.includes("mp4") || file.type.includes("m4a") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
  const started = Date.now();
  try {
    const text = await transcribe(cfg, file, `speech.${ext}`, AbortSignal.timeout(15_000));
    console.info(`[voice] stt ${file.size}B ${Date.now() - started}ms`);
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    const status = err instanceof VoiceProviderError ? err.status : 502;
    console.error("[voice] stt failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: { code: "STT_FAILED", message: "Couldn't transcribe that", retryable: status >= 500 || status === 429 } }, { status: status === 429 ? 429 : 502 });
  }
}
