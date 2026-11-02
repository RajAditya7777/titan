"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Check, ChevronsUpDown, EyeOff, Eye, Loader2, Send, ShieldCheck, Wallet, X } from "lucide-react";
import { useCompanion, useGuidedField } from "@/components/companion/CompanionProvider";
import { UMBRA_WEB_TOKENS, type UmbraWebTab, type UmbraWebToken } from "@/lib/products/umbra/web";
import { DEMO_WALLET, PRICES, approve, formProblem, privateUsd, register, setUmbra, useUmbra, type UmbraWebStore } from "./store";

const TABS: { id: UmbraWebTab; label: string; icon: typeof Send; verb: string; cta: string }[] = [
  { id: "deposit", label: "Deposit", icon: ArrowDownToLine, verb: "You're depositing", cta: "Deposit" },
  { id: "send", label: "Send", icon: Send, verb: "You're sending", cta: "Send privately" },
  { id: "swap", label: "Swap", icon: ArrowLeftRight, verb: "You're swapping", cta: "Swap privately" },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine, verb: "You're withdrawing", cta: "Withdraw" },
];

const PRIVACY_NOTE: Record<UmbraWebTab, { hidden: boolean; text: string }> = {
  deposit: { hidden: false, text: "Public on Solana: your wallet, the token and the amount going in. Private after that." },
  send: { hidden: true, text: "Hidden from Solana observers: sender, recipient, token and amount." },
  swap: { hidden: true, text: "Hidden: your trade size and activity. Your private balance pays and receives." },
  withdraw: { hidden: false, text: "Public: the receiving address, token and amount. Not which private balance paid." },
};

const TOKEN_COLORS: Record<UmbraWebToken, string> = { SOL: "#14161f", USDC: "#2775ca", USDT: "#26a17b", USDv: "#0100ff" };

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ids = (app: boolean, id: string) => (app ? { "data-companion": id } : {});

function TokenDot({ t, size = 18 }: { t: UmbraWebToken; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white" style={{ width: size, height: size, background: TOKEN_COLORS[t] }}>
      {t === "USDv" ? "v" : t[0]}
    </span>
  );
}

function TokenPicker({ value, onPick, app, id, balances }: { value: UmbraWebToken | ""; onPick: (t: UmbraWebToken) => void; app: boolean; id: string; balances: Record<UmbraWebToken, number> }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        {...ids(app, id)}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-[7px] text-[13.5px] text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.05] transition hover:ring-black/10"
      >
        {value ? (
          <>
            <TokenDot t={value} /> {value}
          </>
        ) : (
          "Select Token"
        )}
        <ChevronsUpDown size={13} className="text-[#8a8a93]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-[calc(100%+6px)] z-30 w-[220px] rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_18px_50px_-20px_rgba(16,16,107,0.4)]"
          >
            {UMBRA_WEB_TOKENS.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(t);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] hover:bg-[#f4f4f6]"
                >
                  <TokenDot t={t} size={22} />
                  <span className="flex-1">{t}</span>
                  <span className="text-[12px] text-[#8a8a93]">{balances[t].toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>
                  {value === t && <Check size={14} className="text-[#0100ff]" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Deposit / Send / Swap / Withdraw. `app` wires it to the companion and the simulated account. */
export function UmbraWidget({ app = false }: { app?: boolean }) {
  const s = useUmbra();
  return app ? <GuidedWidget s={s} /> : <WidgetBody s={s} app={false} on={{ amount: (v) => setUmbra({ amount: v }), token: (t) => setUmbra({ token: t }) }} />;
}

interface Handlers {
  amount(v: string): void;
  token(t: UmbraWebToken): void;
  swapTo?(t: UmbraWebToken): void;
  recipient?(v: string): void;
  destination?(v: string): void;
}

function GuidedWidget({ s }: { s: UmbraWebStore }) {
  const { setPageContext } = useCompanion();
  const amount = useGuidedField("umb-amount", s.amount, (v) => setUmbra({ amount: v }));
  const token = useGuidedField("umb-token", s.token, (v) => setUmbra({ token: v as UmbraWebToken }));
  const swapTo = useGuidedField("umb-swap-to", s.swapTo, (v) => setUmbra({ swapTo: v as UmbraWebToken }));
  const recipient = useGuidedField("umb-recipient", s.recipient, (v) => setUmbra({ recipient: v }));
  const destination = useGuidedField("umb-destination", s.destination, (v) => setUmbra({ destination: v }));

  // The companion's view of the app (D-005): replaces, never merges with another product's context.
  useEffect(() => {
    setPageContext(() => ({
      product: "umbra_web",
      tab: s.tab,
      connected: s.connected,
      registered: s.registered,
      amount: s.amount,
      token: s.token,
      swapTo: s.swapTo,
      walletBalances: s.wallet,
      privateBalances: s.private,
      privateBalanceUsd: Math.round(privateUsd(s) * 100) / 100,
      stage: s.stage,
      lastAction: s.lastAction,
      formProblem: s.registered ? formProblem(s) : null,
    }));
  }, [s, setPageContext]);

  return (
    <>
      <WidgetBody s={s} app on={{ amount, token: (t) => token(t), swapTo: (t) => swapTo(t), recipient, destination }} />
      <Modals s={s} />
    </>
  );
}

function WidgetBody({ s, app, on }: { s: UmbraWebStore; app: boolean; on: Handlers }) {
  const tab = TABS.find((t) => t.id === s.tab)!;
  const source = s.tab === "deposit" ? s.wallet : s.private;
  const amountUsd = s.token && Number(s.amount) > 0 ? Number(s.amount) * PRICES[s.token] : 0;
  const problem = formProblem(s);
  const note = PRIVACY_NOTE[s.tab];

  return (
    <div className="w-full max-w-[412px]">
      {app && s.connected && (
        <div data-companion="umb-balance" className="mb-3 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-2.5 text-[12.5px] ring-1 ring-black/[0.05] backdrop-blur">
          <span className="flex items-center gap-1.5 text-[#75757f]">
            <Wallet size={13} /> {DEMO_WALLET}
          </span>
          {s.registered ? (
            <span className="flex items-center gap-1.5 text-[#171717]">
              <ShieldCheck size={13} className="text-[#0100ff]" /> Private {usd(privateUsd(s))}
            </span>
          ) : (
            <span className="text-[#b45309]">Not registered</span>
          )}
        </div>
      )}

      <div role="tablist" className="grid grid-cols-4 rounded-[14px] bg-[#f4f4f5] p-1">
        {TABS.map((t) => {
          const active = t.id === s.tab;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              {...ids(app, `umb-tab-${t.id}`)}
              onClick={() => setUmbra({ tab: t.id, stage: s.stage === "done" ? "idle" : s.stage })}
              className={`flex h-[34px] items-center justify-center gap-1.5 rounded-[10px] text-[13px] transition ${
                active ? "bg-white text-[#171717] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[#75757f] hover:text-[#171717]"
              }`}
            >
              {active && <Icon size={13} />} {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-[22px] border border-black/[0.05] bg-white p-1.5 shadow-[0_10px_40px_-24px_rgba(16,16,107,0.35)]">
        {s.tab === "send" && app && (
          <label className="mb-1.5 block rounded-[18px] bg-[#f4f4f5] px-4 py-3">
            <span className="text-[12.5px] text-[#75757f]">To (registered Umbra user)</span>
            <input
              data-companion="umb-recipient"
              value={s.recipient}
              onChange={(e) => on.recipient?.(e.target.value.trim())}
              placeholder="Solana address"
              className="mt-1 block w-full bg-transparent font-mono text-[13px] text-[#171717] placeholder:text-[#b5b5bd] focus:outline-none"
            />
          </label>
        )}

        <div className="rounded-[18px] bg-[#f4f4f5] px-4 pb-3 pt-3.5">
          <div className="flex items-center justify-between text-[12.5px] text-[#75757f]">
            <span>{tab.verb}</span>
            {s.token && app && s.connected && (
              <button type="button" onClick={() => on.amount(String(source[s.token as UmbraWebToken]))} className="hover:text-[#0100ff]">
                {s.tab === "deposit" ? "Wallet" : "Private"}: {source[s.token as UmbraWebToken].toLocaleString("en-US", { maximumFractionDigits: 4 })}
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <input
              {...ids(app, "umb-amount")}
              inputMode="decimal"
              value={s.amount}
              onChange={(e) => on.amount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              aria-label="Amount"
              className="min-w-0 flex-1 bg-transparent text-[40px] font-light leading-tight tracking-[-0.03em] text-[#171717] placeholder:text-[#b5b5bd] focus:outline-none"
            />
            <TokenPicker value={s.token} onPick={on.token} app={app} id="umb-token" balances={source} />
          </div>
          <p className="text-[12px] text-[#9a9aa3]">{usd(amountUsd)}</p>
        </div>

        {s.tab === "swap" && (
          <div className="mt-1.5 flex items-center justify-between rounded-[18px] bg-[#f4f4f5] px-4 py-3.5">
            <div>
              <p className="text-[12.5px] text-[#75757f]">You receive</p>
              <p className="mt-0.5 text-[24px] font-light tracking-[-0.02em] text-[#171717]">
                {s.swapTo && s.token && Number(s.amount) > 0
                  ? ((Number(s.amount) * PRICES[s.token]) / PRICES[s.swapTo] * 0.997).toLocaleString("en-US", { maximumFractionDigits: 4 })
                  : "0"}
              </p>
            </div>
            <TokenPicker value={s.swapTo} onPick={(t) => on.swapTo?.(t)} app={app} id="umb-swap-to" balances={s.private} />
          </div>
        )}

        {s.tab === "withdraw" && app && (
          <label className="mt-1.5 block rounded-[18px] bg-[#f4f4f5] px-4 py-3">
            <span className="text-[12.5px] text-[#75757f]">To public address</span>
            <input
              data-companion="umb-destination"
              value={s.destination}
              onChange={(e) => on.destination?.(e.target.value.trim())}
              placeholder="Solana address"
              className="mt-1 block w-full bg-transparent font-mono text-[13px] text-[#171717] placeholder:text-[#b5b5bd] focus:outline-none"
            />
          </label>
        )}

        <div className="pt-1.5">
          {!app ? (
            <Link href="/umbra/app" className="flex h-[46px] w-full items-center justify-center rounded-full bg-[#0100ff] text-[14.5px] text-white transition hover:bg-[#2020ff]">
              Create an account
            </Link>
          ) : !s.connected ? (
            <PrimaryButton id="umb-create-account" onClick={() => setUmbra({ stage: "connect" })}>
              Create an account
            </PrimaryButton>
          ) : !s.registered ? (
            <PrimaryButton id="umb-register" onClick={() => setUmbra({ stage: "register" })}>
              Register private account
            </PrimaryButton>
          ) : (
            <PrimaryButton id="umb-submit" disabled={!!problem} onClick={() => setUmbra({ stage: "review" })}>
              {problem ?? tab.cta}
            </PrimaryButton>
          )}
        </div>
      </div>

      {app && (
        <p data-companion="umb-privacy-note" className="mt-3 flex items-start gap-2 px-2 text-[12px] leading-relaxed text-[#75757f]">
          {note.hidden ? <EyeOff size={13} className="mt-0.5 shrink-0 text-[#0100ff]" /> : <Eye size={13} className="mt-0.5 shrink-0" />}
          {note.text}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({ id, onClick, disabled, children }: { id: string; onClick(): void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      data-companion={id}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[46px] w-full items-center justify-center rounded-full bg-[#0100ff] text-[14.5px] text-white transition enabled:hover:bg-[#2020ff] disabled:bg-[#e8e8ee] disabled:text-[#9a9aa3]"
    >
      {children}
    </button>
  );
}

// ───────── modals: simulated wallet, registration, review ─────────

function Sheet({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[45] grid place-items-center bg-[#0b0b2a]/25 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        initial={{ y: 16, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.97 }}
        className="relative w-full max-w-[380px] rounded-[24px] bg-white p-6 shadow-[0_30px_80px_-30px_rgba(16,16,107,0.5)]"
      >
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-[#8a8a93] hover:bg-[#f4f4f6]">
            <X size={16} />
          </button>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

function Modals({ s }: { s: UmbraWebStore }) {
  const close = () => setUmbra({ stage: "idle" });
  const tab = TABS.find((t) => t.id === s.tab)!;
  return (
    <AnimatePresence>
      {s.stage === "connect" && (
        <Sheet key="connect" onClose={close}>
          <p className="text-[18px] tracking-[-0.02em]">Connect a wallet</p>
          <p className="mt-1 text-[13px] text-[#75757f]">Umbra works with the Solana wallet you already have. This demo uses a simulated one.</p>
          <button
            type="button"
            data-companion="umb-wallet-connect"
            onClick={() => setUmbra({ connected: true, stage: "idle" })}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-black/[0.07] px-4 py-3 text-left transition hover:border-[#0100ff] hover:bg-[#f6f6ff]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0100ff] text-white">
              <Wallet size={17} />
            </span>
            <span className="flex-1">
              <span className="block text-[14px]">Demo Wallet</span>
              <span className="block text-[12px] text-[#8a8a93]">Simulated · no real funds</span>
            </span>
            <span className="text-[12.5px] text-[#0100ff]">Connect</span>
          </button>
        </Sheet>
      )}
      {(s.stage === "register" || s.stage === "registering") && (
        <Sheet key="register" onClose={s.stage === "register" ? close : undefined}>
          <p className="text-[18px] tracking-[-0.02em]">Register your private account</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#75757f]">
            Your wallet signs a message that sets up your private keys on this device. Registration is visible on chain; your balances and transfers are not.
          </p>
          <button
            type="button"
            data-companion="umb-approve"
            disabled={s.stage === "registering"}
            onClick={register}
            className="mt-5 flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#0100ff] text-[14.5px] text-white disabled:opacity-70"
          >
            {s.stage === "registering" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Setting up keys…
              </>
            ) : (
              "Approve in wallet"
            )}
          </button>
        </Sheet>
      )}
      {(s.stage === "review" || s.stage === "proving" || s.stage === "submitting" || s.stage === "done") && (
        <Sheet key="review" onClose={s.stage === "review" || s.stage === "done" ? close : undefined}>
          {s.stage === "done" ? (
            <div className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ececff] text-[#0100ff]">
                <Check size={22} />
              </span>
              <p className="mt-3 text-[18px] tracking-[-0.02em]">Done</p>
              <p className="mt-1 text-[13px] text-[#75757f]">{s.lastAction}</p>
              <button type="button" onClick={close} className="mt-5 h-[42px] w-full rounded-full bg-[#f4f4f5] text-[14px] hover:bg-[#ebebee]">
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-[18px] tracking-[-0.02em]">Review {tab.label.toLowerCase()}</p>
              <dl className="mt-4 space-y-2.5 rounded-2xl bg-[#f4f4f5] p-4 text-[13px]">
                <Row k="Amount" v={`${s.amount} ${s.token}`} />
                {s.tab === "swap" && <Row k="Receive" v={`${s.swapTo}`} />}
                {s.tab === "send" && <Row k="To" v={`${s.recipient.slice(0, 4)}…${s.recipient.slice(-4)}`} />}
                {s.tab === "withdraw" && <Row k="To" v={`${s.destination.slice(0, 4)}…${s.destination.slice(-4)}`} />}
                <Row k="Protocol fee" v="0.10%" />
                <Row k="Relayer tip" v={s.tab === "deposit" ? "n/a" : "0.0004 SOL"} />
              </dl>
              <p className="mt-3 text-[12px] leading-relaxed text-[#75757f]">{PRIVACY_NOTE[s.tab].text}</p>
              <button
                type="button"
                data-companion="umb-approve"
                disabled={s.stage !== "review"}
                onClick={approve}
                className="mt-5 flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#0100ff] text-[14.5px] text-white disabled:opacity-80"
              >
                {s.stage === "review" ? (
                  "Approve in wallet"
                ) : (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {s.stage === "proving" ? "Generating proof on your device…" : "Submitting via relayer…"}
                  </>
                )}
              </button>
            </>
          )}
        </Sheet>
      )}
    </AnimatePresence>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between">
    <dt className="text-[#75757f]">{k}</dt>
    <dd className="text-[#171717]">{v}</dd>
  </div>
);
