import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, ShieldCheck, ShieldAlert, Layers } from "lucide-react";
import { AreaChart, ButtonLink, Card, ErrorNote, Label, PageHeader, Skeleton, SourceBadge, TokenIcon, compact, num } from "@/components/ui/primitives";
import { getOverview, getStats } from "@/lib/server/data";

export const dynamic = "force-dynamic";

const SLUGS: Record<string, { symbol: "USDC+" | "USDT+"; underlying: string }> = {
  "usdc-plus": { symbol: "USDC+", underlying: "USDC" },
  "usdt-plus": { symbol: "USDT+", underlying: "USDT" },
};

export default async function StablecoinPage({ params }: { params: Promise<{ symbol: string }> }) {
  const meta = SLUGS[(await params).symbol];
  if (!meta) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Stablecoin"
        title={meta.symbol}
        subtitle={`A dollar that earns. Deposit ${meta.underlying}, hold ${meta.symbol}, and watch its value grow as Solana lending interest accrues. Nothing to claim.`}
        actions={
          <>
            <ButtonLink href="/mint" data-companion="stablecoin-mint">
              <ArrowDownToLine size={16} /> Mint {meta.symbol}
            </ButtonLink>
            <ButtonLink href="/redeem" variant="ghost">
              <ArrowUpFromLine size={16} /> Redeem
            </ButtonLink>
          </>
        }
      />

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>}>
        <KeyStats symbol={meta.symbol} underlying={meta.underlying} />
      </Suspense>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Exchange rate, last 30 days</h2>
            <SourceBadge kind="live" />
          </div>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <RateChart />
          </Suspense>
        </Card>

        <Card data-companion="stablecoin-how" className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Layers size={17} className="text-[var(--accent-2)]" />
            <h2 className="font-semibold">How it works</h2>
          </div>
          <ol className="space-y-3 text-sm text-[var(--text)]">
            {[
              `You deposit ${meta.underlying}; a non-custodial program holds it. No human has the keys.`,
              "The program lends it across Solana money markets (Drift, Kamino, Jupiter Lend) for the best rate.",
              `Over-collateralised borrowers pay interest. That interest raises the value of every ${meta.symbol}.`,
              `Redeem any time for ${meta.underlying}, plus what it earned.`,
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="num grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px]">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card data-companion="stablecoin-risks" className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert size={17} className="text-amber-300" />
          <h2 className="font-semibold">Risks, plainly</h2>
        </div>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <Risk title="Variable yield" text="APY follows Solana lending demand. It can fall, and it is never guaranteed." />
          <Risk title="Smart-contract & venue risk" text="Risk compounds across every lending venue used. Withdrawal capacity depends on each venue's utilisation." />
          <Risk title="Insurance scope" text="Reflect's insurance layer is designed to cover principal only, not yield." icon={<ShieldCheck size={15} className="text-emerald-300" />} />
        </div>
        <p className="mt-4 text-[11px] text-[var(--muted)]">
          Source: Reflect developer documentation (risk framework). Audited by Offside Labs, Sep 2025. Reflect is a Circle Alliance member and is not affiliated with Circle.
        </p>
      </Card>
    </>
  );
}

async function KeyStats({ symbol, underlying }: { symbol: string; underlying: string }) {
  const r = await getOverview();
  if (!r.ok) return <ErrorNote title="Live data unavailable" message={r.data.error?.message} />;
  const s = r.data.stablecoins.find((c) => c.symbol === symbol);
  if (!s) return <ErrorNote title={`${symbol} is not returned by the API right now`} />;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card data-companion="stablecoin-apy">
        <div className="flex items-center justify-between">
          <Label>APY</Label>
          <SourceBadge kind="live" />
        </div>
        <p className="num mt-3 text-4xl font-semibold text-[var(--accent-2)]">{s.apy ? `${num(s.apy.percent)}%` : "n/a"}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">Raw API value {s.apy?.rawBps ?? "n/a"} (bps, inferred unit)</p>
      </Card>
      <Card data-companion="stablecoin-rate">
        <div className="flex items-center justify-between">
          <Label>Exchange rate</Label>
          <SourceBadge kind="live" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <TokenIcon symbol={symbol} />
          <p className="num text-3xl font-semibold">${s.exchangeRate?.usdPerToken.toFixed(6) ?? "n/a"}</p>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">1 {symbol} in USD. Only goes up as yield accrues.</p>
      </Card>
      <Card data-companion="stablecoin-supply">
        <div className="flex items-center justify-between">
          <Label>Supply</Label>
          <SourceBadge kind="live" />
        </div>
        <p className="num mt-3 text-3xl font-semibold">{s.supply ? compact(s.supply.current) : "n/a"}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(1, s.supply?.utilizationPercent ?? 0)}%` }} />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Cap {s.supply ? compact(s.supply.cap) : "n/a"} {symbol} · backed by {underlying}
        </p>
      </Card>
    </div>
  );
}

async function RateChart() {
  const r = await getStats(30);
  if (!r.ok || !r.data.history) return <ErrorNote title="History unavailable" message={r.data.error?.message} />;
  return (
    <AreaChart
      points={r.data.history.exchangeRate.map((p) => ({ label: p.date.slice(5), value: p.usdPerToken }))}
      format={(v) => `$${v.toFixed(5)}`}
    />
  );
}

function Risk({ title, text, icon }: { title: string; text: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-4">
      <p className="mb-1 flex items-center gap-1.5 font-medium">
        {icon}
        {title}
      </p>
      <p className="text-[var(--muted)]">{text}</p>
    </div>
  );
}
