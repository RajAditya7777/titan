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
  Check,
  Calendar,
  Layers,
  Clock,
} from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { useGuidedField, useCompanionContext } from "@/components/companion/CompanionProvider";
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
    showToast,
    addOrder,
    getUserBalance,
  } = useTitan();

  const onAmount = useGuidedField("titan-sell-amount-input", amount, setAmount);

  const [activeTab, setActiveTab] = useState<"instant" | "limit" | "dca" | "slice">("instant");
  const [tokenSelectTarget, setTokenSelectTarget] = useState<"in" | "out" | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");
  const [pasteCaModalOpen, setPasteCaModalOpen] = useState(false);
  const [customCa, setCustomCa] = useState("");
  const [invertRate, setInvertRate] = useState(false);

  // Limit order local state
  const [limitPrice, setLimitPrice] = useState(
    (outputToken.usdPrice / (inputToken.usdPrice || 1)).toFixed(4)
  );
  const [limitExpiry, setLimitExpiry] = useState<"10m" | "1h" | "1d" | "7d" | "never">("1d");

  // DCA local state
  const [dcaInterval, setDcaInterval] = useState<"1h" | "1d" | "1w">("1d");
  const [dcaOrders, setDcaOrders] = useState<"5" | "10" | "30">("5");

  // Slice local state
  const [sliceChunks, setSliceChunks] = useState<"3" | "5" | "10">("5");

  const inUsd = (parseFloat(amount) || 0) * inputToken.usdPrice;
  const outAmount = quote?.outAmount || (parseFloat(amount) ? (inUsd / outputToken.usdPrice).toFixed(4) : "0");
  const outUsd = (parseFloat(outAmount) || 0) * outputToken.usdPrice;

  const currentBalance = getUserBalance(inputToken.symbol);

  useCompanionContext({
    product: "Titan Exchange",
    view: "Instant Swap",
    sellToken: inputToken.symbol,
    sellTokenPrice: inputToken.usdPrice,
    buyToken: outputToken.symbol,
    buyTokenPrice: outputToken.usdPrice,
    amount: amount || "0",
    estReceive: outAmount,
    rate: `1 ${inputToken.symbol} ≈ ${(inputToken.usdPrice / outputToken.usdPrice).toFixed(4)} ${outputToken.symbol}`,
    prime,
    dart,
    walletConnected,
    balances: {
      [inputToken.symbol]: currentBalance,
      [outputToken.symbol]: getUserBalance(outputToken.symbol),
      SOL: getUserBalance("SOL"),
      USDC: getUserBalance("USDC"),
    },
    availableTokens: Object.values(TITAN_TOKENS).map((t) => ({
      symbol: t.symbol,
      price: `$${t.usdPrice.toFixed(2)}`,
    })),
  });

  const handlePercentageFill = (pct: number) => {
    const val = (currentBalance * pct).toFixed(4);
    setAmount(val);
    showToast(`Filled ${(pct * 100).toFixed(0)}% of balance (${val} ${inputToken.symbol})`, "info");
  };

  const handlePasteCaSubmit = (caToUse?: string) => {
    const address = caToUse || customCa;
    if (!address.trim()) return;

    // Check if it matches an existing token or create a custom token
    const symbol = address.length > 8 ? `CUSTOM-${address.slice(0, 4)}` : address.toUpperCase();
    const customToken: Token = {
      symbol,
      name: `Contract ${address.slice(0, 6)}...`,
      mint: address,
      decimals: 9,
      usdPrice: 1.25,
      icon: "🪙",
      balance: 0,
    };
    setOutputToken(customToken);
    setPasteCaModalOpen(false);
    setCustomCa("");
    showToast(`Loaded token mint: ${address.slice(0, 8)}...`, "success");
  };

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
        <span className="hidden lg:block text-xs font-semibold uppercase tracking-wider text-[#78766d] mb-2 px-3">
          Order types
        </span>

        {/* Instant */}
        <button
          type="button"
          data-companion="titan-tab-instant"
          onClick={() => {
            setActiveTab("instant");
            showToast("Switched to Instant Swap Mode", "info");
          }}
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "instant"
              ? "text-white bg-[#20201d] border border-[#2b2927]"
              : "text-[#c2c1bc] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <span>Instant</span>
          {activeTab === "instant" && <ArrowRight className="h-4 w-4 text-[#f2d363]" />}
        </button>

        {/* Limit */}
        <button
          type="button"
          data-companion="titan-tab-limit"
          onClick={() => {
            setActiveTab("limit");
            showToast("Switched to Limit Order Mode (Titan Embedded Wallet)", "info");
          }}
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
            activeTab === "limit"
              ? "text-white bg-[#20201d] border border-[#2b2927]"
              : "text-[#c2c1bc] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <span>Limit</span>
          <span className="rounded bg-[#f2d363]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f2d363]">
            Beta
          </span>
        </button>

        {/* DCA */}
        <button
          type="button"
          data-companion="titan-tab-dca"
          onClick={() => {
            setActiveTab("dca");
            showToast("Switched to Dollar-Cost Averaging (DCA) Mode", "info");
          }}
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
            activeTab === "dca"
              ? "text-white bg-[#20201d] border border-[#2b2927]"
              : "text-[#c2c1bc] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <span>DCA</span>
        </button>

        {/* Slice */}
        <button
          type="button"
          data-companion="titan-tab-slice"
          onClick={() => {
            setActiveTab("slice");
            showToast("Switched to Slice (Anti-Price Impact TWAP) Mode", "info");
          }}
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
            activeTab === "slice"
              ? "text-white bg-[#20201d] border border-[#2b2927]"
              : "text-[#c2c1bc] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <span>Slice</span>
          <span className="rounded bg-[#f2d363]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f2d363]">
            New
          </span>
        </button>
      </div>

      {/* Center Swap Card */}
      <div className="w-full max-w-[470px] rounded-3xl border border-[#2b2927] bg-[#151513] p-4 sm:p-5 shadow-2xl relative">
        {/* Top bar inside box: Prime & DART */}
        <div className="flex items-center justify-between pb-3.5 mb-3">
          {/* Prime Mode Badge Button */}
          <button
            type="button"
            data-companion="titan-prime-toggle"
            onClick={() => {
              setPrime(!prime);
              showToast(
                !prime
                  ? "Titan Prime Activated: 0% protocol fees & sandwich protection"
                  : "Titan Prime Deactivated",
                "info"
              );
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all border cursor-pointer ${
              prime
                ? "border-[#f2d363]/50 bg-[#262113] text-[#f2d363] shadow-[0_0_12px_rgba(242,211,99,0.18)]"
                : "border-[#2b2927] bg-[#20201d] text-[#c2c1bc] hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#f2d363]" />
            <span>Prime</span>
          </button>

          {/* Right Tools: DART selector with live status dot, Depth icon, Refresh */}
          <div className="flex items-center gap-2">
            {/* DART selector */}
            <div className="relative flex items-center">
              <span className="absolute left-2.5 z-10 h-2 w-2 rounded-full bg-[#00d692] animate-pulse" />
              <select
                data-companion="titan-dart-selector"
                value={dart}
                onChange={(e) => {
                  setDart(e.target.value as DartMode);
                  showToast(`DART routing mode set to ${e.target.value.toUpperCase()}`, "info");
                }}
                className="appearance-none rounded-full border border-[#2b2927] bg-[#20201d] pl-6 pr-6 py-1 text-xs font-medium text-[#f5f5f5] hover:border-[#33312e] focus:border-[#f2d363] focus:outline-none cursor-pointer"
              >
                <option value="auto">DART: Auto</option>
                <option value="only">DART: Only</option>
                <option value="off">DART: Off</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#78766d]" />
            </div>

            {/* Depth/Chart Icon -> Opens Settings Drawer */}
            <button
              type="button"
              data-companion="titan-settings-toggle"
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 text-[#c2c1bc] hover:text-white transition-colors rounded-lg hover:bg-[#20201d] cursor-pointer"
              title="Trade Settings & Slippage"
            >
              <BarChart2 className="h-4 w-4" />
            </button>

            {/* Refresh Quote */}
            <button
              type="button"
              data-companion="titan-refresh-quote"
              onClick={refreshQuote}
              className={`p-1.5 text-[#c2c1bc] hover:text-white transition-colors rounded-lg hover:bg-[#20201d] cursor-pointer ${
                isLoadingQuote ? "animate-spin text-[#f2d363]" : ""
              }`}
              title="Refresh Quote"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ================= MODE: INSTANT / DCA / SLICE / LIMIT ================= */}
        {/* Sell Card (Active card with delicate glowing golden hairline border!) */}
        <div
          data-companion="titan-sell-card"
          className="rounded-2xl border border-[#f2d363]/60 bg-[#20201d] p-4 shadow-[0_0_15px_rgba(242,211,99,0.12)] transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#c2c1bc] mb-1.5">
            <span className="font-medium">
              {activeTab === "dca" ? "Total Sell Amount" : activeTab === "slice" ? "Total Size to Slice" : "Sell"}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Quick token icons */}
              <button
                type="button"
                onClick={() => {
                  if (TITAN_TOKENS.SOL) {
                    setInputToken(TITAN_TOKENS.SOL);
                    showToast("Selected SOL as Sell Token", "info");
                  }
                }}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title="Select SOL"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#9945ff] to-[#14f195] text-[9px] font-bold text-white">
                  S
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (TITAN_TOKENS.JUP) {
                    setInputToken(TITAN_TOKENS.JUP);
                    showToast("Selected JUP as Sell Token", "info");
                  }
                }}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title="Select JUP"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff5252] to-[#ffa14a] text-[9px] font-bold text-white">
                  J
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (TITAN_TOKENS.USDC) {
                    setInputToken(TITAN_TOKENS.USDC);
                    showToast("Selected USDC as Sell Token", "info");
                  }
                }}
                className="hover:opacity-80 transition-opacity cursor-pointer"
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
                className="flex items-center gap-1.5 rounded-full bg-[#151513] hover:bg-[#2b2927] border border-[#2b2927] px-2.5 py-1 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <span className="h-4 w-4 rounded-full bg-[#2775ca] flex items-center justify-center text-[10px] text-white">
                  {inputToken.symbol[0]}
                </span>
                <span>{inputToken.symbol}</span>
                <ChevronDown className="h-3 w-3 text-[#78766d]" />
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
              className="w-full bg-transparent text-[32px] font-medium text-white placeholder-[#78766d] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#78766d] mt-2">
            <span>≈ {formatUsd(inUsd)}</span>
            <div className="flex items-center gap-1.5">
              <span data-companion="titan-sell-balance">
                Bal: {walletConnected ? `${currentBalance} ${inputToken.symbol}` : "-"}
              </span>
              {walletConnected && (
                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => handlePercentageFill(0.25)}
                    className="px-1.5 py-0.2 rounded bg-[#151513] border border-[#2b2927] text-[10px] text-[#c2c1bc] hover:text-white hover:border-[#f2d363]"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePercentageFill(0.5)}
                    className="px-1.5 py-0.2 rounded bg-[#151513] border border-[#2b2927] text-[10px] text-[#c2c1bc] hover:text-white hover:border-[#f2d363]"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePercentageFill(1.0)}
                    className="px-1.5 py-0.2 rounded bg-[#151513] border border-[#2b2927] text-[10px] text-[#f2d363] hover:text-white hover:border-[#f2d363]"
                  >
                    Max
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Circular Invert Button (Nestled between Sell and Buy cards) */}
        <div className="relative -my-2.5 z-10 flex justify-center">
          <button
            type="button"
            data-companion="titan-switch-tokens"
            onClick={switchTokens}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2b2927] bg-[#151513] text-[#c2c1bc] hover:text-white hover:border-[#f2d363]/60 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Switch tokens"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        {/* Buy Card */}
        <div
          data-companion="titan-buy-card"
          className="rounded-2xl border border-[#2b2927] bg-[#20201d] p-4 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#c2c1bc] mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {activeTab === "dca" ? "Target Asset" : activeTab === "slice" ? "Asset to Receive" : "Buy"}
              </span>
              <button
                type="button"
                onClick={() => setPasteCaModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] text-[#78766d] hover:text-[#f2d363] transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 rounded-full bg-[#151513] hover:bg-[#2b2927] border border-[#2b2927] px-2.5 py-1 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <span className="h-4 w-4 rounded-full bg-gradient-to-tr from-[#9945ff] to-[#14f195] flex items-center justify-center text-[10px] text-white">
                {outputToken.symbol[0]}
              </span>
              <span>{outputToken.symbol}</span>
              <ChevronDown className="h-3 w-3 text-[#78766d]" />
            </button>
          </div>

          {/* Calculated Output Amount */}
          <div className="flex items-baseline justify-between mt-1">
            <span
              data-companion="titan-buy-amount-output"
              className="text-[32px] font-medium text-white font-mono"
            >
              {outAmount}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#78766d] mt-2">
            <span>≈ {formatUsd(outUsd)}</span>
            <span>Bal: {walletConnected ? `${getUserBalance(outputToken.symbol)} ${outputToken.symbol}` : "-"}</span>
          </div>
        </div>

        {/* ================= EXTRA CONFIGS FOR LIMIT / DCA / SLICE ================= */}
        {activeTab === "limit" && (
          <div className="mt-3 p-3.5 rounded-2xl border border-[#2b2927] bg-[#1a1917] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#a8a69f]">Limit Price (USDC per {inputToken.symbol})</span>
              <div className="flex items-center gap-1">
                {["-5%", "-1%", "+1%", "+5%"].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(limitPrice) || 1;
                      const delta = parseFloat(pct) / 100;
                      setLimitPrice((cur * (1 + delta)).toFixed(4));
                    }}
                    className="px-1.5 py-0.5 rounded bg-[#20201d] border border-[#2b2927] text-[10px] text-[#c2c1bc] hover:text-white"
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-[#151513] border border-[#2b2927] rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#f2d363]"
              placeholder="0.00"
            />
            <div className="flex items-center justify-between text-xs text-[#78766d]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Expiry:
              </span>
              <div className="flex items-center gap-1">
                {(["10m", "1h", "1d", "7d", "never"] as const).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setLimitExpiry(exp)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      limitExpiry === exp ? "bg-[#f2d363] text-black font-bold" : "bg-[#20201d] text-[#78766d] hover:text-white"
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "dca" && (
          <div className="mt-3 p-3.5 rounded-2xl border border-[#2b2927] bg-[#1a1917] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#a8a69f]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#f2d363]" /> Frequency:
              </span>
              <div className="flex items-center gap-1">
                {(["1h", "1d", "1w"] as const).map((int) => (
                  <button
                    key={int}
                    type="button"
                    onClick={() => setDcaInterval(int)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      dcaInterval === int ? "bg-[#f2d363] text-black font-bold" : "bg-[#20201d] text-[#78766d] hover:text-white"
                    }`}
                  >
                    Every {int}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#a8a69f]">
              <span>Number of Orders:</span>
              <div className="flex items-center gap-1">
                {(["5", "10", "30"] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setDcaOrders(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      dcaOrders === cnt ? "bg-[#f2d363] text-black font-bold" : "bg-[#20201d] text-[#78766d] hover:text-white"
                    }`}
                  >
                    {cnt} orders
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-[#78766d] pt-1 border-t border-[#20201d]">
              Execution plan: {(parseFloat(amount || "1") / parseInt(dcaOrders, 10)).toFixed(4)} {inputToken.symbol} per order every {dcaInterval}.
            </p>
          </div>
        )}

        {activeTab === "slice" && (
          <div className="mt-3 p-3.5 rounded-2xl border border-[#2b2927] bg-[#1a1917] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#a8a69f]">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-[#f2d363]" /> Break order into:
              </span>
              <div className="flex items-center gap-1">
                {(["3", "5", "10"] as const).map((chk) => (
                  <button
                    key={chk}
                    type="button"
                    onClick={() => setSliceChunks(chk)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      sliceChunks === chk ? "bg-[#f2d363] text-black font-bold" : "bg-[#20201d] text-[#78766d] hover:text-white"
                    }`}
                  >
                    {chk} chunks
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#78766d]">
              Slices reduce market impact and front-running on large swaps by randomized micro-batches.
            </p>
          </div>
        )}

        {/* Rate Line (Interactive ⇄ flip button) */}
        <div
          data-companion="titan-rate-display"
          className="flex items-center justify-between py-3 px-1 text-xs text-[#78766d]"
        >
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#78766d]" />
            <span>
              {invertRate ? (
                <>
                  1 {inputToken.symbol} ≈{" "}
                  {(inputToken.usdPrice / outputToken.usdPrice).toFixed(4)} {outputToken.symbol}
                </>
              ) : (
                <>
                  1 {outputToken.symbol} ≈{" "}
                  {(outputToken.usdPrice / inputToken.usdPrice).toFixed(4)} {inputToken.symbol}
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setInvertRate(!invertRate)}
            className="text-[11px] text-[#78766d] hover:text-[#f2d363] cursor-pointer p-1"
            title="Invert Rate View"
          >
            ⇄
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          data-companion="titan-swap-review"
          onClick={() => {
            if (!walletConnected) {
              setWalletModalOpen(true);
            } else if (activeTab === "limit") {
              addOrder({
                pair: `${inputToken.symbol}/${outputToken.symbol}`,
                side: "buy",
                price: limitPrice,
                amount: amount || "1",
                type: "LIMIT",
              });
            } else if (activeTab === "dca") {
              addOrder({
                pair: `${inputToken.symbol}/${outputToken.symbol}`,
                side: "buy",
                price: (outputToken.usdPrice / inputToken.usdPrice).toFixed(2),
                amount: amount || "1",
                type: `DCA (${dcaOrders}x ${dcaInterval})`,
              });
            } else if (activeTab === "slice") {
              addOrder({
                pair: `${inputToken.symbol}/${outputToken.symbol}`,
                side: "buy",
                price: (outputToken.usdPrice / inputToken.usdPrice).toFixed(2),
                amount: amount || "1",
                type: `SLICE (${sliceChunks} chunks)`,
              });
            } else {
              setReviewModalOpen(true);
            }
          }}
          className="w-full rounded-full bg-[#f2d363] hover:bg-[#ffe175] active:scale-[0.98] py-3.5 text-sm sm:text-base font-medium text-[#0d0d0c] transition-all cursor-pointer shadow-md"
        >
          {!walletConnected
            ? "Connect Wallet"
            : activeTab === "limit"
            ? `Place Limit Order (${amount || 1} ${inputToken.symbol} at $${limitPrice})`
            : activeTab === "dca"
            ? `Start DCA Schedule (${amount || 1} ${inputToken.symbol})`
            : activeTab === "slice"
            ? `Execute Slice Trade (${sliceChunks} chunks)`
            : `Review Swap (${inputToken.symbol} → ${outputToken.symbol})`}
        </button>
      </div>

      {/* Paste CA Modal */}
      {pasteCaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2b2927] bg-[#151513] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#20201d]">
              <h3 className="text-sm font-semibold text-white">Paste Solana Contract Address</h3>
              <button
                type="button"
                onClick={() => setPasteCaModalOpen(false)}
                className="text-xs text-[#78766d] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-3 space-y-2">
              <input
                type="text"
                placeholder="Paste token mint address (e.g. DezXAZ...)"
                value={customCa}
                onChange={(e) => setCustomCa(e.target.value)}
                className="w-full rounded-xl border border-[#2b2927] bg-[#20201d] px-3.5 py-2 text-xs text-white placeholder-[#78766d] focus:border-[#f2d363] focus:outline-none"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#78766d]">Popular:</span>
                {[
                  { name: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
                  { name: "WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
                  { name: "POPCAT", mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr" },
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePasteCaSubmit(p.mint)}
                    className="px-2 py-0.5 rounded bg-[#20201d] border border-[#2b2927] text-[10px] text-[#f2d363] hover:bg-[#2b2927]"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#20201d]">
              <button
                type="button"
                onClick={() => setPasteCaModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#a8a69f] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePasteCaSubmit()}
                className="px-4 py-1.5 rounded-xl bg-[#f2d363] hover:bg-[#ffe175] text-[#0d0d0c] font-medium text-xs"
              >
                Add Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Selector Modal */}
      {tokenSelectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2b2927] bg-[#151513] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#20201d]">
              <h3 className="text-sm font-semibold text-white">Select a token</h3>
              <button
                type="button"
                onClick={() => {
                  setTokenSelectTarget(null);
                  setTokenSearch("");
                }}
                className="text-xs text-[#78766d] hover:text-white cursor-pointer"
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
                className="w-full rounded-xl border border-[#2b2927] bg-[#20201d] px-3.5 py-2 text-xs text-white placeholder-[#78766d] focus:border-[#f2d363] focus:outline-none"
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
                    showToast(`Selected ${tok.symbol} (${tok.name})`, "info");
                  }}
                  className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-[#20201d] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#20201d] border border-[#2b2927] font-mono text-xs font-bold text-white">
                      {tok.symbol[0]}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{tok.symbol}</div>
                      <div className="text-[10px] text-[#78766d]">{tok.name}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#c2c1bc]">{formatUsd(tok.usdPrice)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
