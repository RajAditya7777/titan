"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Article building blocks styled to the measured GitBook theme. */

export function H1({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h1 className="flex items-center gap-3 text-[36px] font-bold leading-[45px] tracking-[-0.01em] text-[#fffff9]">
      {icon && <span className="text-[#f2d364]">{icon}</span>}
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-lg leading-7 text-[#c7c0a9]">{children}</p>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-base leading-[26px] text-[#fffff9]/85">{children}</p>;
}

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group scroll-mt-20 pt-[30px] text-[30px] font-semibold leading-9 text-[#fffff9]">
      <a href={`#${id}`} className="hover:underline decoration-[#3d392e] underline-offset-4">
        {children}
      </a>
    </h2>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[#2d2c27] px-1.5 py-px font-[family-name:var(--font-docs-mono)] text-sm">{children}</code>;
}

export function Steps({ steps }: { steps: Array<{ id: string; title: string; body: React.ReactNode }> }) {
  return (
    <ol className="mt-6">
      {steps.map((s, i) => (
        <li key={s.id} className="relative flex gap-4 pb-[54px] last:pb-0">
          {i < steps.length - 1 && <span aria-hidden className="absolute left-[14px] top-9 h-[calc(100%-36px)] w-px bg-[#3d392e]" />}
          <span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-full bg-[#f2d364] text-base font-medium text-[#1d1d1d]">{i + 1}</span>
          <div className="min-w-0">
            <h3 id={s.id} className="scroll-mt-20 text-xl font-semibold leading-[29px] text-[#fffff9]">
              {s.title}
            </h3>
            <div className="mt-1 text-base leading-[26px] text-[#fffff9]/85">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-[#3d392e]">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#3d392e]">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium text-[#fffff9]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[#3d392e] last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top leading-6 text-[#fffff9]/85">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy code"
      onClick={async () => {
        await navigator.clipboard?.writeText(text).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#fffff9]/60 hover:bg-white/5 hover:text-white"
    >
      {done ? <Check className="h-3.5 w-3.5 text-[#00d692]" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="mt-6 flex items-start justify-between gap-2 rounded-xl border border-[#3d392e] bg-[#232220] py-2.5 pl-4 pr-2">
      <pre className="overflow-x-auto font-[family-name:var(--font-docs-mono)] text-[15px] leading-[26px]">{code}</pre>
      <CopyButton text={code} />
    </div>
  );
}

export function CodeTabs({ tabs }: { tabs: Array<{ label: string; code: string }> }) {
  const [i, setI] = useState(0);
  const tab = tabs[i]!;
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[#3d392e] bg-[#232220]">
      <div className="flex items-center justify-between border-b border-[#3d392e] px-2">
        <div role="tablist" className="flex">
          {tabs.map((t, k) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={k === i}
              onClick={() => setI(k)}
              className={`border-b-2 px-3 py-2 text-sm transition ${k === i ? "border-[#f2d364] text-[#fffff9]" : "border-transparent text-[#fffff9]/55 hover:text-[#fffff9]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton text={tab.code} />
      </div>
      <pre role="tabpanel" className="overflow-x-auto px-4 py-3 font-[family-name:var(--font-docs-mono)] text-sm leading-6">
        {tab.code}
      </pre>
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 rounded-xl border border-[#3d392e] bg-[#232220] px-4 py-3 text-sm leading-6 text-[#fffff9]/85">{children}</div>;
}
