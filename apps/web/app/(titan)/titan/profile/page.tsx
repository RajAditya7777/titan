"use client";

import React from "react";
import { ArrowUpRight, TrendingUp, ShieldCheck, Wallet, History, ExternalLink } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { formatUsd } from "@/lib/products/titan/tokens";

export default function TitanProfilePage() {
  const { walletConnected, walletAddress, setWalletModalOpen } = useTitan();

  const holdings = [
    { symbol: "SOL", name: "Solana", amount: "12.50", price: 93.759, val: 1171.98, share: "15.4%", isPositive: true },
    { symbol: "USDC", name: "USD Coin", amount: "2,500.00", price: 1.0, val: 2500.0, share: "33.0%", isPositive: true },
    { symbol: "HYPE", name: "Hyperliquid", amount: "45.00", price: 86.929, val: 3911.8, share: "51.6%", isPositive: false },
  ];

  const totalVal = holdings.reduce((acc, h) => acc + h.val, 0);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 text-white space-y-6 select-none">
      {/* Profile Header */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#121212] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#fed766] to-[#c29b2b] flex items-center justify-center text-2xl font-black text-black shadow-lg">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Your Portfolio</h1>
              <span className="rounded-full bg-[#00d692]/20 text-[#00d692] px-2 py-0.5 text-xs font-bold">
                Active Trader
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#8a8a8a] font-mono">
              <Wallet className="h-3.5 w-3.5 text-[#fed766]" />
              <span>{walletConnected ? walletAddress : "No wallet connected (Demo Mode)"}</span>
              {walletConnected && (
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(true)}
                  className="text-[#fed766] hover:underline ml-2"
                >
                  Switch
                </button>
              )}
            </div>
          </div>
        </div>

        {!walletConnected ? (
          <button
            type="button"
            onClick={() => setWalletModalOpen(true)}
            className="rounded-2xl bg-[#fed766] hover:bg-[#ffe082] px-6 py-3 text-sm font-extrabold text-black transition-all shadow-[0_0_20px_rgba(254,215,102,0.25)] cursor-pointer"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-right">
            <div className="text-xs text-[#8a8a8a]">Total Net Worth</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {formatUsd(totalVal)}
            </div>
            <div className="text-xs font-mono text-[#00d692] flex items-center justify-end gap-1 mt-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+$312.45 (+4.29% 24h)</span>
            </div>
          </div>
        )}
      </div>

      {/* Asset Distribution & Holdings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {holdings.map((h) => (
          <div key={h.symbol} className="rounded-2xl border border-white/[0.08] bg-[#141414] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-[#242424] flex items-center justify-center font-bold text-xs text-white">
                  {h.symbol[0]}
                </span>
                <div>
                  <div className="text-sm font-bold text-white">{h.symbol}</div>
                  <div className="text-[11px] text-[#737373]">{h.name}</div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#fed766] font-semibold">{h.share}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-baseline justify-between">
              <div>
                <div className="text-xs text-[#8a8a8a]">Balance</div>
                <div className="text-sm font-mono font-bold text-white">{h.amount}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#8a8a8a]">Value</div>
                <div className="text-sm font-mono font-bold text-white">{formatUsd(h.val)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Trading History */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#121212] p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#fed766]" />
            <h2 className="text-sm font-extrabold text-white">Recent Transactions</h2>
          </div>
          <span className="text-xs text-[#737373]">Live Solana Execution Records</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#737373] border-b border-white/[0.04]">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Swapped</th>
                <th className="pb-2 font-medium">Received</th>
                <th className="pb-2 font-medium">Route Engine</th>
                <th className="pb-2 font-medium">Tx Hash</th>
                <th className="pb-2 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              <tr>
                <td className="py-3 font-semibold text-[#00d692]">Swap</td>
                <td className="py-3 font-mono">2.000 SOL</td>
                <td className="py-3 font-mono font-bold text-white">187.52 USDC</td>
                <td className="py-3 text-[11px] text-[#fed766]">Argos + DART</td>
                <td className="py-3 font-mono text-[#8a8a8a] hover:underline cursor-pointer">5Ux8...9k2L</td>
                <td className="py-3 text-right text-[#737373]">14 mins ago</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-[#00d692]">Swap</td>
                <td className="py-3 font-mono">500.00 USDC</td>
                <td className="py-3 font-mono font-bold text-white">5.751 HYPE</td>
                <td className="py-3 text-[11px] text-[#fed766]">Argos Multi-Hop</td>
                <td className="py-3 font-mono text-[#8a8a8a] hover:underline cursor-pointer">2Kp1...7RtM</td>
                <td className="py-3 text-right text-[#737373]">2 hours ago</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-[#3b82f6]">Limit Fill</td>
                <td className="py-3 font-mono">1.000 SOL</td>
                <td className="py-3 font-mono font-bold text-white">95.00 USDC</td>
                <td className="py-3 text-[11px] text-[#fed766]">Titan Orderbook</td>
                <td className="py-3 font-mono text-[#8a8a8a] hover:underline cursor-pointer">8Yw3...4VnQ</td>
                <td className="py-3 text-right text-[#737373]">Yesterday</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
