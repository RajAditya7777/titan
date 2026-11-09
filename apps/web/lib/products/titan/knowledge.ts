import { TITAN_GITBOOK_DOCS } from "./gitbook-content";

/**
 * What the companion knows about Titan: the official GitBook (summarised in gitbook-content.ts)
 * plus what the live titan.exchange/pro page shows (captured Nov 2026). Generated from the docs
 * data, so it stays in step when that content is refreshed.
 */
const DOCS = Object.values(TITAN_GITBOOK_DOCS)
  .map((d) => `- ${d.title}: ${d.summary} ${d.content.overview.replace(/\s+/g, " ").slice(0, 320)}`)
  .join("\n");

export const TITAN_KNOWLEDGE = `TITAN FACTS (titan.exchange and the official Titan docs):
${DOCS}

COMPARED WITH A SINGLE AGGREGATOR (such as Jupiter): Titan is a meta-aggregator. It asks several aggregators and RFQ market makers for quotes at once, adds its own Argos routing, simulates them and executes the best one, so a swap should do at least as well as any single aggregator. Prime adds zero Titan protocol fees and private, MEV-protected submission.

TITAN PRO PAGE (titan.exchange/pro), what's on screen:
- Top nav: Swap, Pro (New), Profile, Rewards, More. SOL price chip and Connect Wallet at top right.
- Left: token list with All / Your tokens / Watchlist, a search box, and filters Trending, Stocks, Memes, DART. Each row shows price, market cap and 24h change.
- Centre: the selected token header (address, price, 24H change, 24H volume, market cap, FDV, liquidity, holders, a watchlist star), then Chart / Info, timeframes and indicators, then Holdings / Open orders / Order history.
- Right: order panel with Market, Limit and Slice tabs and a Prime badge; Buy / Sell; "Pay with" amount and token, quick 5% / 10% / 25% / 50% / Max; "Est. receive"; the rate line.
- Conditional orders (Limit, Slice) need a Titan embedded wallet that holds tokens until your price is hit; your keys stay yours and you can withdraw any time.
- Slice splits a large order into smaller pieces to reduce price impact.
- There's a guided Titan Pro tour for new users.
- In this demo, prices are fixed demo values and the wallet is simulated.`;
