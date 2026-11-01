import { z } from "zod";
import { bpsToPercent, exchangeRateToNumber, fromBaseUnits, KNOWN_STABLECOINS } from "@companion/reflect-api";
import { API_SOURCE, defineTool, failFrom, ok } from "../tool";

export const AssetSchema = z.enum(["USDC+", "USDT+"]).describe("Reflect stablecoin symbol");
export const ASSET_INDEX = { "USDC+": 0, "USDT+": 1 } as const;

const symbolOf = (index: number) =>
  KNOWN_STABLECOINS[index as keyof typeof KNOWN_STABLECOINS]?.symbol ?? `index ${index}`;

export const stablecoinOverview = defineTool({
  name: "reflect_get_stablecoin_overview",
  title: "Stablecoin overview",
  description:
    "Live overview of Reflect's yield-bearing stablecoins: which exist, current APY, exchange rate vs USD, and supply cap/usage. Use for questions like 'what is USDC+', 'what APY do I get', 'compare the stablecoins'.",
  readOnly: true,
  inputSchema: {
    asset: AssetSchema.optional().describe("Limit to one stablecoin. Omit to get all."),
  },
  async handler({ asset }, { reflect }) {
    try {
      const [types, limits, rates] = await Promise.all([
        reflect.getStablecoinTypes(),
        reflect.getSupplyLimits(),
        reflect.getExchangeRates(),
      ]);
      const wanted = asset ? types.filter((t) => t.index === ASSET_INDEX[asset]) : types;

      // `/stablecoin/apy` (all) currently 404s upstream, so fan out per index and tolerate gaps.
      const apys = await Promise.all(
        wanted.map((t) =>
          reflect.getApy(t.index).then(
            (a) => ({ index: t.index, bps: a.apy, at: a.timestamp }),
            () => ({ index: t.index, bps: null as number | null, at: null as string | null }),
          ),
        ),
      );

      const stablecoins = wanted.map((t) => {
        const limit = limits.find((l) => l.index === t.index);
        const rate = rates.find((r) => r.stablecoin === t.index);
        const apy = apys.find((a) => a.index === t.index);
        return {
          symbol: t.name,
          index: t.index,
          underlying: KNOWN_STABLECOINS[t.index as keyof typeof KNOWN_STABLECOINS]?.underlying ?? null,
          apy: apy?.bps == null ? null : { percent: round(bpsToPercent(apy.bps), 2), rawBps: apy.bps, asOf: apy.at },
          exchangeRate: rate
            ? { usdPerToken: round(exchangeRateToNumber(rate.base_usd_value_bps), 6), asOf: rate.timestamp }
            : null,
          // `/stablecoin/limits` reports WHOLE tokens, unlike every other amount (6-decimal base
          // units). Inferred: 1,501,486 USDC+ matches /stats supply ≈ 1.87M; as base units it
          // would be $1.50 across 6,559 holders. See RESEARCH.md.
          supply: limit
            ? {
                current: limit.currentSupply,
                cap: limit.supplyCap,
                remaining: limit.remainingCapacity,
                utilizationPercent: limit.utilizationPercentage,
              }
            : null,
        };
      });

      return ok(
        {
          stablecoins,
          notes: [
            "APY is variable, not guaranteed; it comes from interest paid by over-collateralised borrowers on Solana lending markets.",
            "USDC+ appreciates in value in the wallet: no claiming. 1 USDC+ is redeemable for slightly more than 1 USDC.",
            "APY unit inferred as basis points; supply figures are whole tokens (see RESEARCH.md).",
          ],
        },
        "live",
        [API_SOURCE],
      );
    } catch (err) {
      return failFrom(err);
    }
  },
});

export const protocolStats = defineTool({
  name: "reflect_get_protocol_stats",
  title: "Protocol statistics",
  description:
    "Live protocol statistics (holders, total supply, cumulative volume, yield distributed) plus optional APY and exchange-rate history for a stablecoin. Use for dashboards and 'how big is Reflect' questions.",
  readOnly: true,
  inputSchema: {
    historyDays: z.number().int().min(1).max(90).optional().describe("Include daily history for this many days"),
    asset: AssetSchema.default("USDC+"),
  },
  async handler({ historyDays, asset }, { reflect }) {
    try {
      const stats = await reflect.getProtocolStats();
      const index = ASSET_INDEX[asset];
      const history = historyDays
        ? await Promise.all([reflect.getApyHistory(index, historyDays), reflect.getExchangeRateHistory(index, historyDays)])
        : null;

      return ok(
        {
          holders: stats.users,
          totalSupply: fromBaseUnits(stats.supply),
          // Unlike supply, these two arrive in whole USD (upstream 50075793 ↔ "$50.1M" on
          // reflect.money), so they must not be divided by the token's 10^6 base unit.
          cumulativeVolume: Number(stats.cumulativeVolume),
          totalYieldDistributed: Number(stats.totalYieldDistributed),
          history: history
            ? {
                asset,
                apy: history[0].data.map((d) => ({ date: d.timestamp.slice(0, 10), percent: round(d.daily_rate_bps / 100, 2) })),
                exchangeRate: downsampleDaily(history[1]).map((r) => ({
                  date: r.timestamp.slice(0, 10),
                  usdPerToken: round(exchangeRateToNumber(r.base_usd_value_bps), 6),
                })),
              }
            : null,
          notes: ["The upstream `tvl` field currently reports 1 and is omitted; supply is the better size signal."],
        },
        "live",
        [API_SOURCE],
      );
    } catch (err) {
      return failFrom(err);
    }
  },
});

export const protocolEvents = defineTool({
  name: "reflect_get_protocol_events",
  title: "Recent protocol events",
  description: "Most recent on-chain Reflect events (mints, redeems) with amounts, time and Solana signature.",
  readOnly: true,
  inputSchema: { limit: z.number().int().min(1).max(50).default(10) },
  async handler({ limit }, { reflect }) {
    try {
      const events = await reflect.getRecentEvents(limit);
      return ok(
        {
          events: events.map((e) => ({
            type: e.type,
            at: e.timestamp,
            signer: e.signer ? shortAddress(e.signer) : null,
            amount: decodeHexAmount(e.event?.data?.stableAmount),
            signature: e.transaction_id ?? null,
            explorer: e.transaction_id ? `https://solscan.io/tx/${e.transaction_id}` : null,
          })),
          notes: ["`amount` is decoded from the hex-encoded u64 `stableAmount` field with 6 decimals (inferred encoding)."],
        },
        "live",
        [API_SOURCE],
      );
    } catch (err) {
      return failFrom(err);
    }
  },
});

export const oracleData = defineTool({
  name: "reflect_get_oracle_data",
  title: "Oracle signed messages",
  description:
    "Fetch fresh signed pull-oracle payloads (Chainlink/Pyth) that Reflect's Proxy/RLP programs consume for an asset mint. Reports providers and freshness, not raw payload bytes.",
  readOnly: true,
  inputSchema: {
    assetMint: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Must be a base58 Solana mint address"),
    target: z.enum(["proxy", "rlp", "all"]).default("all"),
  },
  async handler({ assetMint, target }, { reflect }) {
    try {
      const data = await reflect.getOracleSignedMessages(assetMint, target);
      return ok(
        {
          assetMint: data.assetMint,
          fetchedAt: data.fetchedAt,
          ageSeconds: Math.round((Date.now() - Date.parse(data.fetchedAt)) / 1000),
          signedMessageCount: data.signedMessages.length,
          providers: [...new Set(data.signedMessages.map((m) => String(m.provider ?? m.type ?? "unknown")))],
          externalLegCount: data.externalLegs.length,
        },
        "live",
        [API_SOURCE],
      );
    } catch (err) {
      return failFrom(err);
    }
  },
});

export const whitelabelOptions = defineTool({
  name: "reflect_get_whitelabel_options",
  title: "Whitelabel collateral options",
  description:
    "Live list of stablecoins a branded (whitelabel) yieldcoin can be built on, with their current APY, plus how many verified whitelabels exist. Use when someone wants to create their own yieldcoin.",
  readOnly: true,
  inputSchema: {},
  async handler(_input, { reflect }) {
    try {
      const [underlying, verified] = await Promise.all([reflect.getUnderlyingApys(), reflect.getVerifiedWhitelabels()]);
      return ok(
        {
          underlyings: underlying
            .filter((u) => u.apy_bps != null && u.apy_bps > 0)
            .slice(0, 8)
            .map((u) => ({
              mint: u.mint,
              name: u.name?.trim() || labelForMint(u.mint),
              apyPercent: round(bpsToPercent(u.apy_bps!), 2),
              asOf: u.timestamp,
            })),
          verifiedWhitelabelCount: verified.length,
          notes: [
            "Creating a whitelabel (POST /whitelabel/initialize/flow) creates real on-chain state and is NOT performed by this server.",
          ],
        },
        "live",
        [API_SOURCE],
      );
    } catch (err) {
      return failFrom(err);
    }
  },
});

// ───────── helpers ─────────

export function round(n: number, dp: number) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function shortAddress(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

/** Event amounts arrive as hex strings like "01cf41c0" (= 30.36 at 6 decimals). */
export function decodeHexAmount(v: unknown): number | null {
  if (typeof v !== "string" || !/^[0-9a-f]+$/i.test(v)) return null;
  return fromBaseUnits(BigInt(`0x${v}`));
}

/** Exchange-rate history is per-minute; keep the last sample of each day. */
function downsampleDaily<T extends { timestamp: string }>(rows: T[]): T[] {
  const byDay = new Map<string, T>();
  for (const r of rows) byDay.set(r.timestamp.slice(0, 10), r);
  return [...byDay.values()];
}

/** The two internal mints come back with `name: null`; their identity is from /stablecoin/types ordering. */
function labelForMint(mint: string) {
  if (mint.startsWith("usd63")) return "USDC+ (inferred)";
  if (mint.startsWith("uSDt")) return "USDT+ (inferred)";
  return `${mint.slice(0, 4)}…`;
}

export { symbolOf };
