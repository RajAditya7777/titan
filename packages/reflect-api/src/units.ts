/**
 * Unit conversions. Every Reflect token uses 6 decimals (docs: "Production hardening").
 * We keep amounts as integer base units on the wire and only convert at the edges,
 * so floating point never touches a value that is sent to the API.
 */
export const TOKEN_DECIMALS = 6;
const BASE = 10 ** TOKEN_DECIMALS;

/** "100.5" | 100.5 → 100500000. Rejects more than 6 decimal places instead of silently rounding. */
export function toBaseUnits(amount: string | number): number {
  const text = typeof amount === "number" ? amount.toString() : amount.trim();
  if (!/^\d+(\.\d+)?$/.test(text)) throw new RangeError(`Not a positive decimal amount: "${text}"`);
  const [whole = "0", frac = ""] = text.split(".");
  if (frac.length > TOKEN_DECIMALS) throw new RangeError(`At most ${TOKEN_DECIMALS} decimal places are supported`);
  const value = Number(whole) * BASE + Number(frac.padEnd(TOKEN_DECIMALS, "0"));
  if (!Number.isSafeInteger(value)) throw new RangeError("Amount is too large");
  return value;
}

export function fromBaseUnits(base: number | string | bigint): number {
  return Number(base) / BASE;
}

/**
 * Exchange-rate fields are named `*_usd_value_bps` but are scaled by 1e9, not 1e4:
 * live value 1012847375 ↔ 1 USDC+ ≈ $1.0128. Verified against the quote endpoint.
 */
export const EXCHANGE_RATE_SCALE = 1e9;
export function exchangeRateToNumber(raw: number): number {
  return raw / EXCHANGE_RATE_SCALE;
}

/**
 * `GET /stablecoin/{i}/apy` returns `apy` in basis points (inferred: 172.94 alongside
 * `/whitelabel/underlying/apy` apy_bps 179 for the same mint). See RESEARCH.md §3.3.
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}
