import { describe, expect, it } from "vitest";
import { parseAmount, respondTo } from "@/lib/companion/page-reactions";

describe("pet page reactions", () => {
  it("reacts to the size of a typed amount and echoes only what was typed", () => {
    expect(respondTo({ id: "titan-sell-amount-input", kind: "input", value: "5" })).toMatchObject({ reaction: "giggle", quip: "5" });
    expect(respondTo({ id: "titan-sell-amount-input", kind: "input", value: "250" })?.reaction).toBe("hi");
    expect(respondTo({ id: "titan-sell-amount-input", kind: "input", value: "25000" })).toMatchObject({ reaction: "hop", quip: "Whoa, 25,000!" });
    expect(respondTo({ id: "titan-sell-amount-input", kind: "input", value: "0" })?.reaction).toBe("wiggle");
    expect(respondTo({ id: "titan-sell-amount-input", kind: "input", value: "abc" })?.reaction).toBe("wiggle");
  });

  it("ignores empty input and clicks into a field", () => {
    expect(respondTo({ id: "titan-sell-amount-input", kind: "input", value: "" })).toBeNull();
    expect(respondTo({ id: "titan-sell-amount-input", kind: "click", value: "5" })).toBeNull();
  });

  it("reacts to swap actions and never claims to sign", () => {
    expect(respondTo({ id: "titan-switch-tokens", kind: "click" })?.reaction).toBe("clap");
    expect(respondTo({ id: "titan-swap-review", kind: "click" })?.reaction).toBe("hearts");
    expect(respondTo({ id: "titan-swap-sign", kind: "click" })?.quip).toMatch(/wallet, not me/);
    expect(respondTo({ id: "titan-nav-limit", kind: "click" })).toMatchObject({ reaction: "hop", visit: false });
  });

  it("warns on high slippage and ignores unknown controls", () => {
    expect(respondTo({ id: "titan-slippage-base-input", kind: "input", value: "5" })?.reaction).toBe("wiggle");
    expect(respondTo({ id: "titan-slippage-base-input", kind: "input", value: "0.5" })?.reaction).toBe("giggle");
    expect(respondTo({ id: "titan-unknown", kind: "click" })).toBeNull();
  });

  it("parses amounts with separators", () => {
    expect(parseAmount("1,000.5")).toBe(1000.5);
    expect(parseAmount(" ")).toBeNull();
  });
});

describe("Jupiter reactions", () => {
  it("reacts to every swap control", () => {
    for (const id of ["jup-connect", "jup-wallet-connect", "jup-flip", "jup-sell-token", "jup-buy-token", "jup-swap-submit", "jup-approve", "jup-tab-limit"]) {
      expect(respondTo({ id, kind: "click" }), id).not.toBeNull();
    }
    expect(respondTo({ id: "jup-swap-submit", kind: "click" })?.reaction).toBe("cheer");
  });

  it("gets more nervous as leverage climbs", () => {
    expect(respondTo({ id: "jup-perps-leverage", kind: "input", value: "3" })?.reaction).toBe("giggle");
    expect(respondTo({ id: "jup-perps-leverage", kind: "input", value: "20" })?.reaction).toBe("hop");
    expect(respondTo({ id: "jup-perps-leverage", kind: "input", value: "200" })?.quip).toMatch(/liquidation/);
  });

  it("echoes typed amounts", () => {
    expect(respondTo({ id: "jup-sell-amount", kind: "input", value: "2" })?.quip).toBe("2");
    expect(respondTo({ id: "jup-perps-amount", kind: "input", value: "0" })?.reaction).toBe("wiggle");
  });
});
