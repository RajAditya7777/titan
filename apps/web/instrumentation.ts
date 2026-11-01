/**
 * Runs once when the Next.js server starts. Warms the MCP connection and keeps the hot read
 * paths cached, so the first page view and the companion's first answer are fast instead of
 * paying for a cold MCP spawn plus slow upstream calls.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.COMPANION_WARMUP === "off") return;

  const { callTool } = await import("./lib/server/mcp-client");
  const warm = async () => {
    const started = Date.now();
    const results = await Promise.all([
      callTool("reflect_get_stablecoin_overview", {}),
      callTool("reflect_get_protocol_stats", {}),
    ]);
    console.info(`[warmup] ${results.map((r) => `${r.tool.replace("reflect_get_", "")}=${r.ok ? "ok" : "fail"}`).join(" ")} ${Date.now() - started}ms`);
  };

  // Don't block startup. Refreshing once a minute keeps the stale-if-error fallback recent at
  // ~4 upstream requests/minute; matching the 15s cache TTL would quadruple that for little gain.
  setTimeout(() => void warm().catch(() => {}), 1_000);
  const timer = setInterval(() => void warm().catch(() => {}), 60_000);
  timer.unref?.();
}
