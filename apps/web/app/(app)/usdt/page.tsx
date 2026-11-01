import { Suspense } from "react";
import { TradeForm } from "@/components/pages/TradeForm";
import { ErrorNote, Skeleton, SourceBadge, compact } from "@/components/ui/primitives";
import { getOverview } from "@/lib/server/data";

export const dynamic = "force-dynamic";

/**
 * USDT+ in one place: the trade card with Mint / Redeem tabs (as ?tab= links, so each tab is
 * addressable and the companion can navigate to it), then live details. Modelled on the layout
 * of app.reflect.money/usdt; original markup and copy.
 */
export default async function UsdtPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const mode = (await searchParams).tab === "redeem" ? "redeem" : "mint";
  return (
    <div className="pt-2">
      <Suspense fallback={<Skeleton className="mx-auto mb-6 h-6 w-28" />}>
        <ApyBadge />
      </Suspense>
      <TradeForm asset="USDT+" mode={mode} basePath="/usdt" />
      <Suspense fallback={<Skeleton className="mx-auto mt-6 h-48 max-w-[448px]" />}>
        <Details />
      </Suspense>
    </div>
  );
}

async function ApyBadge() {
  const r = await getOverview();
  const apy = r.ok ? r.data.stablecoins.find((s) => s.symbol === "USDT+")?.apy?.percent : undefined;
  return (
    <p className="mb-2 text-center text-[14px] text-[var(--muted)]">
      <span className="num font-medium text-[var(--good)]">{apy != null ? `${apy.toFixed(2)}% APY` : "APY unavailable"}</span> · variable
    </p>
  );
}

async function Details() {
  const r = await getOverview();
  const s = r.ok ? r.data.stablecoins.find((c) => c.symbol === "USDT+") : undefined;
  if (!s) return <div className="mx-auto mt-6 max-w-[448px]"><ErrorNote title="USDT+ details are unavailable right now" message={r.ok ? undefined : r.data.error?.message} /></div>;
  return (
    <section data-companion="usdt-details" className="card mx-auto mt-6 max-w-[448px] px-5 py-4 text-[15px]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Details</h2>
        <SourceBadge kind="live" />
      </div>
      <dl className="space-y-3">
        <Row k="APY" v={s.apy ? `${s.apy.percent.toFixed(2)}%` : "—"} />
        <Row k="1 USDT+ in USD" v={s.exchangeRate ? `$${s.exchangeRate.usdPerToken.toFixed(6)}` : "—"} />
        <Row k="Supply" v={s.supply ? `${compact(s.supply.current)} USDT+` : "—"} />
        <Row k="Backed by" v={s.underlying ?? "USDT"} />
        <Row k="Network" v="Solana" />
      </dl>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="num font-medium">{v}</dd>
    </div>
  );
}
