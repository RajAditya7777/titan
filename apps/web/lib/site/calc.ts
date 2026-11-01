/**
 * Pure maths behind the marketing widgets. No React, no I/O, so it's unit-tested directly
 * and the widgets stay thin. All results are illustrations, never promises.
 */

const YEAR_DAYS = 365;

/**
 * Balance after `days` at a constant APY. APY already includes compounding, so growth over t
 * years is (1 + APY)^t, not 1 + APY × t.
 */
export function projectBalance(balance: number, apyPercent: number, days: number): number {
  if (!(balance > 0) || !(days > 0)) return Math.max(0, balance);
  return balance * Math.pow(1 + apyPercent / 100, days / YEAR_DAYS);
}

export interface TrancheOutcome {
  loss: number;
  juniorLoss: number;
  seniorLoss: number;
  junior: number;
  senior: number;
}

/**
 * Loss waterfall for a two-tranche pool: the junior (amplified) tranche absorbs losses until
 * it is wiped out; only then does the senior (protected) tranche lose anything.
 */
export function splitLoss(pool: number, juniorSharePercent: number, lossPercent: number): TrancheOutcome {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  const junior0 = pool * (clamp(juniorSharePercent) / 100);
  const senior0 = pool - junior0;
  const loss = pool * (clamp(lossPercent) / 100);
  const juniorLoss = Math.min(loss, junior0);
  const seniorLoss = loss - juniorLoss;
  return { loss, juniorLoss, seniorLoss, junior: junior0 - juniorLoss, senior: senior0 - seniorLoss };
}

/** Of every $100 of yield, how much goes to the business and how much to its users. */
export function yieldSplit(sharePercent: number, per = 100) {
  const business = (per * Math.min(100, Math.max(0, sharePercent))) / 100;
  return { business, users: per - business };
}

/** Share of gross yield that pays for protection when a product opts into the senior tranche. */
export const PROTECTION_COST = 0.2;

export interface RevenueInput {
  idleCapital: number;
  adoptionPercent: number;
  sharePercent: number;
  grossApyPercent: number;
  protectedOn: boolean;
}

export interface RevenueOutput {
  capitalInSavings: number;
  netApyPercent: number;
  userApyPercent: number;
  businessYearly: number;
  businessMonthly: number;
  usersYearly: number;
}

/**
 * Yearly revenue for a branded savings product, at a constant balance and rate:
 * savings = capital × adoption; yield = savings × APY (less the protection cost if on);
 * the business keeps its share of that yield and users get the rest.
 */
export function estimateRevenue(i: RevenueInput): RevenueOutput {
  const pct = (v: number) => Math.min(100, Math.max(0, v)) / 100;
  const capitalInSavings = Math.max(0, i.idleCapital) * pct(i.adoptionPercent);
  const netApy = Math.max(0, i.grossApyPercent / 100) * (i.protectedOn ? 1 - PROTECTION_COST : 1);
  const totalYield = capitalInSavings * netApy;
  const businessYearly = totalYield * pct(i.sharePercent);
  return {
    capitalInSavings,
    netApyPercent: netApy * 100,
    userApyPercent: netApy * (1 - pct(i.sharePercent)) * 100,
    businessYearly,
    businessMonthly: businessYearly / 12,
    usersYearly: totalYield - businessYearly,
  };
}
