"use client";

import { useState } from "react";
import { X, ArrowDown, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { formatUsd } from "@/lib/products/titan/tokens";

export function ReviewSwapModal() {
  const {
    reviewModalOpen,
    setReviewModalOpen,
    inputToken,
    outputToken,
    amount,
    quote,
    prime,
    slippageSettings,
  } = useTitan();

  const [isApproved, setIsApproved] = useState(false);

  if (!reviewModalOpen) return null;

  const inUsd = (parseFloat(amount) || 0) * inputToken.usdPrice;
  const outUsd = (parseFloat(quote?.outAmount || "0")) * outputToken.usdPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151513] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-white">Review Swap</h3>
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-[#f2d363] border border-amber-500/30">
              Simulated
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setReviewModalOpen(false);
              setIsApproved(false);
            }}
            className="rounded-full p-1 text-[#a8a69f] hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isApproved ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#00d692]/15 text-[#00d692] border border-[#00d692]/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-white">Simulated Swap Approved!</h4>
            <p className="text-xs text-[#a8a69f] max-w-xs mx-auto">
              In a live environment, your Solana wallet would sign this transaction. The companion halts here to guarantee non-custodial safety.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setReviewModalOpen(false);
                  setIsApproved(false);
                }}
                className="rounded-xl bg-[#20201d] px-6 py-2 text-xs font-semibold text-white hover:bg-[#2b2927] border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Swap Exchange Summary */}
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#20201d] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a8a69f]">You pay</span>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-white">
                    {amount} {inputToken.symbol}
                  </div>
                  <div className="text-[11px] text-[#78766d]">{formatUsd(inUsd)}</div>
                </div>
              </div>

              <div className="flex justify-center my-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2b2927] text-[#f2d363]">
                  <ArrowDown className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a8a69f]">You receive (est.)</span>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-[#f2d363]">
                    {quote?.outAmount} {outputToken.symbol}
                  </div>
                  <div className="text-[11px] text-[#78766d]">{formatUsd(outUsd)}</div>
                </div>
              </div>
            </div>

            {/* Transaction Parameters */}
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#1a1917] p-3 text-xs">
              <div className="flex justify-between text-[#a8a69f]">
                <span>Rate</span>
                <span className="font-mono text-white">
                  1 {inputToken.symbol} ≈ {quote?.rate.toFixed(4)} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-[#a8a69f]">
                <span>Minimum Received</span>
                <span className="font-mono text-white">
                  {quote?.minReceived} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-[#a8a69f]">
                <span>Price Impact</span>
                <span className="font-mono text-[#00d692]">
                  {quote?.priceImpactPct}% (Optimal)
                </span>
              </div>
              <div className="flex justify-between text-[#a8a69f]">
                <span>Routing Algorithm</span>
                <span className="font-mono text-[#f2d363] text-[11px]">
                  {quote?.routeSummary}
                </span>
              </div>
              <div className="flex justify-between text-[#a8a69f]">
                <span>Titan Protocol Fee</span>
                <span className="font-mono text-[#00d692]">
                  {prime ? "0.00% (Prime Active)" : "0.05%"}
                </span>
              </div>
              <div className="flex justify-between text-[#a8a69f]">
                <span>Estimated Network Fee</span>
                <span className="font-mono text-white">~0.000005 SOL ($0.0009)</span>
              </div>
            </div>

            {/* Non-Custodial Safety Disclaimer */}
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-[11px] text-[#f2d363]">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#f2d363]" />
              <div>
                <span className="font-semibold">Independent Demo Verification:</span> The companion guide will spotlight this button and stop. Only you can confirm actions in your wallet.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="flex-1 rounded-xl border border-white/10 bg-[#20201d] py-2.5 text-center text-xs font-medium text-white hover:bg-[#2b2927] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-companion="titan-swap-sign"
                onClick={() => setIsApproved(true)}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#f2d363] to-[#e5c345] py-2.5 text-center text-xs font-semibold text-[#100e0a] hover:from-[#ffe175] hover:to-[#f2d363] transition-all shadow-[0_0_20px_rgba(242,211,99,0.3)] active:scale-98"
              >
                Approve in wallet (simulated)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
