# Phase 04: mcp-kit and titan-companion-mcp
**Objective:** A verified, read-only Titan MCP server (facts: `RESEARCH_TITAN_UMBRA.md` § Titan).

**Steps**
1. `packages/mcp-kit`: extract `defineTool`, `ok`, `fail`, `failFrom` and `Provenance` (add `"mock"`) from `packages/mcp-server/src/tool.ts`. Add a `createServer(name, tools, ctx)` helper. Unit tests.
2. `packages/titan-mcp` (server name `titan-companion-mcp`, stdio `src/bin.ts`). Tools as listed in `TARGET_ARCHITECTURE.md`.
   - `titan_get_quote`:
     - If `TITAN_API_KEY` and `TITAN_QUOTE_PUBKEY` are set: GET `https://portal.api.titan.exchange/api/v1/quote/swap` with `Accept: application/json` and header `x-api-key`.
     - Pick `metadata.ExpectedWinner` from the `quotes` object.
     - Return `{inAmount, outAmount, priceImpact?, routeSummary, provider, slippageBps, provenance:"live"}`.
     - 2 s cache plus coalescing, a 1 req/s token bucket, and 429 handling per the documented codes.
     - Otherwise return a deterministic mock: static, labelled demo prices; impact grows with size; `provenance:"mock", simulated:true`.
   - `titan_list_dart_markets`: GET `https://api.titan.exchange/dart/markets` (no key), cache 10 min. **Never call `/swap`.**
   - Static tools read `src/knowledge/*.ts` (paraphrased docs with source URLs).
3. `apps/web/lib/server/mcp-client.ts` → a registry `{titan, umbra?}`, each lazily spawned. `callTool(server, tool, args)`. Keep the Reflect server registered until Phase 08.

**Tests:** handlers with an injected fetch (live JSON fixture, 401, 404 `-7`, 429), mock determinism, and that no tool name maps to POST.

**Acceptance:** `pnpm --filter titan-mcp test` green, plus a smoke script listing the tools over stdio.
