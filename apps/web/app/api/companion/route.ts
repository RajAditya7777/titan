import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, limiter, tooMany } from "@/lib/server/rate-limit";
import { PAGE_IDS, getElement } from "@/lib/companion/registry";
import { runTurn } from "@/lib/server/llm/orchestrator";
import { providerFromEnv } from "@/lib/server/llm/provider";

export const runtime = "nodejs";

const Body = z.object({
  utterance: z.string().trim().min(1).max(1_000),
  page: z.enum(PAGE_IDS as [string, ...string[]]),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2_000) })).max(20).default([]),
  fields: z.record(z.string(), z.string().max(64)).default({}),
});

export async function POST(req: Request) {
  // Protects the LLM / upstream quota from scripts; generous enough for a real conversation.
  const rl = limiter("companion", { burst: 8, perMinute: 30 }).take(clientKey(req));
  if (!rl.ok) return tooMany(rl.retryAfterMs);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues.slice(0, 3) }, { status: 400 });
  }
  // Only registered, fillable fields are forwarded to the model.
  const fields = Object.fromEntries(Object.entries(parsed.data.fields).filter(([id]) => getElement(id)?.fillable));
  const reply = await runTurn({ ...parsed.data, page: parsed.data.page as never, fields }, providerFromEnv());
  return NextResponse.json(reply);
}

export async function GET() {
  const provider = providerFromEnv();
  return NextResponse.json({ engine: provider ? "llm" : "rules", provider: provider?.name ?? null });
}
