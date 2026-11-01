"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ChevronDown, Clock, Info, Loader2, ShieldCheck, Wallet, X } from "lucide-react";
import { useGuidedField } from "@/components/companion/CompanionProvider";
import { validate, type ElementId } from "@/lib/companion/registry";
import { SourceBadge, TokenIcon } from "@/components/ui/primitives";

type Mode = "mint" | "redeem";
type Asset = "USDC+" | "USDT+";

interface Quote {
  input: { amount: number; token: string };
  expectedOutput: { amount: number; token: string };
  impliedRate: { text: string; value: number };
  fees: { protocolFee: number; note: string };
  limits: { remainingCapacity: number; withinCap: boolean } | null;
  quotedAt: string;
}

type Ids = { amount: ElementId; quote: ElementId; review: ElementId; sign: ElementId };

/** Registry ids per page: /mint and /redeem own USDC+; /usdt hosts both modes for USDT+. */
const IDS: Record<Asset, Record<Mode, Ids>> = {
  "USDC+": {
    mint: { amount: "mint-amount", quote: "mint-quote", review: "mint-review", sign: "mint-sign" },
    redeem: { amount: "redeem-amount", quote: "redeem-quote", review: "redeem-review", sign: "redeem-sign" },
  },
  "USDT+": {
    mint: { amount: "usdt-amount", quote: "usdt-quote", review: "usdt-review", sign: "usdt-sign" },
    redeem: { amount: "usdt-amount", quote: "usdt-quote", review: "usdt-review", sign: "usdt-sign" },
  },
};

const UNDERLYING: Record<Asset, string> = { "USDC+": "USDC", "USDT+": "USDT" };

const SLIPPAGE_BPS = 50;

/**
 * Single trade card in the layout of the public Reflect app: coin title selector, segmented
 * Mint / Redeem tabs, amount → output, one black pill CTA, then detail rows. Original markup.
 */
export function TradeForm({ mode, asset = "USDC+", basePath }: { mode: Mode; asset?: Asset; /** Tabs link to `${basePath}?tab=…` instead of /mint and /redeem. */ basePath?: string }) {
  const ids = IDS[asset][mode];
  const underlying = UNDERLYING[asset];
  // Companion ids that only exist on the USDC+ /mint and /redeem pages.
  const legacy = asset === "USDC+";
  const [amount, setAmount] = useState("");
  const onAmount = useGuidedField(ids.amount, amount, setAmount);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const reqId = useRef(0);

  const inputToken = mode === "mint" ? underlying : asset;
  const outputToken = mode === "mint" ? asset : underlying;
  const problem = amount ? validate("positive-amount", amount) : null;

  // Debounced live quote. A request id discards out-of-order responses (fast typing).
  useEffect(() => {
    setError(null);
    if (!amount || problem) {
      setQuote(null);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/mcp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tool: mode === "mint" ? "reflect_get_mint_quote" : "reflect_get_redeem_quote", args: { asset, amount } }),
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
  }, [amount, mode, problem, asset]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const age = quote ? Math.max(0, Math.round((now - Date.parse(quote.quotedAt)) / 1000)) : null;
  const canReview = Boolean(quote && !loading && !problem);

  return (
    <div className="mx-auto w-full max-w-[448px]">
      <button type="button" data-companion={legacy && mode === "mint" ? "mint-asset" : undefined} className="mx-auto mb-6 flex items-center gap-2 text-2xl font-medium tracking-[-0.02em]">
        <TokenIcon symbol={asset} size={28} />
        {asset}
        <ChevronDown size={20} className="text-[var(--muted)]" />
      </button>

      <div className="card overflow-hidden p-1.5">
        {/* Segmented tabs (links, so each tab is its own route the companion can navigate to) */}
        <div className="relative grid grid-cols-2 rounded-[14px] bg-[var(--surface-2)] p-1">
          {(["mint", "redeem"] as const).map((m) => (
            <Link key={m} href={basePath ? `${basePath}?tab=${m}` : `/${m}`} scroll={false} className={`relative z-10 rounded-[10px] py-2 text-center text-[15px] font-medium capitalize transition-colors ${mode === m ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
              {mode === m && <motion.span layoutId="trade-tab" className="absolute inset-0 -z-10 rounded-[10px] bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              {m}
            </Link>
          ))}
        </div>

        <div className="px-4 pb-2 pt-5">
          <div className="mb-1 flex items-center justify-between text-[13px] text-[var(--muted)]">
            <label htmlFor="amount">You {mode === "mint" ? "deposit" : "redeem"}</label>
            {mode === "redeem" && <span>Balance 2,480.512 (demo)</span>}
          </div>
          <div className="flex items-center gap-3">
            <input
              id="amount"
              data-companion={ids.amount}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => onAmount(e.target.value.replace(/[^\d.]/g, ""))}
              aria-invalid={Boolean(problem)}
              className="num min-w-0 flex-1 bg-transparent text-[32px] font-medium placeholder:text-[var(--line-strong)] focus:outline-none"
            />
            <TokenPill symbol={inputToken} />
          </div>
          <AnimatePresence>
            {problem && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-[var(--bad)]">
                {problem}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="relative my-1 flex justify-center">
          <span className="absolute inset-x-4 top-1/2 h-px bg-[var(--line)]" />
          <motion.span
            whileHover={{ rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--line-strong)] bg-white"
          >
            <ArrowDown size={15} />
          </motion.span>
        </div>

        <div data-companion={ids.quote} className="px-4 pb-4 pt-2">
          <div className="mb-1 flex items-center justify-between text-[13px] text-[var(--muted)]">
            <span>You receive (estimated)</span>
            <AnimatePresence>{quote && <SourceBadge kind="live" />}</AnimatePresence>
          </div>
          <div className="flex items-center gap-3">
            <div className="num min-w-0 flex-1 text-[32px] font-medium" aria-live="polite">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 className="animate-spin text-[var(--muted)]" size={26} />
                  </motion.span>
                ) : quote ? (
                  <motion.span key={quote.quotedAt} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    {quote.expectedOutput.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                  </motion.span>
                ) : (
                  <motion.span key="z" className="text-[var(--line-strong)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    0
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <TokenPill symbol={outputToken} />
          </div>
          {error && <p className="mt-1 text-xs text-[var(--bad)]">Couldn&apos;t get a quote: {error}</p>}
        </div>

        <div className="px-1.5 pb-1.5">
          <button
            type="button"
            data-companion={ids.review}
            disabled={!canReview}
            onClick={() => setReview(true)}
            className="h-12 w-full rounded-full bg-[var(--ink)] text-[15px] font-semibold text-white transition enabled:hover:bg-black enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {amount ? `Review ${mode}` : "Enter an amount"}
          </button>
        </div>
      </div>

      <div data-companion={legacy ? (mode === "mint" ? "mint-fees" : "redeem-freshness") : undefined} className="card mt-3 space-y-3 px-5 py-4 text-[15px]">
        <Row label="Quote" value={quote?.impliedRate.text ?? "--"} />
        <Row label="Slippage" value={`${SLIPPAGE_BPS / 100}%`} />
        <Row label="Protocol fee" value={quote ? "0.00" : "--"} hint={quote?.fees.note} />
        <Row label="Collateral" value={underlying} />
        {mode === "mint" && quote?.limits && <Row label="Supply cap" value={quote.limits.withinCap ? "Within cap" : "Exceeds cap"} />}
        <Row label="Quote age" value={age == null ? "--" : `${age}s`} icon={<Clock size={13} />} />
      </div>

      <Faq symbol={asset} underlying={underlying} />

      <AnimatePresence>{review && quote && <ReviewModal mode={mode} quote={quote} signId={ids.sign} onClose={() => setReview(false)} />}</AnimatePresence>
    </div>
  );
}

function TokenPill({ symbol }: { symbol: string }) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-white py-1.5 pl-1.5 pr-3.5 text-[15px] font-medium">
      <TokenIcon symbol={symbol} size={24} />
      {symbol}
    </span>
  );
}

function Row({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[var(--muted)]" title={hint}>
        {icon}
        {label}
        {hint && <Info size={13} />}
      </span>
      <span className="num font-medium">{value}</span>
    </div>
  );
}

const faq = (s: string, u: string) =>
  [
    ["Where does the yield come from?", `Your ${u} is lent to over-collateralised borrowers across Solana money markets. Their interest raises the value of every ${s}.`],
    ["Do I need to claim anything?", `No. ${s} grows in value in your wallet. You see it when you redeem for more ${u} than you put in.`],
    ["Is the APY guaranteed?", "No. It moves with lending demand and can go down. Insurance is designed to cover principal, not yield."],
  ] as const;

function Faq({ symbol, underlying }: { symbol: string; underlying: string }) {
  const FAQ = faq(symbol, underlying);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div data-companion={symbol === "USDT+" ? "usdt-faq" : undefined} className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {FAQ.map(([q, a], i) => (
        <div key={q}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left text-[15px] font-medium">
            {q}
            <motion.span animate={{ rotate: open === i ? 180 : 0 }}>
              <ChevronDown size={18} className="text-[var(--muted)]" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden pb-4 text-[14.5px] leading-relaxed text-[var(--muted)]"
              >
                {a}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function ReviewModal({ mode, quote, signId, onClose }: { mode: Mode; quote: Quote; signId: ElementId; onClose: () => void }) {
  const [notice, setNotice] = useState(false);
  const min = quote.expectedOutput.amount * (1 - SLIPPAGE_BPS / 10_000);
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#111519]/40 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${mode}`}
        className="card w-full max-w-[420px] p-6"
        initial={{ y: 24, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 24, scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-medium">Review {mode}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)]">
            <X size={18} />
          </button>
        </div>
        <dl className="space-y-3 text-[15px]">
          <Item k="You pay" v={`${quote.input.amount.toLocaleString("en-US")} ${quote.input.token}`} />
          <Item k="You receive (est.)" v={`${quote.expectedOutput.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${quote.expectedOutput.token}`} />
          <Item k={`Minimum received (${SLIPPAGE_BPS / 100}% slippage)`} v={`${min.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${quote.expectedOutput.token}`} />
          <Item k="Rate" v={quote.impliedRate.text} />
          <Item k="Network" v="Solana mainnet" />
        </dl>
        <p className="mt-5 flex gap-2 rounded-xl bg-[var(--surface-2)] p-3 text-[13px] leading-relaxed text-[var(--muted)]">
          <ShieldCheck size={16} className="shrink-0 text-[var(--good)]" />
          The transaction is built unsigned. Only your wallet can approve it. Yield is variable and not guaranteed.
        </p>
        <button
          type="button"
          data-companion={signId}
          onClick={() => setNotice(true)}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] text-[15px] font-semibold text-white transition hover:bg-black"
        >
          <Wallet size={17} /> Approve in wallet
        </button>
        {notice && <p className="mt-3 text-center text-[13px] text-amber-700">Demo: no wallet is connected, so nothing is signed or sent.</p>}
      </motion.div>
    </motion.div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="num text-right font-medium">{v}</dd>
    </div>
  );
}
