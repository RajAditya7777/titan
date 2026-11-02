/**
 * Umbra / Nimbus Types & Contracts
 * Strictly simulated demo for Solana Summit. Zero real keys, seed phrases, or spending keys.
 */

export type UmbraToken = "SOL" | "USDC" | "USDT";

export interface TokenMetadata {
  symbol: UmbraToken;
  name: string;
  mint: string;
  decimals: number;
  isNative: boolean;
  rateUsd: number;
}

export const SUPPORTED_TOKENS: Record<UmbraToken, TokenMetadata> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    isNative: true,
    rateUsd: 185.5,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    isNative: false,
    rateUsd: 1.0,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    isNative: false,
    rateUsd: 1.0,
  },
};

export type RecipientStatus = "registered" | "unregistered";

export interface RecipientProfile {
  address: string;
  label: string;
  status: RecipientStatus;
  description: string;
}

export const DEMO_RECIPIENTS: RecipientProfile[] = [
  {
    address: "9aXz6GvK2pL4Qw8mYt1Bn3Pz5Ab7Cd9EfQ2rS1m",
    label: "Alice",
    status: "registered",
    description: "Registered Nimbus account with derived platform wallet. Can receive private transfers.",
  },
  {
    address: "3mQp8tL1Bn9Yx4Kz2Vw7P5s8Ab6Cd1EfH4kJ9n",
    label: "Bob",
    status: "unregistered",
    description: "Standard public Solana wallet. Must register in Nimbus before receiving private transfers.",
  },
];

export type OperationType = "register" | "deposit" | "private_send" | "withdraw";
export type OperationStage = "idle" | "preparing" | "proving" | "submitted" | "done" | "error";

export type UmbraErrorCode =
  | "account-unregistered"
  | "recipient-unregistered"
  | "amount-unfundable"
  | "mint-unsupported"
  | "fee-payer-unfunded"
  | "relay-unavailable";

export interface PrivacyReport {
  operation: OperationType;
  title: string;
  hidden: string[];
  public: string[];
  caveats: string[];
}

export interface UmbraHistoryItem {
  id: string;
  type: OperationType;
  token: UmbraToken;
  amount: string;
  timestamp: number;
  status: "confirmed" | "failed";
  recipient?: string;
  txHash: string;
  provenance: "simulated";
}

export interface UmbraStoreState {
  walletConnected: boolean;
  connectedAddress: string;
  registered: boolean;
  platformWallet: string | null;
  identityCommitment: string | null;
  synced: boolean;
  noteCount: number;
  publicBalances: Record<UmbraToken, string>;
  privateBalances: Record<UmbraToken, string>;
  history: UmbraHistoryItem[];
  currentOperation: {
    type: OperationType | null;
    stage: OperationStage;
    progressPercent: number;
    stageMessage: string;
    error: {
      code: UmbraErrorCode;
      message: string;
      technicalDetail?: string;
    } | null;
    txHash?: string;
  };
}
