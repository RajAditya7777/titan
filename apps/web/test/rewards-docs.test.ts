import { describe, expect, it } from "vitest";
import { CAMPAIGNS, CAMPAIGNS_PER_PAGE, campaignBySlug, epochReward, howItWorks } from "@/lib/products/titan/rewards";
import { DOC_PAGES, docBySlug, neighbours, originalHref, searchDocs } from "@/lib/products/titan/devdocs";

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

describe("developer docs navigation (from the GitBook sidebar)", () => {
  it("covers every sidebar page and links each to its original", () => {
    expect(DOC_PAGES).toHaveLength(31);
    expect(originalHref("developers-portal/introduction")).toBe("https://titan-exchange.gitbook.io/titan/developer-doc/developers-portal/introduction");
  });
  it("gives the same previous/next as the original page", () => {
    const { prev, next } = neighbours("developers-portal/introduction");
    expect(prev?.title).toBe("Get API Access");
    expect(next?.title).toBe("Quickstart");
    expect(docBySlug("nope")).toBeUndefined();
  });
  it("searches titles and sections", () => {
    expect(searchDocs("error").map((p) => p.title)).toEqual(["Errors", "Error Codes"]);
    expect(searchDocs("   ")).toEqual([]);
  });
});
