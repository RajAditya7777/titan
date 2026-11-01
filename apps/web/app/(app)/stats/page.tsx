import { Suspense } from "react";
import { AreaChart, Card, ErrorNote, Label, PageHeader, Skeleton, SourceBadge, compact, num } from "@/components/ui/primitives";
import { getStats } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export default function StatsPage() {
  return (
    <>
      <PageHeader eyebrow="Statistics" title="Protocol, live." subtitle="Fetched through the Reflect MCP server from Reflect's public API." />
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}>
        <Stats />
      </Suspense>
    </>
  );
}

async function Stats() {
  const r = await getStats(30);
  if (!r.ok) return <ErrorNote title="Couldn't load protocol statistics" message={r.data.error?.message} />;
  const d = r.data;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4" data-companion="stats-metrics">
        {[
          ["Holders", compact(d.holders)],
          ["Total supply", compact(d.totalSupply)],
          ["Yield distributed", `$${compact(d.totalYieldDistributed)}`],
          ["Cumulative volume", compact(d.cumulativeVolume)],
        ].map(([label, value]) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <Label>{label}</Label>
              <SourceBadge kind="live" />
            </div>
            <p className="num mt-3 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card data-companion="stats-apy-history">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">USDC+ daily APY, 30 days</h2>
            <SourceBadge kind="live" />
          </div>
          {d.history?.apy.length ? (
            <AreaChart points={d.history.apy.map((p) => ({ label: p.date.slice(5), value: p.percent }))} format={(v) => `${num(v)}%`} />
          ) : (
            <p className="text-sm text-[var(--muted)]">No history returned.</p>
          )}
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">USDC+ price in USD, 30 days</h2>
            <SourceBadge kind="live" />
          </div>
          {d.history?.exchangeRate.length ? (
            <AreaChart points={d.history.exchangeRate.map((p) => ({ label: p.date.slice(5), value: p.usdPerToken }))} format={(v) => `$${v.toFixed(5)}`} />
          ) : (
            <p className="text-sm text-[var(--muted)]">No history returned.</p>
          )}
        </Card>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        The API&apos;s <code>tvl</code> field currently reports 1 and is not shown. Units for supply and volume assume 6 decimals.
      </p>
    </>
  );
}
