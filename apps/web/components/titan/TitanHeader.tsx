"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, HelpCircle, LayoutGrid, Sparkles, BookOpen, Layers, BarChart2, Zap, MessageSquare } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { useCompanion } from "@/components/companion/CompanionProvider";

export function TitanHeader() {
  const pathname = usePathname();
  const {
    prime,
    setPrime,
    walletConnected,
    walletAddress,
    setWalletModalOpen,
    showToast,
    setDart,
  } = useTitan();
  const { input, setPanelOpen } = useCompanion();
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const isSwap = pathname === "/titan/swap" || pathname === "/titan" || pathname === "/";
  const isPro = pathname.includes("/pro");
  const isLimit = pathname.includes("/limit");
  const isProfile = pathname.includes("/profile");
  const isRewards = pathname.includes("/rewards");
  const isDocs = pathname.includes("/docs") || pathname.includes("/learn");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0d0d0c] select-none">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-8 lg:px-10">
        {/* Left: Titan Logo & Navigation Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/titan/swap" className="flex items-center gap-2.5 group">
            {/* Titan Icon: Stylized helmet / shield with circle and winged crown */}
            <div className="flex h-7 w-7 items-center justify-center">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7 text-white group-hover:text-[#f2d363] transition-colors">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.2" />
                <path
                  d="M16 8C13.5 11 11 14 11 18C11 21 13 23 16 23C19 23 21 21 21 18C21 14 18.5 11 16 8Z"
                  fill="currentColor"
                />
                <circle cx="16" cy="12" r="2" fill="#0d0d0c" />
              </svg>
            </div>
            <span className="text-base font-extrabold tracking-wider text-white">
              TITAN
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/titan/swap"
              data-companion="titan-nav-swap"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isSwap
                  ? "text-white font-semibold"
                  : "text-[#c2c1bc] hover:text-white"
              }`}
            >
              Swap
            </Link>

            <Link
              href="/titan/pro"
              data-companion="titan-nav-pro"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isPro
                  ? "text-white font-semibold"
                  : "text-[#c2c1bc] hover:text-white"
              }`}
            >
              <span>Pro</span>
              <span className="rounded bg-[#f2d363]/20 px-1.5 py-0.2 text-[10px] font-bold text-[#f2d363]">
                New
              </span>
            </Link>

            <Link
              href="/titan/limit"
              data-companion="titan-nav-limit"
              className={`hidden md:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isLimit
                  ? "text-white font-semibold"
                  : "text-[#c2c1bc] hover:text-white"
              }`}
            >
              <span>Limit</span>
            </Link>

            <Link
              href="/titan/profile"
              className={`hidden md:inline-block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isProfile
                  ? "text-white font-semibold"
                  : "text-[#c2c1bc] hover:text-white"
              }`}
            >
              Profile
            </Link>

            <Link
              href="/titan/rewards"
              className={`hidden md:inline-block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isRewards
                  ? "text-white font-semibold"
                  : "text-[#c2c1bc] hover:text-white"
              }`}
            >
              Rewards
            </Link>

            <Link
              href="/titan/docs"
              data-companion="titan-nav-docs"
              className={`hidden sm:inline-block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isDocs
                  ? "text-white font-semibold text-[#f2d363]"
                  : "text-[#c2c1bc] hover:text-white"
              }`}
            >
              Docs
            </Link>

            {/* More Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-[#c2c1bc] hover:text-white cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {moreDropdownOpen && (
                <div
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                  className="absolute left-0 mt-1 w-56 rounded-2xl border border-[#2b2927] bg-[#151513] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 select-none"
                >
                  <Link
                    href="/titan/docs"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-[#20201d]"
                  >
                    <BookOpen className="h-4 w-4 text-[#f2d363]" />
                    <span>GitBook Documentation</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDart("auto");
                      showToast("DART Dynamic Routing set to AUTO", "success");
                      setMoreDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#c2c1bc] hover:text-white hover:bg-[#20201d] text-left"
                  >
                    <Zap className="h-4 w-4 text-[#00d692]" />
                    <span>DART Auto-Rebalancing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrime(true);
                      showToast("Titan Prime active: 0% protocol fees enabled", "success");
                      setMoreDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#c2c1bc] hover:text-white hover:bg-[#20201d] text-left"
                  >
                    <Sparkles className="h-4 w-4 text-[#f2d363]" />
                    <span>Prime Zero-Fee Tier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanelOpen(true);
                      input("Milo, explain the Argos algorithmic router");
                      setMoreDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#c2c1bc] hover:text-white hover:bg-[#20201d] text-left"
                  >
                    <MessageSquare className="h-4 w-4 text-[#fed766]" />
                    <span>Ask Milo (Titan Guide)</span>
                  </button>
                  <a
                    href="https://titan-exchange.gitbook.io/titan/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#78766d] hover:text-white hover:bg-[#20201d]"
                  >
                    <BookOpen className="h-4 w-4 text-[#78766d]" />
                    <span>Official GitBook ↗</span>
                  </a>
                  <a
                    href="https://app.titan.exchange"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#78766d] hover:text-white hover:bg-[#20201d]"
                  >
                    <LayoutGrid className="h-4 w-4 text-[#78766d]" />
                    <span>Live DEX App ↗</span>
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Balance / Price, Help, Apps, Connect Wallet */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Rate indicator: ≡ $93.91 (Interactive button) */}
          <button
            type="button"
            onClick={() => showToast("SOL/USD: $93.91 (-1.63% 24h) • Pyth Real-Time Oracle Feed", "info")}
            className="flex items-center gap-1.5 font-mono text-xs text-white bg-[#20201d] border border-[#2b2927] hover:border-[#f2d363]/40 px-2.5 py-1 rounded-lg cursor-pointer transition-colors active:scale-95"
            title="Click to view live SOL price"
          >
            <span className="text-[#f2d363]">≡</span>
            <span className="font-semibold">$93.91</span>
          </button>

          {/* Help Button -> Triggers Milo Walkthrough */}
          <button
            type="button"
            onClick={() => {
              setPanelOpen(true);
              input("Milo, give me a quick walkthrough of how Titan Exchange works and how to swap tokens.");
            }}
            className="p-1.5 text-[#c2c1bc] hover:text-white transition-colors rounded-lg hover:bg-white/[0.05] cursor-pointer"
            title="Ask Milo for Walkthrough"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Connect Wallet Button: Exactly matching official #f2d363 pill button */}
          <button
            type="button"
            data-companion="titan-connect-wallet"
            onClick={() => setWalletModalOpen(true)}
            className="rounded-full bg-[#f2d363] hover:bg-[#ffe175] active:scale-[0.98] px-4 py-2 text-xs sm:text-sm font-medium text-[#0d0d0c] transition-all cursor-pointer"
          >
            {walletConnected ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#00d692]" />
                {walletAddress}
              </span>
            ) : (
              "Connect Wallet"
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
