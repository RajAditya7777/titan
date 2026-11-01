import { AreaChart, Card, PageHeader, SourceBadge, TokenIcon, usd, num } from "@/components/ui/primitives";
import { DEMO_ACTIVITY, DEMO_HOLDINGS, DEMO_YIELD_HISTORY } from "@/lib/demo-data";

export default function PortfolioPage() {
  const total = DEMO_HOLDINGS.reduce((s, h) => s + h.amount, 0);
  return (
    <>
      <PageHeader eyebrow="Portfolio" title={usd(total)} subtitle="Connect a wallet in a real integration to see your own holdings. Everything below is illustrative." actions={<SourceBadge kind="demo" />} />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card data-companion="portfolio-holdings" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Holdings</h2>
            <SourceBadge kind="demo" />
          </div>
          <div className="space-y-4">
            {DEMO_HOLDINGS.map((h) => (
              <div key={h.symbol} className="flex items-center gap-3">
                <TokenIcon symbol={h.symbol} />
                <div className="flex-1">
                  <p className="font-medium">{h.symbol}</p>
                  <p className="text-xs text-[var(--muted)]">Cost basis {usd(h.costBasis)}</p>
                </div>
                <div className="text-right">
                  <p className="num">{num(h.amount, 3)}</p>
                  <p className={`num text-xs ${h.amount > h.costBasis ? "text-emerald-300" : "text-[var(--muted)]"}`}>
                    {h.amount > h.costBasis ? `+${usd(h.amount - h.costBasis)}` : "n/a"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card data-companion="portfolio-yield" className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">USDC+ value, 30 days</h2>
            <SourceBadge kind="demo" />
          </div>
          <AreaChart points={DEMO_YIELD_HISTORY} format={(v) => usd(v)} />
        </Card>
      </div>
      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Your transactions</h2>
          <SourceBadge kind="demo" />
        </div>
        <div className="divide-y divide-[var(--line)] text-sm">
          {DEMO_ACTIVITY.map((a, i) => (
            <div key={i} className="flex justify-between py-3">
              <span>{a.type}</span>
              <span className="num">
                {num(a.amount)} {a.token}
              </span>
              <span className="text-[var(--muted)]">{a.at}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
