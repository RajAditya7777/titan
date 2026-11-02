import type { OperationType, PrivacyReport } from "./types";

/**
 * Nimbus Protocol Privacy Reports & Visibility Matrices
 * Sourced directly from official Nimbus documentation:
 * https://docs.nimbusprivacy.xyz/privacy/visibility
 * https://docs.nimbusprivacy.xyz/privacy/leaks
 *
 * Strict guideline: NEVER describe transactions as "completely anonymous" or "100% untraceable".
 * Always disclose documented public edges and correlation vectors.
 */

export const PRIVACY_REPORTS: Record<OperationType, PrivacyReport> = {
  register: {
    operation: "register",
    title: "Account Registration Visibility",
    hidden: [
      "Spending key & nullifier secrets (generated in browser)",
      "ML-KEM decryption key",
      "Seed phrases (never exist or leave device)",
    ],
    public: [
      "Main wallet address (fee payer on Solana)",
      "Platform wallet address (derived signer)",
      "Identity commitment (field element on-chain)",
      "Encryption key hash (Keccak-256 of ML-KEM public key)",
    ],
    caveats: [
      "Registration publicly binds your main wallet to your platform wallet in the user registry.",
      "Anyone observing the registry can see that these two addresses belong to one Nimbus account.",
    ],
  },
  deposit: {
    operation: "deposit",
    title: "Shielding / Deposit Visibility",
    hidden: [
      "Internal note structure and commitment tree indices",
      "Which private balance slots receive the shielded tokens",
      "How the deposited amount is split across confidential notes",
    ],
    public: [
      "Depositing platform wallet address",
      "Token asset (e.g. USDC, SOL, USDT)",
      "Exact amount shielded into the pool",
      "Transaction timestamp and Solana signature",
    ],
    caveats: [
      "Deposits are public and attributable because registration ties your platform wallet to your identity.",
      "Matching amounts and timing between a deposit and a withdrawal can correlate activity.",
    ],
  },
  private_send: {
    operation: "private_send",
    title: "Private Transfer Visibility",
    hidden: [
      "Sender identity (shielded zero-knowledge note nullifier)",
      "Recipient identity (encrypted for recipient's ML-KEM key)",
      "Transferred amount (confidential note commitment)",
      "Asset token type (shared shielded asset tree)",
    ],
    public: [
      "Submitted by a Nimbus relayer (sender signs nothing on-chain)",
      "Transaction timestamp and Solana slot",
      "Relayer tip (amount & token, if paid)",
      "Screening verification co-signature (CipherOwl / OFAC)",
    ],
    caveats: [
      "The recipient learns the sender's identity commitment from the note's 'funded by' field.",
      "Rare tokens or uncommon amounts can narrow the effective anonymity set.",
      "Network metadata (IP address, RPC submission timing) can leave external traces.",
      "No system offers 100% untraceability: privacy depends on pool depth and transaction cadence.",
    ],
  },
  withdraw: {
    operation: "withdraw",
    title: "Unshielding / Withdrawal Visibility",
    hidden: [
      "Who initiated the withdrawal (submitted by relayer)",
      "Which shielded notes funded the unshielding",
      "Remaining shielded change notes in the pool",
    ],
    public: [
      "Receiving destination Solana wallet address",
      "Exact token asset and amount withdrawn",
      "Relayer address and network transaction fee",
      "Transaction timestamp and slot",
    ],
    caveats: [
      "Withdrawing to an address already tied to your identity completely undoes unshielding privacy.",
      "Withdrawing an amount identical to a recent deposit allows outside observers to link the two transactions.",
      "Escape hatch transactions disclose twelve note fields including owner platform wallet.",
    ],
  },
};

export function getPrivacyReport(operation: OperationType): PrivacyReport {
  return PRIVACY_REPORTS[operation] ?? PRIVACY_REPORTS.private_send;
}
