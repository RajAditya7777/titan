import type { Step } from "@/lib/companion/actions";

/**
 * Jupiter (jup.ag) demo: tokens, what the companion knows, and deterministic planners (D-004).
 * Prices are fixed and the wallet is simulated (D-008, D-011): only the LLM is live.
 */

export const JUP_TOKENS = {
  SOL: { name: "Solana", price: 94.7, mint: "So11…1112", color: "#9945ff" },
  USDC: { name: "USD Coin", price: 1, mint: "EPjF…Dt1v", color: "#2775ca" },
  JUP: { name: "Jupiter", price: 0.2546, mint: "JUPy…DvCN", color: "#c7f284" },
  USDT: { name: "Tether", price: 1, mint: "Es9v…wNYB", color: "#26a17b" },
  BONK: { name: "Bonk", price: 0.0000142, mint: "DezX…B263", color: "#f7a325" },
  JitoSOL: { name: "Jito Staked SOL", price: 116.3, mint: "J1to…GCPn", color: "#58c48a" },
} as const;
export type JupToken = keyof typeof JUP_TOKENS;
export const JUP_TOKEN_IDS = Object.keys(JUP_TOKENS) as JupToken[];

export const PERP_MARKETS = { SOL: 94.7, ETH: 3462.5, BTC: 77843.5 } as const;
export type PerpMarket = keyof typeof PERP_MARKETS;

export function normalizeJupToken(t: string | undefined, fallback: JupToken): JupToken {
  return JUP_TOKEN_IDS.find((k) => k.toLowerCase() === (t ?? "").trim().toLowerCase()) ?? fallback;
}

/** Quote from fixed prices: Ultra routing modelled as a 0.05% fee and a tiny impact on size. */
export function quote(sell: JupToken, buy: JupToken, amount: number) {
  const usd = amount * JUP_TOKENS[sell].price;
  const impact = Math.min(0.012, usd / 4_000_000);
  const out = (usd / JUP_TOKENS[buy].price) * (1 - 0.0005 - impact);
  return { out, usd, impactPct: impact * 100, route: sell === "BONK" || buy === "BONK" ? "Ultra · 3 hops via SOL" : "Ultra · 2 venues, split route" };
}

export function liquidationPrice(side: "long" | "short", entry: number, leverage: number) {
  const move = (1 / leverage) * 0.9;
  return side === "long" ? entry * (1 - move) : entry * (1 + move);
}

export const JUP_SUGGESTIONS = [
  "I'm new. Show me around Jupiter",
  "Help me swap 1 SOL for USDC",
  "Look at my screen and explain it",
  "Set a limit order to buy SOL at $90",
  "Open a 5x SOL long with 100 USDC",
  "What's the difference between Market, Limit and DCA?",
  "How does liquidation work on perps?",
];

export const JUPITER_KNOWLEDGE = `JUPITER FACTS (jup.ag, "The Home of Onchain Finance" on Solana):
- Swap (home page): Market, Limit (with Take Profit) and DCA tabs. "Ultra" mode handles routing, slippage and priority fees automatically and finds the best price across Solana venues; you pick Sell and Buy tokens and an amount, then Swap. Wallets connect via Connect.
- Limit orders: "Sell when TOKEN reaches your target". Set a trigger price (Market, +1%, +5%, +10% shortcuts), choose expiry (Custom, 1H, 1D, 1W, 30D). Fills at your price or better, possibly in parts. Stablecoins can't be the trigger mint.
- DCA: split a buy or sell into recurring orders over time.
- Perps: long or short SOL, ETH and BTC with up to 250x leverage (some markets in beta), backed by the JLP liquidity pool. You choose Long/Buy or Short/Sell, Market or Limit, collateral amount and leverage; can add TP/SL. Higher leverage means a liquidation price closer to your entry. Borrow fees accrue on open positions.
- Portfolio: track holdings, DeFi positions, yield, PnL and airdrops across 198 Solana protocols; view a wallet address or demo wallets (DeFi whale, JUP staker, Airdrop farmer); multi-wallet groups, activity history, address book, airdrop checker, yield estimate.
- Other products in the sidebar: Spot (token markets, stocks), Predict (prediction markets), Gacha, Bridge (50+ chains, beta), YOLO (beta), Lend (Earn vaults, Multiply), Offerbook, Stake SOL, Stake JUP, Send (crypto as a link), Deposit, Mobile app.
- JUP is Jupiter's token; stakers vote in the DAO.
- Safety: slippage protects you from price moves; price impact grows with trade size versus liquidity. Never share a seed phrase. Every transaction is approved in the user's own wallet.`;

export interface JupState {
  product?: "jupiter";
  page?: string;
  connected?: boolean;
  sellToken?: string;
  buyToken?: string;
  amount?: string;
  balances?: Record<string, number>;
  perpSide?: "long" | "short";
}

export type JupGoal = "tour" | "swap" | "limit" | "perps" | "portfolio";

export function planJupiter(goal: JupGoal, params: Record<string, string | undefined>, state: JupState = {}): { title: string; steps: Step[] } {
  const connect: Step[] = state.connected
    ? []
    : [
        { type: "wait_for_user_action", target: "jup-connect", say: "First connect a wallet. Tap Connect at the top right." },
        { type: "wait_for_user_action", target: "jup-wallet-connect", say: "This is a demo wallet with play money. Tap it to connect." },
      ];
  const sell = normalizeJupToken(params.inputToken, goal === "perps" ? "USDC" : "SOL");
  const buy = normalizeJupToken(params.outputToken, sell === "USDC" ? "SOL" : "USDC");
  const amount = Number(params.amount) > 0 ? String(Number(params.amount)) : goal === "perps" ? "100" : "1";

  switch (goal) {
    case "tour":
      return {
        title: "Tour of Jupiter",
        steps: [
          { type: "navigate_to_page", page: "jup_swap" },
          { type: "point", target: "jup-swap-card", say: "This is the swap. Pick what you sell and what you buy, and Jupiter finds the best route across Solana." },
          { type: "point", target: "jup-ultra", say: "Ultra mode handles slippage and fees for you, so you don't have to tune anything." },
          { type: "point", target: "jup-tab-limit", say: "Limit lets you trade only when a price hits your target. DCA spreads a buy over time." },
          { type: "navigate_to_page", page: "jup_perps", say: "Perps is for leverage." },
          { type: "point", target: "jup-perps-leverage", say: "You can go up to 250x here, but higher leverage puts your liquidation price closer. Start small." },
          { type: "navigate_to_page", page: "jup_portfolio", say: "And Portfolio tracks everything you hold." },
          { type: "point", target: "jup-portfolio-demo", say: "Try a demo wallet to see how it looks. Want me to walk you through a first swap?" },
        ],
      };
    case "swap":
      return {
        title: `Swap ${amount} ${sell} for ${buy}`,
        steps: [
          { type: "navigate_to_page", page: "jup_swap" },
          ...connect,
          { type: "request_input", target: "jup-sell-token", say: `You're selling ${sell}.`, suggestedValue: sell },
          { type: "request_input", target: "jup-buy-token", say: `And buying ${buy}.`, suggestedValue: buy },
          { type: "request_input", target: "jup-sell-amount", say: `How much? Let's say ${amount}.`, suggestedValue: amount },
          { type: "point", target: "jup-quote", say: "Here's your quote and the route Jupiter found. Price impact is how much your size moves the price." },
          { type: "stop_before_signing", target: "jup-swap-submit", say: "Happy with it? Tap Swap and approve in your wallet. I never sign for you." },
        ],
      };
    case "limit": {
      // Price is per 1 sell token, in the buy token. Default: take profit 5% above market.
      const market = JUP_TOKENS[sell].price / JUP_TOKENS[buy].price;
      const price = Number(params.price) > 0 ? String(Number(params.price)) : String(Math.round(market * 1.05 * 1e4) / 1e4);
      return {
        title: `Limit order: ${sell} → ${buy}`,
        steps: [
          { type: "navigate_to_page", page: "jup_limit" },
          ...connect,
          { type: "request_input", target: "jup-sell-amount", say: `How much ${sell} to sell? Let's say ${amount}.`, suggestedValue: amount },
          { type: "request_input", target: "jup-limit-price", say: `Now your target price. The order only fills at ${price} or better.`, suggestedValue: price },
          { type: "point", target: "jup-limit-expiry", say: "Pick how long the order stays open. One week is a good default." },
          { type: "stop_before_signing", target: "jup-limit-submit", say: "Tap Place order and approve in your wallet." },
        ],
      };
    }
    case "perps": {
      const side = /short/i.test(params.side ?? "") ? "short" : "long";
      const lev = Math.min(250, Math.max(1.1, Number(params.leverage) || 5));
      return {
        title: `${side === "long" ? "Long" : "Short"} SOL ${lev}x`,
        steps: [
          { type: "navigate_to_page", page: "jup_perps" },
          ...connect,
          { type: "point", target: side === "long" ? "jup-perps-long" : "jup-perps-short", say: side === "long" ? "Long means you profit if SOL goes up." : "Short means you profit if SOL goes down." },
          { type: "request_input", target: "jup-perps-amount", say: `Your collateral: ${amount} USDC.`, suggestedValue: amount },
          { type: "request_input", target: "jup-perps-leverage", say: `Leverage ${lev}x. Remember, more leverage means less room before liquidation.`, suggestedValue: String(lev) },
          { type: "point", target: "jup-perps-liq", say: "This is your liquidation price. If SOL reaches it, the position closes and you lose the collateral." },
          { type: "stop_before_signing", target: "jup-perps-submit", say: "If that looks right, open the position and approve in your wallet." },
        ],
      };
    }
    case "portfolio":
      return {
        title: "Your portfolio",
        steps: [
          { type: "navigate_to_page", page: "jup_portfolio" },
          { type: "point", target: "jup-portfolio-search", say: "Paste any wallet address or .sol domain here to track it." },
          { type: "point", target: "jup-portfolio-demo", say: "Or open a demo wallet to see holdings, positions and airdrops." },
        ],
      };
  }
}
