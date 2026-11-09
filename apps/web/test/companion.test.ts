import { describe, expect, it, vi } from "vitest";
import { auditWorkflow, renderTemplate, StepSchema, type Workflow } from "@/lib/companion/actions";
import { extractNumber, parseControlCommand } from "@/lib/companion/commands";
import { placePet } from "@/lib/companion/positioning";
import { ELEMENTS, ELEMENT_IDS, PAGES, pageForPath, validate } from "@/lib/companion/registry";
import { buildWorkflow, WORKFLOW_IDS } from "@/lib/companion/workflows";
import { planWithRules } from "@/lib/server/llm/rules";
import { dropNulls, finalize, llmFriendlySchema, speakable } from "@/lib/server/llm/orchestrator";

vi.mock("@/lib/server/mcp-client", () => ({ callTool: vi.fn(), listTools: vi.fn() }));

describe("registry", () => {
  it("every element belongs to a known page", () => {
    for (const id of ELEMENT_IDS) {
      const p = ELEMENTS[id].page;
      expect(p === "global" || p in PAGES).toBe(true);
    }
  });

  it("money-moving controls are sensitive and never fillable", () => {
    for (const id of ["mint-review", "mint-sign", "redeem-review", "redeem-sign", "wl-deploy"] as const) {
      const el = ELEMENTS[id] as { sensitive?: boolean; fillable?: boolean };
      expect(el.sensitive).toBe(true);
      expect(el.fillable).toBeFalsy();
    }
  });

  it("maps paths to pages", () => {
    expect(pageForPath("/dashboard")).toBe("dashboard");
    expect(pageForPath("/stablecoins/usdc-plus")).toBe("stablecoin");
    expect(pageForPath("/mint")).toBe("mint");
  });

  it("validates fields", () => {
    expect(validate("positive-amount", "100")).toBeNull();
    expect(validate("positive-amount", "0")).not.toBeNull();
    expect(validate("positive-amount", "1.1234567")).not.toBeNull();
    expect(validate("token-symbol", "ACME")).toBeNull();
    expect(validate("token-symbol", "acme")).not.toBeNull();
    expect(validate("fee-bps", "50")).toBeNull();
    expect(validate("fee-bps", "5000")).not.toBeNull();
  });
});

describe("action schema & safety audit", () => {
  it("rejects selectors, code and unknown targets", () => {
    expect(StepSchema.safeParse({ type: "point", target: "#mint > button", say: "x" }).success).toBe(false);
    expect(StepSchema.safeParse({ type: "eval", code: "alert(1)" }).success).toBe(false);
    expect(StepSchema.safeParse({ type: "call_tool", tool: "reflect_prepare_transaction", say: "x" }).success).toBe(false);
  });

  it("all built-in workflows pass the audit and end safely", () => {
    for (const id of WORKFLOW_IDS) {
      const wf = buildWorkflow(id, { amount: "100" });
      expect(auditWorkflow(wf)).toEqual([]);
      for (const s of wf.steps) expect(StepSchema.safeParse(s).success).toBe(true);
    }
    expect(buildWorkflow("mint").steps.at(-1)?.type).toBe("stop_before_signing");
  });

  it("refuses to request input on a sensitive control", () => {
    const wf: Workflow = { id: "x", title: "x", steps: [{ type: "request_input", target: "mint-sign", say: "fill" }] };
    expect(auditWorkflow(wf).join()).toMatch(/not an input/);
  });

  it("requires stop_before_signing to be terminal", () => {
    const wf: Workflow = {
      id: "x",
      title: "x",
      steps: [
        { type: "stop_before_signing", target: "mint-sign", say: "a" },
        { type: "celebrate", say: "b" },
      ],
    };
    expect(auditWorkflow(wf)).toContain("stop_before_signing must be the last step");
  });

  it("renders templates from tool results and fields, tolerating gaps", () => {
    expect(renderTemplate("{{result.a.0.b}} / {{field:mint-amount}} / {{result.zzz}}", { result: { a: [{ b: 1234.5 }] }, fields: { "mint-amount": "100" } })).toBe(
      "1,234.5 / 100 / …",
    );
  });
});

describe("voice commands", () => {
  it.each([
    ["Stop", "stop"],
    ["cancel", "stop"],
    ["repeat that", "repeat"],
    ["next", "next"],
    ["skip this step", "next"],
    ["go back", "back"],
    ["start again", "restart"],
    ["what does this mean?", "explain"],
    ["yes", "confirm"],
    ["no thanks", "decline"],
  ])("%s → %s", (text, kind) => {
    expect(parseControlCommand(text)?.kind).toBe(kind);
  });

  it("treats long sentences as questions, not commands", () => {
    expect(parseControlCommand("stop telling me about fees and explain how the yield is generated please")).toBeNull();
  });

  it("captures spoken numbers while a field is awaiting a value", () => {
    expect(parseControlCommand("one hundred", { awaitingValue: true })).toEqual({ kind: "provide_value", value: "100" });
    expect(parseControlCommand("2,500", { awaitingValue: true })).toEqual({ kind: "provide_value", value: "2500" });
    expect(extractNumber("two thousand five hundred")).toBe("2500");
  });
});

describe("pet positioning", () => {
  const viewport = { width: 1280, height: 800 };
  const pet = { width: 88, height: 88 };
  const overlaps = (a: { x: number; y: number }, t: { x: number; y: number; width: number; height: number }) =>
    a.x < t.x + t.width && a.x + pet.width > t.x && a.y < t.y + t.height && a.y + pet.height > t.y;

  it("never covers the target and stays in the viewport", () => {
    const targets = [
      { x: 20, y: 20, width: 200, height: 40 },
      { x: 1100, y: 700, width: 160, height: 60 },
      { x: 300, y: 300, width: 700, height: 80 },
      { x: 0, y: 380, width: 1280, height: 60 },
    ];
    for (const target of targets) {
      const p = placePet({ target, viewport, pet });
      expect(overlaps(p, target)).toBe(false);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y + pet.height).toBeLessThanOrEqual(viewport.height);
    }
  });

  it("avoids reserved areas such as the guidance bar", () => {
    const target = { x: 500, y: 640, width: 280, height: 50 };
    const bar = { x: 380, y: 668, width: 520, height: 132 };
    const p = placePet({ target, viewport, pet, avoid: [bar] });
    expect(overlaps(p, bar)).toBe(false);
  });

  it("faces the target", () => {
    const p = placePet({ target: { x: 100, y: 380, width: 100, height: 40 }, viewport, pet });
    expect(p.side).toBe("right");
    expect(Math.abs(p.angle)).toBeGreaterThan(150); // pet is right of target → looks left
  });
});

describe("offline rules planner", () => {
  const runTool = vi.fn(async (tool: string) => ({
    ok: true,
    ms: 1,
    tool,
    data: tool === "reflect_get_mint_quote" ? { provenance: "live", expectedOutput: { amount: 99.16 } } : { provenance: "live", stablecoins: [] },
  }));

  it("routes the three demo utterances to the right workflows", async () => {
    const mint = await planWithRules("Help me mint 100 USDC+", { page: "dashboard", runTool });
    expect(mint.workflow?.id).toBe("mint");
    expect(mint.speech).toContain("99.16");
    expect(mint.toolCalls[0]).toMatchObject({ tool: "reflect_get_mint_quote", ok: true });

    expect((await planWithRules("I'm new here. Show me how Reflect works.", { page: "dashboard", runTool })).workflow?.id).toBe("onboarding_tour");
    expect((await planWithRules("I want to create my own yieldcoin", { page: "dashboard", runTool })).workflow?.id).toBe("create_whitelabel");
    expect((await planWithRules("What is APY?", { page: "mint", runTool })).workflow?.id).toBe("explain_apy");
  });

  it("points instead of starting a flow for 'where' questions", async () => {
    const r = await planWithRules("Show me where I can redeem", { page: "dashboard", runTool });
    expect(r.workflow).toBeUndefined();
    expect(r.point?.target).toBe("nav-redeem");
  });

  it("asks for details when a failure is too vague to diagnose", async () => {
    const r = await planWithRules("Why is my transaction failing?", { page: "mint", runTool });
    expect(r.needsClarification).toBe(true);
  });
});

describe("LLM output finalisation", () => {
  it("drops invalid targets and unsafe custom steps, keeps the speech", () => {
    const r = finalize(
      {
        speech: "Here you go",
        point_target: "#evil",
        custom_steps: [
          { type: "point", target: "dashboard-apy", say: "APY" },
          { type: "wait_for_user_action", target: "mint-sign", say: "click" },
          { type: "script", code: "x" },
        ],
      },
      [],
    );
    expect(r.speech).toBe("Here you go");
    expect(r.point).toBeUndefined();
    expect(r.workflow?.steps).toEqual([{ type: "point", target: "dashboard-apy", say: "APY" }]);
  });

  it("builds reviewed workflows from workflow_id + params", () => {
    const r = finalize({ speech: "Sure", workflow_id: "mint", workflow_params: { amount: "250" } }, []);
    expect(r.workflow?.title).toBe("Mint 250 USDC+");
  });

  it("survives garbage from the model", () => {
    expect(finalize("not json", []).speech).toMatch(/say that again/);
  });
});

describe("LLM adapters", () => {
  it("makes only optional properties nullable and strips $schema", () => {
    const out = llmFriendlySchema({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: { amount: { type: "string" }, asset: { type: "string", enum: ["USDC+"] } },
      required: ["amount"],
    }) as any;
    expect(out.$schema).toBeUndefined();
    expect(out.properties.amount.type).toBe("string");
    expect(out.properties.asset.type).toEqual(["string", "null"]);
    expect(dropNulls({ asset: null, amount: "1" })).toEqual({ amount: "1" });
  });

  it("turns Markdown answers into speakable text", () => {
    expect(speakable("**Current APY**: ≈ 1.7 % — see [docs](https://x.y)\n- variable")).toBe("Current APY: ≈ 1.7 % — see docs variable");
  });
});

describe("control commands", () => {
  it("treats a bare 'explain' as a command but sends real questions to the AI", async () => {
    const { parseControlCommand } = await import("@/lib/companion/commands");
    expect(parseControlCommand("explain")?.kind).toBe("explain");
    expect(parseControlCommand("Explain this")?.kind).toBe("explain");
    expect(parseControlCommand("Explain Gacha, I am new")).toBeNull();
    expect(parseControlCommand("explain how limit orders work")).toBeNull();
  });
});
