"use client";

import { useSyncExternalStore } from "react";
import { JUP_TOKENS, PERP_MARKETS, liquidationPrice, quote, type JupToken, type PerpMarket } from "@/lib/products/jupiter/web";
import { petReact } from "@/lib/companion/page-reactions";
import { BUYBACK_RATE, PACKS, rollPull, type Pull } from "@/lib/products/jupiter/gacha";

/** Simulated Jupiter account for the demo: fixed prices, play balances, no real wallet (D-008, D-011). */

export type JupStage = "idle" | "connect" | "review" | "submitting" | "done";
export type ReviewKind = "swap" | "limit" | "perps" | "gacha";

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
  gachaPack: string;
  gachaCount: string;
  turbo: boolean;
  /** Pulls you hold (the Collection tab). */
  collection: (Pull & { id: number })[];
  /** The pulls being revealed right after opening. */
  reveal: (Pull & { id: number; sold?: boolean })[] | null;
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
  gachaPack: "lucky",
  gachaCount: "1",
  turbo: false,
  collection: [],
  reveal: null,
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
let nextPullId = 1;

export function gachaProblem(s: JupStore): string | null {
  const pack = PACKS.find((p) => p.id === s.gachaPack);
  const n = Number(s.gachaCount);
  if (!pack) return "Pick a pack";
  if (!(n >= 1 && n <= 10 && Number.isInteger(n))) return "1 – 10 packs";
  if (pack.price * n > s.balances.USDC) return "Insufficient USDC";
  return null;
}

/** Instant buyback: sell a pull back for USDC at 93% of its value. */
export function sellBack(id: number) {
  setJup((c) => {
    const pull = c.collection.find((p) => p.id === id);
    if (!pull) return {};
    petReact("wave", `Sold back for ${(pull.value * BUYBACK_RATE).toFixed(2)} USDC`);
    return {
      collection: c.collection.filter((p) => p.id !== id),
      reveal: c.reveal?.map((p) => (p.id === id ? { ...p, sold: true } : p)) ?? null,
      balances: { ...c.balances, USDC: r6(c.balances.USDC + pull.value * BUYBACK_RATE) },
    };
  });
}
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
  petReact("hop", "Counting down… 3, 2, 1 🚀");
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
    petReact("cheer", `Swapped! ${q.out.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${s.buyToken} landed 🎉`);
  } else if (s.review === "limit") {
    const a = Number(s.amount);
    setJup((c) => ({
      orders: [...c.orders, { sell: s.sellToken, buy: s.buyToken, amount: a, price: Number(s.limitPrice), expiry: s.expiry }],
      lastAction: `Limit order placed: ${a} ${s.sellToken} at ${s.limitPrice}`,
      amount: "",
      stage: "done",
    }));
    petReact("hearts", "Order's waiting in orbit 🛰️");
  } else if (s.review === "gacha") {
    const pack = PACKS.find((p) => p.id === s.gachaPack)!;
    const n = Math.max(1, Math.min(10, Math.floor(Number(s.gachaCount) || 1)));
    const pulls = Array.from({ length: n }, () => ({ ...rollPull(pack), id: nextPullId++ }));
    // Turbo sells Common pulls straight back at the buyback rate.
    const sold = s.turbo ? pulls.filter((p) => p.tier === "Common") : [];
    const kept = pulls.filter((p) => !sold.includes(p));
    const refund = sold.reduce((t, p) => t + p.value * BUYBACK_RATE, 0);
    setJup((c) => ({
      balances: { ...c.balances, USDC: r6(c.balances.USDC - pack.price * n + refund) },
      collection: [...kept, ...c.collection],
      reveal: pulls.map((p) => ({ ...p, sold: sold.includes(p) })),
      lastAction: `Opened ${n} ${pack.name} pack${n > 1 ? "s" : ""}`,
      stage: "idle",
      review: null,
    }));
    const best = pulls.reduce((a, b) => (b.value > a.value ? b : a));
    if (best.tier === "Epic") petReact("cheer", `EPIC PULL! ${best.name} 🤯`);
    else if (best.tier === "Rare") petReact("hearts", `Ooh, a Rare! ${best.name}`);
    else if (best.value >= pack.price) petReact("clap", `Nice, worth more than the pack!`);
    else petReact("giggle", "A Common one. Next pack's the one? 😺");
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
    petReact("cheer", s.perpSide === "long" ? "Position open, to the moon! 🚀" : "Short is live, hold tight!");
  }
}

export const netWorth = (s: JupStore) =>
  (Object.keys(s.balances) as JupToken[]).reduce((t, k) => t + s.balances[k] * JUP_TOKENS[k].price, 0) + s.positions.reduce((t, p) => t + p.collateral, 0);
