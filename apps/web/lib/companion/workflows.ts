import type { Step, Workflow } from "./actions";
import { validate } from "./registry";
import { UMBRA_GOALS } from "@/lib/products/umbra/planner";
import { getUmbraAppState } from "@/lib/products/umbra/state";
import { planTitanGoal } from "@/lib/products/titan/planner";

/**
 * Hand-authored workflows for the core journeys. The LLM picks one of these and fills its
 * parameters (deterministic, reviewed, safe) instead of free-writing money-moving flows.
 * It can still compose short ad-hoc tours from the same step schema for everything else.
 */

export const WORKFLOW_IDS = [
  "onboarding_tour",
  "mint",
  "redeem",
  "create_whitelabel",
  "explain_apy",
  "titan_swap",
  "titan_limit",
  "umbra_register",
  "umbra_deposit",
  "umbra_private_send",
  "umbra_withdraw",
  "umbra_explain_privacy",
] as const;
export type WorkflowId = (typeof WORKFLOW_IDS)[number];

export interface WorkflowParams {
  amount?: string;
  tokenName?: string;
  tokenSymbol?: string;
}

export function buildWorkflow(id: WorkflowId, params: WorkflowParams = {}): Workflow {
  switch (id) {
    case "onboarding_tour":
      return {
        id,
        title: "Welcome tour",
        steps: [
          { type: "navigate_to_page", page: "dashboard" },
          { type: "point", target: "dashboard-stablecoins", say: "These are Reflect's stablecoins. They're digital dollars that earn yield while they sit in your wallet." },
          { type: "point", target: "dashboard-apy", say: "This is the live APY: the yearly yield. It's real data from Reflect, and it moves with Solana lending rates." },
          { type: "point", target: "dashboard-mint", say: "Minting is how you get in. You deposit USDC and receive USDC+, which grows in value on its own." },
          { type: "point", target: "dashboard-redeem", say: "Redeeming is how you get out, any time, back to USDC plus the yield you earned." },
          { type: "navigate_to_page", page: "stablecoin", say: "Let's look closer at USDC+." },
          { type: "call_tool", tool: "reflect_get_stablecoin_overview", args: { asset: "USDC+" }, target: "stablecoin-rate", say: "Right now one USDC+ is worth {{result.stablecoins.0.exchangeRate.usdPerToken}} dollars. That number only climbs as yield accrues." },
          { type: "point", target: "stablecoin-how", say: "Behind the scenes, your USDC is lent across Solana money markets to over-collateralised borrowers. That interest is your yield." },
          { type: "point", target: "stablecoin-risks", say: "And here are the risks, stated plainly. Yield isn't guaranteed. Insurance covers principal only." },
          { type: "celebrate", say: "That's Reflect in a nutshell! Say 'help me mint' whenever you'd like to try it." },
        ],
      };

    case "mint": {
      const amount = params.amount;
      return {
        id,
        title: amount ? `Mint ${amount} USDC+` : "Mint USDC+",
        steps: [
          { type: "navigate_to_page", page: "mint", say: "Let's open the Mint page." },
          { type: "point", target: "mint-asset", say: "USDC+ is already selected. It's backed by USDC." },
          {
            type: "request_input",
            target: "mint-amount",
            say: amount
              ? `Enter ${amount} here. That's how much USDC you'll deposit. Or say 'yes' and I'll fill it in for you.`
              : "Enter how much USDC you'd like to deposit.",
            ...(amount ? { suggestedValue: amount } : {}),
          },
          {
            type: "call_tool",
            tool: "reflect_get_mint_quote",
            args: { asset: "USDC+", amount: "{{field:mint-amount}}" },
            target: "mint-quote",
            say: "Live quote from Reflect: {{result.input.amount}} USDC gets you {{result.expectedOutput.amount}} USDC+. You get fewer tokens because each one is already worth about {{result.impliedRate.value}} dollars.",
          },
          { type: "point", target: "mint-fees", say: "No protocol fee. Just a tiny Solana network fee." },
          { type: "wait_for_user_action", target: "mint-review", say: "When you're ready, press Review mint. I won't press it for you." },
          { type: "stop_before_signing", target: "mint-sign", say: "This is where your wallet takes over. Check the details, then approve it in your wallet. Only you can sign, and I never will." },
        ],
      };
    }

    case "redeem": {
      const amount = params.amount;
      return {
        id,
        title: amount ? `Redeem ${amount} USDC+` : "Redeem USDC+",
        steps: [
          { type: "navigate_to_page", page: "redeem", say: "Here's where you redeem." },
          {
            type: "request_input",
            target: "redeem-amount",
            say: amount ? `Enter ${amount} USDC+, or say 'yes' and I'll fill it in.` : "Enter how much USDC+ to redeem.",
            ...(amount ? { suggestedValue: amount } : {}),
          },
          {
            type: "call_tool",
            tool: "reflect_get_redeem_quote",
            args: { asset: "USDC+", amount: "{{field:redeem-amount}}" },
            target: "redeem-quote",
            say: "You'd receive {{result.expectedOutput.amount}} USDC: more than you put in, thanks to the yield.",
          },
          { type: "point", target: "redeem-freshness", say: "Quotes refresh constantly. The transaction locks in a minimum, so you're protected if the rate moves." },
          { type: "wait_for_user_action", target: "redeem-review", say: "Press Review redeem when you're ready." },
          { type: "stop_before_signing", target: "redeem-sign", say: "Now approve it in your wallet. That step is always yours." },
        ],
      };
    }

    case "create_whitelabel": {
      // Always offer a name and ticker, whichever brain built the plan (the LLM often omits
      // them), so "yes" has something to confirm. The ticker follows the name when only a name is
      // given, and only valid suggestions are offered.
      const tokenName = params.tokenName?.trim() && validate("token-name", params.tokenName.trim()) === null ? params.tokenName.trim() : "Acme Dollar";
      const derived = tickerFromName(tokenName);
      const tokenSymbol =
        params.tokenSymbol && validate("token-symbol", params.tokenSymbol.toUpperCase()) === null ? params.tokenSymbol.toUpperCase() : derived;
      params = { ...params, tokenName, tokenSymbol };
      return {
        id,
        title: "Create your yieldcoin",
        steps: [
          { type: "navigate_to_page", page: "whitelabel", say: "Let's design your own yieldcoin." },
          {
            type: "request_input",
            target: "wl-name",
            say: params.tokenName
              ? `First, a name. How about '${params.tokenName}'? Type your own, or say 'yes' to use it.`
              : "First, give it a name, like 'Acme Dollar'.",
            ...(params.tokenName ? { suggestedValue: params.tokenName } : {}),
          },
          {
            type: "request_input",
            target: "wl-symbol",
            say: params.tokenSymbol
              ? `Now a ticker. '${params.tokenSymbol}' fits. Say 'yes' or type another.`
              : "Now a short ticker, 2 to 8 capital letters.",
            ...(params.tokenSymbol ? { suggestedValue: params.tokenSymbol } : {}),
          },
          {
            type: "call_tool",
            tool: "reflect_get_whitelabel_options",
            args: {},
            target: "wl-collateral",
            say: "This is the collateral your coin wraps. Its yield becomes your users' yield. {{result.underlyings.0.name}} is earning about {{result.underlyings.0.apyPercent}} percent right now.",
          },
          { type: "request_input", target: "wl-fee", say: "Set your fee in basis points. 100 is 1 percent of yield. 50 is a common start.", suggestedValue: "50" },
          { type: "point", target: "wl-summary", say: "Here's your configuration. Everything is validated." },
          { type: "stop_before_signing", target: "wl-deploy", say: "Deploying creates real on-chain accounts, so it's disabled in this demo. With Reflect's whitelabel API, your wallet would sign this final step." },
        ],
      };
    }

    case "explain_apy":
      return {
        id,
        title: "What is APY?",
        steps: [
          { type: "navigate_to_page", page: "stablecoin" },
          { type: "call_tool", tool: "reflect_get_stablecoin_overview", args: { asset: "USDC+" }, target: "stablecoin-apy", say: "APY is annual percentage yield. USDC+ is at {{result.stablecoins.0.apy.percent}} percent right now, so $1,000 held for a year at this rate would earn about ten times that in dollars." },
          { type: "point", target: "stablecoin-rate", say: "You see it here: the exchange rate rises as yield accrues. No claiming needed." },
        ],
      };

    case "titan_swap":
      return planTitanGoal("swap", {
        amount: params.amount,
        outputToken: params.tokenSymbol,
      });

    case "titan_limit":
      return planTitanGoal("limit_order", {
        amount: params.amount,
      });

    case "umbra_register": {
      const wf = UMBRA_GOALS.register!({ slots: {}, state: getUmbraAppState() });
      return { id, title: wf.title, steps: wf.steps as Step[] };
    }
    case "umbra_deposit": {
      const wf = UMBRA_GOALS.deposit!({ slots: { amount: params.amount ?? "100" }, state: getUmbraAppState() });
      return { id, title: wf.title, steps: wf.steps as Step[] };
    }
    case "umbra_private_send": {
      const wf = UMBRA_GOALS.private_send!({ slots: { amount: params.amount ?? "50" }, state: getUmbraAppState() });
      return { id, title: wf.title, steps: wf.steps as Step[] };
    }
    case "umbra_withdraw": {
      const wf = UMBRA_GOALS.withdraw!({ slots: { amount: params.amount ?? "25" }, state: getUmbraAppState() });
      return { id, title: wf.title, steps: wf.steps as Step[] };
    }
    case "umbra_explain_privacy": {
      const wf = UMBRA_GOALS.explain_privacy!({ slots: {}, state: getUmbraAppState() });
      return { id, title: wf.title, steps: wf.steps as Step[] };
    }
  }
}

/** "Acme Dollar" → "ACMEUSD"; always a valid ticker (2–8 chars, starts with a letter). */
export function tickerFromName(name: string): string {
  // Tickers read best from the first word ("Acme Dollar" → ACME…); fall back to all letters if it's tiny.
  const first = (name.trim().split(/\s+/)[0] ?? "").replace(/[^a-z0-9]/gi, "");
  const letters = (first.length >= 2 ? first : name.replace(/[^a-z0-9]/gi, "")).toUpperCase();
  const stem = /^[A-Z]/.test(letters) ? letters.slice(0, 5) : `X${letters.slice(0, 4)}`;
  return `${stem}USD`.slice(0, 8);
}
