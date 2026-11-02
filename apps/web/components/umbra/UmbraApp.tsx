"use client";

import { useEffect, useState } from "react";
import { Shield, EyeOff, ArrowDownRight, ArrowUpRight, Activity, Cpu, CheckCircle2, AlertOctagon, X } from "lucide-react";
import { umbraSimulator } from "@/lib/products/umbra/simulator";
import type { OperationType, UmbraStoreState, UmbraToken } from "@/lib/products/umbra/types";
import { AccountStatusPanel } from "./AccountStatusPanel";
import { DepositTab } from "./DepositTab";
import { PrivateSendTab } from "./PrivateSendTab";
import { WithdrawTab } from "./WithdrawTab";
import { PrivacyTransparencyCard } from "./PrivacyTransparencyCard";
import { SimulatedWalletModal } from "./SimulatedWalletModal";

export function UmbraApp() {
  const [state, setState] = useState<UmbraStoreState>(() => umbraSimulator.getState());
  const [activeTab, setActiveTab] = useState<"deposit" | "send" | "withdraw">("deposit");

  // Approval modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingOp, setPendingOp] = useState<{
    type: OperationType;
    token: UmbraToken;
    amount: string;
    recipient?: string;
    destination?: string;
  } | null>(null);

  useEffect(() => {
    const unsub = umbraSimulator.subscribe((next) => {
      setState(next);
    });
    return unsub;
  }, []);

  const handleRequestApproval = (
    operation: OperationType,
    details: { token: UmbraToken; amount: string; recipient?: string; destination?: string },
  ) => {
    setPendingOp({
      type: operation,
      ...details,
    });
    setModalOpen(true);
  };

  const handleApprove = async () => {
    if (!pendingOp) return;
    setModalOpen(false);

    if (pendingOp.type === "deposit") {
      await umbraSimulator.deposit(pendingOp.token, pendingOp.amount);
    } else if (pendingOp.type === "private_send" && pendingOp.recipient) {
      await umbraSimulator.privateSend(pendingOp.token, pendingOp.amount, pendingOp.recipient);
    } else if (pendingOp.type === "withdraw" && pendingOp.destination) {
      await umbraSimulator.withdraw(pendingOp.token, pendingOp.amount, pendingOp.destination);
    }
    setPendingOp(null);
  };

  const handleReject = () => {
    setModalOpen(false);
    setPendingOp(null);
  };

  const op = state.currentOperation;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-20">
      {/* Solana Summit Demo Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-black/40 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-violet-300">
          <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <strong className="font-semibold">Solana Summit Demo:</strong>
          <span className="text-white/70">Umbra Privacy & Nimbus Network Simulator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 text-[10px] font-medium text-violet-300">
            Zero Real Key Exposure
          </span>
          <button
            type="button"
            onClick={() => umbraSimulator.reset()}
            className="text-[11px] text-white/40 hover:text-white/80 transition-colors underline"
          >
            Reset Simulator
          </button>
        </div>
      </div>

      {/* Account Status Panel */}
      <AccountStatusPanel
        state={state}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* In-flight Operation Live Status Bar */}
      {op.stage !== "idle" && (
        <div
          className={`rounded-xl border p-4 backdrop-blur-xl transition-all ${
            op.stage === "error"
              ? "border-rose-500/30 bg-rose-950/20 text-rose-300"
              : op.stage === "done"
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
              : "border-violet-500/30 bg-violet-950/20 text-violet-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {op.stage === "error" ? (
                <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
              ) : op.stage === "done" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <Cpu className="h-5 w-5 text-violet-400 animate-spin shrink-0" />
              )}
              <div>
                <div className="text-xs font-semibold capitalize">
                  {op.type?.replace("_", " ")} — {op.stage}
                </div>
                <div className="text-xs text-white/80">{op.stageMessage}</div>
                {op.error?.technicalDetail && (
                  <div className="mt-1 text-[11px] text-rose-300/80">{op.error.technicalDetail}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {op.stage !== "error" && op.stage !== "done" && (
                <span className="font-mono text-xs font-medium text-violet-300">
                  {op.progressPercent}%
                </span>
              )}
              {(op.stage === "done" || op.stage === "error") && (
                <button
                  type="button"
                  onClick={() => umbraSimulator.clearOperation()}
                  className="rounded-lg bg-white/10 p-1 text-white/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {op.stage !== "error" && op.stage !== "done" && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${op.progressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          type="button"
          data-companion="umbra-nav-deposit"
          onClick={() => setActiveTab("deposit")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "deposit"
              ? "border-violet-500 text-white"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <ArrowDownRight className="h-4 w-4 text-violet-400" />
          <span>Shield / Deposit</span>
        </button>

        <button
          type="button"
          data-companion="umbra-nav-send"
          onClick={() => setActiveTab("send")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "send"
              ? "border-violet-500 text-white"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <EyeOff className="h-4 w-4 text-violet-400" />
          <span>Private Send</span>
        </button>

        <button
          type="button"
          data-companion="umbra-nav-withdraw"
          onClick={() => setActiveTab("withdraw")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "withdraw"
              ? "border-violet-500 text-white"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <ArrowUpRight className="h-4 w-4 text-violet-400" />
          <span>Withdraw / Unshield</span>
        </button>
      </div>

      {/* Active Tab Component */}
      <div className="transition-all">
        {activeTab === "deposit" && (
          <DepositTab state={state} onRequestApproval={handleRequestApproval} />
        )}
        {activeTab === "send" && (
          <PrivateSendTab state={state} onRequestApproval={handleRequestApproval} />
        )}
        {activeTab === "withdraw" && (
          <WithdrawTab state={state} onRequestApproval={handleRequestApproval} />
        )}
      </div>

      {/* Privacy Transparency Card */}
      <PrivacyTransparencyCard />

      {/* Simulated Wallet Approval Modal */}
      {pendingOp && (
        <SimulatedWalletModal
          isOpen={modalOpen}
          operation={pendingOp.type}
          details={{
            token: pendingOp.token,
            amount: pendingOp.amount,
            recipient: pendingOp.recipient,
            destination: pendingOp.destination,
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
