import "server-only";
import { z } from "zod";
import { CompanionReplySchema, StepSchema, auditWorkflow, type CompanionReply, type Step } from "@/lib/companion/actions";
import { ELEMENTS, PAGES, elementsOnPage, getElement, type PageId } from "@/lib/companion/registry";
import { WORKFLOW_IDS, buildWorkflow } from "@/lib/companion/workflows";
import { callTool, listTools } from "../mcp-client";
import type { ChatMessage, FunctionTool, LlmProvider } from "./provider";
import { planWithRules } from "./rules";

/**
 * One user turn: utterance + page context → LLM (with MCP tools) → validated CompanionReply.
 *
 * The LLM never touches the DOM. It ends every turn by calling `companion_respond`, whose
 * arguments are parsed by Zod and audited against the element registry before they leave
 * the server. Anything that fails validation is dropped, and the speech is kept.
 */

export interface TurnInput {
  utterance: string;
  page: PageId;
  history: { role: "user" | "assistant"; content: string }[];
  /** Field values the user typed, so the model can reason about "my amount". Only registered fillable ids. */
  fields: Record<string, string>;
}

const MAX_TOOL_ROUNDS = 4;
/** No wallet is connected in this demo, so building transactions in chat would mislead. */
const LLM_EXCLUDED_TOOLS = new Set(["reflect_prepare_transaction"]);

const RespondArgs = z.object({
  speech: z.string().min(1).max(800),
  workflow_id: z.enum(WORKFLOW_IDS).optional(),
  workflow_params: z
    .object({ amount: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(), tokenName: z.string().max(32).optional(), tokenSymbol: z.string().max(8).optional() })
    .optional(),
  custom_steps: z.array(z.unknown()).max(8).optional(),
  point_target: z.string().optional(),
  needs_clarification: z.boolean().optional(),
});

const RESPOND_TOOL: FunctionTool = {
  type: "function",
  function: {
    name: "companion_respond",
    description:
      "ALWAYS finish your turn with this. `speech` is spoken aloud: warm, plain English, 1–3 short sentences, no markdown. " +
      "Optionally start a guided workflow (preferred for mint/redeem/whitelabel/tour/APY), point at one element, or give up to 8 custom_steps for a short ad-hoc tour.",
    parameters: {
      type: "object",
      properties: {
        speech: { type: "string" },
        workflow_id: { type: "string", enum: [...WORKFLOW_IDS] },
        workflow_params: {
          type: "object",
          properties: { amount: { type: "string" }, tokenName: { type: "string" }, tokenSymbol: { type: "string" } },
        },
        point_target: { type: "string", description: "A registered element id to point at" },
        custom_steps: {
          type: "array",
          description:
            'Steps: {type:"navigate_to_page",page} | {type:"point",target,say} | {type:"celebrate",say}. Targets must be registered element ids.',
          items: { type: "object" },
        },
        needs_clarification: { type: "boolean" },
      },
      required: ["speech"],
    },
  },
};

function systemPrompt(input: TurnInput) {
  const visible = elementsOnPage(input.page)
    .map((id) => `- ${id} (${ELEMENTS[id].kind}): ${ELEMENTS[id].label}`)
    .join("\n");
  const pages = Object.entries(PAGES)
    .map(([id, p]) => `- ${id}: ${p.title}. ${p.summary}`)
    .join("\n");
  return `You are Reflect Companion, a friendly voice guide inside an independent demo app for Reflect Money (yield-bearing stablecoins on Solana, e.g. USDC+).

Voice rules: you are SPOKEN aloud. Be warm, concrete and brief (1–3 sentences). No markdown, no lists, no URLs read aloud. Explain DeFi terms in everyday words.

Facts rules: use the reflect_* tools for any number (APY, rates, quotes, stats) and never invent figures. Say APY is variable and not guaranteed when you quote it. Never describe USDC+ as a Circle product.

Safety rules (non-negotiable): you never sign, approve or submit transactions and never ask for private keys or seed phrases. Money-moving buttons are only ever pointed at; the user presses them. Whitelabel deployment is disabled in this demo.

Guidance: for mint, redeem, creating a yieldcoin/whitelabel, first-time onboarding, or "what is APY", call companion_respond with the matching workflow_id (put amounts in workflow_params.amount as a plain number string). For "where is X" or "explain this", use point_target. If key info is missing, ask one short question and set needs_clarification.

Current page: ${input.page} (${PAGES[input.page].title})
Elements on this page:
${visible}

Pages:
${pages}

Field values the user has typed: ${JSON.stringify(input.fields)}

Always end by calling companion_respond.`;
}

export async function runTurn(input: TurnInput, provider: LlmProvider | null): Promise<CompanionReply> {
  if (!provider) return planWithRules(input.utterance, { page: input.page, runTool: callTool });

  const toolCalls: CompanionReply["toolCalls"] = [];
  try {
    const { tools: mcpTools } = await listTools();
    const fnTools: FunctionTool[] = mcpTools
      .filter((t) => !LLM_EXCLUDED_TOOLS.has(t.name))
      .map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description ?? t.name, parameters: t.inputSchema as Record<string, unknown> },
      }));
    fnTools.push(RESPOND_TOOL);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(input) },
      ...input.history.slice(-8),
      { role: "user", content: input.utterance },
    ];

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const res = await provider.chat(messages, fnTools);
      if (!res.toolCalls.length) {
        // The model answered in prose instead of calling companion_respond: accept it as speech.
        return finalize({ speech: res.content?.trim() || "Sorry, could you say that again?" }, toolCalls);
      }
      messages.push({ role: "assistant", content: res.content, tool_calls: res.toolCalls });

      for (const call of res.toolCalls) {
        if (call.function.name === "companion_respond") {
          return finalize(safeParseArgs(call.function.arguments), toolCalls);
        }
        if (LLM_EXCLUDED_TOOLS.has(call.function.name)) {
          messages.push({ role: "tool", tool_call_id: call.id, content: '{"ok":false,"error":"not available in this demo"}' });
          continue;
        }
        const outcome = await callTool(call.function.name, safeParseArgs(call.function.arguments));
        toolCalls.push({ tool: call.function.name, ok: outcome.ok, provenance: outcome.data?.provenance, ms: outcome.ms });
        messages.push({ role: "tool", tool_call_id: call.id, content: truncate(JSON.stringify(outcome.data), 6_000) });
      }
    }
    return finalize({ speech: "That took more steps than I expected. Could you rephrase?" }, toolCalls);
  } catch (err) {
    // LLM outage → deterministic fallback, so the companion keeps working.
    console.error("[companion] LLM turn failed, using rules:", (err as Error).message);
    const fallback = await planWithRules(input.utterance, { page: input.page, runTool: callTool });
    return { ...fallback, toolCalls: [...toolCalls, ...fallback.toolCalls] };
  }
}

/** Validate + audit everything the model proposed. Invalid parts are dropped, not trusted. */
export function finalize(raw: unknown, toolCalls: CompanionReply["toolCalls"]): CompanionReply {
  const parsed = RespondArgs.safeParse(raw);
  if (!parsed.success) {
    const speech = typeof (raw as { speech?: unknown })?.speech === "string" ? (raw as { speech: string }).speech : "Sorry, I got muddled. Could you say that again?";
    return CompanionReplySchema.parse({ speech: speech.slice(0, 800), toolCalls, engine: "llm" });
  }
  const a = parsed.data;
  let workflow = a.workflow_id ? buildWorkflow(a.workflow_id, a.workflow_params ?? {}) : undefined;

  if (!workflow && a.custom_steps?.length) {
    const steps = a.custom_steps
      .map((s) => StepSchema.safeParse(s))
      .filter((r): r is { success: true; data: Step } => r.success)
      // Ad-hoc LLM steps are limited to looking around. No inputs, tools or signing.
      .map((r) => r.data)
      .filter((s) => s.type === "navigate_to_page" || s.type === "point" || s.type === "celebrate");
    if (steps.length) {
      const candidate = { id: "custom", title: "Quick tour", steps };
      if (auditWorkflow(candidate).length === 0) workflow = candidate;
    }
  }

  const point = a.point_target && getElement(a.point_target) ? { target: a.point_target } : undefined;

  return CompanionReplySchema.parse({
    speech: a.speech,
    workflow,
    point,
    toolCalls,
    engine: "llm",
    needsClarification: a.needs_clarification ?? false,
  });
}

function safeParseArgs(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);
