import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ReflectClient } from "@companion/reflect-api";
import { createReflectMcpServer, TOOLS } from "../src/server";
import { __resetDocsCache, parseLlmsTxt, rankDocs } from "../src/tools/developer";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Route table that mimics the live API responses captured on 2026-11-01. */
function fakeReflectFetch(overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const { pathname } = new URL(url);
    const key = `${init?.method ?? "GET"} ${pathname}`;
    if (overrides[key]) return overrides[key]();
    switch (key) {
      case "GET /stablecoin/types":
        return json({ success: true, data: [{ index: 0, name: "USDC+" }, { index: 1, name: "USDT+" }] });
      case "GET /stablecoin/limits":
        return json({
          success: true,
          data: [{ index: 0, supplyCap: 10_000_000_000_000, currentSupply: 1_501_486, remainingCapacity: 9_999_998_498_514, utilizationPercentage: 0 }],
        });
      case "GET /stablecoin/exchange-rates":
        return json({
          success: true,
          data: [{ id: 1, stablecoin: 0, base_usd_value_bps: 1_012_847_375, receipt_usd_value_bps: 1_012_847_274, timestamp: "2026-11-01T10:36:08Z" }],
        });
      case "GET /stablecoin/0/apy":
        return json({ success: true, data: { index: 0, apy: 172.94, timestamp: "2026-11-01T10:35:41Z" } });
      case "POST /stablecoin/quote/mint":
        return json({ success: true, data: 99_164_212 });
      case "POST /stablecoin/quote/redeem":
        return json({ success: true, data: 100_842_831 });
      case "POST /stablecoin/mint":
        return json({ success: true, data: { transaction: "AQAAAA==" } });
      case "GET /stats":
        return json({
          success: true,
          data: { users: 6559, supply: "1866486207333", cumulativeVolume: "50075793", tvl: 1, tvlBreakdown: [], totalYieldDistributed: 830101 },
        });
      default:
        return json({ error: "Route not found", statusCode: 404 }, 404);
    }
  });
}

async function connect(fetchImpl = fakeReflectFetch(), docsFetch?: typeof fetch) {
  const reflect = new ReflectClient({ fetch: fetchImpl as typeof fetch, cacheTtlMs: 0, sleep: async () => {} });
  const server = createReflectMcpServer({ context: { reflect, fetch: docsFetch ?? (fetchImpl as typeof fetch) } });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(a), client.connect(b)]);
  return { client, fetchImpl };
}

const structured = (r: unknown) => (r as { structuredContent: any }).structuredContent;

describe("Reflect MCP server", () => {
  it("lists every tool with a description and read-only annotation", async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(TOOLS.map((t) => t.name).sort());
    for (const t of tools) {
      expect(t.description!.length).toBeGreaterThan(40);
      expect(t.annotations?.readOnlyHint).toBe(true);
      expect(t.annotations?.destructiveHint).toBe(false);
    }
  });

  it("overview converts bps APY and 1e9 exchange rate, marks provenance live", async () => {
    const { client } = await connect();
    const r = structured(await client.callTool({ name: "reflect_get_stablecoin_overview", arguments: { asset: "USDC+" } }));
    expect(r).toMatchObject({ ok: true, provenance: "live" });
    expect(r.stablecoins[0]).toMatchObject({
      symbol: "USDC+",
      apy: { percent: 1.73, rawBps: 172.94 },
      exchangeRate: { usdPerToken: 1.012847 },
      supply: { utilizationPercent: 0 },
    });
  });

  it("mint quote converts human amount → base units and back, with implied rate", async () => {
    const { client, fetchImpl } = await connect();
    const r = structured(await client.callTool({ name: "reflect_get_mint_quote", arguments: { amount: "100" } }));
    expect(r.expectedOutput).toEqual({ amount: 99.164212, token: "USDC+" });
    expect(r.input).toEqual({ amount: 100, token: "USDC" });
    expect(r.impliedRate.value).toBeCloseTo(1.00843, 4);
    expect(r.limits.withinCap).toBe(true);
    const quoteCall = fetchImpl.mock.calls.find(([u]) => String(u).includes("/quote/mint"))!;
    expect(JSON.parse(String(quoteCall[1]!.body))).toEqual({ stablecoinIndex: 0, depositAmount: 100_000_000 });
  });

  it("rejects invalid amounts at the schema boundary without calling the API", async () => {
    const { client, fetchImpl } = await connect();
    const r = await client.callTool({ name: "reflect_get_mint_quote", arguments: { amount: "-5" } });
    expect(r.isError).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("prepare_transaction returns an unsigned tx with a non-zero slippage floor", async () => {
    const { client, fetchImpl } = await connect();
    const r = structured(
      await client.callTool({
        name: "reflect_prepare_transaction",
        arguments: { action: "mint", amount: "100", walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", slippageBps: 50 },
      }),
    );
    expect(r).toMatchObject({ ok: true, signed: false, submitted: false, unsignedTransactionBase64: "AQAAAA==" });
    const build = fetchImpl.mock.calls.find(([u]) => String(u).includes("/stablecoin/mint"))!;
    const body = JSON.parse(String(build[1]!.body));
    expect(body.minimumReceived).toBe(Math.floor((99_164_212 * 9_950) / 10_000));
    expect(body.minimumReceived).toBeGreaterThan(0);
  });

  it("prepare_transaction refuses anything that is not a public key", async () => {
    const { client } = await connect();
    const r = await client.callTool({
      name: "reflect_prepare_transaction",
      arguments: { action: "mint", amount: "1", walletAddress: "not a key!" },
    });
    expect(r.isError).toBe(true);
  });

  it("turns upstream failures into structured, retryable errors", async () => {
    const { client } = await connect(
      fakeReflectFetch({ "GET /stats": () => json({ error: "overloaded", statusCode: 503 }, 503) }),
    );
    const r = await client.callTool({ name: "reflect_get_protocol_stats", arguments: {} });
    expect(r.isError).toBe(true);
    expect(structured(r).error).toMatchObject({ code: "UPSTREAM_ERROR", retryable: true });
  });

  it("protocol stats: supply is in base units, volume and yield are already USD", async () => {
    const { client } = await connect();
    const r = structured(await client.callTool({ name: "reflect_get_protocol_stats", arguments: {} }));
    expect(r.totalSupply).toBeCloseTo(1_866_486.207333, 6);
    expect(r.cumulativeVolume).toBe(50_075_793);
    expect(r.totalYieldDistributed).toBe(830_101);
  });

  it("check_integration flags the stale body shape and 9-decimal mistakes", async () => {
    const { client } = await connect();
    const r = structured(
      await client.callTool({
        name: "reflect_check_integration",
        arguments: { operation: "mint", requestBody: { index: 0, amount: 100_000_000_000 }, humanAmount: 100 },
      }),
    );
    expect(r.valid).toBe(false);
    const messages = r.findings.map((f: { message: string }) => f.message).join("\n");
    expect(messages).toMatch(/"index" is not accepted/);
    expect(messages).toMatch(/9 decimals/);
  });

  it("explain_error matches documented errors and admits unknown ones", async () => {
    const { client } = await connect();
    const known = structured(
      await client.callTool({ name: "reflect_explain_error", arguments: { message: "Stablecoin index is required", httpStatus: 400 } }),
    );
    expect(known.matches[0].id).toBe("index-required");
    const unknown = structured(await client.callTool({ name: "reflect_explain_error", arguments: { message: "quantum flux" } }));
    expect(unknown.matched).toBe(false);
  });

  it("get_documentation ranks entries from llms.txt", async () => {
    __resetDocsCache();
    const docs = vi.fn(async () => new Response("- [Get quote for mint or redeem](https://d/q.md): Get a quote\n- [Health](https://d/h.md): ok"));
    const { client } = await connect(fakeReflectFetch(), docs as unknown as typeof fetch);
    const r = structured(await client.callTool({ name: "reflect_get_documentation", arguments: { query: "mint quote" } }));
    expect(r.results[0].url).toBe("https://d/q.md");
  });
});

describe("docs helpers", () => {
  it("parses llms.txt lines and ignores headings", () => {
    const entries = parseLlmsTxt("# Title\n- [A](https://a): x\n## OpenAPI\n- [B](https://b)");
    expect(entries).toHaveLength(2);
    expect(rankDocs(entries, "zzz", 5)).toEqual([]);
  });
});
