import { PageHeader } from "@/components/ui/primitives";
import { TradeForm } from "@/components/pages/TradeForm";

export default function MintPage() {
  return (
    <>
      <PageHeader eyebrow="Mint" title="Deposit USDC, earn as USDC+" subtitle="Quotes are live from Reflect. You review everything before your wallet signs." />
      <TradeForm mode="mint" />
    </>
  );
}
