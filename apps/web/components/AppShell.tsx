"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, BarChart3, Coins, LayoutGrid, Sparkles, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { pageForPath, type ElementId } from "@/lib/companion/registry";

const NAV: { href: string; label: string; icon: typeof Coins; id: ElementId; page: string }[] = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, id: "nav-dashboard", page: "dashboard" },
  { href: "/stablecoins/usdc-plus", label: "Stablecoins", icon: Coins, id: "nav-stablecoin", page: "stablecoin" },
  { href: "/mint", label: "Mint", icon: ArrowDownToLine, id: "nav-mint", page: "mint" },
  { href: "/redeem", label: "Redeem", icon: ArrowUpFromLine, id: "nav-redeem", page: "redeem" },
  { href: "/whitelabel", label: "Whitelabel", icon: Sparkles, id: "nav-whitelabel", page: "whitelabel" },
  { href: "/portfolio", label: "Portfolio", icon: Wallet, id: "nav-portfolio", page: "portfolio" },
  { href: "/stats", label: "Statistics", icon: BarChart3, id: "nav-stats", page: "stats" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const active = pageForPath(usePathname());
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--line)] px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">reflect<span className="text-[var(--muted)]">/companion</span></span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, id, page }) => (
            <Link
              key={href}
              href={href}
              data-companion={id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active === page ? "bg-white/[0.07] font-medium text-white" : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-[var(--line)] p-3 text-[11px] leading-relaxed text-[var(--muted)]">
          Independent proof of concept. Not affiliated with or operated by Reflect Money. Live data via Reflect&apos;s public API.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <Logo />
          </div>
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.map(({ href, label, page }) => (
              <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs ${active === page ? "bg-white/10 text-white" : "text-[var(--muted)]"}`}>
                {label}
              </Link>
            ))}
          </nav>
          <span className="hidden rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1 text-[11px] font-medium text-amber-200/90 md:inline">
            Demo · no wallet connected
          </span>
          <span className="flex-1" />
          <button
            type="button"
            disabled
            title="Wallet connection is out of scope for this proof of concept"
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-medium text-[var(--muted)]"
          >
            Connect wallet
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-40 pt-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6aa8f0" />
          <stop offset="1" stopColor="#0058b2" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#lg)" />
      <path d="M10 21V11h7a4 4 0 0 1 0 8h-4m3 0 4 4" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
