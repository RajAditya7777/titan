import { describe, it, expect } from "vitest";
import { ALL_TITAN_TOOLS, titanGetQuote, titanExplainQuote, titanDiagnoseError, titanFaq, matchFaqTopic, TITAN_FAQ, FAQ_TOPICS } from "../src/index";

describe("titan-companion-mcp", () => {
  it("provides 9 verified tools", () => {
    expect(ALL_TITAN_TOOLS.length).toBe(9);
    expect(ALL_TITAN_TOOLS.map((t) => t.name)).toContain("titan_faq");
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

  it("routes real new-user questions to the right FAQ answer", () => {
    const cases: Array<[string, string]> = [
      ["How is Titan different from Jupiter?", "different"],
      ["why use titan vs other DEXs", "different"],
      ["why did I get fewer tokens than quoted", "fewer_tokens"],
      ["my swap failed", "swap_failed"],
      ["how do I stop sandwich bots", "sandwich"],
      ["what fees will I pay", "fees"],
      ["should I use prime or manual", "prime_vs_manual"],
      ["what is DART", "dart"],
      ["what is slippage", "slippage"],
      ["how do limit orders work", "limit_orders"],
      ["I'm new, how do I get started", "getting_started"],
    ];
    for (const [q, topic] of cases) expect(matchFaqTopic(q), q).toBe(topic);
    expect(matchFaqTopic("tell me a joke")).toBeNull();
  });

  it("answers from verified facts only", async () => {
    // Spot-check facts against RESEARCH_TITAN_UMBRA.md so an edit can't drift silently.
    expect(TITAN_FAQ.dart.answer).toContain("Dynamic Allocation and Real Time");
    expect(TITAN_FAQ.limit_orders.answer).toMatch(/10 dollars.*10 basis points/);
    expect(TITAN_FAQ.fees.answer).toMatch(/Prime mode is zero.*up to 1 basis point/);
    for (const t of FAQ_TOPICS) expect(TITAN_FAQ[t].answer.length).toBeLessThan(520); // short enough to speak

    const res = await titanFaq.handler({ question: "how is titan different from other dexs" }, {});
    const data = res.structuredContent as any;
    expect(data.ok).toBe(true);
    expect(data.topic).toBe("different");
    expect(data.answer).toMatch(/meta-aggregator/);
    const none = (await titanFaq.handler({ question: "weather today" }, {})).structuredContent as any;
    expect(none.matched).toBe(false);
    expect(none.topics.length).toBe(FAQ_TOPICS.length);
  });
});
