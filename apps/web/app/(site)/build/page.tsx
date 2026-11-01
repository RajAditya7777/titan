import { Code2, ShieldCheck, Sparkles } from "lucide-react";
import { ApiExplorer } from "@/components/site/widgets";
import { Container, CtaBand, CtaButton, PageHero, RiskStrip, SectionHeading, Steps } from "@/components/site/blocks";
import { OFFICIAL } from "@/lib/site/content";

export default function BuildPage() {
  return (
    <>
      <PageHero
        eyebrow="Build"
        title="Savings features, without the plumbing."
        subtitle="One REST API covers Earn, Create and Protect. Read rates and quotes, prepare transactions, and let your users sign with their own wallets."
        actions={
          <>
            <CtaButton href={OFFICIAL.api} variant="ink">
              Developer docs
            </CtaButton>
            <CtaButton href="/create" variant="outline">
              See Create
            </CtaButton>
          </>
        }
      />
      <section className="pb-6">
        <Container>
          <div className="flex flex-wrap gap-2 text-[13.5px]">
            {[
              { icon: <Code2 size={14} />, t: "REST API with a TypeScript SDK" },
              { icon: <ShieldCheck size={14} />, t: "Audited on-chain programs" },
              { icon: <Sparkles size={14} />, t: "Your branding throughout" },
            ].map((c) => (
              <span key={c.t} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg)] px-3.5 py-2 text-[var(--muted)]">
                {c.icon} {c.t}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <SectionHeading title="Try the read-only endpoints." aside="Responses come live from Reflect's API through this demo's MCP server, the same path the companion uses." />
          <ApiExplorer />
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <SectionHeading title="Pick your starting point." />
          <Steps
            items={[
              { title: "Integrate", text: "Add yield to balances your app already holds, using USDC+ or USDT+.", href: "/earn" },
              { title: "Create", text: "Launch a branded token and set how its yield is shared.", href: "/create" },
              { title: "Protect", text: "Offer protected or amplified positions on tokenised assets.", href: "/protect" },
            ]}
          />
        </Container>
      </section>

      <CtaBand />
      <RiskStrip>Integrations pass yield and risk through to your users. Show them the risks clearly. Read</RiskStrip>
    </>
  );
}
