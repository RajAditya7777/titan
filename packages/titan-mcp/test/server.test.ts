import { describe, it, expect } from "vitest";
import { ALL_TITAN_TOOLS, titanGetQuote, titanExplainQuote, titanDiagnoseError } from "../src/index";

describe("titan-companion-mcp", () => {
  it("provides 8 verified tools", () => {
    expect(ALL_TITAN_TOOLS.length).toBe(8);
    const names = ALL_TITAN_TOOLS.map((t) => t.name);
    expect(names).toContain("titan_get_quote");
    expect(names).toContain("titan_explain_quote");
    expect(names).toContain("titan_explain_slippage");
    expect(names).toContain("titan_explain_routing");
    expect(names).toContain("titan_explain_prime");
    expect(names).toContain("titan_explain_limit_orders");
    expect(names).toContain("titan_diagnose_error");
    expect(names).toContain("titan_get_documentation");
  });

  it("calculates realistic quotes and respects Prime fee structure", async () => {
    const res = await titanGetQuote.handler(
      {
        inputToken: "SOL",
        outputToken: "USDC",
        amount: "2.0",
        prime: true,
        dart: "Auto",
      },
      {}
    );

    expect(res.isError).toBeUndefined();
    const data = res.structuredContent as any;
    expect(data.ok).toBe(true);
    expect(data.inputToken).toBe("SOL");
    expect(data.outputToken).toBe("USDC");
    expect(data.protocolFee).toContain("0.00%");
    expect(data.routeSummary.length).toBeGreaterThan(0);
    expect(data.simulated).toBe(true);
  });

  it("explains quote factors without assuming fixed values", async () => {
    const res = await titanExplainQuote.handler(
      {
        inputToken: "SOL",
        outputToken: "USDC",
        priceImpact: "0.08%",
      },
      {}
    );

    expect(res.isError).toBeUndefined();
    const data = res.structuredContent as any;
    expect(data.factors.length).toBeGreaterThan(0);
  });

  it("diagnoses known trading errors", async () => {
    const res = await titanDiagnoseError.handler({ errorCode: "limit-min-notional" }, {});
    expect(res.isError).toBeUndefined();
    const data = res.structuredContent as any;
    expect(data.title).toContain("$10 Minimum");
  });
});
