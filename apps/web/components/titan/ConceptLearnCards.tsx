"use client";

import { useState } from "react";
import {
  Zap,
  Cpu,
  ShieldCheck,
  Split,
  ArrowRight,
  ShieldAlert,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export function ConceptLearnCards() {
  const [activeTab, setActiveTab] = useState<"dart" | "argos" | "prime" | "mev">("dart");

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-white">
      {/* Overview Banner */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#1a1917] via-[#151513] to-[#20201d] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-[#f2d363]">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Titan Technology & Protocol Architecture</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            How Titan Delivers Best Execution on Solana
          </h2>
          <p className="text-xs sm:text-sm text-[#a8a69f] leading-relaxed">
            Titan is a next-generation meta-aggregator combining off-chain mathematical route optimization (Argos) with on-chain real-time re-allocation (DART) to guarantee zero sandwich attacks and maximum output tokens.
          </p>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#f2d363]/5 blur-3xl pointer-events-none" />
      </div>

      {/* Nav Tabs for Concepts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("dart")}
          className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition-all ${
            activeTab === "dart"
              ? "border-[#f2d363] bg-[#262113] text-[#f2d363] shadow-[0_0_15px_rgba(242,211,99,0.15)]"
              : "border-white/[0.06] bg-[#151513] text-[#a8a69f] hover:text-white"
          }`}
        >
          <Split className="h-4 w-4" />
          <span>DART Routing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("argos")}
          className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition-all ${
            activeTab === "argos"
              ? "border-[#f2d363] bg-[#262113] text-[#f2d363] shadow-[0_0_15px_rgba(242,211,99,0.15)]"
              : "border-white/[0.06] bg-[#151513] text-[#a8a69f] hover:text-white"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Argos Optimizer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prime")}
          className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition-all ${
            activeTab === "prime"
              ? "border-[#f2d363] bg-[#262113] text-[#f2d363] shadow-[0_0_15px_rgba(242,211,99,0.15)]"
              : "border-white/[0.06] bg-[#151513] text-[#a8a69f] hover:text-white"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Prime Liquidity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mev")}
          className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition-all ${
            activeTab === "mev"
              ? "border-[#f2d363] bg-[#262113] text-[#f2d363] shadow-[0_0_15px_rgba(242,211,99,0.15)]"
              : "border-white/[0.06] bg-[#151513] text-[#a8a69f] hover:text-white"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>MEV Protection</span>
        </button>
      </div>

      {/* Main Feature Cards */}
      <div className="space-y-6">
        {/* DART CARD */}
        {activeTab === "dart" && (
          <div
            data-companion="titan-learn-dart"
            className="rounded-3xl border border-white/[0.08] bg-[#151513] p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#262113] text-[#f2d363] border border-[#f2d363]/30">
                  <Split className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">
                    DART (Dynamic Allocation and Real Time)
                  </h3>
                  <span className="text-xs text-[#a8a69f] font-mono">
                    The &quot;Best Bid Offer&quot; Guarantee
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#00d692]/15 px-3 py-1 text-xs font-mono text-[#00d692] border border-[#00d692]/30">
                Live on Solana
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-3 text-xs sm:text-sm text-[#a8a69f] leading-relaxed">
                <p>
                  Standard DEX aggregators calculate pool split weights off-chain when you request a quote. By the time your transaction lands on Solana (400ms to 2s later), pool reserves have moved, causing slippage or failed simulations.
                </p>
                <p>
                  <strong className="text-white">DART solves this on-chain.</strong> At the exact moment your transaction is included in a block, the DART smart contract reads the real-time tick states and re-splits your trade across available pools dynamically.
                </p>
                <div className="rounded-xl border border-white/[0.06] bg-[#20201d] p-3 text-xs text-white space-y-1 font-mono">
                  <div className="text-[#f2d363] font-semibold">DART Protocol Specs:</div>
                  <div>• Supported Pairs: SOL/USDC, SOL/USDT, cbBTC/USDC</div>
                  <div>• Execution Fee: Up to 1 bps (0.01%)</div>
                  <div>• Status Dot: Green indicates active DART route</div>
                </div>
              </div>

              {/* Visual Diagram: Aggregator vs DART */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#20201d] p-4 text-xs font-mono space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#78766d] uppercase font-bold">Standard Aggregators:</span>
                  <div className="flex items-center justify-between rounded-lg bg-[#151513] p-2 text-[11px] border border-white/5">
                    <span>Quote (50/50 split)</span>
                    <ArrowRight className="h-3 w-3 text-[#78766d]" />
                    <span className="text-amber-400">Fixed Split at landing (Slippage!)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#f2d363] uppercase font-bold">Titan DART Router:</span>
                  <div className="flex items-center justify-between rounded-lg bg-[#262113] p-2 text-[11px] border border-[#f2d363]/30">
                    <span className="text-[#f2d363]">Quote (Estimated)</span>
                    <ArrowRight className="h-3 w-3 text-[#f2d363]" />
                    <span className="text-[#00d692] font-semibold">On-Chain Re-Split (Zero Waste!)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARGOS CARD */}
        {activeTab === "argos" && (
          <div
            data-companion="titan-learn-argos"
            className="rounded-3xl border border-white/[0.08] bg-[#151513] p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#262113] text-[#f2d363] border border-[#f2d363]/30">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">
                    Argos Optimization Engine
                  </h3>
                  <span className="text-xs text-[#a8a69f] font-mono">
                    Off-Chain Mathematical Multi-Hop Router
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#a8a69f] leading-relaxed">
              <p>
                Argos is Titan&apos;s proprietary off-chain optimization algorithm. Instead of greedily checking individual DEX routes, Argos formulates the entire Solana liquidity topology as an optimization problem.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl border border-white/[0.06] bg-[#20201d] p-4 space-y-1">
                  <div className="font-semibold text-white">Multi-Venue Topology</div>
                  <p className="text-xs text-[#78766d]">
                    Indexes Orca Whirlpools, Raydium CPMM, Meteora DLMM, Phoenix, and OpenBook orderbooks simultaneously.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-[#20201d] p-4 space-y-1">
                  <div className="font-semibold text-white">Split Routing</div>
                  <p className="text-xs text-[#78766d]">
                    Splits trade size non-linearly across concentrated liquidity ticks to prevent deep price impact.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-[#20201d] p-4 space-y-1">
                  <div className="font-semibold text-white">Simulation Verification</div>
                  <p className="text-xs text-[#78766d]">
                    Every candidate route is verified on-chain against live Solana state before being presented to the user.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRIME CARD */}
        {activeTab === "prime" && (
          <div
            data-companion="titan-learn-prime"
            className="rounded-3xl border border-white/[0.08] bg-[#151513] p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#262113] text-[#f2d363] border border-[#f2d363]/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">
                    Prime Liquidity & Zero Fees
                  </h3>
                  <span className="text-xs text-[#a8a69f] font-mono">
                    Zero Protocol Fees with Guardrail Execution
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#a8a69f] leading-relaxed">
              <p>
                Prime Mode is Titan&apos;s flagship zero-fee tier. When Prime is enabled, Titan charges exactly <strong className="text-[#00d692]">0.00% protocol fees</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-[#20201d] p-4 space-y-2">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#f2d363]" />
                    Prime Mode (Recommended)
                  </div>
                  <ul className="space-y-1 text-xs text-[#a8a69f]">
                    <li>• 0% Titan fee</li>
                    <li>• Automatic dynamic slippage</li>
                    <li>• Jito anti-sandwich landing bundle</li>
                    <li>• Animated Prime badge active</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#20201d] p-4 space-y-2">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#78766d]" />
                    Manual Mode
                  </div>
                  <ul className="space-y-1 text-xs text-[#a8a69f]">
                    <li>• Split slippage: Base tokens vs Stable/LST</li>
                    <li>• Priority fee selection (Auto, Turbo, Custom)</li>
                    <li>• Direct venue filtering</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEV CARD */}
        {activeTab === "mev" && (
          <div
            data-companion="titan-learn-mev"
            className="rounded-3xl border border-white/[0.08] bg-[#151513] p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#262113] text-[#f2d363] border border-[#f2d363]/30">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">
                    MEV & Sandwich Attack Protection
                  </h3>
                  <span className="text-xs text-[#a8a69f] font-mono">
                    Private Mempool Execution via Jito & Nozomi
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#a8a69f] leading-relaxed">
              <p>
                Public transactions submitted through regular RPCs are visible in Solana validators&apos; mempools. Malicious MEV searchers can front-run your swap and back-run it (a &quot;sandwich attack&quot;), forcing you to receive the absolute worst minimum slippage.
              </p>
              <p>
                Titan routes through <strong className="text-white">Jito Bundles and Nozomi private routing</strong>. Transactions bypass the public gossip layer entirely and are committed directly to block builders, rendering sandwich attacks impossible.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* GitBook Documentation Link */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#151513] p-4 flex items-center justify-between text-xs text-[#a8a69f]">
        <span>Official Titan Exchange Documentation & GitBook:</span>
        <a
          href="https://titan-exchange.gitbook.io/titan/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-semibold text-[#f2d363] hover:underline"
        >
          <span>titan-exchange.gitbook.io</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
