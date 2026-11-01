"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Play, RotateCcw, Search, ShieldCheck, Zap } from "lucide-react";
import { useGuidedField } from "@/components/companion/CompanionProvider";
import { SourceBadge, TokenIcon } from "@/components/ui/primitives";
import { estimateRevenue, projectBalance, splitLoss, yieldSplit, PROTECTION_COST } from "@/lib/site/calc";
import { ASSETS, ENDPOINT_GROUPS, FAMILY_LABEL, type AssetFamily, type Endpoint } from "@/lib/site/content";
import { validate } from "@/lib/companion/registry";
import { useLiveApy, useLiveOverview } from "./useLive";

const usd = (n: number, dp = 2) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: dp, maximumFractionDigits: dp });

/** White card that sits inside a SplitPanel. */
function WidgetCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 md:p-6 ${className}`}>{children}</div>;
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-[var(--surface-2)] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`relative rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors ${value === o.value ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
        >
          {value === o.value && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 -z-0 rounded-full bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// ───────── Yield preview (home, earn) ─────────

const RANGES = { "1W": 7, "1M": 30, "1Y": 365 } as const;
type Range = keyof typeof RANGES;

export function YieldPreview({ symbol = "USDC+" }: { symbol?: "USDC+" | "USDT+" }) {
  const apy = useLiveApy(symbol);
  const [balance, setBalance] = useState("10000");
  const [range, setRange] = useState<Range>("1M");
  const amount = Number(balance) || 0;
  const days = RANGES[range];
  const gain = apy == null ? null : projectBalance(amount, apy, days) - amount;
  // 12 points across the range for the sparkline bars.
  const bars = useMemo(() => Array.from({ length: 12 }, (_, i) => (apy == null ? 0 : projectBalance(amount, apy, ((i + 1) / 12) * days) - amount)), [amount, apy, days]);
  const peak = Math.max(...bars, 1e-9);

  return (
    <WidgetCard>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-medium">
          <TokenIcon symbol={symbol} size={26} /> {symbol}
        </span>
        <SourceBadge kind="live" />
      </div>
      <label className="mt-5 block text-[12.5px] text-[var(--muted)]" htmlFor={`bal-${symbol}`}>
        If you held
      </label>
      <div className="flex items-baseline gap-1">
        <span className="text-[30px] font-medium text-[var(--muted)]">$</span>
        <input
          id={`bal-${symbol}`}
          inputMode="decimal"
          value={balance}
          onChange={(e) => setBalance(e.target.value.replace(/[^\d.]/g, "").slice(0, 12))}
          className="num w-full bg-transparent text-[36px] font-medium outline-none"
        />
      </div>
      <div className="mt-4 flex h-20 items-end gap-1.5" aria-hidden>
        {bars.map((b, i) => (
          <motion.span key={i} className="flex-1 rounded-t-md bg-[var(--accent)]" initial={{ height: 0 }} animate={{ height: `${Math.max(4, (b / peak) * 100)}%`, opacity: 0.35 + (i / bars.length) * 0.65 }} transition={{ duration: 0.4, delay: i * 0.02 }} />
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] text-[var(--muted)]">Current APY</p>
          <p className="num text-[20px] font-medium">{apy == null ? "…" : `${apy.toFixed(2)}%`}</p>
        </div>
        <Segmented label={`range-${symbol}`} value={range} onChange={setRange} options={(Object.keys(RANGES) as Range[]).map((r) => ({ value: r, label: r }))} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3 text-[14px]">
        <span className="text-[var(--muted)]">Estimated after {range === "1W" ? "a week" : range === "1M" ? "a month" : "a year"}</span>
        <span className="num font-medium text-[var(--good)]">{gain == null ? "…" : `+${usd(gain)}`}</span>
      </div>
      <p className="mt-3 text-[11.5px] text-[var(--muted)]">Assumes today&apos;s rate holds, which it won&apos;t exactly. Rates are variable.</p>
    </WidgetCard>
  );
}

// ───────── Savings builder (home, create) ─────────

const SWATCHES = ["#0058b2", "#0f8a5f", "#7c3aed", "#e0582f"];

export function SavingsBuilder() {
  const overview = useLiveOverview();
  const [name, setName] = useState("Acme Savings");
  const [colour, setColour] = useState(SWATCHES[0]!);
  const [preset, setPreset] = useState<"balanced" | "protected">("balanced");
  const [usdcShare, setUsdcShare] = useState(60);

  const apyOf = (s: string) => (overview.state === "ok" ? overview.coins.find((c) => c.symbol === s)?.apy?.percent ?? null : null);
  const a = apyOf("USDC+");
  const b = apyOf("USDT+");
  const blended = a == null || b == null ? null : ((a * usdcShare + b * (100 - usdcShare)) / 100) * (preset === "protected" ? 1 - PROTECTION_COST : 1);

  return (
    <WidgetCard>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-[12.5px] text-[var(--muted)]">Account name</span>
          <input value={name} maxLength={28} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line-strong)] px-3 py-2 text-[14.5px] outline-none focus:border-[var(--accent)]" />
        </label>
        <div>
          <span className="text-[12.5px] text-[var(--muted)]">Brand colour</span>
          <div className="mt-2 flex gap-2">
            {SWATCHES.map((c) => (
              <button key={c} type="button" aria-label={`Use colour ${c}`} aria-pressed={colour === c} onClick={() => setColour(c)} className="grid h-7 w-7 place-items-center rounded-full ring-offset-2 transition" style={{ background: c, boxShadow: colour === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}>
                {colour === c && <Check size={13} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Segmented
          label="preset"
          value={preset}
          onChange={setPreset}
          options={[
            { value: "balanced", label: "Balanced" },
            { value: "protected", label: "Protected" },
          ]}
        />
      </div>

      <label className="mt-4 block">
        <span className="flex justify-between text-[12.5px] text-[var(--muted)]">
          <span>USDC+ {usdcShare}%</span>
          <span>USDT+ {100 - usdcShare}%</span>
        </span>
        <input type="range" min={0} max={100} step={5} value={usdcShare} onChange={(e) => setUsdcShare(Number(e.target.value))} className="mt-2 w-full" style={{ accentColor: colour }} aria-label="USDC+ share of the basket" />
      </label>

      {/* Live preview of the branded account */}
      <motion.div layout className="mt-5 rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${colour}, #0b0e12)` }}>
        <p className="text-[12px] opacity-75">{preset === "protected" ? "Protected savings" : "Savings"}</p>
        <p className="mt-0.5 truncate text-[18px] font-medium">{name || "Your savings"}</p>
        <div className="mt-6 flex items-end justify-between">
          <p className="num text-[26px] font-medium">{blended == null ? "…" : `${blended.toFixed(2)}%`}</p>
          <p className="text-[11.5px] opacity-75">blended APY{preset === "protected" ? ", after cover" : ""}</p>
        </div>
      </motion.div>
      <p className="mt-3 text-[11.5px] text-[var(--muted)]">Blend of live USDC+ and USDT+ APYs. The protected preset assumes {PROTECTION_COST * 100}% of yield pays for cover (illustrative).</p>
    </WidgetCard>
  );
}

// ───────── Tranche loss simulator (home, protect) ─────────

export function LossSimulator({ underlying = "syrupUSDC", pool = 10_000, juniorShare = 20 }: { underlying?: string; pool?: number; juniorShare?: number }) {
  const [loss, setLoss] = useState(0);
  const out = splitLoss(pool, juniorShare, loss);
  const junior0 = (pool * juniorShare) / 100;
  const senior0 = pool - junior0;

  return (
    <WidgetCard>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-medium">
          <ShieldCheck size={18} className="text-[var(--accent)]" /> {underlying} example pool
        </span>
        <span className="num text-[14px] font-medium">{usd(pool)}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Tranche icon={<ShieldCheck size={15} />} name="Protected" role="Senior" value={out.senior} start={senior0} tone="accent" />
        <Tranche icon={<Zap size={15} />} name="Amplified" role="Junior" value={out.junior} start={junior0} tone="warn" />
      </div>

      <label className="mt-6 block">
        <span className="flex justify-between text-[12.5px] text-[var(--muted)]">
          <span>Simulated loss in the underlying</span>
          <span className="num font-medium text-[var(--text)]">{loss}%</span>
        </span>
        <input type="range" min={0} max={40} value={loss} onChange={(e) => setLoss(Number(e.target.value))} className="mt-2 w-full accent-[var(--bad)]" aria-label="Simulated loss percent" />
      </label>

      <p className="mt-3 min-h-[40px] text-[13px] leading-relaxed text-[var(--muted)]">
        {loss === 0
          ? `The amplified side is a ${usd(junior0, 0)} buffer in front of protected holders.`
          : out.seniorLoss === 0
            ? `A ${usd(out.loss, 0)} loss lands entirely on the amplified side. Protected holders are untouched.`
            : `The buffer is used up. Protected holders lose ${usd(out.seniorLoss, 0)}: cover only goes as far as the junior capital.`}
      </p>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setLoss(10)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] py-2 text-[13.5px] font-medium hover:bg-[var(--surface-2)]">
          <Play size={13} /> Try a 10% loss
        </button>
        <button type="button" onClick={() => setLoss(0)} aria-label="Reset loss" className="grid w-10 place-items-center rounded-full border border-[var(--line-strong)] hover:bg-[var(--surface-2)]">
          <RotateCcw size={14} />
        </button>
      </div>
      <p className="mt-3 text-[11.5px] text-[var(--muted)]">Illustration with a fixed {juniorShare}% junior share. Real pools set their own split.</p>
    </WidgetCard>
  );
}

function Tranche({ icon, name, role, value, start, tone }: { icon: React.ReactNode; name: string; role: string; value: number; start: number; tone: "accent" | "warn" }) {
  const pct = start ? (value / start) * 100 : 0;
  const color = tone === "accent" ? "var(--accent)" : "#d97706";
  return (
    <div className="rounded-2xl border border-[var(--line)] p-3.5">
      <div className="flex items-center justify-between text-[12px] text-[var(--muted)]">
        <span className="flex items-center gap-1" style={{ color }}>
          {icon} {name}
        </span>
        <span>{role}</span>
      </div>
      <p className="num mt-2 text-[20px] font-medium">{usd(value)}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
      </div>
    </div>
  );
}

// ───────── Revenue split (create) ─────────

export function RevenueSplit() {
  const [share, setShare] = useState(15);
  const s = yieldSplit(share);
  return (
    <WidgetCard>
      <p className="text-[13px] text-[var(--muted)]">For every $100 of yield your product earns</p>
      <div className="mt-4 flex h-14 overflow-hidden rounded-2xl text-[13px] font-medium">
        <motion.div className="flex items-center justify-center bg-[var(--accent)] text-white" animate={{ width: `${s.users}%` }}>
          Users ${s.users.toFixed(0)}
        </motion.div>
        <motion.div className="flex items-center justify-center bg-[var(--ink)] text-white" animate={{ width: `${Math.max(s.business, 0.0001)}%` }}>
          {s.business >= 8 ? `You $${s.business.toFixed(0)}` : ""}
        </motion.div>
      </div>
      <label className="mt-5 block">
        <span className="flex justify-between text-[12.5px] text-[var(--muted)]">
          <span>Your share of the yield</span>
          <span className="num font-medium text-[var(--text)]">{share}%</span>
        </span>
        <input type="range" min={0} max={50} value={share} onChange={(e) => setShare(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" aria-label="Your share of the yield" />
      </label>
      <Link href="/create/calculator" className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-[var(--accent)]">
        Estimate your revenue <ArrowUpRight size={14} />
      </Link>
    </WidgetCard>
  );
}

// ───────── Revenue calculator (create/calculator) ─────────

const DEPOSIT_PRESETS = [
  { label: "Pilot", value: "1000000" },
  { label: "Growing", value: "10000000" },
  { label: "At scale", value: "100000000" },
];
const FEE_PRESETS = [
  { label: "Light", value: "250" },
  { label: "Typical", value: "500" },
  { label: "Maximum", value: "1000" },
];

export function RevenueCalculator() {
  const live = useLiveApy("USDC+");
  const [deposits, setDeposits] = useState("10000000");
  const [fee, setFee] = useState("500");
  const [apyOverride, setApyOverride] = useState<string | null>(null);
  const [protectedOn, setProtectedOn] = useState(false);
  const [period, setPeriod] = useState<"year" | "month">("year");
  const onDeposits = useGuidedField("calc-deposits", deposits, setDeposits);
  const onFee = useGuidedField("calc-fee", fee, setFee);

  const depositsError = validate("capital", deposits);
  const feeError = validate("fee-bps", fee);
  const apyText = apyOverride ?? (live == null ? "" : live.toFixed(2));
  const apy = Number(apyText);
  const ready = !depositsError && !feeError && apyText !== "" && apy >= 0 && apy <= 30;

  const r = ready ? estimateRevenue({ idleCapital: Number(deposits), adoptionPercent: 100, sharePercent: Number(fee) / 100, grossApyPercent: apy, protectedOn }) : null;
  const yours = r ? (period === "year" ? r.businessYearly : r.businessMonthly) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <Field label="Expected deposits" hint="Dollars your users keep in the product." error={deposits && depositsError}>
          <div className="flex items-center gap-1 rounded-xl border border-[var(--line-strong)] px-3 focus-within:border-[var(--accent)]">
            <span className="text-[var(--muted)]">$</span>
            <input data-companion="calc-deposits" inputMode="decimal" value={deposits} onChange={(e) => onDeposits(e.target.value.replace(/[^\d.]/g, ""))} className="num w-full bg-transparent py-2.5 text-[16px] outline-none" aria-label="Expected deposits in dollars" />
          </div>
          <Chips options={DEPOSIT_PRESETS} value={deposits} onPick={onDeposits} format={(v) => usd(Number(v), 0)} />
        </Field>

        <Field label="Your fee" hint="Your cut of the yield, in basis points (100 bps = 1% of yield)." error={fee && feeError}>
          <div className="flex items-center gap-1 rounded-xl border border-[var(--line-strong)] px-3 focus-within:border-[var(--accent)]">
            <input data-companion="calc-fee" inputMode="numeric" value={fee} onChange={(e) => onFee(e.target.value.replace(/\D/g, ""))} className="num w-full bg-transparent py-2.5 text-[16px] outline-none" aria-label="Your fee in basis points" />
            <span className="text-[var(--muted)]">bps</span>
          </div>
          <Chips options={FEE_PRESETS} value={fee} onPick={onFee} format={(v) => `${Number(v) / 100}%`} />
        </Field>

        <Field label="Gross APY" hint={apyOverride == null ? "Today's live USDC+ APY. Edit it to try other rates." : "Your own assumption."}>
          <div className="flex items-center gap-1 rounded-xl border border-[var(--line-strong)] px-3 focus-within:border-[var(--accent)]">
            <input inputMode="decimal" value={apyText} placeholder="loading…" onChange={(e) => setApyOverride(e.target.value.replace(/[^\d.]/g, ""))} className="num w-full bg-transparent py-2.5 text-[16px] outline-none" aria-label="Gross APY percent" />
            <span className="text-[var(--muted)]">%</span>
            {apyOverride != null && live != null && (
              <button type="button" onClick={() => setApyOverride(null)} className="ml-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--accent)]">
                Use live
              </button>
            )}
          </div>
        </Field>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--line)] p-4">
          <span>
            <span className="block text-[14.5px] font-medium">Add protection</span>
            <span className="text-[13px] text-[var(--muted)]">Users hold the senior tranche; {PROTECTION_COST * 100}% of gross yield pays for the buffer (illustrative).</span>
          </span>
          <input type="checkbox" checked={protectedOn} onChange={(e) => setProtectedOn(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
        </label>
      </div>

      <div data-companion="calc-result" className="card h-fit p-6 lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-medium text-[var(--muted)]">You could earn</p>
          <Segmented
            label="period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "year", label: "Yearly" },
              { value: "month", label: "Monthly" },
            ]}
          />
        </div>
        <p className="num mt-3 text-[44px] font-medium leading-none">{yours == null ? "—" : usd(yours, 0)}</p>
        <dl className="mt-6 space-y-3 border-t border-[var(--line)] pt-5 text-[14px]">
          <Row k="Your users earn (yearly)" v={r ? usd(r.usersYearly, 0) : "—"} />
          <Row k="Users' net APY" v={r ? `${r.userApyPercent.toFixed(2)}%` : "—"} />
          <Row k="APY after cover" v={r ? `${r.netApyPercent.toFixed(2)}%` : "—"} />
        </dl>
        <p className="mt-5 text-[11.5px] leading-relaxed text-[var(--muted)]">deposits × APY (less cover) × your fee. Constant balance and rate for a year. An estimate, not a forecast.</p>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint: string; error?: string | null | false | ""; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] p-4">
      <p className="text-[14.5px] font-medium">{label}</p>
      <p className="mb-3 text-[13px] text-[var(--muted)]">{hint}</p>
      {children}
      {error && <p className="mt-2 text-[12.5px] text-[var(--bad)]">{error}</p>}
    </div>
  );
}

function Chips({ options, value, onPick, format }: { options: { label: string; value: string }[]; value: string; onPick: (v: string) => void; format: (v: string) => string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onPick(o.value)} className={`rounded-full px-3 py-1 text-[12.5px] transition ${value === o.value ? "bg-[var(--ink)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]"}`}>
          {o.label} · {format(o.value)}
        </button>
      ))}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="num font-medium">{v}</dd>
    </div>
  );
}

// ───────── API explorer (home, build) ─────────

export function ApiExplorer() {
  const all = ENDPOINT_GROUPS.flatMap((g) => g.endpoints);
  const [sel, setSel] = useState<Endpoint>(all[0]!);
  const [result, setResult] = useState<{ state: "idle" } | { state: "loading" } | { state: "done"; text: string; ms: number } | { state: "error"; text: string }>({ state: "idle" });

  async function run(ep: Endpoint) {
    if (!ep.tool) return;
    setResult({ state: "loading" });
    try {
      const args = ep.tool === "reflect_get_protocol_events" ? { limit: 3 } : {};
      const res = await fetch("/api/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool: ep.tool, args }) });
      const body = await res.json();
      if (!res.ok || body.ok === false) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      const { ms, sources: _s, provenance: _p, ...rest } = body;
      setResult({ state: "done", text: JSON.stringify(rest, null, 2).slice(0, 1800), ms });
    } catch (e) {
      setResult({ state: "error", text: (e as Error).message });
    }
  }

  return (
    <div className="grid overflow-hidden rounded-[22px] border border-[var(--line)] md:grid-cols-[300px_1fr]" data-companion="build-endpoints">
      <div className="border-b border-[var(--line)] p-3 md:border-b-0 md:border-r">
        {ENDPOINT_GROUPS.map((g) => (
          <div key={g.label} className="mb-3">
            <p className="px-2 py-1 text-[12px] font-medium uppercase tracking-wide text-[var(--muted)]">{g.label}</p>
            {g.endpoints.map((ep) => (
              <button
                key={ep.method + ep.path}
                type="button"
                onClick={() => {
                  setSel(ep);
                  setResult({ state: "idle" });
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-[12.5px] transition ${sel === ep ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--surface-2)]"}`}
              >
                <span className={ep.method === "GET" ? "text-sky-600" : "text-amber-600"}>[{ep.method}]</span>
                <span className="truncate">{ep.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="min-w-0 bg-[#0b0e12] p-5 text-[12.5px] text-white/85">
        <pre className="overflow-x-auto font-mono leading-relaxed">
          <span className="text-white/45"># {sel.label}</span>
          {"\n"}curl {sel.method === "POST" ? "-X POST " : ""}https://prod.api.reflect.money{sel.path}
        </pre>
        <div className="mt-4 flex items-center gap-3">
          {sel.tool ? (
            <button type="button" onClick={() => run(sel)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-[#0b0e12]">
              <Play size={12} /> Run live
            </button>
          ) : (
            <span className="text-white/50">Live preview not available for this endpoint in the demo.</span>
          )}
          {result.state === "done" && <span className="text-white/50">via MCP · {result.ms} ms</span>}
        </div>
        {result.state !== "idle" && (
          <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-white/5 p-4 font-mono text-[12px] leading-relaxed">
            {result.state === "loading" ? "Loading…" : result.text}
          </pre>
        )}
      </div>
    </div>
  );
}

// ───────── Asset browser (assets) ─────────

type Filter = "all" | AssetFamily;

export function AssetBrowser() {
  const overview = useLiveOverview();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const list = ASSETS.filter((a) => (filter === "all" || a.family === filter) && `${a.name} ${a.underlying} ${a.underlyingIssuer}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div data-companion="assets-list">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="family"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "earn", label: "Earn" },
            { value: "protected", label: "Protected" },
            { value: "amplified", label: "Amplified" },
          ]}
        />
        <label className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-3.5 py-2 text-[14px]">
          <Search size={15} className="text-[var(--muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assets" className="w-44 bg-transparent outline-none" aria-label="Search assets" />
        </label>
      </div>
      {list.length === 0 ? (
        <p className="rounded-2xl bg-[var(--bg)] p-8 text-center text-[var(--muted)]">No assets match that search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const apy = a.liveSymbol && overview.state === "ok" ? overview.coins.find((c) => c.symbol === a.liveSymbol)?.apy?.percent : undefined;
            return (
              <Link key={a.slug} href={`/assets/${a.slug}`} className="group flex flex-col rounded-[22px] border border-[var(--line)] p-5 transition hover:border-[var(--accent)]/40 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${a.family === "earn" ? "bg-emerald-50 text-emerald-700" : a.family === "protected" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-amber-50 text-amber-800"}`}>{FAMILY_LABEL[a.family]}</span>
                  <ArrowUpRight size={16} className="text-[var(--muted)] transition group-hover:text-[var(--text)]" />
                </div>
                <p className="mt-6 text-[19px] font-medium">{a.name}</p>
                <p className="mt-1 flex-1 text-[13.5px] leading-relaxed text-[var(--muted)]">{a.tagline}</p>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[12.5px] text-[var(--muted)]">
                  <span>{a.underlyingIssuer}</span>
                  {a.liveSymbol ? <span className="num font-medium text-[var(--good)]">{apy == null ? "… APY" : `${apy.toFixed(2)}% APY`}</span> : <span>APY in official app</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
