"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpDown, Check, ChevronDown, Copy, ExternalLink, Info, Zap } from "lucide-react";
import { useCompanion, useGuidedField } from "@/components/companion/CompanionProvider";
import { JUP_TOKENS, JUP_TOKEN_IDS, quote, type JupToken } from "@/lib/products/jupiter/web";
import { setJup, swapProblem, useJup, type JupStore } from "./store";

const fmt = (n: number, d = 4) => n.toLocaleString("en-US", { maximumFractionDigits: d });

export function TokenIcon({ t, size = 22 }: { t: JupToken | string; size?: number }) {
  const meta = JUP_TOKENS[t as JupToken];
  return (
    <span className="grid shrink-0 place-items-center rounded-full text-[9px] font-bold text-[#0b1014]" style={{ width: size, height: size, background: meta?.color ?? "#8a99a6" }}>
      {String(t).slice(0, 1)}
    </span>
  );
}

function TokenSelect({ id, value, onPick, balances }: { id: string; value: JupToken; onPick(t: JupToken): void; balances: Record<JupToken, number> }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button type="button" data-companion={id} onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-full bg-[#1b242c] py-1.5 pl-1.5 pr-2.5 text-[14px] font-semibold hover:bg-[#232e38]">
        <TokenIcon t={value} /> {value} <ChevronDown size={14} className="text-[#8a99a6]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-[calc(100%+6px)] z-30 w-[240px] rounded-xl border border-white/[0.07] bg-[#131a20] p-1.5 shadow-2xl">
            {JUP_TOKEN_IDS.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => { onPick(t); setOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-white/[0.05]">
                  <TokenIcon t={t} size={24} />
                  <span className="flex-1">
                    <span className="block font-medium">{t}</span>
                    <span className="block text-[11px] text-[#8a99a6]">{JUP_TOKENS[t].name}</span>
                  </span>
                  <span className="text-[11.5px] text-[#8a99a6]">{fmt(balances[t], 2)}</span>
                  {value === t && <Check size={13} className="text-[#c7f284]" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Tabs({ active }: { active: "market" | "limit" }) {
  const cls = (on: boolean) => `rounded-full px-3 py-1 text-[13px] ${on ? "bg-[#c7f284]/10 font-medium text-[#c7f284]" : "text-[#b7c3cc] hover:text-white"}`;
  return (
    <div className="flex items-center gap-1">
      <Link href="/jup" data-companion="jup-tab-market" className={cls(active === "market")}>Market</Link>
      <Link href="/jup/limit" data-companion="jup-tab-limit" className={cls(active === "limit")}>{active === "limit" ? "Limit - Take Profit" : "Limit"}</Link>
      <span data-companion="jup-tab-dca" className={cls(false)}>DCA</span>
      <span data-companion="jup-ultra" className="ml-auto flex items-center gap-1 text-[12px] text-[#b7c3cc]"><Zap size={12} className="text-[#c7f284]" /> Ultra</span>
    </div>
  );
}

/** Shared by the Market and Limit cards: registers the fields the guide may fill and the page state. */
function useTradeFields(s: JupStore, page: "swap" | "limit") {
  const { setPageContext } = useCompanion();
  const amount = useGuidedField("jup-sell-amount", s.amount, (v) => setJup({ amount: v }));
  const sell = useGuidedField("jup-sell-token", s.sellToken, (v) => setJup({ sellToken: v as JupToken }));
  useEffect(() => {
    const q = Number(s.amount) > 0 ? quote(s.sellToken, s.buyToken, Number(s.amount)) : null;
    setPageContext(() => ({
      product: "jupiter",
      page,
      connected: s.connected,
      sellToken: s.sellToken,
      buyToken: s.buyToken,
      amount: s.amount,
      balances: s.balances,
      quote: q && { receive: fmt(q.out), usd: fmt(q.usd, 2), priceImpactPct: fmt(q.impactPct, 3), route: q.route },
      limitPrice: s.limitPrice,
      openOrders: s.orders.length,
      lastAction: s.lastAction,
      problem: swapProblem(s),
    }));
  }, [s, page, setPageContext]);
  return { amount, sell };
}

function SellBox({ s, amount, sell, label = "Sell" }: { s: JupStore; amount(v: string): void; sell(v: string): void; label?: string }) {
  const usd = Number(s.amount) > 0 ? Number(s.amount) * JUP_TOKENS[s.sellToken].price : 0;
  return (
    <div className="rounded-xl bg-[#1b242c]/70 p-3.5">
      <div className="flex items-center justify-between text-[12.5px] text-[#8a99a6]">
        <span>{label}</span>
        {s.connected && (
          <span className="flex items-center gap-2">
            {fmt(s.balances[s.sellToken])} {s.sellToken}
            <button type="button" onClick={() => amount(String(s.balances[s.sellToken] / 2))} className="rounded bg-white/[0.06] px-1.5 text-[10.5px] hover:text-white">HALF</button>
            <button type="button" onClick={() => amount(String(s.balances[s.sellToken]))} className="rounded bg-white/[0.06] px-1.5 text-[10.5px] hover:text-white">MAX</button>
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          data-companion="jup-sell-amount"
          inputMode="decimal"
          value={s.amount}
          onChange={(e) => amount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0.0"
          className="min-w-0 flex-1 bg-transparent text-[28px] font-semibold placeholder:text-[#4a5763] focus:outline-none"
        />
        <TokenSelect id="jup-sell-token" value={s.sellToken} onPick={(t) => sell(t)} balances={s.balances} />
      </div>
      <p className="text-[12px] text-[#6b7a86]">${fmt(usd, 2)}</p>
    </div>
  );
}

function MainButton({ s, id, label, problem, onGo }: { s: JupStore; id: string; label: string; problem: string | null; onGo(): void }) {
  if (!s.connected)
    return (
      <button type="button" onClick={() => setJup({ stage: "connect" })} className="mt-3 h-[52px] w-full rounded-xl bg-[#c7f284] text-[15px] font-semibold text-[#0b1014] hover:brightness-105">
        Connect
      </button>
    );
  return (
    <button type="button" data-companion={id} disabled={!!problem} onClick={onGo} className="mt-3 h-[52px] w-full rounded-xl bg-[#c7f284] text-[15px] font-semibold text-[#0b1014] transition enabled:hover:brightness-105 disabled:bg-[#1b242c] disabled:text-[#6b7a86]">
      {problem ?? label}
    </button>
  );
}

export function SwapCard() {
  const s = useJup();
  const { amount, sell } = useTradeFields(s, "swap");
  const buy = useGuidedField("jup-buy-token", s.buyToken, (v) => setJup({ buyToken: v as JupToken }));
  const q = Number(s.amount) > 0 ? quote(s.sellToken, s.buyToken, Number(s.amount)) : null;
  const problem = swapProblem(s);

  return (
    <div className="mx-auto w-full max-w-[464px] px-3 pb-24 pt-8">
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#131a20] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#c7f284]/10 text-[#c7f284]">⇆</span>
        <div className="text-[12.5px]">
          <p className="font-medium">Try Jupiter Bridge: move crypto to and from Solana</p>
          <p className="text-[#8a99a6]">Best rates found for you across 50+ chains. Now in beta.</p>
        </div>
      </div>

      <section data-companion="jup-swap-card" className="rounded-2xl border border-white/[0.06] bg-[#131a20] p-3">
        <Tabs active="market" />
        <div className="mt-3">
          <SellBox s={s} amount={amount} sell={sell} />
          <div className="relative z-10 -my-2.5 flex justify-center">
            <button type="button" data-companion="jup-flip" onClick={() => setJup({ sellToken: s.buyToken, buyToken: s.sellToken })} className="grid h-8 w-8 place-items-center rounded-full border-4 border-[#131a20] bg-[#1b242c] text-[#8a99a6] hover:text-[#c7f284]">
              <ArrowUpDown size={13} />
            </button>
          </div>
          <div className="rounded-xl bg-[#1b242c]/40 p-3.5">
            <div className="flex items-center justify-between text-[12.5px] text-[#8a99a6]">
              <span>Buy</span>
              {s.connected && <span>{fmt(s.balances[s.buyToken])} {s.buyToken}</span>}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <p className="min-w-0 flex-1 truncate text-[28px] font-semibold text-[#e8f0f2]">{q ? fmt(q.out, 6) : <span className="text-[#4a5763]">0.0</span>}</p>
              <TokenSelect id="jup-buy-token" value={s.buyToken} onPick={(t) => buy(t)} balances={s.balances} />
            </div>
            <p className="text-[12px] text-[#6b7a86]">${q ? fmt(q.out * JUP_TOKENS[s.buyToken].price, 2) : "0"}</p>
          </div>
        </div>

        <div data-companion="jup-quote" className="mt-2 space-y-1.5 rounded-xl px-1 py-2 text-[12px] text-[#8a99a6]">
          <div className="flex justify-between">
            <span>Rate</span>
            <span className="text-[#e8f0f2]">1 {s.sellToken} ≈ {fmt(JUP_TOKENS[s.sellToken].price / JUP_TOKENS[s.buyToken].price, 6)} {s.buyToken}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">Price impact <Info size={11} /></span>
            <span className={q && q.impactPct > 0.5 ? "text-[#f2b35c]" : "text-[#c7f284]"}>{q ? `${fmt(q.impactPct, 3)}%` : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>Route</span>
            <span className="text-[#e8f0f2]">{q ? q.route : "-"}</span>
          </div>
        </div>

        <MainButton s={s} id="jup-swap-submit" label="Swap" problem={problem} onGo={() => setJup({ stage: "review", review: "swap" })} />
      </section>

      <TokenCards a={s.sellToken} b={s.buyToken} />
    </div>
  );
}

function TokenCards({ a, b }: { a: JupToken; b: JupToken }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {[a, b].map((t) => (
        <div key={t} className="rounded-2xl border border-white/[0.06] bg-[#131a20] p-3.5">
          <div className="flex items-center gap-2">
            <TokenIcon t={t} size={26} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[13px] font-medium">{t} <ExternalLink size={11} className="text-[#6b7a86]" /></p>
              <p className="flex items-center gap-1 text-[11px] text-[#6b7a86]">{JUP_TOKENS[t].mint} <Copy size={10} /></p>
            </div>
            <p className="text-right text-[13px]">${fmt(JUP_TOKENS[t].price, 6)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LimitCard() {
  const s = useJup();
  const { amount, sell } = useTradeFields(s, "limit");
  const price = useGuidedField("jup-limit-price", s.limitPrice, (v) => setJup({ limitPrice: v }));
  const market = JUP_TOKENS[s.sellToken].price / JUP_TOKENS[s.buyToken].price;
  const target = Number(s.limitPrice) || market;
  const receive = Number(s.amount) > 0 ? Number(s.amount) * target : 0;
  const base = swapProblem(s);
  const problem = base ?? (!(Number(s.limitPrice) > 0) ? "Set a target price" : null);

  return (
    <div className="mx-auto w-full max-w-[464px] px-3 pb-24 pt-8">
      <section data-companion="jup-swap-card" className="rounded-2xl border border-white/[0.06] bg-[#131a20] p-3">
        <Tabs active="limit" />
        <div className="mt-3 rounded-xl border border-[#c7f284]/15 bg-[#c7f284]/[0.05] px-3.5 py-2.5 text-[12px]">
          <p className="font-medium text-[#c7f284]">Sell when {s.sellToken} reaches your target</p>
          <p className="text-[#8a99a6]">At $100, set $110. Sells at $110 or better, possibly in parts.</p>
        </div>
        <div className="mt-2">
          <SellBox s={s} amount={amount} sell={sell} />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-[#1b242c]/40 px-3.5 py-3 text-[13px]">
          <span className="text-[#8a99a6]">Receive <b className="font-semibold text-[#e8f0f2]">{fmt(receive, 6)}</b></span>
          <span className="flex items-center gap-1.5 font-semibold"><TokenIcon t={s.buyToken} size={18} /> {s.buyToken}</span>
        </div>
        <div className="mt-2 rounded-xl bg-[#1b242c]/70 p-3.5">
          <p className="text-[12.5px] text-[#8a99a6]">Sell when 1 {s.sellToken} reaches</p>
          <input
            data-companion="jup-limit-price"
            inputMode="decimal"
            value={s.limitPrice}
            onChange={(e) => price(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder={fmt(market, 6)}
            className="mt-1 w-full bg-transparent text-[26px] font-semibold placeholder:text-[#4a5763] focus:outline-none"
          />
          <div className="mt-1 flex items-center justify-between text-[11.5px] text-[#6b7a86]">
            <span>Market {fmt(market, 6)} {s.buyToken}</span>
            <span className="flex gap-1">
              {[0, 1, 5, 10].map((p) => (
                <button key={p} type="button" onClick={() => price(String(Math.round(market * (1 + p / 100) * 1e6) / 1e6))} className="rounded bg-white/[0.06] px-1.5 py-0.5 hover:text-[#c7f284]">
                  {p === 0 ? "Market" : `+${p}%`}
                </button>
              ))}
            </span>
          </div>
        </div>
        <div data-companion="jup-limit-expiry" className="mt-3 flex items-center justify-between px-1 text-[12.5px]">
          <span className="text-[#8a99a6]">Expires in</span>
          <span className="flex gap-1">
            {(["1H", "1D", "1W", "30D"] as const).map((e) => (
              <button key={e} type="button" onClick={() => setJup({ expiry: e })} className={`rounded-md px-2 py-1 ${s.expiry === e ? "bg-[#c7f284]/15 text-[#c7f284]" : "text-[#8a99a6] hover:text-white"}`}>
                {e}
              </button>
            ))}
          </span>
        </div>
        <MainButton s={s} id="jup-limit-submit" label="Place order" problem={problem} onGo={() => setJup({ stage: "review", review: "limit" })} />
      </section>
      {s.orders.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#131a20] p-3.5 text-[12.5px]">
          <p className="mb-2 font-medium">Open orders</p>
          {s.orders.map((o, i) => (
            <p key={i} className="flex justify-between text-[#b7c3cc]">
              <span>Sell {o.amount} {o.sell} → {o.buy}</span>
              <span>@ {o.price} · {o.expiry}</span>
            </p>
          ))}
        </div>
      )}
      <TokenCards a={s.sellToken} b={s.buyToken} />
    </div>
  );
}
