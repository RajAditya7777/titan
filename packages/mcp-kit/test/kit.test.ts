import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineTool, ok, fail, failFrom, createServer } from "../src/index.js";

describe("mcp-kit", () => {
  it("formats ok results with provenance", () => {
    const result = ok({ count: 42 }, "derived", ["https://docs.nimbusprivacy.xyz"]);
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      ok: true,
      count: 42,
      provenance: "derived",
      sources: ["https://docs.nimbusprivacy.xyz"],
    });
  });

  it("formats fail results cleanly", () => {
    const result = fail("INVALID_ACCOUNT", "Account does not exist", { retryable: false });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_ACCOUNT",
        message: "Account does not exist",
        retryable: false,
      },
    });
  });

  it("creates a functional MCP server definition", async () => {
    const tool = defineTool({
      name: "test_tool",
      title: "Test Tool",
      description: "A test tool",
      inputSchema: { value: z.string() },
      readOnly: true,
      handler: async (input) => ok({ echoed: input.value }, "mock"),
    });

    const { server } = createServer("test-server", "1.0.0", [tool], {});
    expect(server).toBeDefined();
  });
});
