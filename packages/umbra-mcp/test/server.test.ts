import { describe, it, expect } from "vitest";
import { ALL_UMBRA_TOOLS, umbraPrivacyReport, umbraCheckTransferReadiness, umbraDiagnoseError } from "../src/index.js";

describe("umbra-companion-mcp", () => {
  it("provides 10 verified tools", () => {
    expect(ALL_UMBRA_TOOLS.length).toBe(10);
    const names = ALL_UMBRA_TOOLS.map((t) => t.name);
    expect(names).toContain("umbra_product_info");
    expect(names).toContain("umbra_registration_guidance");
    expect(names).toContain("umbra_deposit_guidance");
    expect(names).toContain("umbra_private_transfer_guidance");
    expect(names).toContain("umbra_withdrawal_guidance");
    expect(names).toContain("umbra_supported_tokens");
    expect(names).toContain("umbra_privacy_report");
    expect(names).toContain("umbra_check_transfer_readiness");
    expect(names).toContain("umbra_diagnose_error");
    expect(names).toContain("umbra_get_documentation");
  });

  it("returns privacy report for each operation", async () => {
    for (const op of ["register", "deposit", "private_send", "withdraw"] as const) {
      const res = await umbraPrivacyReport.handler({ operation: op }, {});
      expect(res.isError).toBeUndefined();
      expect(res.structuredContent).toHaveProperty("hidden");
      expect(res.structuredContent).toHaveProperty("public");
      expect(res.structuredContent).toHaveProperty("caveats");
    }
  });

  it("checks transfer readiness and flags blockers in order", async () => {
    // 1. Unregistered sender
    const res1 = await umbraCheckTransferReadiness.handler(
      {
        senderRegistered: false,
        recipientRegistered: true,
        privateBalance: 100,
        amount: 50,
        token: "USDC",
      },
      {}
    );
    expect((res1.structuredContent as any).ready).toBe(false);
    expect((res1.structuredContent as any).blockers).toContain("account-unregistered");

    // 2. Unregistered recipient
    const res2 = await umbraCheckTransferReadiness.handler(
      {
        senderRegistered: true,
        recipientRegistered: false,
        privateBalance: 100,
        amount: 50,
        token: "USDC",
      },
      {}
    );
    expect((res2.structuredContent as any).ready).toBe(false);
    expect((res2.structuredContent as any).blockers).toContain("recipient-unregistered");

    // 3. Insufficient balance
    const res3 = await umbraCheckTransferReadiness.handler(
      {
        senderRegistered: true,
        recipientRegistered: true,
        privateBalance: 10,
        amount: 50,
        token: "USDC",
      },
      {}
    );
    expect((res3.structuredContent as any).ready).toBe(false);
    expect((res3.structuredContent as any).blockers).toContain("amount-unfundable");

    // 4. All good
    const res4 = await umbraCheckTransferReadiness.handler(
      {
        senderRegistered: true,
        recipientRegistered: true,
        privateBalance: 100,
        amount: 50,
        token: "USDC",
      },
      {}
    );
    expect((res4.structuredContent as any).ready).toBe(true);
    expect((res4.structuredContent as any).blockers).toHaveLength(0);
  });

  it("diagnoses known error codes and fails on unknown codes", async () => {
    const known = await umbraDiagnoseError.handler({ errorCode: "recipient-unregistered" }, {});
    expect(known.isError).toBeUndefined();
    expect((known.structuredContent as any).title).toContain("Recipient Not Registered");

    const unknown = await umbraDiagnoseError.handler({ errorCode: "some-fake-code" }, {});
    expect(unknown.isError).toBe(true);
  });

  it("strictly enforces forbidden words audit (DECISIONS.md: never claim 100% untraceable or total anonymity)", async () => {
    const forbiddenPatterns = [/100%\s*untraceable/i, /completely\s*anonymous/i, /total\s*anonymity/i, /absolute\s*anonymity/i];

    for (const tool of ALL_UMBRA_TOOLS) {
      let sampleArgs: any = {};
      if (tool.name === "umbra_privacy_report") sampleArgs = { operation: "private_send" };
      if (tool.name === "umbra_check_transfer_readiness") {
        sampleArgs = { senderRegistered: true, recipientRegistered: true, privateBalance: 100, amount: 10, token: "USDC" };
      }
      if (tool.name === "umbra_diagnose_error") sampleArgs = { errorCode: "account-unregistered" };

      const res = await tool.handler(sampleArgs, {});
      const text = JSON.stringify(res);
      for (const pattern of forbiddenPatterns) {
        expect(text).not.toMatch(pattern);
      }
    }
  });
});
