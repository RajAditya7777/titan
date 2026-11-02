/**
 * Titan's GitBook, both spaces, mirroring the sidebars of titan-exchange.gitbook.io (read
 * 2026-11-02). Our URLs mirror the originals: gitbook.io/titan/<path> ↔ /titan/docs/<path>.
 * Page bodies (lib/products/titan/docs/content) are our own words; facts are exact.
 */
export const GITBOOK_ORIGIN = "https://titan-exchange.gitbook.io/titan";
export const DOCS_BASE = "/titan/docs";

export type SpaceId = "products" | "developer";
export interface Space {
  id: SpaceId;
  title: string;
  /** Path prefix inside the GitBook site ("" for the main space). */
  prefix: string;
}
export const SPACES: Record<SpaceId, Space> = {
  products: { id: "products", title: "Products", prefix: "" },
  developer: { id: "developer", title: "Developer Docs", prefix: "developer-doc" },
};

export interface DocPage {
  space: SpaceId;
  /** Path inside the space, e.g. "developers-portal/introduction" ("" = the space's home). */
  slug: string;
  title: string;
}
/** A sidebar entry; entries with children expand like GitBook's nested pages. */
export interface NavItem {
  slug: string;
  title: string;
  children?: NavItem[];
}
export interface DocGroup {
  label: string | null;
  pages: NavItem[];
}

const kids = (base: string, items: Array<[string, string]>): NavItem[] => items.map(([s, title]) => ({ slug: `${base}/${s}`, title }));

export const NAV: Record<SpaceId, DocGroup[]> = {
  products: [
    { label: null, pages: [{ slug: "", title: "Welcome to Titan" }] },
    {
      label: "Getting Started",
      pages: [
        { slug: "getting-started/quickstart", title: "Quickstart" },
        { slug: "getting-started/quickstart-1", title: "Prime Mode and Custom Settings" },
        { slug: "getting-started/titan-limit-orders", title: "Titan Limit Orders" },
        { slug: "getting-started/titan-private-swaps", title: "Titan Private Swaps" },
        { slug: "getting-started/analytics", title: "Analytics" },
        { slug: "getting-started/usernames-and-referrals", title: "Usernames and Referrals" },
        { slug: "getting-started/titan-dex-integrations", title: "Titan DEX Integrations" },
        { slug: "getting-started/titan-dart", title: "Titan DART" },
      ],
    },
    {
      label: "Codex of Knowledge",
      pages: [
        { slug: "codex-of-knowledge/how-swaps-work", title: "How Swaps Work" },
        { slug: "codex-of-knowledge/dex-aggregators", title: "DEX Aggregators" },
        { slug: "codex-of-knowledge/editor", title: "Titan's Unique Algorithm" },
        { slug: "codex-of-knowledge/markdown", title: "Meta Aggregation" },
        { slug: "codex-of-knowledge/dart-routing", title: "DART Routing" },
      ],
    },
  ],
  developer: [
    { label: null, pages: [{ slug: "", title: "Home" }] },
    {
      label: "Getting Started",
      pages: [
        { slug: "getting-started/introduction", title: "Introduction" },
        { slug: "getting-started/authentication", title: "Authentication" },
        { slug: "getting-started/api-access", title: "Get API Access" },
      ],
    },
    {
      label: "Developers Portal",
      pages: [
        { slug: "developers-portal/introduction", title: "Introduction" },
        { slug: "developers-portal/quickstart", title: "Quickstart" },
        { slug: "developers-portal/authentication", title: "Authentication" },
        {
          slug: "developers-portal/reference",
          title: "API Reference",
          children: kids("developers-portal/reference", [
            ["quote-swap", "Quote Swap"],
            ["info-venues-providers", "Info, Venues & Providers"],
          ]),
        },
        { slug: "developers-portal/plans-rate-limits-credits", title: "Plans, Rate Limits & Credits" },
        { slug: "developers-portal/titan-genesis-50", title: "Titan Genesis 50" },
        { slug: "developers-portal/latency", title: "Latency and Server Locations" },
        { slug: "developers-portal/errors", title: "Errors" },
        { slug: "developers-portal/faq", title: "FAQ" },
      ],
    },
    {
      label: "Swap API",
      pages: [
        { slug: "swap-api/quickstart", title: "Quickstart" },
        {
          slug: "swap-api/guides",
          title: "Guides",
          children: kids("swap-api/guides", [
            ["stream-and-execute", "Stream & Execute a Swap"],
            ["configure-routing", "Configure Routing"],
            ["fee-collection", "Fee Collection"],
            ["transaction-template", "Transaction Template"],
            ["error-handling", "Error Handling & Reconnect"],
            ["swap-v2-vs-v3", "Swap V2 vs Swap V3"],
          ]),
        },
        {
          slug: "swap-api/reference",
          title: "API Reference",
          children: [
            { slug: "swap-api/reference/direct-vs-gateway", title: "Titan Direct vs Titan Gateway" },
            {
              slug: "swap-api/reference/direct",
              title: "Titan Direct",
              children: kids("swap-api/reference/direct", [
                ["connection", "Connection & Negotiation"],
                ["get-info", "GetInfo"],
                ["get-swap-price", "GetSwapPrice"],
                ["new-swap-quote-stream", "NewSwapQuoteStream"],
                ["stop-stream", "StopStream"],
                ["venues-providers", "GetVenues / ListProviders"],
              ]),
            },
            {
              slug: "swap-api/reference/gateway",
              title: "Titan Gateway",
              children: kids("swap-api/reference/gateway", [
                ["gateway-quote-swap", "Quote Swap"],
                ["gateway-quote-price", "Quote Price"],
                ["gateway-info", "Info / Venues / Providers"],
              ]),
            },
            { slug: "swap-api/reference/types", title: "Types Reference" },
            { slug: "swap-api/reference/wire-protocol", title: "Wire Protocol" },
            { slug: "swap-api/reference/error-codes", title: "Error Codes" },
          ],
        },
      ],
    },
    {
      label: "DART Swap API",
      pages: [
        { slug: "dart-swap-api/overview", title: "Overview" },
        { slug: "dart-swap-api/get-api-access", title: "Get API Access" },
        { slug: "dart-swap-api/how-to-use", title: "How to Use" },
      ],
    },
    {
      label: "Special Order Types",
      pages: [
        { slug: "special-order-types/overview", title: "Overview" },
        { slug: "special-order-types/quickstart", title: "Quickstart" },
        {
          slug: "special-order-types/order-types",
          title: "Order Types",
          children: kids("special-order-types/order-types", [
            ["dca", "DCA"],
            ["stop-loss-take-profit", "Stop-Loss & Take-Profit"],
            ["oco", "OCO Brackets"],
            ["otoco", "Conditional Entry & Bracket"],
            ["trailing", "Trailing Stops"],
            ["slice", "Slice Orders"],
          ]),
        },
        {
          slug: "special-order-types/guides",
          title: "Guides",
          children: kids("special-order-types/guides", [
            ["onboarding", "Onboarding (SIWS)"],
            ["creating-orders", "Creating Orders"],
            ["managing-orders", "Managing Orders"],
            ["lifecycle", "Lifecycle & Polling"],
            ["withdrawals", "Withdrawals"],
            ["platform-fees", "Platform Fees"],
          ]),
        },
        {
          slug: "special-order-types/reference",
          title: "API Reference",
          children: kids("special-order-types/reference", [
            ["authentication", "Authentication"],
            ["endpoints", "Endpoints"],
            ["schema", "Order & Execution Schema"],
            ["limits", "Limits & Idempotency"],
            ["error-codes", "Error Codes"],
          ]),
        },
      ],
    },
    {
      label: "Searchers - Limit Orders",
      pages: [
        { slug: "searchers-limit-orders/overview", title: "Overview" },
        { slug: "searchers-limit-orders/take-order", title: "Placing Taker Orders" },
        { slug: "searchers-limit-orders/events", title: "Limit Order Events" },
        { slug: "searchers-limit-orders/error-codes", title: "Error Codes" },
      ],
    },
    {
      label: "Resources",
      pages: [
        { slug: "resources/sdk", title: "SDK Reference" },
        { slug: "resources/community-and-support", title: "Community & Support" },
        { slug: "resources/ai-llm-integration", title: "AI / LLM Integration" },
      ],
    },
  ],
};

/** Depth-first, so previous/next walk parents then their children, as on GitBook. */
const flatten = (items: NavItem[]): NavItem[] => items.flatMap((i) => [i, ...flatten(i.children ?? [])]);
export const DOC_PAGES: Array<DocPage & { group: string | null }> = (Object.keys(NAV) as SpaceId[]).flatMap((space) =>
  NAV[space].flatMap((g) => flatten(g.pages).map(({ slug, title }) => ({ slug, title, space, group: g.label }))),
);

/** Slugs of a page's ancestors (for auto-expanding the sidebar to the current page). */
export function ancestorsOf(space: SpaceId, slug: string): string[] {
  const walk = (items: NavItem[], trail: string[]): string[] | null => {
    for (const i of items) {
      if (i.slug === slug) return trail;
      const hit = i.children && walk(i.children, [...trail, i.slug]);
      if (hit) return hit;
    }
    return null;
  };
  for (const g of NAV[space]) {
    const hit = walk(g.pages, []);
    if (hit) return hit;
  }
  return [];
}

const join = (...parts: string[]) => parts.filter(Boolean).join("/");
/** Our URL for a page. */
export const docHref = (space: SpaceId, slug: string) => "/" + join(DOCS_BASE.slice(1), SPACES[space].prefix, slug);
/** The original GitBook URL for a page. */
export const originalHref = (space: SpaceId, slug: string) => join(GITBOOK_ORIGIN, SPACES[space].prefix, slug);

/** Our URL path segments (after /titan/docs) → the page they show. */
export function pageForPath(segments: string[]): (DocPage & { group: string | null }) | undefined {
  const isDev = segments[0] === SPACES.developer.prefix;
  const space: SpaceId = isDev ? "developer" : "products";
  const slug = (isDev ? segments.slice(1) : segments).join("/");
  return DOC_PAGES.find((p) => p.space === space && p.slug === slug);
}

/** Previous/next in sidebar order within a space, as GitBook shows at the foot of each page. */
export function neighbours(space: SpaceId, slug: string) {
  const pages = DOC_PAGES.filter((p) => p.space === space);
  const i = pages.findIndex((p) => p.slug === slug);
  return { prev: i > 0 ? pages[i - 1] : undefined, next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined };
}

/** Search across both spaces: titles and sections first, then page text. */
export function searchDocs(query: string, textOf: (p: DocPage) => string = () => "") {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const byTitle = DOC_PAGES.filter((p) => p.title.toLowerCase().includes(q) || (p.group ?? "").toLowerCase().includes(q));
  const byText = DOC_PAGES.filter((p) => !byTitle.includes(p) && textOf(p).toLowerCase().includes(q));
  return [...byTitle, ...byText];
}
