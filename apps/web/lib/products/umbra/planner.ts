import type { UmbraElementId } from "./registry";
import type { UmbraAppState } from "./state";
import { DEMO_RECIPIENTS } from "./types";

export interface UmbraStep {
  type:
    | "navigate_to_page"
    | "point"
    | "request_input"
    | "wait_for_user_action"
    | "stop_before_signing"
    | "celebrate";
  target?: UmbraElementId;
  page?: string;
  say: string;
  suggestedValue?: string;
}

export interface UmbraWorkflow {
  id: string;
  title: string;
  steps: UmbraStep[];
}

export interface PlanOptions {
  slots: Record<string, string>;
  state: UmbraAppState;
}

/**
 * Deterministic Goal Planners for Umbra / Nimbus.
 * Fully unit-testable without an LLM (DECISIONS.md D-004).
 */
export const UMBRA_GOALS: Record<string, (options: PlanOptions) => UmbraWorkflow> = {
  register: ({ state }: PlanOptions) => {
    if (state.registered) {
      return {
        id: "umbra-register-done",
        title: "Account Already Registered",
        steps: [
          {
            type: "point",
            target: "umbra-account-status",
            say: "Your Nimbus Private Account is already derived and registered on Solana.",
          },
          {
            type: "point",
            target: "umbra-account-platform-wallet",
            say: "Your derived platform wallet is ready to sign confidential note operations.",
          },
        ],
      };
    }

    return {
      id: "umbra-register",
      title: "Derive & Register Nimbus Private Account",
      steps: [
        {
          type: "point",
          target: "umbra-account-card",
          say: "Welcome to Umbra Privacy. Before you can shield or send funds, we must derive your confidential account.",
        },
        {
          type: "point",
          target: "umbra-account-status",
          say: "Your browser will derive your platform wallet and encryption keys deterministically. Seed phrases never leave your device.",
        },
        {
          type: "wait_for_user_action",
          target: "umbra-account-register-btn",
          say: "Click Derive & Register Account to publish your identity commitment on Solana.",
        },
        {
          type: "stop_before_signing",
          target: "umbra-account-register-btn",
          say: "Approve the registration transaction in your simulated wallet. The companion never signs for you.",
        },
      ],
    };
  },

  deposit: ({ slots, state }: PlanOptions) => {
    const amount = slots.amount || "100";
    const token = (slots.token || state.selectedToken || "USDC").toUpperCase();

    return {
      id: "umbra-deposit",
      title: `Shield ${amount} ${token} into Nimbus Pool`,
      steps: [
        {
          type: "point",
          target: "umbra-nav-deposit",
          say: "Let's navigate to the Shield / Deposit tab.",
        },
        {
          type: "point",
          target: "umbra-deposit-asset",
          say: `We'll shield ${token}. You can change the asset anytime.`,
        },
        {
          type: "request_input",
          target: "umbra-deposit-amount",
          say: `Enter the amount of ${token} to shield into your private balance.`,
          suggestedValue: amount,
        },
        {
          type: "point",
          target: "umbra-deposit-breakdown",
          say: "Notice the privacy breakdown: depositors and amounts are public at the pool entry point. Once inside, tokens are shielded into confidential notes.",
        },
        {
          type: "wait_for_user_action",
          target: "umbra-deposit-confirm",
          say: "Click Shield Funds to initiate zero-knowledge note generation.",
        },
        {
          type: "stop_before_signing",
          target: "umbra-deposit-approve",
          say: "Review and approve the shielding transaction in your wallet. The companion never signs for you.",
        },
      ],
    };
  },

  private_send: ({ slots, state }: PlanOptions) => {
    const amount = slots.amount || "50";
    const token = (slots.token || state.selectedToken || "USDC").toUpperCase() as "USDC" | "USDT" | "SOL";
    const fallbackRecipient = DEMO_RECIPIENTS[0]?.address ?? "9aXz6GvK2pL4Qw8mYt1Bn3Pz5Ab7Cd9EfQ2rS1m";
    const targetRecipient = slots.recipient || fallbackRecipient;

    // Prerequisite check 1: Account registration
    if (!state.registered) {
      return {
        id: "umbra-send-blocked-unregistered",
        title: "Registration Required Before Private Send",
        steps: [
          {
            type: "point",
            target: "umbra-account-status",
            say: "Before you can send confidential transfers, your account must be registered with Nimbus to establish your platform wallet.",
          },
          {
            type: "wait_for_user_action",
            target: "umbra-account-register-btn",
            say: "Click Derive & Register Account first. After registering, we can proceed with your private send.",
          },
          {
            type: "stop_before_signing",
            target: "umbra-account-register-btn",
            say: "Approve registration in your wallet to enable confidential transfers.",
          },
        ],
      };
    }

    // Prerequisite check 2: Balance check
    const currentPrivateBal = parseFloat(state.privateBalances[token] || "0");
    const requiredAmount = parseFloat(amount);
    if (currentPrivateBal < requiredAmount) {
      return {
        id: "umbra-send-insufficient-balance",
        title: "Deposit Required: Insufficient Shielded Balance",
        steps: [
          {
            type: "point",
            target: "umbra-balance-private",
            say: `You have ${currentPrivateBal} ${token} in your shielded balance, but you asked to send ${amount} ${token}.`,
          },
          {
            type: "point",
            target: "umbra-nav-deposit",
            say: `Let's first shield additional ${token} into your private balance using the Deposit tab.`,
          },
          {
            type: "request_input",
            target: "umbra-deposit-amount",
            say: `Enter the amount of ${token} to deposit.`,
            suggestedValue: (requiredAmount - currentPrivateBal + 10).toFixed(2),
          },
        ],
      };
    }

    // Prerequisite check 3: Recipient check
    const isUnregistered =
      targetRecipient.toLowerCase().includes("bob") ||
      targetRecipient.startsWith("3mQp") ||
      slots.recipientStatus === "unregistered";

    if (isUnregistered) {
      return {
        id: "umbra-send-blocked-recipient",
        title: "Recipient Unregistered in Nimbus",
        steps: [
          {
            type: "point",
            target: "umbra-send-recipient-status",
            say: "Recipient Bob is not registered in the Nimbus registry. In Nimbus, private transfers require registered recipients to look up their ML-KEM encryption keys.",
          },
          {
            type: "point",
            target: "umbra-send-shortcut-alice",
            say: "For this demo, click Alice to autofill a registered Nimbus account and test a successful private transfer.",
          },
        ],
      };
    }

    return {
      id: "umbra-private-send",
      title: `Send ${amount} ${token} Privately via Relayer`,
      steps: [
        {
          type: "point",
          target: "umbra-nav-send",
          say: "Let's navigate to the Private Send tab.",
        },
        {
          type: "point",
          target: "umbra-send-asset",
          say: `We'll send shielded ${token}.`,
        },
        {
          type: "request_input",
          target: "umbra-send-recipient",
          say: "Enter the recipient's registered Nimbus privacy address.",
          suggestedValue: targetRecipient,
        },
        {
          type: "request_input",
          target: "umbra-send-amount",
          say: "Enter the amount of shielded tokens to transfer.",
          suggestedValue: amount,
        },
        {
          type: "point",
          target: "umbra-send-privacy-breakdown",
          say: "Check the transfer privacy matrix: sender identity, recipient inside the pool, amount, and token are completely shielded. A relayer submits the transaction on-chain.",
        },
        {
          type: "wait_for_user_action",
          target: "umbra-send-confirm",
          say: "Click Send Privately to synthesize the zero-knowledge proof in your browser.",
        },
        {
          type: "stop_before_signing",
          target: "umbra-send-approve",
          say: "Review and approve the confidential transfer. The companion never signs for you.",
        },
      ],
    };
  },

  withdraw: ({ slots, state }: PlanOptions) => {
    const amount = slots.amount || "25";
    const token = (slots.token || state.selectedToken || "USDC").toUpperCase();
    const destination = slots.destination || state.connectedAddress || "7XwK1h8jM9zQL7y5p2VnFk4R3m1Q8W";

    return {
      id: "umbra-withdraw",
      title: `Unshield ${amount} ${token} to Public Address`,
      steps: [
        {
          type: "point",
          target: "umbra-nav-withdraw",
          say: "Let's switch to the Withdraw / Unshield tab.",
        },
        {
          type: "point",
          target: "umbra-withdraw-asset",
          say: `Select ${token} to unshield from the pool.`,
        },
        {
          type: "request_input",
          target: "umbra-withdraw-amount",
          say: `Enter the amount of ${token} to withdraw.`,
          suggestedValue: amount,
        },
        {
          type: "point",
          target: "umbra-withdraw-destination",
          say: `The funds will be paid out to ${destination.slice(0, 8)}...`,
        },
        {
          type: "point",
          target: "umbra-withdraw-warning",
          say: "Important privacy note: Withdrawing directly to an address already linked to you weakens transaction unlinkability. Observers can also correlate matching amounts.",
        },
        {
          type: "wait_for_user_action",
          target: "umbra-withdraw-confirm",
          say: "Click Unshield & Withdraw to create exit nullifiers.",
        },
        {
          type: "stop_before_signing",
          target: "umbra-withdraw-approve",
          say: "Review in simulated wallet. Only you can authorize withdrawals.",
        },
      ],
    };
  },

  explain_privacy: () => {
    return {
      id: "umbra-explain-privacy",
      title: "Nimbus Privacy Transparency Matrix",
      steps: [
        {
          type: "point",
          target: "umbra-privacy-card",
          say: "Here is the Nimbus Privacy Transparency Card. It clarifies what is confidential versus what is public on-chain.",
        },
        {
          type: "point",
          target: "umbra-privacy-matrix",
          say: "Inside the shielded pool, transfers hide sender, recipient, amount, and token. But pool boundaries (deposits and withdrawals) have public parameters.",
        },
        {
          type: "point",
          target: "umbra-privacy-leaks",
          say: "Documented limits: amount and timing correlation can link deposits to withdrawals, and recipients learn the sender's identity. Nimbus avoids deceptive claims of 100% anonymity.",
        },
      ],
    };
  },
};

export function planUmbraGoal(goal: string, options: PlanOptions): UmbraWorkflow | null {
  const planner = UMBRA_GOALS[goal];
  return planner ? planner(options) : null;
}
