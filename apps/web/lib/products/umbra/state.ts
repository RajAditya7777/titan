import { z } from "zod";
import { umbraSimulator } from "./simulator";
import type { OperationStage, OperationType, UmbraToken } from "./types";

/**
 * Non-sensitive application state snapshot for Umbra.
 * Strictly whitelisted properties: NO private keys, NO seed phrases, NO signatures.
 * Complies with DECISIONS.md D-005.
 */

export const UmbraAppStateSchema = z.object({
  product: z.literal("umbra"),
  walletConnected: z.boolean(),
  connectedAddress: z.string(),
  registered: z.boolean(),
  platformWallet: z.string().nullable(),
  identityCommitment: z.string().nullable(),
  synced: z.boolean(),
  noteCount: z.number(),
  activeTab: z.enum(["deposit", "send", "withdraw", "account"]),
  selectedToken: z.enum(["SOL", "USDC", "USDT"]),
  publicBalances: z.object({
    SOL: z.string(),
    USDC: z.string(),
    USDT: z.string(),
  }),
  privateBalances: z.object({
    SOL: z.string(),
    USDC: z.string(),
    USDT: z.string(),
  }),
  currentOperation: z.object({
    type: z.enum(["register", "deposit", "private_send", "withdraw"]).nullable(),
    stage: z.enum(["idle", "preparing", "proving", "submitted", "done", "error"]),
    progressPercent: z.number(),
    stageMessage: z.string(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        technicalDetail: z.string().optional(),
      })
      .nullable(),
  }),
});

export type UmbraAppState = z.infer<typeof UmbraAppStateSchema>;

export function getUmbraAppState(activeTab: "deposit" | "send" | "withdraw" | "account" = "deposit", selectedToken: UmbraToken = "USDC"): UmbraAppState {
  const store = umbraSimulator.getState();
  return {
    product: "umbra",
    walletConnected: store.walletConnected,
    connectedAddress: store.connectedAddress,
    registered: store.registered,
    platformWallet: store.platformWallet,
    identityCommitment: store.identityCommitment,
    synced: store.synced,
    noteCount: store.noteCount,
    activeTab,
    selectedToken,
    publicBalances: store.publicBalances,
    privateBalances: store.privateBalances,
    currentOperation: {
      type: store.currentOperation.type,
      stage: store.currentOperation.stage,
      progressPercent: store.currentOperation.progressPercent,
      stageMessage: store.currentOperation.stageMessage,
      error: store.currentOperation.error,
    },
  };
}
