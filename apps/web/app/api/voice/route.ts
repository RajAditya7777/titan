import { NextResponse } from "next/server";
import { voiceConfigFromEnv } from "@/lib/server/voice";

export const runtime = "nodejs";

/** Tells the browser which server voice engines exist, so it can pick adapters (else Web Speech). */
export async function GET() {
  const cfg = voiceConfigFromEnv();
  return NextResponse.json({ stt: Boolean(cfg?.sttModel), tts: Boolean(cfg?.ttsModel) });
}
