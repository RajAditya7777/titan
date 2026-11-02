"use client";

import { useSyncExternalStore } from "react";
import { JUP_TOKENS, PERP_MARKETS, liquidationPrice, quote, type JupToken, type PerpMarket } from "@/lib/products/jupiter/web";

/** Simulated Jupiter account for the demo: fixed prices, play balances, no real wallet (D-008, D-011). */

export type JupStage = "idle" | "connect" | "review" | "submitting" | "done";
export type ReviewKind = "swap" | "limit" | "perps";

export interface Position {
  market: PerpMarket;
  side: "long" | "short";
  collateral: number;
  leverage: number;
  entry: number;
  liq: number;
}

export interface JupStore {
  connected: boolean;
  balances: Record<JupToken, number>;
  sellToken: JupToken;
  buyToken: JupToken;
  amount: string;
  limitPrice: string;
  expiry: "1H" | "1D" | "1W" | "30D";
  perpMarket: PerpMarket;
  perpSide: "long" | "short";
  perpAmount: string;
  leverage: string;
  orders: { sell: JupToken; buy: JupToken; amount: number; price: number; expiry: string }[];
  positions: Position[];
  stage: JupStage;
  review: ReviewKind | null;
  lastAction: string | null;
}

const initial: JupStore = {
  connected: false,
  balances: { SOL: 14.5, USDC: 1250, JUP: 3200, USDT: 0, BONK: 0, JitoSOL: 0 },
  sellToken: "SOL",
  buyToken: "USDC",
  amount: "",
  limitPrice: "",
  expiry: "1W",
  perpMarket: "SOL",
  perpSide: "long",
  perpAmount: "",
  leverage: "5",
  orders: [],
  positions: [],
  stage: "idle",
  review: null,
  lastAction: null,
};

let state = initial;
const listeners = new Set<() => void>();

export function setJup(patch: Partial<JupStore> | ((s: JupStore) => Partial<JupStore>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}
export const getJup = () => state;

export function useJup(): JupStore {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => initial,
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function swapProblem(s: JupStore): string | null {
  const a = Number(s.amount);
  if (!s.amount || !(a > 0)) return "Enter an amount";
  if (s.sellToken === s.buyToken) return "Pick two different tokens";
  if (a > s.balances[s.sellToken]) return `Insufficient ${s.sellToken}`;
  return null;
}

export function perpProblem(s: JupStore): string | null {
  const a = Number(s.perpAmount);
  const lev = Number(s.leverage);
  if (!(a > 0)) return "Enter an amount";
  if (!(lev >= 1.1 && lev <= 250)) return "Leverage 1.1x – 250x";
  if (a > s.balances.USDC) return "Insufficient USDC";
  return null;
}

/** Runs the approved action after the (simulated) wallet signs. */
export async function confirmJup() {
  const s = getJup();
  setJup({ stage: "submitting" });
  await sleep(1400);
  if (s.review === "swap") {
    const a = Number(s.amount);
    const q = quote(s.sellToken, s.buyToken, a);
    setJup((c) => ({
      balances: { ...c.balances, [s.sellToken]: r6(c.balances[s.sellToken] - a), [s.buyToken]: r6(c.balances[s.buyToken] + q.out) },
      lastAction: `Swapped ${a} ${s.sellToken} for ${q.out.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${s.buyToken}`,
      amount: "",
      stage: "done",
    }));
  } else if (s.review === "limit") {
    const a = Number(s.amount);
    setJup((c) => ({
      orders: [...c.orders, { sell: s.sellToken, buy: s.buyToken, amount: a, price: Number(s.limitPrice), expiry: s.expiry }],
      lastAction: `Limit order placed: ${a} ${s.sellToken} at ${s.limitPrice}`,
      amount: "",
      stage: "done",
    }));
  } else if (s.review === "perps") {
    const a = Number(s.perpAmount);
    const lev = Number(s.leverage);
    const entry = PERP_MARKETS[s.perpMarket];
    setJup((c) => ({
      balances: { ...c.balances, USDC: r6(c.balances.USDC - a) },
      positions: [...c.positions, { market: s.perpMarket, side: s.perpSide, collateral: a, leverage: lev, entry, liq: liquidationPrice(s.perpSide, entry, lev) }],
      lastAction: `Opened ${lev}x ${s.perpSide} on ${s.perpMarket} with ${a} USDC`,
      perpAmount: "",
      stage: "done",
    }));
  }
}

export const netWorth = (s: JupStore) =>
  (Object.keys(s.balances) as JupToken[]).reduce((t, k) => t + s.balances[k] * JUP_TOKENS[k].price, 0) + s.positions.reduce((t, p) => t + p.collateral, 0);
