/**
 * DEMO DATA. There is no wallet connection in this proof of concept, so personal balances
 * and history are fixed examples. Every place that shows them carries a "Demo data" badge.
 */
export const DEMO_HOLDINGS = [
  { symbol: "USDC+", amount: 2_480.512, costBasis: 2_450 },
  { symbol: "USDC", amount: 620.0, costBasis: 620 },
];

export const DEMO_YIELD_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  label: `Day ${i + 1}`,
  value: 2_450 + i * 1.02 + Math.sin(i / 3) * 0.6,
}));

export const DEMO_ACTIVITY = [
  { type: "Mint", amount: 1_500, token: "USDC", at: "2026-10-03" },
  { type: "Mint", amount: 950, token: "USDC", at: "2026-10-17" },
  { type: "Redeem", amount: 0, token: "USDC+", at: "—" },
].filter((a) => a.amount > 0);
