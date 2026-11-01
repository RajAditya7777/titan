import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { OFFICIAL } from "@/lib/site/content";

/**
 * Layout building blocks for the marketing pages. Server-safe (no hooks, no server-only
 * imports), so client components such as the header can use them too.
 */

/** Same original mark as the app's wordmark, labelled for the site. */
export function Wordmark({ light = false }: { light?: boolean }) {
  const ink = light ? "#ffffff" : "var(--ink)";
  return (
    <span className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.04em]" style={{ color: ink }}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="3" width="7" height="18" rx="2" fill={ink} />
        <rect x="14" y="3" width="7" height="18" rx="2" fill="var(--accent-2)" />
      </svg>
      companion
    </span>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-4 md:px-10 ${className}`}>{children}</div>;
}

export function CtaButton({ href, children, variant = "accent", ...rest }: { href: string; children: ReactNode; variant?: "accent" | "ink" | "light" | "outline" } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls = {
    accent: "bg-[var(--accent)] text-white hover:brightness-110",
    ink: "bg-[var(--ink)] text-white hover:bg-black",
    light: "bg-white text-[var(--ink)] hover:bg-white/90",
    outline: "border border-[var(--line-strong)] bg-white text-[var(--text)] hover:bg-[var(--surface-2)]",
  }[variant];
  const external = href.startsWith("http");
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-medium transition active:scale-[0.98] ${cls}`}
      {...rest}
    >
      {children}
      <ArrowUpRight size={15} />
    </Link>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group flex items-center justify-between border-t border-[var(--line)] pt-4 text-[14.5px] font-medium text-[var(--text)]"
    >
      {children}
      <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Dark, full-bleed hero used on the home page. */
export function DarkHero({ title, accent, subtitle, actions }: { title: string; accent: string; subtitle: ReactNode; actions: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-[#0b0e12] pb-28 pt-44 text-white md:pb-40 md:pt-56">
      {/* Original backdrop: two soft blue glows and a fine grid. */}
      <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(60% 50% at 70% 0%, rgba(59,139,234,0.35), transparent 70%), radial-gradient(40% 40% at 10% 90%, rgba(0,88,178,0.35), transparent 70%)" }} />
      <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <Container className="relative text-center">
        <h1 className="mx-auto max-w-4xl text-[44px] font-medium leading-[1.02] md:text-[76px]">
          {title} <span className="text-[var(--accent-2)]">{accent}</span>
        </h1>
        <div className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-white/70">{subtitle}</div>
        <div className="mt-9 flex flex-wrap justify-center gap-3">{actions}</div>
      </Container>
    </section>
  );
}

/** Light hero for product and index pages. */
export function PageHero({ eyebrow, title, subtitle, actions, aside }: { eyebrow: string; title: ReactNode; subtitle: ReactNode; actions?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="pb-12 pt-32 md:pb-16 md:pt-40">
      <Container className={aside ? "grid items-center gap-12 lg:grid-cols-2" : ""}>
        <div>
          <p className="mb-4 text-[13.5px] font-medium text-[var(--accent)]">{eyebrow}</p>
          <h1 className="max-w-3xl text-[40px] font-medium leading-[1.05] md:text-[60px]">{title}</h1>
          <div className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-[var(--muted)]">{subtitle}</div>
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {aside}
      </Container>
    </section>
  );
}

export function SectionHeading({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <h2 className="max-w-2xl text-[32px] font-medium leading-[1.08] md:text-[46px]">{title}</h2>
      {aside && <div className="max-w-sm text-[15px] leading-relaxed text-[var(--muted)]">{aside}</div>}
    </div>
  );
}

/** Large grey panel: an interactive widget on one side, the pitch on the other. */
export function SplitPanel({ widget, title, text, link, reverse = false, ...rest }: { widget: ReactNode; title: ReactNode; text: ReactNode; link?: { href: string; label: string }; reverse?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="grid items-center gap-8 rounded-[28px] bg-[var(--bg)] p-4 md:grid-cols-2 md:gap-14 md:p-8" {...rest}>
      <div className={reverse ? "md:order-2" : ""}>{widget}</div>
      <div className="px-2 pb-4 md:px-0 md:pb-0">
        <h3 className="text-[28px] font-medium leading-[1.1] md:text-[36px]">{title}</h3>
        <div className="mt-4 max-w-md text-[15.5px] leading-relaxed text-[var(--muted)]">{text}</div>
        {link && (
          <div className="mt-8 max-w-md">
            <ArrowLink href={link.href}>{link.label}</ArrowLink>
          </div>
        )}
      </div>
    </div>
  );
}

export function FeatureGrid({ items }: { items: { icon: ReactNode; title: string; text: string }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((it) => (
        <div key={it.title} className="rounded-[22px] border border-[var(--line)] p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">{it.icon}</span>
          <p className="mt-5 text-[17px] font-medium">{it.title}</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--muted)]">{it.text}</p>
        </div>
      ))}
    </div>
  );
}

export function Steps({ items }: { items: { title: string; text: string; href?: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map((it, i) => (
        <li key={it.title} className="flex flex-col rounded-[22px] bg-[var(--bg)] p-6">
          <span className="num text-[13px] text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
          <p className="mt-6 text-[19px] font-medium">{it.title}</p>
          <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[var(--muted)]">{it.text}</p>
          {it.href && (
            <Link href={it.href} className="mt-5 inline-flex items-center gap-1 text-[14px] font-medium text-[var(--accent)]">
              Learn more <ArrowUpRight size={14} />
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Closing call to action shared by every product page. */
export function CtaBand() {
  return (
    <section className="py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[32px] bg-[#0b0e12] px-6 py-16 text-center text-white md:py-24">
          <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(50% 60% at 50% 120%, rgba(59,139,234,0.45), transparent 70%)" }} />
          <h2 className="relative mx-auto max-w-2xl text-[36px] font-medium leading-[1.05] md:text-[56px]">Let your dollars do a little more.</h2>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <CtaButton href="/earn" variant="light">
              See how Earn works
            </CtaButton>
            <CtaButton href="/build" variant="accent">
              Read the API
            </CtaButton>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Plain-language risk note above the footer. Wording varies per page. */
export function RiskStrip({ children }: { children: ReactNode }) {
  return (
    <Container className="pb-10">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] leading-relaxed text-amber-900">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <p>
          {children}{" "}
          <a href={OFFICIAL.risk} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
            Reflect&apos;s risk disclosure
          </a>
          .
        </p>
      </div>
    </Container>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "good" | "warn" }) {
  const cls = {
    neutral: "bg-[var(--surface-2)] text-[var(--muted)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-800",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${cls}`}>{children}</span>;
}
