export * from "./client";
export * from "./errors";
export * from "./units";
export * as schemas from "./schemas";
export type * from "./schemas";

/** Index → display metadata. Indices come from `GET /stablecoin/types`; names here are fallbacks only. */
export const KNOWN_STABLECOINS = {
  0: { symbol: "USDC+", underlying: "USDC" },
  1: { symbol: "USDT+", underlying: "USDT" },
} as const;
