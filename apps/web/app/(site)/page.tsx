import Link from "next/link";
import { ArrowUpRight, Eye, FileCheck2, KeyRound } from "lucide-react";
import { ApiExplorer, LossSimulator, SavingsBuilder, YieldPreview } from "@/components/site/widgets";
import { StatsStrip } from "@/components/site/live";
import { Container, CtaBand, CtaButton, DarkHero, FeatureGrid, RiskStrip, SectionHeading, SplitPanel } from "@/components/site/blocks";
import { CASE_STUDIES, OFFICIAL } from "@/lib/site/content";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <DarkHero
        title="Stablecoins that"
        accent="save for you."
        subtitle={<>Earn on idle dollars, launch your own savings product, or add a safety buffer to tokenised assets. One platform, three ways in.</>}
        actions={
          <>
            <CtaButton href="/earn" variant="light">
              Start earning
            </CtaButton>
            <CtaButton href="/build" variant="accent">
              Build on it
            </CtaButton>
          </>
        }
      />

      <section className="py-20 md:py-28">
        <Container className="space-y-6">
          <SectionHeading title={<>More from every dollar you hold.</>} aside="Three products share one engine: diversified, over-collateralised lending on Solana." />
          <SplitPanel
            data-companion="home-yield-sim"
            widget={<YieldPreview />}
            title="Idle money, put to work."
            text="Hold USDC+ and your balance grows as borrowers pay interest. You can redeem whenever you like; no lock-ups, nothing to claim."
            link={{ href: "/earn", label: "How Earn works" }}
          />
          <SplitPanel
            data-companion="home-builder"
            reverse
            widget={<SavingsBuilder />}
            title="Your brand on a savings account."
            text="Offer your users a savings product under your own name, built from Reflect stablecoins. You choose the mix and your share of the yield."
            link={{ href: "/create", label: "How Create works" }}
          />
          <SplitPanel
            data-companion="home-tranche-sim"
            widget={<LossSimulator />}
            title="A buffer for people who want one."
            text="Split a tokenised asset into a protected side and an amplified side. One trades some yield for cover; the other takes losses first for more yield."
            link={{ href: "/protect", label: "How Protect works" }}
          />
        </Container>
      </section>

      <section className="pb-20 md:pb-28">
        <Container>
          <SectionHeading title="Built for builders, too." aside="Everything above is a few HTTP calls. Try the read-only endpoints live." />
          <ApiExplorer />
        </Container>
      </section>

      <section className="pb-20 md:pb-28">
        <Container>
          <SectionHeading title="Who builds on it." aside="Short stories from asset issuers that use Reflect's tranche markets." />
          <div className="grid gap-4 md:grid-cols-3">
            {CASE_STUDIES.map((c) => (
              <Link key={c.slug} href={`/case-studies/${c.slug}`} className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#0b0e12] p-6 text-white">
                <div aria-hidden className="absolute inset-0 opacity-60 transition-opacity group-hover:opacity-90" style={{ background: "radial-gradient(70% 60% at 100% 0%, rgba(59,139,234,0.45), transparent 70%)" }} />
                <p className="relative text-[13px] text-white/60">{c.asset}</p>
                <div className="relative">
                  <p className="text-[24px] font-medium">{c.partner}</p>
                  <p className="mt-1 text-[14px] text-white/70">{c.headline}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-medium">
                    Read the story <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-20 md:pb-28">
        <Container>
          <SectionHeading title="Trust, but check." aside="Reflect publishes its audits and risk method. Don't take this page's word for it: read them." />
          <FeatureGrid
            items={[
              { icon: <KeyRound size={18} />, title: "Non-custodial", text: "Funds sit in on-chain programs, not in a company account. Reflect can't move them for you." },
              { icon: <FileCheck2 size={18} />, title: "Independently audited", text: "Reflect's programs have published third-party audit reports you can read in full." },
              { icon: <Eye size={18} />, title: "Open numbers", text: "Supply, yield and allocation are public, and the figures on this site come straight from the API." },
            ]}
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton href={OFFICIAL.audits} variant="outline">
              Read the audits
            </CtaButton>
            <CtaButton href="/stats" variant="outline">
              Live statistics
            </CtaButton>
          </div>
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <StatsStrip />
        </Container>
      </section>

      <CtaBand />
      <RiskStrip>Yields are variable and not guaranteed. Deposits are not bank deposits and are not government insured. This is an independent demo; before using Reflect, read</RiskStrip>
    </>
  );
}
