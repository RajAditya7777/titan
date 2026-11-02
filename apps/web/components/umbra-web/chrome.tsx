"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DotArt, paintText } from "./DotArt";

/** Umbra's shield-shaped "U" mark next to the lowercase wordmark (drawn here, not copied). */
export function UmbraLogo({ className = "", light = false }: { className?: string; light?: boolean }) {
  const ink = light ? "#fff" : "#171717";
  return (
    <span className={`inline-flex items-center gap-[7px] ${className}`}>
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden>
        <path d="M2.2 1.6v9.2c0 5 3.3 8.6 7.8 8.6s7.8-3.6 7.8-8.6V1.6" stroke={ink} strokeWidth="3" strokeLinecap="square" />
      </svg>
      <span className="text-[21px] font-medium leading-none tracking-[-0.04em]" style={{ color: ink }}>
        umbra
      </span>
    </span>
  );
}

const MENUS: { label: string; items: { title: string; sub: string; href: string }[] }[] = [
  {
    label: "Product",
    items: [
      { title: "Umbra App", sub: "Deposit, send and swap privately", href: "/umbra/app" },
      { title: "Nimbus", sub: "Explore the Nimbus docs", href: "https://docs.nimbusprivacy.xyz/" },
    ],
  },
  {
    label: "Developers",
    items: [
      { title: "Umbra Docs", sub: "Guides to using Umbra", href: "https://docs.umbraprivacy.com/" },
      { title: "Nimbus SDK", sub: "Guides to building with Nimbus", href: "https://docs.nimbusprivacy.xyz/" },
    ],
  },
  {
    label: "Resources",
    items: [
      { title: "Token List", sub: "Browse tokens and assets", href: "#features" },
      { title: "FAQs", sub: "Quick answers about privacy", href: "/umbra#umbra-guide" },
      { title: "Governance", sub: "Umbra on MetaDAO", href: "https://metadao.fi/companies/umbra" },
      { title: "Stats", sub: "Live Umbra protocol stats", href: "https://stats.umbraprivacy.com/" },
    ],
  },
];

export function DemoBanner() {
  return (
    <div className="relative z-50 bg-[#0100ff] px-4 py-1.5 text-center text-[11.5px] text-white/90">
      Independent proof of concept with an AI companion. Simulated wallet and balances. Not affiliated with Umbra.
    </div>
  );
}

export function UmbraNav() {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md">
      <div className="mx-auto grid h-[52px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5">
        <Link href="/umbra" aria-label="Umbra home">
          <UmbraLogo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {MENUS.map((m) => (
            <div key={m.label} className="group relative">
              <button type="button" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13.5px] text-[#75757f] transition hover:text-[#171717]">
                {m.label} <ChevronDown size={13} className="transition group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-1/2 top-full w-[290px] -translate-x-1/2 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                <div className="rounded-2xl border border-black/[0.06] bg-white p-2 shadow-[0_18px_50px_-20px_rgba(16,16,107,0.35)]">
                  {m.items.map((it) => (
                    <a
                      key={it.title}
                      href={it.href}
                      target={it.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="block rounded-xl px-3 py-2.5 transition hover:bg-[#f4f4f6]"
                    >
                      <span className="block text-[14px] text-[#171717]">{it.title}</span>
                      <span className="block text-[12.5px] text-[#8a8a93]">{it.sub}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>
        <div className="flex justify-end">
          <Link
            href="/umbra/app"
            data-companion="umb-nav-get-started"
            className="flex items-center gap-1 rounded-full bg-[#0100ff] px-[14px] py-[7px] text-[14px] leading-[18px] text-white transition hover:bg-[#2020ff]"
          >
            Get Started <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

const FOOTER: { title: string; links: [string, string][] }[] = [
  { title: "Product", links: [["Web App", "/umbra/app"], ["Nimbus", "https://docs.nimbusprivacy.xyz/"]] },
  { title: "Developers", links: [["Umbra Docs", "https://docs.umbraprivacy.com/"], ["Nimbus SDK", "https://docs.nimbusprivacy.xyz/"]] },
  { title: "Resources", links: [["Token List", "#features"], ["FAQs", "#umbra-guide"], ["Governance", "https://metadao.fi/companies/umbra"], ["Stats", "https://stats.umbraprivacy.com/"]] },
];

export function UmbraFooter() {
  return (
    <footer className="relative overflow-hidden bg-white">
      <div className="relative z-10 mx-auto grid max-w-[1440px] gap-10 px-6 pb-10 pt-20 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <UmbraLogo />
          <p className="mt-3 text-[13.5px] text-[#9a9aa3]">The Privacy Layer for Your Money</p>
        </div>
        {FOOTER.map((col) => (
          <div key={col.title}>
            <p className="text-[13.5px] text-[#9a9aa3]">{col.title}</p>
            <ul className="mt-3 space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-[14px] text-[#171717] hover:text-[#0100ff]">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <DotArt paint={paintText("umbra", 500, 0.95)} cell={6} className="pointer-events-none relative -mt-6 block h-[180px] w-full opacity-70 md:h-[300px]" density={0.75} />
      <div className="absolute bottom-4 left-6 z-10 flex gap-6 text-[11.5px] text-[#a6a6ae]">
        <span>Terms</span>
        <span>Privacy</span>
        <span>Operating Agreement</span>
      </div>
    </footer>
  );
}

export function UmbraShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/umbra/console")) return <>{children}</>;
  return (
    <div className="umbra-site min-h-screen">
      <DemoBanner />
      <UmbraNav />
      <main>{children}</main>
    </div>
  );
}
