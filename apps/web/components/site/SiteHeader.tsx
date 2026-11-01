"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { NAV_GROUPS, type NavLink } from "@/lib/site/content";
import { Wordmark } from "./blocks";
import { useLiveApy } from "./useLive";

/**
 * Over the home page's dark hero the header is transparent with light text; once the page
 * scrolls (or on any other page) it becomes the light, blurred bar.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const apy = useLiveApy("USDC+");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation, outside click and Escape.
  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(null), setMobile(false));
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const dark = pathname === "/" && !scrolled && !open && !mobile;

  return (
    <header
      ref={ref}
      className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${dark ? "bg-transparent text-white" : "border-b border-[var(--line)] bg-white/85 text-[var(--text)] backdrop-blur-xl"}`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-6 px-4 md:px-10">
        <Link href="/" aria-label="Home" className="shrink-0">
          <Wordmark light={dark} />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)} onMouseLeave={() => setOpen(null)}>
              <button
                type="button"
                aria-expanded={open === g.label}
                onClick={() => setOpen(open === g.label ? null : g.label)}
                className={`flex items-center gap-1 rounded-full px-3 py-2 text-[14px] transition-colors ${dark ? "text-white/80 hover:text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
              >
                {g.label}
                <ChevronDown size={14} className={`transition-transform ${open === g.label ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === g.label && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 top-full w-[320px] pt-2"
                  >
                    <div className="card p-2 text-[var(--text)]">
                      {g.links.map((l) => (
                        <MenuLink key={l.href} link={l} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/earn"
            className={`hidden items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium sm:flex ${dark ? "border-white/25 text-white" : "border-[var(--line-strong)] text-[var(--text)]"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {apy == null ? "Earn on USDC" : <span className="num">Earn {apy.toFixed(2)}% APY</span>}
          </Link>
          <Link
            href="/dashboard"
            data-companion="site-launch-app"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-[13.5px] font-medium text-white transition hover:brightness-110"
          >
            Open app <ArrowUpRight size={15} />
          </Link>
          <button type="button" className="rounded-full p-2 md:hidden" aria-label={mobile ? "Close menu" : "Open menu"} aria-expanded={mobile} onClick={() => setMobile(!mobile)}>
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--line)] bg-white md:hidden"
          >
            <div className="max-h-[75vh] overflow-y-auto px-4 py-4">
              {NAV_GROUPS.map((g) => (
                <div key={g.label} className="mb-4">
                  <p className="mb-1 px-2 text-[12px] font-medium uppercase tracking-wide text-[var(--muted)]">{g.label}</p>
                  {g.links.map((l) => (
                    <MenuLink key={l.href} link={l} />
                  ))}
                </div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuLink({ link }: { link: NavLink }) {
  const body = (
    <>
      <span className="flex items-center gap-1 text-[14.5px] font-medium">
        {link.label}
        {link.external && <ArrowUpRight size={13} className="text-[var(--muted)]" />}
      </span>
      {link.blurb && <span className="text-[13px] text-[var(--muted)]">{link.blurb}</span>}
    </>
  );
  const cls = "flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]";
  return link.external ? (
    <a href={link.href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={link.href} className={cls}>
      {body}
    </Link>
  );
}
