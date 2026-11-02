"use client";

import React from "react";
import { X, Check, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";

interface WalletOption {
  name: string;
  iconBg: string;
  badge?: string;
  desc: string;
}

const WALLETS: WalletOption[] = [
  { name: "Phantom", iconBg: "bg-[#ab9ff2]", desc: "Most popular Solana wallet" },
  { name: "Solflare", iconBg: "bg-[#fc6c3c]", desc: "Advanced Solana wallet with web support" },
  { name: "Backpack", iconBg: "bg-[#e53935]", desc: "Native xNFT & Solana ecosystem wallet" },
  { name: "Titan Embedded Wallet", iconBg: "bg-[#f2d363]", badge: "Recommended", desc: "Enables instant conditional & limit orders" },
  { name: "Coinbase Wallet", iconBg: "bg-[#0052ff]", desc: "Multi-chain wallet" },
  { name: "Ledger", iconBg: "bg-[#222222]", desc: "Hardware wallet security" },
];

export function ConnectWalletModal() {
  const {
    walletConnected,
    walletAddress,
    walletName,
    walletModalOpen,
    setWalletModalOpen,
    connectWallet,
    disconnectWallet,
    showToast,
  } = useTitan();

  if (!walletModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText("So11111111111111111111111111111111111111112");
    showToast("Wallet address copied to clipboard", "success");
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setWalletModalOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#2b2927] bg-[#151513] p-6 shadow-2xl relative select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#20201d]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[#f2d363] flex items-center justify-center text-[#0d0d0c] font-extrabold text-xs">
              T
            </div>
            <h3 className="text-base font-bold text-white">
              {walletConnected ? "Connected Wallet" : "Connect a Wallet"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setWalletModalOpen(false)}
            className="rounded-full p-1 text-[#78766d] hover:bg-[#20201d] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {walletConnected ? (
          <div className="py-6 space-y-4">
            <div className="rounded-2xl border border-[#2b2927] bg-[#20201d] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#78766d]">
                <span>Status</span>
                <span className="inline-flex items-center gap-1.5 text-[#00d692] font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[#00d692] animate-pulse" />
                  Connected via {walletName}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-white font-bold">{walletAddress}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-[#f2d363] hover:underline cursor-pointer"
                >
                  Copy
                </button>
              </div>

              <div className="pt-2 border-t border-[#2b2927] flex items-center justify-between text-xs">
                <span className="text-[#78766d]">Simulated Balance:</span>
                <span className="font-mono font-bold text-white">12.50 SOL ($1,171.98)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={disconnectWallet}
              className="w-full rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 py-3 text-sm font-semibold text-[#f34f6a] transition-colors cursor-pointer"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <p className="text-xs text-[#78766d] mb-3">
              Connect your Solana wallet to trade on Titan Exchange. Simulated demo connection — non-custodial and secure.
            </p>

            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {WALLETS.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => connectWallet(w.name)}
                  className="w-full flex items-center justify-between rounded-2xl border border-[#2b2927] bg-[#20201d] hover:bg-[#2b2927] hover:border-[#f2d363]/40 p-3 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl ${w.iconBg} flex items-center justify-center text-xs font-black text-black shadow-sm`}>
                      {w.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white group-hover:text-[#f2d363] transition-colors">
                          {w.name}
                        </span>
                        {w.badge && (
                          <span className="rounded bg-[#f2d363]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#f2d363]">
                            {w.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#78766d]">{w.desc}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#78766d] group-hover:text-white transition-colors">
                    Connect →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-[#20201d] text-[11px] text-[#78766d] text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#00d692]" />
          <span>Non-custodial. Your keys stay yours. Titan never touches your private keys.</span>
        </div>
      </div>
    </div>
  );
}
