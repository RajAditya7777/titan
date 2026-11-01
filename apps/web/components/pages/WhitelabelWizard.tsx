"use client";

import { useEffect, useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { useGuidedField } from "@/components/companion/CompanionProvider";
import { validate, type ElementId, type ValidationRule } from "@/lib/companion/registry";
import { SourceBadge } from "@/components/ui/primitives";

interface Underlying {
  mint: string;
  name: string;
  apyPercent: number;
}

export function WhitelabelWizard() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [fee, setFee] = useState("");
  const [collateral, setCollateral] = useState<string>("");
  const [options, setOptions] = useState<Underlying[] | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const onName = useGuidedField("wl-name", name, setName);
  const onSymbol = useGuidedField("wl-symbol", symbol, (v) => setSymbol(v.toUpperCase()));
  const onFee = useGuidedField("wl-fee", fee, setFee);

  useEffect(() => {
    fetch("/api/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool: "reflect_get_whitelabel_options", args: {} }) })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok === false) throw new Error(d.error?.message);
        setOptions(d.underlyings);
        setCollateral(d.underlyings?.[0]?.mint ?? "");
      })
      .catch((e) => setOptionsError((e as Error).message || "unavailable"));
  }, []);

  const errors = {
    name: name ? validate("token-name", name) : null,
    symbol: symbol ? validate("token-symbol", symbol) : null,
    fee: fee ? validate("fee-bps", fee) : null,
  };
  const chosen = options?.find((o) => o.mint === collateral);
  const feeBps = Number(fee) || 0;
  const userApy = chosen ? chosen.apyPercent * (1 - feeBps / 10_000) : null;
  const complete = name && symbol && fee && collateral && !errors.name && !errors.symbol && !errors.fee;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card space-y-6 p-6 lg:col-span-3">
        <Field id="wl-name" n={1} label="Token name" hint="What people will see in wallets." value={name} error={errors.name} rule="token-name">
          <input data-companion="wl-name" value={name} onChange={(e) => onName(e.target.value)} placeholder="Acme Dollar" className={inputCls} />
        </Field>
        <Field id="wl-symbol" n={2} label="Symbol" hint="2–8 capital letters." value={symbol} error={errors.symbol} rule="token-symbol">
          <input data-companion="wl-symbol" value={symbol} onChange={(e) => onSymbol(e.target.value)} placeholder="ACMEUSD" className={`${inputCls} num uppercase`} />
        </Field>
        <Field id="wl-collateral" n={3} label="Underlying collateral" hint="The yield source your token wraps." value={collateral} rule="non-empty" badge={options ? <SourceBadge kind="live" /> : undefined}>
          <div data-companion="wl-collateral">
            {optionsError ? (
              <p className="text-sm text-rose-300">Couldn&apos;t load options: {optionsError}</p>
            ) : !options ? (
              <div className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {options.slice(0, 4).map((o) => (
                  <button
                    key={o.mint}
                    type="button"
                    onClick={() => setCollateral(o.mint)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${collateral === o.mint ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--line)] hover:border-white/20"}`}
                  >
                    <span className="block font-medium">{o.name}</span>
                    <span className="num text-xs text-[var(--accent-2)]">{o.apyPercent.toFixed(2)}% APY</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>
        <Field id="wl-fee" n={4} label="Your fee (bps of yield)" hint="100 bps = 1%. Max 1,000 here." value={fee} error={errors.fee} rule="fee-bps">
          <input data-companion="wl-fee" inputMode="numeric" value={fee} onChange={(e) => onFee(e.target.value.replace(/\D/g, ""))} placeholder="50" className={`${inputCls} num`} />
        </Field>
      </div>

      <div data-companion="wl-summary" className="card h-fit p-6 lg:col-span-2">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6aa8f0] to-[#0058b2] text-sm font-bold">{symbol.slice(0, 2) || "?"}</span>
          <div>
            <p className="font-semibold">{name || "Your token"}</p>
            <p className="num text-xs text-[var(--muted)]">{symbol || "SYMBOL"}</p>
          </div>
        </div>
        <dl className="space-y-2.5 text-sm">
          <Sum k="Collateral" v={chosen?.name ?? "n/a"} />
          <Sum k="Underlying APY" v={chosen ? `${chosen.apyPercent.toFixed(2)}%` : "n/a"} />
          <Sum k="Your fee" v={fee ? `${feeBps} bps (${(feeBps / 100).toFixed(2)}% of yield)` : "n/a"} />
          <Sum k="Your users earn (est.)" v={userApy != null && fee ? `${userApy.toFixed(2)}%` : "n/a"} />
        </dl>
        <p className={`mt-5 flex items-center gap-2 text-xs ${complete ? "text-emerald-300" : "text-[var(--muted)]"}`}>
          <Check size={14} /> {complete ? "Configuration valid" : "Complete all four fields"}
        </p>
        <button
          type="button"
          data-companion="wl-deploy"
          disabled
          title="Deployment creates real on-chain accounts and is disabled in this demo"
          className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-[var(--line)] py-3.5 text-sm font-semibold text-[var(--muted)]"
        >
          <Lock size={15} /> Deploy (disabled in demo)
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
          A real deployment uses Reflect&apos;s whitelabel API (<code>POST /whitelabel/initialize/flow</code>) and is signed by your wallet. Not called by this demo.
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border border-[var(--line)] bg-white/[0.03] px-4 text-[15px] placeholder:text-white/25 focus:border-[var(--accent)] focus:outline-none";

function Field(props: { id: ElementId; n: number; label: string; hint: string; value: string; error?: string | null; rule: ValidationRule; badge?: React.ReactNode; children: React.ReactNode }) {
  const ok = props.value && !validate(props.rule, props.value);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <span className={`num grid h-6 w-6 place-items-center rounded-full text-[11px] ${ok ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10"}`}>{ok ? <Check size={12} /> : props.n}</span>
        <p className="text-sm font-medium">{props.label}</p>
        <span className="text-xs text-[var(--muted)]">{props.hint}</span>
        <span className="flex-1" />
        {props.badge}
      </div>
      {props.children}
      {props.error && <p className="mt-1.5 text-xs text-rose-300">{props.error}</p>}
    </div>
  );
}

function Sum({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="num text-right">{v}</dd>
    </div>
  );
}

export function WhitelabelIntro() {
  return <Sparkles className="text-[var(--accent-2)]" size={18} />;
}
