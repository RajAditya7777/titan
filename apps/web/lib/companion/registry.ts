/**
 * The page & element registry is the companion's map of the app — and its security boundary.
 * The LLM can only refer to ids listed here; the guide engine resolves an id to the DOM through
 * `[data-companion="<id>"]`, never through selectors the model invents.
 */

export const PAGES = {
  dashboard: { path: "/", title: "Dashboard", summary: "Your balances, the live USDC+ yield and recent protocol activity." },
  stablecoin: { path: "/stablecoins/usdc-plus", title: "USDC+", summary: "What USDC+ is, its live APY, exchange rate, supply and risks." },
  mint: { path: "/mint", title: "Mint", summary: "Deposit USDC to receive yield-bearing USDC+." },
  redeem: { path: "/redeem", title: "Redeem", summary: "Burn USDC+ to get USDC back, including the yield it earned." },
  whitelabel: { path: "/whitelabel", title: "Whitelabel", summary: "Configure your own branded yield-bearing stablecoin." },
  portfolio: { path: "/portfolio", title: "Portfolio", summary: "Your holdings, earned yield and transaction history (demo data)." },
  stats: { path: "/stats", title: "Statistics", summary: "Live protocol metrics and APY / exchange-rate history." },
} as const;

export type PageId = keyof typeof PAGES;
export const PAGE_IDS = Object.keys(PAGES) as PageId[];

export type ElementKind = "nav" | "button" | "input" | "select" | "display" | "section";

/** Validation rules the guide can check without the LLM. */
export type ValidationRule = "positive-amount" | "token-name" | "token-symbol" | "fee-bps" | "non-empty";

export interface ElementSpec {
  page: PageId | "global";
  kind: ElementKind;
  label: string;
  /** What the companion says when asked "what is this?". */
  description: string;
  validation?: ValidationRule;
  /**
   * Controls that move money or deploy state. The engine refuses to click or fill these
   * and every step targeting them must be a wait-for-the-user step.
   */
  sensitive?: boolean;
  /** Inputs the companion may fill — only after explicit user confirmation. */
  fillable?: boolean;
}

export const ELEMENTS = {
  // Global navigation
  "nav-dashboard": { page: "global", kind: "nav", label: "Dashboard", description: "Go back to your overview." },
  "nav-stablecoin": { page: "global", kind: "nav", label: "Stablecoins", description: "Learn about USDC+ and its live yield." },
  "nav-mint": { page: "global", kind: "nav", label: "Mint", description: "Turn USDC into yield-bearing USDC+." },
  "nav-redeem": { page: "global", kind: "nav", label: "Redeem", description: "Turn USDC+ back into USDC." },
  "nav-whitelabel": { page: "global", kind: "nav", label: "Whitelabel", description: "Create your own branded yieldcoin." },
  "nav-portfolio": { page: "global", kind: "nav", label: "Portfolio", description: "See what you hold and what you've earned." },
  "nav-stats": { page: "global", kind: "nav", label: "Statistics", description: "Protocol-wide numbers, live." },

  // Dashboard
  "dashboard-balance": { page: "dashboard", kind: "display", label: "Total balance", description: "The value of everything you hold in Reflect, in US dollars. This is demo data since no wallet is connected." },
  "dashboard-apy": { page: "dashboard", kind: "display", label: "Live APY", description: "APY is the yearly yield, including compounding. It's live from Reflect and changes with Solana lending rates, so it's not guaranteed." },
  "dashboard-stablecoins": { page: "dashboard", kind: "section", label: "Stablecoins", description: "The yield-bearing dollars Reflect offers. USDC+ is live; each one grows in value against the dollar it's backed by." },
  "dashboard-mint": { page: "dashboard", kind: "button", label: "Mint", description: "Start minting: deposit USDC and receive USDC+." },
  "dashboard-redeem": { page: "dashboard", kind: "button", label: "Redeem", description: "Swap USDC+ back to USDC whenever you like." },
  "dashboard-activity": { page: "dashboard", kind: "section", label: "Recent activity", description: "The latest real mints and redeems on Reflect, straight from the chain." },

  // Stablecoin detail
  "stablecoin-apy": { page: "stablecoin", kind: "display", label: "APY", description: "Annual percentage yield: what a deposit would earn over a year if today's rate held. It moves with lending demand." },
  "stablecoin-rate": { page: "stablecoin", kind: "display", label: "Exchange rate", description: "How many dollars one USDC+ is worth. It only goes up as yield accrues, which is how you earn without claiming anything." },
  "stablecoin-supply": { page: "stablecoin", kind: "display", label: "Supply", description: "How much USDC+ exists versus the protocol's cap." },
  "stablecoin-how": { page: "stablecoin", kind: "section", label: "How it works", description: "Your USDC is spread across Solana lending markets (Drift, Kamino, Jupiter Lend) to earn the best available rate." },
  "stablecoin-risks": { page: "stablecoin", kind: "section", label: "Risks", description: "Yield is variable. Smart-contract and lending-venue risks exist; insurance covers principal only." },
  "stablecoin-mint": { page: "stablecoin", kind: "button", label: "Mint USDC+", description: "Go to minting." },

  // Mint
  "mint-asset": { page: "mint", kind: "select", label: "Asset", description: "The stablecoin you'll receive. USDC+ is backed by USDC." },
  "mint-amount": { page: "mint", kind: "input", label: "Amount", description: "How much USDC you want to deposit.", validation: "positive-amount", fillable: true },
  "mint-quote": { page: "mint", kind: "display", label: "You receive", description: "The live estimate of USDC+ you'll get. It's slightly less than your USDC because each USDC+ is already worth a bit more than a dollar." },
  "mint-fees": { page: "mint", kind: "display", label: "Fees & rate", description: "Reflect charges no mint fee. You only pay a tiny Solana network fee." },
  "mint-review": { page: "mint", kind: "button", label: "Review mint", description: "Opens a summary of the transaction before anything is signed.", sensitive: true },
  "mint-sign": { page: "mint", kind: "button", label: "Approve in wallet", description: "Your wallet signs the transaction. Only you can do this. The companion never will.", sensitive: true },

  // Redeem
  "redeem-amount": { page: "redeem", kind: "input", label: "Amount", description: "How much USDC+ you want to redeem.", validation: "positive-amount", fillable: true },
  "redeem-quote": { page: "redeem", kind: "display", label: "You receive", description: "The USDC you'll get back. It's more than the USDC+ you burn because of the yield it earned." },
  "redeem-freshness": { page: "redeem", kind: "display", label: "Quote freshness", description: "When the quote was fetched. Rates move each block, so the transaction enforces a minimum amount instead." },
  "redeem-review": { page: "redeem", kind: "button", label: "Review redeem", description: "Opens the summary before signing.", sensitive: true },
  "redeem-sign": { page: "redeem", kind: "button", label: "Approve in wallet", description: "Your wallet signs the redemption. Only you can do this.", sensitive: true },

  // Whitelabel
  "wl-name": { page: "whitelabel", kind: "input", label: "Token name", description: "The full name people will see, like 'Acme Dollar'.", validation: "token-name", fillable: true },
  "wl-symbol": { page: "whitelabel", kind: "input", label: "Token symbol", description: "A short ticker of 2–8 capital letters, like ACMEUSD.", validation: "token-symbol", fillable: true },
  "wl-collateral": { page: "whitelabel", kind: "select", label: "Underlying collateral", description: "The Reflect stablecoin your token wraps. Its yield is what your users earn." },
  "wl-fee": { page: "whitelabel", kind: "input", label: "Fee", description: "Your share of the yield, in basis points. 100 bps is 1%. Higher fees mean less yield for your users.", validation: "fee-bps", fillable: true },
  "wl-summary": { page: "whitelabel", kind: "section", label: "Configuration summary", description: "Everything you've chosen, checked and ready." },
  "wl-deploy": { page: "whitelabel", kind: "button", label: "Deploy", description: "Deploying creates real on-chain accounts. It's disabled in this demo.", sensitive: true },

  // Portfolio & stats
  "portfolio-holdings": { page: "portfolio", kind: "section", label: "Holdings", description: "What you own (demo data)." },
  "portfolio-yield": { page: "portfolio", kind: "section", label: "Yield earned", description: "How your balance grew from yield over time (demo data)." },
  "stats-metrics": { page: "stats", kind: "section", label: "Protocol metrics", description: "Live holders, supply and volume." },
  "stats-apy-history": { page: "stats", kind: "section", label: "APY history", description: "How USDC+ yield moved day by day." },
} as const satisfies Record<string, ElementSpec>;

export type ElementId = keyof typeof ELEMENTS;
export const ELEMENT_IDS = Object.keys(ELEMENTS) as ElementId[];

export function getElement(id: string): (ElementSpec & { id: ElementId }) | null {
  return id in ELEMENTS ? { id: id as ElementId, ...(ELEMENTS as Record<string, ElementSpec>)[id]! } : null;
}

export function pageForPath(pathname: string): PageId {
  if (pathname.startsWith("/stablecoins")) return "stablecoin";
  const hit = PAGE_IDS.find((p) => PAGES[p].path === pathname);
  return hit ?? "dashboard";
}

export function elementsOnPage(page: PageId) {
  return ELEMENT_IDS.filter((id) => {
    const p = ELEMENTS[id].page;
    return p === page || p === "global";
  });
}

// ───────── validation (pure, shared by forms, guide engine and tests) ─────────

export function validate(rule: ValidationRule, value: string): string | null {
  const v = value.trim();
  switch (rule) {
    case "positive-amount":
      if (!/^\d+(\.\d{1,6})?$/.test(v) || Number(v) <= 0) return "Enter an amount above zero (max 6 decimals).";
      if (Number(v) > 1_000_000) return "That's above this demo's 1,000,000 limit.";
      return null;
    case "token-name":
      if (v.length < 3 || v.length > 32) return "Use 3–32 characters.";
      if (!/^[A-Za-z0-9 .'-]+$/.test(v)) return "Letters, numbers, spaces, . ' and - only.";
      return null;
    case "token-symbol":
      return /^[A-Z][A-Z0-9]{1,7}$/.test(v) ? null : "2–8 capital letters or digits, starting with a letter.";
    case "fee-bps": {
      if (!/^\d+$/.test(v)) return "Whole basis points, e.g. 50.";
      const n = Number(v);
      return n > 1_000 ? "Keep it at or under 1,000 bps (10%) so users still earn yield." : null;
    }
    case "non-empty":
      return v ? null : "Required.";
  }
}
