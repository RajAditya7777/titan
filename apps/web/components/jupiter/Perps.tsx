"use client";

import { useEffect, useMemo } from "react";
import { Lock, Search, Star } from "lucide-react";
import { useCompanion, useGuidedField } from "@/components/companion/CompanionProvider";
import { PERP_MARKETS, liquidationPrice, type PerpMarket } from "@/lib/products/jupiter/web";
import { perpProblem, setJup, useJup } from "./store";
import { TokenIcon } from "./Trade";

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const MARKETS: { m: PerpMarket; change: number; vol: string; color: string }[] = [
  { m: "SOL", change: -1.02, vol: "$412M", color: "#9945ff" },
  { m: "ETH", change: 0.84, vol: "$198M", color: "#627eea" },
  { m: "BTC", change: -0.31, vol: "$356M", color: "#f7931a" },
];
const LEVERAGE_MARKS = [1.1, 50, 100, 150, 200, 250];

/** A deterministic candle chart: the same market always draws the same history (no live data). */
function Chart({ market }: { market: PerpMarket }) {
  const candles = useMemo(() => {
    let seed = market.charCodeAt(0) * 97 + market.length;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const base = PERP_MARKETS[market];
    let price = base * 1.04;
    return Array.from({ length: 72 }, () => {
      const open = price;
      const close = open * (1 + (rnd() - 0.53) * 0.014);
      const high = Math.max(open, close) * (1 + rnd() * 0.006);
      const low = Math.min(open, close) * (1 - rnd() * 0.006);
      price = close;
      return { open, close, high, low };
    }).map((c, i, all) => (i === all.length - 1 ? { ...c, close: base } : c));
  }, [market]);
  const hi = Math.max(...candles.map((c) => c.high));
  const lo = Math.min(...candles.map((c) => c.low));
  const y = (v: number) => 8 + ((hi - v) / (hi - lo)) * 284;
  return (
    <svg viewBox="0 0 720 300" className="h-full w-full" preserveAspectRatio="none">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="0" x2="720" y1={8 + i * 71} y2={8 + i * 71} stroke="rgba(255,255,255,0.04)" />
      ))}
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const x = 6 + i * 9.8;
        return (
          <g key={i} stroke={up ? "#3ec98a" : "#f25c5c"} fill={up ? "#3ec98a" : "#f25c5c"}>
            <line x1={x + 3} x2={x + 3} y1={y(c.high)} y2={y(c.low)} />
            <rect x={x} y={Math.min(y(c.open), y(c.close))} width="6" height={Math.max(1, Math.abs(y(c.open) - y(c.close)))} />
          </g>
        );
      })}
      <line x1="0" x2="720" y1={y(PERP_MARKETS[market])} y2={y(PERP_MARKETS[market])} stroke="#c7f284" strokeDasharray="4 4" opacity="0.6" />
    </svg>
  );
}

export function PerpsView() {
  const s = useJup();
  const { setPageContext } = useCompanion();
  const amount = useGuidedField("jup-perps-amount", s.perpAmount, (v) => setJup({ perpAmount: v }));
  const leverage = useGuidedField("jup-perps-leverage", s.leverage, (v) => setJup({ leverage: v }));
  const entry = PERP_MARKETS[s.perpMarket];
  const lev = Number(s.leverage) || 1.1;
  const size = (Number(s.perpAmount) || 0) * lev;
  const liq = liquidationPrice(s.perpSide, entry, lev);
  const problem = perpProblem(s);

  useEffect(() => {
    setPageContext(() => ({
      product: "jupiter",
      page: "perps",
      connected: s.connected,
      market: s.perpMarket,
      markPrice: entry,
      side: s.perpSide,
      collateralUsdc: s.perpAmount,
      leverage: s.leverage,
      positionSizeUsd: Math.round(size * 100) / 100,
      liquidationPrice: Math.round(liq * 100) / 100,
      usdcBalance: s.balances.USDC,
      openPositions: s.positions,
      problem,
    }));
  }, [s, entry, size, liq, problem, setPageContext]);

  return (
    <div className="grid min-h-[calc(100vh-76px)] grid-cols-1 gap-2 p-2 lg:grid-cols-[230px_1fr_330px]">
      <aside data-companion="jup-perps-markets" className="rounded-xl bg-[#0f151a] p-2">
        <div className="flex items-center gap-2 rounded-lg bg-[#131a20] px-2.5 py-2 text-[12.5px] text-[#6b7a86]">
          <Search size={13} /> Search markets
        </div>
        <div className="mt-2 flex gap-1 text-[11.5px] text-[#8a99a6]">
          {["All", "Favourite", "Crypto", "Stock"].map((t, i) => (
            <span key={t} className={`rounded-md px-2 py-1 ${i === 0 ? "bg-white/[0.06] text-white" : ""}`}>{t}</span>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          {MARKETS.map(({ m, change, color }) => (
            <button key={m} type="button" onClick={() => setJup({ perpMarket: m })} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left ${s.perpMarket === m ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}>
              <span className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold text-[#0b1014]" style={{ background: color }}>{m[0]}</span>
              <span className="flex-1">
                <span className="block text-[13px] font-medium">{m}</span>
                <span className="text-[10px]"><span className="rounded bg-[#c7f284]/10 px-1 text-[#c7f284]">250x</span> <span className="text-[#6b7a86]">JLP</span></span>
              </span>
              <span className="text-right text-[12px]">
                <span className="block">${fmt(PERP_MARKETS[m])}</span>
                <span className={change >= 0 ? "text-[#3ec98a]" : "text-[#f25c5c]"}>{change > 0 ? "+" : ""}{change}%</span>
              </span>
              <Star size={12} className="text-[#4a5763]" />
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-6 rounded-xl bg-[#0f151a] px-4 py-3 text-[12px]">
          <span className="flex items-center gap-2 text-[16px] font-semibold"><TokenIcon t={s.perpMarket === "SOL" ? "SOL" : s.perpMarket} /> {s.perpMarket}-PERP</span>
          {[
            ["Mark Price", `$${fmt(entry)}`],
            ["24H Change", `${MARKETS.find((x) => x.m === s.perpMarket)!.change}%`],
            ["24H Vol", MARKETS.find((x) => x.m === s.perpMarket)!.vol],
            ["Available Liq.", "$38.2M"],
            ["Borrow Rate", "0.0012%/h"],
          ].map(([k, v]) => (
            <span key={k}>
              <span className="block text-[#6b7a86]">{k}</span>
              <span className="font-medium">{v}</span>
            </span>
          ))}
        </div>
        <div data-companion="jup-perps-chart" className="h-[360px] rounded-xl bg-[#0f151a] p-3">
          <Chart market={s.perpMarket} />
        </div>
        <div className="flex-1 rounded-xl bg-[#0f151a] p-3 text-[12px]">
          <div className="flex gap-4 border-b border-white/[0.05] pb-2 text-[#8a99a6]">
            <span className="text-white">Positions</span><span>Open Orders</span><span>History</span><span>Funding History</span>
          </div>
          {s.positions.length === 0 ? (
            <p className="py-10 text-center text-[#6b7a86]">{s.connected ? "No open positions" : "Connect your wallet to see your trades"}</p>
          ) : (
            <table className="mt-2 w-full text-left">
              <thead className="text-[#6b7a86]"><tr><th className="py-1">Position</th><th>Size</th><th>Collateral</th><th>Entry</th><th>Liq. Price</th></tr></thead>
              <tbody>
                {s.positions.map((p, i) => (
                  <tr key={i}>
                    <td className={`py-1.5 ${p.side === "long" ? "text-[#3ec98a]" : "text-[#f25c5c]"}`}>{p.market} {p.side} {p.leverage}x</td>
                    <td>${fmt(p.collateral * p.leverage)}</td>
                    <td>${fmt(p.collateral)}</td>
                    <td>${fmt(p.entry)}</td>
                    <td className="text-[#f2b35c]">${fmt(p.liq)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <aside className="rounded-xl bg-[#0f151a] p-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#131a20] p-1">
          <button type="button" data-companion="jup-perps-long" onClick={() => setJup({ perpSide: "long" })} className={`rounded-md py-2 text-[13px] font-medium ${s.perpSide === "long" ? "bg-[#3ec98a]/15 text-[#3ec98a]" : "text-[#8a99a6]"}`}>Long/Buy</button>
          <button type="button" data-companion="jup-perps-short" onClick={() => setJup({ perpSide: "short" })} className={`rounded-md py-2 text-[13px] font-medium ${s.perpSide === "short" ? "bg-[#f25c5c]/15 text-[#f25c5c]" : "text-[#8a99a6]"}`}>Short/Sell</button>
        </div>
        <div className="mt-3 flex gap-3 text-[13px]"><span className="font-medium">Market</span><span className="text-[#6b7a86]">Limit</span></div>
        <div className="mt-3">
          <div className="flex justify-between text-[12px] text-[#8a99a6]"><span>Amount</span><span>{s.connected ? `${fmt(s.balances.USDC)} USDC` : "0 USDC"}</span></div>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#131a20] px-3 py-2.5">
            <input data-companion="jup-perps-amount" inputMode="decimal" value={s.perpAmount} onChange={(e) => amount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" className="min-w-0 flex-1 bg-transparent text-[16px] placeholder:text-[#4a5763] focus:outline-none" />
            <span className="flex items-center gap-1 text-[13px]"><TokenIcon t="USDC" size={16} /> USDC</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <input type="range" min={1.1} max={250} step={0.1} value={lev} onChange={(e) => leverage(String(Math.round(Number(e.target.value) * 10) / 10))} className="flex-1 accent-[#c7f284]" />
            <input data-companion="jup-perps-leverage" value={s.leverage} onChange={(e) => leverage(e.target.value.replace(/[^\d.]/g, ""))} className="w-14 rounded-lg border border-white/[0.06] bg-[#131a20] px-2 py-1.5 text-center text-[13px] focus:outline-none" />
            <span className="text-[12px] text-[#8a99a6]">x</span>
          </div>
          <div className="mt-1 flex justify-between text-[10.5px] text-[#6b7a86]">{LEVERAGE_MARKS.map((m) => <button key={m} type="button" onClick={() => leverage(String(m))}>{m}x</button>)}</div>
        </div>
        <div className="mt-3 space-y-2 text-[12px] text-[#8a99a6]">
          <p className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Lock size={12} /> Lock leverage</span><span className="h-4 w-7 rounded-full bg-white/10" /></p>
          <p className="flex items-center justify-between"><span>Add TP/SL</span><span className="h-4 w-7 rounded-full bg-white/10" /></p>
        </div>
        {s.connected ? (
          <button type="button" data-companion="jup-perps-submit" disabled={!!problem} onClick={() => setJup({ stage: "review", review: "perps" })} className={`mt-4 h-12 w-full rounded-xl text-[15px] font-semibold text-[#0b1014] disabled:bg-[#1b242c] disabled:text-[#6b7a86] ${s.perpSide === "long" ? "bg-[#c7f284]" : "bg-[#f25c5c]"}`}>
            {problem ?? (s.perpSide === "long" ? "Long/Buy" : "Short/Sell")}
          </button>
        ) : (
          <button type="button" onClick={() => setJup({ stage: "connect" })} className="mt-4 h-12 w-full rounded-xl bg-[#c7f284] text-[15px] font-semibold text-[#0b1014]">Connect</button>
        )}
        <dl className="mt-4 space-y-1.5 text-[12px]">
          <Row k="Entry Price" v={`$${fmt(entry)}`} />
          <div data-companion="jup-perps-liq"><Row k="Liquidation Price" v={Number(s.perpAmount) > 0 ? `$${fmt(liq)}` : "-"} warn /></div>
          <Row k="Position size" v={size > 0 ? `$${fmt(size)}` : "-"} />
          <Row k="Slippage" v="Max: 1%" />
          <Row k="Total Fees" v={size > 0 ? `$${fmt(size * 0.0006)}` : "-"} />
        </dl>
      </aside>
    </div>
  );
}

const Row = ({ k, v, warn }: { k: string; v: string; warn?: boolean }) => (
  <div className="flex justify-between">
    <dt className="text-[#8a99a6]">{k}</dt>
    <dd className={warn && v !== "-" ? "text-[#f2b35c]" : ""}>{v}</dd>
  </div>
);
