"use client";

import { useState } from "react";
import { ArrowUpRight, AlertTriangle, Info, CheckCircle2, Wallet, ExternalLink } from "lucide-react";
import type { UmbraStoreState, UmbraToken } from "@/lib/products/umbra/types";
import { SUPPORTED_TOKENS } from "@/lib/products/umbra/types";

interface Props {
  state: UmbraStoreState;
  onRequestApproval: (operation: "withdraw", details: { token: UmbraToken; amount: string; destination: string }) => void;
}

export function WithdrawTab({ state, onRequestApproval }: Props) {
  const [selectedToken, setSelectedToken] = useState<UmbraToken>("USDC");
  const [amount, setAmount] = useState<string>("25");
  const [customDestination, setCustomDestination] = useState<boolean>(false);
  const [destinationAddress, setDestinationAddress] = useState<string>(state.connectedAddress);

  const shieldedBalance = parseFloat(state.privateBalances[selectedToken] || "0");
  const tokenMeta = SUPPORTED_TOKENS[selectedToken];

  const handlePercentage = (pct: number) => {
    const val = ((shieldedBalance * pct) / 100).toFixed(selectedToken === "SOL" ? 4 : 2);
    setAmount(val);
  };

  const handleToggleCustom = () => {
    const next = !customDestination;
    setCustomDestination(next);
    if (!next) {
      setDestinationAddress(state.connectedAddress);
    } else {
      setDestinationAddress("");
    }
  };

  const handleInitiateWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = destinationAddress.trim() || state.connectedAddress;
    if (!amount || parseFloat(amount) <= 0 || !dest) return;
    onRequestApproval("withdraw", { token: selectedToken, amount, destination: dest });
  };

  const numericAmount = parseFloat(amount) || 0;
  const isWithdrawingToSelf = destinationAddress.trim().toLowerCase() === state.connectedAddress.toLowerCase();

  return (
    <div
      data-companion="umbra-withdraw-tab"
      className="rounded-2xl border border-violet-900/25 bg-[#0e0e16]/85 p-6 backdrop-blur-xl shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-violet-400" />
            <span>Unshield & Withdraw to Public Solana</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Exit funds from the Nimbus confidential pool back to a standard public Solana address.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs text-violet-300">
          <Wallet className="h-3.5 w-3.5" />
          <span>Exit Relayed</span>
        </div>
      </div>

      <form onSubmit={handleInitiateWithdraw} className="mt-5 space-y-5">
        {/* Asset selection and shielded balance */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Select Shielded Asset to Unshield</span>
            <span>Available in Private Pool: <strong className="text-violet-300 font-mono">{shieldedBalance} {selectedToken}</strong></span>
          </div>

          <div data-companion="umbra-withdraw-asset" className="grid grid-cols-3 gap-3">
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

        {/* Amount Input with quick percentages */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Amount to Unshield</span>
            <div className="flex items-center gap-1.5">
              {[25, 50, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  data-companion={pct === 100 ? "umbra-withdraw-max" : undefined}
                  onClick={() => handlePercentage(pct)}
                  className="rounded bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-white/70 hover:bg-white/[0.15] hover:text-white transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              data-companion="umbra-withdraw-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-4 py-3 font-mono text-lg font-medium text-white placeholder-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-white/60">
                {selectedToken}
              </span>
            </div>
          </div>
        </div>

        {/* Destination Address Input */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Destination Solana Wallet Address</span>
            <button
              type="button"
              data-companion="umbra-withdraw-dest-toggle"
              onClick={handleToggleCustom}
              className="text-[11px] text-violet-300 hover:text-violet-200 underline underline-offset-2"
            >
              {customDestination ? "Use connected wallet" : "Use a different wallet address"}
            </button>
          </div>

          <input
            type="text"
            data-companion="umbra-withdraw-destination"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder="Enter public Solana recipient address..."
            className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-4 py-3 font-mono text-xs font-medium text-white placeholder-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Unlinkability Warning Banner */}
        <div
          data-companion="umbra-withdraw-warning"
          className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs space-y-2 text-amber-200"
        >
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Documented Unlinkability Warning (Nimbus Privacy Leaks)</span>
          </div>

          {isWithdrawingToSelf ? (
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              <strong>Notice:</strong> You are withdrawing to your connected public wallet ({state.connectedAddress.slice(0, 8)}...). Withdrawing to an address already tied to you makes the withdrawal publicly attributable, regardless of what occurred inside the shielded pool.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              A withdrawal publishes the destination address, token, and exact amount on-chain. Matching amounts and close timestamps between a prior deposit and this withdrawal can allow observers to link the transactions.
            </p>
          )}
        </div>

        {/* Fee breakdown */}
        <div
          data-companion="umbra-withdraw-fee"
          className="rounded-xl border border-white/[0.05] bg-black/20 p-3 text-xs space-y-1.5 text-white/60"
        >
          <div className="flex justify-between">
            <span>Submitted By</span>
            <span className="font-mono text-white/80">Nimbus Relayer (No SOL needed from sender)</span>
          </div>
          <div className="flex justify-between">
            <span>Relayer Tip</span>
            <span className="font-mono text-emerald-400">0.00 (Sponsored by Relayer)</span>
          </div>
          <div className="flex justify-between">
            <span>Network Fee</span>
            <span className="font-mono text-white/80">Paid by relayer</span>
          </div>
          <div className="border-t border-white/[0.06] pt-1.5 flex justify-between font-medium text-white/90">
            <span>Expected Received in Public Wallet</span>
            <span className="font-mono text-violet-300">{amount || "0"} {selectedToken}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          data-companion="umbra-withdraw-confirm"
          disabled={
            numericAmount <= 0 ||
            numericAmount > shieldedBalance ||
            !destinationAddress.trim() ||
            state.currentOperation.stage === "proving" ||
            state.currentOperation.stage === "submitted"
          }
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-950/60 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Unshield & Withdraw {amount || "0"} {selectedToken} (Simulated)</span>
        </button>
      </form>
    </div>
  );
}
