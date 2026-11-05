import "server-only";
import { z } from "zod";
import { CompanionReplySchema, StepSchema, auditWorkflow, type CompanionReply, type Step } from "@/lib/companion/actions";
import { ELEMENTS, ELEMENT_IDS, PAGES, elementsOnPage, getElement, type PageId } from "@/lib/companion/registry";
import { WORKFLOW_IDS, buildWorkflow } from "@/lib/companion/workflows";
import { callTool, listTools } from "../mcp-client";
import type { ChatMessage, ContentPart, FunctionTool, LlmProvider } from "./provider";
import { UMBRA_KNOWLEDGE } from "@/lib/products/umbra/web";
import { JUPITER_KNOWLEDGE } from "@/lib/products/jupiter/web";
import { GACHA_KNOWLEDGE } from "@/lib/products/jupiter/gacha";
import { planWithRules } from "./rules";
import { getTitanPromptFragment } from "@/lib/products/titan/prompt";

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
  /** Live context and data from the active page/view. */
  pageContext?: Record<string, unknown>;
  /** The text the user can currently see, read from the DOM (so answers follow the real page). */
  pageText?: string;
  /** A JPEG data URL of the user's viewport, for vision models. */
  screenshot?: string;
}

const isUmbraWeb = (page: PageId) => page === "umbra_home" || page === "umbra_app";
const isJupiter = (page: PageId) => page.startsWith("jup_");
/** Products that answer from knowledge + what they see, with no MCP tool round-trips. */
const seesAndKnows = (page: PageId) => isUmbraWeb(page) || isJupiter(page);

function jupiterPrompt(input: TurnInput) {
  return `You are Astro, a curious astronaut cat floating around jup.ag who helps people use Jupiter on Solana.
Speak warmly and plainly: 1-3 short sentences, no markdown, no URLs, no hype, no price predictions or financial advice.
You can SEE the user's screen: when a screenshot is attached, look at it and refer to what is actually there (numbers, tokens, buttons, warnings, which tab is open). The visible page text is below too.
${JUPITER_KNOWLEDGE}
${GACHA_KNOWLEDGE}

Rules:
- Answer only from these facts and what you see. If something isn't covered, say you're not sure rather than guessing.
- This demo uses a simulated wallet and fixed demo prices. Never ask for keys or seed phrases. You never click, sign or approve: you point, the user acts.
- If the user asks a question, asks you to explain something, or reports a problem ("explain Gacha", "I'm new to Gacha", "why did I get less than the quote?", "my swap failed"), ANSWER it in 3 to 4 short sentences from the facts and what you see, and do NOT set workflow_id. If they ask how something works, "step by step", how to do it, or which buttons to press (even with "I'm new"), the answer MUST be the button-by-button workflow from the facts above, in order, in 6 short sentences and UNDER 90 words in total, naming the real buttons they will see (be terse: one short clause per step, no filler) (for Jupiter in general, the Swap workflow plus a one-line mention of Gacha); do not give a generic overview instead. These are QUESTIONS: never set workflow_id for them and never answer "let me walk you through"; just speak the steps. For "explain X" or "I'm new to X" (with no mention of steps or buttons) give a complete beginner overview: what it is, how it works step by step, the main risk, and one tip.
- Whenever the user clearly wants to DO or be shown something ("help me swap", "guide me", "show me around", "open a pack for me") you MUST set workflow_id: jup_swap {amount, inputToken, outputToken} | jup_limit {amount, inputToken, outputToken, price} | jup_perps {side: long|short, amount (USDC collateral), leverage} | jup_portfolio | jup_gacha (open a pack). New users or "show me around": jup_tour. Tokens: SOL, USDC, JUP, USDT, BONK, JitoSOL.
- To show one thing, set point_target to an element id below. Questions get a spoken answer.
Page: ${input.page} (${PAGES[input.page].title}). Elements here: ${elementsOnPage(input.page).map((id) => `${id} (${ELEMENTS[id].label})`).join(", ")}
Other Jupiter pages: ${(["jup_swap", "jup_limit", "jup_perps", "jup_gacha", "jup_portfolio"] as const).filter((p) => p !== input.page).join(", ")}
App state: ${JSON.stringify(input.pageContext ?? {})}
Typed fields: ${JSON.stringify(input.fields)}
${input.pageText ? `Visible page text:\n"""${input.pageText}"""` : ""}
Always finish with companion_respond.`;
}

function umbraWebPrompt(input: TurnInput) {
  return `You are Milo, a small pixel puppy who lives on the Umbra website (umbraprivacy.com) and guides people through it. Umbra is the privacy layer for your money on Solana.
Speak warmly and plainly: 1-3 short sentences, no markdown, no URLs, no hype.
You can SEE the user's screen: when a screenshot is attached, look at it and refer to what is actually there (headings, numbers, buttons, errors, what tab is open). The visible page text is below too.
${UMBRA_KNOWLEDGE}

Rules:
- Never say untraceable, 100% private or fully anonymous; deposits and withdrawals are public at the edges.
- This demo uses a simulated wallet and simulated balances. Never ask for keys or seed phrases. You never click, sign or approve: you point, the user acts.
- Whenever the user wants to DO something (deposit, send, swap, withdraw, get started), you MUST set workflow_id so you can walk them through it on the page: umbra_web_deposit | umbra_web_send | umbra_web_swap | umbra_web_withdraw, with workflow_params {amount, inputToken, outputToken, recipient}. Tokens: SOL, USDC, USDT, USDv.
- New users or "how does it work" / "show me around": umbra_web_tour. "What's public/private": umbra_web_privacy.
- To show one thing, set point_target to an element id from the lists below. Questions get a spoken answer, not a workflow.
Page: ${input.page} (${PAGES[input.page].title}). Elements here: ${elementsOnPage(input.page).map((id) => `${id} (${ELEMENTS[id].label})`).join(", ")}
Elsewhere: ${siteMap(input.page)}
App state: ${JSON.stringify(input.pageContext ?? {})}
Typed fields: ${JSON.stringify(input.fields)}
${input.pageText ? `Visible page text:\n"""${input.pageText}"""` : ""}
Always finish with companion_respond.`;
}

/** The user turn, with the screenshot attached when the page sent one. */
function userMessage(input: TurnInput): ChatMessage {
  if (!input.screenshot) return { role: "user", content: input.utterance };
  const parts: ContentPart[] = [
    { type: "text", text: `${input.utterance}\n(Attached: a screenshot of what I'm looking at right now.)` },
    { type: "image_url", image_url: { url: input.screenshot } },
  ];
  return { role: "user", content: parts };
}

const MAX_TOOL_ROUNDS = 4;
/** Whole-turn budget. A voice user won't wait longer; past it we answer from the rules planner. */
const TURN_BUDGET_MS = 45_000;
/** No wallet is connected in this demo, so building transactions in chat would mislead. */
const LLM_EXCLUDED_TOOLS = new Set<string>();

const RespondArgs = z.object({
  speech: z.string().min(1).max(800),
  workflow_id: z.enum(WORKFLOW_IDS).optional(),
  workflow_params: z
    .object({
      amount: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),
      tokenName: z.string().max(32).optional(),
      tokenSymbol: z.string().max(8).optional(),
      inputToken: z.string().max(16).optional(),
      outputToken: z.string().max(16).optional(),
      recipient: z.string().max(64).optional(),
      price: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),
      side: z.enum(["long", "short"]).optional(),
      leverage: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    })
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
          properties: {
            amount: { type: "string", description: "Numerical amount e.g. '2' or '0.5'" },
            tokenName: { type: "string" },
            tokenSymbol: { type: "string" },
            inputToken: { type: "string", description: "Symbol of token to sell e.g. 'SOL'" },
            outputToken: { type: "string", description: "Symbol of token to buy e.g. 'USDC'" },
            recipient: { type: "string", description: "Recipient Solana address for a private send" },
            price: { type: "string", description: "Limit order target price" },
            side: { type: "string", description: "Perps side: long or short" },
            leverage: { type: "string", description: "Perps leverage e.g. '5'" },
          },
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

function formatPageContext(ctx?: Record<string, unknown>): string {
  if (!ctx || Object.keys(ctx).length === 0) return "";
  const lines: string[] = ["=== LIVE TITAN WEBPAGE CONTEXT & DATA ==="];
  if (ctx.product) lines.push(`Product: ${ctx.product} (View: ${ctx.view ?? "default"})`);
  if (ctx.selectedToken) lines.push(`Active Token: ${ctx.selectedToken} (Price: $${ctx.selectedTokenPrice ?? "N/A"})`);
  if (ctx.sellToken || ctx.payToken) lines.push(`Current Sell/Pay Asset: ${ctx.sellToken ?? ctx.payToken}`);
  if (ctx.buyToken || ctx.receiveToken) lines.push(`Current Buy/Receive Asset: ${ctx.buyToken ?? ctx.receiveToken}`);
  if (ctx.amount || ctx.payAmount) lines.push(`Current Input Amount: ${ctx.amount ?? ctx.payAmount}`);
  if (ctx.estReceive) lines.push(`Estimated Output: ${ctx.estReceive}`);
  if (ctx.rate) lines.push(`Exchange Rate: ${ctx.rate}`);
  if (ctx.balances) lines.push(`User Balances: ${JSON.stringify(ctx.balances)}`);
  if (ctx.walletConnected !== undefined) lines.push(`Wallet Connected: ${ctx.walletConnected ? `Yes (${ctx.walletAddress ?? "connected"})` : "No (simulated demo balances: 14.50 SOL, 1,250.00 USDC)"}`);
  if (ctx.availableTokens && Array.isArray(ctx.availableTokens)) {
    lines.push(`Available Tokens on Titan: ${(ctx.availableTokens as Array<{ symbol: string; price: string }>).map((t) => `${t.symbol} (${t.price})`).join(", ")}`);
  }
  lines.push("=========================================");
  return lines.join("\n");
}

function systemPrompt(input: TurnInput) {
  if (isUmbraWeb(input.page)) return umbraWebPrompt(input);
  if (isJupiter(input.page)) return jupiterPrompt(input);
  if (input.page === "umbra" || /\b(umbra|nimbus|shield|unshield|stealth|private send|private transfer|confidential)\b/i.test(input.utterance)) {
    return `You are Milo, a friendly 3D puppy companion guide for Umbra Privacy (Nimbus Protocol on Solana, Simulated Summit Demo).
Speak warmly, faithfully and briefly (1-3 sentences, plain words, no markdown or URLs).
Use umbra_* tools for any guidance, privacy transparency reports, readiness checks, or error diagnoses.
Never say "anonymous", "untraceable", or "100% private". Always state that deposits/withdrawals have public parameters.
Never sign, approve or submit transactions or ask for keys; you only point, the user approves.
Use workflow_id for umbra_register, umbra_deposit, umbra_private_send, umbra_withdraw, umbra_explain_privacy; amounts go in workflow_params.amount.
Page: ${input.page}. Here: ${elementsOnPage(input.page).map((id) => `${id} (${ELEMENTS[id].label})`).join(", ")}
Elsewhere: ${siteMap(input.page)}
Typed fields: ${JSON.stringify(input.fields)}
Always finish with companion_respond.`;
  }

  // Primary: Titan Exchange
  const contextBlock = formatPageContext(input.pageContext);
  return `You are Milo, a friendly 2D pixel husky puppy guiding users through Titan Exchange (titan.exchange on Solana).
Speak in plain, clear English: 1-3 short sentences, no markdown, no URLs, no hype.
${getTitanPromptFragment()}
${contextBlock ? `\n${contextBlock}\n` : ""}
Never sign, approve, or submit transactions; you only guide and point at elements, the user remains in complete control and approves in their own wallet.
If the user is new or asks how Titan works / for a tour, use workflow_id: "titan_tour".
If user wants to swap, use workflow_id: "titan_swap", with workflow_params: { amount, inputToken, outputToken }.
If user wants a limit order, use workflow_id: "titan_limit".
Page: ${input.page}. Here: ${elementsOnPage(input.page).map((id) => `${id} (${ELEMENTS[id].label})`).join(", ")}
Elsewhere: ${siteMap(input.page)}
Typed fields: ${JSON.stringify(input.fields)}
${input.pageText ? `Visible page text (and a screenshot when attached):\n"""${input.pageText}"""` : ""}
Always finish with companion_respond.`;
}

/** An explicit request to go somewhere or do something, as opposed to a question. */
const ACTION_REQUEST = /\b(help me|guide me|walk me through|take me|go to|open|show me how to|i want to|let'?s|swap|trade|buy|sell|place)\b/i;

/**
 * On the docs page a question is answered in place: the pet stays with the article the user is
 * reading instead of starting a walkthrough that navigates away. Explicit actions still can.
 */
export function keepOnDocs(input: Pick<TurnInput, "page" | "utterance">, reply: CompanionReply): CompanionReply {
  if (input.page !== "titan_docs" || ACTION_REQUEST.test(input.utterance) || !reply.workflow) return reply;
  return { ...reply, workflow: undefined, point: { target: "titan-docs-reading-pane" } as CompanionReply["point"] };
}

/** "Deposit 25", "guide me", "show me around": requests that should end in a walkthrough. */
const UMBRA_WANTS_GUIDE = /\b(deposit|send|pay|swap|withdraw|buy|sell|long|short|limit order|open (a |some )?packs?|guide me|walk me|show me (around|how)|tour|i'?m new|get started)\b/i;

/**
 * On Umbra pages an action request always ends in a walkthrough: if the model only talked, the
 * deterministic planner supplies the workflow, and the model's own words are kept.
 */
/** A question or a problem report ("why did my swap fail?") wants an answer, not a walkthrough. */
const ASKS_FOR_ANSWER = /^(why|what|how|when|where|which|who|is|are|does|do|can|could|should|explain|tell me|describe)\b|\?\s*$|\b(fail(ed|s|ing)?|wrong|error|problem|issue|stuck|less than|didn'?t|doesn'?t|not working)\b/i;
const EXPLICIT_GUIDE = /\b(help me|guide me|walk me|show me (around|how to)|let'?s|i want to|take me|tour)\b/i;

async function ensureUmbraGuide(input: TurnInput, reply: CompanionReply): Promise<CompanionReply> {
  if (!seesAndKnows(input.page) || reply.workflow || !UMBRA_WANTS_GUIDE.test(input.utterance)) return reply;
  if (ASKS_FOR_ANSWER.test(input.utterance.trim()) && !EXPLICIT_GUIDE.test(input.utterance)) return reply;
  const planned = await planWithRules(input.utterance, { page: input.page, runTool: callTool, pageState: input.pageContext });
  return planned.workflow ? { ...reply, workflow: planned.workflow, point: undefined } : reply;
}

/**
 * "How does X work / which buttons do I press" on Jupiter: Astro shows it instead of reading a paragraph.
 * One short line of overview, then a pointing tour where it hops to each control with a few words.
 */
const ASKS_HOW = /\b(how (does|do|is|are|can|to)|which buttons?|what buttons?|step by step|button by button|where (do|can) i)\b/i;
function answerOnly(input: TurnInput, reply: CompanionReply): CompanionReply {
  if (!isJupiter(input.page) || !ASKS_HOW.test(input.utterance) || EXPLICIT_GUIDE.test(input.utterance)) return reply;
  if (/\b(perps?|limit|portfolio|liquidat|leverage)\b/i.test(input.utterance)) return { ...reply, workflow: undefined };
  const gacha = /\b(gacha|packs?|cards?|pull)\b/i.test(input.utterance) || (input.page === "jup_gacha" && !/\bswap\b/i.test(input.utterance));
  const id = gacha ? "jup_gacha_howto" : "jup_swap_howto";
  const first = reply.speech.match(/^[^.!?]*[.!?]/)?.[0]?.trim();
  const intro = first && first.length <= 160 ? first : gacha ? "Gacha lets you open packs of real graded cards." : "Jupiter finds you the best swap price on Solana.";
  return { ...reply, speech: `${intro} Watch me, I'll show you the buttons!`, point: undefined, workflow: buildWorkflow(id, {}, input.pageContext ?? {}) };
}

export async function runTurn(input: TurnInput, provider: LlmProvider | null): Promise<CompanionReply> {
  return answerOnly(input, keepOnDocs(input, await ensureUmbraGuide(input, await answerTurn(input, provider))));
}

async function answerTurn(input: TurnInput, provider: LlmProvider | null): Promise<CompanionReply> {
  if (!provider) return planWithRules(input.utterance, { page: input.page, runTool: callTool, pageState: input.pageContext });

  const toolCalls: CompanionReply["toolCalls"] = [];
  try {
    const isUmbra = input.page === "umbra" || /\b(umbra|nimbus|shield|unshield|stealth|private send|private transfer|confidential)\b/i.test(input.utterance);
    // Umbra web answers from the knowledge in its prompt plus what it sees: no tool round-trips.
    const { tools: mcpTools } = seesAndKnows(input.page) ? { tools: [] } : await listTools(isUmbra ? "umbra" : "titan");
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
      userMessage(input),
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
        if (prose) return finalize({ speech: prose }, toolCalls, input.pageContext, input.page);
        if (!nudged) {
          nudged = true;
          continue;
        }
        return finalize({ speech: "Sorry, could you say that again?" }, toolCalls);
      }
      messages.push({ role: "assistant", content: res.content, tool_calls: res.toolCalls });

      for (const call of res.toolCalls) {
        if (call.function.name === "companion_respond") {
          return finalize(safeParseArgs(call.function.arguments), toolCalls, input.pageContext, input.page);
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
    const fallback = await planWithRules(input.utterance, { page: input.page, runTool: callTool, pageState: input.pageContext });
    return { ...fallback, toolCalls: [...toolCalls, ...fallback.toolCalls] };
  }
}

/** Validate + audit everything the model proposed. Invalid parts are dropped, not trusted. */
export function finalize(raw: unknown, toolCalls: CompanionReply["toolCalls"], pageState: Record<string, unknown> = {}, page?: PageId): CompanionReply {
  const parsed = RespondArgs.safeParse(raw);
  if (!parsed.success) {
    const speech = typeof (raw as { speech?: unknown })?.speech === "string" ? (raw as { speech: string }).speech : "Sorry, I got muddled. Could you say that again?";
    return CompanionReplySchema.parse({ speech: speakable(speech).slice(0, 800), toolCalls, engine: "llm" });
  }
  // Explaining a product to a newcomer needs more room than a one-line tip: Jupiter pages get 4 sentences.
  const roomy = page?.startsWith("jup_");
  const a = { ...parsed.data, speech: speakable(parsed.data.speech, roomy ? { maxSentences: 8, maxChars: 640 } : undefined) };
  let workflow = a.workflow_id ? buildWorkflow(a.workflow_id, a.workflow_params ?? {}, pageState) : undefined;

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

  // Only point at something on this page: another product's element can't be found and just errors.
  const point = a.point_target && getElement(a.point_target) && (!page || elementsOnPage(page).includes(a.point_target as never)) ? { target: a.point_target } : undefined;

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
export function speakable(text: string, limits?: { maxSentences: number; maxChars: number }): string {
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
  return (limits ? voiceLength(plain, limits.maxSentences, limits.maxChars) : voiceLength(plain)) || "Sorry, could you say that again?";
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
  const hardCap = Math.max(400, maxChars + 80);
  return out.length > hardCap ? `${out.slice(0, hardCap - 3).replace(/\s+\S*$/, "")}…` : out;
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
  "titan_get_quote",
  "titan_explain_quote",
  "titan_explain_slippage",
  "titan_explain_routing",
  "titan_explain_prime",
  "titan_explain_limit_orders",
  "titan_diagnose_error",
  "titan_get_documentation",
]);
const SITUATIONAL: [RegExp, string[]][] = [
  [/error|fail|wrong|broken|reject|slippage|impact|fee/i, ["titan_diagnose_error", "titan_explain_slippage", "titan_explain_routing"]],
  [/doc|documentation|learn|source|guide|gitbook/i, ["titan_get_documentation"]],
  [/prime|fee|zero fee/i, ["titan_explain_prime"]],
  [/route|dart|argos|split|multi-hop/i, ["titan_explain_routing"]],
  [/limit|order|stop/i, ["titan_explain_limit_orders"]],
];

export function toolIsRelevant(name: string, utterance: string): boolean {
  if (name.startsWith("titan_")) return true;
  if (name.startsWith("umbra_")) return true;
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
