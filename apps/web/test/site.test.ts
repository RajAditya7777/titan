import { describe, expect, it } from "vitest";
import { estimateRevenue, projectBalance, splitLoss, yieldSplit } from "@/lib/site/calc";
import { ASSETS, CASE_STUDIES, getAsset } from "@/lib/site/content";
import { ELEMENTS, PAGES, elementsOnPage, isSitePage, pageForPath } from "@/lib/companion/registry";

describe("site maths", () => {
  it("compounds by APY rather than adding simple interest", () => {
    expect(projectBalance(10_000, 5, 365)).toBeCloseTo(10_500, 6);
    expect(projectBalance(10_000, 5, 730)).toBeCloseTo(11_025, 6);
    expect(projectBalance(10_000, 5, 0)).toBe(10_000);
    expect(projectBalance(-5, 5, 30)).toBe(0);
  });

  it("junior absorbs losses before senior", () => {
    expect(splitLoss(10_000, 20, 10)).toEqual({ loss: 1_000, juniorLoss: 1_000, seniorLoss: 0, junior: 1_000, senior: 8_000 });
    const big = splitLoss(10_000, 20, 30);
    expect(big.juniorLoss).toBe(2_000);
    expect(big.seniorLoss).toBe(1_000);
    expect(big.junior).toBe(0);
    expect(big.senior).toBe(7_000);
    // Out-of-range input is clamped, never produces negative balances.
    expect(splitLoss(10_000, 20, 150).senior).toBe(0);
  });

  it("splits every $100 of yield", () => {
    expect(yieldSplit(15)).toEqual({ business: 15, users: 85 });
    expect(yieldSplit(-3)).toEqual({ business: 0, users: 100 });
  });

  it("estimates revenue and users' net APY", () => {
    const r = estimateRevenue({ idleCapital: 10_000_000, adoptionPercent: 25, sharePercent: 10, grossApyPercent: 4, protectedOn: false });
    expect(r.capitalInSavings).toBe(2_500_000);
    expect(r.businessYearly).toBeCloseTo(10_000, 6);
    expect(r.usersYearly).toBeCloseTo(90_000, 6);
    expect(r.userApyPercent).toBeCloseTo(3.6, 9);
    expect(r.businessMonthly).toBeCloseTo(10_000 / 12, 6);
    const p = estimateRevenue({ idleCapital: 10_000_000, adoptionPercent: 25, sharePercent: 10, grossApyPercent: 4, protectedOn: true });
    expect(p.netApyPercent).toBeCloseTo(3.2, 9);
  });
});

describe("site content and routing", () => {
  it("asset slugs are unique and tranche siblings point at each other", () => {
    const slugs = ASSETS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of ASSETS.filter((x) => x.sibling)) expect(getAsset(a.sibling!)?.sibling).toBe(a.slug);
  });

  it("case studies only reference real assets", () => {
    for (const c of CASE_STUDIES) for (const s of c.assetSlugs) expect(getAsset(s)).not.toBeNull();
  });

  it("maps site and app paths to the right companion page", () => {
    expect(pageForPath("/")).toBe("home");
    expect(pageForPath("/dashboard")).toBe("dashboard");
    expect(pageForPath("/usdt")).toBe("usdt");
    expect(pageForPath("/assets/protected-prime")).toBe("assets");
    expect(pageForPath("/case-studies/maple")).toBe("caseStudies");
    expect(pageForPath("/create/calculator")).toBe("calculator");
    expect(pageForPath("/nowhere")).toBe("home");
    expect(isSitePage("earn")).toBe(true);
    expect(isSitePage("usdt")).toBe(false);
  });

  it("the USDT+ money controls are sensitive and never fillable", () => {
    for (const id of ["usdt-review", "usdt-sign"] as const) {
      expect(ELEMENTS[id].sensitive).toBe(true);
      expect((ELEMENTS[id] as { fillable?: boolean }).fillable).toBeFalsy();
    }
    expect(PAGES.usdt.path).toBe("/usdt");
  });
});

describe("layout-aware element lists", () => {
  it("offers app tabs only on app pages and the site header only on site pages", () => {
    expect(elementsOnPage("home")).toContain("site-launch-app");
    expect(elementsOnPage("home")).not.toContain("nav-mint");
    expect(elementsOnPage("usdt")).toContain("nav-mint");
    expect(elementsOnPage("usdt")).not.toContain("site-launch-app");
  });
});
