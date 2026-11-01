import { NextResponse } from "next/server";
import { z } from "zod";
import { BROWSER_CALLABLE_TOOLS } from "@/lib/companion/actions";
import { callTool, listTools } from "@/lib/server/mcp-client";

export const runtime = "nodejs";

/** Browser → MCP bridge, restricted to an allow-list of read-only tools. */
const Body = z.object({
  tool: z.enum(BROWSER_CALLABLE_TOOLS),
  args: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "Tool not allowed or bad arguments" } }, { status: 400 });
  const outcome = await callTool(parsed.data.tool, parsed.data.args);
  return NextResponse.json({ ...outcome.data, ms: outcome.ms }, { status: outcome.ok ? 200 : 502 });
}

/** Health/status: proves the MCP server is up and lists its tools. */
export async function GET() {
  try {
    const { tools, transport } = await listTools();
    return NextResponse.json({ connected: true, transport, tools: tools.map((t) => ({ name: t.name, title: t.title })) });
  } catch (err) {
    return NextResponse.json({ connected: false, error: (err as Error).message }, { status: 503 });
  }
}
