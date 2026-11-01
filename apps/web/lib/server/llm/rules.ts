import { buildWorkflow, type WorkflowParams } from "@/lib/companion/workflows";
import { ELEMENTS, ELEMENT_IDS, PAGES, elementsOnPage, type ElementId, type PageId } from "@/lib/companion/registry";
import { extractNumber, normalise } from "@/lib/companion/commands";
import type { CompanionReply } from "@/lib/companion/actions";

/**
 * Offline intent planner. Runs when no LLM is configured, or when the LLM call fails, so the
 * companion degrades to "less clever" rather than "broken". It speaks the same reply contract
 * as the LLM path, which keeps the browser side oblivious to which brain answered.
 */

export type ToolRunner = (tool: string, args: Record<string, unknown>) => Promise<{ ok: boolean; data: any; ms: number; tool: string }>;

interface Ctx {
  page: PageId;
  runTool: ToolRunner;
}

type Reply = Omit<CompanionReply, "engine" | "toolCalls" | "needsClarification"> & { needsClarification?: boolean };

export async function planWithRules(utterance: string, ctx: Ctx): Promise<CompanionReply> {
  const calls: CompanionReply["toolCalls"] = [];
  const run: ToolRunner = async (tool, args) => {
    const r = await ctx.runTool(tool, args);
    calls.push({ tool, ok: r.ok, provenance: r.data?.provenance, ms: r.ms });
    return r;
  };
  const reply = await route(normalise(utterance), { ...ctx, runTool: run });
  return { ...reply, needsClarification: reply.needsClarification ?? false, toolCalls: calls, engine: "rules" };
}

async function route(text: string, ctx: Ctx): Promise<Reply> {
  const amount = extractAmount(text);

  if (/\b(error|fail(ed|ing|s)?|not working|broken|rejected|won'?t go through)\b/.test(text)) {
    const message = text.replace(/^.*?(error|failed|failing|says?)[: ]*/, "");
    if (message.length > 8) {
      const r = await ctx.runTool("reflect_explain_error", { message });
      const m = r.data?.matches?.[0];
      if (m) return { speech: `${m.title}. ${m.explanation} Fix: ${m.fix[0]}` };
    }
    return {
      speech:
        "Let's figure it out. Most failures come from four things: the wallet isn't whitelisted during the closed beta, the price moved past your minimum, the quote expired, or there's not enough SOL for fees. Read me the exact error message and I'll pinpoint it.",
      needsClarification: true,
    };
  }

  if (/\b(white ?label|yield ?coin|my own (coin|token|stablecoin)|branded|create (a |my )?(coin|token|stablecoin))\b/.test(text)) {
    const named = /\bcalled ([a-z0-9 ]{2,24})$/.exec(text)?.[1]?.trim();
    const params: WorkflowParams = named
      ? { tokenName: titleCase(named), tokenSymbol: tickerFrom(named) }
      : { tokenName: "Acme Dollar", tokenSymbol: "ACMEUSD" };
    return {
      speech: "Love it. Let's build your own yieldcoin, step by step. I'll explain each field as we go.",
      workflow: buildWorkflow("create_whitelabel", params),
    };
  }

  if (/\b(where|how)\b.*\bredeem\b|\bshow me (where|how).*redeem/.test(text)) {
    return { speech: "Redeem lives right here in the sidebar.", point: { target: "nav-redeem", say: "Redeem lives right here. Click it whenever you want USDC back." } };
  }

  if (/\bredeem|withdraw|cash out\b/.test(text)) {
    return {
      speech: amount ? `Sure. Let's redeem ${amount} USDC+.` : "Sure. Let's redeem.",
      workflow: buildWorkflow("redeem", { amount }),
    };
  }

  if (/\b(mint|deposit|buy|get) (some )?(usdc\+|usdc plus|usdc|reflect)|\bmint\b/.test(text)) {
    let speech = amount ? `Absolutely! Let's mint ${amount} USDC+.` : "Absolutely! I'll guide you through minting.";
    if (amount) {
      const q = await ctx.runTool("reflect_get_mint_quote", { amount });
      if (q.ok) speech += ` Right now that's about ${fmt(q.data.expectedOutput.amount)} USDC+.`;
    }
    return { speech: `${speech} Let's open the Mint section first.`, workflow: buildWorkflow("mint", { amount }) };
  }

  if (/\bapy\b|\byield\b.*\b(mean|what)|what is (the )?(yield|interest)|\binterest rate\b/.test(text)) {
    return { speech: "Good question. Let me show you on the USDC+ page.", workflow: buildWorkflow("explain_apy") };
  }

  if (/\bcompare|difference between|which stablecoin|supported (stable)?coins\b/.test(text)) {
    const r = await ctx.runTool("reflect_get_stablecoin_overview", {});
    if (!r.ok) return errorReply(r.data);
    const parts = (r.data.stablecoins as any[]).map(
      (c) => `${c.symbol}, backed by ${c.underlying}, earning ${c.apy ? `${c.apy.percent}%` : "an unreported APY"} with 1 token worth $${c.exchangeRate?.usdPerToken ?? "?"}`,
    );
    return {
      speech: `Reflect has ${parts.length} stablecoins live in the API: ${parts.join("; and ")}. Both grow in value against the dollar, so there's nothing to claim.`,
      point: { target: "nav-stablecoin" },
    };
  }

  if (/\b(stats|statistics|how big|how many (users|holders)|tvl|volume)\b/.test(text)) {
    const r = await ctx.runTool("reflect_get_protocol_stats", {});
    if (!r.ok) return errorReply(r.data);
    return {
      speech: `Reflect has ${fmt(r.data.holders)} holders, ${fmt(r.data.totalSupply)} tokens in supply, and has distributed ${fmt(r.data.totalYieldDistributed)} dollars of yield so far.`,
      point: { target: "nav-stats" },
    };
  }

  if (/\b(new|first time|what can i do|how (does )?reflect work|what (is|does) reflect|show me around|tour|get started|onboard)\b/.test(text)) {
    return {
      speech:
        "Welcome! Reflect turns plain dollars like USDC into stablecoins that earn yield automatically. No staking, no claiming. Let me show you around.",
      workflow: buildWorkflow("onboarding_tour"),
    };
  }

  if (/\b(explain|what('?s| is)) (this|the) page\b|\bwhere am i\b|\bexplain this\b/.test(text)) {
    const page = PAGES[ctx.page];
    const first = elementsOnPage(ctx.page).find((id) => ELEMENTS[id].page === ctx.page);
    return {
      speech: `You're on ${page.title}. ${page.summary}`,
      ...(first ? { point: { target: first, say: ELEMENTS[first].description } } : {}),
    };
  }

  const target = findElementMention(text, ctx.page);
  if (target) {
    return { speech: ELEMENTS[target].description, point: { target, say: ELEMENTS[target].description } };
  }

  return {
    speech:
      "I can show you around, help you mint or redeem, explain APY, compare stablecoins, or set up your own yieldcoin. What would you like?",
    needsClarification: true,
  };
}

function errorReply(data: any): Reply {
  return { speech: `I couldn't reach Reflect just now: ${data?.error?.message ?? "unknown error"}. Want me to try again?`, needsClarification: true };
}

function extractAmount(text: string): string | undefined {
  const n = extractNumber(text);
  return n && Number(n) > 0 ? n : undefined;
}

/** "where is the fee field" → wl-fee. Prefers elements on the current page. */
function findElementMention(text: string, page: PageId): ElementId | null {
  if (!/\b(where|which|show|point|find)\b/.test(text)) return null;
  const scored = ELEMENT_IDS.map((id) => {
    const el = ELEMENTS[id];
    const label = el.label.toLowerCase();
    let score = text.includes(label) ? 3 : label.split(" ").filter((w) => w.length > 2 && text.includes(w)).length;
    if (score && el.page === page) score += 2;
    return { id, score };
  }).filter((s) => s.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

const fmt = (n: number) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const tickerFrom = (s: string) => (s.replace(/[^a-z]/gi, "").slice(0, 5).toUpperCase() || "MY") + "USD";
