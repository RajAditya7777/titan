"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, CircleHelp } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { epochReward, howItWorks, type Campaign } from "@/lib/products/titan/rewards";
import { displaySerif } from "@/lib/fonts";
import { CampaignBadge, EndedPill } from "./RewardsView";

const serif = "font-[family-name:var(--font-display)] font-normal tracking-[-0.01em]";
const usd = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

/** titan.exchange/rewards/<campaign>: header, three stat cards, "How it works?", epoch tabs. */
export function CampaignView({ c }: { c: Campaign }) {
  const { walletConnected, setWalletModalOpen } = useTitan();
  const [epoch, setEpoch] = useState(0);
  const perEpoch = epochReward(c);

  return (
    <div className={`${displaySerif.variable} mx-auto w-full max-w-[1280px] pb-20 pt-10`}>
      <Link href="/titan/rewards" className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-white transition hover:bg-white/5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <header className="mt-6 flex flex-col items-center text-center">
        <CampaignBadge c={c} size={24} />
        <h1 className={`${serif} mt-3 text-[32px] leading-[40px] text-white`}>{c.name}</h1>
        <p className="mt-2 text-sm text-[#e3e3e3]">{c.description}</p>
        <div className="mt-3">
          <EndedPill />
        </div>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat icon={<Calendar className="h-3.5 w-3.5" />} value={c.dates} label="Campaign period" />
        {c.pool != null && <Stat icon={<UsdcDot />} value={usd(c.pool)} unit="USDC" label="Total rewards pool" />}
        {perEpoch != null && <Stat icon={<UsdcDot />} value={usd(perEpoch)} unit="USDC" label="Weekly epoch rewards" />}
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#20201d] text-[#f2d363]">
            <CircleHelp className="h-3.5 w-3.5" />
          </span>
          <h2 className={`${serif} text-lg text-white`}>How it works?</h2>
        </div>
        <div className="mt-4 grid gap-8 md:grid-cols-3">
          {howItWorks(c).map((h) => (
            <div key={h.title}>
              <p className="text-sm font-medium text-white">{h.title}</p>
              <p className="mt-1 break-words text-sm leading-5 text-[#a8a69f]">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div role="tablist" aria-label="Epochs" className="flex flex-wrap gap-4">
          {Array.from({ length: c.epochs }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={epoch === i}
              onClick={() => setEpoch(i)}
              className={`flex items-center gap-2 border-b-2 pb-1 text-sm transition ${epoch === i ? "border-[#f2d363] text-white" : "border-transparent text-[#a8a69f] hover:text-white"}`}
            >
              Epoch {i + 1}
              {epoch === i && <EndedPill />}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-4 rounded-2xl border border-[#33312e] p-6 text-center">
          {walletConnected ? (
            <p className="text-sm text-[#a8a69f]">
              No volume recorded for this wallet in Epoch {epoch + 1}. <span className="text-[#78766d]">(Simulated)</span>
            </p>
          ) : (
            <>
              <p className="text-sm text-[#a8a69f]">Connect your wallet to see your ranking for Epoch {epoch + 1}.</p>
              <button
                type="button"
                onClick={() => setWalletModalOpen(true)}
                className="mt-4 rounded-full bg-[#f2d363] px-5 py-2 text-sm font-medium text-[#0d0d0c] transition hover:brightness-105 active:scale-95"
              >
                Connect Wallet
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit?: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#33312e] p-4">
      <p className="flex items-center gap-2 text-2xl font-medium text-white">
        {icon !== null && <span className="text-[#f2d363]">{icon}</span>}
        {value}
        {unit && <span className="text-base font-normal text-[#a8a69f]">{unit}</span>}
      </p>
      <p className="mt-1 text-xs text-[#a8a69f]">{label}</p>
    </div>
  );
}

function UsdcDot() {
  return <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-[#2775ca] text-[9px] font-bold text-white">$</span>;
}
