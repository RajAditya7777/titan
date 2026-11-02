"use client";

import { useState } from "react";
import { Send, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, UserCheck, UserX, Info, Lock } from "lucide-react";
import type { UmbraStoreState, UmbraToken } from "@/lib/products/umbra/types";
import { DEMO_RECIPIENTS, SUPPORTED_TOKENS } from "@/lib/products/umbra/types";
import { umbraSimulator } from "@/lib/products/umbra/simulator";

interface Props {
  state: UmbraStoreState;
  onRequestApproval: (operation: "private_send", details: { token: UmbraToken; amount: string; recipient: string }) => void;
}

export function PrivateSendTab({ state, onRequestApproval }: Props) {
  const [selectedToken, setSelectedToken] = useState<UmbraToken>("USDC");
  const [amount, setAmount] = useState<string>("50");
  const [recipient, setRecipient] = useState<string>(DEMO_RECIPIENTS[0]?.address ?? "");

  const shieldedBalance = parseFloat(state.privateBalances[selectedToken] || "0");
  const recipientProfile = umbraSimulator.checkRecipientRegistration(recipient);
  const isRegisteredRecipient = recipientProfile?.status === "registered";

  const handleMax = () => {
    setAmount(shieldedBalance.toString());
  };

  const handleAutofillAlice = () => {
    if (DEMO_RECIPIENTS[0]) setRecipient(DEMO_RECIPIENTS[0].address);
  };

  const handleAutofillBob = () => {
    if (DEMO_RECIPIENTS[1]) setRecipient(DEMO_RECIPIENTS[1].address);
  };

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !recipient) return;
    onRequestApproval("private_send", { token: selectedToken, amount, recipient });
  };

  const numericAmount = parseFloat(amount) || 0;

  return (
    <div
      data-companion="umbra-send-tab"
      className="rounded-2xl border border-violet-900/25 bg-[#0e0e16]/85 p-6 backdrop-blur-xl shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-violet-400" />
            <span>Private Transfer (Nimbus Relayed)</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Confidential zero-knowledge transaction. The sender and amount remain hidden on-chain.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Shielded Pool Active</span>
        </div>
      </div>

      <form onSubmit={handleInitiateSend} className="mt-5 space-y-5">
        {/* Registration prerequisite banner if not registered */}
        {!state.registered && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <strong className="font-semibold">Your account must be registered:</strong> In Nimbus, spending from the private pool requires a registered identity commitment.
            </div>
          </div>
        )}

        {/* Asset selector & shielded balance */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Select Shielded Asset</span>
            <span>Available in Private Pool: <strong className="text-violet-300 font-mono">{shieldedBalance} {selectedToken}</strong></span>
          </div>

          <div data-companion="umbra-send-asset" className="grid grid-cols-3 gap-3">
            {(["USDC", "USDT", "SOL"] as UmbraToken[]).map((t) => {
              const isSelected = selectedToken === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedToken(t)}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 border text-center transition-all ${
                    isSelected
                      ? "border-violet-500 bg-violet-600/20 text-white shadow-lg shadow-violet-950/50"
                      : "border-white/[0.08] bg-black/40 text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className="font-mono text-sm font-semibold">{t}</span>
                  <span className="text-[10px] text-white/40 mt-0.5">Shielded Notes</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipient Address */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Recipient Address (Private Account / Registered Address)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/40">Demo autofill:</span>
              <button
                type="button"
                data-companion="umbra-send-shortcut-alice"
                onClick={handleAutofillAlice}
                className="rounded bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-300 hover:bg-violet-500/30 transition-colors"
              >
                Alice (Registered)
              </button>
              <button
                type="button"
                data-companion="umbra-send-shortcut-bob"
                onClick={handleAutofillBob}
                className="rounded bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] text-white/60 hover:bg-white/[0.12] transition-colors"
              >
                Bob (Unregistered)
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              data-companion="umbra-send-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient's registered Nimbus address..."
              className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-4 py-3 font-mono text-xs font-medium text-white placeholder-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all pr-10"
            />
            <div className="absolute right-3 top-3.5 text-white/30">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          {/* Recipient status check */}
          <div data-companion="umbra-send-recipient-status" className="mt-2">
            {recipient && (
              isRegisteredRecipient ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    <strong>{recipientProfile?.label}:</strong> Verified registered Nimbus account. Ready for private transfer.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                  <UserX className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Unregistered Recipient ({recipientProfile?.label || "Unknown"}):</strong>
                    <span>
                      Nimbus confidential transfers require the recipient to register first to publish their ML-KEM encryption key. To test a successful transfer, use registered Alice.
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Amount to Send Privately</span>
            <span className="text-[11px] text-white/40">≈ ${(numericAmount * SUPPORTED_TOKENS[selectedToken].rateUsd).toFixed(2)} USD</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              data-companion="umbra-send-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-4 py-3 font-mono text-lg font-medium text-white placeholder-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <button
                type="button"
                data-companion="umbra-send-max"
                onClick={handleMax}
                className="rounded-lg bg-white/[0.08] px-2.5 py-1 text-xs font-semibold text-violet-300 hover:bg-white/[0.15] transition-colors"
              >
                MAX
              </button>
              <span className="font-mono text-xs font-semibold text-white/60 border-l border-white/10 pl-2">
                {selectedToken}
              </span>
            </div>
          </div>
        </div>

        {/* Transfer Privacy Breakdown */}
        <div
          data-companion="umbra-send-privacy-breakdown"
          className="rounded-xl border border-white/[0.07] bg-black/40 p-4 text-xs space-y-2.5"
        >
          <div className="flex items-center gap-1.5 font-medium text-white/80">
            <Info className="h-4 w-4 text-violet-400" />
            <span>Private Transfer Privacy Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
              <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Shielded from Chain Observers
              </span>
              <ul className="mt-1 space-y-1 text-[11px] text-white/70 list-disc list-inside">
                <li>Sender wallet identity</li>
                <li>Recipient address inside pool</li>
                <li>Transferred amount and asset</li>
              </ul>
            </div>

            <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2.5">
              <span className="text-[11px] font-semibold text-violet-300 flex items-center gap-1">
                <Info className="h-3 w-3" /> Public on Solana
              </span>
              <ul className="mt-1 space-y-1 text-[11px] text-white/70 list-disc list-inside">
                <li>Nimbus Relayer submission</li>
                <li>Transaction timestamp & slot</li>
                <li>CipherOwl perimeter co-signature</li>
              </ul>
            </div>
          </div>

          <div className="text-[11px] text-white/50 pt-1 border-t border-white/[0.04]">
            <em>Notice:</em> The recipient can identify the sender from the note&apos;s internal &apos;funded by&apos; commitment.
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          data-companion="umbra-send-confirm"
          disabled={
            !state.registered ||
            numericAmount <= 0 ||
            numericAmount > shieldedBalance ||
            !recipient.trim() ||
            !isRegisteredRecipient ||
            state.currentOperation.stage === "proving" ||
            state.currentOperation.stage === "submitted"
          }
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-950/60 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          <span>Send {amount || "0"} {selectedToken} Privately (Relayed)</span>
        </button>
      </form>
    </div>
  );
}
