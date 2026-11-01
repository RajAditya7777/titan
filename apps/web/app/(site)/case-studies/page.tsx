import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container, CtaBand, PageHero } from "@/components/site/blocks";
import { CASE_STUDIES } from "@/lib/site/content";

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero eyebrow="Case studies" title="How issuers use Reflect." subtitle="Three asset issuers that offer protected and amplified versions of their tokens, summarised in plain language." />
      <section className="pb-8">
        <Container className="grid gap-4 md:grid-cols-3">
          {CASE_STUDIES.map((c) => (
            <Link key={c.slug} href={`/case-studies/${c.slug}`} className="group flex min-h-[300px] flex-col justify-between rounded-[24px] border border-[var(--line)] p-6 transition hover:border-[var(--accent)]/40">
              <span className="text-[13px] text-[var(--muted)]">{c.asset}</span>
              <div>
                <p className="text-[26px] font-medium">{c.partner}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--muted)]">{c.summary}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-[14px] font-medium text-[var(--accent)]">
                  Read more <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
