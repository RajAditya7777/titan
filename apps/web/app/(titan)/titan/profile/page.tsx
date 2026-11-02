"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, ShieldCheck, Wallet, History, ExternalLink, UserCheck, Copy, Check } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { formatUsd } from "@/lib/products/titan/tokens";

export default function TitanProfilePage() {
  const { walletConnected, walletAddress, setWalletModalOpen, getUserBalance, tradeHistory, showToast } = useTitan();
  const [username, setUsername] = useState("titan_trader");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const solBal = getUserBalance("SOL");
  const usdcBal = getUserBalance("USDC");
  const hypeBal = getUserBalance("HYPE");

  const holdings = [
    { symbol: "SOL", name: "Solana", amount: solBal.toFixed(4), price: 93.759, val: solBal * 93.759, share: "15.4%", isPositive: true },
    { symbol: "USDC", name: "USD Coin", amount: usdcBal.toFixed(2), price: 1.0, val: usdcBal * 1.0, share: "33.0%", isPositive: true },
    { symbol: "HYPE", name: "Hyperliquid", amount: hypeBal.toFixed(2), price: 86.929, val: hypeBal * 86.929, share: "51.6%", isPositive: false },
  ];

  const totalVal = holdings.reduce((acc, h) => acc + h.val, 0);

  const handleSaveUsername = () => {
    if (!newUsername.trim()) return;
    setUsername(newUsername.trim().toLowerCase());
    setIsEditingUsername(false);
    showToast(`Titan username updated to @${newUsername.trim().toLowerCase()}`, "success");
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 text-white space-y-6 select-none">
      {/* Profile Header */}
      <div className="rounded-2xl border border-[#2b2927] bg-[#151513] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[#f2d363] flex items-center justify-center text-2xl font-bold text-[#0d0d0c] shadow-lg">
            {username[0]?.toUpperCase() || "T"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">@{username}</h1>
              <span className="rounded-full bg-[#00d692]/20 text-[#00d692] px-2 py-0.5 text-xs font-semibold">
                Active Trader
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsEditingUsername(!isEditingUsername);
                  setNewUsername(username);
                }}
                className="text-xs text-[#78766d] hover:text-[#f2d363] ml-1 underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {isEditingUsername ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  placeholder="new_handle"
                  className="rounded-lg bg-[#20201d] border border-[#2b2927] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#f2d363]"
                />
                <button
                  type="button"
                  onClick={handleSaveUsername}
                  className="rounded-lg bg-[#f2d363] text-black font-semibold px-2.5 py-1 text-xs cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="text-xs text-[#78766d] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 text-xs text-[#78766d] font-mono">
                <Wallet className="h-3.5 w-3.5 text-[#f2d363]" />
                <span>{walletConnected ? walletAddress : "No wallet connected (Demo Mode)"}</span>
                {walletConnected && (
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="text-[#f2d363] hover:underline ml-2 cursor-pointer"
                  >
                    Switch
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!walletConnected ? (
          <button
            type="button"
            onClick={() => setWalletModalOpen(true)}
            className="rounded-full bg-[#f2d363] hover:bg-[#ffe175] px-6 py-3 text-sm font-medium text-[#0d0d0c] transition-all shadow-md cursor-pointer"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-right">
            <div className="text-xs text-[#78766d]">Total Net Worth</div>
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
          <div key={h.symbol} className="rounded-2xl border border-[#2b2927] bg-[#151513] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-[#20201d] border border-[#2b2927] flex items-center justify-center font-bold text-xs text-white">
                  {h.symbol[0]}
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{h.symbol}</div>
                  <div className="text-[11px] text-[#78766d]">{h.name}</div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#f2d363] font-medium">{h.share}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-[#20201d] flex items-baseline justify-between">
              <div>
                <div className="text-xs text-[#78766d]">Balance</div>
                <div className="text-sm font-mono font-bold text-white">{h.amount}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#78766d]">Value</div>
                <div className="text-sm font-mono font-bold text-white">{formatUsd(h.val)}</div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#20201d] flex justify-end gap-2">
              <Link
                href="/titan/swap"
                className="text-[11px] text-[#f2d363] hover:underline cursor-pointer"
              >
                Trade {h.symbol} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Trading History */}
      <div className="rounded-2xl border border-[#2b2927] bg-[#151513] p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#20201d]">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#f2d363]" />
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          </div>
          <span className="text-xs text-[#78766d]">Live Solana Execution Records</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#78766d] border-b border-[#20201d]">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Input</th>
                <th className="pb-2 font-medium">Output</th>
                <th className="pb-2 font-medium">Route Engine</th>
                <th className="pb-2 font-medium">Tx Hash</th>
                <th className="pb-2 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20201d]">
              {tradeHistory.map((th) => (
                <tr key={th.id}>
                  <td className="py-3 font-semibold text-[#00d692]">Swap</td>
                  <td className="py-3 font-mono">
                    {th.inAmount} {th.inToken}
                  </td>
                  <td className="py-3 font-mono font-bold text-white">
                    {th.outAmount} {th.outToken}
                  </td>
                  <td className="py-3 text-[11px] text-[#f2d363]">Argos + DART</td>
                  <td className="py-3 font-mono text-[#78766d] hover:text-white cursor-pointer">
                    <a href="https://solscan.io" target="_blank" rel="noreferrer">
                      {th.txHash} ↗
                    </a>
                  </td>
                  <td className="py-3 text-right text-[#78766d]">{th.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
