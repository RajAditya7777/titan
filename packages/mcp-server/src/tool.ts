import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ReflectApiError, type ReflectClient } from "@companion/reflect-api";
import type { z } from "zod";

/** Everything a tool needs from the outside world — injected so tests can swap it. */
export interface ToolContext {
  reflect: ReflectClient;
  fetch: typeof fetch;
  docsIndexUrl: string;
}

/**
 * Provenance travels with every result so the LLM (and the user) can tell a live
 * number from a rule-based check. This is what keeps "real vs mocked" honest.
 */
export type Provenance = "live" | "derived" | "static-docs" | "not-implemented";

export interface ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  inputSchema: Shape;
  /** Mirrors MCP tool annotations: lets clients know nothing here mutates state. */
  readOnly: boolean;
  handler: (input: z.infer<z.ZodObject<Shape>>, ctx: ToolContext) => Promise<CallToolResult>;
}

export function defineTool<Shape extends z.ZodRawShape>(def: ToolDefinition<Shape>) {
  return def;
}

export function ok(data: Record<string, unknown>, provenance: Provenance, sources: string[] = []): CallToolResult {
  const structuredContent = { ok: true, provenance, sources, ...data };
  return { content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }], structuredContent };
}

export function fail(code: string, message: string, extra: { retryable?: boolean; hint?: string } = {}): CallToolResult {
  const structuredContent = { ok: false, error: { code, message, retryable: extra.retryable ?? false, hint: extra.hint } };
  return { isError: true, content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }], structuredContent };
}

/** Convert any thrown value into a safe tool error. Stack traces never leave the server. */
export function failFrom(err: unknown): CallToolResult {
  if (err instanceof ReflectApiError) {
    const hint =
      err.code === "RATE_LIMITED"
        ? "The Reflect API is rate limiting requests. Wait a few seconds and try again."
        : err.code === "TIMEOUT" || err.code === "NETWORK"
          ? "The Reflect API is slow or unreachable right now. Try again shortly."
          : err.code === "INVALID_RESPONSE"
            ? "The API response format changed; this tool needs an update."
            : undefined;
    return fail(err.code, err.message, { retryable: err.retryable, hint });
  }
  if (err instanceof RangeError) return fail("INVALID_INPUT", err.message);
  return fail("INTERNAL", "Unexpected error while running the tool.");
}

export const API_SOURCE = "https://docs.reflect.money/api-reference/openapi.json";
