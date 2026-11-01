import { z } from "zod";
import { ReflectApiError, errorFromStatus } from "./errors";
import * as S from "./schemas";

export type Logger = (entry: {
  method: string;
  path: string;
  status?: number;
  ms: number;
  attempt: number;
  cached?: boolean;
  error?: string;
}) => void;

export interface ReflectClientOptions {
  baseUrl?: string;
  /** Per-attempt timeout for reads. Docs recommend 5s; the API often takes 1–3s, so we allow 8s. */
  readTimeoutMs?: number;
  /** Timeout for transaction-building calls. Docs recommend 30s. */
  writeTimeoutMs?: number;
  maxRetries?: number;
  /** How long successful GET responses are reused. 0 disables the cache. */
  cacheTtlMs?: number;
  /** Client-side request budget per second, to stay friendly to the public API. */
  maxRequestsPerSecond?: number;
  fetch?: typeof fetch;
  logger?: Logger;
  /** Injected for deterministic tests. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

type Envelope = "data" | "events";

interface RequestSpec<T extends z.ZodType> {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  schema: T;
  /** Which top-level key holds the payload. Most routes use `data`; `/events` uses `events`. */
  envelope?: Envelope;
  /**
   * Whether repeating the call is harmless. All GETs and quotes are; transaction builders are
   * excluded because each response embeds a fresh blockhash and the caller must decide.
   */
  idempotent: boolean;
}

export const DEFAULT_BASE_URL = "https://prod.api.reflect.money";

export class ReflectClient {
  private readonly o: Required<Omit<ReflectClientOptions, "logger">> & { logger?: Logger };
  private readonly cache = new Map<string, { at: number; value: unknown }>();
  private readonly inflight = new Map<string, Promise<unknown>>();
  private recentRequests: number[] = [];

  constructor(options: ReflectClientOptions = {}) {
    this.o = {
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, ""),
      readTimeoutMs: options.readTimeoutMs ?? 8_000,
      writeTimeoutMs: options.writeTimeoutMs ?? 30_000,
      maxRetries: options.maxRetries ?? 2,
      cacheTtlMs: options.cacheTtlMs ?? 15_000,
      maxRequestsPerSecond: options.maxRequestsPerSecond ?? 10,
      fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
      sleep: options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
      now: options.now ?? Date.now,
      logger: options.logger,
    };
  }

  // ───────────────────────────── Stablecoins ─────────────────────────────

  health() {
    return this.request({ method: "GET", path: "/health", schema: z.unknown(), idempotent: true, envelope: undefined });
  }

  getStablecoinTypes() {
    return this.request({ method: "GET", path: "/stablecoin/types", schema: S.StablecoinTypes, idempotent: true });
  }

  getSupplyLimits() {
    return this.request({ method: "GET", path: "/stablecoin/limits", schema: S.SupplyLimits, idempotent: true });
  }

  /** `apy` is in basis points — see units.ts. */
  getApy(index: number) {
    return this.request({ method: "GET", path: `/stablecoin/${index}/apy`, schema: S.ApyPoint, idempotent: true });
  }

  getApyHistory(index: number, days: number) {
    return this.request({
      method: "GET",
      path: `/stablecoin/${index}/apy/historical?days=${days}`,
      schema: S.ApyHistory,
      idempotent: true,
    });
  }

  getExchangeRates() {
    return this.request({ method: "GET", path: "/stablecoin/exchange-rates", schema: S.ExchangeRates, idempotent: true });
  }

  getExchangeRateHistory(index: number, days: number) {
    return this.request({
      method: "GET",
      path: `/stablecoin/exchange-rates/historical?stablecoin=${index}&days=${days}`,
      schema: S.ExchangeRates,
      idempotent: true,
    });
  }

  /**
   * Quote in base units. Body shape per OpenAPI (`stablecoinIndex`, `depositAmount`);
   * the shape in agent-skills (`index`, `amount`) is rejected by the live API.
   */
  quote(type: "mint" | "redeem", stablecoinIndex: number, amountBaseUnits: number) {
    return this.request({
      method: "POST",
      path: `/stablecoin/quote/${type}`,
      body: { stablecoinIndex, depositAmount: amountBaseUnits },
      schema: S.QuoteAmount,
      idempotent: true,
    });
  }

  /** Returns an UNSIGNED base64 VersionedTransaction. This client never signs anything. */
  buildTransaction(
    kind: "mint" | "burn",
    params: {
      stablecoinIndex: number;
      depositAmount: number;
      signer: string;
      minimumReceived: number;
      cluster?: "mainnet" | "devnet";
    },
  ) {
    const { cluster = "mainnet", ...body } = params;
    return this.request({
      method: "POST",
      path: `/stablecoin/${kind}?cluster=${cluster}`,
      body,
      schema: S.TransactionPayload,
      idempotent: false,
    });
  }

  // ───────────────────────────── Protocol ─────────────────────────────

  getProtocolStats() {
    return this.request({ method: "GET", path: "/stats", schema: S.ProtocolStats, idempotent: true });
  }

  getProtocolStatsHistory(days: number) {
    return this.request({
      method: "GET",
      path: `/stats/historical?days=${days}`,
      schema: S.ProtocolStatsHistory,
      idempotent: true,
    });
  }

  getRecentEvents(limit: number) {
    return this.request({
      method: "GET",
      path: `/events/all/${limit}?nonZero=true`,
      schema: z.array(S.ProtocolEvent),
      idempotent: true,
      envelope: "events",
    });
  }

  // ───────────────────────────── Whitelabel & oracle ─────────────────────────────

  getUnderlyingApys() {
    return this.request({ method: "GET", path: "/whitelabel/underlying/apy", schema: S.UnderlyingApys, idempotent: true });
  }

  getVerifiedWhitelabels() {
    return this.request({ method: "GET", path: "/whitelabel/verified", schema: S.VerifiedWhitelabels, idempotent: true });
  }

  getOracleSignedMessages(assetMint: string, target: "proxy" | "rlp" | "all" = "all") {
    return this.request({
      method: "GET",
      path: `/oracle/signed-messages/${encodeURIComponent(assetMint)}?target=${target}`,
      schema: S.OracleSignedMessages,
      idempotent: true,
    });
  }

  // ───────────────────────────── Core ─────────────────────────────

  private async request<T extends z.ZodType>(spec: RequestSpec<T>): Promise<z.output<T>> {
    const envelope = "envelope" in spec ? spec.envelope : "data";
    const key = `${spec.method} ${spec.path} ${spec.body ? JSON.stringify(spec.body) : ""}`;
    const cacheable = spec.method === "GET" && this.o.cacheTtlMs > 0;

    if (cacheable) {
      const hit = this.cache.get(key);
      if (hit && this.o.now() - hit.at < this.o.cacheTtlMs) {
        this.o.logger?.({ method: spec.method, path: spec.path, ms: 0, attempt: 0, cached: true });
        return hit.value as z.output<T>;
      }
      // Coalesce concurrent identical reads into one upstream call.
      const pending = this.inflight.get(key);
      if (pending) return pending as Promise<z.output<T>>;
    }

    const run = this.withRetries(spec, envelope).then((value) => {
      if (cacheable) this.cache.set(key, { at: this.o.now(), value });
      return value;
    });
    if (cacheable) {
      this.inflight.set(key, run);
      run.finally(() => this.inflight.delete(key)).catch(() => {});
    }
    return run;
  }

  private async withRetries<T extends z.ZodType>(spec: RequestSpec<T>, envelope: Envelope | undefined) {
    const attempts = spec.idempotent ? this.o.maxRetries + 1 : 1;
    let lastError: ReflectApiError | undefined;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.once(spec, envelope, attempt);
      } catch (err) {
        lastError = err as ReflectApiError;
        if (!lastError.retryable || attempt === attempts) break;
        await this.o.sleep(this.backoffMs(attempt, lastError));
      }
    }
    throw lastError;
  }

  /** delay = min(base · 2^attempt + jitter, max), as recommended in the Reflect docs. */
  private backoffMs(attempt: number, err: ReflectApiError): number {
    const base = err.code === "RATE_LIMITED" ? 1_000 : 300;
    return Math.min(base * 2 ** (attempt - 1) + Math.floor(Math.random() * 200), 5_000);
  }

  private async throttle() {
    const now = this.o.now();
    this.recentRequests = this.recentRequests.filter((t) => now - t < 1_000);
    if (this.recentRequests.length >= this.o.maxRequestsPerSecond) {
      const oldest = this.recentRequests[0] ?? now;
      await this.o.sleep(1_000 - (now - oldest));
    }
    this.recentRequests.push(this.o.now());
  }

  private async once<T extends z.ZodType>(spec: RequestSpec<T>, envelope: Envelope | undefined, attempt: number) {
    await this.throttle();
    const endpoint = `${spec.method} ${spec.path.split("?")[0]}`;
    const timeout = spec.method === "GET" || spec.idempotent ? this.o.readTimeoutMs : this.o.writeTimeoutMs;
    const started = this.o.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let res: Response;
    try {
      res = await this.o.fetch(this.o.baseUrl + spec.path, {
        method: spec.method,
        headers: spec.body ? { "content-type": "application/json", accept: "application/json" } : { accept: "application/json" },
        body: spec.body ? JSON.stringify(spec.body) : undefined,
        signal: controller.signal,
      });
    } catch (cause) {
      const aborted = controller.signal.aborted;
      const error = new ReflectApiError({
        code: aborted ? "TIMEOUT" : "NETWORK",
        message: aborted ? `Reflect API did not respond within ${timeout}ms` : "Could not reach the Reflect API",
        endpoint,
        retryable: true,
        cause,
      });
      this.o.logger?.({ method: spec.method, path: spec.path, ms: this.o.now() - started, attempt, error: error.code });
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const ms = this.o.now() - started;
    const json: unknown = await res.json().catch(() => undefined);
    // Logs carry method, path and status only — never request bodies (wallet addresses) or payloads.
    this.o.logger?.({ method: spec.method, path: spec.path.split("?")[0]!, status: res.status, ms, attempt });

    if (!res.ok) throw errorFromStatus(res.status, upstreamMessage(json) ?? `HTTP ${res.status}`, endpoint);

    const payload = envelope ? (json as Record<string, unknown> | undefined)?.[envelope] : json;
    const parsed = spec.schema.safeParse(payload);
    if (!parsed.success) {
      throw new ReflectApiError({
        code: "INVALID_RESPONSE",
        message: `Unexpected response shape from ${endpoint}: ${parsed.error.issues[0]?.message ?? "invalid"}`,
        endpoint,
        status: res.status,
      });
    }
    return parsed.data as z.output<T>;
  }
}

/** The API uses two error shapes: `{error: string}` and `{success:false, error:{message}}`. */
function upstreamMessage(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const err = (json as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return undefined;
}
