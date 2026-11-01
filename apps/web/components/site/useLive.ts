"use client";

import { useEffect, useState } from "react";

export interface LiveCoin {
  symbol: string;
  underlying: string | null;
  apy: { percent: number } | null;
  exchangeRate: { usdPerToken: number } | null;
}

type Status = { state: "loading" } | { state: "ok"; coins: LiveCoin[] } | { state: "error" };

const TTL_MS = 60_000;
let cache: { at: number; promise: Promise<LiveCoin[]> } | null = null;

/**
 * One overview request per minute per tab, shared by every widget on the page (header pill,
 * simulators, cards). Goes through the read-only /api/mcp bridge, so the browser never talks
 * to Reflect directly and sees the same numbers as the companion.
 */
function loadOverview(): Promise<LiveCoin[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promise;
  const promise = fetch("/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool: "reflect_get_stablecoin_overview", args: {} }),
  })
    .then(async (r) => {
      const body = await r.json();
      if (!r.ok || body.ok === false) throw new Error(body?.error?.message ?? "overview failed");
      return body.stablecoins as LiveCoin[];
    })
    .catch((e) => {
      cache = null; // don't cache failures; the next widget retries
      throw e;
    });
  cache = { at: Date.now(), promise };
  return promise;
}

export function useLiveOverview(): Status {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  useEffect(() => {
    let alive = true;
    loadOverview().then(
      (coins) => alive && setStatus({ state: "ok", coins }),
      () => alive && setStatus({ state: "error" }),
    );
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

/** Live APY for one coin, or null while loading / unavailable. */
export function useLiveApy(symbol: string): number | null {
  const s = useLiveOverview();
  if (s.state !== "ok") return null;
  return s.coins.find((c) => c.symbol === symbol)?.apy?.percent ?? null;
}
