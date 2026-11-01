"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Clock, Info, Loader2, ShieldCheck, Wallet, X } from "lucide-react";
import { useGuidedField } from "@/components/companion/CompanionProvider";
import { validate, type ElementId } from "@/lib/companion/registry";
import { SourceBadge } from "@/components/ui/primitives";

type Mode = "mint" | "redeem";

interface Quote {
  input: { amount: number; token: string };
  expectedOutput: { amount: number; token: string };
  impliedRate: { text: string; value: number };
  fees: { protocolFee: number; note: string };
  limits: { remainingCapacity: number; withinCap: boolean } | null;
  quotedAt: string;
}

const IDS: Record<Mode, { amount: ElementId; quote: ElementId; review: ElementId; sign: ElementId }> = {
  mint: { amount: "mint-amount", quote: "mint-quote", review: "mint-review", sign: "mint-sign" },
  redeem: { amount: "redeem-amount", quote: "redeem-quote", review: "redeem-review", sign: "redeem-sign" },
};

export function TradeForm({ mode }: { mode: Mode }) {
  const ids = IDS[mode];
  const [amount, setAmount] = useState("");
  const onAmount = useGuidedField(ids.amount, amount, setAmount);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const reqId = useRef(0);

  const inputToken = mode === "mint" ? "USDC" : "USDC+";
  const outputToken = mode === "mint" ? "USDC+" : "USDC";
  const problem = amount ? validate("positive-amount", amount) : null;

  // Debounced live quote. A request id discards out-of-order responses (fast typing).
  useEffect(() => {
    setError(null);
    if (!amount || problem) {
      setQuote(null);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/mcp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tool: mode === "mint" ? "reflect_get_mint_quote" : "reflect_get_redeem_quote", args: { asset: "USDC+", amount } }),
        });
        const data = await res.json();
        if (id !== reqId.current) return;
        if (!res.ok || data.ok === false) throw new Error(data?.error?.hint ?? data?.error?.message ?? "Quote failed");
        setQuote(data);
      } catch (e) {
        if (id === reqId.current) {
          setQuote(null);
          setError((e as Error).message);
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [amount, mode, problem]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const age = quote ? Math.max(0, Math.round((now - Date.parse(quote.quotedAt)) / 1000)) : null;
  const canReview = Boolean(quote && !loading && !problem);

  return (
    <div className="card mx-auto max-w-lg p-2">
      <div className="rounded-[16px] bg-white/[0.025] p-5">
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="amount" className="text-[12.5px] font-medium text-[var(--muted)]">
            You {mode === "mint" ? "deposit" : "redeem"}
          </label>
          {mode === "mint" ? (
            <div data-companion="mint-asset" className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/[0.04] py-1 pl-1 pr-3 text-xs">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-500/25 text-[9px] font-bold text-sky-100">C+</span>
              <select aria-label="Stablecoin to mint" className="bg-transparent font-medium focus:outline-none" defaultValue="USDC+">
                <option value="USDC+">USDC+ (backed by USDC)</option>
              </select>
            </div>
          ) : (
            <span className="text-xs text-[var(--muted)]">Balance 2,480.512 USDC+ (demo)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            id="amount"
            data-companion={ids.amount}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmount(e.target.value.replace(/[^\d.]/g, ""))}
            aria-invalid={Boolean(problem)}
            className="num w-full rounded-xl bg-transparent px-1 text-4xl font-semibold placeholder:text-white/20 focus:outline-none"
          />
          <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-medium">{inputToken}</span>
        </div>
        {problem && <p className="mt-2 text-xs text-rose-300">{problem}</p>}
      </div>

      <div className="relative z-10 -my-3 flex justify-center">
        <span className="grid h-9 w-9 place-items-center rounded-full border-4 border-[var(--bg)] bg-[var(--surface-2)]">
          <ArrowDown size={15} />
        </span>
      </div>

      <div data-companion={ids.quote} className="rounded-[16px] bg-white/[0.025] p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12.5px] font-medium text-[var(--muted)]">You receive (estimated)</p>
          {quote && <SourceBadge kind="live" />}
        </div>
        <div className="flex items-center gap-3">
          <p className="num w-full text-4xl font-semibold" aria-live="polite">
            {loading ? <Loader2 className="animate-spin text-[var(--muted)]" size={28} /> : quote ? quote.expectedOutput.amount.toLocaleString("en-US", { maximumFractionDigits: 6 }) : <span className="text-white/20">0.00</span>}
          </p>
          <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-medium">{outputToken}</span>
        </div>
        {error && <p className="mt-2 text-xs text-rose-300">Couldn&apos;t get a quote: {error}</p>}
      </div>

      <div className="space-y-2 px-5 py-4 text-[13px]">
        <div data-companion={mode === "mint" ? "mint-fees" : "redeem-freshness"} className="space-y-2">
          <Row label="Rate" value={quote?.impliedRate.text ?? "n/a"} />
          <Row label="Protocol fee" value={quote ? "0.00" : "n/a"} hint={quote?.fees.note} />
          {mode === "mint" && quote?.limits && <Row label="Supply cap headroom" value={quote.limits.withinCap ? "Within cap ✓" : "Exceeds cap ✕"} />}
          <Row label="Quote age" value={age == null ? "n/a" : `${age}s ago`} icon={<Clock size={12} />} />
        </div>
      </div>

      <div className="p-3 pt-0">
        <button
          type="button"
          data-companion={ids.review}
          disabled={!canReview}
          onClick={() => setReview(true)}
          className="w-full rounded-2xl bg-[var(--accent)] py-4 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgba(0,88,178,0.9)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {amount ? `Review ${mode}` : "Enter an amount"}
        </button>
      </div>

      <AnimatePresence>
        {review && quote && <ReviewModal mode={mode} quote={quote} signId={ids.sign} onClose={() => setReview(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1 text-[var(--muted)]" title={hint}>
        {icon}
        {label}
        {hint && <Info size={12} />}
      </span>
      <span className="num text-white/90">{value}</span>
    </div>
  );
}

function ReviewModal({ mode, quote, signId, onClose }: { mode: Mode; quote: Quote; signId: ElementId; onClose: () => void }) {
  const [notice, setNotice] = useState(false);
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${mode}`}
        className="card w-full max-w-md bg-[var(--surface)] p-6"
        initial={{ y: 20, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Review {mode}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-[var(--muted)] hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <dl className="space-y-3 text-sm">
          <Item k="You pay" v={`${quote.input.amount.toLocaleString("en-US")} ${quote.input.token}`} />
          <Item k="You receive (est.)" v={`${quote.expectedOutput.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${quote.expectedOutput.token}`} />
          <Item k="Minimum received (0.5% slippage)" v={`${(quote.expectedOutput.amount * 0.995).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${quote.expectedOutput.token}`} />
          <Item k="Rate" v={quote.impliedRate.text} />
          <Item k="Network" v="Solana mainnet" />
        </dl>
        <p className="mt-5 flex gap-2 rounded-xl bg-white/[0.04] p-3 text-xs text-[var(--muted)]">
          <ShieldCheck size={15} className="shrink-0 text-emerald-300" />
          The transaction is built unsigned. Only your wallet can approve it. Yield is variable and not guaranteed.
        </p>
        <button
          type="button"
          data-companion={signId}
          onClick={() => setNotice(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-semibold text-[#111519] transition hover:bg-white/90"
        >
          <Wallet size={17} /> Approve in wallet
        </button>
        {notice && <p className="mt-3 text-center text-xs text-amber-200">Demo: no wallet is connected, so nothing is signed or sent.</p>}
      </motion.div>
    </motion.div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="num text-right">{v}</dd>
    </div>
  );
}
