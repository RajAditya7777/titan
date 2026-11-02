import { z } from "zod";
import { ELEMENT_IDS, getElement, PAGE_IDS, type ElementId } from "./registry";

/**
 * The strict action schema. This is the only vocabulary the LLM has to affect the page.
 * Every step is parsed here (server, after the LLM) and checked again by the guide engine
 * (client, before execution). No step can carry code, selectors or URLs.
 */

const Target = z.enum(ELEMENT_IDS as [ElementId, ...ElementId[]]);
const Page = z.enum(PAGE_IDS as [string, ...string[]]);
const Say = z.string().min(1).max(400);

/** Read-only MCP tools the browser may trigger during a workflow. */
/**
 * What the browser bridge (/api/mcp) may call. Only the Titan tools, which are offline: quotes come
 * from a fixed formula and docs are built in. Only the LLM is live (D-011), so no browser request
 * can reach a live market API.
 */
export const BRIDGE_TOOLS = [
  "titan_get_quote",
  "titan_explain_quote",
  "titan_explain_slippage",
  "titan_explain_routing",
  "titan_explain_prime",
  "titan_explain_limit_orders",
  "titan_diagnose_error",
  "titan_get_documentation",
] as const;

export const BROWSER_CALLABLE_TOOLS = [
  "reflect_get_stablecoin_overview",
  "reflect_get_mint_quote",
  "reflect_get_redeem_quote",
  "reflect_get_whitelabel_options",
  "reflect_get_protocol_stats",
] as const;

export const StepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("navigate_to_page"), page: Page, say: Say.optional() }),
  /** Move the pet beside the element, spotlight it and speak. */
  z.object({ type: z.literal("point"), target: Target, say: Say }),
  /** Ask the user to fill a field; resolves once the field validates. May offer a confirmed autofill. */
  z.object({
    type: z.literal("request_input"),
    target: Target,
    say: Say,
    suggestedValue: z.string().max(64).optional(),
  }),
  /** Call a read-only MCP tool. `{{field:<id>}}` in args is replaced by that field's current value. */
  z.object({
    type: z.literal("call_tool"),
    tool: z.enum(BROWSER_CALLABLE_TOOLS),
    args: z.record(z.string(), z.string()).default({}),
    /** Spoken after the call. `{{result.path}}` placeholders read from the tool's structured output. */
    say: Say,
    target: Target.optional(),
  }),
  /** Wait until the user clicks the element themselves. The engine never clicks. */
  z.object({ type: z.literal("wait_for_user_action"), target: Target, say: Say }),
  /** Terminal safety step: explain the wallet must approve; the workflow ends here. */
  z.object({ type: z.literal("stop_before_signing"), target: Target, say: Say }),
  z.object({ type: z.literal("celebrate"), say: Say }),
]);

export type Step = z.infer<typeof StepSchema>;

export const WorkflowSchema = z.object({
  id: z.string().min(1).max(48),
  title: z.string().min(1).max(80),
  steps: z.array(StepSchema).min(1).max(20),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

/** What the orchestrator returns to the browser for one user turn. */
export const CompanionReplySchema = z.object({
  speech: z.string().min(1).max(800),
  workflow: WorkflowSchema.optional(),
  /** A single-step "look here" without starting a workflow. */
  point: z.object({ target: Target, say: Say.optional() }).optional(),
  toolCalls: z
    .array(z.object({ tool: z.string(), ok: z.boolean(), provenance: z.string().optional(), ms: z.number() }))
    .default([]),
  engine: z.enum(["llm", "rules"]),
  needsClarification: z.boolean().default(false),
});
export type CompanionReply = z.infer<typeof CompanionReplySchema>;

/**
 * Semantic checks Zod can't express: safety invariants that must hold for every workflow,
 * whoever authored it. Returns problems; an empty array means safe to run.
 */
export function auditWorkflow(wf: Workflow): string[] {
  const problems: string[] = [];
  wf.steps.forEach((s, i) => {
    if (!("target" in s) || !s.target) return;
    const el = getElement(s.target);
    if (!el) return problems.push(`step ${i}: unknown target ${s.target}`);
    if (s.type === "request_input" && !el.fillable) problems.push(`step ${i}: ${s.target} is not an input the companion may fill`);
    if (s.type === "request_input" && el.sensitive) problems.push(`step ${i}: ${s.target} is sensitive`);
  });
  const signIdx = wf.steps.findIndex((s) => s.type === "stop_before_signing");
  if (signIdx !== -1 && signIdx !== wf.steps.length - 1) problems.push("stop_before_signing must be the last step");
  return problems;
}

/** Template rendering for `{{result.a.b}}` / `{{field:id}}`. Unknown paths render as "…" rather than throwing. */
export function renderTemplate(text: string, ctx: { result?: unknown; fields?: Record<string, string> }): string {
  return text.replace(/\{\{\s*(result\.[\w.]+|field:[\w-]+)\s*\}\}/g, (_, key: string) => {
    if (key.startsWith("field:")) return ctx.fields?.[key.slice(6)] ?? "…";
    const value = key
      .slice(7)
      .split(".")
      .reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), ctx.result);
    if (typeof value === "number") return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
    return value == null ? "…" : String(value);
  });
}
