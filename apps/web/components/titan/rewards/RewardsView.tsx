"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Rocket, Sparkle } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { CAMPAIGNS, CAMPAIGNS_PER_PAGE, type Campaign } from "@/lib/products/titan/rewards";
import { displaySerif } from "@/lib/fonts";

/**
 * titan.exchange/rewards, rebuilt from measurements of the live page (1440px wide): 1280px column,
 * Geist body, a serif for headings, #33312e card borders, Titan gold #f2d363.
 */
export function RewardsView() {
  return (
    <div className={`${displaySerif.variable} mx-auto w-full max-w-[1280px] pb-20 pt-[159px]`}>
      <WalletPrompt />
      <Campaigns />
      <Vip />
    </div>
  );
}

const serif = "font-[family-name:var(--font-display)] font-normal tracking-[-0.01em]";

function WalletPrompt() {
  const { walletConnected, walletAddress, setWalletModalOpen, disconnectWallet } = useTitan();
  return (
    <section className="flex flex-col items-center text-center" data-companion="titan-rewards-wallet">
      {walletConnected ? (
        <>
          <h1 className={`${serif} text-[32px] leading-[40px] text-white`}>Your rewards</h1>
          <p className="mt-2 text-base text-[#e3e3e3]">
            {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)} has no rewards to claim right now.
          </p>
          <span className="mt-1 text-xs text-[#a8a69f]">Simulated wallet</span>
          <button type="button" onClick={disconnectWallet} className="mt-6 rounded-full border border-[#33312e] px-6 py-3 text-base font-medium text-white transition hover:bg-white/5 active:scale-95">
            Disconnect
          </button>
        </>
      ) : (
        <>
          <h1 className={`${serif} text-[32px] leading-[40px] text-white`}>Connect your wallet</h1>
          <p className="mt-2 text-base text-[#e3e3e3]">Please connect your wallet to continue.</p>
          <button
            type="button"
            onClick={() => setWalletModalOpen(true)}
            className="mt-6 rounded-full bg-[#f2d363] px-6 py-3 text-base font-medium text-[#0d0d0c] transition hover:brightness-105 active:scale-95"
          >
            Connect Wallet
          </button>
        </>
      )}
    </section>
  );
}

function Campaigns() {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(CAMPAIGNS.length / CAMPAIGNS_PER_PAGE);
  const shown = CAMPAIGNS.slice(page * CAMPAIGNS_PER_PAGE, (page + 1) * CAMPAIGNS_PER_PAGE);
  const from = page * CAMPAIGNS_PER_PAGE + 1;
  const to = from + shown.length - 1;
  return (
    <section className="mt-[100px]" data-companion="titan-rewards-campaigns">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[#20201d] text-[#f2d363]">
          <Rocket className="h-3.5 w-3.5" />
        </span>
        <h3 className={`${serif} text-lg leading-6 text-white`}>Campaigns</h3>
      </div>
      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <CampaignCard key={c.slug} c={c} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-sm text-white">
        <span className="mr-1">
          {from}-{to} <span className="text-[#a8a69f]">of {CAMPAIGNS.length}</span>
        </span>
        <PagerButton label="Previous campaigns" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </PagerButton>
        <PagerButton label="Next campaigns" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </PagerButton>
      </div>
    </section>
  );
}

function PagerButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full text-white transition enabled:hover:bg-white/10 enabled:active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function CampaignBadge({ c, size = 32 }: { c: Campaign; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold"
      style={{ width: size, height: size, background: c.badge.bg, color: c.badge.fg, fontSize: size * 0.36 }}
    >
      {c.badge.letters}
    </span>
  );
}

export function EndedPill() {
  return <span className="rounded-full bg-[#3a1820] px-1.5 py-0.5 text-xs leading-4 text-[#f34f6a]">Ended</span>;
}

function CampaignCard({ c }: { c: Campaign }) {
  return (
    <Link
      href={`/titan/rewards/${c.slug}`}
      data-companion="titan-rewards-campaign"
      className="group flex min-h-[150px] flex-col rounded-2xl border border-[#33312e] p-5 transition hover:border-[#4a4742] hover:bg-white/[0.02]"
    >
      <div className="flex items-center justify-between gap-2">
        <CampaignBadge c={c} />
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-[#20201d] px-1.5 py-0.5 text-xs leading-4 text-white">{c.dates}</span>
          <EndedPill />
        </div>
      </div>
      <p className="mt-3 text-base font-medium leading-6 text-white">{c.name}</p>
      <p className="text-sm leading-5 text-[#a8a69f]">{c.description}</p>
    </Link>
  );
}

const PERKS = [
  {
    title: "Priority lane",
    tag: "Includes sponsored txs",
    points: [
      "Priority Lane sends your trades through Galaxy's institutional-grade infrastructure for more speed and precision.",
      "VIPs get a limited number of sponsored transactions for free.",
    ],
  },
  { title: "Limit order fees", points: ["VIPs pay lower fees on Titan limit orders."] },
];

const CRITERIA = [
  { title: "Titan power trader", points: ["Recognized as a Top Trader on Titan"] },
  { title: "Community partnerships", points: ["First 1000 MonkeDAO holders to register", "First 2000 MadLads holders to register"] },
  { title: "Top Solana users", points: ["Titan × Byreal Social Quest winner", "Identified as a Top DeFi user"] },
];

function Vip() {
  return (
    <section className="mt-16" data-companion="titan-rewards-vip">
      <span className="inline-flex items-center rounded-md bg-[#2a2614] px-1.5 py-0.5 text-xs leading-4 text-[#f2d363]">VIP</span>
      <h3 className={`${serif} mt-3 text-[32px] leading-[40px] text-white`}>Titan VIP program</h3>
      <p className="mt-2 max-w-[520px] text-base leading-6 text-[#e3e3e3]">
        Titan VIP members get exclusive perks and first access to new features to gain even more trading edge on Solana.
      </p>

      <p className="mt-10 text-base font-medium text-[#a8a69f]">Perks</p>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {PERKS.map((p) => (
          <Feature key={p.title} {...p} />
        ))}
      </div>

      <p className="mt-12 text-base font-medium text-[#a8a69f]">Criteria</p>
      <div className="mt-4 grid gap-8 md:grid-cols-3">
        {CRITERIA.map((p) => (
          <Feature key={p.title} {...p} />
        ))}
      </div>
    </section>
  );
}

function Feature({ title, tag, points }: { title: string; tag?: string; points: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkle className="h-4 w-4 fill-[#f2d363] text-[#f2d363]" />
        <span className="text-xl font-medium leading-7 text-white">{title}</span>
        {tag && <span className="rounded-full bg-[#2a2614] px-2 py-0.5 text-xs text-[#f2d363]">{tag}</span>}
      </div>
      <ul className="mt-2 space-y-1 pl-6">
        {points.map((pt) => (
          <li key={pt} className="list-disc text-sm leading-5 text-[#a8a69f] marker:text-[#a8a69f]">
            {pt}
          </li>
        ))}
      </ul>
    </div>
  );
}
