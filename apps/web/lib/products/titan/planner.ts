import type { Workflow } from "@/lib/companion/actions";

export interface TitanPlanParams {
  inputToken?: string;
  outputToken?: string;
  amount?: string;
  pair?: string;
  side?: "buy" | "sell";
  limitPrice?: string;
  quantity?: string;
  baseBps?: number;
}

export type TitanGoal = "swap" | "limit_order" | "adjust_slippage" | "tour" | "learn_dart";

export function planTitanGoal(goal: TitanGoal, params: TitanPlanParams = {}): Workflow {
  switch (goal) {
    case "swap": {
      const inToken = params.inputToken || "SOL";
      const outToken = params.outputToken || "USDC";
      const amount = params.amount || "1";

      return {
        id: `titan_swap_${inToken}_${outToken}`,
        title: `Swap ${amount} ${inToken} for ${outToken}`,
        steps: [
          {
            type: "navigate_to_page",
            page: "titan_swap",
            say: `Let's head to Titan Swap to trade ${inToken} for ${outToken}.`,
          },
          {
            type: "point",
            target: "titan-prime-toggle" as any,
            say: "Prime Mode is active: you get zero Titan fees, auto sandwich protection, and optimized slippage.",
          },
          {
            type: "point",
            target: "titan-dart-selector" as any,
            say: "DART routing is set to Auto. Argos solves multi-hop routing off-chain, and DART re-splits on-chain at execution.",
          },
          {
            type: "request_input",
            target: "titan-sell-amount-input" as any,
            say: `Enter ${amount} ${inToken} here, or say 'yes' and I will fill it in for you.`,
            suggestedValue: amount,
          },
          {
            type: "point",
            target: "titan-rate-display" as any,
            say: "This is the rate for your amount. Review Swap shows the full breakdown before anything is approved.",
          },
          {
            type: "wait_for_user_action",
            target: "titan-swap-review" as any,
            say: "Press 'Review Swap' when you're ready to inspect the transaction details. I will never press it for you.",
          },
          {
            type: "stop_before_signing",
            target: "titan-swap-sign" as any,
            say: "Review the simulated trade breakdown. Only you can approve transactions; the AI companion will never sign on your behalf.",
          },
        ],
      };
    }

    case "limit_order": {
      const pair = params.pair || "SOL/USDC";
      const side = params.side || "buy";
      const price = params.limitPrice || "180.00";
      const qty = params.quantity || "1";

      return {
        id: `titan_limit_${side}_${pair.replace("/", "_")}`,
        title: `Place ${side.toUpperCase()} limit order for ${pair}`,
        steps: [
          {
            type: "navigate_to_page",
            page: "titan_limit",
            say: "Welcome to Titan Limit Orders.",
          },
          {
            type: "point",
            target: "titan-limit-pair" as any,
            say: `We are trading ${pair}. Orders are filled by market makers directly on-chain.`,
          },
          {
            type: "point",
            target: side === "buy" ? ("titan-limit-side-buy" as any) : ("titan-limit-side-sell" as any),
            say: `You are placing a ${side.toUpperCase()} order.`,
          },
          {
            type: "request_input",
            target: "titan-limit-price-input" as any,
            say: `Enter your target limit price ($${price}). Notice the market reference price next to it.`,
            suggestedValue: price,
          },
          {
            type: "request_input",
            target: "titan-limit-quantity-input" as any,
            say: `Enter the quantity you wish to order (${qty}).`,
            suggestedValue: qty,
          },
          {
            type: "point",
            target: "titan-limit-min-validation" as any,
            say: "Titan enforces a $10 minimum order notional. Look for the green badge confirming your order meets the threshold.",
          },
          {
            type: "stop_before_signing",
            target: "titan-limit-submit" as any,
            say: "When satisfied, click Place Limit Order to create your on-chain order. Refundable rent applies.",
          },
        ],
      };
    }

    case "adjust_slippage": {
      return {
        id: "titan_adjust_slippage",
        title: "Adjust Titan Slippage & Fees",
        steps: [
          {
            type: "navigate_to_page",
            page: "titan_swap",
            say: "Opening swap settings.",
          },
          {
            type: "point",
            target: "titan-settings-toggle" as any,
            say: "Click Settings to view slippage tolerances and MEV protect options.",
          },
          {
            type: "point",
            target: "titan-slippage-base-input" as any,
            say: "Base Tokens slippage applies to volatile pairs like SOL/USDC. Lower slippage protects against bad fills but might revert in fast markets.",
          },
          {
            type: "point",
            target: "titan-slippage-stable-input" as any,
            say: "Stable/LST slippage can be set much tighter (e.g. 0.1%) because dollar-pegged pairs have minimal divergence.",
          },
          {
            type: "celebrate",
            say: "You are all set! Your slippage settings are configured.",
          },
        ],
      };
    }

    case "tour": {
      return {
        id: "titan_tour",
        title: "Titan Exchange Guided Tour",
        steps: [
          {
            type: "navigate_to_page",
            page: "titan_swap",
            say: "Welcome to Titan Exchange! Let me show you around the meta-aggregator.",
          },
          {
            type: "point",
            target: "titan-prime-toggle" as any,
            say: "This is Prime Mode: zero protocol fees and automatic MEV sandwich protection.",
          },
          {
            type: "point",
            target: "titan-dart-selector" as any,
            say: "DART (Dynamic Allocation and Real Time) re-allocates trades across pools at the exact moment of execution on Solana.",
          },
          {
            type: "point",
            target: "titan-sell-card" as any,
            say: "Choose any token and amount to sell. You can use 50% or Max buttons for quick sizing.",
          },
          {
            type: "point",
            target: "titan-route-summary" as any,
            say: "The route details show which DEXes Argos routed through and your exact price impact.",
          },
          {
            type: "navigate_to_page",
            page: "titan_limit",
            say: "Here is the Limit Order view. Titan lets you place on-chain orders with a $10 minimum.",
          },
          {
            type: "navigate_to_page",
            page: "titan_learn",
            say: "Finally, our Learn section explains DART, Argos, and MEV protection in depth.",
          },
          {
            type: "celebrate",
            say: "Tour complete! Feel free to ask me questions like 'what is DART' or 'help me swap 1 SOL'.",
          },
        ],
      };
    }

    case "learn_dart": {
      return {
        id: "titan_learn_dart",
        title: "Learn DART Routing",
        steps: [
          {
            type: "navigate_to_page",
            page: "titan_learn",
            say: "Let's explore Titan's unique DART routing technology.",
          },
          {
            type: "point",
            target: "titan-learn-dart" as any,
            say: "DART stands for Dynamic Allocation and Real Time. It re-computes optimal pool weights right on-chain during execution.",
          },
          {
            type: "point",
            target: "titan-learn-argos" as any,
            say: "Argos is Titan's off-chain mathematical routing engine that finds candidate multi-hop paths before DART executes.",
          },
          {
            type: "celebrate",
            say: "Together, Argos and DART ensure you get the absolute best execution across all Solana liquidity.",
          },
        ],
      };
    }
  }
}
