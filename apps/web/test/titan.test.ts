import { describe, expect, it } from "vitest";
import {
  generateTitanQuote,
  TITAN_TOKENS,
  TOKEN_SOL,
  TOKEN_USDC,
  planTitanGoal,
  matchTitanRules,
  TITAN_ELEMENTS,
  TITAN_PAGES,
} from "@/lib/products/titan";
import { auditWorkflow } from "@/lib/companion/actions";

describe("Titan Quote Engine", () => {
  it("calculates deterministic quote with zero Titan fee in Prime mode", () => {
    const quote = generateTitanQuote(TOKEN_SOL, TOKEN_USDC, "1", 50, "auto", true);
    expect(quote).not.toBeNull();
    expect(quote?.fees.titanFeePct).toBe(0);
    expect(quote?.provenance).toBe("mock");
    expect(quote?.simulated).toBe(true);
    expect(quote?.isDartRoute).toBe(true);
    expect(quote?.routeSummary).toContain("DART");
  });

  it("scales price impact as trade size grows", () => {
    const smallQuote = generateTitanQuote(TOKEN_SOL, TOKEN_USDC, "0.1", 50, "auto", true);
    const largeQuote = generateTitanQuote(TOKEN_SOL, TOKEN_USDC, "100", 50, "auto", true);
    expect(smallQuote?.priceImpactPct).toBeLessThan(largeQuote?.priceImpactPct || 0);
  });

  it("handles DART mode off with direct single-venue route", () => {
    const quote = generateTitanQuote(TOKEN_SOL, TOKEN_USDC, "1", 50, "off", false);
    expect(quote?.isDartRoute).toBe(false);
    expect(quote?.routeSummary).toContain("Direct Route");
  });
});

describe("Titan Planners & Workflows", () => {
  it("generates safe swap workflow ending in stop_before_signing", () => {
    const wf = planTitanGoal("swap", { inputToken: "SOL", outputToken: "USDC", amount: "1.5" });
    expect(wf.id).toContain("titan_swap_SOL_USDC");
    expect(wf.steps[wf.steps.length - 1]?.type).toBe("stop_before_signing");

    // Must pass safety audit
    const auditErrors = auditWorkflow(wf);
    expect(auditErrors).toEqual([]);
  });

  it("generates safe limit order workflow", () => {
    const wf = planTitanGoal("limit_order", { pair: "SOL/USDC", side: "buy", limitPrice: "180", quantity: "1" });
    expect(wf.steps[wf.steps.length - 1]?.type).toBe("stop_before_signing");
    const auditErrors = auditWorkflow(wf);
    expect(auditErrors).toEqual([]);
  });

  it("all sensitive controls are marked sensitive in registry", () => {
    expect(TITAN_ELEMENTS["titan-swap-review"]?.sensitive).toBe(true);
    expect(TITAN_ELEMENTS["titan-swap-sign"]?.sensitive).toBe(true);
    expect(TITAN_ELEMENTS["titan-limit-submit"]?.sensitive).toBe(true);
  });
});

describe("Titan Voice & Fast Rules", () => {
  it("matches 'swap 2 SOL for USDC' to swap goal", () => {
    const match = matchTitanRules("swap 2 SOL for USDC");
    expect(match).not.toBeNull();
    expect(match?.workflow?.id).toContain("titan_swap_SOL_USDC");
  });

  it("matches 'what is DART' to explanation without workflow", () => {
    const match = matchTitanRules("what is DART?");
    expect(match).not.toBeNull();
    expect(match?.speech).toContain("Dynamic Allocation and Real Time");
    expect(match?.pointTarget).toBe("titan-dart-selector");
    expect(match?.workflow).toBeUndefined();
  });

  it("matches 'what is Prime' to Prime mode explanation", () => {
    const match = matchTitanRules("what is prime mode?");
    expect(match).not.toBeNull();
    expect(match?.speech).toContain("zero-fee execution tier");
    expect(match?.pointTarget).toBe("titan-prime-toggle");
  });
});
