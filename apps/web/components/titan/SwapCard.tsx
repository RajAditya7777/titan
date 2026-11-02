"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ChevronDown,
  Sparkles,
  Zap,
  RotateCw,
  BarChart2,
  Copy,
  Info,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { useGuidedField } from "@/components/companion/CompanionProvider";
import { TITAN_TOKENS, formatUsd } from "@/lib/products/titan/tokens";
import type { DartMode, Token } from "@/lib/products/titan/types";

export function SwapCard() {
  const {
    inputToken,
    outputToken,
    amount,
    quote,
    isLoadingQuote,
    prime,
    setPrime,
    dart,
    setDart,
    setInputToken,
    setOutputToken,
    setAmount,
    switchTokens,
    setReviewModalOpen,
    refreshQuote,
    setSettingsOpen,
    walletConnected,
    setWalletModalOpen,
  } = useTitan();
  // Lets the guide read, validate and (after the user's yes) fill the amount.
  const onAmount = useGuidedField("titan-sell-amount-input", amount, setAmount);

  const [activeTab, setActiveTab] = useState<"instant" | "limit" | "dca" | "slice">("instant");
  const [tokenSelectTarget, setTokenSelectTarget] = useState<"in" | "out" | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");

  const inUsd = (parseFloat(amount) || 0) * inputToken.usdPrice;
  const outAmount = quote?.outAmount || (parseFloat(amount) ? (inUsd / outputToken.usdPrice).toFixed(4) : "0");
  const outUsd = (parseFloat(outAmount) || 0) * outputToken.usdPrice;

  const tokenList = Object.values(TITAN_TOKENS);
  const filteredTokens = tokenList.filter(
    (t) =>
      t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 sm:gap-14 py-8 sm:py-12 w-full max-w-4xl mx-auto px-4">
      {/* Left Sidebar: Order Types */}
      <div className="w-full lg:w-44 shrink-0 flex lg:flex-col gap-2 select-none">
        <span className="hidden lg:block text-xs font-semibold uppercase tracking-wider text-[#737373] mb-2 px-3">
          Order types
        </span>

        {/* Instant */}
        <button
          type="button"
          data-companion="titan-tab-instant"
          onClick={() => setActiveTab("instant")}
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "instant"
              ? "text-white bg-white/[0.06]"
              : "text-[#8a8a8a] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <span>Instant</span>
          {activeTab === "instant" && <ArrowRight className="h-4 w-4 text-[#fed766]" />}
        </button>

        {/* Limit */}
        <Link
          href="/titan/limit"
          data-companion="titan-tab-limit"
          className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#8a8a8a] hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <span>Limit</span>
          <span className="rounded bg-[#fed766]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#fed766]">
            Beta
          </span>
        </Link>

        {/* DCA */}
        <button
          type="button"
          data-companion="titan-tab-dca"
          onClick={() => setActiveTab("dca")}
          className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#8a8a8a] hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <span>DCA</span>
        </button>

        {/* Slice */}
        <button
          type="button"
          data-companion="titan-tab-slice"
          onClick={() => setActiveTab("slice")}
          className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#8a8a8a] hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <span>Slice</span>
          <span className="rounded bg-[#fed766]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#fed766]">
            New
          </span>
        </button>
      </div>

      {/* Center Swap Card */}
      <div className="w-full max-w-[460px] rounded-3xl border border-white/[0.08] bg-[#121212] p-4 sm:p-5 shadow-2xl relative">
        {/* Top bar inside box: Prime & DART */}
        <div className="flex items-center justify-between pb-3.5 mb-3">
          {/* Prime Mode Badge Button */}
          <button
            type="button"
            data-companion="titan-prime-toggle"
            onClick={() => setPrime(!prime)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
              prime
                ? "border-[#fed766]/50 bg-[#1c180e] text-[#fed766] shadow-[0_0_12px_rgba(254,215,102,0.18)]"
                : "border-white/[0.08] bg-[#1c1c1c] text-[#8a8a8a] hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#fed766]" />
            <span>Prime</span>
          </button>

          {/* Right Tools: DART selector, Depth icon, Refresh */}
          <div className="flex items-center gap-2">
            {/* DART selector */}
            <div className="relative">
              <select
                data-companion="titan-dart-selector"
                value={dart}
                onChange={(e) => setDart(e.target.value as DartMode)}
                className="appearance-none rounded-full border border-white/[0.08] bg-[#1c1c1c] pl-6 pr-6 py-1 text-xs font-medium text-[#dcdcdc] hover:border-white/20 focus:border-[#fed766] focus:outline-none cursor-pointer"
              >
                <option value="auto">DART: Auto</option>
                <option value="only">DART: Only</option>
                <option value="off">DART: Off</option>
              </select>
              <Zap className="pointer-events-none absolute left-2 top-1.5 h-3 w-3 text-[#fed766]" />
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#8a8a8a]" />
            </div>

            {/* Depth/Chart Icon */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 text-[#8a8a8a] hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
              title="Trade Settings"
            >
              <BarChart2 className="h-4 w-4" />
            </button>

            {/* Refresh Quote */}
            <button
              type="button"
              data-companion="titan-refresh-quote"
              onClick={refreshQuote}
              className={`p-1.5 text-[#8a8a8a] hover:text-white transition-colors rounded-lg hover:bg-white/[0.05] ${
                isLoadingQuote ? "animate-spin text-[#fed766]" : ""
              }`}
              title="Refresh Quote"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sell Card (Active card with delicate glowing golden hairline border!) */}
        <div
          data-companion="titan-sell-card"
          className="rounded-2xl border border-[#fed766]/70 bg-[#161616] p-4 shadow-[0_0_15px_rgba(254,215,102,0.12)] transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#8a8a8a] mb-1.5">
            <span className="font-medium">Sell</span>
            <div className="flex items-center gap-1.5">
              {/* Quick token icons */}
              <button
                type="button"
                onClick={() => TITAN_TOKENS.SOL && setInputToken(TITAN_TOKENS.SOL)}
                className="hover:opacity-80 transition-opacity"
                title="Select SOL"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#9945ff] to-[#14f195] text-[9px] font-bold text-white">
                  S
                </span>
              </button>
              <button
                type="button"
                onClick={() => TITAN_TOKENS.JUP && setInputToken(TITAN_TOKENS.JUP)}
                className="hover:opacity-80 transition-opacity"
                title="Select JUP"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff5252] to-[#ffa14a] text-[9px] font-bold text-white">
                  J
                </span>
              </button>
              <button
                type="button"
                onClick={() => TITAN_TOKENS.USDC && setInputToken(TITAN_TOKENS.USDC)}
                className="hover:opacity-80 transition-opacity"
                title="Select USDC"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2775ca] text-[9px] font-bold text-white">
                  $
                </span>
              </button>

              {/* Token Selector Dropdown */}
              <button
                type="button"
                data-companion="titan-sell-token-select"
                onClick={() => setTokenSelectTarget("in")}
                className="flex items-center gap-1.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] border border-white/[0.08] px-2.5 py-1 text-xs font-semibold text-white transition-colors"
              >
                <span className="h-4 w-4 rounded-full bg-[#2775ca] flex items-center justify-center text-[10px] text-white">
                  {inputToken.symbol[0]}
                </span>
                <span>{inputToken.symbol}</span>
                <ChevronDown className="h-3 w-3 text-[#8a8a8a]" />
              </button>
            </div>
          </div>

          {/* Amount input & USD value */}
          <div className="flex items-baseline justify-between mt-1">
            <input
              type="text"
              data-companion="titan-sell-amount-input"
              value={amount}
              onChange={(e) => onAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent text-3xl font-bold text-white placeholder-[#454545] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#737373] mt-2">
            <span>≈ {formatUsd(inUsd)}</span>
            <span data-companion="titan-sell-balance">Balance: -</span>
          </div>
        </div>

        {/* Circular Invert Button (Nestled between Sell and Buy cards) */}
        <div className="relative -my-2.5 z-10 flex justify-center">
          <button
            type="button"
            data-companion="titan-switch-tokens"
            onClick={switchTokens}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-[#222222] text-[#8a8a8a] hover:text-white hover:border-[#fed766]/50 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Switch tokens"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        {/* Buy Card */}
        <div
          data-companion="titan-buy-card"
          className="rounded-2xl border border-white/[0.08] bg-[#161616] p-4 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#8a8a8a] mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">Buy</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-[#737373] hover:text-[#fed766] transition-colors"
                title="Paste Contract Address"
              >
                <Copy className="h-3 w-3" />
                <span>Paste CA</span>
              </button>
            </div>

            {/* Output Token Selector */}
            <button
              type="button"
              data-companion="titan-buy-token-select"
              onClick={() => setTokenSelectTarget("out")}
              className="flex items-center gap-1.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] border border-white/[0.08] px-2.5 py-1 text-xs font-semibold text-white transition-colors"
            >
              <span className="h-4 w-4 rounded-full bg-gradient-to-tr from-[#9945ff] to-[#14f195] flex items-center justify-center text-[10px] text-white">
                {outputToken.symbol[0]}
              </span>
              <span>{outputToken.symbol}</span>
              <ChevronDown className="h-3 w-3 text-[#8a8a8a]" />
            </button>
          </div>

          {/* Calculated Output Amount */}
          <div className="flex items-baseline justify-between mt-1">
            <span
              data-companion="titan-buy-amount-output"
              className="text-3xl font-bold text-white font-mono"
            >
              {outAmount}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#737373] mt-2">
            <span>≈ {formatUsd(outUsd)}</span>
            <span>Balance: -</span>
          </div>
        </div>

        {/* Rate Line */}
        <div
          data-companion="titan-rate-display"
          className="flex items-center justify-between py-3 px-1 text-xs text-[#8a8a8a]"
        >
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#737373]" />
            <span>
              1 {outputToken.symbol} ≈{" "}
              {(outputToken.usdPrice / inputToken.usdPrice).toFixed(4)} {inputToken.symbol}
            </span>
          </div>
          <span className="text-[11px] text-[#737373]">⇄</span>
        </div>

        {/* Large Gold Action Button: Connect Wallet / Review Swap */}
        <button
          type="button"
          data-companion="titan-swap-review"
          onClick={() => {
            if (!walletConnected) {
              setWalletModalOpen(true);
            } else {
              setReviewModalOpen(true);
            }
          }}
          className="w-full rounded-2xl bg-[#fed766] hover:bg-[#ffe082] active:bg-[#e6c152] py-3.5 text-base font-extrabold text-black transition-all shadow-[0_0_20px_rgba(254,215,102,0.3)] cursor-pointer"
        >
          {walletConnected ? `Review Swap (${inputToken.symbol} → ${outputToken.symbol})` : "Connect Wallet"}
        </button>
      </div>

      {/* Token Selector Modal */}
      {tokenSelectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#141414] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white">Select a token</h3>
              <button
                type="button"
                onClick={() => {
                  setTokenSelectTarget(null);
                  setTokenSearch("");
                }}
                className="text-xs text-[#8a8a8a] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <input
                type="text"
                placeholder="Search name or mint address..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#1c1c1c] px-3.5 py-2 text-xs text-white placeholder-[#737373] focus:border-[#fed766] focus:outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredTokens.map((tok) => (
                <button
                  key={tok.symbol}
                  type="button"
                  onClick={() => {
                    if (tokenSelectTarget === "in") setInputToken(tok);
                    else setOutputToken(tok);
                    setTokenSelectTarget(null);
                    setTokenSearch("");
                  }}
                  className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#222] font-mono text-xs font-bold text-white">
                      {tok.symbol[0]}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{tok.symbol}</div>
                      <div className="text-[10px] text-[#8a8a8a]">{tok.name}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#dcdcdc]">{formatUsd(tok.usdPrice)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
