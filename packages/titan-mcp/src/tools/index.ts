import { defineTool, ok, fail } from "@companion/mcp-kit";
import { z } from "zod";
import { TITAN_DOCS } from "../knowledge/docs";

export const titanGetQuote = defineTool({
  name: "titan_get_quote",
  title: "Get Titan Swap Quote",
  description: "Retrieves an optimized DEX quote for a token swap on Solana, detailing Argos multi-hop split and DART routing.",
  inputSchema: {
    inputToken: z.string().describe("Input token symbol (e.g. SOL, USDC)"),
    outputToken: z.string().describe("Output token symbol (e.g. USDC, SOL)"),
    amount: z.string().describe("Amount of input token to swap"),
    prime: z.boolean().optional().describe("Whether Titan Prime mode is active"),
    dart: z.enum(["Auto", "Only", "Off"]).optional().describe("DART execution mode"),
  },
  readOnly: true,
  handler: async (input) => {
    const inAmount = parseFloat(input.amount) || 1.0;
    const inToken = input.inputToken.toUpperCase();
    const outToken = input.outputToken.toUpperCase();

    const inTokenData = TITAN_DOCS.supportedTokens.find((t) => t.symbol === inToken);
    const outTokenData = TITAN_DOCS.supportedTokens.find((t) => t.symbol === outToken);

    const inPrice = inTokenData?.priceUsd ?? (inToken === "SOL" ? 93.759 : 1.0);
    const outPrice = outTokenData?.priceUsd ?? (outToken === "USDC" ? 1.0 : 93.759);

    const rawOutAmount = (inAmount * inPrice) / outPrice;
    // Non-linear price impact simulation
    const impactPct = Math.min(inAmount * 0.04, 3.5);
    const finalOutAmount = (rawOutAmount * (1 - impactPct / 100)).toFixed(outPrice > 10 ? 4 : 2);

    const isPrime = input.prime ?? true;
    const dartMode = input.dart ?? "Auto";

    return ok(
      {
        inputToken: inToken,
        outputToken: outToken,
        inputAmount: input.amount,
        outputAmount: finalOutAmount,
        rate: (inPrice / outPrice).toFixed(outPrice > 10 ? 6 : 2),
        priceImpactPercent: impactPct.toFixed(2),
        protocolFee: isPrime ? "0.00% (Prime Tier)" : "0.10%",
        routeSummary: [
          { dex: "Orca Whirlpool", sharePercent: 64, pool: `${inToken}/${outToken} 0.04%` },
          { dex: "Raydium CPMM", sharePercent: 36, pool: `${inToken}/${outToken} 0.25%` },
        ],
        dartMode,
        executionEngine: "Argos Off-Chain Optimizer + DART",
        provenance: "mock",
        simulated: true,
      },
      "mock",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const titanExplainQuote = defineTool({
  name: "titan_explain_quote",
  title: "Explain Titan Quote and Price Differences",
  description: "Explains why a user receives a certain amount of tokens, breaking down slippage, price impact, and DEX routing.",
  inputSchema: {
    inputToken: z.string(),
    outputToken: z.string(),
    expectedOutput: z.string().optional(),
    priceImpact: z.string().optional(),
  },
  readOnly: true,
  handler: async (input) => {
    return ok(
      {
        summary: `When swapping ${input.inputToken} for ${input.outputToken}, your final tokens are calculated based on market depth and DEX routing.`,
        factors: [
          "Exchange Rate: The relative market price between the two tokens.",
          `Price Impact (${input.priceImpact ?? "0.04%"}): Larger orders push against pool liquidity, slightly shifting the effective price.`,
          "Routing: Titan splits orders across multiple DEXs (Orca, Raydium, Phoenix) via Argos to maximize return.",
          "DART: Dynamic Adaptive Routing checks pool liquidity on-chain right before execution.",
          "Protocol Fee: 0% in Prime mode.",
        ],
      },
      "static-docs",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const titanExplainSlippage = defineTool({
  name: "titan_explain_slippage",
  title: "Explain Slippage Tolerance",
  description: "Explains what slippage is, recommended presets, and how Titan protects trades against MEV sandwich bots.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        concept: TITAN_DOCS.keyConcepts.slippage.summary,
        recommendations: {
          basePairs: "0.5% (50 bps) recommended for SOL, USDC, USDT",
          volatileTokens: "1.0% - 2.5% for high-beta and memecoins",
          stablePairs: "0.05% - 0.1% for stablecoins (USDC/USDT)",
        },
        mevProtection:
          "In Titan Prime mode, orders are routed through private bundles (Nozomi/Jito) so sandwich bots cannot manipulate your trade.",
      },
      "static-docs",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const titanExplainRouting = defineTool({
  name: "titan_explain_routing",
  title: "Explain Argos & DART Routing",
  description: "Explains how Titan routes swaps across Solana liquidity pools.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        argos: TITAN_DOCS.keyConcepts.argos.summary,
        dart: TITAN_DOCS.keyConcepts.dart.summary,
        supportedVenues: ["Orca Whirlpools", "Raydium CPMM", "Raydium CLMM", "Phoenix", "Meteora DLMM", "OpenBook"],
      },
      "static-docs",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const titanExplainPrime = defineTool({
  name: "titan_explain_prime",
  title: "Explain Titan Prime Mode",
  description: "Explains the benefits and features of Titan Prime mode.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        prime: TITAN_DOCS.keyConcepts.prime.summary,
        benefits: [
          "0% Titan Protocol Fee",
          "Private relayer routing to avoid public mempool sandwich attacks",
          "Higher fill priority through Nozomi & Jito private block-space",
        ],
      },
      "static-docs",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const titanExplainLimitOrders = defineTool({
  name: "titan_explain_limit_orders",
  title: "Explain Titan Limit Orders",
  description: "Explains how limit orders work on Titan, partial fills, and the $10 minimum notional requirement.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        limitOrders: TITAN_DOCS.keyConcepts.limitOrders.summary,
        rules: [
          "Minimum order size: $10.00 equivalent value.",
          "Partial fills: Orders can fill gradually as market price matches your target.",
          "Cancellation: Open orders can be cancelled anytime without penalty.",
          "Conditional Orders: Requires a Titan embedded session wallet to hold tokens until trigger.",
        ],
      },
      "static-docs",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const titanDiagnoseError = defineTool({
  name: "titan_diagnose_error",
  title: "Diagnose Titan Trading Error",
  description: "Diagnoses common trading errors such as slippage exceeded, limit minimum notional, or insufficient SOL.",
  inputSchema: {
    errorCode: z.string().describe("Error code or symptom (e.g. slippage-exceeded, limit-min-notional, insufficient-sol)"),
  },
  readOnly: true,
  handler: async (input) => {
    const diag = TITAN_DOCS.errorDiagnoses[input.errorCode as keyof typeof TITAN_DOCS.errorDiagnoses];
    if (!diag) {
      return fail("UNKNOWN_ERROR", `Unrecognized error code: ${input.errorCode}.`);
    }
    return ok(
      {
        errorCode: input.errorCode,
        ...diag,
      },
      "static-docs",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const titanGetDocumentation = defineTool({
  name: "titan_get_documentation",
  title: "Get Titan Official Documentation Links",
  description: "Returns official Titan Exchange links and GitBook documentation references.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        links: TITAN_DOCS.officialLinks,
      },
      "static-docs",
      [TITAN_DOCS.officialLinks.docs]
    );
  },
});

export const ALL_TITAN_TOOLS = [
  titanGetQuote,
  titanExplainQuote,
  titanExplainSlippage,
  titanExplainRouting,
  titanExplainPrime,
  titanExplainLimitOrders,
  titanDiagnoseError,
  titanGetDocumentation,
];
