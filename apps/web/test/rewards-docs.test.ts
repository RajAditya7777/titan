import { describe, expect, it } from "vitest";
import { CAMPAIGNS, CAMPAIGNS_PER_PAGE, campaignBySlug, epochReward, howItWorks } from "@/lib/products/titan/rewards";
import { DOC_PAGES, ancestorsOf, docHref, neighbours, originalHref, pageForPath, searchDocs } from "@/lib/products/titan/devdocs";
import { CONTENT } from "@/lib/products/titan/docs/content";
import { tocFor, toMarkdown, type Block } from "@/lib/products/titan/docs/schema";

describe("rewards data (from titan.exchange/rewards)", () => {
  it("has the 11 campaigns, paged 6 at a time like the live page", () => {
    expect(CAMPAIGNS).toHaveLength(11);
    expect(Math.ceil(CAMPAIGNS.length / CAMPAIGNS_PER_PAGE)).toBe(2);
    expect(new Set(CAMPAIGNS.map((c) => c.slug)).size).toBe(11);
  });
  it("matches Peaq's published numbers and splits pools evenly per epoch", () => {
    const peaq = campaignBySlug("peaq")!;
    expect(epochReward(peaq)).toBe(6_250);
    expect(howItWorks(peaq)[0]!.body).toContain("PEAQjk7SRS6rXHVFFmpRr7zrC4g5ZuEebpwTxvaLr3b");
    expect(epochReward(campaignBySlug("vanish")!)).toBeNull(); // no stated pool → no invented number
  });
});

describe("GitBook docs (both spaces, from the live sidebars)", () => {
  it("has every page of both spaces, with URLs mirroring the originals", () => {
    expect(DOC_PAGES.filter((p) => p.space === "products")).toHaveLength(14);
    expect(DOC_PAGES.filter((p) => p.space === "developer")).toHaveLength(71); // 31 sidebar entries + 40 nested pages
    for (const p of DOC_PAGES) {
      const ours = docHref(p.space, p.slug);
      expect(originalHref(p.space, p.slug).replace("https://titan-exchange.gitbook.io/titan", "/titan/docs")).toBe(ours);
      expect(pageForPath(ours.split("/").slice(3))).toMatchObject({ space: p.space, slug: p.slug });
    }
  });
  it("expands the sidebar to nested pages", () => {
    expect(ancestorsOf("developer", "swap-api/reference/direct/connection")).toEqual(["swap-api/reference", "swap-api/reference/direct"]);
    expect(ancestorsOf("developer", "swap-api/quickstart")).toEqual([]);
  });
  it("gives the same previous/next as the original page", () => {
    const { prev, next } = neighbours("developer", "developers-portal/introduction");
    expect(prev?.title).toBe("Get API Access");
    expect(next?.title).toBe("Quickstart");
    expect(pageForPath(["nope"])).toBeUndefined();
  });
  it("searches titles across both spaces, then page text", () => {
    expect(searchDocs("error codes").map((p) => p.slug)).toEqual(["searchers-limit-orders/error-codes", "special-order-types/reference/error-codes", "swap-api/reference/error-codes"].sort((a, b) => DOC_PAGES.findIndex((p) => p.slug === a) - DOC_PAGES.findIndex((p) => p.slug === b)));
    expect(searchDocs("MessagePack", (p) => (p.slug === "developers-portal/introduction" ? "MessagePack" : "")).map((p) => p.slug)).toEqual(["developers-portal/introduction"]);
    expect(searchDocs("   ")).toEqual([]);
  });
  it("every written page is well-formed: known blocks, internal links resolve, TOC ids unique", () => {
    const kinds = new Set<Block["t"]>(["p", "h2", "h3", "list", "steps", "table", "code", "codeTabs", "callout", "cards", "divider"]);
    for (const space of ["products", "developer"] as const) {
      for (const [slug, c] of Object.entries(CONTENT[space])) {
        expect(DOC_PAGES.some((p) => p.space === space && p.slug === slug), `${space}/${slug} is in the sidebar`).toBe(true);
        for (const b of c.blocks) expect(kinds.has(b.t), `${slug}: ${b.t}`).toBe(true);
        const ids = tocFor(c).map((t) => t.id);
        expect(new Set(ids).size, `${slug}: duplicate heading ids`).toBe(ids.length);
        for (const m of toMarkdown(slug, c).matchAll(/\((\/titan\/docs[^)\s#]*)(#[^)\s]+)?\)/g)) {
          const target = pageForPath(m[1]!.split("/").slice(3));
          expect(target, `${slug} links to ${m[1]}`).toBeDefined();
          // An #anchor must name a heading on the target page (when that page is written).
          const body = target && CONTENT[target.space][target.slug];
          if (m[2] && body) expect(tocFor(body).map((t) => t.id), `${slug} links to ${m[1]}${m[2]}`).toContain(m[2].slice(1));
        }
      }
    }
  });
});
