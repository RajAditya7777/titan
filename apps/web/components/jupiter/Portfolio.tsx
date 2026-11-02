"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Layers, Search } from "lucide-react";
import { useCompanion } from "@/components/companion/CompanionProvider";
import { JUP_TOKENS, type JupToken } from "@/lib/products/jupiter/web";
import { netWorth, setJup, useJup } from "./store";
import { TokenIcon } from "./Trade";

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Demo wallets with fixed holdings, as on jup.ag's portfolio landing. */
const DEMO: { name: string; addr: string; emoji: string; holdings: Partial<Record<JupToken, number>>; positions: string[] }[] = [
  { name: "DeFi whale", addr: "Demo…3tKG", emoji: "🐋", holdings: { SOL: 4200, USDC: 185000, JitoSOL: 1300, JUP: 92000 }, positions: ["Kamino lend: 120,000 USDC @ 6.1%", "Jupiter Perps: SOL long 3x", "Meteora DLMM SOL-USDC"] },
  { name: "JUP staker", addr: "jupE…BH5H", emoji: "🪐", holdings: { JUP: 410000, SOL: 85, USDC: 2300 }, positions: ["Staked JUP: 380,000 (voting)", "Active Staking Rewards claimable"] },
  { name: "Airdrop farmer", addr: "tEsT…51nd", emoji: "🧑‍🌾", holdings: { SOL: 31, BONK: 92_000_000, JUP: 1800, USDC: 640 }, positions: ["3 claimable airdrops found", "Sanctum LST: 12 SOL"] },
];

export function PortfolioView() {
  const s = useJup();
  const { setPageContext } = useCompanion();
  const [open, setOpen] = useState<number | "me" | null>(null);
  const [query, setQuery] = useState("");

  const view = open === "me" ? { name: "Your demo wallet", holdings: s.balances, positions: s.positions.map((p) => `Perps ${p.market} ${p.side} ${p.leverage}x`) } : open != null ? DEMO[open]! : null;
  const total = view ? (open === "me" ? netWorth(s) : (Object.entries(view.holdings) as [JupToken, number][]).reduce((t, [k, v]) => t + v * JUP_TOKENS[k].price, 0)) : 0;

  useEffect(() => {
    setPageContext(() => ({ product: "jupiter", page: "portfolio", connected: s.connected, viewing: view?.name ?? null, netWorthUsd: Math.round(total), holdings: view?.holdings ?? null, positions: view?.positions ?? null }));
  }, [s.connected, view?.name, total, setPageContext]); // eslint-disable-line react-hooks/exhaustive-deps

  if (view) {
    const rows = (Object.entries(view.holdings) as [JupToken, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] * JUP_TOKENS[b[0]].price - a[1] * JUP_TOKENS[a[0]].price);
    return (
      <div className="mx-auto max-w-[960px] px-5 pb-24 pt-8">
        <button type="button" onClick={() => setOpen(null)} className="flex items-center gap-1.5 text-[12.5px] text-[#8a99a6] hover:text-white"><ArrowLeft size={13} /> All wallets</button>
        <div data-companion="jup-portfolio-summary" className="mt-4 rounded-2xl border border-white/[0.06] bg-[#131a20] p-5">
          <p className="text-[13px] text-[#8a99a6]">{view.name} · Net worth</p>
          <p className="mt-1 text-[36px] font-semibold tracking-tight">${fmt(total)}</p>
          <p className="text-[12px] text-[#3ec98a]">+2.41% (24h) · demo data</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-white/[0.06] bg-[#131a20] p-4">
            <p className="mb-3 text-[14px] font-medium">Wallet</p>
            {rows.map(([t, v]) => (
              <div key={t} className="flex items-center gap-3 border-t border-white/[0.04] py-2.5 text-[13px]">
                <TokenIcon t={t} size={26} />
                <span className="flex-1"><span className="block font-medium">{t}</span><span className="text-[11px] text-[#6b7a86]">${fmt(JUP_TOKENS[t].price, t === "BONK" ? 7 : 2)}</span></span>
                <span className="text-right"><span className="block">${fmt(v * JUP_TOKENS[t].price)}</span><span className="text-[11px] text-[#6b7a86]">{v.toLocaleString("en-US", { maximumFractionDigits: 3 })} {t}</span></span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-[#131a20] p-4">
            <p className="mb-3 flex items-center gap-2 text-[14px] font-medium"><Layers size={14} className="text-[#c7f284]" /> DeFi positions</p>
            {view.positions.length ? view.positions.map((p) => <p key={p} className="border-t border-white/[0.04] py-2.5 text-[13px] text-[#b7c3cc]">{p}</p>) : <p className="text-[13px] text-[#6b7a86]">No positions yet</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-16 text-center">
      <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight md:text-[52px]">
        Your entire <span className="text-[#c7f284]">Solana DeFi world,</span>
        <br />
        tracked in one <span className="text-[#c7f284]">dashboard.</span>
      </h1>
      <p className="mt-4 text-[15px] text-[#b7c3cc]">Track holdings, positions, yield, and airdrops across 198 Solana protocols.</p>
      <form
        onSubmit={(e) => { e.preventDefault(); if (query.trim()) setOpen(0); }}
        className="mx-auto mt-8 flex max-w-[640px] items-center gap-2 rounded-full border border-white/[0.07] bg-[#131a20] py-1.5 pl-4 pr-1.5"
      >
        <Search size={16} className="text-[#6b7a86]" />
        <input data-companion="jup-portfolio-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any wallet address or .sns domain" className="min-w-0 flex-1 bg-transparent py-2 text-[14px] placeholder:text-[#6b7a86] focus:outline-none" />
        <button type="button" onClick={() => (s.connected ? setOpen("me") : setJup({ stage: "connect" }))} className="rounded-full bg-[#c7f284] px-4 py-2 text-[13px] font-semibold text-[#0b1014]">
          {s.connected ? "My wallet" : "Connect wallet"}
        </button>
      </form>

      <div data-companion="jup-portfolio-demo" className="mt-14 text-left">
        <p className="text-[20px] font-semibold">Demo wallets</p>
        <p className="text-[13px] text-[#8a99a6]">Open a wallet, or view all 3 as a group.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {DEMO.map((d, i) => (
            <button key={d.name} type="button" onClick={() => setOpen(i)} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#131a20] p-4 text-left transition hover:border-[#c7f284]/40">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-[22px]">{d.emoji}</span>
              <span><span className="block text-[14px] font-medium">{d.name}</span><span className="text-[12px] text-[#6b7a86]">{d.addr}</span></span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-24 grid gap-6 md:grid-cols-3">
        {[["198", "Protocols tracked", "DeFi positions across Solana, in real time"], ["344", "Services parsed", "Every transaction, decoded and human-readable"], ["Auto", "Airdrop detection", "We surface claimables you might have missed"]].map(([n, t, b]) => (
          <div key={t}>
            <p className="text-[40px] font-semibold text-[#c7f284]">{n}</p>
            <p className="text-[14px] font-medium">{t}</p>
            <p className="text-[12.5px] text-[#6b7a86]">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
