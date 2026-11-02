"use client";

import { useSyncExternalStore } from "react";
import type { UmbraWebTab, UmbraWebToken } from "@/lib/products/umbra/web";

/**
 * The Umbra app's simulated account, kept in memory for the tab's lifetime so the landing page,
 * the app and the companion all see one state. Nothing here is a real wallet or a real balance (D-008).
 */

export const PRICES: Record<UmbraWebToken, number> = { SOL: 182.4, USDC: 1, USDT: 1, USDv: 1 };
export const DEMO_WALLET = "8kQm…Vb3x";

export type Stage = "idle" | "connect" | "register" | "registering" | "review" | "proving" | "submitting" | "done";

export interface UmbraWebStore {
  connected: boolean;
  registered: boolean;
  tab: UmbraWebTab;
  token: UmbraWebToken | "";
  amount: string;
  swapTo: UmbraWebToken | "";
  recipient: string;
  destination: string;
  wallet: Record<UmbraWebToken, number>;
  private: Record<UmbraWebToken, number>;
  stage: Stage;
  lastAction: string | null;
}

const initial: UmbraWebStore = {
  connected: false,
  registered: false,
  tab: "deposit",
  token: "",
  amount: "",
  swapTo: "",
  recipient: "",
  destination: "",
  wallet: { SOL: 12.4, USDC: 1250, USDT: 400, USDv: 0 },
  private: { SOL: 0, USDC: 0, USDT: 0, USDv: 0 },
  stage: "idle",
  lastAction: null,
};

let state = initial;
const listeners = new Set<() => void>();

export function setUmbra(patch: Partial<UmbraWebStore> | ((s: UmbraWebStore) => Partial<UmbraWebStore>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export const getUmbra = () => state;

export function useUmbra(): UmbraWebStore {
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
const round = (n: number) => Math.round(n * 1e6) / 1e6;

/** Why the current form can't be submitted, or null when it can. */
export function formProblem(s: UmbraWebStore): string | null {
  const amount = Number(s.amount);
  if (!s.token) return "Select a token";
  if (!s.amount || !Number.isFinite(amount) || amount <= 0) return "Enter an amount";
  const source = s.tab === "deposit" ? s.wallet : s.private;
  if (amount > source[s.token]) return s.tab === "deposit" ? `Not enough ${s.token} in wallet` : `Not enough private ${s.token}`;
  if (s.tab === "send" && s.recipient.trim().length < 32) return "Enter a recipient";
  if (s.tab === "withdraw" && s.destination.trim().length < 32) return "Enter a destination";
  if (s.tab === "swap" && (!s.swapTo || s.swapTo === s.token)) return "Select a token to receive";
  return null;
}

export async function register() {
  setUmbra({ stage: "registering" });
  await sleep(1400);
  setUmbra({ registered: true, stage: "idle", lastAction: "Registered: private account ready" });
}

/** Runs the approved action through the simulated proof → relayer → done stages. */
export async function approve() {
  const s = getUmbra();
  const token = s.token as UmbraWebToken;
  const amount = Number(s.amount);
  setUmbra({ stage: "proving" });
  await sleep(1300);
  setUmbra({ stage: "submitting" });
  await sleep(900);
  setUmbra((cur) => {
    const wallet = { ...cur.wallet };
    const priv = { ...cur.private };
    let lastAction = "";
    if (cur.tab === "deposit") {
      wallet[token] = round(wallet[token] - amount);
      priv[token] = round(priv[token] + amount);
      lastAction = `Deposited ${amount} ${token} into your private balance`;
    } else if (cur.tab === "send") {
      priv[token] = round(priv[token] - amount);
      lastAction = `Sent ${amount} ${token} privately`;
    } else if (cur.tab === "swap") {
      const to = cur.swapTo as UmbraWebToken;
      priv[token] = round(priv[token] - amount);
      priv[to] = round(priv[to] + (amount * PRICES[token]) / PRICES[to] * 0.997);
      lastAction = `Swapped ${amount} ${token} to ${to} privately`;
    } else {
      priv[token] = round(priv[token] - amount);
      lastAction = `Withdrew ${amount} ${token} to ${cur.destination.slice(0, 4)}…${cur.destination.slice(-4)}`;
    }
    return { wallet, private: priv, stage: "done", lastAction, amount: "" };
  });
}

export const privateUsd = (s: UmbraWebStore) => (Object.keys(s.private) as UmbraWebToken[]).reduce((t, k) => t + s.private[k] * PRICES[k], 0);
