"use client";

import { useState } from "react";
import { Shield, Eye, EyeOff, AlertTriangle, ChevronDown, ChevronUp, Lock, FileText, CheckCircle2 } from "lucide-react";
import type { OperationType } from "@/lib/products/umbra/types";
import { PRIVACY_REPORTS } from "@/lib/products/umbra/privacy-matrix";

export function PrivacyTransparencyCard() {
  const [selectedOp, setSelectedOp] = useState<OperationType>("private_send");
  const [expandedLeaks, setExpandedLeaks] = useState<boolean>(true);

  const report = PRIVACY_REPORTS[selectedOp];

  const operations: { id: OperationType; label: string }[] = [
    { id: "private_send", label: "Private Send" },
    { id: "deposit", label: "Deposit / Shield" },
    { id: "withdraw", label: "Withdraw / Unshield" },
    { id: "register", label: "Registration" },
  ];

  return (
    <div
      data-companion="umbra-privacy-card"
      className="rounded-2xl border border-violet-900/30 bg-[#0c0c14]/90 p-6 backdrop-blur-xl shadow-2xl transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2 text-violet-400">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Nimbus Privacy Transparency Matrix</h3>
            <p className="text-[11px] text-white/50">
              Verified from official Nimbus documentation (docs.nimbusprivacy.xyz).
            </p>
          </div>
        </div>

        <button
          type="button"
          data-companion="umbra-privacy-toggle"
          onClick={() => setExpandedLeaks(!expandedLeaks)}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
        >
          <span>{expandedLeaks ? "Compact view" : "View documented limits"}</span>
          {expandedLeaks ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Operation selector tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {operations.map((op) => {
          const isActive = selectedOp === op.id;
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => setSelectedOp(op.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-violet-600/30 border border-violet-500/40 text-violet-200 shadow-sm"
                  : "bg-black/30 border border-white/[0.05] text-white/60 hover:text-white/90 hover:border-white/15"
              }`}
            >
              {op.label}
            </button>
          );
        })}
      </div>

      {/* Side-by-side visibility table */}
      <div data-companion="umbra-privacy-matrix" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* What is hidden */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pb-2 border-b border-emerald-500/10">
            <EyeOff className="h-4 w-4" />
            <span>Confidential & Hidden from Chain Observers</span>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-white/80">
            {report.hidden.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What is public */}
        <div className="rounded-xl border border-white/[0.07] bg-black/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80 pb-2 border-b border-white/[0.05]">
            <Eye className="h-4 w-4 text-violet-400" />
            <span>Publicly Visible on Solana</span>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-white/70">
            {report.public.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Documented limits and caveats */}
      {expandedLeaks && (
        <div
          data-companion="umbra-privacy-leaks"
          className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs space-y-2 text-white/80"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>Documented Limits & Correlation Vectors</span>
          </div>

          <div className="space-y-1.5 pl-6 list-disc text-[11px] text-white/70 leading-relaxed">
            {report.caveats.map((cav, idx) => (
              <p key={idx}>{cav}</p>
            ))}
            <p className="text-white/50 italic pt-1">
              * Mandated Policy: This AI companion strictly adheres to DECISIONS.md and never claims 100% untraceability, total anonymity, or uncorrelatable privacy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
