"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Zap,
  Split,
  ShieldCheck,
  Code2,
  Terminal,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Compass,
  Layers,
} from "lucide-react";
import { TITAN_GITBOOK_DOCS, type DocSection } from "@/lib/products/titan/gitbook-content";
import { useCompanion } from "@/components/companion/CompanionProvider";

export function TitanDocsView() {
  const [activeDocId, setActiveDocId] = useState<string>("welcome");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Companion integration: users can trigger Milo to explain any topic!
  const { input, setPanelOpen } = useCompanion();

  const activeDoc: DocSection = TITAN_GITBOOK_DOCS[activeDocId] || TITAN_GITBOOK_DOCS["welcome"]!;

  const categories = ["Getting Started", "Codex of Knowledge", "Developers & API"] as const;

  const docList = Object.values(TITAN_GITBOOK_DOCS);

  const filteredDocs = docList.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAskMilo = (question: string) => {
    setPanelOpen(true);
    input(question);
  };

  // Find previous and next page
  const allKeys = Object.keys(TITAN_GITBOOK_DOCS);
  const currentIndex = allKeys.indexOf(activeDocId);
  const prevDocId = currentIndex > 0 ? allKeys[currentIndex - 1] : null;
  const nextDocId = currentIndex < allKeys.length - 1 ? allKeys[currentIndex + 1] : null;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)] text-white select-none">
      {/* ================= LEFT SIDEBAR (GITBOOK NAVIGATION) ================= */}
      <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-[#2b2927] bg-[#151513] p-4 flex flex-col space-y-4">
        {/* Docs Title & Version */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20201d]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#f2d363] flex items-center justify-center text-[#0d0d0c] font-bold text-xs">
              T
            </div>
            <span className="font-semibold text-sm text-white">Titan GitBook</span>
          </div>
          <span className="rounded bg-[#20201d] border border-[#2b2927] px-2 py-0.5 font-mono text-[10px] text-[#78766d]">
            v2.4.0
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#78766d]" />
          <input
            type="text"
            data-companion="titan-docs-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation..."
            className="w-full rounded-xl border border-[#2b2927] bg-[#20201d] pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#78766d] focus:border-[#f2d363] focus:outline-none"
          />
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 max-h-[640px]">
          {searchQuery ? (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#78766d] px-2">Search Results</span>
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setActiveDocId(doc.id);
                    setSearchQuery("");
                  }}
                  className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#c2c1bc] hover:bg-[#20201d] flex items-center justify-between cursor-pointer"
                >
                  <span>{doc.title}</span>
                  <ChevronRight className="h-3 w-3 text-[#78766d]" />
                </button>
              ))}
            </div>
          ) : (
            categories.map((cat) => {
              const catDocs = docList.filter((d) => d.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#78766d] px-2.5 py-1">
                    {cat}
                  </div>
                  {catDocs.map((doc) => {
                    const isActive = activeDocId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setActiveDocId(doc.id)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all text-left cursor-pointer ${
                          isActive
                            ? "bg-[#262113] text-[#f2d363] border border-[#f2d363]/30 font-medium"
                            : "text-[#a8a69f] hover:text-white hover:bg-[#20201d]"
                        }`}
                      >
                        <span className="truncate">{doc.title}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#f2d363]" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Official Links */}
        <div className="pt-3 border-t border-[#20201d] text-xs text-[#78766d] space-y-1">
          <a
            href="https://titan-exchange.gitbook.io/titan/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-2 py-1 hover:text-white transition-colors"
          >
            <span>Official GitBook</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://app.titan.exchange"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-2 py-1 hover:text-white transition-colors"
          >
            <span>Live DEX App</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </aside>

      {/* ================= CENTER READING PANE ================= */}
      <main
        data-companion="titan-docs-reading-pane"
        className="flex-1 rounded-2xl border border-[#2b2927] bg-[#151513] p-6 sm:p-8 flex flex-col space-y-8 overflow-hidden shadow-2xl"
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#78766d]">
          <span>Titan Docs</span>
          <ChevronRight className="h-3 w-3" />
          <span>{activeDoc.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#f2d363] font-medium">{activeDoc.title}</span>
        </div>

        {/* Page Title & Summary */}
        <div className="space-y-3 pb-6 border-b border-[#20201d]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {activeDoc.title}
          </h1>
          <p className="text-sm sm:text-base text-[#a8a69f] leading-relaxed">
            {activeDoc.summary}
          </p>
        </div>

        {/* ================= INTERACTIVE ASK MILO QUESTION CHIPS ================= */}
        <div
          data-companion="titan-docs-ask-milo"
          className="rounded-xl border border-[#f2d363]/30 bg-gradient-to-br from-[#262113] via-[#151513] to-[#151513] p-4 sm:p-5 space-y-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#f2d363]">
              <Sparkles className="h-4 w-4 fill-current" />
              <span>Ask Milo About This Topic:</span>
            </div>
            <span className="text-[10px] text-[#78766d] font-mono">Instant Voice & Text Explanations</span>
          </div>

          <p className="text-xs text-[#a8a69f]">
            Click any question below to have Milo fly over, highlight key insights, and answer in plain English:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {activeDoc.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskMilo(q)}
                className="flex items-center gap-1.5 rounded-full border border-[#2b2927] bg-[#20201d] hover:bg-[#2b2927] hover:border-[#f2d363] px-3.5 py-1.5 text-xs font-medium text-white transition-all active:scale-95 cursor-pointer shadow-sm group"
              >
                <MessageSquare className="h-3 w-3 text-[#f2d363] group-hover:scale-110 transition-transform" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ================= CORE CONTENT SECTION ================= */}
        <div className="space-y-6 text-sm leading-relaxed text-[#c2c1bc]">
          {/* Overview Paragraph */}
          <div className="space-y-3">
            <h2 id="overview" className="text-base font-semibold text-white tracking-wide">
              Architecture Overview
            </h2>
            <p className="text-[#a8a69f] leading-relaxed">
              {activeDoc.content.overview}
            </p>
          </div>

          {/* Key Takeaways */}
          <div className="space-y-3 rounded-xl border border-[#2b2927] bg-[#20201d] p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f2d363] flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" /> Key Principles & Guarantees
            </h3>
            <ul className="space-y-2.5 pt-1">
              {activeDoc.content.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-[#c2c1bc] leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f2d363] shrink-0 mt-1.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Callout Alert if present */}
          {activeDoc.content.callout && (
            <div
              className={`rounded-xl border p-4 text-xs leading-relaxed flex items-start gap-3 ${
                activeDoc.content.callout.type === "tip"
                  ? "border-[#00d692]/30 bg-[#00d692]/10 text-[#00d692]"
                  : activeDoc.content.callout.type === "important"
                  ? "border-[#f2d363]/40 bg-[#262113] text-[#f2d363]"
                  : activeDoc.content.callout.type === "warning"
                  ? "border-red-500/30 bg-red-500/10 text-[#f34f6a]"
                  : "border-blue-500/30 bg-blue-500/10 text-[#60a5fa]"
              }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-white">
                <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                  {activeDoc.content.callout.type}
                </span>
                {activeDoc.content.callout.text}
              </div>
            </div>
          )}

          {/* Code Snippet if present */}
          {activeDoc.content.codeExample && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#78766d]">
                <span className="font-mono flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-[#f2d363]" />
                  <span>{activeDoc.content.codeExample.language.toUpperCase()} Example</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(activeDoc.content.codeExample!.code)}
                  className="flex items-center gap-1 text-[11px] text-[#f2d363] hover:underline cursor-pointer"
                >
                  {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <pre className="rounded-xl border border-[#2b2927] bg-[#0d0d0c] p-4 text-xs font-mono text-[#c2c1bc] overflow-x-auto leading-relaxed">
                <code>{activeDoc.content.codeExample.code}</code>
              </pre>
            </div>
          )}
        </div>

        {/* ================= PREV / NEXT NAVIGATION FOOTER ================= */}
        <div className="pt-8 border-t border-[#20201d] flex items-center justify-between gap-4 mt-auto">
          {prevDocId ? (
            <button
              type="button"
              onClick={() => setActiveDocId(prevDocId)}
              className="flex items-center gap-2 rounded-xl border border-[#2b2927] bg-[#20201d] hover:bg-[#2b2927] px-4 py-2.5 text-xs text-[#a8a69f] hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <div className="text-left">
                <div className="text-[10px] text-[#78766d]">Previous</div>
                <div className="font-bold text-white">{TITAN_GITBOOK_DOCS[prevDocId]?.title}</div>
              </div>
            </button>
          ) : <div />}

          {nextDocId ? (
            <button
              type="button"
              onClick={() => setActiveDocId(nextDocId)}
              className="flex items-center gap-2 rounded-xl border border-[#2b2927] bg-[#20201d] hover:bg-[#2b2927] px-4 py-2.5 text-xs text-[#a8a69f] hover:text-white transition-all cursor-pointer text-right ml-auto"
            >
              <div>
                <div className="text-[10px] text-[#78766d]">Next</div>
                <div className="font-bold text-white">{TITAN_GITBOOK_DOCS[nextDocId]?.title}</div>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : <div />}
        </div>
      </main>

      {/* ================= RIGHT SIDEBAR (ON THIS PAGE & ASK MILO) ================= */}
      <aside className="hidden xl:flex w-64 shrink-0 flex-col space-y-4">
        {/* On This Page Sticky Index */}
        <div className="rounded-2xl border border-[#2b2927] bg-[#151513] p-4 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#78766d] block">
            On this page
          </span>
          <nav className="space-y-1.5 text-xs">
            {activeDoc.headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className="block text-[#78766d] hover:text-[#f2d363] transition-colors py-0.5 truncate"
              >
                {h.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Companion Helper Card */}
        <div className="rounded-2xl border border-[#f2d363]/30 bg-gradient-to-b from-[#262113] to-[#151513] p-4 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#f2d363] flex items-center justify-center font-bold text-[#0d0d0c] text-xs">
              M
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Milo Companion</div>
              <div className="text-[10px] text-[#00d692]">Online & Ready to Help</div>
            </div>
          </div>

          <p className="text-[11px] text-[#a8a69f] leading-relaxed">
            Have a question about routing formulas or swap math? Milo can answer live using verified Titan documentation.
          </p>

          <button
            type="button"
            onClick={() => {
              setPanelOpen(true);
              input(`Explain ${activeDoc.title} from the Titan documentation`);
            }}
            className="w-full rounded-full bg-[#f2d363] hover:bg-[#ffe175] py-2 text-xs font-medium text-[#0d0d0c] transition-colors cursor-pointer shadow-md"
          >
            Ask Milo About This Page
          </button>
        </div>
      </aside>
    </div>
  );
}
