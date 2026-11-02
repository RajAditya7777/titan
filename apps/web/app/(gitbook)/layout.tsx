import type { Metadata } from "next";
import { docsMono, docsSans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Developer Docs | Titan (independent demo)",
  description: "Titan developer docs, summarized for an independent demo. Not affiliated with Titan.",
};

/** The docs are their own site (as on GitBook), so they don't get the Titan app's header or ticker. */
export default function GitbookLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${docsSans.variable} ${docsMono.variable}`}>{children}</div>;
}
