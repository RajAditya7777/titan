import "server-only";

/**
 * Per-client token bucket. Each client gets `burst` tokens that refill at `perMinute / 60` per
 * second, so a person can ask two quick questions, but a script can't drain the LLM quota.
 *
 * In-memory and per-process: right for one demo server. Behind several instances you would move
 * the buckets to a shared store (Redis), or every instance would grant its own allowance.
 */
export interface RateLimitResult {
  ok: boolean;
  /** Milliseconds until one token is available again (0 when ok). */
  retryAfterMs: number;
}

export class TokenBucketLimiter {
  private readonly buckets = new Map<string, { tokens: number; at: number }>();

  constructor(
    private readonly opts: { burst: number; perMinute: number; now?: () => number; maxKeys?: number },
  ) {}

  take(key: string): RateLimitResult {
    const now = (this.opts.now ?? Date.now)();
    const ratePerMs = this.opts.perMinute / 60_000;
    const b = this.buckets.get(key) ?? { tokens: this.opts.burst, at: now };
    b.tokens = Math.min(this.opts.burst, b.tokens + (now - b.at) * ratePerMs);
    b.at = now;
    this.buckets.delete(key); // re-insert to keep Map order = least recently used first
    this.buckets.set(key, b);
    this.evict();
    if (b.tokens >= 1) {
      b.tokens -= 1;
      return { ok: true, retryAfterMs: 0 };
    }
    return { ok: false, retryAfterMs: Math.ceil((1 - b.tokens) / ratePerMs) };
  }

  /** Bound memory: drop the least recently seen clients beyond `maxKeys`. */
  private evict() {
    const max = this.opts.maxKeys ?? 5_000;
    while (this.buckets.size > max) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }
}

/** One limiter per route family, shared across requests in this process. */
const g = globalThis as unknown as { __limiters?: Map<string, TokenBucketLimiter> };
export function limiter(name: string, opts: { burst: number; perMinute: number }) {
  g.__limiters ??= new Map();
  let l = g.__limiters.get(name);
  if (!l) {
    l = new TokenBucketLimiter(opts);
    g.__limiters.set(name, l);
  }
  return l;
}

/**
 * Best-effort client key. `x-forwarded-for` is only trustworthy behind a proxy you control;
 * locally every request is the same client, which is fine for a single-user demo.
 */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

export function tooMany(retryAfterMs: number) {
  return new Response(
    JSON.stringify({ ok: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment.", retryable: true } }),
    { status: 429, headers: { "content-type": "application/json", "retry-after": String(Math.ceil(retryAfterMs / 1000)) } },
  );
}
