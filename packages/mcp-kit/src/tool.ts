import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export type Provenance = "live" | "derived" | "static-docs" | "mock" | "not-implemented";

export interface ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape, Ctx = unknown> {
  name: string;
  title: string;
  description: string;
  inputSchema: Shape;
  readOnly: boolean;
  handler: (input: z.infer<z.ZodObject<Shape>>, ctx: Ctx) => Promise<CallToolResult>;
}

export function defineTool<Shape extends z.ZodRawShape, Ctx = unknown>(def: ToolDefinition<Shape, Ctx>) {
  return def;
}

export function ok(
  data: Record<string, unknown>,
  provenance: Provenance,
  sources: string[] = []
): CallToolResult {
  const structuredContent = { ok: true, provenance, sources, ...data };
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

export function fail(
  code: string,
  message: string,
  extra: { retryable?: boolean; hint?: string } = {}
): CallToolResult {
  const structuredContent = {
    ok: false,
    error: {
      code,
      message,
      retryable: extra.retryable ?? false,
      hint: extra.hint,
    },
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

export function failFrom(err: unknown): CallToolResult {
  if (err instanceof RangeError || err instanceof TypeError) {
    return fail("INVALID_INPUT", err.message);
  }
  if (err && typeof err === "object" && "code" in err && "message" in err) {
    const errorObj = err as { code: string; message: string; retryable?: boolean; hint?: string };
    return fail(errorObj.code, errorObj.message, { retryable: errorObj.retryable, hint: errorObj.hint });
  }
  return fail("INTERNAL", "Unexpected error while running tool.");
}
