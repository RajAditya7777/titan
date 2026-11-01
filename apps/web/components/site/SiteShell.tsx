import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { FOOTER_COLUMNS } from "@/lib/site/content";
import { SiteHeader } from "./SiteHeader";
import { Wordmark } from "./blocks";

/**
 * Marketing chrome, modelled on reflect.money's layout: mega-menu header, wide sections, a
 * multi-column footer. Original markup, wordmark and copy; the demo notice is always visible.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    // Bottom padding keeps the footer clear of the companion's guidance bar and pet.
    <footer className="border-t border-[var(--line)] bg-[var(--bg)] pb-36">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-10">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
            An independent demo of Reflect&apos;s products with a voice-guided companion. Not affiliated with Reflect Money. Live figures come from Reflect&apos;s public API.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.label}>
            <p className="mb-3 text-[13px] font-medium text-[var(--text)]">{col.label}</p>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--text)]">
                      {l.label} <ArrowUpRight size={12} />
                    </a>
                  ) : (
                    <Link href={l.href} className="hover:text-[var(--text)]">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 pt-6 text-[12.5px] text-[var(--muted)] md:px-10">
        <span>Independent proof of concept. Nothing here is financial advice.</span>
        <Link href="/privacy" className="hover:text-[var(--text)]">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
