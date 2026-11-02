"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, HelpCircle, LayoutGrid, Sparkles, BookOpen, Layers, BarChart2 } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";

export function TitanHeader() {
  const pathname = usePathname();
  const { prime, setPrime, walletConnected, walletAddress, setWalletModalOpen } = useTitan();
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const isSwap = pathname === "/titan/swap" || pathname === "/titan" || pathname === "/";
  const isPro = pathname.includes("/pro");
  const isLimit = pathname.includes("/limit");
  const isProfile = pathname.includes("/profile");
  const isRewards = pathname.includes("/rewards");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0a0a0a] backdrop-blur-md select-none">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
        {/* Left: Titan Logo & Navigation Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/titan/swap" className="flex items-center gap-2.5 group">
            {/* Titan Icon: Stylized helmet / shield with circle and winged crown */}
            <div className="flex h-7 w-7 items-center justify-center">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7 text-white group-hover:text-[#fed766] transition-colors">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.2" />
                <path
                  d="M16 8C13.5 11 11 14 11 18C11 21 13 23 16 23C19 23 21 21 21 18C21 14 18.5 11 16 8Z"
                  fill="currentColor"
                />
                <circle cx="16" cy="12" r="2" fill="#0a0a0a" />
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
                  : "text-[#8a8a8a] hover:text-white"
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
                  : "text-[#8a8a8a] hover:text-white"
              }`}
            >
              <span>Pro</span>
              <span className="rounded bg-[#fed766]/20 px-1.5 py-0.2 text-[10px] font-bold text-[#fed766]">
                New
              </span>
            </Link>

            <Link
              href="/titan/limit"
              data-companion="titan-nav-limit"
              className={`hidden md:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isLimit
                  ? "text-white font-semibold"
                  : "text-[#8a8a8a] hover:text-white"
              }`}
            >
              <span>Limit</span>
            </Link>

            <Link
              href="/titan/profile"
              className={`hidden md:inline-block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isProfile
                  ? "text-white font-semibold"
                  : "text-[#8a8a8a] hover:text-white"
              }`}
            >
              Profile
            </Link>

            <Link
              href="/titan/rewards"
              className={`hidden md:inline-block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isRewards
                  ? "text-white font-semibold"
                  : "text-[#8a8a8a] hover:text-white"
              }`}
            >
              Rewards
            </Link>

            {/* More Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-[#8a8a8a] hover:text-white cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {moreDropdownOpen && (
                <div
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                  className="absolute left-0 mt-1 w-48 rounded-2xl border border-white/[0.08] bg-[#141414] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1"
                >
                  <Link
                    href="/titan/learn"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/[0.06]"
                  >
                    <BookOpen className="h-4 w-4 text-[#fed766]" />
                    <span>DART & Argos Docs</span>
                  </Link>
                  <a
                    href="https://titan-exchange.gitbook.io/titan/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/[0.06]"
                  >
                    <BookOpen className="h-4 w-4 text-[#8a8a8a]" />
                    <span>Official GitBook</span>
                  </a>
                  <a
                    href="https://app.titan.exchange"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/[0.06]"
                  >
                    <LayoutGrid className="h-4 w-4 text-[#8a8a8a]" />
                    <span>Production App</span>
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Balance / Price, Help, Apps, Connect Wallet */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Rate indicator: ≡ $93.76 */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-white bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg">
            <span className="text-[#fed766]">≡</span>
            <span className="font-semibold">$93.76</span>
          </div>

          <Link
            href="/titan/learn"
            className="p-1.5 text-[#8a8a8a] hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
            title="Help & Documentation"
          >
            <HelpCircle className="h-4 w-4" />
          </Link>

          {/* Connect Wallet Button: Prominent gold pill button */}
          <button
            type="button"
            data-companion="titan-connect-wallet"
            onClick={() => setWalletModalOpen(true)}
            className="rounded-full bg-[#fed766] hover:bg-[#ffe082] active:bg-[#e6c152] px-4 py-1.5 text-xs sm:text-sm font-bold text-black transition-all shadow-[0_0_16px_rgba(254,215,102,0.25)] cursor-pointer"
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
