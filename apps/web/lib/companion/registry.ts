/**
 * The page & element registry is the companion's map of the app — and its security boundary.
 * The LLM can only refer to ids listed here; the guide engine resolves an id to the DOM through
 * `[data-companion="<id>"]`, never through selectors the model invents.
 */

export const PAGES = {
  // Marketing site (modelled on reflect.money's information architecture, original content)
  home: { path: "/", title: "Home", summary: "What Reflect is: earn on stablecoins, create a branded savings product, protect tokenised assets." },
  earn: { path: "/earn", title: "Earn", summary: "How USDC+ and USDT+ earn yield from diversified, over-collateralised lending." },
  create: { path: "/create", title: "Create", summary: "Launch your own branded stablecoin savings product on Reflect." },
  calculator: { path: "/create/calculator", title: "Revenue calculator", summary: "Estimate what a branded savings product could earn you and your users." },
  protect: { path: "/protect", title: "Protect", summary: "Split a tokenised asset into a protected senior tranche and an amplified junior tranche." },
  build: { path: "/build", title: "Build", summary: "The Reflect REST API and how developers integrate it." },
  assets: { path: "/assets", title: "Assets", summary: "Every Reflect asset: plain yield stablecoins and protected or amplified tranches." },
  caseStudies: { path: "/case-studies", title: "Case studies", summary: "How asset issuers use Reflect, in short." },
  privacy: { path: "/privacy", title: "Privacy", summary: "What this demo does and does not collect." },
  // App
  usdt: { path: "/usdt", title: "USDT+", summary: "Mint or redeem USDT+ with a live quote, and read its details." },
  dashboard: { path: "/dashboard", title: "Dashboard", summary: "Your balances, the live USDC+ yield and recent protocol activity." },
  stablecoin: { path: "/stablecoins/usdc-plus", title: "USDC+", summary: "What USDC+ is, its live APY, exchange rate, supply and risks." },
  mint: { path: "/mint", title: "Mint", summary: "Deposit USDC to receive yield-bearing USDC+." },
  redeem: { path: "/redeem", title: "Redeem", summary: "Burn USDC+ to get USDC back, including the yield it earned." },
  whitelabel: { path: "/whitelabel", title: "Whitelabel", summary: "Configure your own branded yield-bearing stablecoin." },
  portfolio: { path: "/portfolio", title: "Portfolio", summary: "Your holdings, earned yield and transaction history (demo data)." },
  stats: { path: "/stats", title: "Statistics", summary: "Live protocol metrics and APY / exchange-rate history." },
  // Titan Exchange routes
  titan_swap: { path: "/titan/swap", title: "Titan Swap", summary: "Meta-aggregated swap on Solana using Argos off-chain optimization and DART on-chain execution." },
  titan_pro: { path: "/titan/pro", title: "Titan Pro Terminal", summary: "Advanced DEX trading terminal with real-time candlestick charts, order books, and market explorer." },
  titan_limit: { path: "/titan/limit", title: "Titan Limit Orders", summary: "On-chain limit orders filled by market makers with partial fill support and a $10 minimum order notional." },
  titan_profile: { path: "/titan/profile", title: "Titan Portfolio", summary: "View your connected balances, asset allocations, 24h PnL performance, and past Solana transactions." },
  titan_rewards: { path: "/titan/rewards", title: "Titan Rewards & Prime", summary: "Titan Prime zero-fee status, volume points leaderboard, and referral fee rebate rewards." },
  titan_learn: { path: "/titan/learn", title: "Titan Concepts & Learn", summary: "Educational breakdown of DART routing, Argos arbitrage protection, Prime mode, and MEV sandwich protection." },
  titan_docs: { path: "/titan/docs", title: "Titan Documentation", summary: "Official Titan GitBook clone with Argos routing, DART architecture, Prime tier, limit orders, and TypeScript SDK docs." },
  // Umbra Privacy / Nimbus routes
  umbra_home: { path: "/umbra", title: "Umbra", summary: "The Privacy Layer for your Money: hold, send, swap and earn privately on Solana; compliance, Nimbus SDK and FAQs." },
  umbra_app: { path: "/umbra/app", title: "Umbra App", summary: "The Umbra web app: create an account, then deposit, send, swap and withdraw from a private balance (simulated wallet)." },
  jup_swap: { path: "/jup", title: "Jupiter Swap", summary: "Swap any Solana token at the best price with Ultra routing; Market, Limit and DCA." },
  jup_limit: { path: "/jup/limit", title: "Jupiter Limit Order", summary: "Sell or buy when a token reaches your target price, with an expiry." },
  jup_perps: { path: "/jup/perps", title: "Jupiter Perps", summary: "Long or short SOL, ETH and BTC with up to 250x leverage, backed by JLP." },
  jup_gacha: { path: "/jup/gacha", title: "Jupiter Gacha", summary: "Open packs to pull real graded collectible cards; collection and marketplace." },
  jup_portfolio: { path: "/jup/portfolio", title: "Jupiter Portfolio", summary: "Track holdings, positions, yield and airdrops across 198 Solana protocols." },
  umbra: { path: "/umbra/console", title: "Nimbus Console", summary: "Confidential balances, private transfers, and shielding on Solana powered by the Nimbus protocol (simulated demo)." },
} as const;

export type PageId = keyof typeof PAGES;
export const PAGE_IDS = Object.keys(PAGES) as PageId[];

export type ElementKind = "nav" | "button" | "input" | "select" | "display" | "section";

/** Validation rules the guide can check without the LLM. */
export type ValidationRule = "positive-amount" | "capital" | "token-name" | "token-symbol" | "fee-bps" | "non-empty" | "token-choice" | "jup-token" | "leverage";

export interface ElementSpec {
  page: PageId | "global";
  /** For global elements: which chrome renders them (the app's tab bar or the marketing header). */
  layout?: "app" | "site" | "jup";
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
  "nav-dashboard": { page: "global", layout: "app", kind: "nav", label: "Dashboard", description: "Go back to your overview." },
  "nav-stablecoin": { page: "global", layout: "app", kind: "nav", label: "Stablecoins", description: "Learn about USDC+ and its live yield." },
  "nav-usdt": { page: "global", layout: "app", kind: "nav", label: "USDT+", description: "Mint or redeem USDT+, with a live quote." },
  "nav-mint": { page: "global", layout: "app", kind: "nav", label: "Mint", description: "Turn USDC into yield-bearing USDC+." },
  "nav-redeem": { page: "global", layout: "app", kind: "nav", label: "Redeem", description: "Turn USDC+ back into USDC." },
  "nav-whitelabel": { page: "global", layout: "app", kind: "nav", label: "Whitelabel", description: "Create your own branded yieldcoin." },
  "nav-portfolio": { page: "global", layout: "app", kind: "nav", label: "Portfolio", description: "See what you hold and what you've earned." },
  "nav-stats": { page: "global", layout: "app", kind: "nav", label: "Statistics", description: "Protocol-wide numbers, live." },

  // Dashboard
  "dashboard-balance": { page: "dashboard", kind: "display", label: "Total balance", description: "The value of everything you hold in Reflect, in US dollars. This is demo data since no wallet is connected." },
  "dashboard-apy": { page: "dashboard", kind: "display", label: "Live APY", description: "APY is the yearly yield, including compounding. It's live from Reflect and changes with Solana lending rates, so it's not guaranteed." },
  "dashboard-stablecoins": { page: "dashboard", kind: "section", label: "Stablecoins", description: "The yield-bearing dollars Reflect offers. USDC+ is live; each one grows in value against the dollar it's backed by." },
  "dashboard-new-user": { page: "dashboard", kind: "section", label: "New user help", description: "If you haven't deposited yet, this starts a guided first deposit. I point at each step and you approve everything in your own wallet." },
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

  // Marketing site
  "site-launch-app": { page: "global", layout: "site", kind: "nav", label: "Open app", description: "Open the app, where you can get quotes and walk through minting." },
  "home-yield-sim": { page: "home", kind: "section", label: "Yield preview", description: "Shows how a balance would grow at today's live USDC+ rate. It's an estimate: the rate is variable." },
  "home-builder": { page: "home", kind: "section", label: "Savings builder", description: "A preview of a branded savings account built on Reflect stablecoins." },
  "home-tranche-sim": { page: "home", kind: "section", label: "Protection preview", description: "An example pool split into a protected senior part and an amplified junior part. Move the loss slider to see who absorbs it first." },
  "home-stats": { page: "home", kind: "section", label: "Protocol numbers", description: "Live protocol totals from Reflect's public API." },
  "earn-apy": { page: "earn", kind: "display", label: "Live APYs", description: "Today's variable APY for each Reflect stablecoin, live from the API." },
  "calc-deposits": { page: "calculator", kind: "input", label: "Expected deposits", description: "How many dollars you expect users to deposit into your product.", validation: "capital", fillable: true },
  "calc-fee": { page: "calculator", kind: "input", label: "Your fee", description: "Your share of the yield in basis points. 100 bps is 1% of the yield, not of deposits.", validation: "fee-bps", fillable: true },
  "calc-result": { page: "calculator", kind: "display", label: "Estimated revenue", description: "Your yearly revenue and your users' net APY, estimated from today's live APY." },
  "protect-sim": { page: "protect", kind: "section", label: "Loss simulator", description: "Drag the loss to see how the junior tranche absorbs it before the senior tranche is touched." },
  "build-endpoints": { page: "build", kind: "section", label: "API endpoints", description: "The main Reflect API endpoints, grouped by product." },
  "assets-list": { page: "assets", kind: "section", label: "Asset list", description: "Each Reflect asset with its family and what backs it." },

  // USDT+ app page
  "usdt-details": { page: "usdt", kind: "section", label: "Details", description: "Live APY, exchange rate and supply for USDT+, straight from Reflect." },
  "usdt-amount": { page: "usdt", kind: "input", label: "Amount", description: "How much to deposit or redeem.", validation: "positive-amount", fillable: true },
  "usdt-quote": { page: "usdt", kind: "display", label: "You receive", description: "The live quote from Reflect for the amount you entered." },
  "usdt-review": { page: "usdt", kind: "button", label: "Review", description: "Opens a summary before anything is signed.", sensitive: true },
  "usdt-sign": { page: "usdt", kind: "button", label: "Approve in wallet", description: "Your wallet signs. Only you can do this. The companion never will.", sensitive: true },
  "usdt-faq": { page: "usdt", kind: "section", label: "FAQs", description: "Short answers about where the yield comes from and the risks." },

  // Titan Exchange Global
  "titan-nav-swap": { page: "global", kind: "nav", label: "Swap", description: "Navigate to the Titan Instant Swap interface." },
  "titan-nav-pro": { page: "global", kind: "nav", label: "Pro", description: "Navigate to the Titan Pro trading terminal." },
  "titan-nav-limit": { page: "global", kind: "nav", label: "Limit Orders", description: "Navigate to Titan Limit Orders." },
  "titan-nav-learn": { page: "global", kind: "nav", label: "Learn & Concepts", description: "Explore how Titan's Argos and DART routing work under the hood." },
  "titan-wallet-badge": { page: "global", kind: "display", label: "Demo Wallet", description: "Simulated demo wallet for the AI Companion." },
  "titan-connect-wallet": { page: "global", kind: "button", label: "Connect Wallet", description: "Connect Solana wallet to start trading or viewing orders." },

  // Titan Pro View Elements
  "titan-search-input": { page: "titan_pro", kind: "input", label: "Search Asset", description: "Search for Solana tokens by name, symbol, or contract address." },
  "titan-candlestick-chart": { page: "titan_pro", kind: "section", label: "Candlestick Chart", description: "Interactive price chart with OHLC candlestick data, volume, and indicators." },
  "titan-holdings-tab": { page: "titan_pro", kind: "button", label: "Holdings Tab", description: "View your current token balances and portfolio allocations." },
  "titan-open-orders-tab": { page: "titan_pro", kind: "button", label: "Open Orders Tab", description: "View currently active limit and conditional orders." },
  "titan-order-history-tab": { page: "titan_pro", kind: "button", label: "Order History Tab", description: "View filled, cancelled, and expired trades." },

  // Titan Swap Tabs & Top Controls
  "titan-tab-instant": { page: "titan_swap", kind: "button", label: "Instant Swap", description: "Execute an instant market swap routed through Titan aggregators." },
  "titan-tab-limit": { page: "titan_swap", kind: "button", label: "Limit Order", description: "Place an on-chain limit order filled by market makers." },
  "titan-tab-dca": { page: "titan_swap", kind: "button", label: "DCA (Dollar-Cost Averaging)", description: "Titan DCA (explained only). Automated recurring swaps." },
  "titan-tab-slice": { page: "titan_swap", kind: "button", label: "Slice Orders", description: "Titan Slice execution (explained only). Large orders split into smaller tranches." },
  "titan-prime-toggle": { page: "titan_swap", kind: "button", label: "Prime Mode", description: "Zero Titan fees, auto sandwich protection, and optimized slippage." },
  "titan-dart-selector": { page: "titan_swap", kind: "select", label: "DART Routing Mode", description: "Dynamic Allocation and Real Time re-splits trades across pools at execution." },
  "titan-chart-toggle": { page: "titan_swap", kind: "button", label: "Toggle Chart", description: "Show or hide the live candlestick price chart." },
  "titan-refresh-quote": { page: "titan_swap", kind: "button", label: "Refresh Quote", description: "Fetch a fresh simulated quote and route re-simulation from Titan." },

  // Titan Sell Card
  "titan-sell-card": { page: "titan_swap", kind: "section", label: "Sell Token Card", description: "Specify the token and amount you want to swap from." },
  "titan-sell-token-select": { page: "titan_swap", kind: "select", label: "Input Token", description: "Select which token to sell." },
  "titan-sell-balance": { page: "titan_swap", kind: "display", label: "Token Balance", description: "Your available balance in the simulated demo wallet." },
  "titan-sell-amount-input": { page: "titan_swap", kind: "input", label: "Input Amount", description: "The amount of token you want to sell.", validation: "positive-amount", fillable: true },
  "titan-sell-max": { page: "titan_swap", kind: "button", label: "Max Amount", description: "Fill input with your entire available balance." },
  "titan-sell-half": { page: "titan_swap", kind: "button", label: "50% Amount", description: "Fill input with half of your available balance." },

  // Titan Switch & Buy Card
  "titan-switch-tokens": { page: "titan_swap", kind: "button", label: "Switch Tokens", description: "Invert swap direction, switching sell and buy tokens." },
  "titan-buy-card": { page: "titan_swap", kind: "section", label: "Buy Token Card", description: "The estimated output amount and token you will receive." },
  "titan-buy-token-select": { page: "titan_swap", kind: "select", label: "Output Token", description: "Select which token to receive from the swap." },
  "titan-buy-amount-output": { page: "titan_swap", kind: "display", label: "Estimated Output", description: "Calculated output after simulating Argos optimization and DART routing." },

  // Titan Details & Settings
  "titan-rate-display": { page: "titan_swap", kind: "display", label: "Exchange Rate", description: "The effective execution rate between the two tokens." },
  "titan-simulated-badge": { page: "titan_swap", kind: "display", label: "Simulated Data Badge", description: "Indicates quote and routing calculations are simulated deterministically." },
  "titan-route-summary": { page: "titan_swap", kind: "section", label: "Routing Route", description: "Shows how Argos splits the trade across DEXes." },
  "titan-price-impact": { page: "titan_swap", kind: "display", label: "Price Impact", description: "Estimated difference between market price and execution price." },
  "titan-fees-breakdown": { page: "titan_swap", kind: "section", label: "Fee Breakdown", description: "Titan fee is 0% in Prime. DART fee is up to 1 bps." },
  "titan-settings-toggle": { page: "titan_swap", kind: "button", label: "Settings", description: "Open slippage tolerance and MEV protection settings." },
  "titan-slippage-base-input": { page: "titan_swap", kind: "input", label: "Base Token Slippage", description: "Maximum allowed slippage for volatile tokens.", fillable: true },
  "titan-slippage-stable-input": { page: "titan_swap", kind: "input", label: "Stable/LST Slippage", description: "Tighter slippage tolerance for stablecoins.", fillable: true },
  "titan-priority-fee-toggle": { page: "titan_swap", kind: "select", label: "Fee Method", description: "Switch between Priority Fees and MEV Protect." },
  "titan-swap-review": { page: "titan_swap", kind: "button", label: "Review Swap", description: "Open simulated transaction review summary before approving.", sensitive: true },
  "titan-swap-sign": { page: "titan_swap", kind: "button", label: "Approve in wallet (simulated)", description: "Simulate signing the swap transaction. Companion never signs.", sensitive: true },

  // Titan Limit Orders
  "titan-limit-pair": { page: "titan_limit", kind: "select", label: "Limit Order Pair", description: "Select the market trading pair." },
  "titan-limit-side-buy": { page: "titan_limit", kind: "button", label: "Buy Side", description: "Place a limit order to buy the base asset." },
  "titan-limit-side-sell": { page: "titan_limit", kind: "button", label: "Sell Side", description: "Place a limit order to sell the base asset." },
  "titan-limit-price-input": { page: "titan_limit", kind: "input", label: "Limit Price", description: "Target price at which order executes.", validation: "positive-amount", fillable: true },
  "titan-limit-market-ref": { page: "titan_limit", kind: "button", label: "Market Price Reference", description: "Current market reference price." },
  "titan-limit-quantity-input": { page: "titan_limit", kind: "input", label: "Order Quantity", description: "Amount of base asset to buy or sell.", validation: "positive-amount", fillable: true },
  "titan-limit-expiry-select": { page: "titan_limit", kind: "select", label: "Order Expiry", description: "Expiration duration for the on-chain limit order." },
  "titan-limit-min-validation": { page: "titan_limit", kind: "display", label: "$10 Minimum Validation", description: "Enforces strict $10 notional minimum." },
  "titan-limit-submit": { page: "titan_limit", kind: "button", label: "Place Limit Order", description: "Submits order to on-chain orderbook.", sensitive: true },

  // Titan Learn
  "titan-learn-dart": { page: "titan_learn", kind: "section", label: "DART Routing Architecture", description: "Deep dive into DART on-chain execution guarantee." },
  "titan-learn-argos": { page: "titan_learn", kind: "section", label: "Argos Optimization Engine", description: "Mathematical optimization algorithm solving multi-hop routing off-chain." },
  "titan-learn-prime": { page: "titan_learn", kind: "section", label: "Prime Liquidity & Zero Fees", description: "How Prime mode unlocks zero protocol fees." },
  "titan-learn-mev": { page: "titan_learn", kind: "section", label: "MEV & Sandwich Protection", description: "Jito bundles preventing front-running bots." },

  // Titan GitBook Docs
  "titan-docs-reading-pane": { page: "titan_docs", kind: "section", label: "Documentation Reading Pane", description: "The active documentation chapter with detailed technical breakdowns and code examples." },
  "titan-docs-ask-milo": { page: "titan_docs", kind: "button", label: "Ask Milo Interactive Questions", description: "Quick questions you can ask Milo about Titan's architecture, Argos, DART, and APIs." },
  "titan-docs-search": { page: "titan_docs", kind: "input", label: "Search GitBook", description: "Search across all Titan documentation articles.", fillable: true },

  // Umbra Privacy / Nimbus
  "umbra-nav-account": { page: "umbra", kind: "nav", label: "Account Status", description: "Inspect registration status, derived platform wallet, and balances." },
  "umbra-nav-deposit": { page: "umbra", kind: "nav", label: "Deposit / Shield", description: "Deposit assets into the Nimbus shielded pool." },
  "umbra-nav-send": { page: "umbra", kind: "nav", label: "Private Send", description: "Confidential transfer to another registered recipient." },
  "umbra-nav-withdraw": { page: "umbra", kind: "nav", label: "Withdraw / Unshield", description: "Unshield tokens out of the private pool back to a public address." },
  "umbra-nav-privacy": { page: "umbra", kind: "nav", label: "Privacy Transparency", description: "Review what the protocol keeps private versus what is public on-chain." },
  "umbra-account-card": { page: "umbra", kind: "section", label: "Account Card", description: "Your Nimbus cryptographic account status and balance overview." },
  "umbra-account-status": { page: "umbra", kind: "display", label: "Registration Status", description: "Whether your wallet has derived a Nimbus platform wallet." },
  "umbra-account-register-btn": { page: "umbra", kind: "button", label: "Derive & Register", description: "Derive deterministic keys and bind platform wallet on Solana.", sensitive: true },
  "umbra-account-platform-wallet": { page: "umbra", kind: "display", label: "Platform Wallet", description: "The Solana keypair derived from your wallet signature." },
  "umbra-account-sync-btn": { page: "umbra", kind: "button", label: "Sync Note Store", description: "Synchronize local encrypted note store with on-chain commitments." },
  "umbra-balance-public": { page: "umbra", kind: "display", label: "Public Balances", description: "Tokens sitting in your unshielded standard Solana wallet." },
  "umbra-balance-private": { page: "umbra", kind: "display", label: "Shielded Balances", description: "Tokens protected inside the Nimbus shielded pool across confidential notes." },
  "umbra-deposit-tab": { page: "umbra", kind: "section", label: "Deposit Tab", description: "Shield funds into the confidential pool." },
  "umbra-deposit-asset": { page: "umbra", kind: "select", label: "Deposit Asset", description: "The SPL token or native SOL you wish to shield." },
  "umbra-deposit-amount": { page: "umbra", kind: "input", label: "Deposit Amount", description: "How many tokens to shield into your private balance.", validation: "positive-amount", fillable: true },
  "umbra-deposit-max": { page: "umbra", kind: "button", label: "Max Amount", description: "Select the entire available public balance for shielding." },
  "umbra-deposit-breakdown": { page: "umbra", kind: "section", label: "Deposit Privacy Breakdown", description: "Explains what observers see during a deposit." },
  "umbra-deposit-fee": { page: "umbra", kind: "display", label: "Deposit Fee Breakdown", description: "Shows Solana network fee and Nimbus protocol fee." },
  "umbra-deposit-confirm": { page: "umbra", kind: "button", label: "Shield Funds", description: "Review and initiate confidential deposit.", sensitive: true },
  "umbra-deposit-approve": { page: "umbra", kind: "button", label: "Approve Deposit in Wallet", description: "Sign deposit transaction in simulated wallet.", sensitive: true },
  "umbra-send-tab": { page: "umbra", kind: "section", label: "Private Send Tab", description: "Send confidential payments to registered recipients." },
  "umbra-send-asset": { page: "umbra", kind: "select", label: "Send Asset", description: "The shielded token you want to send." },
  "umbra-send-amount": { page: "umbra", kind: "input", label: "Send Amount", description: "Amount of shielded tokens to transfer.", validation: "positive-amount", fillable: true },
  "umbra-send-max": { page: "umbra", kind: "button", label: "Max Shielded Amount", description: "Use full shielded balance for transfer." },
  "umbra-send-recipient": { page: "umbra", kind: "input", label: "Recipient Address", description: "Destination address. Must be registered with Nimbus.", validation: "non-empty", fillable: true },
  "umbra-send-recipient-status": { page: "umbra", kind: "display", label: "Recipient Status Check", description: "Checks whether recipient is registered in Nimbus registry." },
  "umbra-send-shortcut-alice": { page: "umbra", kind: "button", label: "Alice (Registered)", description: "Autofill Alice's registered Nimbus address." },
  "umbra-send-shortcut-bob": { page: "umbra", kind: "button", label: "Bob (Unregistered)", description: "Autofill Bob's unregistered address to test verification." },
  "umbra-send-privacy-breakdown": { page: "umbra", kind: "section", label: "Transfer Privacy Breakdown", description: "Displays what is hidden vs what is public." },
  "umbra-send-confirm": { page: "umbra", kind: "button", label: "Send Privately", description: "Generates client zk-proof and submits through relayer.", sensitive: true },
  "umbra-send-approve": { page: "umbra", kind: "button", label: "Approve Private Send", description: "Review and approve in simulated wallet.", sensitive: true },
  "umbra-withdraw-tab": { page: "umbra", kind: "section", label: "Withdraw Tab", description: "Unshield funds back to a public Solana address." },
  "umbra-withdraw-asset": { page: "umbra", kind: "select", label: "Withdraw Asset", description: "The shielded token to withdraw." },
  "umbra-withdraw-amount": { page: "umbra", kind: "input", label: "Withdraw Amount", description: "Amount to unshield back to public address.", validation: "positive-amount", fillable: true },
  "umbra-withdraw-max": { page: "umbra", kind: "button", label: "Max Withdraw", description: "Select full shielded balance to unshield." },
  "umbra-withdraw-destination": { page: "umbra", kind: "input", label: "Destination Address", description: "Public Solana wallet address receiving unshielded funds.", validation: "non-empty", fillable: true },
  "umbra-withdraw-dest-toggle": { page: "umbra", kind: "button", label: "Use Custom Address", description: "Toggle between connected public wallet and custom destination." },
  "umbra-withdraw-warning": { page: "umbra", kind: "section", label: "Unlinkability Notice", description: "Warns that withdrawing to an address already linked to you weakens privacy." },
  "umbra-withdraw-fee": { page: "umbra", kind: "display", label: "Withdrawal Fee Estimate", description: "Relayer fee and network fee breakdown." },
  "umbra-withdraw-confirm": { page: "umbra", kind: "button", label: "Unshield & Withdraw", description: "Generates unshielding proof and requests relayer execution.", sensitive: true },
  "umbra-withdraw-approve": { page: "umbra", kind: "button", label: "Approve Withdrawal", description: "Approve in simulated wallet.", sensitive: true },
  "umbra-privacy-card": { page: "umbra", kind: "section", label: "Privacy Card", description: "Interactive transparency matrix displaying what is hidden vs public." },
  "umbra-privacy-toggle": { page: "umbra", kind: "button", label: "Toggle Privacy Details", description: "Expand or collapse detailed breakdowns of documented leaks." },
  "umbra-privacy-matrix": { page: "umbra", kind: "display", label: "Visibility Matrix", description: "Side-by-side comparison of public vs hidden fields." },
  "umbra-privacy-leaks": { page: "umbra", kind: "section", label: "Documented Limits", description: "Explains correlation risks, recipient discovery, and absence of timelocks." },

  // Umbra web: landing page (umbraprivacy.com layout)
  "umb-nav-get-started": { page: "umbra_home", kind: "button", label: "Get Started", description: "Opens the Umbra web app, where you create an account and use your private balance." },
  "umb-hero": { page: "umbra_home", kind: "section", label: "The Privacy Layer for your Money", description: "Umbra's promise: privacy for your transactions and ownership of your assets, on Solana." },
  "umb-hero-widget": { page: "umbra_home", kind: "section", label: "Deposit, Send, Swap, Withdraw", description: "The same four actions as the app. Creating an account here takes you into the Umbra app." },
  "umb-manifesto": { page: "umbra_home", kind: "section", label: "Manifesto", description: "Why Umbra exists: financial privacy should be easy, accessible and the default." },
  "umb-features": { page: "umbra_home", kind: "section", label: "Send, hold, swap & earn", description: "Four ways to use money privately: swap, hold, earn up to 3.5% on USDv, and send through private pools." },
  "umb-feature-earn": { page: "umbra_home", kind: "section", label: "Earn privately", description: "Earn up to 3.5% yield with USDv, a fully reserved digital dollar on Solana, while Umbra keeps it private." },
  "umb-compliance": { page: "umbra_home", kind: "section", label: "Compliance built in", description: "Perimeter screening, registered recipients, granular self disclosure and self custody." },
  "umb-nimbus": { page: "umbra_home", kind: "section", label: "Build with Nimbus", description: "Nimbus is the privacy network under Umbra. Builders get private payments, self custody and one SDK integration." },
  "umb-usecases": { page: "umbra_home", kind: "section", label: "Privacy that fits your product", description: "Payments, cross-border, tokenised stocks, strategic deals, wallets, treasury, DeFi and merchant checkout." },
  "umb-faq": { page: "umbra_home", kind: "section", label: "Your Questions, Answered", description: "Plain answers on what is private, who controls funds, fees and withdrawals." },

  // Umbra web: app (v2.umbraprivacy.com layout)
  "umb-tab-deposit": { page: "umbra_app", kind: "nav", label: "Deposit", description: "Move tokens from your wallet into your private balance." },
  "umb-tab-send": { page: "umbra_app", kind: "nav", label: "Send", description: "Send from your private balance to another registered Umbra user." },
  "umb-tab-swap": { page: "umbra_app", kind: "nav", label: "Swap", description: "Swap inside your private balance without showing the trade publicly." },
  "umb-tab-withdraw": { page: "umbra_app", kind: "nav", label: "Withdraw", description: "Move tokens from your private balance back to a public Solana wallet." },
  "umb-amount": { page: "umbra_app", kind: "input", label: "Amount", description: "How much you want to move.", validation: "positive-amount", fillable: true },
  "umb-token": { page: "umbra_app", kind: "select", label: "Token", description: "Which token to use. Pick SOL, USDC, USDT or USDv.", validation: "token-choice", fillable: true },
  "umb-swap-to": { page: "umbra_app", kind: "select", label: "Swap to", description: "The token you receive from the swap.", validation: "token-choice", fillable: true },
  "umb-recipient": { page: "umbra_app", kind: "input", label: "Recipient", description: "The Solana address of a registered Umbra user. Private sends only go to registered recipients.", validation: "non-empty", fillable: true },
  "umb-destination": { page: "umbra_app", kind: "input", label: "Destination", description: "The public wallet that receives your withdrawal. A fresh address keeps it unlinked from you.", validation: "non-empty", fillable: true },
  "umb-privacy-note": { page: "umbra_app", kind: "display", label: "What is public", description: "What observers can and cannot see for this action." },
  "umb-balance": { page: "umbra_app", kind: "display", label: "Private balance", description: "Your private balance. Only your device can decrypt it; it is not shown on chain." },
  "umb-create-account": { page: "umbra_app", kind: "button", label: "Create an account", description: "Connects your wallet. Umbra uses your existing Solana wallet; there is no new address." },
  "umb-wallet-connect": { page: "umbra_app", kind: "button", label: "Connect demo wallet", description: "Connects the simulated demo wallet. No real wallet or funds are involved." },
  "umb-register": { page: "umbra_app", kind: "button", label: "Register", description: "Registering sets up the keys for private payments. Your wallet signs it.", sensitive: true },
  "umb-submit": { page: "umbra_app", kind: "button", label: "Confirm", description: "Submits the action. Your wallet approves it; the companion never does.", sensitive: true },
  "umb-approve": { page: "umbra_app", kind: "button", label: "Approve in wallet", description: "The wallet approval. Only you can do this.", sensitive: true },
  "umb-new-user": { page: "umbra_app", kind: "section", label: "New user help", description: "Starts a guided first private deposit." },

  // Jupiter (jup.ag layout)
  "jup-connect": { page: "global", layout: "jup", kind: "button", label: "Connect", description: "Connects a wallet. This demo uses a simulated wallet with play money." },
  "jup-wallet-connect": { page: "global", layout: "jup", kind: "button", label: "Demo wallet", description: "The simulated wallet. No real funds." },
  "jup-approve": { page: "global", layout: "jup", kind: "button", label: "Approve in wallet", description: "The wallet approval. Only you can do this.", sensitive: true },
  "jup-swap-card": { page: "jup_swap", kind: "section", label: "Swap", description: "Sell one token, buy another, at the best route Jupiter finds." },
  "jup-tab-market": { page: "jup_swap", kind: "nav", label: "Market", description: "Swap right now at the best available price." },
  "jup-tab-limit": { page: "jup_swap", kind: "nav", label: "Limit", description: "Trade only when the price reaches your target." },
  "jup-tab-dca": { page: "jup_swap", kind: "nav", label: "DCA", description: "Split a trade into recurring orders over time." },
  "jup-ultra": { page: "jup_swap", kind: "display", label: "Ultra", description: "Ultra mode sets slippage, priority fees and routing automatically." },
  "jup-sell-token": { page: "global", layout: "jup", kind: "select", label: "Sell token", description: "The token you give.", validation: "jup-token", fillable: true },
  "jup-buy-token": { page: "jup_swap", kind: "select", label: "Buy token", description: "The token you get.", validation: "jup-token", fillable: true },
  "jup-sell-amount": { page: "global", layout: "jup", kind: "input", label: "Sell amount", description: "How much you sell.", validation: "positive-amount", fillable: true },
  "jup-flip": { page: "jup_swap", kind: "button", label: "Flip", description: "Swap the sell and buy tokens." },
  "jup-quote": { page: "jup_swap", kind: "display", label: "Quote & route", description: "What you receive, the rate, price impact and the route found." },
  "jup-swap-submit": { page: "jup_swap", kind: "button", label: "Swap", description: "Submits the swap for your wallet to approve.", sensitive: true },
  "jup-limit-price": { page: "jup_limit", kind: "input", label: "Target price", description: "The price at which the order fills, or better.", validation: "positive-amount", fillable: true },
  "jup-limit-expiry": { page: "jup_limit", kind: "select", label: "Expires in", description: "How long the order stays open." },
  "jup-limit-submit": { page: "jup_limit", kind: "button", label: "Place order", description: "Places the limit order after your wallet approves.", sensitive: true },
  "jup-perps-markets": { page: "jup_perps", kind: "section", label: "Markets", description: "SOL, ETH and BTC perpetual markets." },
  "jup-perps-chart": { page: "jup_perps", kind: "display", label: "Price chart", description: "The mark price of the selected market." },
  "jup-perps-long": { page: "jup_perps", kind: "button", label: "Long/Buy", description: "Profit if the price goes up." },
  "jup-perps-short": { page: "jup_perps", kind: "button", label: "Short/Sell", description: "Profit if the price goes down." },
  "jup-perps-amount": { page: "jup_perps", kind: "input", label: "Collateral", description: "The USDC you put up as collateral.", validation: "positive-amount", fillable: true },
  "jup-perps-leverage": { page: "jup_perps", kind: "input", label: "Leverage", description: "How many times your collateral the position is. Up to 250x.", validation: "leverage", fillable: true },
  "jup-perps-liq": { page: "jup_perps", kind: "display", label: "Liquidation price", description: "If the price reaches this, the position is closed and the collateral lost." },
  "jup-perps-submit": { page: "jup_perps", kind: "button", label: "Open position", description: "Opens the position after your wallet approves.", sensitive: true },
  "jup-gacha-tabs": { page: "jup_gacha", kind: "nav", label: "Packs / Collection / Marketplace", description: "Buy and open packs, see the cards you own, or trade with other collectors." },
  "jup-gacha-packs": { page: "jup_gacha", kind: "section", label: "Packs", description: "Each pack has a price and pulls one graded card." },
  "jup-gacha-ev": { page: "jup_gacha", kind: "display", label: "Expected value", description: "The average value of a pull from this pack." },
  "jup-gacha-count": { page: "jup_gacha", kind: "input", label: "Packs", description: "How many packs to open.", validation: "positive-amount", fillable: true },
  "jup-gacha-open": { page: "jup_gacha", kind: "button", label: "Open pack", description: "Pays for the packs and reveals your pulls, after your wallet approves.", sensitive: true },
  "jup-gacha-turbo": { page: "jup_gacha", kind: "button", label: "Turbo", description: "Auto-sells Common pulls for USDC." },
  "jup-gacha-buyback": { page: "jup_gacha", kind: "display", label: "Instant buyback", description: "Sell any pull back for USDC at 93% within 3 days." },
  "jup-gacha-odds": { page: "jup_gacha", kind: "section", label: "Statistics & odds", description: "Chance of each rarity tier and its value range." },
  "jup-gacha-pulls": { page: "jup_gacha", kind: "section", label: "Latest Pulls", description: "Recent big pulls; rare outliers, not typical results." },
  "jup-portfolio-search": { page: "jup_portfolio", kind: "input", label: "Wallet search", description: "Track any wallet address or .sol domain." },
  "jup-portfolio-demo": { page: "jup_portfolio", kind: "section", label: "Demo wallets", description: "Example wallets to explore the dashboard." },
  "jup-portfolio-summary": { page: "jup_portfolio", kind: "display", label: "Net worth", description: "Total value of the wallet you're viewing." },
} as const satisfies Record<string, ElementSpec>;

export type ElementId = keyof typeof ELEMENTS;
export const ELEMENT_IDS = Object.keys(ELEMENTS) as ElementId[];

export function getElement(id: string): (ElementSpec & { id: ElementId }) | null {
  return id in ELEMENTS ? { id: id as ElementId, ...(ELEMENTS as Record<string, ElementSpec>)[id]! } : null;
}

/** Detail routes inherit their index page; anything unknown falls back to the marketing home. */
const PREFIXES: [string, PageId][] = [
  ["/stablecoins/", "stablecoin"],
  ["/assets/", "assets"],
  ["/case-studies/", "caseStudies"],
  ["/titan/docs/", "titan_docs"],
  ["/titan/rewards/", "titan_rewards"],
  ["/umbra/", "umbra_app"],
  ["/jup/gacha", "jup_gacha"],
  ["/jup/", "jup_swap"],
];

export function pageForPath(pathname: string): PageId {
  const exact = PAGE_IDS.find((p) => PAGES[p].path === pathname);
  if (exact) return exact;
  return PREFIXES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "home";
}

/** Which layout a page lives in. The marketing site has no app navigation. */
export const SITE_PAGES = ["home", "earn", "create", "calculator", "protect", "build", "assets", "caseStudies", "privacy"] as const satisfies readonly PageId[];
export const isSitePage = (page: PageId) => (SITE_PAGES as readonly PageId[]).includes(page);

export function elementsOnPage(page: PageId) {
  const layout = isSitePage(page) ? "site" : page.startsWith("jup_") ? "jup" : "app";
  return ELEMENT_IDS.filter((id) => {
    const el: ElementSpec = ELEMENTS[id];
    return el.page === page || (el.page === "global" && (el.layout ?? layout) === layout);
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
    case "capital":
      if (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) <= 0) return "Enter a dollar amount above zero.";
      if (Number(v) > 10_000_000_000) return "Keep it under $10 billion.";
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
    case "jup-token":
      return ["SOL", "USDC", "JUP", "USDT", "BONK", "JitoSOL"].includes(v) ? null : "Pick SOL, USDC, JUP, USDT, BONK or JitoSOL.";
    case "leverage": {
      const n = Number(v);
      return Number.isFinite(n) && n >= 1.1 && n <= 250 ? null : "Leverage is between 1.1x and 250x.";
    }
    case "token-choice":
      return ["SOL", "USDC", "USDT", "USDv"].includes(v) ? null : "Pick SOL, USDC, USDT or USDv.";
  }
}
