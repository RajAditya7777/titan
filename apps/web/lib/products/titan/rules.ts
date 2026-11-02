import type { Workflow } from "@/lib/companion/actions";
import { planTitanGoal } from "./planner";

export interface TitanRuleMatch {
  speech: string;
  workflow?: Workflow;
  pointTarget?: string;
}

export function matchTitanRules(utterance: string): TitanRuleMatch | null {
  const norm = utterance.toLowerCase().trim();

  // Swap intent
  const swapMatch = norm.match(/(?:swap|trade|exchange)\s+([0-9.]+)?\s*([a-z]+)?\s*(?:for|to|into)\s*([a-z]+)?/i);
  if (swapMatch) {
    const amount = swapMatch[1] || "1";
    const inToken = swapMatch[2]?.toUpperCase() || "SOL";
    const outToken = swapMatch[3]?.toUpperCase() || "USDC";

    return {
      speech: `I'll guide you through swapping ${amount} ${inToken} for ${outToken} with Titan's Argos and DART routing.`,
      workflow: planTitanGoal("swap", { inputToken: inToken, outputToken: outToken, amount }),
    };
  }

  // Quick swap intent without tokens
  if (/\b(?:how do i swap|help me swap|let's swap|start swap)\b/i.test(norm)) {
    return {
      speech: "Let's set up a swap on Titan. I'll highlight each step for you.",
      workflow: planTitanGoal("swap", { inputToken: "SOL", outputToken: "USDC", amount: "1" }),
    };
  }

  // Limit order intent
  if (/\b(?:limit order|set limit|place limit)\b/i.test(norm)) {
    return {
      speech: "Here is Titan's Limit Order system. Remember, Titan requires a $10 minimum order size.",
      workflow: planTitanGoal("limit_order", { pair: "SOL/USDC", side: "buy", limitPrice: "180.00", quantity: "1" }),
    };
  }

  // DART explanation
  if (/\b(?:what is dart|explain dart|tell me about dart|how does dart work)\b/i.test(norm)) {
    return {
      speech: "DART stands for Dynamic Allocation and Real Time. Unlike standard aggregators that lock route weights when quoting, DART re-splits your trade on-chain at execution to guarantee the Best Bid Offer.",
      pointTarget: "titan-dart-selector",
    };
  }

  // Argos explanation
  if (/\b(?:what is argos|explain argos|tell me about argos)\b/i.test(norm)) {
    return {
      speech: "Argos is Titan's proprietary off-chain mathematical routing algorithm. It searches across Solana DEX liquidity pools to find the optimal split and multi-hop routes.",
      pointTarget: "titan-route-summary",
    };
  }

  // Prime mode explanation
  if (/\b(?:what is prime|explain prime|prime mode)\b/i.test(norm)) {
    return {
      speech: "Prime Mode is Titan's zero-fee execution tier. It gives you 0% Titan fees, automated sandwich protection via Jito bundles, and dynamic slippage adjustment.",
      pointTarget: "titan-prime-toggle",
    };
  }

  // Slippage explanation / adjustment
  if (/\b(?:slippage|adjust slippage|set slippage|what is slippage)\b/i.test(norm)) {
    return {
      speech: "Slippage is the maximum price movement you accept before a trade reverts. Titan lets you set separate slippage for volatile tokens and stable/LST pairs.",
      workflow: planTitanGoal("adjust_slippage"),
    };
  }

  // Guided tour
  if (/\b(?:tour|walk me through|show me around|guide me)\b/i.test(norm)) {
    return {
      speech: "Welcome to Titan! I'll give you a quick walkthrough of the interface.",
      workflow: planTitanGoal("tour"),
    };
  }

  return null;
}
