import type { DartMode, Quote, RouteHop, Token } from "./types";

/**
 * Deterministic quote calculation for Titan Exchange simulation.
 * Replicates Argos routing algorithms + DART re-splitting.
 */
export function generateTitanQuote(
  inputToken: Token,
  outputToken: Token,
  inAmountStr: string,
  slippageBps = 50,
  dartMode: DartMode = "auto",
  prime = true,
): Quote | null {
  const parsedIn = parseFloat(inAmountStr);
  if (isNaN(parsedIn) || parsedIn <= 0) {
    return null;
  }

  const rawRate = inputToken.usdPrice / outputToken.usdPrice;
  const inUsd = parsedIn * inputToken.usdPrice;

  // Price impact model: gentle for small trades, progressive for large notional
  // 0.01% base + 0.00004 * inUsd^0.8
  const impactPct = Math.min(
    15.0,
    Math.max(0.01, 0.01 + Math.pow(inUsd, 0.78) * 0.00006),
  );

  const effectiveRate = rawRate * (1 - impactPct / 100);
  const outAmountNum = parsedIn * effectiveRate;

  // Decimals formatting
  const outDecimals = outputToken.decimals > 6 ? 6 : outputToken.decimals;
  const outAmountStr = outAmountNum.toFixed(outDecimals);

  // Slippage minimum received
  const slippageFactor = 1 - slippageBps / 10000;
  const minReceivedNum = outAmountNum * slippageFactor;
  const minReceivedStr = minReceivedNum.toFixed(outDecimals);

  // Fees breakdown
  const titanFeePct = prime ? 0.0 : 0.05; // 0% in Prime
  const titanFeeUsd = (inUsd * titanFeePct) / 100;

  const isDartActive = dartMode !== "off";
  const dartFeePct = isDartActive ? 0.01 : 0.0; // Up to 1 bps
  const dartFeeUsd = (inUsd * dartFeePct) / 100;

  const networkFeeSol = 0.000005;
  const networkFeeUsd = networkFeeSol * 184.2;

  const mevTipSol = prime ? 0.0001 : 0.00005;
  const mevTipUsd = mevTipSol * 184.2;

  // Route breakdown based on pair
  const hops: RouteHop[] = [];
  let summary = "";

  if (isDartActive) {
    hops.push({
      venue: "Orca Whirlpool (Concentrated Liquidity)",
      percentage: 64,
      pools: ["SOL-USDC 0.05%", "USDC-USDT 0.01%"],
    });
    hops.push({
      venue: "Raydium CPMM (Constant Product)",
      percentage: 36,
      pools: ["SOL-USDC Pool #124"],
    });
    summary = "Argos Optimizer (2 DEXes, 2 Pools) + DART Real-Time Re-Split";
  } else {
    hops.push({
      venue: "Orca Whirlpool",
      percentage: 100,
      pools: ["SOL-USDC 0.05%"],
    });
    summary = "Direct Route (Orca Whirlpool)";
  }

  return {
    inputToken,
    outputToken,
    inAmount: inAmountStr,
    outAmount: outAmountStr,
    rate: effectiveRate,
    priceImpactPct: parseFloat(impactPct.toFixed(3)),
    minReceived: minReceivedStr,
    routeSummary: summary,
    routeHops: hops,
    isDartRoute: isDartActive,
    fees: {
      titanFeePct,
      titanFeeUsd,
      dartFeePct,
      dartFeeUsd,
      networkFeeSol,
      networkFeeUsd,
      mevTipSol,
      mevTipUsd,
    },
    provenance: "mock",
    simulated: true,
    updatedAt: Date.now(),
  };
}
