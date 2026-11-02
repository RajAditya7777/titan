export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  mint: string;
  icon: string;
  usdPrice: number;
  balance: number;
}

export type DartMode = "auto" | "only" | "off";

export type FeeMethod = "priority" | "mev";
export type PriorityTier = "auto" | "high" | "turbo" | "custom";

export interface SlippageSettings {
  baseBps: number; // e.g. 50 = 0.5%
  stableBps: number; // e.g. 10 = 0.1%
  feeMethod: FeeMethod;
  priorityTier: PriorityTier;
  customPrioritySol: number;
  mevProtection: boolean; // Argos + Jito/Nozomi bundle protection
}

export interface RouteHop {
  venue: string;
  percentage: number;
  pools: string[];
}

export interface QuoteFees {
  titanFeePct: number; // 0% in Prime
  titanFeeUsd: number;
  dartFeePct: number; // 0.01% if DART route
  dartFeeUsd: number;
  networkFeeSol: number;
  networkFeeUsd: number;
  mevTipSol: number;
  mevTipUsd: number;
}

export interface Quote {
  inputToken: Token;
  outputToken: Token;
  inAmount: string;
  outAmount: string;
  rate: number;
  priceImpactPct: number;
  minReceived: string;
  routeSummary: string;
  routeHops: RouteHop[];
  isDartRoute: boolean;
  fees: QuoteFees;
  provenance: "live" | "mock";
  simulated: boolean;
  updatedAt: number;
}

export type LimitSide = "buy" | "sell";
export type LimitExpiry = "1h" | "1d" | "7d" | "never" | "custom";

export interface LimitOrderState {
  pair: string;
  baseToken: Token;
  quoteToken: Token;
  side: LimitSide;
  limitPrice: string;
  marketPrice: number;
  quantity: string;
  expiry: LimitExpiry;
  notionalUsd: number;
  isValid: boolean;
  validationError?: string;
}

export interface TitanAppState {
  page: "swap" | "limit" | "learn";
  mode: "instant" | "limit" | "dca" | "slice";
  prime: boolean;
  dart: DartMode;
  inputToken: Token;
  outputToken: Token;
  amount: string;
  quote: Quote | null;
  isLoadingQuote: boolean;
  slippageSettings: SlippageSettings;
  settingsOpen: boolean;
  reviewModalOpen: boolean;
  chartOpen: boolean;
  limitOrder: LimitOrderState;
}
