import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { Container, CtaBand, CtaButton, Pill } from "@/components/site/blocks";
import { CASE_STUDIES, FAMILY_LABEL, getAsset, getCaseStudy } from "@/lib/site/content";

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCaseStudy((await params).slug);
  return { title: c ? `${c.partner} case study · Reflect Companion (independent demo)` : "Case study not found" };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCaseStudy((await params).slug);
  if (!c) notFound();
  const assets = c.assetSlugs.map(getAsset).filter((a) => a !== null);

  return (
    <>
      <section className="pb-12 pt-32 md:pt-40">
        <Container className="max-w-[880px]">
          <Link href="/case-studies" className="text-[13.5px] text-[var(--muted)] hover:text-[var(--text)]">
            ← All case studies
          </Link>
          <div className="mt-6">
            <Pill tone="accent">{c.asset} · Protect</Pill>
          </div>
          <h1 className="mt-4 text-[40px] font-medium leading-[1.05] md:text-[58px]">
            {c.partner}: {c.headline.toLowerCase()}
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-[var(--muted)]">{c.summary}</p>
        </Container>
      </section>

      <section className="pb-12">
        <Container className="max-w-[880px] space-y-10">
          <div>
            <h2 className="text-[24px] font-medium">What changes for holders</h2>
            <ul className="mt-4 space-y-3">
              {c.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15.5px] leading-relaxed text-[var(--muted)]">
                  <Check size={18} className="mt-1 shrink-0 text-[var(--accent)]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[24px] font-medium">The two tokens</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {assets.map((a) => (
                <Link key={a.slug} href={`/assets/${a.slug}`} className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-5 py-4 transition hover:border-[var(--accent)]/40">
                  <span>
                    <span className="block font-medium">{a.name}</span>
                    <span className="text-[13px] text-[var(--muted)]">{FAMILY_LABEL[a.family]}</span>
                  </span>
                  <ArrowUpRight size={16} className="text-[var(--muted)]" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--bg)] p-5 text-[14px] leading-relaxed text-[var(--muted)]">
            This is an independent summary. For figures, dates and the partners&apos; own statements, read the original case study.
            <div className="mt-4">
              <CtaButton href={c.official} variant="outline">
                Original on reflect.money
              </CtaButton>
            </div>
          </div>
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
