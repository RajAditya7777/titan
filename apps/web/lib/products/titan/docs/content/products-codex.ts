import type { DocContent } from "../schema";

/** Page bodies for this section, keyed by slug. Own words; facts exact. */
export const PAGES: Record<string, DocContent> = {
  "codex-of-knowledge/how-swaps-work": {
    blocks: [
      { t: "p", text: "A swap is how people on a blockchain exchange one token for another. A plain token-for-token trade with no leverage is called a spot swap or spot trade, because the token itself is what gets traded." },
      { t: "p", text: "In DeFi, the user signs a transaction in their wallet so the trade runs on the platform they chose. The transaction is propagated across the entire global network, and shortly afterwards the trade is confirmed and the outcome shows up in the wallet. One benefit is that funds move immediately, without the waiting period found in traditional markets. Solana also does this at very low cost (sub cent), which makes it more efficient than many money-transmitting networks, especially for international transfers." },
    ],
  },

  "codex-of-knowledge/dex-aggregators": {
    blocks: [
      { t: "p", text: "Spot trading on Solana can be done in several ways: directly on a centralized exchange (CEX) such as Binance or Coinbase, on a decentralized exchange (DEX) such as Orca or Raydium, or via a DEX Aggregator such as Titan or Jupiter. Trading on a single CEX or DEX means your liquidity comes from just one venue, and that venue may not give the best price." },
      { t: "p", text: "In traditional finance, a broker with access to many liquidity sources can find you the best price once you hold an account. In crypto, the only way to get that without dedicated infrastructure and multiple compliance checks is to pool liquidity from many DEXes. Platforms that do this are called DEX Aggregators." },
      { t: "p", text: "The challenge for DEX Aggregators is fairly unusual. Traditional markets run so fast (nanoseconds) that orders must be handled almost instantly. Crypto markets have plenty of distributed liquidity and enough time to apply advanced analytics to find the best possible route." },
      { t: "p", text: "Solana's low fees make aggregation especially strong there. Complex routes that give better prices are practical, and their gains are not eaten up by the very high gas costs seen on Ethereum. For that reason, DEX Aggregators are the preferred way to trade on low-cost chains when the goal is to get the most value from your assets." },
    ],
  },

  "codex-of-knowledge/editor": {
    lead: "How Titan provides outperformance",
    blocks: [
      { t: "p", text: "DEX aggregators have traditionally used shortest-path algorithms to find routes through liquidity. These are battle-tested and simple to build. But given how crypto markets work, the latency demands, and the assumptions built into shortest-path methods, liquidity sources often get temporarily dropped just to make routing workable." },
      { t: "p", text: "A second issue is that a given route may not have much capacity. When the pools along it have small TVL, the price shifts quickly as more of the user's funds pass through each exchange. To model this price impact, liquidity is commonly fragmented: every pool is split into many pieces, each with an average price and a limited capacity. This shows up in both the algorithm and its output. Jupiter, another DEX aggregator, currently splits its routes into tidy 1% buckets, for instance. Fragmenting liquidity enlarges the network that must be searched and causes inaccuracies when a pool is poorly resolved." },
      { t: "p", text: "These two problems are major obstacles to using shortest-path methods for DEX aggregation. Titan instead uses a different family of algorithms built around optimization, which led to the Argos algorithm. They resolve price impact with machine-level precision, without fragmenting pools and without having to exclude liquidity sources, producing a true optimal on-chain price." },
    ],
  },

  "codex-of-knowledge/markdown": {
    blocks: [
      { t: "p", text: "DEX aggregation is the right approach on low-cost chains, but each DEX Aggregator returns different quotes, because they use different algorithms and different data sets." },
      { t: "p", text: "Whatever technique or aggregator is involved, Titan combines DEX Aggregators on the user's behalf, which makes it a Meta Aggregator. A Meta Aggregator takes the quote from each individual aggregator and hands the user the best one, so the user can trust they are getting the best price on offer at any moment." },
      { t: "p", text: "It resembles a traditional equity broker. When an order comes in, the broker asks several market makers, who supply the liquidity and trade on the individual exchanges. The broker then picks the best quote and passes it on to the user." },
      { t: "p", text: "Mapped onto crypto, the players are:" },
      {
        t: "list",
        items: [
          "Exchange -> DEX",
          "Market Maker -> DEX Aggregator",
          "Broker -> Meta Aggregator",
        ],
      },
      { t: "p", text: "Titan operates as a Meta Aggregator so that users are assured of the best price on offer." },
      { t: "h3", text: "How to Compare and Verify" },
      { t: "p", text: "For Meta Aggregation to work, aggregator quotes must be accurate and must refer to the same block so they can be compared. Inaccurate quotes have to be filtered out, and latency differences have to be accounted for. Fortunately, one solution covers both problems." },
      { t: "p", text: "Titan simulates every quote directly on the blockchain, which reveals the real amount out a user would receive if the trade executed at that moment. Because this removes the effect of quotes arriving at different times, quotes become comparable. Each quote keeps being simulated through its valid period, so users see the most current information." },
    ],
  },

  "codex-of-knowledge/dart-routing": {
    lead: "Titan's onchain routing engine — the first router that dynamically re-optimizes a trade at the exact moment of execution, not seconds before",
    blocks: [
      { t: "p", text: "**DART** (Dynamic Allocation and Real Time) Routing is the onchain routing engine built by Titan. It is the first router anywhere to re-optimize a trade dynamically at the very instant it executes, instead of some seconds earlier." },
      { t: "h3", text: "The Quote to Execution Gap" },
      { t: "p", text: "Aggregators usually work out a trade's route before the transaction is submitted to the blockchain: the route is calculated, a quote goes back to the user, and then the transaction is broadcast. By the time it is included in a block, the delay may range from a few hundred milliseconds up to several seconds." },
      { t: "p", text: "During that window, liquidity conditions across pools change, prices move, and other trades run against the same routes. The route that was best when quoted is no longer best at execution. This gap between computing a route and executing it is a built-in limitation of every pre-execution routing system." },
      { t: "p", text: "For small trades the gap may be minor. For larger trades the cost of staleness grows fast, since both price impact and route quality have shifted by the time the transaction settles." },
      { t: "h3", text: "How DART Works" },
      { t: "p", text: "DART rests on a simple idea: when the trade executes, whichever pools quote the best prices for it are the ones that fill it. Market makers need room to move their spreads up or down as conditions require, and DART ensures your trade is routed to the best venues whatever adjustments they make." },
      { t: "p", text: "The first step happens before the transaction exists. Titan's offchain infrastructure decides on the overall shape of the route, picking the pools to include, the venues with the most liquidity for the size of your trade, and the paths worth considering. DART then takes over from that groundwork." },
      { t: "p", text: "When the trade executes, **DART re-optimizes, onchain and in real time, the way your volume is divided among a large number of pools**. All available liquidity is in scope, among it:" },
      {
        t: "list",
        items: [
          "Proprietary AMMs",
          "Orca and Meteora (non-prop AMMs)",
          "DEXes built on orderbooks",
          "Pools that mint and redeem",
        ],
      },
      { t: "p", text: "The result: a wider set of pools, more intelligent weighting, and stronger execution." },
      { t: "p", text: "**Argos**, Titan's offchain router, runs next to DART and is already the most sophisticated router on Solana. The pair makes up a hybrid routing engine that closes the gap as much as possible and gives the best execution Solana currently offers." },
      { t: "h3", text: "Best Bid Offer Guarantee" },
      { t: "p", text: "Because DART settles the routing at execution against real onchain state, it can promise a **Best Bid Offer (BBO)** guarantee. At the exact moment a trade executes, it is filled by whichever market makers are quoting the best prices." },
      { t: "p", text: "Regulated venues in traditional finance are held to BBO as their benchmark: an order you place must be filled at the best price among every liquidity source connected to the exchange at that time. With DART, Solana gets that same guarantee onchain for the first time." },
      { t: "p", text: "In practice, users receive more than the best route discoverable ahead of sending. They get the best route in existence when the transaction lands, worked out live from current market conditions." },
      { t: "callout", tone: "info", text: "**For onchain execution on Solana, DART sets the de facto standard.**" },
    ],
  },
};
