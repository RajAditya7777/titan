import { z } from "zod";
import { fromBaseUnits, toBaseUnits } from "@companion/reflect-api";
import { API_SOURCE, defineTool, fail, failFrom, ok } from "../tool";
import { ASSET_INDEX, AssetSchema, round } from "./info";

const AmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,6})?$/, "Amount must be a positive decimal with at most 6 decimal places")
  .refine((s) => Number(s) > 0, "Amount must be greater than zero")
  .refine((s) => Number(s) <= 10_000_000, "Amount exceeds the 10,000,000 safety limit of this tool")
  .describe('Human amount, e.g. "100" or "25.5"');

const PubkeySchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Must be a base58 Solana address");

/** Shared by both quote tools so mint and redeem can never drift apart. */
async function quote(
  type: "mint" | "redeem",
  asset: z.infer<typeof AssetSchema>,
  amount: string,
  reflect: import("@companion/reflect-api").ReflectClient,
) {
  const index = ASSET_INDEX[asset];
  const inputBase = toBaseUnits(amount);
  const [outBase, limits] = await Promise.all([
    reflect.quote(type, index, inputBase),
    type === "mint" ? reflect.getSupplyLimits() : Promise.resolve(null),
  ]);
  const underlying = asset === "USDC+" ? "USDC" : "USDT";
  const remaining = limits?.find((l) => l.index === index)?.remainingCapacity;
  const output = fromBaseUnits(outBase);
  const input = fromBaseUnits(inputBase);

  return {
    type,
    asset,
    input: { amount: input, token: type === "mint" ? underlying : asset },
    expectedOutput: { amount: output, token: type === "mint" ? asset : underlying },
    impliedRate:
      type === "mint"
        ? { text: `1 ${asset} ≈ ${round(input / output, 6)} ${underlying}`, value: round(input / output, 6) }
        : { text: `1 ${asset} ≈ ${round(output / input, 6)} ${underlying}`, value: round(output / input, 6) },
    fees: {
      protocolFee: 0,
      note: "Reflect documents zero mint/redeem fees; the quoted output is what the program computes. Solana network fees (a fraction of a cent) still apply.",
    },
    limits:
      remaining == null
        ? null
        : { remainingCapacity: remaining, withinCap: fromBaseUnits(inputBase) <= remaining }, // limits are whole tokens
    quotedAt: new Date().toISOString(),
    validity: "Indicative. The exchange rate moves every block; the transaction enforces your minimum received instead.",
  };
}

export const mintQuote = defineTool({
  name: "reflect_get_mint_quote",
  title: "Mint quote",
  description:
    "Live quote for minting a Reflect stablecoin (deposit USDC → receive USDC+). Returns expected output, implied rate, fees and supply-cap headroom. Read-only; does not create a transaction.",
  readOnly: true,
  inputSchema: { asset: AssetSchema.default("USDC+"), amount: AmountSchema },
  async handler({ asset, amount }, { reflect }) {
    try {
      return ok(await quote("mint", asset, amount, reflect), "live", [API_SOURCE]);
    } catch (err) {
      return failFrom(err);
    }
  },
});

export const redeemQuote = defineTool({
  name: "reflect_get_redeem_quote",
  title: "Redeem quote",
  description:
    "Live quote for redeeming a Reflect stablecoin (burn USDC+ → receive USDC). Because USDC+ appreciates, you receive more USDC than the USDC+ you burn. Read-only.",
  readOnly: true,
  inputSchema: { asset: AssetSchema.default("USDC+"), amount: AmountSchema },
  async handler({ asset, amount }, { reflect }) {
    try {
      return ok(await quote("redeem", asset, amount, reflect), "live", [API_SOURCE]);
    } catch (err) {
      return failFrom(err);
    }
  },
});

export const prepareTransaction = defineTool({
  name: "reflect_prepare_transaction",
  title: "Prepare unsigned transaction",
  description:
    "Builds an UNSIGNED Solana VersionedTransaction for a mint or redeem via Reflect's documented API, with slippage protection derived from a fresh quote. The user's wallet must review and sign it. This tool never signs, submits or requests private keys.",
  readOnly: true,
  inputSchema: {
    action: z.enum(["mint", "redeem"]),
    asset: AssetSchema.default("USDC+"),
    amount: AmountSchema,
    walletAddress: PubkeySchema.describe("The user's public wallet address (never a private key)"),
    slippageBps: z.number().int().min(1).max(300).default(50).describe("Max tolerated slippage in bps (50 = 0.5%)"),
    cluster: z.enum(["mainnet", "devnet"]).default("mainnet"),
  },
  async handler({ action, asset, amount, walletAddress, slippageBps, cluster }, { reflect }) {
    try {
      const index = ASSET_INDEX[asset];
      const inputBase = toBaseUnits(amount);
      const quotedOut = await reflect.quote(action, index, inputBase);
      // Never zero: a zero minimum would let a sandwich attack take everything (Reflect hardening rule #5).
      const minimumReceived = Math.floor((quotedOut * (10_000 - slippageBps)) / 10_000);
      if (minimumReceived <= 0) return fail("INVALID_INPUT", "Amount too small to protect with a minimum received.");

      const { transaction } = await reflect.buildTransaction(action === "mint" ? "mint" : "burn", {
        stablecoinIndex: index,
        depositAmount: inputBase,
        signer: walletAddress,
        minimumReceived,
        cluster,
      });

      return ok(
        {
          signed: false,
          submitted: false,
          action,
          asset,
          cluster,
          input: fromBaseUnits(inputBase),
          expectedOutput: fromBaseUnits(quotedOut),
          minimumReceived: fromBaseUnits(minimumReceived),
          slippageBps,
          unsignedTransactionBase64: transaction,
          transactionBytes: Math.floor((transaction.length * 3) / 4),
          nextStep: "Pass the transaction to the user's wallet adapter (signTransaction) for review and approval.",
          warnings: [
            "Reflect is in closed beta: the wallet must be whitelisted or the transaction may fail on-chain.",
            "Includes a recent blockhash and expires in ~60–90s; prepare again if the user takes longer.",
          ],
        },
        "live",
        [API_SOURCE],
      );
    } catch (err) {
      return failFrom(err);
    }
  },
});
