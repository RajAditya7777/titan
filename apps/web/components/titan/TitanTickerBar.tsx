"use client";

import React from "react";
import { BarChart3, Star, TrendingDown, TrendingUp } from "lucide-react";

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  sparkline?: number[];
  icon?: string;
}

const TICKER_DATA: TickerItem[] = [
  { symbol: "SOL", price: "$93.759", change: "-1.63%", isPositive: false, sparkline: [95, 94.8, 94.2, 94.5, 93.8, 93.759] },
  { symbol: "HYPE", price: "$86.9291", change: "-0.55%", isPositive: false, sparkline: [88, 87.5, 87.2, 86.9] },
  { symbol: "PUMP", price: "$0.004128", change: "-1.96%", isPositive: false },
  { symbol: "ZEC", price: "$1,227.9078", change: "-1.48%", isPositive: false },
  { symbol: "cbBTC", price: "$77,750.68", change: "+0.43%", isPositive: true },
  { symbol: "ETH", price: "$2,259.9974", change: "+0.34%", isPositive: true },
  { symbol: "TRUMP", price: "$1.7025", change: "+8.18%", isPositive: true },
  { symbol: "WBTC", price: "$77,775.57", change: "+0.43%", isPositive: true },
  { symbol: "SPCX", price: "$137.04", change: "+0.01%", isPositive: true },
  { symbol: "TTWO", price: "$193.33", change: "+0.59%", isPositive: true },
  { symbol: "DJT", price: "$5.6641", change: "-0.23%", isPositive: false },
  { symbol: "wNEAR", price: "$4.2844", change: "-3.10%", isPositive: false },
];

export function TitanTickerBar() {
  return (
    <div className="w-full border-b border-white/[0.06] bg-[#0d0d0c] py-2 px-4 flex items-center overflow-hidden text-xs select-none">
      {/* Fixed Left Controls */}
      <div className="flex items-center gap-2 pr-4 border-r border-white/[0.08] text-[#78766d] shrink-0">
        <button type="button" className="hover:text-white transition-colors" title="Chart overview">
          <BarChart3 className="h-4 w-4 text-[#fed766]" />
        </button>
        <button type="button" className="hover:text-white transition-colors" title="Watchlist">
          <Star className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Marquee Ticker */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="flex gap-6 items-center animate-[marquee_38s_linear_infinite] whitespace-nowrap pl-4">
          {[...TICKER_DATA, ...TICKER_DATA].map((item, idx) => (
            <div key={`${item.symbol}-${idx}`} className="inline-flex items-center gap-2">
              <span className="font-semibold text-white tracking-wide">{item.symbol}</span>
              <span className="font-mono text-[#d1d1cd]">{item.price}</span>
              <span
                className={`font-mono text-[11px] font-medium flex items-center ${
                  item.isPositive ? "text-[#00d692]" : "text-[#f43f5e]"
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
