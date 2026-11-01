import { Suspense } from "react";
import { ArrowLeftRight, Gauge, KeyRound, Layers, LineChart, Radar } from "lucide-react";
import { YieldPreview } from "@/components/site/widgets";
import { Container, CtaBand, CtaButton, FeatureGrid, PageHero, RiskStrip, SectionHeading, Steps } from "@/components/site/blocks";
import { Skeleton, SourceBadge, TokenIcon } from "@/components/ui/primitives";
import { getOverview } from "@/lib/server/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function EarnPage() {
  return (
    <>
      <PageHero
        eyebrow="Earn"
        title="Let idle dollars earn their keep."
        subtitle="Swap USDC or USDT for USDC+ or USDT+. Your balance grows from lending interest while you hold it, and you can swap back at any time."
        actions={
          <>
            <CtaButton href="/usdt" variant="ink">
              Try it in the app
            </CtaButton>
            <CtaButton href="#how" variant="outline">
              How it works
            </CtaButton>
          </>
        }
        aside={<YieldPreview />}
      />

      <section className="pb-20">
        <Container>
          <FeatureGrid
            items={[
              { icon: <LineChart size={18} />, title: "Grows in place", text: "Yield raises each token's value, so there's nothing to stake or claim." },
              { icon: <ArrowLeftRight size={18} />, title: "Exit when you want", text: "No lock-up. Redemptions depend on how much the lending markets can release at that moment." },
              { icon: <KeyRound size={18} />, title: "You hold the keys", text: "Funds live in on-chain programs. Nobody at Reflect can move them for you." },
            ]}
          />
        </Container>
      </section>

      <section id="how" className="scroll-mt-24 pb-20">
        <Container>
          <SectionHeading title="Three parts, one balance." aside="What happens to a dollar between the moment you deposit it and the moment you redeem it." />
          <Steps
            items={[
              { title: "Routing", text: "Deposits are spread across several Solana money markets instead of one, so no single venue carries everything." },
              { title: "Monitoring", text: "Liquidity, rates and incidents are watched continuously, and allocations shift when conditions change." },
              { title: "Venue scoring", text: "A market has to pass checks on liquidity, collateral quality and security before any money goes in." },
            ]}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: <Layers size={16} />, k: "Liquidity", v: "Can the venue return deposits quickly?" },
              { icon: <Gauge size={16} />, k: "Collateral", v: "Do borrowers post more than they borrow, in sound assets?" },
              { icon: <Radar size={16} />, k: "Security", v: "Is the code audited and the venue's history clean?" },
            ].map((c) => (
              <div key={c.k} className="flex items-start gap-3 rounded-2xl border border-[var(--line)] p-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">{c.icon}</span>
                <div>
                  <p className="font-medium">{c.k}</p>
                  <p className="text-[14px] text-[var(--muted)]">{c.v}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <SectionHeading title="Pick your dollar." />
          <Suspense fallback={<div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>}>
            <CoinCards />
          </Suspense>
        </Container>
      </section>

      <CtaBand />
      <RiskStrip>The APY is variable and comes from lending markets that can fail. Earn tokens are not bank deposits and are not insured by any government. Read</RiskStrip>
    </>
  );
}

async function CoinCards() {
  const r = await getOverview();
  const coins = [
    { symbol: "USDC+", underlying: "USDC", slug: "usdc-plus" },
    { symbol: "USDT+", underlying: "USDT", slug: "usdt-plus" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2" data-companion="earn-apy">
      {coins.map((c) => {
        const live = r.ok ? r.data.stablecoins.find((s) => s.symbol === c.symbol) : undefined;
        return (
          <Link key={c.symbol} href={`/assets/${c.slug}`} className="group rounded-[24px] bg-[var(--bg)] p-6 transition hover:bg-[var(--surface-2)]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-[20px] font-medium">
                <TokenIcon symbol={c.symbol} size={36} /> {c.symbol}
              </span>
              <SourceBadge kind="live" />
            </div>
            <p className="num mt-8 text-[44px] font-medium leading-none text-[var(--accent)]">{live?.apy ? `${live.apy.percent.toFixed(2)}%` : "—"}</p>
            <p className="mt-2 text-[14px] text-[var(--muted)]">Variable APY on {c.underlying}{live?.exchangeRate ? ` · 1 ${c.symbol} = $${live.exchangeRate.usdPerToken.toFixed(4)}` : ""}</p>
          </Link>
        );
      })}
    </div>
  );
}
