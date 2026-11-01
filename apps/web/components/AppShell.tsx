"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { pageForPath, type ElementId } from "@/lib/companion/registry";

/**
 * Top-bar layout modelled on the public Reflect app: wordmark left, text tabs with a small active
 * dot, pill actions right, a thin announcement strip above. Original markup and assets.
 */
const NAV: { href: string; label: string; id: ElementId; page: string }[] = [
  { href: "/dashboard", label: "Dashboard", id: "nav-dashboard", page: "dashboard" },
  { href: "/stablecoins/usdc-plus", label: "Stablecoins", id: "nav-stablecoin", page: "stablecoin" },
  { href: "/usdt", label: "USDT+", id: "nav-usdt", page: "usdt" },
  { href: "/mint", label: "Mint", id: "nav-mint", page: "mint" },
  { href: "/redeem", label: "Redeem", id: "nav-redeem", page: "redeem" },
  { href: "/whitelabel", label: "Whitelabel", id: "nav-whitelabel", page: "whitelabel" },
  { href: "/portfolio", label: "Portfolio", id: "nav-portfolio", page: "portfolio" },
  { href: "/stats", label: "Stats", id: "nav-stats", page: "stats" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const active = pageForPath(usePathname());
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-[var(--accent)] px-4 py-2 text-center text-[13px] text-white/90">
        Independent proof of concept with an AI companion. Live data from Reflect&apos;s public API. Not affiliated with Reflect Money.
      </div>

      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1360px] items-center gap-6 px-4 md:px-10">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="Dashboard">
            <Wordmark />
          </Link>
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:pl-8">
            {NAV.map(({ href, label, id, page }) => {
              const on = active === page;
              return (
                <Link
                  key={href}
                  href={href}
                  data-companion={id}
                  className={`relative whitespace-nowrap px-3 py-2.5 text-[15px] transition-colors ${on ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
                >
                  {label}
                  {on && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          <span className="hidden rounded-full border border-[var(--line-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--muted)] lg:inline">Demo · no wallet</span>
          <button
            type="button"
            disabled
            title="Wallet connection is out of scope for this proof of concept"
            className="shrink-0 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-white opacity-90"
          >
            Login
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-44 pt-10 md:px-8">{children}</main>
    </div>
  );
}

/** Original wordmark (not Reflect's logo): mirrored-bar mark, the name, and a "demo" tag so it never reads as the real app. */
function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.04em] text-[var(--ink)]">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="3" width="7" height="18" rx="2" fill="var(--ink)" />
        <rect x="14" y="3" width="7" height="18" rx="2" fill="var(--accent)" opacity="0.85" />
      </svg>
      reflect
      <span className="rounded-full border border-current px-1.5 py-px text-[10px] font-medium tracking-normal opacity-50">demo</span>
    </span>
  );
}
