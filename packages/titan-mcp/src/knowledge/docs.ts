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
        "Argos analyzes hundreds of liquidity pools across Raydium, Orca Whirlpools, Phoenix, Meteora, and OpenBook to find the mathematically optimal multi-hop trade path with zero frontrunning risk.",
    },
    dart: {
      name: "DART (Dynamic Adaptive Routing Technology)",
      summary:
        "DART continuously re-allocates trade chunks on-chain at execution time. If pool liquidity or pricing changes while your transaction is in flight, DART dynamically shifts trade volume to the best available pool, preventing slippage loss.",
    },
    prime: {
      name: "Titan Prime Mode",
      summary:
        "Prime provides 0% protocol fee execution, MEV sandwich protection via private relays (Nozomi/Jito), and exclusive access to private market-maker liquidity.",
    },
    limitOrders: {
      name: "Titan Limit Orders",
      summary:
        "On-chain limit orders that require a minimum order notional of $10. Filled directly by automated market makers with partial fill support and no gas cost until execution.",
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
