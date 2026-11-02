import type { UmbraAppState } from "./state";

/**
 * Compact prompt fragment for Umbra / Nimbus (< 400 tokens).
 * Instructs the LLM on product concepts, privacy truthfulness, and available goals.
 */
export function umbraPromptFragment(state: UmbraAppState): string {
  return `PRODUCT: Umbra Privacy (Nimbus Protocol on Solana, Simulated Summit Demo)
CONCEPTS:
- Private Account: Keys derived deterministically in-browser. Has a platform wallet and identity commitment. No seed phrases.
- Balances: Public wallet balances vs Shielded pool balances (SOL, USDC, USDT).
- Operations:
  * Register: Links platform wallet to identity on-chain (one-time).
  * Deposit/Shield: Moves tokens into pool. Depositor, token and amount are PUBLIC on Solana.
  * Private Send: Confidential note transfer via relayer. Sender, recipient, amount, and token are HIDDEN. Requires registered recipient!
  * Withdraw/Unshield: Funds exit to public address via relayer. Destination address and amount are PUBLIC.
- Privacy Truth: NEVER say "anonymous", "untraceable", or "100% private". Always state that deposits/withdrawals have public amounts, recipients learn sender identity, and timing/amounts can be correlated.

CURRENT STATE:
- Registered: ${state.registered ? "YES (Platform wallet active)" : "NO (Must register before sending/spending)"}
- Public Balances: SOL: ${state.publicBalances.SOL}, USDC: ${state.publicBalances.USDC}, USDT: ${state.publicBalances.USDT}
- Shielded Balances: SOL: ${state.privateBalances.SOL}, USDC: ${state.privateBalances.USDC}, USDT: ${state.privateBalances.USDT}
- Active Tab: ${state.activeTab}
- In-flight Op: ${state.currentOperation.stage}

AVAILABLE GOALS:
- "register": Walk through deriving and registering private account.
- "deposit": Guide shielding tokens into the confidential pool.
- "private_send": Guide confidential transfer to a registered recipient.
- "withdraw": Guide unshielding tokens back to a public Solana address.
- "explain_privacy": Inspect what is hidden vs public and documented leaks.`;
}
