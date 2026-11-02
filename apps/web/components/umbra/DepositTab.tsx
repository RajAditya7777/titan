"use client";

import { useState } from "react";
import { Shield, ArrowDownRight, Info, AlertTriangle, Wallet, CheckCircle2 } from "lucide-react";
import type { UmbraStoreState, UmbraToken } from "@/lib/products/umbra/types";
import { SUPPORTED_TOKENS } from "@/lib/products/umbra/types";
import { umbraSimulator } from "@/lib/products/umbra/simulator";

interface Props {
  state: UmbraStoreState;
  onRequestApproval: (operation: "deposit", details: { token: UmbraToken; amount: string }) => void;
}

export function DepositTab({ state, onRequestApproval }: Props) {
  const [selectedToken, setSelectedToken] = useState<UmbraToken>("USDC");
  const [amount, setAmount] = useState<string>("100");

  const publicBalance = parseFloat(state.publicBalances[selectedToken] || "0");
  const tokenMeta = SUPPORTED_TOKENS[selectedToken];

  const handleMax = () => {
    // If native SOL, leave 0.05 for tx fees
    if (selectedToken === "SOL") {
      setAmount(Math.max(0, publicBalance - 0.05).toFixed(4));
    } else {
      setAmount(publicBalance.toString());
    }
  };

  const handleInitiateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onRequestApproval("deposit", { token: selectedToken, amount });
  };

  const numericAmount = parseFloat(amount) || 0;
  const protocolFee = (numericAmount * 0.001).toFixed(selectedToken === "SOL" ? 4 : 2);
  const netShielded = Math.max(0, numericAmount - parseFloat(protocolFee)).toFixed(
    selectedToken === "SOL" ? 4 : 2,
  );

  return (
    <div
      data-companion="umbra-deposit-tab"
      className="rounded-2xl border border-violet-900/25 bg-[#0e0e16]/85 p-6 backdrop-blur-xl shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-400" />
            <span>Shield Tokens into Nimbus Pool</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Move assets from your public Solana wallet into private balance notes.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs text-violet-300">
          <Wallet className="h-3.5 w-3.5" />
          <span>From: {state.connectedAddress.slice(0, 4)}...{state.connectedAddress.slice(-4)}</span>
        </div>
      </div>

      <form onSubmit={handleInitiateDeposit} className="mt-5 space-y-5">
        {/* Asset selection and balance */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Select Asset</span>
            <span>Available in Public Wallet: <strong className="text-white/90 font-mono">{publicBalance} {selectedToken}</strong></span>
          </div>

          <div data-companion="umbra-deposit-asset" className="grid grid-cols-3 gap-3">
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
                  <span className="text-[10px] text-white/40 mt-0.5">{SUPPORTED_TOKENS[t].name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Amount to Shield</span>
            <span className="text-[11px] text-white/40">≈ ${(numericAmount * tokenMeta.rateUsd).toFixed(2)} USD</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              data-companion="umbra-deposit-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-white/[0.1] bg-black/50 px-4 py-3 font-mono text-lg font-medium text-white placeholder-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <button
                type="button"
                data-companion="umbra-deposit-max"
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

        {/* Privacy Explanation Breakdown */}
        <div
          data-companion="umbra-deposit-breakdown"
          className="rounded-xl border border-white/[0.07] bg-black/40 p-4 text-xs space-y-2.5"
        >
          <div className="flex items-center gap-1.5 font-medium text-white/80">
            <Info className="h-4 w-4 text-violet-400" />
            <span>Deposit Visibility Breakdown (Nimbus Protocol)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5">
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Public on Solana
              </span>
              <p className="mt-1 text-[11px] text-white/70 leading-relaxed">
                Depositing wallet ({state.connectedAddress.slice(0, 6)}...), exact token ({selectedToken}), and amount ({amount}) are visible on-chain.
              </p>
            </div>

            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
              <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Shielded Inside Pool
              </span>
              <p className="mt-1 text-[11px] text-white/70 leading-relaxed">
                Created notes, internal note nullifiers, and subsequent private transfers remain confidential.
              </p>
            </div>
          </div>
        </div>

        {/* Fee breakdown */}
        <div
          data-companion="umbra-deposit-fee"
          className="rounded-xl border border-white/[0.05] bg-black/20 p-3 text-xs space-y-1.5 text-white/60"
        >
          <div className="flex justify-between">
            <span>Solana Network Fee</span>
            <span className="font-mono text-white/80">~0.000005 SOL</span>
          </div>
          <div className="flex justify-between">
            <span>Protocol Fee (0.1%)</span>
            <span className="font-mono text-white/80">{protocolFee} {selectedToken}</span>
          </div>
          <div className="flex justify-between">
            <span>Relayer Tip</span>
            <span className="font-mono text-emerald-400">0.00 (Relayer sponsored)</span>
          </div>
          <div className="border-t border-white/[0.06] pt-1.5 flex justify-between font-medium text-white/90">
            <span>Net Shielded to Note Store</span>
            <span className="font-mono text-violet-300">{netShielded} {selectedToken}</span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          data-companion="umbra-deposit-confirm"
          disabled={numericAmount <= 0 || numericAmount > publicBalance || state.currentOperation.stage === "proving" || state.currentOperation.stage === "submitted"}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-950/60 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shield className="h-4 w-4" />
          <span>Shield {amount || "0"} {selectedToken} (Simulated)</span>
        </button>
      </form>
    </div>
  );
}
