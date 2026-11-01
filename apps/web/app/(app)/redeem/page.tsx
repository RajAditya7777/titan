import { PageHeader } from "@/components/ui/primitives";
import { TradeForm } from "@/components/pages/TradeForm";

export default function RedeemPage() {
  return (
    <>
      <PageHeader eyebrow="Redeem" title="Back to USDC, with your yield" subtitle="Burn USDC+ and receive USDC. Because USDC+ has grown in value, you get back more than you burn." />
      <TradeForm mode="redeem" />
    </>
  );
}
