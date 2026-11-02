import { describe, expect, it, beforeEach } from "vitest";
import {
  UMBRA_ELEMENTS,
  UMBRA_ELEMENT_IDS,
  UMBRA_PAGES,
  getUmbraElement,
} from "@/lib/products/umbra/registry";
import { umbraSimulator } from "@/lib/products/umbra/simulator";
import { planUmbraGoal, UMBRA_GOALS } from "@/lib/products/umbra/planner";
import { PRIVACY_REPORTS, getPrivacyReport } from "@/lib/products/umbra/privacy-matrix";
import { matchUmbraRules } from "@/lib/products/umbra/rules";
import { getUmbraAppState, UmbraAppStateSchema } from "@/lib/products/umbra/state";
import { DEMO_RECIPIENTS } from "@/lib/products/umbra/types";

describe("Umbra Registry & Safety", () => {
  it("all elements belong to the umbra page", () => {
    for (const id of UMBRA_ELEMENT_IDS) {
      const el = UMBRA_ELEMENTS[id];
      expect(el.page === "umbra" || el.page === "global").toBe(true);
      expect(el.label).toBeDefined();
      expect(el.description).toBeDefined();
    }
  });

  it("money-moving & signing controls are sensitive and never fillable", () => {
    const sensitiveIds = [
      "umbra-account-register-btn",
      "umbra-deposit-confirm",
      "umbra-deposit-approve",
      "umbra-send-confirm",
      "umbra-send-approve",
      "umbra-withdraw-confirm",
      "umbra-withdraw-approve",
    ] as const;

    for (const id of sensitiveIds) {
      const el = getUmbraElement(id);
      expect(el).not.toBeNull();
      expect(el?.sensitive).toBe(true);
      expect(el?.fillable).toBeFalsy();
    }
  });

  it("inputs intended for user typing are fillable and not sensitive", () => {
    const fillableIds = [
      "umbra-deposit-amount",
      "umbra-send-amount",
      "umbra-send-recipient",
      "umbra-withdraw-amount",
      "umbra-withdraw-destination",
    ] as const;

    for (const id of fillableIds) {
      const el = getUmbraElement(id);
      expect(el).not.toBeNull();
      expect(el?.fillable).toBe(true);
      expect(el?.sensitive).toBeFalsy();
    }
  });
});

describe("Umbra Simulator Operations", () => {
  beforeEach(() => {
    umbraSimulator.reset();
  });

  it("starts in a clean initial state with unshielded and shielded balances", () => {
    const state = umbraSimulator.getState();
    expect(state.walletConnected).toBe(true);
    expect(state.registered).toBe(false);
    expect(state.platformWallet).toBeNull();
    expect(parseFloat(state.publicBalances.USDC)).toBeGreaterThan(0);
    expect(parseFloat(state.privateBalances.USDC)).toBeGreaterThan(0);
  });

  it("verifies recipient registrations correctly", () => {
    const alice = umbraSimulator.checkRecipientRegistration(DEMO_RECIPIENTS[0]!.address);
    expect(alice?.status).toBe("registered");

    const bob = umbraSimulator.checkRecipientRegistration(DEMO_RECIPIENTS[1]!.address);
    expect(bob?.status).toBe("unregistered");
  });

  it("handles deterministic registration successfully", async () => {
    const ok = await umbraSimulator.register();
    expect(ok).toBe(true);

    const state = umbraSimulator.getState();
    expect(state.registered).toBe(true);
    expect(state.platformWallet).toBeTruthy();
    expect(state.identityCommitment).toBeTruthy();
    expect(state.currentOperation.stage).toBe("done");
  });

  it("handles shielding deposit with balance arithmetic", async () => {
    const initialPub = parseFloat(umbraSimulator.getState().publicBalances.USDC);
    const initialPriv = parseFloat(umbraSimulator.getState().privateBalances.USDC);

    const ok = await umbraSimulator.deposit("USDC", "100");
    expect(ok).toBe(true);

    const state = umbraSimulator.getState();
    expect(parseFloat(state.publicBalances.USDC)).toBeCloseTo(initialPub - 100, 2);
    expect(parseFloat(state.privateBalances.USDC)).toBeCloseTo(initialPriv + 100, 2);
  });

  it("rejects deposit exceeding public balance with amount-unfundable", async () => {
    const ok = await umbraSimulator.deposit("USDC", "999999");
    expect(ok).toBe(false);
    const state = umbraSimulator.getState();
    expect(state.currentOperation.error?.code).toBe("amount-unfundable");
  });

  it("blocks private send if account is not registered", async () => {
    // Unregistered state
    const ok = await umbraSimulator.privateSend("USDC", "10", DEMO_RECIPIENTS[0]!.address);
    expect(ok).toBe(false);
    const state = umbraSimulator.getState();
    expect(state.currentOperation.error?.code).toBe("account-unregistered");
  });

  it("blocks private send if recipient is unregistered", async () => {
    await umbraSimulator.register();
    const ok = await umbraSimulator.privateSend("USDC", "10", DEMO_RECIPIENTS[1]!.address); // Bob
    expect(ok).toBe(false);
    const state = umbraSimulator.getState();
    expect(state.currentOperation.error?.code).toBe("recipient-unregistered");
  });

  it("executes private send successfully to registered recipient", async () => {
    await umbraSimulator.register();
    const initialPriv = parseFloat(umbraSimulator.getState().privateBalances.USDC);

    const ok = await umbraSimulator.privateSend("USDC", "50", DEMO_RECIPIENTS[0]!.address); // Alice
    expect(ok).toBe(true);

    const state = umbraSimulator.getState();
    expect(parseFloat(state.privateBalances.USDC)).toBeCloseTo(initialPriv - 50, 2);
    expect(state.history[0]?.type).toBe("private_send");
  });

  it("handles withdrawal back to public wallet", async () => {
    await umbraSimulator.register();
    const initialPriv = parseFloat(umbraSimulator.getState().privateBalances.USDC);
    const initialPub = parseFloat(umbraSimulator.getState().publicBalances.USDC);

    const ok = await umbraSimulator.withdraw("USDC", "25", umbraSimulator.getState().connectedAddress);
    expect(ok).toBe(true);

    const state = umbraSimulator.getState();
    expect(parseFloat(state.privateBalances.USDC)).toBeCloseTo(initialPriv - 25, 2);
    expect(parseFloat(state.publicBalances.USDC)).toBeCloseTo(initialPub + 25, 2);
  });
});

describe("Deterministic Umbra Goal Planners", () => {
  it("register goal creates workflow ending with stop_before_signing", () => {
    const state = getUmbraAppState();
    state.registered = false;
    const plan = planUmbraGoal("register", { slots: {}, state });
    expect(plan).not.toBeNull();
    expect(plan?.steps.at(-1)?.type).toBe("stop_before_signing");
  });

  it("deposit goal creates workflow requesting input and ending with stop_before_signing", () => {
    const state = getUmbraAppState();
    const plan = planUmbraGoal("deposit", { slots: { amount: "200", token: "USDC" }, state });
    expect(plan).not.toBeNull();
    const reqStep = plan?.steps.find((s) => s.type === "request_input");
    expect(reqStep?.suggestedValue).toBe("200");
    expect(plan?.steps.at(-1)?.type).toBe("stop_before_signing");
  });

  it("private_send detects unregistered sender and diverts to registration", () => {
    const state = getUmbraAppState();
    state.registered = false;
    const plan = planUmbraGoal("private_send", { slots: { amount: "50" }, state });
    expect(plan?.id).toBe("umbra-send-blocked-unregistered");
  });

  it("private_send detects unregistered recipient Bob and explains limitation", () => {
    const state = getUmbraAppState();
    state.registered = true;
    const plan = planUmbraGoal("private_send", {
      slots: { amount: "50", recipient: DEMO_RECIPIENTS[1]!.address },
      state,
    });
    expect(plan?.id).toBe("umbra-send-blocked-recipient");
    expect(plan?.steps[0]?.say).toContain("not registered in the Nimbus registry");
  });

  it("private_send creates valid workflow for registered recipient", () => {
    const state = getUmbraAppState();
    state.registered = true;
    const plan = planUmbraGoal("private_send", {
      slots: { amount: "50", recipient: DEMO_RECIPIENTS[0]!.address },
      state,
    });
    expect(plan?.id).toBe("umbra-private-send");
    expect(plan?.steps.at(-1)?.type).toBe("stop_before_signing");
  });
});

describe("Privacy Matrix & Forbidden-Claims Audit (DECISIONS.md)", () => {
  const FORBIDDEN_WORDS = ["completely anonymous", "100% untraceable", "100% anonymous", "total anonymity", "untraceable"];

  it("privacy reports never contain deceptive absolute anonymity claims", () => {
    for (const op of ["register", "deposit", "private_send", "withdraw"] as const) {
      const rep = getPrivacyReport(op);
      const allText = [
        ...rep.hidden,
        ...rep.public,
        ...rep.caveats,
        rep.title,
      ].join(" ").toLowerCase();

      for (const word of FORBIDDEN_WORDS) {
        expect(allText).not.toContain(word);
      }
    }
  });

  it("planner output never contains deceptive absolute anonymity claims", () => {
    const state = getUmbraAppState();
    state.registered = true;

    for (const goalName of Object.keys(UMBRA_GOALS)) {
      const plan = planUmbraGoal(goalName, { slots: {}, state });
      if (!plan) continue;
      const allText = plan.steps.map((s) => s.say).join(" ").toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        expect(allText).not.toContain(word);
      }
    }
  });
});

describe("Rules Matcher & AppState Schema", () => {
  it("matches privacy questions to explain_privacy", () => {
    const state = getUmbraAppState();
    const intent = matchUmbraRules("what is visible on chain?", state);
    expect(intent?.type).toBe("explain");
    expect(intent?.goal).toBe("explain_privacy");
  });

  it("matches deposit queries with slots", () => {
    const state = getUmbraAppState();
    const intent = matchUmbraRules("shield 250 usdc", state);
    expect(intent?.type).toBe("act");
    expect(intent?.goal).toBe("deposit");
    expect(intent?.slots.amount).toBe("250");
    expect(intent?.slots.token).toBe("USDC");
  });

  it("validates AppState snapshot with no sensitive fields", () => {
    const snapshot = getUmbraAppState();
    const result = UmbraAppStateSchema.safeParse(snapshot);
    expect(result.success).toBe(true);

    // Explicit check: no keypairs, no private keys, no seed phrases
    const rawKeys = Object.keys(snapshot);
    expect(rawKeys).not.toContain("privateKey");
    expect(rawKeys).not.toContain("seedPhrase");
    expect(rawKeys).not.toContain("secretKey");
  });
});
