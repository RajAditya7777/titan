import type {
  OperationStage,
  OperationType,
  RecipientProfile,
  UmbraErrorCode,
  UmbraHistoryItem,
  UmbraStoreState,
  UmbraToken,
} from "./types";
import { DEMO_RECIPIENTS, SUPPORTED_TOKENS } from "./types";

const STORAGE_KEY = "umbra_simulator_state_v1";

const INITIAL_STATE: UmbraStoreState = {
  walletConnected: true,
  connectedAddress: "7XwK1Pvy9Vz9bL3R5eU7xP4yK8T1m9zQL",
  registered: false,
  platformWallet: null,
  identityCommitment: null,
  synced: true,
  noteCount: 3,
  publicBalances: {
    SOL: "12.45",
    USDC: "1500.00",
    USDT: "850.00",
  },
  privateBalances: {
    SOL: "4.50",
    USDC: "600.00",
    USDT: "200.00",
  },
  history: [
    {
      id: "tx-init-1",
      type: "deposit",
      token: "USDC",
      amount: "600.00",
      timestamp: Date.now() - 3600_000 * 4,
      status: "confirmed",
      txHash: "5KtP9xKqE2L...3jY8",
      provenance: "simulated",
    },
    {
      id: "tx-init-2",
      type: "deposit",
      token: "SOL",
      amount: "4.50",
      timestamp: Date.now() - 3600_000 * 12,
      status: "confirmed",
      txHash: "3mZn8yXpA1B...9tW2",
      provenance: "simulated",
    },
  ],
  currentOperation: {
    type: null,
    stage: "idle",
    progressPercent: 0,
    stageMessage: "Ready",
    error: null,
  },
};

function loadStoredState(): UmbraStoreState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<UmbraStoreState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      currentOperation: { ...INITIAL_STATE.currentOperation }, // Reset in-flight ops on load
    };
  } catch {
    return INITIAL_STATE;
  }
}

function saveState(state: UmbraStoreState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // SessionStorage quota exceeded or disabled
  }
}

type Listener = (state: UmbraStoreState) => void;

class UmbraSimulator {
  private state: UmbraStoreState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = loadStoredState();
  }

  public getState(): UmbraStoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    saveState(this.state);
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error("UmbraSimulator listener error:", err);
      }
    }
  }

  private updateState(fn: (prev: UmbraStoreState) => UmbraStoreState): void {
    this.state = fn(this.state);
    this.notify();
  }

  private sleep(ms: number): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return new Promise((resolve) => setTimeout(resolve, 5));
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public setWalletConnected(connected: boolean): void {
    this.updateState((prev) => ({
      ...prev,
      walletConnected: connected,
    }));
  }

  public reset(): void {
    this.state = {
      ...INITIAL_STATE,
      history: [...INITIAL_STATE.history],
      currentOperation: { ...INITIAL_STATE.currentOperation },
    };
    this.notify();
  }

  /**
   * Check whether a recipient address is registered in the Nimbus account registry.
   */
  public checkRecipientRegistration(address: string): RecipientProfile | null {
    const trimmed = address.trim();
    if (!trimmed) return null;
    const found = DEMO_RECIPIENTS.find(
      (r) => r.address.toLowerCase() === trimmed.toLowerCase() || r.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (found) return found;

    // Unknown address heuristic: if address starts with 9, simulate registered; if 3, simulate unregistered
    if (trimmed.startsWith("9") || trimmed.startsWith("Nimb")) {
      return {
        address: trimmed,
        label: "External Nimbus Account",
        status: "registered",
        description: "Verified active platform wallet in Nimbus on-chain registry.",
      };
    }
    return {
      address: trimmed,
      label: "Solana Address",
      status: "unregistered",
      description: "Standard Solana wallet address. Not yet registered with Nimbus.",
    };
  }

  /**
   * Derive Nimbus Private Account and register on-chain.
   * Takes ~1.5s with realistic cryptographic derivation stages.
   */
  public async register(): Promise<boolean> {
    if (!this.state.walletConnected) {
      this.setError("register", "fee-payer-unfunded", "Connect your wallet first to pay the network fee for account registration.");
      return false;
    }

    this.setOperation("register", "preparing", 15, "Deriving deterministic private account keys in browser...");
    await this.sleep(400);

    this.setOperation("register", "proving", 50, "Generating platform wallet and ML-KEM identity commitment...");
    await this.sleep(600);

    this.setOperation("register", "submitted", 80, "Broadcasting user registry binding transaction to Solana...");
    await this.sleep(500);

    const platformWallet = "4vK2DzpR5s8Kj2Lm3Qw9Yt6Xn1B8Pz7AbQ7m";
    const identityCommitment = "0x7a8ec9d21ef4890c2a849f1165bc930e428df195";

    this.updateState((prev) => ({
      ...prev,
      registered: true,
      platformWallet,
      identityCommitment,
      history: [
        {
          id: `tx-reg-${Date.now()}`,
          type: "register",
          token: "SOL",
          amount: "0.001",
          timestamp: Date.now(),
          status: "confirmed",
          txHash: "4xNq7Ym...8vT3",
          provenance: "simulated",
        },
        ...prev.history,
      ],
      currentOperation: {
        type: "register",
        stage: "done",
        progressPercent: 100,
        stageMessage: "Private Account registered! Platform wallet and identity commitment derived.",
        error: null,
        txHash: "4xNq7Ym...8vT3",
      },
    }));

    return true;
  }

  /**
   * Shield tokens: Move from public wallet into Nimbus shielded pool.
   */
  public async deposit(token: UmbraToken, amountStr: string): Promise<boolean> {
    const amount = parseFloat(amountStr);
    if (!SUPPORTED_TOKENS[token]) {
      this.setError("deposit", "mint-unsupported", `Token ${token} is not supported in the Nimbus shielded pool.`);
      return false;
    }
    if (isNaN(amount) || amount <= 0) {
      this.setError("deposit", "amount-unfundable", "Enter an amount greater than 0.");
      return false;
    }

    const currentPublic = parseFloat(this.state.publicBalances[token] || "0");
    if (amount > currentPublic) {
      this.setError("deposit", "amount-unfundable", `Insufficient public ${token} balance (Available: ${currentPublic}).`);
      return false;
    }

    this.setOperation("deposit", "preparing", 20, `Screening transaction perimeter (CipherOwl / OFAC checks)...`);
    await this.sleep(350);

    this.setOperation("deposit", "proving", 55, `Minting confidential notes into Nimbus commitment tree...`);
    await this.sleep(600);

    this.setOperation("deposit", "submitted", 85, `Submitting deposit of ${amount} ${token} to Solana mainnet...`);
    await this.sleep(500);

    const txHash = `5Dp${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`;
    const newPublic = (currentPublic - amount).toFixed(SUPPORTED_TOKENS[token].decimals === 9 ? 4 : 2);
    const newPrivate = (parseFloat(this.state.privateBalances[token] || "0") + amount).toFixed(
      SUPPORTED_TOKENS[token].decimals === 9 ? 4 : 2,
    );

    this.updateState((prev) => ({
      ...prev,
      noteCount: prev.noteCount + 1,
      publicBalances: {
        ...prev.publicBalances,
        [token]: newPublic,
      },
      privateBalances: {
        ...prev.privateBalances,
        [token]: newPrivate,
      },
      history: [
        {
          id: `tx-dep-${Date.now()}`,
          type: "deposit",
          token,
          amount: amountStr,
          timestamp: Date.now(),
          status: "confirmed",
          txHash,
          provenance: "simulated",
        },
        ...prev.history,
      ],
      currentOperation: {
        type: "deposit",
        stage: "done",
        progressPercent: 100,
        stageMessage: `Successfully shielded ${amountStr} ${token} into private pool.`,
        error: null,
        txHash,
      },
    }));

    return true;
  }

  /**
   * Private Transfer: Transact within the shielded pool via relayer.
   */
  public async privateSend(token: UmbraToken, amountStr: string, recipientAddress: string): Promise<boolean> {
    const amount = parseFloat(amountStr);

    if (!this.state.registered) {
      this.setError(
        "private_send",
        "account-unregistered",
        "Your account is not registered. You must register your private account first before sending confidential transfers.",
        "Nimbus protocol requirement: spending requires a registered identity commitment.",
      );
      return false;
    }

    if (!SUPPORTED_TOKENS[token]) {
      this.setError("private_send", "mint-unsupported", `Asset ${token} is not in the approved shielded token set.`);
      return false;
    }

    if (isNaN(amount) || amount <= 0) {
      this.setError("private_send", "amount-unfundable", "Transfer amount must be greater than 0.");
      return false;
    }

    const currentPrivate = parseFloat(this.state.privateBalances[token] || "0");
    if (amount > currentPrivate) {
      this.setError(
        "private_send",
        "amount-unfundable",
        `Insufficient shielded ${token} balance (Shielded available: ${currentPrivate} ${token}).`,
        "You can deposit additional funds in the Deposit tab first.",
      );
      return false;
    }

    const recipientProfile = this.checkRecipientRegistration(recipientAddress);
    if (!recipientProfile || recipientProfile.status !== "registered") {
      this.setError(
        "private_send",
        "recipient-unregistered",
        `Recipient ${recipientAddress.slice(0, 8)}... is not registered in the Nimbus account registry.`,
        "Nimbus transfers require registered recipients to ensure cryptographic note exchange and compliance screening.",
      );
      return false;
    }

    this.setOperation("private_send", "preparing", 20, "Encrypting payload with recipient's ML-KEM public key...");
    await this.sleep(400);

    this.setOperation("private_send", "proving", 55, "Generating zero-knowledge membership proof in browser...");
    await this.sleep(800);

    this.setOperation("private_send", "submitted", 85, "Broadcasting transaction via Nimbus Relayer network...");
    await this.sleep(600);

    const txHash = `7Rel${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`;
    const newPrivate = (currentPrivate - amount).toFixed(SUPPORTED_TOKENS[token].decimals === 9 ? 4 : 2);

    this.updateState((prev) => ({
      ...prev,
      privateBalances: {
        ...prev.privateBalances,
        [token]: newPrivate,
      },
      history: [
        {
          id: `tx-send-${Date.now()}`,
          type: "private_send",
          token,
          amount: amountStr,
          timestamp: Date.now(),
          status: "confirmed",
          recipient: recipientAddress,
          txHash,
          provenance: "simulated",
        },
        ...prev.history,
      ],
      currentOperation: {
        type: "private_send",
        stage: "done",
        progressPercent: 100,
        stageMessage: `Private transfer of ${amountStr} ${token} dispatched through relayer.`,
        error: null,
        txHash,
      },
    }));

    return true;
  }

  /**
   * Withdraw / Unshield: Move funds out of the pool back to a public address.
   */
  public async withdraw(token: UmbraToken, amountStr: string, destinationAddress: string): Promise<boolean> {
    const amount = parseFloat(amountStr);

    if (!this.state.registered) {
      this.setError("withdraw", "account-unregistered", "Your account must be registered to spend or unshield notes.");
      return false;
    }

    if (!SUPPORTED_TOKENS[token]) {
      this.setError("withdraw", "mint-unsupported", `Asset ${token} is not supported.`);
      return false;
    }

    if (isNaN(amount) || amount <= 0) {
      this.setError("withdraw", "amount-unfundable", "Amount must be greater than 0.");
      return false;
    }

    const currentPrivate = parseFloat(this.state.privateBalances[token] || "0");
    if (amount > currentPrivate) {
      this.setError("withdraw", "amount-unfundable", `Insufficient shielded ${token} balance.`);
      return false;
    }

    if (!destinationAddress.trim()) {
      this.setError("withdraw", "amount-unfundable", "Please provide a valid destination address.");
      return false;
    }

    this.setOperation("withdraw", "preparing", 20, "Preparing exit nullifiers and withdrawal note proofs...");
    await this.sleep(350);

    this.setOperation("withdraw", "proving", 55, "Synthesizing zero-knowledge unshielding proof...");
    await this.sleep(700);

    this.setOperation("withdraw", "submitted", 85, "Relayer publishing unshield transaction to Solana...");
    await this.sleep(600);

    const txHash = `4Wd${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`;
    const newPrivate = (currentPrivate - amount).toFixed(SUPPORTED_TOKENS[token].decimals === 9 ? 4 : 2);

    // If destination matches current connected public wallet, credit public balance
    const isSelf = destinationAddress.trim().toLowerCase() === this.state.connectedAddress.toLowerCase();
    const newPublic = isSelf
      ? (parseFloat(this.state.publicBalances[token] || "0") + amount).toFixed(
          SUPPORTED_TOKENS[token].decimals === 9 ? 4 : 2,
        )
      : this.state.publicBalances[token];

    this.updateState((prev) => ({
      ...prev,
      privateBalances: {
        ...prev.privateBalances,
        [token]: newPrivate,
      },
      publicBalances: {
        ...prev.publicBalances,
        [token]: newPublic,
      },
      history: [
        {
          id: `tx-wd-${Date.now()}`,
          type: "withdraw",
          token,
          amount: amountStr,
          timestamp: Date.now(),
          status: "confirmed",
          recipient: destinationAddress,
          txHash,
          provenance: "simulated",
        },
        ...prev.history,
      ],
      currentOperation: {
        type: "withdraw",
        stage: "done",
        progressPercent: 100,
        stageMessage: `Unshielded ${amountStr} ${token} to ${destinationAddress.slice(0, 6)}...`,
        error: null,
        txHash,
      },
    }));

    return true;
  }

  public async syncNoteStore(): Promise<void> {
    this.updateState((prev) => ({ ...prev, synced: false }));
    await this.sleep(600);
    this.updateState((prev) => ({ ...prev, synced: true }));
  }

  public clearOperation(): void {
    this.updateState((prev) => ({
      ...prev,
      currentOperation: {
        type: null,
        stage: "idle",
        progressPercent: 0,
        stageMessage: "Ready",
        error: null,
      },
    }));
  }

  private setOperation(type: OperationType, stage: OperationStage, progress: number, message: string): void {
    this.updateState((prev) => ({
      ...prev,
      currentOperation: {
        type,
        stage,
        progressPercent: progress,
        stageMessage: message,
        error: null,
      },
    }));
  }

  private setError(type: OperationType, code: UmbraErrorCode, message: string, technicalDetail?: string): void {
    this.updateState((prev) => ({
      ...prev,
      currentOperation: {
        type,
        stage: "error",
        progressPercent: 0,
        stageMessage: message,
        error: { code, message, technicalDetail },
      },
    }));
  }
}

export const umbraSimulator = new UmbraSimulator();
