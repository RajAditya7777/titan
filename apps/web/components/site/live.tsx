import { Suspense } from "react";
import { SourceBadge, Skeleton } from "@/components/ui/primitives";
import { getOverview, getStats } from "@/lib/server/data";

/** Protocol totals, rendered on the server and streamed in behind a skeleton. */
export function StatsStrip() {
  return (
    <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>}>
      <Stats />
    </Suspense>
  );
}

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

async function Stats() {
  const [s, o] = await Promise.all([getStats(), getOverview()]);
  const apy = o.ok ? o.data.stablecoins.find((c) => c.symbol === "USDC+")?.apy?.percent : undefined;
  const items = [
    { label: "Cumulative volume", value: s.ok ? money(s.data.cumulativeVolume) : null },
    { label: "Holders", value: s.ok ? s.data.holders.toLocaleString("en-US") : null },
    { label: "Yield distributed", value: s.ok ? money(s.data.totalYieldDistributed) : null },
    { label: "USDC+ APY", value: apy != null ? `${apy.toFixed(2)}%` : null },
  ];
  return (
    <div data-companion="home-stats">
      <div className="grid gap-4 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-[22px] bg-[var(--bg)] p-6">
            <p className="num text-[34px] font-medium leading-none">{it.value ?? "—"}</p>
            <p className="mt-3 text-[13.5px] text-[var(--muted)]">{it.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
        <SourceBadge kind="live" />
        {s.ok && o.ok ? "From Reflect's public API. APY is variable." : "Some figures are unavailable right now; Reflect's API didn't answer in time."}
      </div>
    </div>
  );
}
