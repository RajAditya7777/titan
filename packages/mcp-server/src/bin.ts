#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configFromEnv, createReflectMcpServer } from "./server";

// stdout is the MCP channel, so all diagnostics go to stderr. Logs carry method/path/status/latency only.
const verbose = process.env.REFLECT_MCP_LOG !== "silent";
const server = createReflectMcpServer({
  ...configFromEnv(),
  logger: verbose
    ? (e) => process.stderr.write(`[reflect-api] ${e.method} ${e.path} ${e.cached === "stale" ? "STALE (upstream failed, served last good)" : e.cached ? "cache" : (e.status ?? e.error)} ${e.ms}ms\n`)
    : undefined,
});

await server.connect(new StdioServerTransport());
process.stderr.write("[reflect-mcp] ready on stdio\n");
