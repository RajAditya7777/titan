import { notFound } from "next/navigation";
import { DOC_PAGES, docBySlug } from "@/lib/products/titan/devdocs";
import { DocsShell } from "@/components/titan/devdocs/DocsShell";
import { DocsHome, INTRO_MARKDOWN, INTRO_TOC, PortalIntroduction, SummaryPage } from "@/components/titan/devdocs/pages";

export function generateStaticParams() {
  return DOC_PAGES.map((p) => ({ slug: p.slug ? p.slug.split("/") : [] }));
}

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const slug = ((await params).slug ?? []).join("/");
  const page = docBySlug(slug);
  if (!page) notFound();
  const isIntro = slug === "developers-portal/introduction";
  return (
    <DocsShell slug={slug} group={page.group} title={page.title} toc={isIntro ? INTRO_TOC : []} markdown={isIntro ? INTRO_MARKDOWN : `# ${page.title}`}>
      {isIntro ? <PortalIntroduction /> : slug === "" ? <DocsHome /> : <SummaryPage slug={slug} title={page.title} />}
    </DocsShell>
  );
}
