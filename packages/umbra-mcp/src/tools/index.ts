import { defineTool, ok, fail } from "@companion/mcp-kit";
import { z } from "zod";
import { UMBRA_DOCS } from "../knowledge/docs";

export const umbraProductInfo = defineTool({
  name: "umbra_product_info",
  title: "Umbra & Nimbus Product Information",
  description: "Explains Umbra Privacy and the underlying Nimbus protocol on Solana.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        appName: UMBRA_DOCS.appName,
        protocolName: UMBRA_DOCS.protocolName,
        relationship: UMBRA_DOCS.relationship,
        overview:
          "Umbra provides confidential SPL token transfers on Solana using the Nimbus zero-knowledge shielded pool. All key derivation happens client-side; private spending keys are never exposed.",
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraRegistrationGuidance = defineTool({
  name: "umbra_registration_guidance",
  title: "Umbra Account Registration Guidance",
  description: "Guides the user on how to derive and register their Nimbus privacy keys on Solana.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        stepCount: 2,
        steps: [
          "Connect your Solana wallet to the Umbra application.",
          "Click 'Register Account' in the Account Status panel to derive your client-side keys and publish your platform encryption key to the Solana registry.",
        ],
        safetyNotice:
          "Your wallet will sign an off-chain message to derive the keypair. No funds or seed phrases are transferred.",
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraDepositGuidance = defineTool({
  name: "umbra_deposit_guidance",
  title: "Umbra Deposit & Shield Guidance",
  description: "Explains how to shield public SPL tokens into the private Nimbus pool.",
  inputSchema: {
    token: z.string().optional().describe("Token symbol (USDC, USDT, or SOL)"),
  },
  readOnly: true,
  handler: async (input) => {
    return ok(
      {
        asset: input.token ?? "USDC",
        steps: [
          "Navigate to the Deposit tab.",
          "Select the token and enter the amount you wish to shield.",
          "Review the deposit breakdown: note that the funding transaction is public on-chain.",
          "Confirm the deposit transaction in your wallet.",
        ],
        transparency:
          "Once deposited, the funds are held as encrypted private notes. Confidential transfers within the pool do not link back to this deposit.",
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraPrivateTransferGuidance = defineTool({
  name: "umbra_private_transfer_guidance",
  title: "Umbra Private Send Guidance",
  description: "Explains how to send tokens privately inside the Nimbus shielded pool.",
  inputSchema: {
    recipient: z.string().optional().describe("Recipient public key or stealth address"),
  },
  readOnly: true,
  handler: async (input) => {
    return ok(
      {
        recipient: input.recipient ?? "Registered recipient",
        prerequisites: [
          "Sender wallet must have a registered Nimbus account with shielded balance.",
          "Recipient wallet MUST also be registered with Nimbus to decrypt incoming notes via ML-KEM keys.",
        ],
        steps: [
          "Navigate to the Private Send tab.",
          "Enter the registered recipient address or select a verified contact.",
          "Specify the transfer amount.",
          "Wait for client-side zero-knowledge proof generation.",
          "The transaction is relayed through a privacy relayer so sender address is omitted on-chain.",
        ],
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraWithdrawalGuidance = defineTool({
  name: "umbra_withdrawal_guidance",
  title: "Umbra Withdrawal Guidance",
  description: "Explains how to unshield funds from the private pool back to a public Solana wallet.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        steps: [
          "Navigate to the Withdraw tab.",
          "Select the asset and enter amount to unshield.",
          "Provide destination Solana address (or withdraw back to your current wallet).",
          "Generate client-side zk-proof of valid note nullification.",
          "Relayer submits the unshield transaction to Solana.",
        ],
        privacyCaveat:
          "Withdrawing to an exchange account or identity-linked address allows observers to associate those funds with your identity.",
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraSupportedTokens = defineTool({
  name: "umbra_supported_tokens",
  title: "Umbra Supported Tokens",
  description: "Returns the verified list of SPL tokens supported by the Nimbus shielded pool.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        tokens: UMBRA_DOCS.supportedTokens,
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraPrivacyReport = defineTool({
  name: "umbra_privacy_report",
  title: "Umbra Privacy Transparency Report",
  description: "Reports what data is shielded vs publicly visible for an operation, and documented privacy limitations.",
  inputSchema: {
    operation: z.enum(["register", "deposit", "private_send", "withdraw"]).describe("The operation to analyze"),
  },
  readOnly: true,
  handler: async (input) => {
    const report = UMBRA_DOCS.privacyMatrix[input.operation];
    return ok(
      {
        operation: input.operation,
        hidden: report.hidden,
        public: report.public,
        caveats: report.caveats,
        disclaimer:
          "Nimbus provides cryptographic confidentiality for transactions within the shielded pool. Users must remain mindful of metadata leakage from external factors such as traffic analysis or linking withdrawal addresses to known identities.",
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraCheckTransferReadiness = defineTool({
  name: "umbra_check_transfer_readiness",
  title: "Umbra Check Transfer Readiness",
  description: "Checks if a private transfer can proceed and returns ordered blockers using official Nimbus error codes.",
  inputSchema: {
    senderRegistered: z.boolean().describe("Whether sender has registered with Nimbus"),
    recipientRegistered: z.boolean().describe("Whether recipient has registered with Nimbus"),
    privateBalance: z.number().describe("Sender's current private shielded balance"),
    amount: z.number().describe("Amount to send"),
    token: z.string().describe("Token symbol (USDC, USDT, SOL)"),
  },
  readOnly: true,
  handler: async (input) => {
    const blockers: string[] = [];
    const supportedSymbols: readonly string[] = UMBRA_DOCS.supportedTokens.map((t) => t.symbol);

    if (!supportedSymbols.includes(input.token.toUpperCase())) {
      blockers.push("mint-unsupported");
    }
    if (!input.senderRegistered) {
      blockers.push("account-unregistered");
    }
    if (!input.recipientRegistered) {
      blockers.push("recipient-unregistered");
    }
    if (input.privateBalance < input.amount) {
      blockers.push("amount-unfundable");
    }

    const ready = blockers.length === 0;
    return ok(
      {
        ready,
        blockers,
        nextAction: ready
          ? "Ready to execute private transfer."
          : `Blocker: ${blockers[0]} — ${UMBRA_DOCS.errorDiagnoses[blockers[0] as keyof typeof UMBRA_DOCS.errorDiagnoses]?.description ?? blockers[0]}`,
      },
      "derived",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraDiagnoseError = defineTool({
  name: "umbra_diagnose_error",
  title: "Umbra Diagnose Error",
  description: "Diagnoses an error code returned by the Umbra interface or Nimbus SDK.",
  inputSchema: {
    errorCode: z.string().describe("The error code (e.g. account-unregistered, recipient-unregistered, amount-unfundable)"),
  },
  readOnly: true,
  handler: async (input) => {
    const diagnosis = UMBRA_DOCS.errorDiagnoses[input.errorCode as keyof typeof UMBRA_DOCS.errorDiagnoses];
    if (!diagnosis) {
      return fail("UNKNOWN_ERROR_CODE", `Unrecognized error code: ${input.errorCode}. Check documentation.`);
    }
    return ok(
      {
        errorCode: input.errorCode,
        ...diagnosis,
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const umbraGetDocumentation = defineTool({
  name: "umbra_get_documentation",
  title: "Umbra Get Documentation",
  description: "Retrieves official documentation references and links for Umbra & Nimbus.",
  inputSchema: {},
  readOnly: true,
  handler: async () => {
    return ok(
      {
        links: UMBRA_DOCS.officialLinks,
      },
      "static-docs",
      [UMBRA_DOCS.officialLinks.docs]
    );
  },
});

export const ALL_UMBRA_TOOLS = [
  umbraProductInfo,
  umbraRegistrationGuidance,
  umbraDepositGuidance,
  umbraPrivateTransferGuidance,
  umbraWithdrawalGuidance,
  umbraSupportedTokens,
  umbraPrivacyReport,
  umbraCheckTransferReadiness,
  umbraDiagnoseError,
  umbraGetDocumentation,
];
