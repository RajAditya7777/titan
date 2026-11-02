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
  pageState?: Record<string, unknown>;
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

/** Umbra web (landing + app): keyword intents onto the same planners the LLM uses. */
function routeUmbraWeb(text: string, ctx: Ctx): Reply {
  const amount = extractNumber(text) ?? undefined;
  const token = /\busdv\b/i.test(text) ? "USDv" : /\busdt\b/i.test(text) ? "USDT" : /\bsol\b/i.test(text) ? "SOL" : "USDC";
  const wf = (id: WorkflowId, speech: string, params: WorkflowParams = {}): Reply => ({ speech, workflow: buildWorkflow(id, { amount, inputToken: token, ...params }, ctx.pageState) });
  if (/\b(deposit|shield|get started|first)\b/i.test(text)) return wf("umbra_web_deposit", "Let's make your first private deposit together. I'll point at each step.");
  if (/\b(send|pay|transfer)\b/i.test(text)) return wf("umbra_web_send", "Let's send privately. I'll show you each step.");
  if (/\bswap|trade|exchange\b/i.test(text)) return wf("umbra_web_swap", "Let's swap inside your private balance.");
  if (/\b(withdraw|cash out|unshield)\b/i.test(text)) return wf("umbra_web_withdraw", "Let's withdraw back to a regular wallet.");
  if (/\b(public|private|see|visible|anonymous|trace)\b/i.test(text))
    return wf("umbra_web_privacy", "Private sends hide the sender, recipient, token and amount. Deposits and withdrawals are visible on chain.");
  if (/\b(earn|yield|usdv|apy|3\.5)\b/i.test(text))
    return { speech: "You can earn up to 3.5 percent with USDv, a fully reserved digital dollar on Solana, while Umbra keeps it private.", point: ctx.page === "umbra_home" ? { target: "umb-feature-earn" } : undefined };
  if (/\b(new|tour|how.*work|what is umbra|show me around)\b/i.test(text)) return wf("umbra_web_tour", "Welcome to Umbra! Let me show you around.");
  return { speech: "I can show you around Umbra, or guide a private deposit, send, swap or withdrawal. What would you like?", needsClarification: true };
}

/** Jupiter: keyword intents onto the same planners the LLM uses. */
function routeJupiter(text: string, ctx: Ctx): Reply {
  const amount = extractNumber(text) ?? undefined;
  const tokens = [...text.matchAll(/\b(sol|usdc|jup|usdt|bonk|jitosol)\b/gi)].map((m) => m[1]!.toUpperCase().replace("JITOSOL", "JitoSOL"));
  const wf = (id: WorkflowId, speech: string, params: WorkflowParams = {}): Reply => ({
    speech,
    workflow: buildWorkflow(id, { amount, inputToken: tokens[0], outputToken: tokens[1], ...params }, ctx.pageState),
  });
  if (/\b(long|short|perp|leverage)\b/i.test(text))
    return wf("jup_perps", "Let's set up that position carefully.", { side: /short/i.test(text) ? "short" : "long", leverage: text.match(/(\d+(?:\.\d+)?)\s*x\b/i)?.[1] });
  if (/\b(limit|target price|when .* reaches)\b/i.test(text)) return wf("jup_limit", "Let's place a limit order together.", { price: text.match(/\$\s*(\d+(?:\.\d+)?)/)?.[1] });
  if (/\b(swap|buy|sell|trade|exchange)\b/i.test(text)) return wf("jup_swap", "Let's do that swap. I'll point at each step.");
  if (/\b(gacha|gotcha|pack|pull|graded|card)\b/i.test(text))
    return /\b(open|buy|try|help me|guide)\b/i.test(text)
      ? wf("jup_gacha", "Let's open a pack together.")
      : { speech: "Gacha sells packs that each pull one real, graded collectible card, paid in USDC. Each pack shows its expected value and odds, and you can sell a pull back at 93 percent within 3 days." };
  if (/\b(portfolio|holdings|net ?worth|airdrop)\b/i.test(text)) return wf("jup_portfolio", "Here's where you track everything.");
  if (/\b(new|tour|how.*work|show me around|what is jupiter)\b/i.test(text)) return wf("jup_tour", "Welcome to Jupiter! Let me show you around.");
  return { speech: "I can show you around Jupiter, or guide a swap, a limit order or a perps position. What would you like?", needsClarification: true };
}

async function route(text: string, ctx: Ctx): Promise<Reply> {
  if (ctx.page.startsWith("jup_")) return routeJupiter(text, ctx);
  if (ctx.page === "umbra_home" || ctx.page === "umbra_app") return routeUmbraWeb(text, ctx);
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
    if (/\breflect\b/i.test(text) && /\b(new|tour|how.*works)\b/i.test(text)) {
      return { speech: "Welcome to Reflect! Let me show you around.", workflow: buildWorkflow("onboarding_tour") };
    }
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
    const r = await ctx.runTool("titan_diagnose_error", { errorMessage: text });
    if (r.ok && r.data?.possibleCause) {
      return { speech: `${r.data.possibleCause} Recommended fix: ${r.data.suggestedAction}` };
    }
    return {
      speech:
        "Let's figure it out. On Solana and Titan, most swap failures happen because of high slippage on volatile tokens, insufficient SOL balance for priority fees, or an expired quote blockhash. Check your slippage in Settings or try increasing priority fee.",
      needsClarification: true,
    };
  }

  if (/\b(dca|dollar cost average|recurring|schedule)\b/i.test(text)) {
    return {
      speech: "Titan DCA lets you split token accumulation over hourly, daily, or weekly intervals with automatic routing. Switch to the DCA tab in Swap to configure it.",
      point: { target: "titan-tab-dca", say: "Here is the DCA schedule selector." },
    };
  }

  if (/\b(slice|twap|chunk|anti-impact)\b/i.test(text)) {
    return {
      speech: "Titan Slice executes large orders across multiple randomized micro-blocks to minimize price impact and avoid sandwich attacks. Switch to the Slice tab in Swap to try it.",
      point: { target: "titan-tab-slice", say: "Here is the Slice execution mode." },
    };
  }

  if (/\b(chart|candlestick|timeframe|indicator|tradingview)\b/i.test(text)) {
    return {
      speech: "Titan Pro Terminal features a live TradingView candlestick chart with 1m to 1h timeframes and technical indicators. Click the Pro tab to view it.",
      point: { target: "titan-nav-pro", say: "Here is the Pro terminal." },
    };
  }

  // Support legacy demo utterances if tested on dashboard/mint pages
  if (/\b(where|how)\b.*\bredeem\b|\bshow me (where|how).*redeem/i.test(text)) {
    return { speech: "Redeem lives right here.", point: { target: "nav-redeem", say: "Redeem lives right here." } };
  }
  if (/\b(mint|deposit|buy|get) (some )?(usdc\+|usdc plus)|\bmint\b/i.test(text) && !ctx.page.startsWith("titan_")) {
    const amt = extractAmount(text);
    let speech = amt ? `Absolutely! Let's mint ${amt} USDC+.` : "Absolutely! I'll guide you through minting.";
    if (amt) {
      const q = await ctx.runTool("reflect_get_mint_quote", { amount: amt });
      if (q.ok) speech += ` Right now that's about ${fmt(q.data?.expectedOutput?.amount)} USDC+.`;
    }
    return { speech, workflow: buildWorkflow("mint", { amount: amt }) };
  }
  if (/\b(create (a |my )?(own )?yieldcoin|white ?label)\b/i.test(text)) {
    return { speech: "Let's build your own yieldcoin.", workflow: buildWorkflow("create_whitelabel", { tokenName: "Acme Dollar", tokenSymbol: "ACMEUSD" }) };
  }
  if (/\b(what is apy|explain apy)\b/i.test(text)) {
    return { speech: "Let me explain APY.", workflow: buildWorkflow("explain_apy") };
  }
  if (/\breflect\b/i.test(text)) {
    return { speech: "Welcome to Reflect!", workflow: buildWorkflow("onboarding_tour") };
  }

  if (/\b(new|first time|what can i do|how (does )?titan work|what (is|does) titan|show me around|tour|get started|onboard)\b/i.test(text)) {
    return {
      speech:
        "Welcome! Titan Exchange is Solana's algorithmic DEX aggregator. We route trades across Raydium, Orca, Meteora, and Phoenix with 0% protocol fees on Prime. Let's start with a tour.",
      workflow: buildWorkflow("titan_tour"),
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
