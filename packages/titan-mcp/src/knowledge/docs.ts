export const TITAN_DOCS = {
  appName: "Titan Exchange",
  description:
    "Titan is a Solana DEX meta-aggregator designed to minimize trading fees and maximize output using Argos off-chain optimization and DART on-chain dynamic execution.",
  officialLinks: {
    website: "https://titan.exchange/",
    app: "https://titan.exchange/pro",
    docs: "https://titan-exchange.gitbook.io/titan/",
    developers: "https://developer.titan.exchange/",
  },
  supportedTokens: [
    { symbol: "SOL", name: "Solana", priceUsd: 93.759, decimals: 9 },
    { symbol: "USDC", name: "USD Coin", priceUsd: 1.0, decimals: 6 },
    { symbol: "USDT", name: "Tether USD", priceUsd: 1.0, decimals: 6 },
    { symbol: "JUP", name: "Jupiter", priceUsd: 0.84, decimals: 6 },
    { symbol: "BONK", name: "Bonk", priceUsd: 0.000021, decimals: 5 },
    { symbol: "cbBTC", name: "Coinbase Wrapped BTC", priceUsd: 77768.9, decimals: 8 },
    { symbol: "ETH", name: "Ethereum (Portal)", priceUsd: 2260.63, decimals: 8 },
    { symbol: "HYPE", name: "Hyperliquid", priceUsd: 86.929, decimals: 6 },
    { symbol: "PUMP", name: "Pump.fun", priceUsd: 0.00412891, decimals: 6 },
    { symbol: "ZEC", name: "Zcash", priceUsd: 1219.7, decimals: 8 },
  ],
  keyConcepts: {
    argos: {
      name: "Argos Off-Chain Optimization Engine",
      summary:
        "Argos is Titan's own off-chain, optimisation-based routing algorithm: it plans how to split a trade across routes before it is sent.",
    },
    dart: {
      name: "DART (Dynamic Allocation and Real Time)",
      summary:
        "DART is an on-chain router that can re-split a trade across pools at execution time. Modes: Auto (Argos + DART, recommended), Only and Off. Works on listed pairs such as SOL/USDC, SOL/USDT, USDT/USDC and cbBTC/USDC; up to 1 bps fee.",
    },
    prime: {
      name: "Titan Prime Mode",
      summary:
        "Prime sets slippage and transaction landing automatically, includes sandwich protection, and has zero Titan fees. Manual mode instead exposes Max Slippage (Base Tokens and Stable/LST) and Priority Fees or MEV Protect (Jito + Nozomi), each Auto or Custom.",
    },
    limitOrders: {
      name: "Titan Limit Orders",
      summary:
        "On-chain limit orders filled by market makers with partial fills. Minimum $10 notional, 10 bps fee, a limit price worse than market is not allowed, expiry Custom/7D/1D/1H/Never, open orders can be cancelled.",
    },
    slippage: {
      name: "Max Slippage & Price Impact",
      summary:
        "Slippage is the maximum price discrepancy tolerated before the transaction reverts. Base tokens typically default to 0.5% (50 bps), while volatile or memecoins may require 1–3%.",
    },
  },
  errorDiagnoses: {
    "slippage-exceeded": {
      title: "Slippage Tolerance Exceeded",
      description: "The market price moved unfavorably past your configured slippage percentage while the transaction was in flight.",
      resolution: "Increase your slippage tolerance in Settings (e.g. from 0.5% to 1.0%), or switch DART mode to 'Auto' to dynamically absorb price shifts.",
    },
    "limit-min-notional": {
      title: "Order Below $10 Minimum",
      description: "Titan limit orders require a minimum order notional value of $10 to prevent dust order spam.",
      resolution: "Increase the limit order quantity or limit price so the total value is at least $10.00.",
    },
    "insufficient-sol": {
      title: "Insufficient SOL for Network Fees",
      description: "Your wallet does not have enough native SOL to pay for the Solana transaction fee and rent.",
      resolution: "Keep at least 0.02 SOL in your wallet to cover transaction fees and temporary account creation.",
    },
    "route-not-found": {
      title: "No Liquidity Route Found",
      description: "There is currently insufficient pool liquidity to bridge between the two requested tokens.",
      resolution: "Try swapping through an intermediate hub asset such as SOL or USDC.",
    },
  },
} as const;
