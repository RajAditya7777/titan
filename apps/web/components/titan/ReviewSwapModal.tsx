"use client";

import { useState } from "react";
import { X, ArrowDown, ShieldAlert, CheckCircle2, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
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
    addTradeToHistory,
  } = useTitan();

  const [isApproved, setIsApproved] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  if (!reviewModalOpen) return null;

  const inUsd = (parseFloat(amount) || 0) * inputToken.usdPrice;
  const outUsd = (parseFloat(quote?.outAmount || "0")) * outputToken.usdPrice;

  const handleApprove = () => {
    const sig = `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setTxSignature(sig);
    addTradeToHistory({
      inToken: inputToken.symbol,
      outToken: outputToken.symbol,
      inAmount: amount,
      outAmount: quote?.outAmount || "0",
    });
    setIsApproved(true);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setReviewModalOpen(false);
          setIsApproved(false);
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#2b2927] bg-[#151513] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20201d]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Review Swap</h3>
            <span className="rounded bg-[#f2d363]/15 px-2 py-0.5 text-[10px] font-mono font-medium text-[#f2d363] border border-[#f2d363]/30">
              Titan Argos Route
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setReviewModalOpen(false);
              setIsApproved(false);
            }}
            className="rounded-full p-1 text-[#78766d] hover:text-white hover:bg-[#20201d] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isApproved ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#00d692]/15 text-[#00d692] border border-[#00d692]/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Transaction Confirmed!</h4>
              <p className="text-xs text-[#a8a69f] max-w-xs mx-auto mt-1">
                Swapped {amount} {inputToken.symbol} for {quote?.outAmount} {outputToken.symbol} via Argos & DART routing.
              </p>
            </div>

            <div className="rounded-xl border border-[#20201d] bg-[#20201d] p-3 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-[#78766d]">
                <span>Transaction Hash:</span>
                <span className="font-mono text-[#f2d363]">{txSignature.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-[#78766d]">
                <span>Protocol Fee:</span>
                <span className="text-[#00d692] font-semibold">{prime ? "0.00% (Titan Prime)" : "0.05%"}</span>
              </div>
              <div className="flex justify-between text-[#78766d]">
                <span>MEV Protection:</span>
                <span className="text-[#00d692]">Jito Bundle Landed</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <a
                href={`https://solscan.io`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#f2d363] hover:underline"
              >
                <span>View on Solscan</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setReviewModalOpen(false);
                  setIsApproved(false);
                }}
                className="w-full rounded-full bg-[#f2d363] hover:bg-[#ffe175] py-2.5 text-xs font-semibold text-[#0d0d0c] transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Swap Exchange Summary */}
            <div className="space-y-2 rounded-2xl border border-[#2b2927] bg-[#20201d] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78766d]">You pay</span>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-white">
                    {amount} {inputToken.symbol}
                  </div>
                  <div className="text-[11px] text-[#78766d]">{formatUsd(inUsd)}</div>
                </div>
              </div>

              <div className="flex justify-center my-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#151513] border border-[#2b2927] text-[#f2d363]">
                  <ArrowDown className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#78766d]">You receive (est.)</span>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-[#f2d363]">
                    {quote?.outAmount} {outputToken.symbol}
                  </div>
                  <div className="text-[11px] text-[#78766d]">{formatUsd(outUsd)}</div>
                </div>
              </div>
            </div>

            {/* Transaction Parameters */}
            <div className="space-y-2 rounded-2xl border border-[#2b2927] bg-[#1a1917] p-3 text-xs">
              <div className="flex justify-between text-[#78766d]">
                <span>Rate</span>
                <span className="font-mono text-white">
                  1 {inputToken.symbol} ≈ {quote?.rate.toFixed(4)} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-[#78766d]">
                <span>Minimum Received</span>
                <span className="font-mono text-white">
                  {quote?.minReceived} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-[#78766d]">
                <span>Price Impact</span>
                <span className="font-mono text-[#00d692]">
                  {quote?.priceImpactPct}% (Optimal)
                </span>
              </div>
              <div className="flex justify-between text-[#78766d]">
                <span>Routing Algorithm</span>
                <span className="font-mono text-[#f2d363] text-[11px]">
                  {quote?.routeSummary}
                </span>
              </div>
              <div className="flex justify-between text-[#78766d]">
                <span>Titan Protocol Fee</span>
                <span className="font-mono text-[#00d692]">
                  {prime ? "0.00% (Prime Active)" : "0.05%"}
                </span>
              </div>
              <div className="flex justify-between text-[#78766d]">
                <span>Estimated Network Fee</span>
                <span className="font-mono text-white">~0.000005 SOL ($0.0009)</span>
              </div>
            </div>

            {/* Non-Custodial Safety Disclaimer */}
            <div className="flex items-start gap-2 rounded-xl border border-[#f2d363]/25 bg-[#262113] p-3 text-[11px] text-[#f2d363]">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#f2d363]" />
              <div>
                <span className="font-semibold">Non-Custodial Verification:</span> Milo and Titan never touch private keys. Review and approve the transaction in your wallet.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="flex-1 rounded-full border border-[#2b2927] bg-[#20201d] py-2.5 text-center text-xs font-medium text-white hover:bg-[#2b2927] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-companion="titan-swap-sign"
                onClick={handleApprove}
                className="flex-1 rounded-full bg-[#f2d363] py-2.5 text-center text-xs font-semibold text-[#0d0d0c] hover:bg-[#ffe175] transition-all shadow-md active:scale-98 cursor-pointer"
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
