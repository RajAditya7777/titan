"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  Star,
  ExternalLink,
  Eye,
  Maximize2,
  Settings,
  Camera,
  RotateCcw,
  RotateCw,
  Sparkles,
  Zap,
  Lock,
  ChevronUp,
  TrendingUp,
  BarChart2,
  Check,
  Copy,
} from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { formatUsd } from "@/lib/products/titan/tokens";
import { useGuidedField, useCompanionContext } from "@/components/companion/CompanionProvider";

interface MarketToken {
  symbol: string;
  name: string;
  price: string;
  priceNum: number;
  change: string;
  changeNum: number;
  isPositive: boolean;
  marketCap: string;
  category: "Trending" | "Stocks" | "Memes" | "DART";
  iconBg: string;
}

const MARKET_TOKENS: MarketToken[] = [
  { symbol: "SOL", name: "Solana", price: "$93.759", priceNum: 93.759, change: "-1.63%", changeNum: -1.63, isPositive: false, marketCap: "$55.31B", category: "Trending", iconBg: "bg-gradient-to-tr from-[#9945ff] to-[#14f195]" },
  { symbol: "HYPE", name: "Hyperliquid", price: "$86.929", priceNum: 86.929, change: "-0.56%", changeNum: -0.56, isPositive: false, marketCap: "$55.15M", category: "DART", iconBg: "bg-[#00d692]" },
  { symbol: "PUMP", name: "Pump.fun", price: "$0.00412891", priceNum: 0.00412891, change: "-1.96%", changeNum: -1.96, isPositive: false, marketCap: "$1.69B", category: "Memes", iconBg: "bg-[#10b981]" },
  { symbol: "ZEC", name: "Zcash", price: "$1,219.70", priceNum: 1219.70, change: "-2.19%", changeNum: -2.19, isPositive: false, marketCap: "$124.88M", category: "Trending", iconBg: "bg-[#f59e0b]" },
  { symbol: "cbBTC", name: "Coinbase BTC", price: "$77,768.90", priceNum: 77768.90, change: "+0.44%", changeNum: 0.44, isPositive: true, marketCap: "$230.04M", category: "Trending", iconBg: "bg-[#3b82f6]" },
  { symbol: "ETH", name: "Ethereum", price: "$2,260.63", priceNum: 2260.63, change: "+0.38%", changeNum: 0.38, isPositive: true, marketCap: "$95.09M", category: "Trending", iconBg: "bg-[#627eea]" },
  { symbol: "TRUMP", name: "Official Trump", price: "$1.701", priceNum: 1.701, change: "+8.08%", changeNum: 8.08, isPositive: true, marketCap: "$479.45M", category: "Memes", iconBg: "bg-[#ef4444]" },
  { symbol: "WBTC", name: "Wrapped BTC", price: "$77,775.57", priceNum: 77775.57, change: "+0.43%", changeNum: 0.43, isPositive: true, marketCap: "$190.6M", category: "Trending", iconBg: "bg-[#f7931a]" },
  { symbol: "SPCX", name: "SpaceX Pre", price: "$137.04", priceNum: 137.04, change: "+0.01%", changeNum: 0.01, isPositive: true, marketCap: "$12.16M", category: "Stocks", iconBg: "bg-[#1e293b]" },
  { symbol: "TTWO", name: "Take-Two", price: "$193.33", priceNum: 193.33, change: "+0.59%", changeNum: 0.59, isPositive: true, marketCap: "$2.9M", category: "Stocks", iconBg: "bg-[#a855f7]" },
  { symbol: "DJT", name: "Trump Media", price: "$5.6641", priceNum: 5.6641, change: "-0.23%", changeNum: -0.23, isPositive: false, marketCap: "$1.01M", category: "Stocks", iconBg: "bg-[#2563eb]" },
  { symbol: "wNEAR", name: "Wrapped Near", price: "$4.2844", priceNum: 4.2844, change: "-3.10%", changeNum: -3.10, isPositive: false, marketCap: "$12.28M", category: "DART", iconBg: "bg-[#000]" },
];

export function TitanProView() {
  const {
    prime,
    setPrime,
    amount,
    setAmount,
    setReviewModalOpen,
    walletConnected,
    walletAddress,
    setWalletModalOpen,
    showToast,
    watchlist,
    toggleWatchlist,
    isWatchlisted,
    orders,
    addOrder,
    cancelOrder,
    tradeHistory,
    getUserBalance,
  } = useTitan();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<MarketToken>(MARKET_TOKENS[0]!);
  const [explorerTab, setExplorerTab] = useState<"all" | "tokens" | "watchlist">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("Trending");
  const [gainersOnly, setGainersOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"default" | "change" | "price">("default");

  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "slice">("market");
  const [activeBottomTab, setActiveBottomTab] = useState<"holdings" | "orders" | "history">("holdings");
  const [activeCenterView, setActiveCenterView] = useState<"chart" | "info">("chart");
  const [timeframe, setTimeframe] = useState("5m");
  const [showIndicators, setShowIndicators] = useState(true);
  const [showPositions, setShowPositions] = useState(true);
  const [conditionalOpen, setConditionalOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const curToken = selectedToken ?? MARKET_TOKENS[0]!;

  const onAmount = useGuidedField("titan-sell-amount-input", amount, setAmount);

  useCompanionContext({
    product: "Titan Exchange",
    view: "Pro Trading Terminal",
    selectedToken: curToken.symbol,
    selectedTokenPrice: curToken.priceNum,
    orderSide,
    orderType,
    payToken: orderSide === "buy" ? "USDC" : curToken.symbol,
    receiveToken: orderSide === "buy" ? curToken.symbol : "USDC",
    payAmount: amount || "0",
    estReceive:
      amount && parseFloat(amount) > 0
        ? (orderSide === "buy"
            ? (parseFloat(amount) / curToken.priceNum).toFixed(4)
            : (parseFloat(amount) * curToken.priceNum).toFixed(2))
        : "0",
    rate: `1 ${curToken.symbol} = $${curToken.priceNum.toFixed(3)} USDC`,
    prime,
    walletConnected,
    balances: {
      SOL: getUserBalance("SOL"),
      USDC: getUserBalance("USDC"),
      [curToken.symbol]: getUserBalance(curToken.symbol),
    },
    availableTokens: MARKET_TOKENS.map((t) => ({
      symbol: t.symbol,
      price: t.price,
      change: t.change,
      marketCap: t.marketCap,
    })),
    openOrdersCount: orders.length,
  });

  // Filtered and sorted tokens
  const filteredTokens = MARKET_TOKENS.filter((t) => {
    const matchesSearch =
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (explorerTab === "watchlist") return isWatchlisted(t.symbol);
    if (explorerTab === "tokens") return getUserBalance(t.symbol) > 0;

    if (gainersOnly && !t.isPositive) return false;
    if (selectedCategory && selectedCategory !== "All" && t.category !== selectedCategory) {
      // allow trending to show all
      if (selectedCategory !== "Trending") return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortOrder === "change") return b.changeNum - a.changeNum;
    if (sortOrder === "price") return b.priceNum - a.priceNum;
    return 0;
  });

  const handlePercentageFill = (pct: number) => {
    const bal = getUserBalance(orderSide === "buy" ? "USDC" : curToken.symbol);
    const calculated = (bal * pct).toFixed(4);
    setAmount(calculated);
    showToast(`Filled ${(pct * 100).toFixed(0)}% of balance (${calculated})`, "info");
  };

  const handleCopyMint = () => {
    navigator.clipboard.writeText("So11111111111111111111111111111111111111112");
    showToast("Mint address copied to clipboard: So11...1112", "success");
  };

  const handleTakeSnapshot = () => {
    showToast(`Snapshot of ${curToken.symbol}/USDC chart captured`, "success");
  };

  return (
    <div
      className={`flex flex-col lg:flex-row gap-2.5 w-full h-full min-h-[calc(100vh-120px)] text-white select-none ${
        fullscreen ? "fixed inset-0 z-50 bg-[#0d0d0c] p-3 overflow-auto" : ""
      }`}
    >
      {/* ================= COLUMN 1: LEFT TOKEN EXPLORER ================= */}
      <div className="w-full lg:w-[290px] xl:w-[310px] shrink-0 rounded-2xl border border-[#2b2927] bg-[#151513] flex flex-col p-3 overflow-hidden">
        {/* Explorer Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-[#20201d]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setExplorerTab("all");
                showToast("Showing All Assets", "info");
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                explorerTab === "all"
                  ? "bg-[#20201d] border border-[#2b2927] text-white"
                  : "text-[#78766d] hover:text-[#c2c1bc]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setExplorerTab("tokens");
                showToast("Showing Your Portfolio Assets", "info");
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                explorerTab === "tokens"
                  ? "bg-[#20201d] border border-[#2b2927] text-white"
                  : "text-[#78766d] hover:text-[#c2c1bc]"
              }`}
            >
              Your tokens
            </button>
            <button
              type="button"
              onClick={() => {
                setExplorerTab("watchlist");
                showToast("Showing Watchlist", "info");
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                explorerTab === "watchlist"
                  ? "bg-[#20201d] border border-[#2b2927] text-white"
                  : "text-[#78766d] hover:text-[#c2c1bc]"
              }`}
            >
              Watchlist
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextOrder = sortOrder === "default" ? "change" : sortOrder === "change" ? "price" : "default";
              setSortOrder(nextOrder);
              showToast(`Sorted by: ${nextOrder.toUpperCase()}`, "info");
            }}
            title="Sort tokens"
            className="p-1 text-[#78766d] hover:text-white cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search Bar + Toggle */}
        <div className="flex items-center gap-2 my-2.5">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#2b2927] bg-[#20201d] px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-[#78766d]" />
            <input
              type="text"
              data-companion="titan-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for asset..."
              className="w-full bg-transparent text-xs text-white placeholder-[#78766d] focus:outline-none"
            />
          </div>
          {/* Toggle Switch (Gainers only) */}
          <div
            onClick={() => {
              setGainersOnly(!gainersOnly);
              showToast(!gainersOnly ? "Filtering Top 24h Gainers" : "Showing all assets", "info");
            }}
            title="Filter gainers only"
            className={`h-5 w-9 rounded-full p-0.5 flex items-center cursor-pointer transition-colors ${
              gainersOnly ? "bg-[#18392b]" : "bg-[#20201d] border border-[#2b2927]"
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full shadow-sm transition-all ${
                gainersOnly ? "bg-[#00d692] ml-auto" : "bg-[#78766d]"
              }`}
            />
          </div>
        </div>

        {/* Filter Chips: Trending, Stocks, Memes, DART */}
        <div className="flex items-center gap-1.5 pb-2 text-[11px] overflow-x-auto no-scrollbar border-b border-[#20201d]">
          {["Trending", "Stocks", "Memes", "DART"].map((cat) => (
            <button
              key={cat}
              type="button"
              data-companion="titan-pro-category"
              onClick={() => {
                setSelectedCategory(cat);
                showToast(`Filter: ${cat}`, "info");
              }}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors cursor-pointer flex items-center gap-0.5 ${
                selectedCategory === cat
                  ? "bg-[#20201d] text-white border border-[#2b2927]"
                  : "text-[#78766d] hover:text-white"
              }`}
            >
              {cat === "DART" && <Zap className="h-2.5 w-2.5 fill-current text-[#f2d363]" />}
              <span>{cat}</span>
            </button>
          ))}
          <span
            onClick={() => {
              setSelectedCategory("Trending");
              setSearchQuery("");
              showToast("Filters reset", "info");
            }}
            className="rounded-md px-2 py-0.5 text-[#78766d] cursor-pointer hover:text-white"
          >
            ...
          </span>
        </div>

        {/* Scrollable Token Rows */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[620px] pt-1">
          {filteredTokens.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#78766d]">
              No assets matching current filter.
            </div>
          ) : (
            filteredTokens.map((tok) => {
              const isSelected = curToken.symbol === tok.symbol;
              return (
                <button
                  key={tok.symbol}
                  type="button"
              data-companion="titan-pro-token" data-token={tok.symbol}
                  onClick={() => {
                    setSelectedToken(tok);
                    showToast(`Selected ${tok.symbol} (${tok.name})`, "info");
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors cursor-pointer ${
                    isSelected ? "bg-[#20201d] border border-[#2b2927]" : "hover:bg-[#20201d]/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full ${tok.iconBg} flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0`}>
                      {tok.symbol[0]}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white">{tok.symbol}</span>
                        <span className="text-[9px] text-[#f2d363]">✓</span>
                      </div>
                      <div className="text-[10px] text-[#78766d]">MC:{tok.marketCap}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-medium text-white">{tok.price}</div>
                    <div className={`text-[10px] font-mono ${tok.isPositive ? "text-[#00d692]" : "text-[#f34f6a]"}`}>
                      {tok.change}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ================= COLUMN 2: CENTER CHART & PORTFOLIO ================= */}
      <div className="flex-1 rounded-2xl border border-[#2b2927] bg-[#151513] flex flex-col overflow-hidden min-w-0">
        {/* Token Summary Header */}
        <div className="flex flex-wrap items-center justify-between p-3 border-b border-[#20201d] gap-3">
          <div className="flex items-center gap-3">
            {/* Token Selector */}
            <button
              type="button"
              onClick={() => {
                const nextIdx = (MARKET_TOKENS.findIndex((t) => t.symbol === curToken.symbol) + 1) % MARKET_TOKENS.length;
                setSelectedToken(MARKET_TOKENS[nextIdx]!);
                showToast(`Switched to ${MARKET_TOKENS[nextIdx]!.symbol}`, "info");
              }}
              className="flex items-center gap-2 rounded-xl bg-[#20201d] border border-[#2b2927] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#2b2927] transition-colors cursor-pointer"
            >
              <div className={`h-5 w-5 rounded-full ${curToken.iconBg} flex items-center justify-center text-[10px] text-white`}>
                {curToken.symbol[0]}
              </div>
              <span>{curToken.symbol}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#78766d]" />
            </button>

            {/* Mint Address & Socials */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#78766d]">
              <a
                href="https://solscan.io"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white cursor-pointer"
                title="View on Solscan"
              >
                ⊙
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white cursor-pointer"
                title="View on Twitter/X"
              >
                𝕏
              </a>
              <button
                type="button"
                onClick={handleCopyMint}
                className="font-mono text-[11px] hover:text-[#f2d363] cursor-pointer"
                title="Click to copy mint address"
              >
                So11...1112
              </button>
            </div>

            {/* Price & Change */}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-mono font-extrabold text-white">{curToken.price}</span>
              <span className={`text-xs font-mono ${curToken.isPositive ? "text-[#00d692]" : "text-[#f34f6a]"}`}>
                {curToken.change}
              </span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="hidden xl:flex items-center gap-4 text-[11px] text-[#c2c1bc]">
            <div>
              <div className="text-[10px] text-[#78766d]">24H Change</div>
              <div className={`font-mono font-medium ${curToken.isPositive ? "text-[#00d692]" : "text-[#f34f6a]"}`}>
                {curToken.change}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#78766d]">24H Volume</div>
              <div className="text-white font-mono font-medium">$2.05B</div>
            </div>
            <div>
              <div className="text-[10px] text-[#78766d]">Market cap ⓘ</div>
              <div className="text-white font-mono font-medium">{curToken.marketCap}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#78766d]">FDV</div>
              <div className="text-white font-mono font-medium">$59.55B</div>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-[#20201d]">
              <Star
                data-companion="titan-pro-star"
                onClick={() => toggleWatchlist(curToken.symbol)}
                className={`h-4 w-4 cursor-pointer transition-colors ${
                  isWatchlisted(curToken.symbol) ? "text-[#f2d363] fill-current" : "text-[#78766d] hover:text-[#f2d363]"
                }`}
              />
              <span
                onClick={() => showToast(`Asset info: ${curToken.name} (${curToken.category})`, "info")}
                className="cursor-pointer hover:text-white text-[#78766d]"
              >
                ...
              </span>
            </div>
          </div>
        </div>

        {/* Chart Subheader: Timeframes, Indicators, Tools */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#20201d] text-xs bg-[#0d0d0c]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCenterView("chart")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeCenterView === "chart"
                  ? "font-semibold text-white bg-[#20201d] border border-[#2b2927]"
                  : "text-[#78766d] hover:text-white"
              }`}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveCenterView("info")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeCenterView === "info"
                  ? "font-semibold text-white bg-[#20201d] border border-[#2b2927]"
                  : "text-[#78766d] hover:text-white"
              }`}
            >
              Info
            </button>
            <div className="h-3 w-[1px] bg-[#2b2927] mx-1" />
            {["1m", "5m", "15m", "1h"].map((tf) => (
              <button
                key={tf}
                type="button"
              data-companion="titan-pro-timeframe"
                onClick={() => {
                  setTimeframe(tf);
                  showToast(`Timeframe changed to ${tf}`, "info");
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  timeframe === tf ? "text-[#f2d363] font-bold bg-[#262113]" : "text-[#78766d] hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
            <div className="h-3 w-[1px] bg-[#2b2927] mx-1" />
            <button
              type="button"
              data-companion="titan-pro-indicators"
              onClick={() => {
                setShowIndicators(!showIndicators);
                showToast(!showIndicators ? "Technical Indicators (EMA Ribbon) ON" : "Indicators OFF", "info");
              }}
              className={`hover:text-white cursor-pointer ${showIndicators ? "text-[#f2d363]" : "text-[#a8a69f]"}`}
            >
              fx Indicators
            </button>
            <RotateCcw
              onClick={() => showToast("Restored chart zoom", "info")}
              className="h-3 w-3 text-[#78766d] hover:text-white cursor-pointer"
            />
            <RotateCw
              onClick={() => showToast("Refreshed price feed", "info")}
              className="h-3 w-3 text-[#78766d] hover:text-white cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2.5 text-[#78766d]">
            <span
              onClick={() => {
                setShowPositions(!showPositions);
                showToast(!showPositions ? "Showing Open Position Lines" : "Hiding Position Lines", "info");
              }}
              className="text-[11px] flex items-center gap-1 hover:text-white cursor-pointer"
            >
              <Eye className="h-3 w-3" /> {showPositions ? "Hide Positions" : "Show Positions"}
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1 hover:text-white cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => showToast("Chart settings: Candles, Solid Grid, Auto-Scale active", "info")}
              className="p-1 hover:text-white cursor-pointer"
              title="Chart Settings"
            >
              <Settings className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleTakeSnapshot}
              className="p-1 hover:text-white cursor-pointer"
              title="Take Chart Screenshot"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* View Mode: Chart or Info */}
        {activeCenterView === "chart" ? (
          <div
            data-companion="titan-candlestick-chart"
            className="relative flex-1 min-h-[360px] bg-[#0d0d0c] p-3 flex flex-col justify-between overflow-hidden"
          >
            {/* OHLC Stats Header */}
            <div className="flex items-center gap-3 text-[11px] font-mono z-10">
              <span className="text-[#00d692]">
                O <span className="text-white">93.63</span> H <span className="text-white">93.828</span> L{" "}
                <span className="text-white">93.63</span> C <span className="text-white">93.759</span>{" "}
                +0.129416 (+0.14%)
              </span>
            </div>

            {/* Central Watermark: TITAN */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] select-none">
              <div className="flex flex-col items-center">
                <div className="text-8xl font-black tracking-widest text-white">TITAN</div>
                <div className="text-sm font-mono tracking-widest text-white uppercase mt-2">DEX Meta-Aggregator</div>
              </div>
            </div>

            {/* Candlestick Visual Simulation */}
            <div className="relative w-full flex-1 my-2 flex items-center">
              <svg viewBox="0 0 700 240" className="w-full h-full" preserveAspectRatio="none">
                {/* Horizontal Grid Lines */}
                <line x1="0" y1="40" x2="650" y2="40" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="650" y2="90" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="650" y2="140" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <line x1="0" y1="190" x2="650" y2="190" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

                {/* Optional EMA Technical Indicator Ribbon */}
                {showIndicators && (
                  <path
                    d="M 30 100 Q 150 110, 270 135 T 450 180 T 650 138"
                    fill="none"
                    stroke="#f2d363"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                )}

                {/* Candlesticks Sequence */}
                {[
                  { x: 30, o: 100, c: 92, h: 86, l: 108, green: true },
                  { x: 50, o: 92, c: 84, h: 78, l: 96, green: true },
                  { x: 70, o: 84, c: 90, h: 80, l: 94, green: false },
                  { x: 90, o: 90, c: 82, h: 76, l: 94, green: true },
                  { x: 110, o: 82, c: 88, h: 79, l: 92, green: false },
                  { x: 130, o: 88, c: 95, h: 85, l: 102, green: false },
                  { x: 150, o: 95, c: 110, h: 92, l: 116, green: false },
                  { x: 170, o: 110, c: 118, h: 106, l: 122, green: false },
                  { x: 190, o: 118, c: 125, h: 114, l: 130, green: false },
                  { x: 210, o: 125, c: 116, h: 112, l: 128, green: true },
                  { x: 230, o: 116, c: 132, h: 114, l: 138, green: false },
                  { x: 250, o: 132, c: 140, h: 128, l: 145, green: false },
                  { x: 270, o: 140, c: 135, h: 130, l: 142, green: true },
                  { x: 290, o: 135, c: 148, h: 132, l: 152, green: false },
                  { x: 310, o: 148, c: 162, h: 144, l: 168, green: false },
                  { x: 330, o: 162, c: 155, h: 150, l: 166, green: true },
                  { x: 350, o: 155, c: 170, h: 152, l: 176, green: false },
                  { x: 370, o: 170, c: 158, h: 154, l: 174, green: true },
                  { x: 390, o: 158, c: 165, h: 155, l: 170, green: false },
                  { x: 410, o: 165, c: 180, h: 160, l: 188, green: false },
                  { x: 430, o: 180, c: 195, h: 175, l: 202, green: false },
                  { x: 450, o: 195, c: 178, h: 172, l: 200, green: true },
                  { x: 470, o: 178, c: 162, h: 158, l: 184, green: true },
                  { x: 490, o: 162, c: 150, h: 145, l: 166, green: true },
                  { x: 510, o: 150, c: 158, h: 146, l: 162, green: false },
                  { x: 530, o: 158, c: 144, h: 140, l: 160, green: true },
                  { x: 550, o: 144, c: 138, h: 134, l: 148, green: true },
                ].map((c, idx) => {
                  const fill = c.green ? "#00d692" : "#f34f6a";
                  const y = Math.min(c.o, c.c);
                  const h = Math.max(Math.abs(c.c - c.o), 3);
                  return (
                    <g key={idx}>
                      <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={fill} strokeWidth="1.2" />
                      <rect x={c.x - 4} y={y} width="8" height={h} fill={fill} rx="1" />
                    </g>
                  );
                })}

                {/* Price Line on Right Axis */}
                <line x1="0" y1="138" x2="650" y2="138" stroke="#00d692" strokeDasharray="2 2" strokeWidth="1" />
              </svg>

              {/* Right Y-Axis Scale */}
              <div className="w-14 shrink-0 h-full flex flex-col justify-between text-[10px] font-mono text-[#78766d] pl-2 border-l border-[#20201d]">
                <span>95.00</span>
                <span>94.50</span>
                <span>94.00</span>
                <span className="rounded bg-[#00d692] text-black font-bold px-1 py-0.5">93.759</span>
                <span>93.50</span>
                <span>93.00</span>
              </div>
            </div>

            {/* Bottom X-Axis Time Scale */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#78766d] pt-1 border-t border-[#20201d]">
              <span>15:00</span>
              <span>16:30</span>
              <span>18:00</span>
              <span>19:30</span>
              <span>21:00</span>
              <span>23:00</span>
              <span>23:01:17 (UTC)</span>
              <div className="flex items-center gap-2">
                <span className="text-[#00d692]">%</span>
                <span>log</span>
                <span className="text-white font-bold">auto</span>
              </div>
            </div>
          </div>
        ) : (
          /* Info / Fundamentals View */
          <div className="flex-1 p-6 bg-[#0d0d0c] space-y-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{curToken.name} Market Metrics & Liquidity</span>
              <span className="rounded bg-[#20201d] px-2 py-0.5 text-xs text-[#f2d363] font-mono">
                {curToken.symbol}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[#2b2927] bg-[#151513] p-3">
                <div className="text-[10px] text-[#78766d]">24H High</div>
                <div className="text-sm font-mono font-bold text-[#00d692]">$95.20</div>
              </div>
              <div className="rounded-xl border border-[#2b2927] bg-[#151513] p-3">
                <div className="text-[10px] text-[#78766d]">24H Low</div>
                <div className="text-sm font-mono font-bold text-[#f34f6a]">$92.80</div>
              </div>
              <div className="rounded-xl border border-[#2b2927] bg-[#151513] p-3">
                <div className="text-[10px] text-[#78766d]">Circulating Supply</div>
                <div className="text-sm font-mono font-bold text-white">488.5M {curToken.symbol}</div>
              </div>
              <div className="rounded-xl border border-[#2b2927] bg-[#151513] p-3">
                <div className="text-[10px] text-[#78766d]">Argos Pool Count</div>
                <div className="text-sm font-mono font-bold text-[#f2d363]">28 Pools</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#2b2927] bg-[#151513] p-4 space-y-2">
              <div className="text-xs font-semibold text-white">Top Liquidity Venues (Titan Aggregated)</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#c2c1bc]">
                  <span>Raydium CPMM (SOL/USDC)</span>
                  <span className="font-mono text-white">$42.8M Liquidity (42%)</span>
                </div>
                <div className="flex justify-between text-[#c2c1bc]">
                  <span>Orca Whirlpools (SOL/USDC)</span>
                  <span className="font-mono text-white">$38.1M Liquidity (38%)</span>
                </div>
                <div className="flex justify-between text-[#c2c1bc]">
                  <span>Meteora DLMM</span>
                  <span className="font-mono text-white">$20.2M Liquidity (20%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Panel: Holdings, Open Orders, Order History */}
        <div className="border-t border-[#20201d] p-3 bg-[#0d0d0c] min-h-[140px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#20201d]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-companion="titan-holdings-tab"
                onClick={() => setActiveBottomTab("holdings")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  activeBottomTab === "holdings"
                    ? "bg-[#20201d] text-white border border-[#2b2927]"
                    : "text-[#78766d] hover:text-white"
                }`}
              >
                Holdings
              </button>
              <button
                type="button"
                data-companion="titan-open-orders-tab"
                onClick={() => setActiveBottomTab("orders")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeBottomTab === "orders"
                    ? "bg-[#20201d] text-white border border-[#2b2927]"
                    : "text-[#78766d] hover:text-white"
                }`}
              >
                <span>Open orders</span>
                {orders.length > 0 && (
                  <span className="h-4 w-4 rounded-full bg-[#f2d363] text-black font-bold text-[9px] flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                data-companion="titan-order-history-tab"
                onClick={() => setActiveBottomTab("history")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  activeBottomTab === "history"
                    ? "bg-[#20201d] text-white border border-[#2b2927]"
                    : "text-[#78766d] hover:text-white"
                }`}
              >
                Order history
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#78766d]">
              <span>Balance: {walletConnected ? `${getUserBalance("SOL")} SOL` : "-"}</span>
              <a href="/titan/profile" className="text-[#c2c1bc] hover:text-white cursor-pointer">
                Profile →
              </a>
            </div>
          </div>

          {/* Connected or Empty State */}
          {!walletConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <p className="text-sm font-semibold text-white">Connect your wallet</p>
              <p className="text-xs text-[#78766d] mt-1">Connect your wallet to view your portfolio and activity.</p>
              <button
                type="button"
                onClick={() => setWalletModalOpen(true)}
                className="mt-3 px-4 py-1.5 rounded-full bg-[#f2d363] hover:bg-[#ffe175] text-xs font-medium text-[#0d0d0c] cursor-pointer"
              >
                Connect Wallet
              </button>
            </div>
          ) : activeBottomTab === "holdings" ? (
            <div className="py-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#78766d] border-b border-[#20201d]">
                    <th className="pb-1.5 font-medium">Asset</th>
                    <th className="pb-1.5 font-medium">Balance</th>
                    <th className="pb-1.5 font-medium">Value (USD)</th>
                    <th className="pb-1.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20201d]">
                  {[
                    { symbol: "SOL", bal: getUserBalance("SOL"), price: 93.759, bg: "bg-gradient-to-tr from-[#9945ff] to-[#14f195]" },
                    { symbol: "USDC", bal: getUserBalance("USDC"), price: 1.0, bg: "bg-[#2775ca]" },
                    { symbol: "HYPE", bal: getUserBalance("HYPE"), price: 86.929, bg: "bg-[#00d692]" },
                  ].map((asset) => (
                    <tr key={asset.symbol}>
                      <td className="py-2 font-bold text-white flex items-center gap-2">
                        <span className={`h-5 w-5 rounded-full ${asset.bg} flex items-center justify-center text-[10px]`}>
                          {asset.symbol[0]}
                        </span>
                        {asset.symbol}
                      </td>
                      <td className="py-2 font-mono text-white">{asset.bal.toFixed(4)}</td>
                      <td className="py-2 font-mono text-[#c2c1bc]">{formatUsd(asset.bal * asset.price)}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setAmount("1");
                            showToast(`Trading ${asset.symbol}`, "info");
                          }}
                          className="text-[11px] text-[#f2d363] hover:underline mr-2 cursor-pointer"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeBottomTab === "orders" ? (
            <div className="py-2 overflow-x-auto">
              {orders.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#78766d]">No active open orders.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[#78766d] border-b border-[#20201d]">
                      <th className="pb-1.5 font-medium">Order ID</th>
                      <th className="pb-1.5 font-medium">Pair</th>
                      <th className="pb-1.5 font-medium">Side</th>
                      <th className="pb-1.5 font-medium">Price</th>
                      <th className="pb-1.5 font-medium">Size</th>
                      <th className="pb-1.5 font-medium">Type</th>
                      <th className="pb-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#20201d]">
                    {orders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="py-2 font-mono text-[#78766d]">{ord.id}</td>
                        <td className="py-2 font-bold text-white">{ord.pair}</td>
                        <td className={`py-2 uppercase font-bold text-[10px] ${ord.side === "buy" ? "text-[#00d692]" : "text-[#f34f6a]"}`}>
                          {ord.side}
                        </td>
                        <td className="py-2 font-mono text-white">${ord.price}</td>
                        <td className="py-2 font-mono text-white">{ord.amount}</td>
                        <td className="py-2 text-[10px] text-[#f2d363] font-semibold">{ord.type}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => cancelOrder(ord.id)}
                            className="text-[10px] text-[#f34f6a] hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Order history view */
            <div className="py-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#78766d] border-b border-[#20201d]">
                    <th className="pb-1.5 font-medium">Time</th>
                    <th className="pb-1.5 font-medium">Trade</th>
                    <th className="pb-1.5 font-medium">Input</th>
                    <th className="pb-1.5 font-medium">Output</th>
                    <th className="pb-1.5 font-medium text-right">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20201d]">
                  {tradeHistory.map((th) => (
                    <tr key={th.id}>
                      <td className="py-2 text-[#78766d]">{th.time}</td>
                      <td className="py-2 font-semibold text-white">
                        {th.inToken} → {th.outToken}
                      </td>
                      <td className="py-2 font-mono text-white">
                        {th.inAmount} {th.inToken}
                      </td>
                      <td className="py-2 font-mono text-[#00d692]">
                        {th.outAmount} {th.outToken}
                      </td>
                      <td className="py-2 text-right">
                        <a
                          href="https://solscan.io"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-[#f2d363] hover:underline"
                        >
                          {th.txHash} ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= COLUMN 3: RIGHT TRADING TERMINAL ================= */}
      <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 rounded-2xl border border-[#2b2927] bg-[#151513] flex flex-col p-3.5 shadow-xl">
        {/* Order Type Tabs (Market, Limit, Slice) & Prime Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20201d]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-companion="titan-pro-mode-market"
              onClick={() => {
                setOrderType("market");
                showToast("Order type: Market", "info");
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                orderType === "market" ? "bg-[#20201d] text-white border border-[#2b2927]" : "text-[#78766d] hover:text-white"
              }`}
            >
              Market
            </button>
            <button
              type="button"
              data-companion="titan-pro-mode-limit"
              onClick={() => {
                setOrderType("limit");
                showToast("Order type: Limit", "info");
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                orderType === "limit" ? "bg-[#20201d] text-white border border-[#2b2927]" : "text-[#78766d] hover:text-white"
              }`}
            >
              Limit
            </button>
            <button
              type="button"
              data-companion="titan-pro-mode-slice"
              onClick={() => {
                setOrderType("slice");
                showToast("Order type: Slice", "info");
              }}
              className={`flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium transition-all cursor-pointer ${
                orderType === "slice" ? "bg-[#20201d] text-white border border-[#2b2927]" : "text-[#78766d] hover:text-white"
              }`}
            >
              <span>Slice</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Prime Badge */}
          <button
            type="button"
            data-companion="titan-prime-toggle"
            onClick={() => {
              setPrime(!prime);
              showToast(!prime ? "Titan Prime Enabled" : "Titan Prime Disabled", "info");
            }}
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border cursor-pointer ${
              prime ? "border-[#f2d363]/40 bg-[#262113] text-[#f2d363]" : "border-[#2b2927] text-[#78766d]"
            }`}
          >
            <Sparkles className="h-3 w-3 text-[#f2d363]" />
            <span>Prime</span>
          </button>
        </div>

        {/* Buy / Sell Toggle */}
        <div className="grid grid-cols-2 gap-1.5 my-3 rounded-xl bg-[#20201d] p-1 border border-[#2b2927]">
          <button
            type="button"
            data-companion="titan-pro-side-buy"
            onClick={() => setOrderSide("buy")}
            className={`rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              orderSide === "buy" ? "bg-[#18392b] text-[#00d692] shadow-sm" : "text-[#78766d] hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            data-companion="titan-pro-side-sell"
            onClick={() => setOrderSide("sell")}
            className={`rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              orderSide === "sell" ? "bg-[#3d1818] text-[#f34f6a] shadow-sm" : "text-[#78766d] hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Pay with Box */}
        <div className="rounded-xl border border-[#2b2927] bg-[#20201d] p-3 mb-2.5">
          <div className="flex items-center justify-between text-xs text-[#78766d]">
            <span>Pay with</span>
            <span className="font-mono text-[11px]">
              Balance: {walletConnected ? `${getUserBalance(orderSide === "buy" ? "USDC" : curToken.symbol)}` : "-"}
            </span>
          </div>

          <div className="flex items-center justify-between my-2">
            <input
              data-companion="titan-sell-amount-input"
              type="text"
              value={amount}
              onChange={(e) => onAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent text-[32px] font-medium text-white placeholder-[#78766d] focus:outline-none"
            />
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#151513] border border-[#2b2927] px-2.5 py-1 text-xs font-medium text-white shrink-0"
            >
              <span className="h-4 w-4 rounded-full bg-[#2775ca] flex items-center justify-center text-[10px] text-white font-bold">
                $
              </span>
              <span>{orderSide === "buy" ? "USDC" : curToken.symbol}</span>
              <ChevronDown className="h-3 w-3 text-[#78766d]" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#78766d]">
            <span>≈ $0.00</span>
            <div className="flex items-center gap-1">
              {[0.05, 0.1, 0.25, 0.5, 1.0].map((pct, idx) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageFill(pct)}
                  className="rounded px-1.5 py-0.5 bg-[#151513] hover:bg-[#2b2927] text-[10px] text-[#78766d] hover:text-white font-mono border border-[#2b2927] cursor-pointer"
                >
                  {idx === 4 ? "Max" : `${pct * 100}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Est. receive Box */}
        <div className="rounded-xl border border-[#2b2927] bg-[#20201d] p-3 mb-3">
          <div className="flex items-center justify-between text-xs text-[#78766d]">
            <span>Est. receive</span>
          </div>

          <div className="flex items-center justify-between my-2">
            <span data-companion="titan-buy-amount-output" className="text-[32px] font-medium text-white font-mono">
              {amount ? (parseFloat(amount) / curToken.priceNum).toFixed(4) : "0"}
            </span>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#151513] border border-[#2b2927] px-2.5 py-1 text-xs font-medium text-white shrink-0"
            >
              <span className={`h-4 w-4 rounded-full ${curToken.iconBg} flex items-center justify-center text-[10px] text-white font-bold`}>
                {orderSide === "buy" ? curToken.symbol[0] : "$"}
              </span>
              <span>{orderSide === "buy" ? curToken.symbol : "USDC"}</span>
              <ChevronDown className="h-3 w-3 text-[#78766d]" />
            </button>
          </div>

          <div className="text-[11px] text-[#78766d]">
            <span>≈ {amount ? `$${(parseFloat(amount) * (orderSide === "buy" ? 1 : curToken.priceNum)).toFixed(2)}` : "$0.00"}</span>
          </div>
        </div>

        {/* Rate line */}
        <div data-companion="titan-rate-display" className="flex items-center justify-between text-[11px] text-[#78766d] pb-2">
          <span>1 {curToken.symbol} ≈ {curToken.price} USDC</span>
          <span>⇄</span>
        </div>

        {/* Conditional Orders Accordion */}
        <div className="border-t border-[#20201d] pt-2 mb-3">
          <button
            type="button"
            onClick={() => setConditionalOpen(!conditionalOpen)}
            className="w-full flex items-center justify-between text-xs font-medium text-white py-1 cursor-pointer"
          >
            <span>Conditional orders</span>
            <ChevronUp className={`h-3.5 w-3.5 text-[#78766d] transition-transform ${conditionalOpen ? "" : "rotate-180"}`} />
          </button>

          {conditionalOpen && (
            <div className="mt-2 rounded-xl border border-[#f2d363]/20 bg-[#1e1c14] p-3 text-left">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-[#f2d363] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <div className="font-bold text-white">Titan embedded wallet</div>
                  <p className="text-[#a8a69f] mt-0.5 text-[11px]">
                    Conditional orders need a Titan wallet to hold your tokens until your price is hit. Your keys stay
                    yours - withdraw any time.
                  </p>
                  <p
                    onClick={() => setWalletModalOpen(true)}
                    className="text-[#f2d363] font-medium mt-1 cursor-pointer hover:underline text-[11px]"
                  >
                    Connect a wallet to set one up.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Connect Wallet / Place Order */}
        <button
          type="button"
          data-companion="titan-swap-review"
          onClick={() => {
            if (!walletConnected) {
              setWalletModalOpen(true);
            } else {
              addOrder({
                pair: `${curToken.symbol}/USDC`,
                side: orderSide,
                price: curToken.price.replace("$", "").replace(",", ""),
                amount: amount || "1",
                type: orderType.toUpperCase(),
              });
              setActiveBottomTab("orders");
            }
          }}
          className={`w-full mt-auto rounded-full py-3.5 text-sm font-medium transition-colors cursor-pointer ${
            walletConnected
              ? orderSide === "buy"
                ? "bg-[#00d692] hover:bg-[#20e6a6] text-[#0d0d0c]"
                : "bg-[#f34f6a] hover:bg-[#fb7185] text-white"
              : "bg-[#f2d363] hover:bg-[#ffe175] text-[#0d0d0c]"
          }`}
        >
          {walletConnected
            ? `Place ${orderSide === "buy" ? "Buy" : "Sell"} ${orderType.toUpperCase()} Order`
            : "Connect Wallet"}
        </button>
      </div>
    </div>
  );
}
