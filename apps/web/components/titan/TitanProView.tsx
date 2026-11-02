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
} from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { formatUsd } from "@/lib/products/titan/tokens";

interface MarketToken {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  marketCap: string;
  iconBg: string;
}

const MARKET_TOKENS: MarketToken[] = [
  { symbol: "SOL", name: "Solana", price: "$93.759", change: "-1.63%", isPositive: false, marketCap: "$55.31B", iconBg: "bg-gradient-to-tr from-[#9945ff] to-[#14f195]" },
  { symbol: "HYPE", name: "Hyperliquid", price: "$86.929", change: "-0.56%", isPositive: false, marketCap: "$55.15M", iconBg: "bg-[#00d692]" },
  { symbol: "PUMP", name: "Pump.fun", price: "$0.00412891", change: "-1.96%", isPositive: false, marketCap: "$1.69B", iconBg: "bg-[#10b981]" },
  { symbol: "ZEC", name: "Zcash", price: "$1,219.70", change: "-2.19%", isPositive: false, marketCap: "$124.88M", iconBg: "bg-[#f59e0b]" },
  { symbol: "cbBTC", name: "Coinbase BTC", price: "$77,768.90", change: "+0.44%", isPositive: true, marketCap: "$230.04M", iconBg: "bg-[#3b82f6]" },
  { symbol: "ETH", name: "Ethereum", price: "$2,260.63", change: "+0.38%", isPositive: true, marketCap: "$95.09M", iconBg: "bg-[#627eea]" },
  { symbol: "TRUMP", name: "Official Trump", price: "$1.701", change: "+8.08%", isPositive: true, marketCap: "$479.45M", iconBg: "bg-[#ef4444]" },
  { symbol: "WBTC", name: "Wrapped BTC", price: "$77,775.57", change: "+0.43%", isPositive: true, marketCap: "$190.6M", iconBg: "bg-[#f7931a]" },
  { symbol: "SPCX", name: "SpaceX Pre", price: "$137.04", change: "+0.01%", isPositive: true, marketCap: "$12.16M", iconBg: "bg-[#1e293b]" },
  { symbol: "TTWO", name: "Take-Two", price: "$193.33", change: "+0.59%", isPositive: true, marketCap: "$2.9M", iconBg: "bg-[#a855f7]" },
  { symbol: "DJT", name: "Trump Media", price: "$5.6641", change: "-0.23%", isPositive: false, marketCap: "$1.01M", iconBg: "bg-[#2563eb]" },
  { symbol: "wNEAR", name: "Wrapped Near", price: "$4.2844", change: "-3.10%", isPositive: false, marketCap: "$12.28M", iconBg: "bg-[#000]" },
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
  } = useTitan();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<MarketToken>(MARKET_TOKENS[0]!);
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "slice">("market");
  const [activeBottomTab, setActiveBottomTab] = useState<"holdings" | "orders" | "history">("holdings");
  const [timeframe, setTimeframe] = useState("5m");
  const [conditionalOpen, setConditionalOpen] = useState(true);
  const [placedOrders, setPlacedOrders] = useState<Array<{ id: string; pair: string; side: "buy" | "sell"; price: string; amount: string; time: string }>>([
    { id: "ord-1", pair: "SOL/USDC", side: "buy", price: "91.50", amount: "2.5", time: "10 mins ago" },
  ]);

  const curToken = selectedToken ?? MARKET_TOKENS[0]!;

  const filteredTokens = MARKET_TOKENS.filter((t) =>
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-2.5 w-full h-full min-h-[calc(100vh-120px)] text-white select-none">
      {/* ================= COLUMN 1: LEFT TOKEN EXPLORER ================= */}
      <div className="w-full lg:w-[290px] xl:w-[320px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#0f0f0e] flex flex-col p-3 overflow-hidden">
        {/* Explorer Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-lg bg-white/[0.1] px-2.5 py-1 text-xs font-semibold text-white"
            >
              All
            </button>
            <button
              type="button"
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[#8a8a8a] hover:text-white"
            >
              Your tokens
            </button>
            <button
              type="button"
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[#8a8a8a] hover:text-white"
            >
              Watchlist
            </button>
          </div>
          <button type="button" className="p-1 text-[#8a8a8a] hover:text-white">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search Bar + Toggle */}
        <div className="flex items-center gap-2 my-2.5">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#161615] px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-[#737373]" />
            <input
              type="text"
              data-companion="titan-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for asset..."
              className="w-full bg-transparent text-xs text-white placeholder-[#737373] focus:outline-none"
            />
          </div>
          {/* Toggle Switch */}
          <div className="h-5 w-9 rounded-full bg-[#1b3b2b] p-0.5 flex items-center cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-[#00d692] shadow-sm ml-auto" />
          </div>
        </div>

        {/* Filter Chips: Trending, Stocks, Memes, DART */}
        <div className="flex items-center gap-1.5 pb-2 text-[11px] overflow-x-auto no-scrollbar">
          <span className="rounded-md bg-white/[0.08] px-2 py-0.5 font-medium text-white">
            Trending
          </span>
          <span className="rounded-md px-2 py-0.5 text-[#8a8a8a] hover:text-white">
            Stocks
          </span>
          <span className="rounded-md px-2 py-0.5 text-[#8a8a8a] hover:text-white">
            Memes
          </span>
          <span className="rounded-md px-2 py-0.5 text-[#fed766] flex items-center gap-0.5">
            <Zap className="h-2.5 w-2.5 fill-current" /> DART
          </span>
          <span className="rounded-md px-2 py-0.5 text-[#8a8a8a]">...</span>
        </div>

        {/* Scrollable Token Rows */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[620px]">
          {filteredTokens.map((tok) => {
            const isSelected = curToken.symbol === tok.symbol;
            return (
              <button
                key={tok.symbol}
                type="button"
                onClick={() => setSelectedToken(tok)}
                className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors ${
                  isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full ${tok.iconBg} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                    {tok.symbol[0]}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white">{tok.symbol}</span>
                      <span className="text-[9px] text-[#fed766]">✓</span>
                    </div>
                    <div className="text-[10px] text-[#737373]">MC: {tok.marketCap}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-white">{tok.price}</div>
                  <div className={`text-[10px] font-mono ${tok.isPositive ? "text-[#00d692]" : "text-[#f43f5e]"}`}>
                    {tok.change}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= COLUMN 2: CENTER CHART & PORTFOLIO ================= */}
      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[#0f0f0e] flex flex-col overflow-hidden min-w-0">
        {/* Token Summary Header */}
        <div className="flex flex-wrap items-center justify-between p-3 border-b border-white/[0.06] gap-3">
          <div className="flex items-center gap-3">
            {/* Token Selector */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 text-sm font-bold text-white hover:bg-white/[0.08]"
            >
              <div className={`h-5 w-5 rounded-full ${curToken.iconBg} flex items-center justify-center text-[10px] text-white`}>
                {curToken.symbol[0]}
              </div>
              <span>{curToken.symbol}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8a8a8a]" />
            </button>

            {/* Mint Address & Socials */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#737373]">
              <button type="button" className="hover:text-white">⊙</button>
              <button type="button" className="hover:text-white">𝕏</button>
              <span className="font-mono text-[11px]">So11...1112</span>
            </div>

            {/* Price & Change */}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-mono font-extrabold text-white">{curToken.price}</span>
              <span className="text-xs font-mono text-[#f43f5e]">-1.63% (-$1.558)</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="hidden xl:flex items-center gap-4 text-[11px] text-[#8a8a8a]">
            <div>
              <div className="text-[10px] text-[#737373]">24H Change</div>
              <div className="text-[#f43f5e] font-mono font-medium">-1.63%</div>
            </div>
            <div>
              <div className="text-[10px] text-[#737373]">24H Volume</div>
              <div className="text-white font-mono font-medium">$2.05B</div>
            </div>
            <div>
              <div className="text-[10px] text-[#737373]">Market cap ⓘ</div>
              <div className="text-white font-mono font-medium">$55.31B</div>
            </div>
            <div>
              <div className="text-[10px] text-[#737373]">FDV</div>
              <div className="text-white font-mono font-medium">$59.55B</div>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <Star className="h-4 w-4 hover:text-[#fed766] cursor-pointer" />
              <span className="cursor-pointer hover:text-white">...</span>
            </div>
          </div>
        </div>

        {/* Chart Subheader: Timeframes, Indicators, Tools */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white px-2 py-0.5 rounded bg-white/[0.08]">Chart</span>
            <span className="text-[#737373] hover:text-white cursor-pointer px-2">Info</span>
            <div className="h-3 w-[1px] bg-white/[0.1] mx-1" />
            {["1m", "5m", "15m", "1h"].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  timeframe === tf ? "text-[#fed766] font-bold bg-[#fed766]/10" : "text-[#8a8a8a] hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
            <span className="text-[#737373] cursor-pointer">v</span>
            <div className="h-3 w-[1px] bg-white/[0.1] mx-1" />
            <span className="text-[#8a8a8a] hover:text-white cursor-pointer">fx Indicators</span>
            <RotateCcw className="h-3 w-3 text-[#737373] hover:text-white cursor-pointer" />
            <RotateCw className="h-3 w-3 text-[#737373] hover:text-white cursor-pointer" />
          </div>

          <div className="flex items-center gap-2.5 text-[#737373]">
            <span className="text-[11px] flex items-center gap-1 hover:text-white cursor-pointer">
              <Eye className="h-3 w-3" /> Hide Positions
            </span>
            <Maximize2 className="h-3 w-3 hover:text-white cursor-pointer" />
            <Settings className="h-3 w-3 hover:text-white cursor-pointer" />
            <Camera className="h-3 w-3 hover:text-white cursor-pointer" />
          </div>
        </div>

        {/* Candlestick Chart Area (SVG / Canvas rendering) */}
        <div
          data-companion="titan-candlestick-chart"
          className="relative flex-1 min-h-[360px] bg-[#0c0c0b] p-3 flex flex-col justify-between overflow-hidden"
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
            {/* SVG Candlestick Bars */}
            <svg viewBox="0 0 700 240" className="w-full h-full" preserveAspectRatio="none">
              {/* Horizontal Grid Lines */}
              <line x1="0" y1="40" x2="650" y2="40" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="650" y2="90" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="650" y2="140" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="0" y1="190" x2="650" y2="190" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

              {/* Candlesticks Sequence (Green & Red) */}
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
                const fill = c.green ? "#00d692" : "#f43f5e";
                const y = Math.min(c.o, c.c);
                const h = Math.max(Math.abs(c.c - c.o), 3);
                return (
                  <g key={idx}>
                    {/* Wick */}
                    <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={fill} strokeWidth="1.2" />
                    {/* Body */}
                    <rect x={c.x - 4} y={y} width="8" height={h} fill={fill} rx="1" />
                  </g>
                );
              })}

              {/* Price Line & Pill on Right Axis */}
              <line x1="0" y1="138" x2="650" y2="138" stroke="#00d692" strokeDasharray="2 2" strokeWidth="1" />
            </svg>

            {/* Right Y-Axis Scale */}
            <div className="w-14 shrink-0 h-full flex flex-col justify-between text-[10px] font-mono text-[#737373] pl-2 border-l border-white/[0.06]">
              <span>95.00</span>
              <span>94.50</span>
              <span>94.00</span>
              <span className="rounded bg-[#00d692] text-black font-bold px-1 py-0.5">93.759</span>
              <span>93.50</span>
              <span>93.00</span>
            </div>
          </div>

          {/* Bottom X-Axis Time Scale */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#737373] pt-1 border-t border-white/[0.06]">
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

        {/* Bottom Panel: Holdings, Open Orders, Order History */}
        <div className="border-t border-white/[0.08] p-3 bg-[#0d0d0c] min-h-[140px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-companion="titan-holdings-tab"
                onClick={() => setActiveBottomTab("holdings")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  activeBottomTab === "holdings" ? "bg-white/[0.08] text-white" : "text-[#8a8a8a] hover:text-white"
                }`}
              >
                Holdings
              </button>
              <button
                type="button"
                data-companion="titan-open-orders-tab"
                onClick={() => setActiveBottomTab("orders")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  activeBottomTab === "orders" ? "bg-white/[0.08] text-white" : "text-[#8a8a8a] hover:text-white"
                }`}
              >
                Open orders
              </button>
              <button
                type="button"
                data-companion="titan-order-history-tab"
                onClick={() => setActiveBottomTab("history")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  activeBottomTab === "history" ? "bg-white/[0.08] text-white" : "text-[#8a8a8a] hover:text-white"
                }`}
              >
                Order history
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#737373]">
              <span>Balance: {walletConnected ? "12.50 SOL" : "-"}</span>
              <a href="/titan/profile" className="text-[#fed766] hover:underline cursor-pointer">Profile →</a>
            </div>
          </div>

          {/* Connected or Empty State */}
          {!walletConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <p className="text-sm font-semibold text-white">Connect your wallet</p>
              <p className="text-xs text-[#737373] mt-1">Connect your wallet to view your portfolio and activity.</p>
              <button
                type="button"
                onClick={() => setWalletModalOpen(true)}
                className="mt-3 rounded-full bg-[#fed766] px-4 py-1 text-xs font-bold text-black hover:bg-[#ffe082]"
              >
                Connect Wallet
              </button>
            </div>
          ) : activeBottomTab === "holdings" ? (
            <div className="py-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#737373] border-b border-white/[0.04]">
                    <th className="pb-1.5 font-medium">Asset</th>
                    <th className="pb-1.5 font-medium">Balance</th>
                    <th className="pb-1.5 font-medium">Value (USD)</th>
                    <th className="pb-1.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  <tr>
                    <td className="py-2 font-bold text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-gradient-to-tr from-[#9945ff] to-[#14f195] flex items-center justify-center text-[10px]">S</span>
                      SOL
                    </td>
                    <td className="py-2 font-mono text-white">12.5000</td>
                    <td className="py-2 font-mono text-[#dcdcdc]">$1,171.98</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => setAmount("1")} className="text-[11px] text-[#fed766] hover:underline mr-2">Trade</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#2775ca] flex items-center justify-center text-[10px]">$</span>
                      USDC
                    </td>
                    <td className="py-2 font-mono text-white">2,500.00</td>
                    <td className="py-2 font-mono text-[#dcdcdc]">$2,500.00</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => setAmount("100")} className="text-[11px] text-[#fed766] hover:underline mr-2">Trade</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#00d692] flex items-center justify-center text-[10px]">H</span>
                      HYPE
                    </td>
                    <td className="py-2 font-mono text-white">45.00</td>
                    <td className="py-2 font-mono text-[#dcdcdc]">$3,911.80</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => setAmount("5")} className="text-[11px] text-[#fed766] hover:underline mr-2">Trade</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : activeBottomTab === "orders" ? (
            <div className="py-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#737373] border-b border-white/[0.04]">
                    <th className="pb-1.5 font-medium">Order ID</th>
                    <th className="pb-1.5 font-medium">Pair</th>
                    <th className="pb-1.5 font-medium">Side</th>
                    <th className="pb-1.5 font-medium">Price</th>
                    <th className="pb-1.5 font-medium">Size</th>
                    <th className="pb-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {placedOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="py-2 font-mono text-[#737373]">{ord.id}</td>
                      <td className="py-2 font-bold text-white">{ord.pair}</td>
                      <td className={`py-2 uppercase font-bold text-[10px] ${ord.side === "buy" ? "text-[#00d692]" : "text-[#f43f5e]"}`}>
                        {ord.side}
                      </td>
                      <td className="py-2 font-mono text-white">${ord.price}</td>
                      <td className="py-2 font-mono text-white">{ord.amount}</td>
                      <td className="py-2 text-[10px] text-[#fed766] font-semibold">Active</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-[#737373]">
              No past filled orders in this session.
            </div>
          )}
        </div>
      </div>

      {/* ================= COLUMN 3: RIGHT TRADING TERMINAL ================= */}
      <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#0f0f0e] flex flex-col p-4 shadow-xl">
        {/* Order Type Tabs (Market, Limit, Slice) & Prime Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOrderType("market")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                orderType === "market" ? "bg-white/[0.1] text-white" : "text-[#8a8a8a] hover:text-white"
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setOrderType("limit")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                orderType === "limit" ? "bg-white/[0.1] text-white" : "text-[#8a8a8a] hover:text-white"
              }`}
            >
              Limit
            </button>
            <button
              type="button"
              onClick={() => setOrderType("slice")}
              className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium text-[#8a8a8a] hover:text-white"
            >
              <span>Slice</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Prime Badge */}
          <button
            type="button"
            data-companion="titan-prime-toggle"
            onClick={() => setPrime(!prime)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              prime ? "border-[#fed766]/50 bg-[#262113] text-[#fed766]" : "border-white/[0.08] text-[#8a8a8a]"
            }`}
          >
            <Sparkles className="h-3 w-3 text-[#fed766]" />
            <span>Prime</span>
          </button>
        </div>

        {/* Buy / Sell Toggle */}
        <div className="grid grid-cols-2 gap-1.5 my-3 rounded-xl bg-[#171716] p-1">
          <button
            type="button"
            onClick={() => setOrderSide("buy")}
            className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
              orderSide === "buy" ? "bg-[#18392b] text-[#00d692] shadow-sm" : "text-[#8a8a8a] hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setOrderSide("sell")}
            className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
              orderSide === "sell" ? "bg-[#3d1818] text-[#f43f5e] shadow-sm" : "text-[#8a8a8a] hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Pay with Box */}
        <div className="rounded-xl border border-white/[0.08] bg-[#161615] p-3 mb-2.5">
          <div className="flex items-center justify-between text-xs text-[#8a8a8a]">
            <span>Pay with</span>
            <span className="font-mono text-[11px]">Balance: -</span>
          </div>

          <div className="flex items-center justify-between my-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-[#454545] focus:outline-none"
            />
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#242424] px-2.5 py-1 text-xs font-bold text-white shrink-0"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-[#2775ca] flex items-center justify-center text-[9px]">
                $
              </span>
              <span>USDC</span>
              <ChevronDown className="h-3 w-3 text-[#8a8a8a]" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#737373]">
            <span>≈ $0.00</span>
            <div className="flex items-center gap-1">
              {["5%", "10%", "25%", "50%", "Max"].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className="rounded px-1.5 py-0.5 bg-white/[0.04] hover:bg-white/[0.08] text-[10px] text-[#8a8a8a] hover:text-white font-mono"
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Est. receive Box */}
        <div className="rounded-xl border border-white/[0.08] bg-[#161615] p-3 mb-3">
          <div className="flex items-center justify-between text-xs text-[#8a8a8a]">
            <span>Est. receive</span>
          </div>

          <div className="flex items-center justify-between my-2">
            <span className="text-2xl font-bold text-white font-mono">0</span>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#242424] px-2.5 py-1 text-xs font-bold text-white shrink-0"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-[#9945ff] to-[#14f195] flex items-center justify-center text-[9px]">
                S
              </span>
              <span>SOL</span>
              <ChevronDown className="h-3 w-3 text-[#8a8a8a]" />
            </button>
          </div>

          <div className="text-[11px] text-[#737373]">
            <span>≈ $0.00</span>
          </div>
        </div>

        {/* Rate line */}
        <div className="flex items-center justify-between text-[11px] text-[#8a8a8a] pb-2">
          <span>1 SOL ≈ ... USDC</span>
          <span>⇄</span>
        </div>

        {/* Conditional Orders Accordion */}
        <div className="border-t border-white/[0.06] pt-2 mb-3">
          <button
            type="button"
            onClick={() => setConditionalOpen(!conditionalOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-white py-1"
          >
            <span>Conditional orders</span>
            <ChevronUp className={`h-3.5 w-3.5 text-[#8a8a8a] transition-transform ${conditionalOpen ? "" : "rotate-180"}`} />
          </button>

          {conditionalOpen && (
            <div className="mt-2 rounded-xl border border-amber-500/20 bg-[#1a180e] p-3 text-left">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-[#fed766] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <div className="font-bold text-white">Titan embedded wallet</div>
                  <p className="text-[#a8a69f] mt-0.5">
                    Conditional orders need a Titan wallet to hold your tokens until your price is hit. Your keys stay
                    yours - withdraw any time.
                  </p>
                  <p className="text-[#fed766] font-medium mt-1 cursor-pointer hover:underline">
                    Connect a wallet to set one up.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gold Action Button: Connect Wallet / Place Order */}
        <button
          type="button"
          data-companion="titan-swap-review"
          onClick={() => {
            if (!walletConnected) {
              setWalletModalOpen(true);
            } else {
              setPlacedOrders((prev) => [
                {
                  id: `ord-${Date.now().toString().slice(-4)}`,
                  pair: `${curToken.symbol}/USDC`,
                  side: orderSide,
                  price: curToken.price.replace("$", "").replace(",", ""),
                  amount: amount || "1",
                  time: "Just now",
                },
                ...prev,
              ]);
              setActiveBottomTab("orders");
            }
          }}
          className={`w-full mt-auto rounded-xl py-3 text-sm font-extrabold text-black transition-all shadow-[0_0_18px_rgba(254,215,102,0.25)] cursor-pointer ${
            walletConnected
              ? orderSide === "buy"
                ? "bg-[#00d692] hover:bg-[#20e6a6] text-black"
                : "bg-[#f43f5e] hover:bg-[#fb7185] text-white"
              : "bg-[#fed766] hover:bg-[#ffe082]"
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
