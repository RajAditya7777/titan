import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReflectClient, type Logger } from "@companion/reflect-api";
import type { ToolContext, ToolDefinition } from "./tool";
import { oracleData, protocolEvents, protocolStats, stablecoinOverview, whitelabelOptions } from "./tools/info";
import { mintQuote, prepareTransaction, redeemQuote } from "./tools/transactions";
import { checkIntegration, explainError, getDocumentation } from "./tools/developer";

/** Order matters only for listing; the LLM sees them in this order. */
export const TOOLS: ToolDefinition<any>[] = [
  stablecoinOverview,
  protocolStats,
  protocolEvents,
  oracleData,
  mintQuote,
  redeemQuote,
  prepareTransaction,
  whitelabelOptions,
  checkIntegration,
  explainError,
  getDocumentation,
];

export interface ServerConfig {
  baseUrl?: string;
  docsIndexUrl?: string;
  logger?: Logger;
  /** Overrides for tests. */
  context?: Partial<ToolContext>;
}

/** Reads configuration from the environment only; nothing is hardcoded besides public defaults. */
export function configFromEnv(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    baseUrl: env.REFLECT_API_BASE_URL || undefined,
    docsIndexUrl: env.REFLECT_DOCS_INDEX_URL || undefined,
  };
}

export function createReflectMcpServer(config: ServerConfig = {}) {
  const ctx: ToolContext = {
    reflect: config.context?.reflect ?? new ReflectClient({ baseUrl: config.baseUrl, logger: config.logger }),
    fetch: config.context?.fetch ?? globalThis.fetch.bind(globalThis),
    docsIndexUrl: config.docsIndexUrl ?? "https://docs.reflect.money/llms.txt",
  };

  const server = new McpServer(
    { name: "reflect-companion", version: "0.1.0" },
    {
      instructions:
        "Tools for the Reflect Money protocol (yield-bearing stablecoins on Solana). All tools are read-only. " +
        "reflect_prepare_transaction returns an UNSIGNED transaction for the user's wallet; nothing here signs or submits. " +
        "Every result carries `provenance` (live | derived | static-docs) and `sources`.",
    },
  );

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: { readOnlyHint: tool.readOnly, destructiveHint: false, openWorldHint: true },
      },
      // The SDK has already validated `input` against the Zod schema before this runs.
      (input: any) => tool.handler(input, ctx),
    );
  }

  return server;
}
