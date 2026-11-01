import { Suspense } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, ErrorNote, Label, PageHeader, Skeleton, SourceBadge, ButtonLink, TokenIcon, usd, num, compact } from "@/components/ui/primitives";
import { DEMO_HOLDINGS } from "@/lib/demo-data";
import { NewUserHelp } from "@/components/pages/NewUserHelp";
import { getEvents, getOverview } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const balance = DEMO_HOLDINGS.reduce((s, h) => s + h.amount, 0);
  // No wallet can connect in this demo, so no visitor has deposited: everyone gets the new-user help.
  // With real wallets this becomes "the connected wallet holds no Reflect stablecoins".
  const hasDeposited = false;
  return (
    <>
      <PageHeader eyebrow="Dashboard" title="Your money, earning." subtitle="Hold dollars that grow on their own. Mint to start earning; redeem any time." />

      <NewUserHelp hasDeposited={hasDeposited} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-companion="dashboard-balance" className="md:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Total balance</Label>
            <SourceBadge kind="demo" />
          </div>
          <p className="num mt-3 text-4xl font-semibold md:text-5xl">{usd(balance)}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--good)]">
            <TrendingUp size={15} /> +{usd(30.51)} yield earned this month
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/mint" data-companion="dashboard-mint">
              <ArrowDownToLine size={16} /> Mint
            </ButtonLink>
            <ButtonLink href="/redeem" variant="ghost" data-companion="dashboard-redeem">
              <ArrowUpFromLine size={16} /> Redeem
            </ButtonLink>
          </div>
        </Card>

        <Card data-companion="dashboard-apy" className="relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/25 blur-3xl" />
          <div className="flex items-center justify-between">
            <Label>USDC+ APY</Label>
            <SourceBadge kind="live" />
          </div>
          <Suspense fallback={<Skeleton className="mt-4 h-12 w-32" />}>
            <LiveApy />
          </Suspense>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">Variable. Earned from Solana lending markets, paid by the token growing in value.</p>
        </Card>
      </div>

      <section className="mt-10" data-companion="dashboard-stablecoins">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Stablecoins</h2>
          <SourceBadge kind="live" />
        </div>
        <Suspense fallback={<div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>}>
          <StablecoinCards />
        </Suspense>
      </section>

      <section className="mt-10" data-companion="dashboard-activity">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent protocol activity</h2>
          <SourceBadge kind="live" />
        </div>
        <Suspense fallback={<Skeleton className="h-56" />}>
          <Activity />
        </Suspense>
      </section>
    </>
  );
}

async function LiveApy() {
  const r = await getOverview();
  const usdc = r.data.stablecoins?.find((s) => s.symbol === "USDC+");
  if (!r.ok || !usdc?.apy) return <p className="mt-4 text-sm text-[var(--bad)]">APY unavailable right now.</p>;
  return (
    <p className="num mt-3 text-4xl font-semibold text-[var(--text)]">
      {num(usdc.apy.percent)}
      <span className="text-2xl text-[var(--muted)]">%</span>
    </p>
  );
}

async function StablecoinCards() {
  const r = await getOverview();
  if (!r.ok) return <ErrorNote title="Couldn't load stablecoins from Reflect" message={r.data.error?.message} />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {r.data.stablecoins.map((s) => (
        <Link key={s.index} href={s.symbol === "USDC+" ? "/stablecoins/usdc-plus" : "/stablecoins/usdt-plus"} className="card group p-5 transition hover:border-[var(--accent)]/40">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={s.symbol} />
            <div className="flex-1">
              <p className="font-semibold">{s.symbol}</p>
              <p className="text-xs text-[var(--muted)]">Backed by {s.underlying ?? "n/a"}</p>
            </div>
            <ArrowUpRight size={18} className="text-[var(--muted)] transition group-hover:text-[var(--text)]" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <Metric label="APY" value={s.apy ? `${num(s.apy.percent)}%` : "n/a"} accent />
            <Metric label="Price" value={s.exchangeRate ? `$${s.exchangeRate.usdPerToken.toFixed(4)}` : "n/a"} />
            <Metric label="Supply" value={s.supply ? compact(s.supply.current) : "n/a"} />
          </div>
        </Link>
      ))}
    </div>
  );
}

async function Activity() {
  const r = await getEvents(6);
  if (!r.ok) return <ErrorNote title="Couldn't load recent events" message={r.data.error?.message} />;
  if (!r.data.events.length) return <p className="text-sm text-[var(--muted)]">No recent events.</p>;
  return (
    <div className="card divide-y divide-[var(--line)]">
      {r.data.events.map((e, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 text-sm">
          <span className={`grid h-8 w-8 place-items-center rounded-full ${e.type === "Mint" ? "bg-emerald-50 text-emerald-700" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}>
            {e.type === "Mint" ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
          </span>
          <div className="flex-1">
            <p className="font-medium">{e.type}</p>
            <p className="text-xs text-[var(--muted)]">
              {e.signer} · {new Date(e.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <p className="num">{e.amount != null ? `${num(e.amount)}` : "n/a"}</p>
          {e.explorer && (
            <a href={e.explorer} target="_blank" rel="noreferrer" className="text-xs text-[var(--muted)] hover:text-[var(--text)]">
              Solscan ↗
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className={`num mt-0.5 font-medium ${accent ? "text-[var(--accent-2)]" : ""}`}>{value}</p>
    </div>
  );
}
