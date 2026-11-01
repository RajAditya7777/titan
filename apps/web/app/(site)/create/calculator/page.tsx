import { RevenueCalculator } from "@/components/site/widgets";
import { Container, PageHero, RiskStrip } from "@/components/site/blocks";

export default function CalculatorPage() {
  return (
    <>
      <PageHero eyebrow="Revenue calculator" title="What could a savings product earn you?" subtitle="Change the numbers to see your yearly revenue and what your users would earn. The APY starts at today's live USDC+ rate." />
      <section className="pb-16">
        <Container>
          <RevenueCalculator />
        </Container>
      </section>
      <RiskStrip>These are estimates from your own assumptions. Real yields change daily, and deposits rarely stay constant for a year. Read</RiskStrip>
    </>
  );
}
