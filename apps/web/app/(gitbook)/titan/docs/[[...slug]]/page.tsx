import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DOC_PAGES, SPACES, docHref, originalHref, pageForPath } from "@/lib/products/titan/devdocs";
import { contentFor } from "@/lib/products/titan/docs/content";
import { toMarkdown, tocFor } from "@/lib/products/titan/docs/schema";
import { DocsShell } from "@/components/titan/devdocs/DocsShell";
import { DocBlocks } from "@/components/titan/devdocs/DocBlocks";
import { H1 } from "@/components/titan/devdocs/blocks";

export function generateStaticParams() {
  return DOC_PAGES.map((p) => ({ slug: docHref(p.space, p.slug).split("/").slice(3) }));
}

/** "<Page> | <Space> | Titan", as GitBook titles its tabs. */
export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const page = pageForPath((await params).slug ?? []);
  if (!page) return {};
  return { title: `${page.title} | ${SPACES[page.space].title} | Titan (independent demo)` };
}

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const page = pageForPath((await params).slug ?? []);
  if (!page) notFound();
  const content = contentFor(page.space, page.slug);
  const title = page.slug === "" ? (page.space === "developer" ? SPACES.developer.title : page.title) : page.title;
  return (
    <DocsShell
      space={page.space}
      slug={page.slug}
      group={page.group}
      title={title}
      toc={content ? tocFor(content) : []}
      markdown={content ? toMarkdown(title, content) : `# ${title}`}
    >
      {page.space === "products" && page.slug === "" && (
        // GitBook's cover banner. Titan's logo artwork isn't copied: a plain gold-on-dark band instead.
        <div aria-hidden className="mb-8 h-[180px] rounded-2xl border border-[#3d392e] bg-[radial-gradient(120%_140%_at_50%_0%,#3a3320_0%,#1d1d1d_60%)]" />
      )}
      <H1>{title}</H1>
      {content ? (
        <DocBlocks content={content} />
      ) : (
        <p className="mt-6 text-base text-[#c7c0a9]">
          Read this page on Titan&apos;s docs:{" "}
          <a href={originalHref(page.space, page.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#f2d364] underline">
            {title} <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      )}
    </DocsShell>
  );
}
