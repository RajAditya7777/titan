import { BarChart3, Bell, Palette } from "lucide-react";
import { RevenueSplit, SavingsBuilder } from "@/components/site/widgets";
import { Container, CtaBand, CtaButton, FeatureGrid, PageHero, RiskStrip, SectionHeading, SplitPanel } from "@/components/site/blocks";
import { ASSETS, FAMILY_LABEL } from "@/lib/site/content";
import Link from "next/link";

export default function CreatePage() {
  const options = ASSETS.filter((a) => a.family !== "amplified");
  return (
    <>
      <PageHero
        eyebrow="Create"
        title="Offer savings under your own name."
        subtitle="Give your users a savings account with your branding, built from Reflect assets. You pick what goes in and how the yield is shared."
        actions={
          <>
            <CtaButton href="/build" variant="ink">
              Start building
            </CtaButton>
            <CtaButton href="/assets" variant="outline">
              Browse assets
            </CtaButton>
          </>
        }
        aside={<SavingsBuilder />}
      />

      <section className="pb-20">
        <Container>
          <SectionHeading title="Choose what's inside." aside="Start with a plain yield stablecoin, or add a protected tranche for users who want a buffer. Every asset is scored before it's listed." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((a) => (
              <Link key={a.slug} href={`/assets/${a.slug}`} className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-5 py-4 transition hover:border-[var(--accent)]/40">
                <span>
                  <span className="block font-medium">{a.name}</span>
                  <span className="text-[13px] text-[var(--muted)]">{a.underlyingIssuer}</span>
                </span>
                <span className="text-[12px] text-[var(--muted)]">{FAMILY_LABEL[a.family]}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <SplitPanel
            widget={<RevenueSplit />}
            title="You set the split."
            text="Keep a share of the yield as revenue and pass the rest to your users. A higher share earns you more but makes the product less attractive; the calculator helps you find the balance."
            link={{ href: "/create/calculator", label: "Open the revenue calculator" }}
          />
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <SectionHeading title="Run it like a product." />
          <FeatureGrid
            items={[
              { icon: <Palette size={18} />, title: "Your brand", text: "Name, ticker and look are yours. Users see your product, not ours." },
              { icon: <BarChart3 size={18} />, title: "Usage data", text: "Deposits, redemptions and transfers are available through the API, by account, asset or time." },
              { icon: <Bell size={18} />, title: "Account alerts", text: "Get notified about large deposits or redemptions on the accounts you manage." },
            ]}
          />
        </Container>
      </section>

      <CtaBand />
      <RiskStrip>Yields are variable and passed through from the underlying assets, along with their risks. Your users should understand them before depositing. Read</RiskStrip>
    </>
  );
}
