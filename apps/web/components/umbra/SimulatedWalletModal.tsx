"use client";

import { Shield, AlertCircle, Check, X, Lock } from "lucide-react";
import type { OperationType, UmbraToken } from "@/lib/products/umbra/types";
import { SUPPORTED_TOKENS } from "@/lib/products/umbra/types";

interface Props {
  isOpen: boolean;
  operation: OperationType;
  details: {
    token: UmbraToken;
    amount: string;
    recipient?: string;
    destination?: string;
  };
  onApprove: () => void;
  onReject: () => void;
}

export function SimulatedWalletModal({ isOpen, operation, details, onApprove, onReject }: Props) {
  if (!isOpen) return null;

  const approveCompanionId =
    operation === "deposit"
      ? "umbra-deposit-approve"
      : operation === "private_send"
      ? "umbra-send-approve"
      : "umbra-withdraw-approve";

  const tokenMeta = SUPPORTED_TOKENS[details.token];
  const title =
    operation === "deposit"
      ? "Approve Shielding Transaction"
      : operation === "private_send"
      ? "Approve Confidential Transfer"
      : "Approve Unshielding Withdrawal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/30 bg-[#0d0d15] shadow-2xl shadow-violet-950/80">
        {/* Banner */}
        <div className="bg-gradient-to-r from-violet-900/60 to-indigo-900/60 px-4 py-2.5 text-center text-[11px] font-semibold tracking-wider text-violet-200 border-b border-violet-500/20 uppercase">
          Simulated Wallet Modal · Solana Summit Demo
        </div>

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <span className="text-[11px] text-white/50">Simulated Phantom / Solflare Signer</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onReject}
              className="rounded-lg p-1 text-white/40 hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Transaction details card */}
        <div className="px-5 py-3">
          <div className="rounded-xl border border-white/[0.08] bg-black/50 p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
              <span className="text-white/50">Operation</span>
              <span className="font-semibold text-white capitalize">{operation.replace("_", " ")}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/50">Amount</span>
              <div className="text-right">
                <span className="font-mono text-sm font-semibold text-white">
                  {details.amount} {details.token}
                </span>
                <span className="block text-[10px] text-white/40">
                  ≈ ${(parseFloat(details.amount || "0") * tokenMeta.rateUsd).toFixed(2)} USD
                </span>
              </div>
            </div>

            {details.recipient && (
              <div className="flex justify-between items-center">
                <span className="text-white/50">Recipient</span>
                <span className="font-mono text-[11px] text-violet-300">
                  {details.recipient.slice(0, 8)}...{details.recipient.slice(-6)}
                </span>
              </div>
            )}

            {details.destination && (
              <div className="flex justify-between items-center">
                <span className="text-white/50">Destination</span>
                <span className="font-mono text-[11px] text-violet-300">
                  {details.destination.slice(0, 8)}...{details.destination.slice(-6)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
              <span className="text-white/50">Network Fee</span>
              <span className="font-mono text-emerald-400">~0.000005 SOL</span>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-950/30 border border-violet-800/20 p-2.5 text-[11px] text-violet-300/80">
            <AlertCircle className="h-4 w-4 shrink-0 text-violet-400 mt-0.5" />
            <span>
              This is a sandbox simulation. No private keys are requested, no real funds are touched, and no transaction is dispatched to mainnet.
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 pt-2 flex gap-3">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            Reject
          </button>
          <button
            type="button"
            data-companion={approveCompanionId}
            onClick={onApprove}
            className="flex-[2] flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/50 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] transition-all"
          >
            <Check className="h-4 w-4" />
            <span>Approve (Simulated Demo)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
