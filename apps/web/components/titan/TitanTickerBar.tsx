"use client";

import React, { useState } from "react";
import { BarChart2, Star, EyeOff, Eye } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  color: string;
}

const TICKER_DATA: TickerItem[] = [
  { symbol: "SOL", price: "$93.907", change: "-1.61%", isPositive: false, color: "#9945FF" },
  { symbol: "HYPE", price: "$87.940", change: "-0.09%", isPositive: false, color: "#00E599" },
  { symbol: "PUMP", price: "$0.0042", change: "-1.06%", isPositive: false, color: "#14F195" },
  { symbol: "cbBTC", price: "$78,026.63", change: "+0.68%", isPositive: true, color: "#0052FF" },
  { symbol: "ZEC", price: "$1,225.82", change: "-2.18%", isPositive: false, color: "#F4B237" },
  { symbol: "ETH", price: "$2,268.91", change: "+0.67%", isPositive: true, color: "#627EEA" },
  { symbol: "TRUMP", price: "$1.744", change: "+10.54%", isPositive: true, color: "#C42127" },
  { symbol: "WBTC", price: "$77,956.55", change: "+0.64%", isPositive: true, color: "#F7931A" },
  { symbol: "SPCX", price: "$137.409", change: "+0.27%", isPositive: true, color: "#000000" },
  { symbol: "TTWO", price: "$193.37", change: "+0.56%", isPositive: true, color: "#E31B23" },
  { symbol: "DJT", price: "$5.706", change: "+0.68%", isPositive: true, color: "#1D4ED8" },
  { symbol: "JupSOL", price: "$114.63", change: "-1.28%", isPositive: false, color: "#7452F5" },
  { symbol: "NVDAx", price: "$205.82", change: "+0.82%", isPositive: true, color: "#76B900" },
  { symbol: "wNEAR", price: "$4.263", change: "-3.55%", isPositive: false, color: "#000000" },
  { symbol: "STONK", price: "$0.121", change: "-3.87%", isPositive: false, color: "#3B82F6" },
  { symbol: "XMR", price: "$599.41", change: "-0.49%", isPositive: false, color: "#FF6600" },
  { symbol: "CARDS", price: "$0.232", change: "-3.37%", isPositive: false, color: "#8B5CF6" },
];

export function TitanTickerBar() {
  const { selectTokenBySymbol, watchlist, showToast } = useTitan();
  const [tickerVisible, setTickerVisible] = useState(true);
  const [filterMode, setFilterMode] = useState<"popular" | "watchlist">("popular");

  const displayTokens = filterMode === "watchlist"
    ? TICKER_DATA.filter((t) => watchlist.includes(t.symbol))
    : TICKER_DATA;

  const effectiveTokens = displayTokens.length > 0 ? displayTokens : TICKER_DATA;

  if (!tickerVisible) {
    return (
      <div className="w-full bg-[#0d0d0c] px-4 py-1 flex items-center justify-end border-b border-white/[0.05]">
        <button
          type="button"
          onClick={() => {
            setTickerVisible(true);
            showToast("Market ticker shown", "info");
          }}
          className="flex items-center gap-1.5 text-[11px] text-[#78766d] hover:text-white transition-colors cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Show Ticker</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-white/[0.06] bg-[#0d0d0c] h-10 px-4 md:px-8 lg:px-10 flex items-center relative overflow-hidden text-xs select-none">
      {/* Left controls pill matching official layout */}
      <div className="flex items-center gap-1 pr-3 shrink-0 z-20">
        <div className="flex items-center bg-[#151513] border border-[#33312e] rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => {
              setFilterMode("popular");
              showToast("Showing Popular Market Tickers", "info");
            }}
            title="Popular tokens"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              filterMode === "popular" ? "bg-[#2b2927] text-[#f2d363]" : "text-[#78766d] hover:text-white"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode("watchlist");
              showToast(`Showing Watchlisted Tickers (${watchlist.length} active)`, "info");
            }}
            title="Watchlist"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              filterMode === "watchlist" ? "bg-[#2b2927] text-[#f2d363]" : "text-[#78766d] hover:text-white"
            }`}
          >
            <Star className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setTickerVisible(false);
              showToast("Market ticker hidden. Click 'Show Ticker' to restore.", "info");
            }}
            title="Hide ticker"
            className="p-1.5 rounded-lg text-[#78766d] hover:text-white transition-colors cursor-pointer"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Marquee with left and right gradient masks */}
      <div className="relative flex min-w-0 flex-1 h-full items-center overflow-hidden">
        <div className="h-full w-14 absolute left-0 z-10 pointer-events-none bg-gradient-to-r from-[#0d0d0c] to-transparent" />
        <div className="h-full w-14 absolute right-0 z-10 pointer-events-none bg-gradient-to-l from-[#0d0d0c] to-transparent" />

        <div className="flex gap-4 items-center animate-[marquee_45s_linear_infinite] whitespace-nowrap pl-4">
          {[...effectiveTokens, ...effectiveTokens].map((item, idx) => (
            <div
              key={`${item.symbol}-${idx}`}
              onClick={() => selectTokenBySymbol(item.symbol)}
              className="inline-flex items-center gap-2 hover:bg-[#20201d] rounded-full py-1 pr-3 pl-1.5 transition-colors cursor-pointer group active:scale-95"
              title={`Click to trade ${item.symbol}`}
            >
              {/* Token badge icon */}
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm"
                style={{ backgroundColor: item.color }}
              >
                {item.symbol.slice(0, 2)}
              </div>
              <span className="font-medium text-white text-[12px] group-hover:text-[#f2d363] transition-colors">
                {item.symbol}
              </span>
              <span className="font-mono text-[#c2c1bc] text-[11.5px] font-medium">
                {item.price}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold flex items-center ${
                  item.isPositive ? "text-[#00d692]" : "text-[#f34f6a]"
                }`}
              >
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
