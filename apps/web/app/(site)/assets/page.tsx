import { AssetBrowser } from "@/components/site/widgets";
import { Container, CtaBand, PageHero, RiskStrip } from "@/components/site/blocks";

export default function AssetsPage() {
  return (
    <>
      <PageHero
        eyebrow="Assets"
        title="Every asset, side by side."
        subtitle={
          <>
            <b className="font-medium text-[var(--text)]">Earn</b> assets are plain yield stablecoins. <b className="font-medium text-[var(--text)]">Protected</b> assets give up some yield for a buffer. <b className="font-medium text-[var(--text)]">Amplified</b> assets earn more and take losses first.
          </>
        }
      />
      <section className="pb-8">
        <Container>
          <AssetBrowser />
        </Container>
      </section>
      <CtaBand />
      <RiskStrip>Each asset carries the risks of what it&apos;s built on, plus smart-contract risk. Amplified assets can lose all of their value. Read</RiskStrip>
    </>
  );
}
