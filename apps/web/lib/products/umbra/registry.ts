/**
 * Umbra / Nimbus Element & Page Registry
 * Maps the Umbra interface for the AI Companion and defines strict security boundaries.
 * Every control targeted by the pet spotlight references a registered element id.
 */

export interface UmbraPageSpec {
  path: string;
  title: string;
  summary: string;
}

export const UMBRA_PAGES: Record<string, UmbraPageSpec> = {
  umbra: {
    path: "/umbra",
    title: "Umbra Privacy",
    summary:
      "Confidential balances, private transfers, and shielding on Solana powered by the Nimbus protocol (simulated demo).",
  },
};

export type UmbraElementKind = "nav" | "button" | "input" | "select" | "display" | "section";
export type UmbraValidationRule = "positive-amount" | "solana-address" | "non-empty";

export interface UmbraElementSpec {
  page: "umbra" | "global";
  kind: UmbraElementKind;
  label: string;
  description: string;
  validation?: UmbraValidationRule;
  sensitive?: boolean;
  fillable?: boolean;
}

export const UMBRA_ELEMENTS = {
  // Navigation tabs
  "umbra-nav-account": {
    page: "umbra",
    kind: "nav",
    label: "Account Status",
    description: "Inspect registration status, derived platform wallet, and public vs private balances.",
  },
  "umbra-nav-deposit": {
    page: "umbra",
    kind: "nav",
    label: "Deposit / Shield",
    description: "Deposit assets from your public Solana wallet into the Nimbus shielded pool.",
  },
  "umbra-nav-send": {
    page: "umbra",
    kind: "nav",
    label: "Private Send",
    description: "Confidential zero-knowledge transfer to another registered Nimbus recipient.",
  },
  "umbra-nav-withdraw": {
    page: "umbra",
    kind: "nav",
    label: "Withdraw / Unshield",
    description: "Unshield tokens out of the private pool back to a public Solana wallet.",
  },
  "umbra-nav-privacy": {
    page: "umbra",
    kind: "nav",
    label: "Privacy Transparency",
    description: "Review what the Nimbus protocol keeps private versus what is public on-chain.",
  },

  // Account panel
  "umbra-account-card": {
    page: "umbra",
    kind: "section",
    label: "Account Status Card",
    description: "Your Nimbus cryptographic account status and balance overview.",
  },
  "umbra-account-status": {
    page: "umbra",
    kind: "display",
    label: "Registration Status",
    description: "Whether your wallet has derived a Nimbus platform wallet and identity commitment.",
  },
  "umbra-account-register-btn": {
    page: "umbra",
    kind: "button",
    label: "Derive & Register Account",
    description: "Derive deterministic keys in-browser and bind your platform wallet to your identity on Solana.",
    sensitive: true,
  },
  "umbra-account-platform-wallet": {
    page: "umbra",
    kind: "display",
    label: "Derived Platform Wallet",
    description: "The Solana keypair derived from your wallet signature. Signs shielded pool transactions.",
  },
  "umbra-account-sync-btn": {
    page: "umbra",
    kind: "button",
    label: "Sync Note Store",
    description: "Synchronize local encrypted note store with the latest on-chain commitments.",
  },
  "umbra-balance-public": {
    page: "umbra",
    kind: "display",
    label: "Public Balances",
    description: "Tokens currently sitting in your unshielded standard Solana wallet.",
  },
  "umbra-balance-private": {
    page: "umbra",
    kind: "display",
    label: "Private / Shielded Balances",
    description: "Tokens protected inside the Nimbus shielded pool across confidential notes.",
  },

  // Deposit Tab
  "umbra-deposit-tab": {
    page: "umbra",
    kind: "section",
    label: "Deposit Tab",
    description: "Shield funds into the confidential pool.",
  },
  "umbra-deposit-asset": {
    page: "umbra",
    kind: "select",
    label: "Deposit Asset",
    description: "The SPL token or native SOL you wish to shield.",
  },
  "umbra-deposit-amount": {
    page: "umbra",
    kind: "input",
    label: "Deposit Amount",
    description: "How many tokens to shield into your private balance.",
    validation: "positive-amount",
    fillable: true,
  },
  "umbra-deposit-max": {
    page: "umbra",
    kind: "button",
    label: "Max Amount",
    description: "Select the entire available public balance for shielding.",
  },
  "umbra-deposit-breakdown": {
    page: "umbra",
    kind: "section",
    label: "Deposit Privacy Breakdown",
    description: "Explains what observers see during a deposit: depositing wallet and amount are public.",
  },
  "umbra-deposit-fee": {
    page: "umbra",
    kind: "display",
    label: "Deposit Fee Breakdown",
    description: "Shows Solana network fee (~0.000005 SOL) and Nimbus protocol fee.",
  },
  "umbra-deposit-confirm": {
    page: "umbra",
    kind: "button",
    label: "Shield Funds (Simulated)",
    description: "Review and initiate confidential deposit.",
    sensitive: true,
  },
  "umbra-deposit-approve": {
    page: "umbra",
    kind: "button",
    label: "Approve Deposit in Wallet",
    description: "Sign deposit transaction in simulated wallet. The companion never signs for you.",
    sensitive: true,
  },

  // Private Send Tab
  "umbra-send-tab": {
    page: "umbra",
    kind: "section",
    label: "Private Send Tab",
    description: "Send confidential payments to registered recipients.",
  },
  "umbra-send-asset": {
    page: "umbra",
    kind: "select",
    label: "Send Asset",
    description: "The shielded token you want to send.",
  },
  "umbra-send-amount": {
    page: "umbra",
    kind: "input",
    label: "Send Amount",
    description: "Amount of shielded tokens to transfer.",
    validation: "positive-amount",
    fillable: true,
  },
  "umbra-send-max": {
    page: "umbra",
    kind: "button",
    label: "Max Shielded Amount",
    description: "Use full shielded balance for transfer.",
  },
  "umbra-send-recipient": {
    page: "umbra",
    kind: "input",
    label: "Recipient Address",
    description: "The destination address. Must be registered with Nimbus for private transfers.",
    validation: "non-empty",
    fillable: true,
  },
  "umbra-send-recipient-status": {
    page: "umbra",
    kind: "display",
    label: "Recipient Status Check",
    description: "Checks whether the recipient is registered in the Nimbus account registry.",
  },
  "umbra-send-shortcut-alice": {
    page: "umbra",
    kind: "button",
    label: "Demo: Registered Alice",
    description: "Autofill Alice's registered Nimbus address to test a successful private transfer.",
  },
  "umbra-send-shortcut-bob": {
    page: "umbra",
    kind: "button",
    label: "Demo: Unregistered Bob",
    description: "Autofill Bob's unregistered address to test recipient verification and error handling.",
  },
  "umbra-send-privacy-breakdown": {
    page: "umbra",
    kind: "section",
    label: "Transfer Privacy Breakdown",
    description: "Displays what is hidden: sender, recipient, amount, token; and what is public: relayer tx.",
  },
  "umbra-send-confirm": {
    page: "umbra",
    kind: "button",
    label: "Send Privately (Relayed)",
    description: "Generates client zk-proof and submits through relayer.",
    sensitive: true,
  },
  "umbra-send-approve": {
    page: "umbra",
    kind: "button",
    label: "Approve Private Send",
    description: "Review and approve in simulated wallet. The companion never signs for you.",
    sensitive: true,
  },

  // Withdraw Tab
  "umbra-withdraw-tab": {
    page: "umbra",
    kind: "section",
    label: "Withdraw Tab",
    description: "Unshield funds back to a public Solana address.",
  },
  "umbra-withdraw-asset": {
    page: "umbra",
    kind: "select",
    label: "Withdraw Asset",
    description: "The shielded token to withdraw.",
  },
  "umbra-withdraw-amount": {
    page: "umbra",
    kind: "input",
    label: "Withdraw Amount",
    description: "Amount to unshield back to public address.",
    validation: "positive-amount",
    fillable: true,
  },
  "umbra-withdraw-max": {
    page: "umbra",
    kind: "button",
    label: "Max Withdraw",
    description: "Select full shielded balance to unshield.",
  },
  "umbra-withdraw-destination": {
    page: "umbra",
    kind: "input",
    label: "Destination Public Address",
    description: "Public Solana wallet address receiving the unshielded funds.",
    validation: "non-empty",
    fillable: true,
  },
  "umbra-withdraw-dest-toggle": {
    page: "umbra",
    kind: "button",
    label: "Use Custom Address",
    description: "Toggle between your connected public wallet and a separate destination address.",
  },
  "umbra-withdraw-warning": {
    page: "umbra",
    kind: "section",
    label: "Unlinkability Notice",
    description: "Warns that withdrawing to an address already linked to you weakens privacy.",
  },
  "umbra-withdraw-fee": {
    page: "umbra",
    kind: "display",
    label: "Withdrawal Fee Estimate",
    description: "Relayer fee and Solana network fee breakdown for unshielding.",
  },
  "umbra-withdraw-confirm": {
    page: "umbra",
    kind: "button",
    label: "Unshield & Withdraw (Simulated)",
    description: "Generates unshielding proof and requests relayer execution.",
    sensitive: true,
  },
  "umbra-withdraw-approve": {
    page: "umbra",
    kind: "button",
    label: "Approve Withdrawal",
    description: "Approve in simulated wallet. The companion never signs for you.",
    sensitive: true,
  },

  // Privacy transparency card
  "umbra-privacy-card": {
    page: "umbra",
    kind: "section",
    label: "Privacy Transparency Card",
    description: "Interactive transparency matrix displaying what is hidden vs what is public.",
  },
  "umbra-privacy-toggle": {
    page: "umbra",
    kind: "button",
    label: "Toggle Privacy Details",
    description: "Expand or collapse detailed breakdowns of documented leaks and privacy caveats.",
  },
  "umbra-privacy-matrix": {
    page: "umbra",
    kind: "display",
    label: "Visibility Matrix",
    description: "Side-by-side comparison of public vs hidden fields across all Nimbus operations.",
  },
  "umbra-privacy-leaks": {
    page: "umbra",
    kind: "section",
    label: "Documented Limits & Leaks",
    description: "Explains correlation risks (amounts/timing), recipient discovery, and absence of timelocks.",
  },
} as const satisfies Record<string, UmbraElementSpec>;

export type UmbraElementId = keyof typeof UMBRA_ELEMENTS;
export const UMBRA_ELEMENT_IDS = Object.keys(UMBRA_ELEMENTS) as UmbraElementId[];

export function getUmbraElement(id: string): (UmbraElementSpec & { id: UmbraElementId }) | null {
  return id in UMBRA_ELEMENTS
    ? { id: id as UmbraElementId, ...(UMBRA_ELEMENTS as Record<string, UmbraElementSpec>)[id]! }
    : null;
}
