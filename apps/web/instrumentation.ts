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
      callTool("reflect_get_protocol_stats", { historyDays: 30 }), // stats + USDC+ pages
      // Every read a page or demo makes on load is warmed: an endpoint with no cached copy has
      // no stale-if-error fallback during an upstream outage (seen: a 502 on whitelabel options).
      callTool("reflect_get_whitelabel_options", {}),
      callTool("reflect_get_protocol_events", { limit: 6 }),
    ]);
    console.info(`[warmup] ${results.map((r) => `${r.tool.replace("reflect_get_", "")}=${r.ok ? "ok" : "fail"}`).join(" ")} ${Date.now() - started}ms`);
    return results.every((r) => r.ok);
  };

  // Network can be briefly unavailable right at process start (seen: every upstream call failing
  // in <40ms on a production boot, succeeding seconds later). Retry soon instead of waiting a minute.
  const warmWithRetry = async (delays = [5_000, 15_000]) => {
    if (await warm().catch(() => false)) return;
    for (const d of delays) {
      await new Promise((r) => setTimeout(r, d));
      if (await warm().catch(() => false)) return;
    }
  };

  // Don't block startup. Refreshing once a minute keeps the stale-if-error fallback recent at
  // ~8 upstream requests/minute; matching the 15s cache TTL would quadruple that for little gain.
  setTimeout(() => void warmWithRetry(), 1_000);
  const timer = setInterval(() => void warm().catch(() => {}), 60_000);
  timer.unref?.();
}
