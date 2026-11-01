import { z } from "zod";

/**
 * Response schemas, derived from docs.reflect.money/api-reference/openapi.json and
 * checked against live responses on 2026-11-01. Objects are `looseObject` so new
 * upstream fields never break us; only the fields we read are required.
 */

export const StablecoinTypes = z.array(z.looseObject({ index: z.number().int(), name: z.string() }));

export const SupplyLimits = z.array(
  z.looseObject({
    index: z.number().int(),
    supplyCap: z.number(),
    currentSupply: z.number(),
    remainingCapacity: z.number(),
    utilizationPercentage: z.number(),
  }),
);

export const ApyPoint = z.looseObject({
  index: z.union([z.number(), z.string()]).transform(Number),
  apy: z.number(),
  timestamp: z.string(),
});

export const ApyHistory = z.looseObject({
  index: z.union([z.number(), z.string()]).transform(Number),
  start_date: z.string(),
  end_date: z.string(),
  data: z.array(
    z.looseObject({ timestamp: z.string(), daily_rate_bps: z.number(), yearly_rate_bps: z.number() }),
  ),
});

export const ExchangeRateRow = z.looseObject({
  stablecoin: z.number().int(),
  base_usd_value_bps: z.number(),
  receipt_usd_value_bps: z.number(),
  timestamp: z.string(),
});
export const ExchangeRates = z.array(ExchangeRateRow);

export const QuoteAmount = z.number().nonnegative();

export const TransactionPayload = z.looseObject({ transaction: z.string().min(1) });

export const ProtocolStats = z.looseObject({
  users: z.number(),
  supply: z.string(),
  cumulativeVolume: z.string(),
  tvl: z.number(),
  tvlBreakdown: z.array(z.looseObject({ index: z.number(), tvl: z.number() })),
  totalYieldDistributed: z.number(),
});

export const ProtocolStatsHistory = z.looseObject({
  tvl: z.array(z.looseObject({ timestamp: z.string(), tvl: z.number() })).optional(),
});

export const ProtocolEvent = z.looseObject({
  id: z.number(),
  type: z.string(),
  signer: z.string().optional(),
  timestamp: z.string(),
  transaction_id: z.string().optional(),
  event: z
    .looseObject({
      data: z.record(z.string(), z.unknown()).optional(),
      slot: z.number().optional(),
    })
    .optional(),
});

export const UnderlyingApys = z.array(
  z.looseObject({
    mint: z.string(),
    name: z.string().nullable(),
    apy_bps: z.number().nullable(),
    apy_bps_7d: z.number().nullable(),
    timestamp: z.string().nullable(),
  }),
);

export const VerifiedWhitelabels = z.array(
  z.looseObject({
    pubkey: z.string(),
    stats: z
      .looseObject({
        stablecoin: z.string().optional(),
        holders: z.number().optional(),
        apy_bps: z.number().optional(),
        market_cap: z.string().optional(),
      })
      .optional(),
  }),
);

export const OracleSignedMessages = z.looseObject({
  assetMint: z.string(),
  target: z.string(),
  fetchedAt: z.string(),
  signedMessages: z.array(z.record(z.string(), z.unknown())),
  externalLegs: z.array(z.record(z.string(), z.unknown())),
});

export type StablecoinTypesT = z.infer<typeof StablecoinTypes>;
export type SupplyLimitsT = z.infer<typeof SupplyLimits>;
export type ApyPointT = z.infer<typeof ApyPoint>;
export type ApyHistoryT = z.infer<typeof ApyHistory>;
export type ExchangeRateRowT = z.infer<typeof ExchangeRateRow>;
export type ProtocolStatsT = z.infer<typeof ProtocolStats>;
export type ProtocolEventT = z.infer<typeof ProtocolEvent>;
export type UnderlyingApysT = z.infer<typeof UnderlyingApys>;
export type VerifiedWhitelabelsT = z.infer<typeof VerifiedWhitelabels>;
export type OracleSignedMessagesT = z.infer<typeof OracleSignedMessages>;
