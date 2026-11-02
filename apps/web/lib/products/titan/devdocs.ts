/**
 * Titan Developer Docs navigation, mirroring the sidebar of
 * titan-exchange.gitbook.io/titan/developer-doc (read 2026-11-02). Each page links to its
 * original. Page bodies are summaries in our own words; only facts (endpoints, plans, headers)
 * are reproduced exactly.
 */
export const DOCS_ORIGIN = "https://titan-exchange.gitbook.io/titan/developer-doc";
export const DOCS_BASE = "/titan/docs";

export interface DocPage {
  /** Path under the space, e.g. "developers-portal/introduction" ("" = Home). */
  slug: string;
  title: string;
}
export interface DocGroup {
  /** Uppercase section label; null for the ungrouped "Home" entry. */
  label: string | null;
  pages: DocPage[];
}

export const DOCS_NAV: DocGroup[] = [
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
      { slug: "developers-portal/reference", title: "API Reference" },
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
      { slug: "swap-api/guides", title: "Guides" },
      { slug: "swap-api/reference", title: "API Reference" },
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
      { slug: "special-order-types/order-types", title: "Order Types" },
      { slug: "special-order-types/guides", title: "Guides" },
      { slug: "special-order-types/reference", title: "API Reference" },
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
];

export const DOC_PAGES: Array<DocPage & { group: string | null }> = DOCS_NAV.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.label })));

export const docHref = (slug: string) => (slug ? `${DOCS_BASE}/${slug}` : DOCS_BASE);
export const originalHref = (slug: string) => (slug ? `${DOCS_ORIGIN}/${slug}` : DOCS_ORIGIN);

export function docBySlug(slug: string) {
  return DOC_PAGES.find((p) => p.slug === slug);
}

/** Previous/next in sidebar order, as GitBook shows at the foot of each page. */
export function neighbours(slug: string) {
  const i = DOC_PAGES.findIndex((p) => p.slug === slug);
  return { prev: i > 0 ? DOC_PAGES[i - 1] : undefined, next: i >= 0 && i < DOC_PAGES.length - 1 ? DOC_PAGES[i + 1] : undefined };
}

/** Sidebar search: case-insensitive match on title or section. */
export function searchDocs(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DOC_PAGES.filter((p) => p.title.toLowerCase().includes(q) || (p.group ?? "").toLowerCase().includes(q));
}
