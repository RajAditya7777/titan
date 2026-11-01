import Link from "next/link";
import { ArrowUpRight, Bug, CircleDollarSign, Landmark } from "lucide-react";
import { LossSimulator } from "@/components/site/widgets";
import { Container, CtaBand, CtaButton, FeatureGrid, PageHero, RiskStrip, SectionHeading, Steps } from "@/components/site/blocks";
import { ASSETS } from "@/lib/site/content";

const MARKETS: { category: string; slug: string }[] = [
  { category: "Private credit", slug: "protected-syrupusdc" },
  { category: "Lending vault", slug: "protected-steakhouse-usdg" },
  { category: "Yield-bearing stablecoin", slug: "protected-ehyusd" },
  { category: "Tokenised reinsurance", slug: "protected-reusd" },
  { category: "Tokenised mortgage credit", slug: "protected-prime" },
];

export default function ProtectPage() {
  return (
    <>
      <PageHero
        eyebrow="Protect"
        title="Choose how much risk you carry."
        subtitle="Protect splits a tokenised asset in two. The protected side gives up some yield for a buffer; the amplified side earns more for taking losses first."
        actions={
          <>
            <CtaButton href="/assets" variant="ink">
              Find a protected asset
            </CtaButton>
            <CtaButton href="#how" variant="outline">
              How the split works
            </CtaButton>
          </>
        }
        aside={
          <div data-companion="protect-sim">
            <LossSimulator />
          </div>
        }
      />

      <section className="pb-20">
        <Container>
          <SectionHeading title="What the buffer is for." aside="Cover comes only from the amplified side's capital. A loss bigger than that buffer still reaches protected holders." />
          <FeatureGrid
            items={[
              { icon: <CircleDollarSign size={18} />, title: "Depegs", text: "If the asset or a stablecoin it relies on slips below a dollar, the amplified side absorbs it first." },
              { icon: <Bug size={18} />, title: "Exploits", text: "Losses from a bug or attack in the underlying protocol hit the junior capital before anyone else." },
              { icon: <Landmark size={18} />, title: "Defaults", text: "When borrowers don't repay, the first losses come out of the amplified tranche." },
            ]}
          />
        </Container>
      </section>

      <section id="how" className="scroll-mt-24 pb-20">
        <Container>
          <SectionHeading title="Opting in takes three steps." />
          <Steps
            items={[
              { title: "Pick an asset", text: "Choose a tokenised asset that has a Protect market.", href: "/assets" },
              { title: "Pick a side", text: "Protected for a buffer and lower yield; amplified for higher yield and first loss." },
              { title: "Deposit", text: "You receive a token for your side. It can be held, moved or used elsewhere like any other token." },
            ]}
          />
          <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-[var(--muted)]">
            The yield split isn&apos;t fixed by Reflect: supply and demand on each side set how much of the protected side&apos;s yield goes to amplified holders as payment for the cover.
          </p>
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <SectionHeading title="Markets with protection." />
          <div className="divide-y divide-[var(--line)] rounded-[22px] border border-[var(--line)]">
            {MARKETS.map((m) => {
              const a = ASSETS.find((x) => x.slug === m.slug)!;
              return (
                <Link key={m.slug} href={`/assets/${m.slug}`} className="flex items-center justify-between px-5 py-4 transition hover:bg-[var(--bg)]">
                  <span>
                    <span className="block text-[13px] text-[var(--muted)]">{m.category}</span>
                    <span className="font-medium">{a.underlying}</span>
                  </span>
                  <span className="flex items-center gap-2 text-[13.5px] text-[var(--muted)]">
                    {a.underlyingIssuer} <ArrowUpRight size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <CtaBand />
      <RiskStrip>Protection is limited to the junior capital in each pool and is not insurance. Amplified holders can lose everything they deposit. Read</RiskStrip>
    </>
  );
}
