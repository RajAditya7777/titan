/**
 * Marketing-site content as typed data. The information architecture follows reflect.money
 * (products, assets, case studies); every sentence here is original. Facts are limited to
 * what's public and stable (names, families, underlying issuers). Anything that moves (APY,
 * supply, volume) is fetched live and never written here.
 */

export const OFFICIAL = {
  site: "https://reflect.money",
  app: "https://app.reflect.money",
  docs: "https://docs.reflect.money/introduction",
  api: "https://docs.reflect.money/developers",
  risk: "https://docs.reflect.money/risk",
  audits: "https://github.com/palindrome-eng/audits",
} as const;

export interface NavLink {
  href: string;
  label: string;
  blurb?: string;
  external?: boolean;
}

export const NAV_GROUPS: { label: string; links: NavLink[] }[] = [
  {
    label: "Products",
    links: [
      { href: "/earn", label: "Earn", blurb: "Stablecoins that grow while you hold them" },
      { href: "/create", label: "Create", blurb: "Your own branded savings product" },
      { href: "/protect", label: "Protect", blurb: "Opt-in downside cover for tokenised assets" },
      { href: "/build", label: "Build", blurb: "The API behind all three" },
    ],
  },
  {
    label: "Assets",
    links: [
      { href: "/assets", label: "All assets", blurb: "Every stablecoin and tranche in one list" },
      { href: "/assets/usdc-plus", label: "USDC+", blurb: "Yield on USDC" },
      { href: "/assets/usdt-plus", label: "USDT+", blurb: "Yield on USDT" },
    ],
  },
  {
    label: "Resources",
    links: [
      { href: "/case-studies", label: "Case studies", blurb: "How issuers use Reflect" },
      { href: "/create/calculator", label: "Revenue calculator", blurb: "Estimate your earnings" },
      { href: OFFICIAL.docs, label: "Documentation", blurb: "Reflect's official docs", external: true },
      { href: OFFICIAL.audits, label: "Audits", blurb: "Published security reviews", external: true },
    ],
  },
];

export const FOOTER_COLUMNS: { label: string; links: NavLink[] }[] = [
  { label: "Products", links: NAV_GROUPS[0]!.links },
  {
    label: "Explore",
    links: [
      { href: "/assets", label: "All assets" },
      { href: "/case-studies", label: "Case studies" },
      { href: "/create/calculator", label: "Revenue calculator" },
      { href: "/stats", label: "Live statistics" },
      { href: "/dashboard", label: "Open the demo app" },
    ],
  },
  {
    label: "Official Reflect",
    links: [
      { href: OFFICIAL.site, label: "reflect.money", external: true },
      { href: OFFICIAL.docs, label: "Documentation", external: true },
      { href: OFFICIAL.audits, label: "Audits", external: true },
      { href: OFFICIAL.risk, label: "Risk disclosure", external: true },
    ],
  },
];

// ───────── assets ─────────

export type AssetFamily = "earn" | "protected" | "amplified";

export interface Asset {
  slug: string;
  name: string;
  family: AssetFamily;
  /** The token this asset is built on. */
  underlying: string;
  /** Who issues the underlying token. */
  underlyingIssuer: string;
  /** Short line for cards. */
  tagline: string;
  /** Symbol served by Reflect's public API, when the asset has live data. */
  liveSymbol?: "USDC+" | "USDT+";
  /** Link to the sibling tranche, for protected / amplified pairs. */
  sibling?: string;
}

const tranchePair = (key: string, underlying: string, issuer: string, what: string): Asset[] => [
  {
    slug: `protected-${key}`,
    name: `Protected ${underlying}`,
    family: "protected",
    underlying,
    underlyingIssuer: issuer,
    tagline: `${what}, with a first-loss buffer in front of you.`,
    sibling: `amplified-${key}`,
  },
  {
    slug: `amplified-${key}`,
    name: `Amplified ${underlying}`,
    family: "amplified",
    underlying,
    underlyingIssuer: issuer,
    tagline: `${what}, with extra yield for taking losses first.`,
    sibling: `protected-${key}`,
  },
];

export const ASSETS: Asset[] = [
  { slug: "usdc-plus", name: "USDC+", family: "earn", underlying: "USDC", underlyingIssuer: "Circle", tagline: "USDC that earns from diversified Solana lending.", liveSymbol: "USDC+" },
  { slug: "usdt-plus", name: "USDT+", family: "earn", underlying: "USDT", underlyingIssuer: "Tether", tagline: "USDT that earns from diversified Solana lending.", liveSymbol: "USDT+" },
  ...tranchePair("syrupusdc", "syrupUSDC", "Maple", "Institutional credit"),
  ...tranchePair("ehyusd", "eHYUSD", "Hylo", "A yield-bearing stablecoin"),
  ...tranchePair("prime", "PRIME", "HASTRA", "Tokenised mortgage credit"),
  ...tranchePair("reusd", "reUSD", "Re", "Tokenised reinsurance"),
  ...tranchePair("steakhouse-usdg", "Steakhouse USDG", "Steakhouse", "A curated USDG lending vault"),
];

export const getAsset = (slug: string) => ASSETS.find((a) => a.slug === slug) ?? null;

export const FAMILY_LABEL: Record<AssetFamily, string> = { earn: "Earn", protected: "Protected", amplified: "Amplified" };

/** What each family means, in one place so cards, detail pages and the companion agree. */
export const FAMILY_EXPLAINER: Record<AssetFamily, { position: string; yieldSource: (a: Asset) => string; risks: { title: string; text: string }[] }> = {
  earn: {
    position: "Yield-bearing stablecoin",
    yieldSource: (a) =>
      `Deposited ${a.underlying} is lent to over-collateralised borrowers across several Solana money markets. Their interest raises the value of each ${a.name}, so the balance grows without claiming anything.`,
    risks: [
      { title: "Variable rate", text: "The APY follows lending demand. It moves daily and can fall." },
      { title: "Lending venue risk", text: "A failure at a money market could cause losses, even with diversification." },
      { title: "Withdrawal liquidity", text: "Redemptions depend on how much each venue can release at that moment." },
      { title: "Stablecoin peg", text: "If the underlying stablecoin loses its peg, so does the value backing this token." },
      { title: "Smart-contract risk", text: "Audited programs can still contain bugs." },
    ],
  },
  protected: {
    position: "Senior tranche",
    yieldSource: (a) =>
      `You hold the senior share of a ${a.underlying} pool. Part of your yield is paid to the amplified holders, who in return absorb losses before you do.`,
    risks: [
      { title: "Protection is finite", text: "Cover only reaches as far as the junior capital in the pool. A large loss can still reach you." },
      { title: "Lower yield", text: "You give up part of the underlying yield in exchange for the buffer." },
      { title: "Underlying risk", text: "Borrower defaults or strategy losses in the underlying asset still apply." },
      { title: "Redemption terms", text: "The underlying may have queues or cooldowns that delay exits." },
      { title: "Smart-contract risk", text: "Both Reflect's programs and the underlying protocol can fail." },
    ],
  },
  amplified: {
    position: "Junior tranche",
    yieldSource: (a) =>
      `You hold the junior share of a ${a.underlying} pool. You earn your own yield plus a share of the senior holders' yield, because you take losses first.`,
    risks: [
      { title: "First loss", text: "Any loss in the pool hits this tranche first. You can lose all of it." },
      { title: "Leverage to the underlying", text: "Gains and losses are magnified compared with holding the asset directly." },
      { title: "Underlying risk", text: "Borrower defaults or strategy losses in the underlying asset apply in full." },
      { title: "Redemption terms", text: "The underlying may have queues or cooldowns that delay exits." },
      { title: "Smart-contract risk", text: "Both Reflect's programs and the underlying protocol can fail." },
    ],
  },
};

// ───────── case studies ─────────

export interface CaseStudy {
  slug: string;
  partner: string;
  asset: string;
  headline: string;
  summary: string;
  points: string[];
  assetSlugs: string[];
  official: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "maple",
    partner: "Maple",
    asset: "syrupUSDC",
    headline: "Institutional credit for more risk appetites",
    summary: "Maple's syrupUSDC earns from institutional lending. Reflect splits it into two tokens so holders can pick how much risk they carry.",
    points: [
      "Cautious holders take the protected side and accept a smaller yield.",
      "Holders who want more yield take the amplified side and absorb losses first.",
      "Both sides are ordinary Solana tokens, so other DeFi apps can use them.",
    ],
    assetSlugs: ["protected-syrupusdc", "amplified-syrupusdc"],
    official: `${OFFICIAL.site}/case-studies/maple`,
  },
  {
    slug: "steakhouse",
    partner: "Steakhouse",
    asset: "Steakhouse USDG",
    headline: "A curated vault with a second safety layer",
    summary: "Steakhouse curates a USDG lending vault. Reflect adds an optional buffer on top, so careful savers get extra cover beyond the curation itself.",
    points: [
      "The curator picks the lending markets; Reflect handles the tranche split.",
      "The protected side is aimed at savers who value stability over yield.",
      "The amplified side pays more to holders comfortable with first loss.",
    ],
    assetSlugs: ["protected-steakhouse-usdg", "amplified-steakhouse-usdg"],
    official: `${OFFICIAL.site}/case-studies/steakhouse`,
  },
  {
    slug: "hastra",
    partner: "HASTRA",
    asset: "PRIME",
    headline: "Real-world credit with a clearer risk choice",
    summary: "PRIME represents tokenised mortgage credit from HASTRA. Splitting it into two tranches makes it easier to offer to people with different risk tolerance.",
    points: [
      "Real-world credit can be hard to size up; a buffer makes the downside easier to reason about.",
      "The issuer keeps its asset and infrastructure; Reflect adds the tranche layer.",
      "Each tranche has its own token and its own page.",
    ],
    assetSlugs: ["protected-prime", "amplified-prime"],
    official: `${OFFICIAL.site}/case-studies/hastra`,
  },
];

export const getCaseStudy = (slug: string) => CASE_STUDIES.find((c) => c.slug === slug) ?? null;

// ───────── API catalogue (paths as served by prod.api.reflect.money, see RESEARCH.md) ─────────

export interface Endpoint {
  method: "GET" | "POST";
  path: string;
  label: string;
  /** MCP tool that wraps this endpoint, when the demo can show a live response. */
  tool?: "reflect_get_stablecoin_overview" | "reflect_get_protocol_stats" | "reflect_get_protocol_events";
}

export const ENDPOINT_GROUPS: { label: string; endpoints: Endpoint[] }[] = [
  {
    label: "Earn",
    endpoints: [
      { method: "GET", path: "/stablecoin/types", label: "Available stablecoins", tool: "reflect_get_stablecoin_overview" },
      { method: "GET", path: "/stablecoin/exchange-rates", label: "Exchange rates", tool: "reflect_get_stablecoin_overview" },
      { method: "GET", path: "/stablecoin/{index}/apy", label: "Current APY", tool: "reflect_get_stablecoin_overview" },
      { method: "POST", path: "/stablecoin/quote/{type}", label: "Mint or redeem quote" },
    ],
  },
  {
    label: "Create",
    endpoints: [
      { method: "GET", path: "/whitelabel/verified", label: "Verified branded tokens" },
      { method: "GET", path: "/whitelabel/underlying/apy", label: "Collateral APYs" },
    ],
  },
  {
    label: "Stats",
    endpoints: [
      { method: "GET", path: "/stats", label: "Protocol totals", tool: "reflect_get_protocol_stats" },
      { method: "GET", path: "/events/all/{limit}", label: "Recent events", tool: "reflect_get_protocol_events" },
    ],
  },
];
