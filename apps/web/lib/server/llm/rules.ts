import { buildWorkflow, type WorkflowId, type WorkflowParams } from "@/lib/companion/workflows";
import { ELEMENTS, ELEMENT_IDS, PAGES, elementsOnPage, type ElementId, type PageId } from "@/lib/companion/registry";
import { extractNumber, normalise } from "@/lib/companion/commands";
import type { CompanionReply } from "@/lib/companion/actions";
import { matchUmbraRules } from "@/lib/products/umbra/rules";
import { getUmbraAppState } from "@/lib/products/umbra/state";
import { matchFaqTopic, type FaqTopic } from "@companion/titan-mcp";
import { TITAN_GITBOOK_DOCS } from "@/lib/products/titan/gitbook-content";

/** Where the pet points while answering each common question (all tagged on the swap page). */
const FAQ_POINT: Partial<Record<FaqTopic, ElementId>> = {
  different: "titan-rate-display",
  getting_started: "titan-connect-wallet",
  fees: "titan-prime-toggle",
  fewer_tokens: "titan-rate-display",
  swap_failed: "titan-refresh-quote",
  sandwich: "titan-prime-toggle",
  prime_vs_manual: "titan-prime-toggle",
  dart: "titan-dart-selector",
  slippage: "titan-settings-toggle",
  limit_orders: "titan-nav-limit",
};
const NEW_USER = /\b(i'?m new|new here|new to titan|first time|show me (how titan works|around)|how does titan work|tour)\b/i;
const WANTS_ACTION = /\b(help me|guide me|walk me through|i want to|let'?s|can you|show me how to)\b|\d/i;

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

function matchDocsQuestion(text: string): { speech: string; sectionId: string } | null {
  const t = text.toLowerCase().trim();
  for (const [key, section] of Object.entries(TITAN_GITBOOK_DOCS)) {
    for (const q of section.suggestedQuestions) {
      if (t.includes(q.toLowerCase()) || q.toLowerCase().includes(t)) {
        return {
          speech: `${section.summary} ${section.content.overview.slice(0, 240)}...`,
          sectionId: key,
        };
      }
    }
  }
  if (/\b(argos|convex optimization|continuous optimization)\b/i.test(t)) {
    const s = TITAN_GITBOOK_DOCS["argos-algorithm"];
    if (s) return { speech: `${s.summary} ${s.content.overview}`, sectionId: "argos-algorithm" };
  }
  if (/\b(dart|dynamic automated routing|dynamic allocation)\b/i.test(t)) {
    const s = TITAN_GITBOOK_DOCS["dart-routing"];
    if (s) return { speech: `${s.summary} ${s.content.overview}`, sectionId: "dart-routing" };
  }
  if (/\b(api|rest api|quote endpoint|swap endpoint)\b/i.test(t)) {
    const s = TITAN_GITBOOK_DOCS["api-overview"];
    if (s) return { speech: `${s.summary} ${s.content.overview}`, sectionId: "api-overview" };
  }
  if (/\b(sdk|typescript sdk|npm install)\b/i.test(t)) {
    const s = TITAN_GITBOOK_DOCS["sdk"];
    if (s) return { speech: `${s.summary} ${s.content.overview}`, sectionId: "sdk" };
  }
  if (/\b(private swap|nozomi|mev protection|sandwich protection)\b/i.test(t)) {
    const s = TITAN_GITBOOK_DOCS["private-swaps"];
    if (s) return { speech: `${s.summary} ${s.content.overview}`, sectionId: "private-swaps" };
  }
  if (/\b(gitbook|documentation|docs|guide)\b/i.test(t)) {
    const s = TITAN_GITBOOK_DOCS["welcome"];
    if (s) return { speech: `${s.summary} You can explore all Titan documentation, Argos math, and developer APIs in the GitBook docs tab.`, sectionId: "welcome" };
  }
  return null;
}

async function route(text: string, ctx: Ctx): Promise<Reply> {
  // 1. Umbra / Nimbus Routing
  if (ctx.page === "umbra" || /\b(umbra|nimbus|shield|unshield|stealth|private send|private transfer|confidential)\b/i.test(text)) {
    const umbraMatch = matchUmbraRules(text, getUmbraAppState());
    if (umbraMatch) {
      if (umbraMatch.goal) {
        const wfId = `umbra_${umbraMatch.goal}` as WorkflowId;
        return {
          speech: umbraMatch.speech,
          workflow: buildWorkflow(wfId, { amount: umbraMatch.slots.amount }),
        };
      }
      return {
        speech: umbraMatch.speech,
      };
    }
  }

  // 2. Titan Routing (Primary)
  if (
    ctx.page.startsWith("titan_") ||
    ctx.page === "home" ||
    /\b(titan|swap|trade|buy|sell|quote|slippage|price impact|dart|argos|prime|limit order|conditional order)\b/i.test(text)
  ) {
    // A new user gets the real first-swap walkthrough.
    if (NEW_USER.test(text)) {
      return { speech: "Welcome! I'll walk you through a first swap on Titan, step by step.", workflow: buildWorkflow("titan_tour") };
    }
    // "Help me swap 1 SOL" / "help me place a limit order" are actions, not questions.
    if (WANTS_ACTION.test(text) && /\blimit\b/i.test(text)) {
      return { speech: "Let's set up a limit order together.", workflow: buildWorkflow("titan_limit") };
    }
    if (WANTS_ACTION.test(text) && /\b(swap|trade|exchange|convert|buy|sell)\b/i.test(text)) {
      const amt = extractAmount(text);
      return {
        speech: amt ? `I'll guide you through swapping ${amt}.` : "I'll guide you through a swap on Titan.",
        workflow: buildWorkflow("titan_swap", { amount: amt }),
      };
    }
    // The questions new users ask most, answered from verified docs (titan_faq).
    const topic = matchFaqTopic(text);
    if (topic) {
      const r = await ctx.runTool("titan_faq", { topic });
      if (r.ok && r.data?.answer) {
        const target = FAQ_POINT[topic];
        return target && ctx.page === "titan_swap" ? { speech: r.data.answer, point: { target, say: r.data.answer } } : { speech: r.data.answer };
      }
    }

    if (/\b(slippage|price impact)\b/i.test(text)) {
      const r = await ctx.runTool("titan_explain_slippage", { tokenType: "volatile" });
      const speech = r.ok && r.data?.explanation
        ? r.data.explanation
        : "Slippage is the difference between expected quote and final execution price. Titan separates base volatile tokens from stable/LST pairs.";
      return { speech, point: { target: "titan-settings-toggle", say: "You can adjust slippage tolerance here." } };
    }

    if (/\b(dart|argos|route|routing)\b/i.test(text)) {
      const r = await ctx.runTool("titan_explain_routing", { dartMode: "Auto" });
      const speech = r.ok && r.data?.summary
        ? r.data.summary
        : "Argos optimizes multi-hop routes off-chain, while DART rebalances split allocations on-chain to minimize price impact.";
      return { speech, point: { target: "titan-dart-selector", say: "DART is set to Auto for dynamic execution." } };
    }

    if (/\b(prime|fee|zero fee)\b/i.test(text)) {
      const r = await ctx.runTool("titan_explain_prime", {});
      const speech = r.ok && r.data?.summary
        ? r.data.summary
        : "Titan Prime gives you 0% protocol fees and auto sandwich protection via Jito bundles.";
      return { speech, point: { target: "titan-prime-toggle", say: "Prime mode is active with zero protocol fees." } };
    }

    if (/\b(limit|limit order|orderbook)\b/i.test(text)) {
      return {
        speech: "Titan supports on-chain limit orders with a $10 minimum notional and partial fills. Let's look at limit orders.",
        workflow: buildWorkflow("titan_limit"),
      };
    }

    if (/\b(swap|trade|exchange|buy|sell)\b/i.test(text)) {
      const amt = extractAmount(text);
      return {
        speech: amt
          ? `I'll guide you through swapping ${amt}. Let's enter the amount and inspect the route.`
          : "I'll guide you through swapping on Titan. Let's enter the amount and inspect the route.",
        workflow: buildWorkflow("titan_swap", { amount: amt }),
      };
    }

    if (/\b(error|fail|failing|failed|issue|problem)\b/i.test(text)) {
      const r = await ctx.runTool("titan_diagnose_error", { errorMessage: text });
      if (r.ok && r.data?.possibleCause) {
        return { speech: `${r.data.possibleCause} Recommended fix: ${r.data.suggestedAction}` };
      }
    }

    // GitBook Documentation & Technical Knowledge
    const docAnswer = matchDocsQuestion(text);
    if (docAnswer) {
      const isDocsPage = ctx.page === "titan_docs" || ctx.page === "titan_learn";
      return isDocsPage
        ? { speech: docAnswer.speech, point: { target: "titan-docs-reading-pane", say: "Here is the documentation breakdown." } }
        : { speech: docAnswer.speech };
    }
  }

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
      "I'm Milo, your guide for Titan Exchange on Solana. I can walk you through token swaps, DART routing, Prime mode, slippage, and limit orders. What would you like to explore?",
    needsClarification: true,
  };
}

function errorReply(data: any): Reply {
  return { speech: `I couldn't reach Titan just now: ${data?.error?.message ?? "unknown error"}. Want me to try again?`, needsClarification: true };
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
