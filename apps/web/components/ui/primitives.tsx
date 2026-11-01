import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { CountUp, DrawPath } from "./motion";

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-[13px] font-medium text-[var(--accent)]">{eyebrow}</p>}
        <h1 className="text-[32px] font-medium leading-tight md:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">{subtitle}</p>}
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
  return <p className="text-[13px] font-medium text-[var(--muted)]">{children}</p>;
}

/** Marks where a number comes from. Users and reviewers should never have to guess. */
export function SourceBadge({ kind }: { kind: "live" | "demo" | "derived" }) {
  const styles = {
    live: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    demo: "bg-amber-50 text-amber-700 ring-amber-600/20",
    derived: "bg-sky-50 text-sky-700 ring-sky-600/15",
  }[kind];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ring-1 ${styles}`}>
      {kind === "live" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      {kind === "live" ? "Live" : kind === "demo" ? "Demo data" : "Derived"}
    </span>
  );
}

export function ErrorNote({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-600" />
      <div>
        <p className="font-medium text-rose-800">{title}</p>
        {message && <p className="mt-0.5 text-rose-700/80">{message}</p>}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className}`} />;
}

export function ButtonLink({ href, children, variant = "primary", ...rest }: { href: string; children: ReactNode; variant?: "primary" | "ghost" } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls =
    variant === "primary"
      ? "bg-[var(--ink)] text-white hover:bg-black active:scale-[0.98]"
      : "border border-[var(--line-strong)] bg-white text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-[0.98]";
  return (
    // next/link keeps navigation client-side, so the companion (in the root layout) persists.
    <Link href={href} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition ${cls}`} {...rest}>
      {children}
    </Link>
  );
}

/** Animated number for headline figures. */
export function Figure({ value, decimals = 2, prefix = "", suffix = "", className = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  return <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} className={`num ${className}`} />;
}

/** Lightweight SVG area chart; the line draws itself in on mount. */
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
            <stop offset="0" stopColor="#0058b2" stopOpacity="0.18" />
            <stop offset="1" stopColor="#0058b2" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${w} ${height} L0 ${height} Z`} fill="url(#area)" />
        <DrawPath d={line} stroke="#0058b2" />
        <circle cx={x(points.length - 1)} cy={y(last.value)} r="4" fill="#0058b2" />
      </svg>
      <div className="mt-2 flex justify-between text-[11.5px] text-[var(--muted)]">
        <span>{points[0]!.label}</span>
        <span>
          min <span className="num text-[var(--text)]">{format(min)}</span> · max <span className="num text-[var(--text)]">{format(max)}</span>
        </span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

export function TokenIcon({ symbol, size = 40 }: { symbol: string; size?: number }) {
  const tether = symbol.startsWith("USDT");
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${tether ? "bg-[#26a17b]" : "bg-[#2775ca]"}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {tether ? "T+" : "C+"}
    </span>
  );
}

export const usd = (n: number, dp = 2) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: dp, maximumFractionDigits: dp });
export const num = (n: number, dp = 2) => n.toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: Math.min(dp, 2) });
export const compact = (n: number) => n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
