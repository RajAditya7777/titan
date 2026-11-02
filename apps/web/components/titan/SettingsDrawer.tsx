"use client";

import { X, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import type { DartMode, FeeMethod, PriorityTier } from "@/lib/products/titan/types";

export function SettingsDrawer() {
  const {
    settingsOpen,
    setSettingsOpen,
    prime,
    setPrime,
    dart,
    setDart,
    slippageSettings,
    setBaseSlippageBps,
    setStableSlippageBps,
    setFeeMethod,
    setPriorityTier,
  } = useTitan();

  if (!settingsOpen) return null;

  const basePresets = [10, 50, 100]; // 0.1%, 0.5%, 1.0%
  const stablePresets = [5, 10, 50]; // 0.05%, 0.1%, 0.5%
  const priorityTiers: PriorityTier[] = ["auto", "high", "turbo", "custom"];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setSettingsOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151513] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-white">Swap Settings</h3>
            <span className="rounded bg-[#f2d363]/10 px-2 py-0.5 text-[10px] font-mono text-[#f2d363] border border-[#f2d363]/20">
              Titan Protocol
            </span>
          </div>
          <button
            type="button"
            data-companion="titan-settings-close"
            onClick={() => setSettingsOpen(false)}
            className="rounded-full p-1 text-[#a8a69f] hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Prime Mode Toggle Card */}
          <div className="rounded-xl border border-white/[0.06] bg-[#20201d] p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#262113] text-[#f2d363] border border-[#f2d363]/30">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Prime Mode</h4>
                  <p className="text-[11px] text-[#a8a69f]">
                    Zero Titan fees, automated slippage & sandwich protection
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-companion="titan-prime-toggle"
                onClick={() => setPrime(!prime)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prime ? "bg-[#f2d363]" : "bg-[#33312e]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#100e0a] transition-transform ${
                    prime ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {prime && (
              <div className="mt-2 text-[10px] text-[#00d692] flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00d692]" />
                Titan protocol fee: 0.00% • Jito anti-sandwich bundle active
              </div>
            )}
          </div>

          {/* DART Routing Mode */}
          <div className="rounded-xl border border-white/[0.06] bg-[#20201d] p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white">DART Routing Mode</label>
              <span className="text-[10px] font-mono text-[#a8a69f]">Dynamic Allocation & Real Time</span>
            </div>
            <div
              data-companion="titan-dart-selector"
              className="grid grid-cols-3 gap-2"
            >
              {(["auto", "only", "off"] as DartMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDart(mode)}
                  className={`rounded-lg py-1.5 text-center text-xs font-medium capitalize transition-all border ${
                    dart === mode
                      ? "border-[#f2d363] bg-[#262113] text-[#f2d363]"
                      : "border-white/[0.06] bg-[#151513] text-[#a8a69f] hover:text-white"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {mode === "auto" && <span className="h-1.5 w-1.5 rounded-full bg-[#00d692]" />}
                    {mode}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-[#78766d]">
              {dart === "auto" && "Recommended: Argos solves off-chain, DART re-splits on-chain at execution."}
              {dart === "only" && "Enforces strict DART-eligible execution only."}
              {dart === "off" && "Bypasses DART on-chain re-split; standard single-venue route."}
            </p>
          </div>

          {/* Max Slippage: Base Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white">
                Max Slippage (Base Tokens)
              </label>
              <span className="font-mono text-xs text-[#f2d363]">
                {(slippageSettings.baseBps / 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {basePresets.map((bps) => (
                <button
                  key={bps}
                  type="button"
                  onClick={() => setBaseSlippageBps(bps)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-mono transition-all border ${
                    slippageSettings.baseBps === bps
                      ? "border-[#f2d363] bg-[#262113] text-[#f2d363]"
                      : "border-white/[0.06] bg-[#20201d] text-[#a8a69f] hover:text-white"
                  }`}
                >
                  {(bps / 100).toFixed(1)}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="number"
                  data-companion="titan-slippage-base-input"
                  value={slippageSettings.baseBps / 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) setBaseSlippageBps(Math.round(val * 100));
                  }}
                  step="0.1"
                  min="0.01"
                  max="10"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#20201d] px-2.5 py-1.5 text-right font-mono text-xs text-white focus:border-[#f2d363] focus:outline-none"
                  placeholder="Custom"
                />
                <span className="absolute right-2 top-1.5 text-xs text-[#78766d] pointer-events-none">%</span>
              </div>
            </div>
            {slippageSettings.baseBps > 200 && (
              <p className="flex items-center gap-1 text-[10px] text-amber-400">
                <AlertTriangle className="h-3 w-3" /> High slippage may result in unfavorable execution.
              </p>
            )}
          </div>

          {/* Max Slippage: Stable/LST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white">
                Max Slippage (Stable / LST)
              </label>
              <span className="font-mono text-xs text-[#f2d363]">
                {(slippageSettings.stableBps / 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {stablePresets.map((bps) => (
                <button
                  key={bps}
                  type="button"
                  onClick={() => setStableSlippageBps(bps)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-mono transition-all border ${
                    slippageSettings.stableBps === bps
                      ? "border-[#f2d363] bg-[#262113] text-[#f2d363]"
                      : "border-white/[0.06] bg-[#20201d] text-[#a8a69f] hover:text-white"
                  }`}
                >
                  {(bps / 100).toFixed(2)}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="number"
                  data-companion="titan-slippage-stable-input"
                  value={slippageSettings.stableBps / 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) setStableSlippageBps(Math.round(val * 100));
                  }}
                  step="0.05"
                  min="0.01"
                  max="5"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#20201d] px-2.5 py-1.5 text-right font-mono text-xs text-white focus:border-[#f2d363] focus:outline-none"
                  placeholder="Custom"
                />
                <span className="absolute right-2 top-1.5 text-xs text-[#78766d] pointer-events-none">%</span>
              </div>
            </div>
          </div>

          {/* Fee Method */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white">Transaction Fee Method</label>
            <div
              data-companion="titan-priority-fee-toggle"
              className="grid grid-cols-2 gap-2"
            >
              <button
                type="button"
                onClick={() => setFeeMethod("priority")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-all ${
                  slippageSettings.feeMethod === "priority"
                    ? "border-[#f2d363] bg-[#262113] text-[#f2d363]"
                    : "border-white/[0.06] bg-[#20201d] text-[#a8a69f]"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Priority Fees</span>
              </button>
              <button
                type="button"
                onClick={() => setFeeMethod("mev")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-all ${
                  slippageSettings.feeMethod === "mev"
                    ? "border-[#f2d363] bg-[#262113] text-[#f2d363]"
                    : "border-white/[0.06] bg-[#20201d] text-[#a8a69f]"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>MEV Protect</span>
              </button>
            </div>
          </div>

          {/* Priority Tiers */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white">Priority Level</label>
            <div className="grid grid-cols-4 gap-1.5">
              {priorityTiers.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setPriorityTier(tier)}
                  className={`rounded-lg py-1 text-center font-mono text-xs capitalize border transition-all ${
                    slippageSettings.priorityTier === tier
                      ? "border-[#f2d363] bg-[#262113] text-[#f2d363]"
                      : "border-white/[0.06] bg-[#20201d] text-[#a8a69f]"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-5 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="w-full rounded-xl bg-[#f2d363] py-2 text-center text-xs font-semibold text-[#100e0a] hover:bg-[#ffe175] transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
