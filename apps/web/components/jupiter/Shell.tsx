"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight, BarChart3, Bell, Bot, Check, CircleDollarSign, Coins, Dices, Gift, Landmark, LineChart, Loader2, MessageCircle, MoreHorizontal,
  PieChart, Rocket, Search, Send, Settings, Smartphone, Sparkles, Wallet, X, Zap, Layers, ArrowDownToLine,
} from "lucide-react";
import { JUP_TOKENS, quote } from "@/lib/products/jupiter/web";
import { PACKS } from "@/lib/products/jupiter/gacha";
import { confirmJup, setJup, useJup, type JupStore } from "./store";

/** Jupiter's planet mark (drawn here, not copied). */
export function JupLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="jg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7f284" />
          <stop offset="0.55" stopColor="#00bef0" />
          <stop offset="1" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="none" stroke="url(#jg)" strokeWidth="2.4" />
      <path d="M5 13c6-3 16-3 22 0M4.5 18c7 3 16 3 23 0M8 8c5-1.5 11-1.5 16 0" fill="none" stroke="url(#jg)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const NAV: { group: string; items: { label: string; href: string; icon: typeof Zap; badge?: string }[] }[] = [
  {
    group: "Trade",
    items: [
      { label: "Spot", href: "/jup", icon: ArrowLeftRight },
      { label: "Stocks", href: "/jup", icon: BarChart3, badge: "New" },
      { label: "Perps", href: "/jup/perps", icon: LineChart },
      { label: "Predict", href: "/jup", icon: Sparkles },
      { label: "Gacha", href: "/jup/gacha", icon: Dices },
      { label: "Bridge Agg", href: "/jup", icon: Layers, badge: "Beta" },
    ],
  },
  { group: "Labs", items: [{ label: "YOLO", href: "/jup", icon: Rocket, badge: "Beta" }] },
  {
    group: "Earn",
    items: [
      { label: "Lend", href: "/jup", icon: Landmark },
      { label: "Offerbook", href: "/jup", icon: Bot, badge: "Beta" },
      { label: "Stake SOL", href: "/jup", icon: Coins },
      { label: "Stake JUP", href: "/jup", icon: CircleDollarSign },
    ],
  },
  {
    group: "Manage",
    items: [
      { label: "Portfolio", href: "/jup/portfolio", icon: PieChart },
      { label: "Send", href: "/jup", icon: Send },
      { label: "Deposit", href: "/jup", icon: ArrowDownToLine },
      { label: "Mobile", href: "/jup", icon: Smartphone },
    ],
  },
];

export function JupShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const s = useJup();
  const expanded = pathname === "/jup";
  const activeHref = ["/jup/perps", "/jup/portfolio", "/jup/gacha"].find((h) => pathname.startsWith(h)) ?? "/jup";

  return (
    <div className="flex min-h-screen bg-[#090d10] font-sans text-[#e8f0f2] [color-scheme:dark]">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/[0.05] bg-[#0b1014] md:flex ${expanded ? "w-[200px]" : "w-[52px]"}`}>
        <Link href="/jup" className="flex h-[52px] items-center gap-2 px-3.5">
          <JupLogo />
          {expanded && <span className="text-[16px] font-semibold tracking-tight">Jupiter</span>}
        </Link>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((g) => (
            <div key={g.group} className="mt-3">
              {expanded && <p className="px-2 pb-1 text-[11px] text-[#5d6b77]">{g.group}</p>}
              {g.items.map((it) => {
                const Icon = it.icon;
                const active = it.href === activeHref && (it.label === "Spot" || it.href !== "/jup");
                return (
                  <Link
                    key={it.label}
                    href={it.href}
                    title={it.label}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[13px] transition ${
                      active ? "bg-white/[0.06] text-[#c7f284]" : "text-[#b7c3cc] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    {expanded && (
                      <>
                        <span className="flex-1">{it.label}</span>
                        {it.badge && <span className="rounded bg-[#c7f284]/10 px-1.5 text-[10px] text-[#c7f284]">{it.badge}</span>}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="mt-3 flex items-center gap-2.5 px-2 py-[7px] text-[13px] text-[#b7c3cc]">
            <MoreHorizontal size={15} /> {expanded && "More"}
          </div>
        </nav>
        <div className="flex items-center gap-2.5 px-4 py-4 text-[13px] text-[#b7c3cc]">
          <MessageCircle size={15} /> {expanded && "Get Help"}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[52px] items-center gap-3 border-b border-white/[0.04] bg-[#090d10]/90 px-4 backdrop-blur">
          <div className="flex h-[34px] w-full max-w-[420px] items-center gap-2 rounded-xl bg-[#131a20] px-3 text-[13px] text-[#6b7a86]">
            <Search size={14} /> <span className="flex-1">Search anything</span>
            <kbd className="rounded bg-white/[0.06] px-1.5 text-[11px]">/</kbd>
          </div>
          <div className="hidden items-center gap-4 text-[12px] lg:flex">
            <span className="flex items-center gap-1.5"><Dot c="#9945ff" />SOL <b className="font-medium">${JUP_TOKENS.SOL.price}</b><i className="not-italic text-[#f25c5c]">-1%</i></span>
            <span className="flex items-center gap-1.5"><Dot c="#c7f284" />JUP <b className="font-medium">${JUP_TOKENS.JUP.price}</b><i className="not-italic text-[#f25c5c]">-2.3%</i></span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <IconBtn><Gift size={15} /></IconBtn>
            <IconBtn><Bell size={15} /></IconBtn>
            <IconBtn><Settings size={15} /></IconBtn>
            {s.connected ? (
              <span className="flex h-[34px] items-center gap-2 rounded-xl bg-[#131a20] px-3 text-[13px]">
                <Wallet size={14} className="text-[#c7f284]" /> Demo…7xQe
              </span>
            ) : (
              <button
                type="button"
                data-companion="jup-connect"
                onClick={() => setJup({ stage: "connect" })}
                className="h-[34px] rounded-xl bg-[#c7f284]/10 px-4 text-[13px] font-semibold text-[#c7f284] hover:bg-[#c7f284]/20"
              >
                Connect
              </button>
            )}
          </div>
        </header>
        <div className="bg-[#c7f284]/[0.07] py-1 text-center text-[11px] text-[#c7f284]/80">
          Independent demo with an AI companion. Simulated wallet, fixed demo prices. Not affiliated with Jupiter.
        </div>
        <main className="flex-1">{children}</main>
      </div>
      <JupModals s={s} />
    </div>
  );
}

const Dot = ({ c }: { c: string }) => <span className="h-2 w-2 rounded-full" style={{ background: c }} />;
const IconBtn = ({ children }: { children: ReactNode }) => (
  <span className="grid h-[34px] w-[34px] place-items-center rounded-xl bg-[#131a20] text-[#b7c3cc]">{children}</span>
);

function Sheet({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[45] grid place-items-center bg-black/60 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ y: 14, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 14 }} className="relative w-full max-w-[380px] rounded-2xl border border-white/[0.07] bg-[#131a20] p-5 text-[#e8f0f2]">
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8a99a6] hover:bg-white/5">
            <X size={16} />
          </button>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

function JupModals({ s }: { s: JupStore }) {
  const close = () => setJup({ stage: "idle", review: null });
  return (
    <AnimatePresence>
      {s.stage === "connect" && (
        <Sheet key="c" onClose={close}>
          <p className="text-[16px] font-semibold">Connect Wallet</p>
          <p className="mt-1 text-[12.5px] text-[#8a99a6]">This demo uses a simulated wallet with play balances.</p>
          <button
            type="button"
            data-companion="jup-wallet-connect"
            onClick={() => setJup({ connected: true, stage: "idle" })}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-[#1b242c] px-3.5 py-3 text-left hover:border-[#c7f284]/50"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#c7f284] text-[#0b1014]"><Wallet size={17} /></span>
            <span className="flex-1">
              <span className="block text-[14px]">Demo Wallet</span>
              <span className="block text-[11.5px] text-[#8a99a6]">14.5 SOL · 1,250 USDC · 3,200 JUP (play money)</span>
            </span>
          </button>
        </Sheet>
      )}
      {(s.stage === "review" || s.stage === "submitting") && s.review && (
        <Sheet key="r" onClose={s.stage === "review" ? close : undefined}>
          <p className="text-[16px] font-semibold">Approve in wallet</p>
          <ReviewRows s={s} />
          <button
            type="button"
            data-companion="jup-approve"
            disabled={s.stage !== "review"}
            onClick={confirmJup}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c7f284] text-[14px] font-semibold text-[#0b1014] disabled:opacity-70"
          >
            {s.stage === "submitting" ? <><Loader2 size={16} className="animate-spin" /> Confirming…</> : "Approve"}
          </button>
        </Sheet>
      )}
      {s.stage === "done" && (
        <Sheet key="d" onClose={close}>
          <div className="text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#c7f284]/15 text-[#c7f284]"><Check size={20} /></span>
            <p className="mt-3 text-[16px] font-semibold">Success</p>
            <p className="mt-1 text-[13px] text-[#8a99a6]">{s.lastAction}</p>
            <button type="button" onClick={close} className="mt-4 h-10 w-full rounded-xl bg-[#1b242c] text-[13.5px] hover:bg-[#232e38]">Close</button>
          </div>
        </Sheet>
      )}
    </AnimatePresence>
  );
}

function ReviewRows({ s }: { s: JupStore }) {
  const rows: [string, string][] = [];
  if (s.review === "swap") {
    const q = quote(s.sellToken, s.buyToken, Number(s.amount));
    rows.push(["Sell", `${s.amount} ${s.sellToken}`], ["Receive (est.)", `${q.out.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${s.buyToken}`], ["Route", q.route], ["Network fee", "0.000005 SOL"]);
  } else if (s.review === "limit") {
    rows.push(["Sell", `${s.amount} ${s.sellToken}`], ["Target price", `${s.limitPrice}`], ["Expires", s.expiry]);
  } else if (s.review === "gacha") {
    const pack = PACKS.find((p) => p.id === s.gachaPack)!;
    rows.push(["Pack", `${pack.name} × ${s.gachaCount}`], ["Pay", `${(pack.price * Number(s.gachaCount)).toLocaleString("en-US")} USDC`], ["Expected value", `${(pack.expectedValue * Number(s.gachaCount)).toLocaleString("en-US")} USDC`], ["Turbo", s.turbo ? "On: Commons auto-sold at 93%" : "Off"]);
  } else {
    rows.push(["Side", `${s.perpSide === "long" ? "Long" : "Short"} ${s.perpMarket}`], ["Collateral", `${s.perpAmount} USDC`], ["Leverage", `${s.leverage}x`]);
  }
  return (
    <dl className="mt-3 space-y-2 rounded-xl bg-[#0b1014] p-3.5 text-[12.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="text-[#8a99a6]">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
