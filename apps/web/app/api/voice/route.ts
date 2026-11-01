import { NextResponse } from "next/server";
import { ttsEngineFromEnv, voiceConfigFromEnv } from "@/lib/server/voice";

export const runtime = "nodejs";

/** Tells the browser which server voice engines exist, so it can pick adapters (else Web Speech). */
export async function GET() {
  const engine = ttsEngineFromEnv();
  return NextResponse.json({ stt: Boolean(voiceConfigFromEnv()?.sttModel), tts: engine !== null, ttsEngine: engine });
}
