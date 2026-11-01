import "server-only";
import { z } from "zod";
import { CompanionReplySchema, StepSchema, auditWorkflow, type CompanionReply, type Step } from "@/lib/companion/actions";
import { ELEMENTS, ELEMENT_IDS, elementsOnPage, getElement, type PageId } from "@/lib/companion/registry";
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
/** Whole-turn budget. A voice user won't wait longer; past it we answer from the rules planner. */
const TURN_BUDGET_MS = 20_000;
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
  // Kept deliberately compact: every token here is re-sent on every round, and free-tier
  // providers cap tokens per minute.
  return `You are Reflect Companion, a friendly spoken guide in an independent demo app for Reflect Money (yield-bearing stablecoins on Solana, e.g. USDC+, which grows in value vs USD).
Speak warmly and briefly (1-3 sentences, plain words, no markdown or URLs).
Use reflect_* tools for any number; never invent figures. APY is variable, never guaranteed. USDC+ is not a Circle product.
Never sign, approve or submit transactions or ask for keys; you only point, the user clicks. Whitelabel deploy is disabled.
Use workflow_id for mint, redeem, create_whitelabel (own yieldcoin), onboarding_tour (new users), explain_apy; amounts go in workflow_params.amount. Use point_target for "where is X"/"explain this". Missing info: ask one short question, needs_clarification=true.
Page: ${input.page}. Here: ${elementsOnPage(input.page).map((id) => `${id} (${ELEMENTS[id].label})`).join(", ")}
Elsewhere: ${siteMap(input.page)}
Typed fields: ${JSON.stringify(input.fields)}
Always finish with companion_respond.`;
}

export async function runTurn(input: TurnInput, provider: LlmProvider | null): Promise<CompanionReply> {
  if (!provider) return planWithRules(input.utterance, { page: input.page, runTool: callTool });

  const toolCalls: CompanionReply["toolCalls"] = [];
  try {
    const { tools: mcpTools } = await listTools();
    const fnTools: FunctionTool[] = mcpTools
      .filter((t) => !LLM_EXCLUDED_TOOLS.has(t.name) && toolIsRelevant(t.name, input.utterance))
      .map((t) => ({
        type: "function",
        function: { name: t.name, description: firstSentence(t.description ?? t.name), parameters: llmFriendlySchema(t.inputSchema as Record<string, unknown>) },
      }));
    fnTools.push(RESPOND_TOOL);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(input) },
      ...input.history.slice(-4),
      { role: "user", content: input.utterance },
    ];

    const started = Date.now();
    const deadline = new AbortController();
    const deadlineTimer = setTimeout(() => deadline.abort(), TURN_BUDGET_MS);
    try {
    let nudged = false;
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const t0 = Date.now();
      // Last round, or the model went quiet after a tool result: require companion_respond so the
      // turn always ends in validated speech (and optional guidance) rather than nothing.
      const force = round === MAX_TOOL_ROUNDS || nudged ? "companion_respond" : undefined;
      const res = await provider.chat(messages, fnTools, { signal: deadline.signal, forceTool: force });
      // Timing only: never message content or keys.
      console.info(`[companion] round ${round} llm=${Date.now() - t0}ms calls=${res.toolCalls.map((c) => c.function.name).join(",") || "none"}`);
      if (!res.toolCalls.length) {
        const prose = res.content?.trim();
        // The model answered in prose instead of calling companion_respond: accept it as speech.
        if (prose) return finalize({ speech: prose }, toolCalls);
        if (!nudged) {
          nudged = true;
          continue;
        }
        return finalize({ speech: "Sorry, could you say that again?" }, toolCalls);
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
        const outcome = await callTool(call.function.name, dropNulls(safeParseArgs(call.function.arguments)));
        console.info(`[companion] tool ${call.function.name} ok=${outcome.ok} ${outcome.ms}ms (turn ${Date.now() - started}ms)`);
        toolCalls.push({ tool: call.function.name, ok: outcome.ok, provenance: outcome.data?.provenance, ms: outcome.ms });
        // Tool output is re-sent every round, so keep it tight: it drives cost and rate-limit headroom.
        messages.push({ role: "tool", tool_call_id: call.id, content: truncate(JSON.stringify(outcome.data), 2_500) });
      }
    }
    return finalize({ speech: "That took more steps than I expected. Could you rephrase?" }, toolCalls);
    } finally {
      clearTimeout(deadlineTimer);
    }
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
    return CompanionReplySchema.parse({ speech: speakable(speech).slice(0, 800), toolCalls, engine: "llm" });
  }
  const a = { ...parsed.data, speech: speakable(parsed.data.speech) };
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

/**
 * Models often answer in Markdown. Speech synthesis would read "asterisk asterisk", and the bubble
 * would show raw symbols, so the reply is reduced to plain spoken text.
 */
export function speakable(text: string): string {
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_#>~|]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\u2011/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return voiceLength(plain) || "Sorry, could you say that again?";
}

/**
 * Listening is slower than reading, so spoken replies are capped at ~3 sentences / 320 chars,
 * cut at a sentence boundary (never mid-sentence; a single long sentence is kept whole up to 400).
 */
export function voiceLength(text: string, maxSentences = 3, maxChars = 320): string {
  // Split only where punctuation is followed by whitespace: "1.7%" and "U.S." stay intact.
  const sentences = text.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  let out = "";
  for (const sentence of sentences.slice(0, maxSentences)) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (out && next.length > maxChars) break;
    out = next;
  }
  return out.length > 400 ? `${out.slice(0, 397).replace(/\s+\S*$/, "")}…` : out;
}

/**
 * Adapt an MCP JSON Schema for chat-completion tools:
 *  - drop `$schema` (noise for the model);
 *  - let optional properties also accept `null`, because models routinely send `"x": null` for
 *    "not given" and strict providers reject that. Nulls are stripped again before the MCP call,
 *    so the MCP server's own validation stays strict.
 */
export function llmFriendlySchema(schema: Record<string, unknown>): Record<string, unknown> {
  const { $schema: _s, ...rest } = schema;
  const props = (rest.properties ?? {}) as Record<string, Record<string, unknown>>;
  const required = new Set((rest.required as string[] | undefined) ?? []);
  const properties = Object.fromEntries(
    Object.entries(props).map(([k, v]) => [k, required.has(k) || v.type === undefined ? v : { ...v, type: [v.type, "null"].flat() }]),
  );
  return { ...rest, properties };
}

export function dropNulls(args: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== null));
}

/** Always offered: they answer what most users ask. The rest only when the words call for them. */
const CORE_TOOLS = new Set([
  "reflect_get_stablecoin_overview",
  "reflect_get_mint_quote",
  "reflect_get_redeem_quote",
  "reflect_get_protocol_stats",
  "reflect_get_whitelabel_options",
]);
const SITUATIONAL: [RegExp, string[]][] = [
  [/error|fail|wrong|broken|reject|integrat|sdk|api|code|developer|request|endpoint|bug/i, ["reflect_explain_error", "reflect_check_integration", "reflect_get_documentation"]],
  [/doc|documentation|learn more|source|read about/i, ["reflect_get_documentation"]],
  [/event|activity|recent|transaction history|happen/i, ["reflect_get_protocol_events"]],
  [/oracle|price feed|pyth|chainlink/i, ["reflect_get_oracle_data"]],
];

export function toolIsRelevant(name: string, utterance: string): boolean {
  if (CORE_TOOLS.has(name)) return true;
  return SITUATIONAL.some(([re, names]) => names.includes(name) && re.test(utterance));
}

/** Tool descriptions for the model: first sentence only. The MCP server keeps the full text for other clients. */
function firstSentence(text: string): string {
  const cut = text.search(/\.\s/);
  return (cut > 0 ? text.slice(0, cut + 1) : text).slice(0, 180);
}

/** One compact line per page: "whitelabel: wl-name (Token name), wl-fee (Fee), …". */
function siteMap(current: PageId): string {
  const byPage = new Map<string, string[]>();
  for (const id of ELEMENT_IDS) {
    const el = ELEMENTS[id];
    if (el.page === "global" || el.page === current) continue;
    byPage.set(el.page, [...(byPage.get(el.page) ?? []), `${id} (${el.label})`]);
  }
  return [...byPage].map(([page, items]) => `${page}: ${items.join(", ")}`).join("; ");
}
