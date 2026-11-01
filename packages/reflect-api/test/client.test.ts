import { describe, expect, it, vi } from "vitest";
import { ReflectApiError, ReflectClient, toBaseUnits, fromBaseUnits, exchangeRateToNumber } from "../src";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function makeClient(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>, extra = {}) {
  const sleep = vi.fn(async () => {});
  const client = new ReflectClient({ fetch: fetchImpl as typeof fetch, sleep, cacheTtlMs: 0, ...extra });
  return { client, sleep };
}

describe("ReflectClient", () => {
  it("unwraps the `data` envelope and validates it", async () => {
    const fetch = vi.fn(async () => jsonResponse({ success: true, data: [{ index: 0, name: "USDC+" }] }));
    const { client } = makeClient(fetch);
    await expect(client.getStablecoinTypes()).resolves.toEqual([{ index: 0, name: "USDC+" }]);
  });

  it("sends the documented quote body (stablecoinIndex/depositAmount), not the stale skill shape", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ success: true, data: 99_164_212 }));
    const { client } = makeClient(fetch);
    await expect(client.quote("mint", 0, 100_000_000)).resolves.toBe(99_164_212);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://prod.api.reflect.money/stablecoin/quote/mint");
    expect(JSON.parse(String(init?.body))).toEqual({ stablecoinIndex: 0, depositAmount: 100_000_000 });
  });

  it("retries idempotent reads on 5xx and succeeds", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "boom", statusCode: 503 }, 503))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { index: 0, apy: 172.94, timestamp: "t" } }));
    const { client, sleep } = makeClient(fetch);
    await expect(client.getApy(0)).resolves.toMatchObject({ apy: 172.94 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("never retries 4xx client errors and surfaces the upstream message", async () => {
    const fetch = vi.fn(async () => jsonResponse({ error: "Stablecoin index is required", statusCode: 400 }, 400));
    const { client } = makeClient(fetch);
    const err = await client.quote("mint", 0, 1).catch((e) => e);
    expect(err).toBeInstanceOf(ReflectApiError);
    expect(err).toMatchObject({ code: "BAD_REQUEST", status: 400, retryable: false, message: "Stablecoin index is required" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("treats 429 as retryable RATE_LIMITED and gives up after maxRetries", async () => {
    const fetch = vi.fn(async () => jsonResponse({ error: "slow down", statusCode: 429 }, 429));
    const { client } = makeClient(fetch, { maxRetries: 2 });
    await expect(client.getProtocolStats()).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("never retries transaction building, even on 5xx", async () => {
    const fetch = vi.fn(async () => jsonResponse({ error: "down", statusCode: 500 }, 500));
    const { client } = makeClient(fetch);
    await expect(
      client.buildTransaction("mint", { stablecoinIndex: 0, depositAmount: 1, signer: "x", minimumReceived: 1 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("maps an aborted request to TIMEOUT", async () => {
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))),
    );
    const { client } = makeClient(fetch, { readTimeoutMs: 10, maxRetries: 0 });
    await expect(client.getSupplyLimits()).rejects.toMatchObject({ code: "TIMEOUT", retryable: true });
  });

  it("rejects responses whose shape drifted instead of passing garbage downstream", async () => {
    const fetch = vi.fn(async () => jsonResponse({ success: true, data: { unexpected: true } }));
    const { client } = makeClient(fetch);
    await expect(client.getSupplyLimits()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("reads the `events` envelope for /events", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ success: true, events: [{ id: 1, type: "Mint", timestamp: "2026-01-01T00:00:00Z" }] }),
    );
    const { client } = makeClient(fetch);
    await expect(client.getRecentEvents(1)).resolves.toHaveLength(1);
  });

  it("caches GETs and coalesces concurrent identical reads", async () => {
    const fetch = vi.fn(async () => jsonResponse({ success: true, data: [] }));
    const client = new ReflectClient({ fetch: fetch as typeof fetch, cacheTtlMs: 60_000 });
    await Promise.all([client.getExchangeRates(), client.getExchangeRates()]);
    await client.getExchangeRates();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("logs without request bodies", async () => {
    const logger = vi.fn();
    const fetch = vi.fn(async () => jsonResponse({ success: true, data: { transaction: "AQ==" } }));
    const { client } = makeClient(fetch, { logger });
    await client.buildTransaction("mint", { stablecoinIndex: 0, depositAmount: 1, signer: "SECRETISHPUBKEY", minimumReceived: 1 });
    expect(JSON.stringify(logger.mock.calls)).not.toContain("SECRETISHPUBKEY");
  });
});

describe("units", () => {
  it("converts decimal strings to 6-decimal base units exactly", () => {
    expect(toBaseUnits("100")).toBe(100_000_000);
    expect(toBaseUnits("0.000001")).toBe(1);
    expect(toBaseUnits("1.1")).toBe(1_100_000);
    expect(fromBaseUnits(99_164_212)).toBeCloseTo(99.164212, 6);
  });

  it("refuses ambiguous amounts instead of rounding", () => {
    expect(() => toBaseUnits("1.0000001")).toThrow(RangeError);
    expect(() => toBaseUnits("-1")).toThrow(RangeError);
    expect(() => toBaseUnits("abc")).toThrow(RangeError);
  });

  it("scales exchange rates by 1e9", () => {
    expect(exchangeRateToNumber(1_012_847_375)).toBeCloseTo(1.012847375, 9);
  });
});
