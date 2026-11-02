"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Key, RefreshCw, Copy, Check, Lock, Layers } from "lucide-react";
import type { UmbraStoreState, UmbraToken } from "@/lib/products/umbra/types";
import { SUPPORTED_TOKENS } from "@/lib/products/umbra/types";
import { umbraSimulator } from "@/lib/products/umbra/simulator";

interface Props {
  state: UmbraStoreState;
  onNavigateTab: (tab: "deposit" | "send" | "withdraw") => void;
}

export function AccountStatusPanel({ state, onNavigateTab }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    await umbraSimulator.syncNoteStore();
    setSyncing(false);
  };

  const handleRegister = async () => {
    await umbraSimulator.register();
  };

  const tokens: UmbraToken[] = ["SOL", "USDC", "USDT"];

  return (
    <div
      data-companion="umbra-account-card"
      className="relative overflow-hidden rounded-2xl border border-violet-900/30 bg-[#0d0d14]/90 p-6 backdrop-blur-xl shadow-2xl transition-all"
    >
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Nimbus Cryptographic Account</h3>
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-violet-300 border border-violet-500/25">
                Client-Side Proving
              </span>
            </div>
            <p className="text-xs text-white/50">Deterministic private keys derived in-browser. Zero real key exposure.</p>
          </div>
        </div>

        {/* Registration status badge */}
        <div data-companion="umbra-account-status" className="flex items-center gap-2">
          {state.registered ? (
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Registered on Solana</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Unregistered Account</span>
            </div>
          )}
        </div>
      </div>

      {/* Account Details & Platform Wallet */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Connected public wallet */}
        <div className="rounded-xl border border-white/[0.05] bg-black/40 p-4">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Connected Public Wallet (Solana)</span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/70">Fee Payer</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-white/90">
              {state.connectedAddress.slice(0, 8)}...{state.connectedAddress.slice(-8)}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(state.connectedAddress, "pub")}
              className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white"
            >
              {copied === "pub" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied === "pub" ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Derived platform wallet */}
        <div className="rounded-xl border border-white/[0.05] bg-black/40 p-4" data-companion="umbra-account-platform-wallet">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Derived Platform Wallet (Signer)</span>
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300">Confidential Signer</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {state.registered && state.platformWallet ? (
              <>
                <span className="font-mono text-xs font-medium text-violet-300">
                  {state.platformWallet.slice(0, 8)}...{state.platformWallet.slice(-8)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(state.platformWallet!, "plat")}
                  className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-200"
                >
                  {copied === "plat" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied === "plat" ? "Copied" : "Copy"}</span>
                </button>
              </>
            ) : (
              <span className="text-xs text-white/40 italic">Not yet derived (Registration required)</span>
            )}
          </div>
        </div>
      </div>

      {/* Registration callout if unregistered */}
      {!state.registered && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-black/40 p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/20 p-2 text-violet-300">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">One-Time Registration Required</h4>
              <p className="text-xs text-white/60">
                Binds your platform wallet to your identity on-chain so recipients can send to you.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-companion="umbra-account-register-btn"
            onClick={handleRegister}
            disabled={state.currentOperation.stage !== "idle" && state.currentOperation.stage !== "done" && state.currentOperation.stage !== "error"}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Derive & Register Account (Simulated)</span>
          </button>
        </div>
      )}

      {/* Balances Section: Public vs Private Shielded */}
      <div className="mt-6">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">Balances Overview</h4>
          </div>
          <button
            type="button"
            data-companion="umbra-account-sync-btn"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin text-violet-400" : ""}`} />
            <span>Sync note store ({state.noteCount} notes)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Public Balances */}
          <div data-companion="umbra-balance-public" className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-xs font-medium text-white/60">Public Wallet (Standard Solana)</span>
              <span className="text-[10px] text-amber-400/80">Visible on-chain</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {tokens.map((token) => (
                <div key={token} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white/90">
                      {token}
                    </span>
                    <span className="text-xs text-white/50">{SUPPORTED_TOKENS[token].name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-medium text-white/90">{state.publicBalances[token]}</span>
                    <span className="ml-1 text-[11px] text-white/40">{token}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={() => onNavigateTab("deposit")}
                className="w-full rounded-lg bg-white/[0.05] py-1.5 text-center text-xs font-medium text-white/80 hover:bg-white/[0.1] hover:text-white transition-colors"
              >
                Shield Funds →
              </button>
            </div>
          </div>

          {/* Shielded / Private Balances */}
          <div
            data-companion="umbra-balance-private"
            className="rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-950/20 to-black/40 p-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-violet-500/10">
              <span className="text-xs font-medium text-violet-300">Nimbus Shielded Pool</span>
              <span className="text-[10px] text-emerald-400">Encrypted Notes</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {tokens.map((token) => (
                <div key={token} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-violet-300">
                      {token}
                    </span>
                    <span className="text-xs text-white/50">{SUPPORTED_TOKENS[token].name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-violet-200">
                      {state.privateBalances[token]}
                    </span>
                    <span className="ml-1 text-[11px] text-violet-400">{token}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-violet-500/10 flex gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab("send")}
                className="flex-1 rounded-lg bg-violet-600/30 py-1.5 text-center text-xs font-medium text-violet-200 hover:bg-violet-600/50 hover:text-white transition-colors"
              >
                Send Privately
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("withdraw")}
                className="flex-1 rounded-lg bg-white/[0.05] py-1.5 text-center text-xs font-medium text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
              >
                Unshield
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
