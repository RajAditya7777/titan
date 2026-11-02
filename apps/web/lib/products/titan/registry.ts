import type { ElementKind, ValidationRule } from "@/lib/companion/registry";

export const TITAN_PAGES = {
  titan_swap: {
    path: "/titan/swap",
    title: "Titan Swap",
    summary:
      "Meta-aggregated swap on Solana using Argos off-chain optimization and DART on-chain real-time execution.",
  },
  titan_limit: {
    path: "/titan/limit",
    title: "Titan Limit Orders",
    summary:
      "On-chain limit orders filled by market makers with partial fill support and a $10 minimum order notional.",
  },
  titan_learn: {
    path: "/titan/learn",
    title: "Titan Concepts & Learn",
    summary:
      "Educational breakdown of DART routing, Argos arbitrage protection, Prime mode, and MEV sandwich protection.",
  },
} as const;

export type TitanPageId = keyof typeof TITAN_PAGES;

export interface TitanElementSpec {
  page: TitanPageId | "global";
  kind: ElementKind;
  label: string;
  description: string;
  validation?: ValidationRule;
  sensitive?: boolean;
  fillable?: boolean;
}

export const TITAN_ELEMENTS: Record<string, TitanElementSpec> = {
  // Navigation & Global
  "titan-nav-swap": {
    page: "global",
    kind: "nav",
    label: "Swap",
    description: "Navigate to the Titan Instant Swap interface.",
  },
  "titan-nav-limit": {
    page: "global",
    kind: "nav",
    label: "Limit Orders",
    description: "Navigate to Titan Limit Orders.",
  },
  "titan-nav-learn": {
    page: "global",
    kind: "nav",
    label: "Learn & Concepts",
    description: "Explore how Titan's Argos and DART routing work under the hood.",
  },
  "titan-wallet-badge": {
    page: "global",
    kind: "display",
    label: "Demo Wallet",
    description:
      "Simulated demo wallet for the AI Companion. No real wallet or private keys are connected.",
  },

  // Tabs
  "titan-tab-instant": {
    page: "titan_swap",
    kind: "button",
    label: "Instant Swap",
    description: "Execute an instant market swap routed through Titan aggregators.",
  },
  "titan-tab-limit": {
    page: "titan_swap",
    kind: "button",
    label: "Limit Order",
    description: "Place an on-chain limit order filled by market makers.",
  },
  "titan-tab-dca": {
    page: "titan_swap",
    kind: "button",
    label: "DCA (Dollar-Cost Averaging)",
    description:
      "Titan Dollar-Cost Averaging (explained only). Automated recurring swaps via Chronos partner API.",
  },
  "titan-tab-slice": {
    page: "titan_swap",
    kind: "button",
    label: "Slice Orders",
    description:
      "Titan Slice execution (explained only). Large orders split into smaller tranches over time to minimize price impact.",
  },

  // Swap header controls
  "titan-prime-toggle": {
    page: "titan_swap",
    kind: "button",
    label: "Prime Mode",
    description:
      "Prime Mode automatically handles dynamic slippage, MEV sandwich protection, and priority landing fees with zero Titan protocol fees.",
  },
  "titan-dart-selector": {
    page: "titan_swap",
    kind: "select",
    label: "DART Routing Mode",
    description:
      "DART (Dynamic Allocation and Real Time) re-splits trades across pools at on-chain execution for the Best Bid Offer guarantee. Modes: Auto, Only, Off.",
  },
  "titan-chart-toggle": {
    page: "titan_swap",
    kind: "button",
    label: "Toggle Chart",
    description: "Show or hide the live candlestick price chart.",
  },
  "titan-refresh-quote": {
    page: "titan_swap",
    kind: "button",
    label: "Refresh Quote",
    description: "Fetch a fresh simulated quote and route re-simulation from Titan.",
  },

  // Sell Card
  "titan-sell-card": {
    page: "titan_swap",
    kind: "section",
    label: "Sell Token Card",
    description: "Specify the token and amount you want to swap from.",
  },
  "titan-sell-token-select": {
    page: "titan_swap",
    kind: "select",
    label: "Input Token",
    description: "Select which token to sell (e.g. SOL, USDC, USDT, JUP, BONK).",
  },
  "titan-sell-balance": {
    page: "titan_swap",
    kind: "display",
    label: "Token Balance",
    description: "Your available balance in the simulated demo wallet.",
  },
  "titan-sell-amount-input": {
    page: "titan_swap",
    kind: "input",
    label: "Input Amount",
    description: "The amount of the token you want to sell.",
    validation: "positive-amount",
    fillable: true,
  },
  "titan-sell-max": {
    page: "titan_swap",
    kind: "button",
    label: "Max Amount",
    description: "Fill the input with your entire available balance.",
  },
  "titan-sell-half": {
    page: "titan_swap",
    kind: "button",
    label: "50% Amount",
    description: "Fill the input with half (50%) of your available balance.",
  },

  // Switch button
  "titan-switch-tokens": {
    page: "titan_swap",
    kind: "button",
    label: "Switch Tokens",
    description: "Invert the swap direction, switching your sell and buy tokens.",
  },

  // Buy Card
  "titan-buy-card": {
    page: "titan_swap",
    kind: "section",
    label: "Buy Token Card",
    description: "The estimated output amount and token you will receive.",
  },
  "titan-buy-token-select": {
    page: "titan_swap",
    kind: "select",
    label: "Output Token",
    description: "Select which token to receive from the swap.",
  },
  "titan-buy-amount-output": {
    page: "titan_swap",
    kind: "display",
    label: "Estimated Output",
    description:
      "Calculated output after simulating Argos optimization and DART routing.",
  },

  // Rate & details
  "titan-rate-display": {
    page: "titan_swap",
    kind: "display",
    label: "Exchange Rate",
    description:
      "The effective execution rate between the two tokens including estimated price impact.",
  },
  "titan-simulated-badge": {
    page: "titan_swap",
    kind: "display",
    label: "Simulated Data Badge",
    description:
      "Indicates quote and routing calculations are simulated deterministically for the demo.",
  },
  "titan-route-summary": {
    page: "titan_swap",
    kind: "section",
    label: "Routing Route",
    description:
      "Shows how Argos splits the trade across DEXes (Orca, Raydium, Meteora) and whether DART on-chain re-allocation is active.",
  },
  "titan-price-impact": {
    page: "titan_swap",
    kind: "display",
    label: "Price Impact",
    description:
      "The estimated percentage difference between the market price and your execution price due to order size.",
  },
  "titan-fees-breakdown": {
    page: "titan_swap",
    kind: "section",
    label: "Fee Breakdown",
    description:
      "Titan fee is 0% in Prime. DART router fee is up to 1 bps (0.01%). Solana network and MEV protection fees are detailed here.",
  },

  // Settings Drawer
  "titan-settings-toggle": {
    page: "titan_swap",
    kind: "button",
    label: "Settings",
    description: "Open the slippage tolerance and MEV protection settings drawer.",
  },
  "titan-slippage-base-input": {
    page: "titan_swap",
    kind: "input",
    label: "Base Token Slippage",
    description:
      "Maximum allowed slippage for volatile tokens (e.g. SOL, JUP, BONK).",
    fillable: true,
  },
  "titan-slippage-stable-input": {
    page: "titan_swap",
    kind: "input",
    label: "Stable/LST Slippage",
    description:
      "Tighter slippage tolerance for stablecoins (USDC/USDT) and Liquid Staking Tokens.",
    fillable: true,
  },
  "titan-priority-fee-toggle": {
    page: "titan_swap",
    kind: "select",
    label: "Fee Method",
    description:
      "Switch between standard Solana Priority Fees and MEV Protect (Jito + Nozomi anti-sandwich bundles).",
  },

  // Swap Actions
  "titan-swap-review": {
    page: "titan_swap",
    kind: "button",
    label: "Review Swap",
    description:
      "Open the simulated transaction review summary before approving.",
    sensitive: true,
  },
  "titan-swap-sign": {
    page: "titan_swap",
    kind: "button",
    label: "Approve in wallet (simulated)",
    description:
      "Simulate signing the swap transaction. The companion never signs for you.",
    sensitive: true,
  },

  // Limit Order page elements
  "titan-limit-pair": {
    page: "titan_limit",
    kind: "select",
    label: "Limit Order Pair",
    description: "Select the market trading pair (e.g. SOL/USDC).",
  },
  "titan-limit-side-buy": {
    page: "titan_limit",
    kind: "button",
    label: "Buy Side",
    description: "Place a limit order to buy the base asset.",
  },
  "titan-limit-side-sell": {
    page: "titan_limit",
    kind: "button",
    label: "Sell Side",
    description: "Place a limit order to sell the base asset.",
  },
  "titan-limit-price-input": {
    page: "titan_limit",
    kind: "input",
    label: "Limit Price",
    description: "The target price at which your order should execute.",
    validation: "positive-amount",
    fillable: true,
  },
  "titan-limit-market-ref": {
    page: "titan_limit",
    kind: "button",
    label: "Market Price Reference",
    description:
      "The current market reference price. A limit price worse than market is rejected.",
  },
  "titan-limit-quantity-input": {
    page: "titan_limit",
    kind: "input",
    label: "Order Quantity",
    description: "The amount of the base asset to buy or sell.",
    validation: "positive-amount",
    fillable: true,
  },
  "titan-limit-expiry-select": {
    page: "titan_limit",
    kind: "select",
    label: "Order Expiry",
    description:
      "Expiration duration for the on-chain limit order (1 Hour, 1 Day, 7 Days, Never, or Custom).",
  },
  "titan-limit-min-validation": {
    page: "titan_limit",
    kind: "display",
    label: "$10 Minimum Validation",
    description:
      "Titan enforces a strict $10 notional minimum for all on-chain limit orders.",
  },
  "titan-limit-submit": {
    page: "titan_limit",
    kind: "button",
    label: "Place Limit Order",
    description:
      "Submits the limit order to the on-chain orderbook. Refundable rent applies.",
    sensitive: true,
  },

  // Concept & Learn cards
  "titan-learn-dart": {
    page: "titan_learn",
    kind: "section",
    label: "DART Routing Architecture",
    description:
      "Deep dive into DART (Dynamic Allocation and Real Time) on-chain execution guarantee.",
  },
  "titan-learn-argos": {
    page: "titan_learn",
    kind: "section",
    label: "Argos Optimization Engine",
    description:
      "Mathematical optimization algorithm solving multi-hop routing across Solana DEXes off-chain.",
  },
  "titan-learn-prime": {
    page: "titan_learn",
    kind: "section",
    label: "Prime Liquidity & Zero Fees",
    description:
      "How Prime mode unlocks zero protocol fees with automated sandwich and slippage guardrails.",
  },
  "titan-learn-mev": {
    page: "titan_learn",
    kind: "section",
    label: "MEV & Sandwich Protection",
    description:
      "Jito bundles and Nozomi private routing preventing front-running bots.",
  },
};

export const TITAN_ELEMENT_IDS = Object.keys(TITAN_ELEMENTS);
