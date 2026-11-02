import type { UmbraAppState } from "./state";

export interface UmbraRuleIntent {
  type: "act" | "learn" | "explain" | "diagnose" | "chat";
  product: "umbra";
  goal?: string;
  slots: Record<string, string>;
  speech: string;
}

/**
 * Deterministic rule-based fallback for Umbra (no-LLM path).
 */
export function matchUmbraRules(utterance: string, state: UmbraAppState): UmbraRuleIntent | null {
  const text = utterance.toLowerCase().trim();

  // 1. Privacy questions
  if (
    text.includes("what is visible") ||
    text.includes("what can people see") ||
    text.includes("privacy report") ||
    text.includes("is this anonymous") ||
    text.includes("explain privacy") ||
    text.includes("how does privacy work")
  ) {
    return {
      type: "explain",
      product: "umbra",
      goal: "explain_privacy",
      slots: {},
      speech:
        "Here is the Nimbus Privacy Transparency Card. Inside the shielded pool, transfers hide sender, recipient, amount, and token. At the edges, deposits and withdrawals have public parameters. Nimbus never claims 100% anonymity.",
    };
  }

  // 2. Registration
  if (
    text.includes("register") ||
    text.includes("create account") ||
    text.includes("derive key") ||
    text.includes("set up account")
  ) {
    return {
      type: "act",
      product: "umbra",
      goal: "register",
      slots: {},
      speech: state.registered
        ? "Your Nimbus Private Account is already registered on Solana."
        : "Let's derive your private account keys in your browser and register on Solana.",
    };
  }

  // 3. Deposit / Shield
  if (text.includes("deposit") || text.includes("shield")) {
    const amountMatch = text.match(/\b(\d+(\.\d+)?)\b/);
    const tokenMatch = text.match(/\b(usdc|usdt|sol)\b/i);
    const amount: string = amountMatch?.[1] ? amountMatch[1] : "100";
    const token: string = tokenMatch?.[1] ? tokenMatch[1].toUpperCase() : state.selectedToken || "USDC";

    return {
      type: "act",
      product: "umbra",
      goal: "deposit",
      slots: { amount, token },
      speech: `Let's shield ${amount} ${token} into your private balance.`,
    };
  }

  // 4. Send Privately
  if (text.includes("send") || text.includes("pay") || text.includes("transfer")) {
    const amountMatch = text.match(/\b(\d+(\.\d+)?)\b/);
    const tokenMatch = text.match(/\b(usdc|usdt|sol)\b/i);
    const recipientMatch = text.includes("bob") ? "bob" : text.includes("alice") ? "alice" : undefined;

    const amount: string = amountMatch?.[1] ? amountMatch[1] : "50";
    const token: string = tokenMatch?.[1] ? tokenMatch[1].toUpperCase() : state.selectedToken || "USDC";

    const slots: Record<string, string> = { amount, token };
    if (recipientMatch) slots.recipient = recipientMatch;

    return {
      type: "act",
      product: "umbra",
      goal: "private_send",
      slots,
      speech: `Let's walk through sending ${amount} ${token} confidentially through the Nimbus relayer.`,
    };
  }

  // 5. Withdraw / Unshield
  if (text.includes("withdraw") || text.includes("unshield") || text.includes("cash out")) {
    const amountMatch = text.match(/\b(\d+(\.\d+)?)\b/);
    const tokenMatch = text.match(/\b(usdc|usdt|sol)\b/i);
    const amount: string = amountMatch?.[1] ? amountMatch[1] : "25";
    const token: string = tokenMatch?.[1] ? tokenMatch[1].toUpperCase() : state.selectedToken || "USDC";

    return {
      type: "act",
      product: "umbra",
      goal: "withdraw",
      slots: { amount, token },
      speech: `Let's unshield ${amount} ${token} back to a public Solana address.`,
    };
  }

  return null;
}
