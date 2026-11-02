export const UMBRA_DOCS = {
  appName: "Umbra Privacy",
  protocolName: "Nimbus",
  relationship:
    "Umbra is the user-facing privacy interface, whereas Nimbus is the underlying cryptographic privacy protocol and SDK on Solana.",
  officialLinks: {
    website: "https://www.umbraprivacy.com/",
    legacyApp: "https://v2.umbraprivacy.com/",
    docs: "https://docs.nimbusprivacy.xyz/",
    sdkDocs: "https://sdk.nimbusprivacy.xyz/",
  },
  supportedTokens: [
    { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
    { symbol: "SOL", name: "Wrapped SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 },
  ],
  privacyMatrix: {
    register: {
      hidden: ["Spending key material (derived client-side, never broadcast)"],
      public: ["Wallet public address", "Derived platform public key on Solana registry"],
      caveats: ["Your registering wallet is publicly linked to the platform public key on-chain."],
    },
    deposit: {
      hidden: ["Internal note commitment inside the shielded pool"],
      public: ["Funding wallet address", "Token mint", "Exact deposit amount", "Deposit timestamp"],
      caveats: [
        "Deposits to the shielded pool are completely public transactions. Unlinkability only begins for transfers occurring inside the pool.",
      ],
    },
    private_send: {
      hidden: ["Sender identity", "Recipient identity (stealth key exchange)", "Transfer amount", "Asset type"],
      public: ["Relayer transaction signature", "Gas fee paid by relayer", "Timestamp of relayer broadcast"],
      caveats: [
        "Both sender and recipient must have registered Nimbus accounts.",
        "Correlation attacks are possible if transferring unique or rare token amounts immediately after depositing.",
      ],
    },
    withdraw: {
      hidden: ["Source note identity inside the pool"],
      public: ["Destination wallet address", "Token mint", "Withdrawal amount", "Relayer signature"],
      caveats: [
        "Withdrawing to an address publicly linked to your KYC or identity breaks transaction privacy.",
        "Withdrawing the exact same amount shortly after depositing allows timing and amount correlation.",
      ],
    },
  },
  errorDiagnoses: {
    "account-unregistered": {
      title: "Nimbus Account Not Registered",
      description: "The sender wallet has not derived and registered its Nimbus encryption keys on-chain.",
      resolution: "Click 'Register Account' in the Account Status panel to register encryption keys.",
    },
    "recipient-unregistered": {
      title: "Recipient Not Registered",
      description: "The recipient wallet has not registered with Nimbus. Nimbus requires registered recipients to look up ML-KEM public keys for stealth encryption.",
      resolution: "Ask the recipient to connect to Nimbus and register their account first, or use a registered recipient address (e.g. Alice in demo).",
    },
    "amount-unfundable": {
      title: "Insufficient Shielded Balance",
      description: "The requested private transfer amount exceeds your available private shielded balance.",
      resolution: "Shield more tokens via the Deposit tab or decrease the transfer amount.",
    },
    "mint-unsupported": {
      title: "Token Mint Not Supported",
      description: "The selected token is not supported by the Nimbus shielded pool.",
      resolution: "Use supported SPL tokens: USDC, USDT, or SOL.",
    },
    "proof-generation-failed": {
      title: "ZK Proof Generation Failed",
      description: "The client-side zero-knowledge proof generation encountered an error or timeout.",
      resolution: "Check browser memory, ensure WASM is supported, and retry the operation.",
    },
  },
} as const;
