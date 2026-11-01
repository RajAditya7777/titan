/**
 * One error type for every way a Reflect API call can fail.
 *
 * Callers (MCP tools, the LLM, the UI) branch on `code`, never on message text,
 * and `retryable` is the single source of truth for whether trying again can help.
 */
export type ReflectErrorCode =
  | "TIMEOUT"
  | "NETWORK"
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class ReflectApiError extends Error {
  readonly code: ReflectErrorCode;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly endpoint: string;

  constructor(opts: {
    code: ReflectErrorCode;
    message: string;
    endpoint: string;
    status?: number;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(opts.message, { cause: opts.cause });
    this.name = "ReflectApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.endpoint = opts.endpoint;
    this.retryable = opts.retryable ?? false;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      endpoint: this.endpoint,
      retryable: this.retryable,
    };
  }
}

/** Map an HTTP status to our error vocabulary. Only 408/429/5xx are worth retrying. */
export function errorFromStatus(status: number, message: string, endpoint: string): ReflectApiError {
  if (status === 429) return new ReflectApiError({ code: "RATE_LIMITED", message, endpoint, status, retryable: true });
  if (status === 408) return new ReflectApiError({ code: "TIMEOUT", message, endpoint, status, retryable: true });
  if (status === 404) return new ReflectApiError({ code: "NOT_FOUND", message, endpoint, status });
  if (status >= 400 && status < 500) return new ReflectApiError({ code: "BAD_REQUEST", message, endpoint, status });
  return new ReflectApiError({ code: "UPSTREAM_ERROR", message, endpoint, status, retryable: status >= 500 });
}
