import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Container, CtaButton, Pill, RiskStrip } from "@/components/site/blocks";
import { Skeleton, SourceBadge } from "@/components/ui/primitives";
import { getOverview } from "@/lib/server/data";
import { FAMILY_EXPLAINER, FAMILY_LABEL, OFFICIAL, getAsset, type Asset } from "@/lib/site/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getAsset((await params).slug);
  return { title: a ? `${a.name} · Reflect Companion (independent demo)` : "Asset not found" };
}

export default async function AssetPage({ params }: { params: Promise<{ slug: string }> }) {
  const asset = getAsset((await params).slug);
  if (!asset) notFound();
  const info = FAMILY_EXPLAINER[asset.family];
  const sibling = asset.sibling ? getAsset(asset.sibling) : null;
  const product = asset.family === "earn" ? { href: "/earn", label: "How Earn works" } : { href: "/protect", label: "How Protect works" };

  return (
    <>
      <section className="pb-10 pt-32 md:pt-40">
        <Container>
          <Link href="/assets" className="text-[13.5px] text-[var(--muted)] hover:text-[var(--text)]">
            ← All assets
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Pill tone={asset.family === "earn" ? "good" : asset.family === "protected" ? "accent" : "warn"}>{FAMILY_LABEL[asset.family]}</Pill>
            <Pill>{info.position}</Pill>
          </div>
          <h1 className="mt-4 text-[44px] font-medium leading-[1.05] md:text-[64px]">{asset.name}</h1>
          <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-[var(--muted)]">{asset.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {asset.liveSymbol === "USDT+" ? (
              <CtaButton href="/usdt" variant="ink">
                Mint USDT+ in the app
              </CtaButton>
            ) : asset.liveSymbol === "USDC+" ? (
              <CtaButton href="/mint" variant="ink">
                Mint USDC+ in the app
              </CtaButton>
            ) : null}
            <CtaButton href={product.href} variant="outline">
              {product.label}
            </CtaButton>
          </div>
        </Container>
      </section>

      <section className="pb-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-12">
            <Block title="Where the yield comes from">
              <p>{info.yieldSource(asset)}</p>
              {sibling && (
                <p className="mt-3">
                  The other side of this pool is{" "}
                  <Link href={`/assets/${sibling.slug}`} className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
                    {sibling.name}
                  </Link>
                  .
                </p>
              )}
            </Block>

            <Block title="Who's involved">
              <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
                <Party role="Token issuer" name="Reflect" />
                <Party role={`${asset.underlying} issuer`} name={asset.underlyingIssuer} />
              </div>
            </Block>

            <Block title="Risks to understand">
              <ul className="grid gap-3 sm:grid-cols-2">
                {info.risks.map((r) => (
                  <li key={r.title} className="rounded-2xl bg-[var(--bg)] p-4">
                    <p className="font-medium text-[var(--text)]">{r.title}</p>
                    <p className="mt-1 text-[14px]">{r.text}</p>
                  </li>
                ))}
              </ul>
            </Block>
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="card p-6">
              <dl className="space-y-3.5 text-[14px]">
                <Fact k="Family" v={FAMILY_LABEL[asset.family]} />
                <Fact k="Position" v={info.position} />
                <Fact k="Built on" v={asset.underlying} />
                <Fact k="Network" v="Solana" />
              </dl>
              <div className="mt-5 border-t border-[var(--line)] pt-5">
                {asset.liveSymbol ? (
                  <Suspense fallback={<Skeleton className="h-16" />}>
                    <LiveFacts asset={asset} />
                  </Suspense>
                ) : (
                  <p className="text-[13px] leading-relaxed text-[var(--muted)]">Tranche yields, coverage and caps aren&apos;t in Reflect&apos;s public API, so this demo doesn&apos;t show them. See the official page for live terms.</p>
                )}
              </div>
            </div>
            <a href={`${OFFICIAL.site}/assets/${asset.slug}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-5 py-4 text-[14px] font-medium hover:bg-[var(--bg)]">
              Official asset page on reflect.money <ArrowUpRight size={15} />
            </a>
          </aside>
        </Container>
      </section>

      <RiskStrip>This page is a plain-language summary, not an offer. Before depositing, check the official asset page and</RiskStrip>
    </>
  );
}

async function LiveFacts({ asset }: { asset: Asset }) {
  const r = await getOverview();
  const s = r.ok ? r.data.stablecoins.find((c) => c.symbol === asset.liveSymbol) : undefined;
  return (
    <dl className="space-y-3.5 text-[14px]">
      <div className="flex items-center justify-between">
        <dt className="text-[var(--muted)]">Live data</dt>
        <dd>
          <SourceBadge kind="live" />
        </dd>
      </div>
      <Fact k="Current APY" v={s?.apy ? `${s.apy.percent.toFixed(2)}%` : "—"} accent />
      <Fact k={`1 ${asset.name} in USD`} v={s?.exchangeRate ? `$${s.exchangeRate.usdPerToken.toFixed(6)}` : "—"} />
    </dl>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[24px] font-medium">{title}</h2>
      <div className="mt-3 text-[15.5px] leading-relaxed text-[var(--muted)]">{children}</div>
    </div>
  );
}

function Party({ role, name }: { role: string; name: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 text-[14.5px]">
      <span className="text-[var(--muted)]">{role}</span>
      <span className="font-medium text-[var(--text)]">{name}</span>
    </div>
  );
}

function Fact({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className={`num text-right font-medium ${accent ? "text-[var(--accent)]" : ""}`}>{v}</dd>
    </div>
  );
}
