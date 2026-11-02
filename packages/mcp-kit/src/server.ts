import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ToolDefinition } from "./tool";

export function createServer<Ctx>(
  name: string,
  version: string,
  tools: ToolDefinition<any, Ctx>[],
  ctx: Ctx
) {
  const server = new McpServer(
    { name, version },
    { capabilities: { tools: {} } }
  );

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: { readOnlyHint: tool.readOnly, destructiveHint: false },
      },
      (input: any) => tool.handler(input, ctx)
    );
  }

  return {
    server,
    async startStdio() {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    },
  };
}
