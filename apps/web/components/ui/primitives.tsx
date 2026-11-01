import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Radio } from "lucide-react";

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent-2)]">{eyebrow}</p>}
        <h1 className="text-3xl font-medium md:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card p-5 md:p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] font-medium text-[var(--muted)]">{children}</p>;
}

/** Marks where a number comes from. Users and reviewers should never have to guess. */
export function SourceBadge({ kind }: { kind: "live" | "demo" | "derived" }) {
  const styles = {
    live: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300",
    demo: "border-amber-300/25 bg-amber-300/[0.07] text-amber-200",
    derived: "border-sky-300/25 bg-sky-300/[0.07] text-sky-200",
  }[kind];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
      {kind === "live" && <Radio size={10} />}
      {kind === "live" ? "Live" : kind === "demo" ? "Demo data" : "Derived"}
    </span>
  );
}

export function ErrorNote({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-300" />
      <div>
        <p className="font-medium text-rose-200">{title}</p>
        {message && <p className="mt-0.5 text-rose-200/70">{message}</p>}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export function ButtonLink({ href, children, variant = "primary", ...rest }: { href: string; children: ReactNode; variant?: "primary" | "ghost" } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls =
    variant === "primary"
      ? "bg-[var(--accent)] text-white shadow-[0_8px_30px_-8px_rgba(0,88,178,0.8)] hover:brightness-110"
      : "border border-[var(--line)] bg-white/[0.03] text-white hover:bg-white/[0.07]";
  return (
    // next/link keeps navigation client-side, so the companion (in the root layout) persists.
    <Link href={href} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${cls}`} {...rest}>
      {children}
    </Link>
  );
}

/** Lightweight SVG area chart: no chart library needed for a sparkline-grade visual. */
export function AreaChart({ points, height = 140, format }: { points: { label: string; value: number }[]; height?: number; format: (v: number) => string }) {
  if (points.length < 2) return <p className="text-sm text-[var(--muted)]">Not enough data yet.</p>;
  const w = 600;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.15 || Math.abs(max) * 0.01 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const x = (i: number) => (i / (points.length - 1)) * w;
  const y = (v: number) => height - ((v - lo) / (hi - lo)) * height;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1]!;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" preserveAspectRatio="none" role="img" aria-label={`Chart, latest ${format(last.value)}`}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0058b2" stopOpacity="0.4" />
            <stop offset="1" stopColor="#6d5bff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${w} ${height} L0 ${height} Z`} fill="url(#area)" />
        <path d={line} fill="none" stroke="#6aa8f0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <circle cx={x(points.length - 1)} cy={y(last.value)} r="4" fill="#b9d3f0" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-[var(--muted)]">
        <span>{points[0]!.label}</span>
        <span>
          min <span className="num text-white/80">{format(min)}</span> · max <span className="num text-white/80">{format(max)}</span>
        </span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

export const usd = (n: number, dp = 2) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: dp, maximumFractionDigits: dp });
export const num = (n: number, dp = 2) => n.toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: Math.min(dp, 2) });
export const compact = (n: number) => n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });

export function TokenIcon({ symbol }: { symbol: string }) {
  const tether = symbol.startsWith("USDT");
  return (
    <span className={`grid h-10 w-10 place-items-center rounded-full text-[11px] font-bold ${tether ? "bg-emerald-500/20 text-emerald-200" : "bg-sky-500/20 text-sky-200"}`}>
      {tether ? "T+" : "C+"}
    </span>
  );
}
