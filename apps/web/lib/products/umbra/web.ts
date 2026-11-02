import type { Step } from "@/lib/companion/actions";

/**
 * Umbra web (the umbraprivacy.com landing page and the v2 app): what the companion knows,
 * the app state the page reports, and deterministic planners for the guided flows (D-004).
 * Balances and accounts are simulated in the browser; nothing touches a real wallet (D-008).
 */

export const UMBRA_WEB_TOKENS = ["SOL", "USDC", "USDT", "USDv"] as const;
export type UmbraWebToken = (typeof UMBRA_WEB_TOKENS)[number];
export type UmbraWebTab = "deposit" | "send" | "swap" | "withdraw";

/** What the app page reports on every turn. Never keys or signatures (D-005). */
export interface UmbraWebState {
  product: "umbra_web";
  tab: UmbraWebTab;
  connected: boolean;
  registered: boolean;
  amount: string;
  token: string;
  walletBalances: Record<string, number>;
  privateBalances: Record<string, number>;
  lastAction?: string;
}

export const DEMO_RECIPIENT = "7fRq2xN4mKcV9pLw3sTz8bYh6dJa1eUo5gQi4HnBvC2m";
export const DEMO_DESTINATION = "Fz3pW8vK1cR6nT2qLm9xYs4hB7dJe5aUo3gQi8NbVt6k";

export const UMBRA_WEB_SUGGESTIONS = [
  "I'm new. Show me how Umbra works",
  "Help me deposit 25 USDC privately",
  "What's private and what's public?",
  "Look at my screen and explain it",
  "Send 10 USDC privately to a friend",
  "How do I earn 3.5% on USDv?",
  "Does the person I'm paying need Umbra?",
];

/** The facts the model answers from. Taken from umbraprivacy.com and its FAQ, in plain words. */
export const UMBRA_KNOWLEDGE = `UMBRA FACTS (from umbraprivacy.com and docs.umbraprivacy.com):
- Tagline: "The Privacy Layer for your Money". Privacy for your transactions, ownership of your assets.
- Four actions: Deposit (wallet to private balance), Send (private transfer to a registered Umbra user), Swap (exchange inside the private balance), Withdraw (private balance back to a public Solana address).
- Hold privately: holdings stay out of public view; you keep ownership and control.
- Earn privately: up to 3.5% yield with USDv, a fully reserved digital dollar on Solana.
- Send privately: through private pools on Solana, including Privacy Cash; Helius support coming soon.
- Swap privately: trade amounts and activity stay out of public view.
- Compliance: (1) Perimeter Screening of public wallets with providers such as Range and Cipherowl before assets enter or leave; (2) Registered Recipients: every private transfer goes to a registered address meeting KYP requirements; (3) Granular Self Disclosure by time, mint, duration and address; (4) Self Custody: your keys authorize access.
- Nimbus is the privacy network under Umbra (SDK coming soon): private payments, self-custody built in, one integration, everything in Umbra (Deposit, Private Send, Private Swap, Withdraw). Use cases: payments, cross-border, tokenised stocks, strategic deals, wallets, treasury, DeFi apps, merchant checkout.
- What is private: private transfers hide sender, recipient, token and amount from Solana observers. Deposits still show the wallet, token and amount going in. Withdrawals show the receiving address, token and amount coming out, but not which private balance paid.
- Balance: not shown on chain; your device works it out from encrypted records. Services that process transactions can learn parts of your activity.
- No new wallet needed: use your existing Solana wallet; registration sets up the keys. No separate receiving address.
- Paying someone without Umbra: withdraw to their address instead, but that withdrawal is public.
- Limits: deposits, withdrawals, timing and linked addresses can reveal patterns; relayers may see your IP. Withdrawing to an address linked to you can reveal the connection. Never call it untraceable or 100% anonymous.
- Custody: non-custodial. Only your wallet holds the keys. Losing the wallet may mean losing access; Umbra cannot recover it.
- Fees: a protocol fee plus a tip for the relayer that submits. The relayer can pay the network fee for a private transfer, but registration and deposits may need SOL in your wallet.
- Networks/tokens: Solana; SOL and approved Solana tokens. No direct bank deposits.
- Governance on MetaDAO. Live stats at stats.umbraprivacy.com.`;

const n = (v: string | undefined, d: number) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : d;
};

export function normalizeToken(t: string | undefined, fallback: UmbraWebToken = "USDC"): UmbraWebToken {
  const hit = UMBRA_WEB_TOKENS.find((k) => k.toLowerCase() === (t ?? "").trim().toLowerCase());
  return hit ?? fallback;
}

/** Steps that bring a new visitor to a connected, registered account. Skipped when already done. */
function accountSteps(state: Partial<UmbraWebState>): Step[] {
  const steps: Step[] = [];
  if (!state.connected) {
    steps.push(
      { type: "wait_for_user_action", target: "umb-create-account", say: "First, create an account. Tap Create an account; Umbra uses the Solana wallet you already have." },
      { type: "wait_for_user_action", target: "umb-wallet-connect", say: "This is a demo wallet, so no real funds are involved. Tap Connect." },
    );
  }
  if (!state.registered) {
    steps.push(
      { type: "wait_for_user_action", target: "umb-register", say: "Now register your private account. It sets up your private keys on this device." },
      { type: "wait_for_user_action", target: "umb-approve", say: "Your wallet signs this, I never do. Tap Approve in wallet." },
    );
  }
  return steps;
}

function tabStep(state: Partial<UmbraWebState>, tab: UmbraWebTab, say: string): Step[] {
  const target = `umb-tab-${tab}` as const;
  return state.tab === tab ? [{ type: "point", target, say }] : [{ type: "wait_for_user_action", target, say: `${say} Tap ${tab[0]!.toUpperCase()}${tab.slice(1)}.` }];
}

export type UmbraWebGoal = "tour" | "deposit" | "send" | "swap" | "withdraw" | "privacy";

export function planUmbraWeb(goal: UmbraWebGoal, params: Record<string, string | undefined>, state: Partial<UmbraWebState> = {}): { title: string; steps: Step[] } {
  const amount = String(n(params.amount, goal === "send" ? 10 : 25));
  const token = normalizeToken(params.inputToken ?? params.token);
  const priv = state.privateBalances?.[token] ?? 0;

  switch (goal) {
    case "tour":
      return {
        title: "Tour of Umbra",
        steps: [
          { type: "navigate_to_page", page: "umbra_home" },
          { type: "point", target: "umb-hero", say: "Umbra is the privacy layer for your money on Solana. You keep your own wallet; your activity stays out of public view." },
          { type: "point", target: "umb-hero-widget", say: "Everything happens here: deposit into a private balance, then send, swap or withdraw." },
          { type: "point", target: "umb-features", say: "Four ways to use it: swap, hold, earn up to 3.5 percent on USDv, and send privately." },
          { type: "point", target: "umb-compliance", say: "Privacy with compliance built in: screening at the edges, registered recipients, and you choose what to disclose." },
          { type: "point", target: "umb-nimbus", say: "Builders get the same engine through Nimbus, the privacy network under Umbra." },
          { type: "point", target: "umb-faq", say: "And plain answers to the big questions live here. Want to try a private deposit next?" },
        ],
      };

    case "deposit":
      return {
        title: `Deposit ${amount} ${token} privately`,
        steps: [
          { type: "navigate_to_page", page: "umbra_app" },
          ...accountSteps(state),
          ...tabStep(state, "deposit", "Deposit moves tokens from your wallet into your private balance."),
          { type: "request_input", target: "umb-token", say: `Pick the token. We'll use ${token}.`, suggestedValue: token },
          { type: "request_input", target: "umb-amount", say: `Now the amount. Let's say ${amount}.`, suggestedValue: amount },
          { type: "point", target: "umb-privacy-note", say: "Honest bit: a deposit is public. People can see your wallet, the token and the amount going in. After that, it's private." },
          { type: "stop_before_signing", target: "umb-submit", say: "When you're ready, tap Deposit and approve it in your wallet. That part is always yours." },
        ],
      };

    case "send": {
      const recipient = params.recipient && params.recipient.length > 20 ? params.recipient : DEMO_RECIPIENT;
      const needsFunds = priv < Number(amount);
      return {
        title: `Send ${amount} ${token} privately`,
        steps: [
          { type: "navigate_to_page", page: "umbra_app" },
          ...accountSteps(state),
          ...(needsFunds
            ? [{ type: "point", target: "umb-balance", say: `You have ${priv} ${token} private right now, so deposit first, then send.` } satisfies Step]
            : []),
          ...tabStep(state, "send", "Send pays another Umbra user from your private balance."),
          { type: "request_input", target: "umb-recipient", say: "Paste who you're paying. They must be a registered Umbra user. Here's a demo address.", suggestedValue: recipient.slice(0, 64) },
          { type: "request_input", target: "umb-token", say: `The token: ${token}.`, suggestedValue: token },
          { type: "request_input", target: "umb-amount", say: `And the amount, ${amount}.`, suggestedValue: amount },
          { type: "point", target: "umb-privacy-note", say: "This is the good part: sender, recipient, token and amount are all hidden from anyone watching Solana." },
          { type: "stop_before_signing", target: "umb-submit", say: "Tap Send privately and approve in your wallet." },
        ],
      };
    }

    case "swap": {
      const to = normalizeToken(params.outputToken, token === "SOL" ? "USDC" : "SOL");
      return {
        title: `Swap ${amount} ${token} to ${to} privately`,
        steps: [
          { type: "navigate_to_page", page: "umbra_app" },
          ...accountSteps(state),
          ...tabStep(state, "swap", "Swap trades inside your private balance."),
          { type: "request_input", target: "umb-token", say: `You pay with ${token}.`, suggestedValue: token },
          { type: "request_input", target: "umb-amount", say: `Amount: ${amount}.`, suggestedValue: amount },
          { type: "request_input", target: "umb-swap-to", say: `And you receive ${to}.`, suggestedValue: to },
          { type: "point", target: "umb-privacy-note", say: "Your trade size and activity stay out of public view." },
          { type: "stop_before_signing", target: "umb-submit", say: "Tap Swap privately and approve in your wallet." },
        ],
      };
    }

    case "withdraw":
      return {
        title: `Withdraw ${amount} ${token}`,
        steps: [
          { type: "navigate_to_page", page: "umbra_app" },
          ...accountSteps(state),
          ...tabStep(state, "withdraw", "Withdraw moves tokens back to a regular Solana wallet."),
          { type: "request_input", target: "umb-destination", say: "Where should it go? A fresh address keeps it unlinked from you. Here's a demo one.", suggestedValue: DEMO_DESTINATION },
          { type: "request_input", target: "umb-token", say: `Token: ${token}.`, suggestedValue: token },
          { type: "request_input", target: "umb-amount", say: `Amount: ${amount}.`, suggestedValue: amount },
          { type: "point", target: "umb-privacy-note", say: "A withdrawal is public: the address, token and amount show. Which private balance paid for it does not." },
          { type: "stop_before_signing", target: "umb-submit", say: "Tap Withdraw and approve in your wallet." },
        ],
      };

    case "privacy":
      return {
        title: "What's private on Umbra",
        steps: [
          { type: "navigate_to_page", page: "umbra_app" },
          { type: "point", target: "umb-privacy-note", say: "This box always tells you what's public for the action you've picked." },
          { type: "point", target: "umb-tab-send", say: "Private sends are the most private: sender, recipient, token and amount are hidden." },
          { type: "point", target: "umb-tab-deposit", say: "Deposits and withdrawals are the edges, and they're visible on chain. Timing and linked addresses can still hint at patterns." },
        ],
      };
  }
}
