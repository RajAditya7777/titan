import { notFound } from "next/navigation";
import { CAMPAIGNS, campaignBySlug } from "@/lib/products/titan/rewards";
import { CampaignView } from "@/components/titan/rewards/CampaignView";

export function generateStaticParams() {
  return CAMPAIGNS.map((c) => ({ slug: c.slug }));
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = campaignBySlug((await params).slug);
  if (!c) notFound();
  return <CampaignView c={c} />;
}
