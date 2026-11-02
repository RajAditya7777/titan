"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, ExternalLink, Menu, Search, X } from "lucide-react";
import { NAV, SPACES, ancestorsOf, docHref, neighbours, originalHref, searchDocs, type NavItem, type SpaceId } from "@/lib/products/titan/devdocs";
import { contentFor } from "@/lib/products/titan/docs/content";
import { toMarkdown } from "@/lib/products/titan/docs/schema";

export interface TocItem {
  id: string;
  title: string;
  depth: 2 | 3;
}

/**
 * GitBook-style docs chrome, measured from titan-exchange.gitbook.io at 1440px: 64px top bar,
 * 288px sidebar at x=32, 768px article at x=368, "On this page" on the right. Inter / IBM Plex
 * Mono on #1d1d1d with warm off-white text and Titan-gold accents.
 */
export function DocsShell({ space, slug, group, title, toc, markdown, children }: { space: SpaceId; slug: string; group: string | null; title: string; toc: TocItem[]; markdown: string; children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const { prev, next } = neighbours(space, slug);
  return (
    <div className="min-h-screen bg-[#1d1d1d] font-[family-name:var(--font-docs)] text-[#fffff9]">
      <TopBar space={space} onMenu={() => setNavOpen((o) => !o)} />
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-4 lg:grid-cols-[288px_minmax(0,768px)_1fr] lg:px-8">
        <Sidebar space={space} slug={slug} open={navOpen} onNavigate={() => setNavOpen(false)} />
        <main className="min-w-0 pb-24 pt-[22px]" data-companion="titan-docs-reading-pane">
          <div className="flex items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-[#f2d364]">
              <Link href={docHref(space, "")} className="hover:underline">
                {SPACES[space].title}
              </Link>
              {group && (
                <>
                  <span className="text-[#8b8575]">›</span>
                  <span>{group}</span>
                </>
              )}
            </nav>
            <CopyPage markdown={markdown} href={originalHref(space, slug)} />
          </div>
          <article className="mt-3">{children}</article>

          <div className="mt-14 grid gap-3 sm:grid-cols-2">
            {prev ? <PageLink dir="prev" href={docHref(space, prev.slug)} title={prev.title} /> : <span />}
            {next && <PageLink dir="next" href={docHref(space, next.slug)} title={next.title} />}
          </div>
          <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8b8575]">
            <span>Last updated 1 month ago</span>
            <a href={originalHref(space, slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#f2d364]">
              Read the original on Titan&apos;s docs <ExternalLink className="h-3 w-3" />
            </a>
            <span>Independent demo, summarized in our own words. Not affiliated with Titan.</span>
          </p>
        </main>
        <OnThisPage toc={toc} title={title} />
      </div>
    </div>
  );
}

function TopBar({ space, onMenu }: { space: SpaceId; onMenu: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // Titles first, then page text, across both spaces.
  const results = searchDocs(q, (p) => {
    const c = contentFor(p.space, p.slug);
    return c ? toMarkdown(p.title, c) : "";
  });

  // ⌘K / Ctrl+K focuses search, as on GitBook.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (s: SpaceId, slug: string) => {
    setQ("");
    input.current?.blur();
    router.push(docHref(s, slug));
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#3d392e]/60 bg-[#1d1d1d]/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-3 px-4 lg:px-8">
        <button type="button" onClick={onMenu} aria-label="Open table of contents" className="rounded-md p-1.5 text-[#c7c0a9] hover:bg-white/5 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <Link href={docHref(space, "")} aria-label={`${SPACES[space].title} home`} className="grid h-8 w-8 place-items-center rounded-full border border-[#f2d364]/60 text-sm font-bold text-[#f2d364]">
          T
        </Link>
        <div className="relative ml-auto w-full max-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8575]" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].space, results[0].slug);
              if (e.key === "Escape") setQ("");
            }}
            placeholder="Search…"
            aria-label="Search docs"
            className="h-9 w-full rounded-lg border border-[#3d392e] bg-[#232220] pl-9 pr-14 text-sm text-[#fffff9] placeholder:text-[#8b8575] focus:border-[#f2d364]/60 focus:outline-none"
          />
          {q ? (
            <button type="button" aria-label="Clear" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#8b8575] hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[#3d392e] px-1.5 text-[11px] text-[#8b8575]">⌘K</kbd>
          )}
          {focused && q && (
            <div role="listbox" className="absolute right-0 top-11 z-40 w-[320px] overflow-hidden rounded-xl border border-[#3d392e] bg-[#232220] py-1 shadow-2xl">
              {results.length ? (
                results.slice(0, 8).map((r) => (
                  <button key={`${r.space}/${r.slug}`} type="button" role="option" aria-selected={false} onMouseDown={() => go(r.space, r.slug)} className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5">
                    <span className="text-[#fffff9]">{r.title}</span>
                    <span className="ml-2 text-xs text-[#8b8575]">{[SPACES[r.space].title, r.group].filter(Boolean).join(" › ")}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-[#8b8575]">No results for &ldquo;{q}&rdquo;</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar({ space, slug, open, onNavigate }: { space: SpaceId; slug: string; open: boolean; onNavigate: () => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [switching, setSwitching] = useState(false);
  return (
    <aside
      className={`${open ? "block" : "hidden"} lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-64px)] lg:overflow-y-auto pb-4 pt-6 text-sm`}
      aria-label="Table of contents"
    >
      {/* Space switcher, as GitBook's top-of-sidebar dropdown */}
      <div className="relative mb-5">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={switching}
          onClick={() => setSwitching((o) => !o)}
          onBlur={() => setTimeout(() => setSwitching(false), 150)}
          className="flex w-full items-center justify-between rounded-lg border border-[#3d392e] px-3 py-2 text-[#fffff9] hover:bg-white/5"
        >
          {SPACES[space].title} <ChevronDown className={`h-4 w-4 text-[#8b8575] transition ${switching ? "rotate-180" : ""}`} />
        </button>
        {switching && (
          <div role="listbox" aria-label="Spaces" className="absolute inset-x-0 top-11 z-20 overflow-hidden rounded-lg border border-[#3d392e] bg-[#232220] py-1 shadow-2xl">
            {(Object.keys(SPACES) as SpaceId[]).map((s) => (
              <Link
                key={s}
                href={docHref(s, "")}
                role="option"
                aria-selected={s === space}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSwitching(false);
                  onNavigate();
                }}
                className={`block px-3 py-2 ${s === space ? "text-[#f2d364]" : "text-[#fffff9]/80 hover:bg-white/5"}`}
              >
                {SPACES[s].title}
              </Link>
            ))}
          </div>
        )}
      </div>
      {NAV[space].map((g) => {
        const key = g.label ?? "";
        const isCollapsed = !!collapsed[key];
        return (
          <div key={key || "home"} className="mb-4">
            {g.label && (
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
                aria-expanded={!isCollapsed}
                className="mb-1 flex w-full items-center justify-between px-3 text-left text-xs font-semibold uppercase tracking-wide text-[#fffff9]/60 hover:text-[#fffff9]"
              >
                {g.label}
                <ChevronDown className={`h-3.5 w-3.5 transition ${isCollapsed ? "-rotate-90" : ""}`} />
              </button>
            )}
            {!isCollapsed && <NavTree space={space} items={g.pages} current={slug} depth={0} onNavigate={onNavigate} />}
          </div>
        );
      })}
    </aside>
  );
}

/** Sidebar entries; parents expand/collapse like GitBook's nested pages, opened down to the current page. */
function NavTree({ space, items, current, depth, onNavigate }: { space: SpaceId; items: NavItem[]; current: string; depth: number; onNavigate: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const trail = ancestorsOf(space, current);
  return (
    <>
      {items.map((p) => {
        const active = p.slug === current;
        const isOpen = open[p.slug] ?? (trail.includes(p.slug) || active);
        return (
          <div key={p.slug || "home"}>
            <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
              <Link
                href={docHref(space, p.slug)}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`block flex-1 rounded-md px-3 py-1.5 leading-5 transition ${active ? "bg-[#f2d364]/10 font-medium text-[#f2d364]" : "text-[#fffff9]/65 hover:bg-white/5 hover:text-[#fffff9]"}`}
              >
                {p.title}
              </Link>
              {p.children && (
                <button
                  type="button"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${p.title}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => ({ ...o, [p.slug]: !isOpen }))}
                  className="rounded p-1 text-[#8b8575] hover:bg-white/5 hover:text-white"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "" : "-rotate-90"}`} />
                </button>
              )}
            </div>
            {p.children && isOpen && <NavTree space={space} items={p.children} current={current} depth={depth + 1} onNavigate={onNavigate} />}
          </div>
        );
      })}
    </>
  );
}

function OnThisPage({ toc, title }: { toc: TocItem[]; title: string }) {
  const [active, setActive] = useState(toc[0]?.id);
  // Scrollspy: the heading nearest the top of the viewport is the active entry.
  useEffect(() => {
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [toc]);
  if (!toc.length) return <div className="hidden lg:block" />;
  return (
    <nav aria-label={`On this page: ${title}`} className="hidden pt-8 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-64px)] lg:overflow-y-auto">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#f2d364]">On this page</p>
      <ul className="space-y-1 border-l border-[#3d392e] text-[13px]">
        {toc.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(t.id);
                // Offset for the sticky 64px top bar, so the heading isn't hidden under it.
                if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
                history.replaceState(null, "", `#${t.id}`);
                setActive(t.id);
              }}
              className={`-ml-px block border-l py-0.5 transition ${t.depth === 3 ? "pl-6" : "pl-3"} ${active === t.id ? "border-[#f2d364] text-[#f2d364]" : "border-transparent text-[#fffff9]/60 hover:text-[#fffff9]"}`}
            >
              {t.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CopyPage({ markdown, href }: { markdown: string; href: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-[#3d392e] text-sm">
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard?.writeText(markdown).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[#fffff9]/80 hover:bg-white/5"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-[#00d692]" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <a href={href} target="_blank" rel="noreferrer" aria-label="Open the original page" className="border-l border-[#3d392e] px-2 py-1 text-[#fffff9]/60 hover:bg-white/5 hover:text-white">
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function PageLink({ dir, href, title }: { dir: "prev" | "next"; href: string; title: string }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl border border-[#3d392e] px-4 py-3 transition hover:border-[#f2d364]/60 ${dir === "next" ? "justify-end text-right sm:col-start-2" : ""}`}
    >
      {dir === "prev" && <ArrowLeft className="h-4 w-4 text-[#8b8575] group-hover:text-[#f2d364]" />}
      <span>
        <span className="block text-xs text-[#8b8575]">{dir === "prev" ? "Previous" : "Next"}</span>
        <span className="text-sm font-medium text-[#fffff9] group-hover:text-[#f2d364]">{title}</span>
      </span>
      {dir === "next" && <ArrowRight className="h-4 w-4 text-[#8b8575] group-hover:text-[#f2d364]" />}
    </Link>
  );
}
