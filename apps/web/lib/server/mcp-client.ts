import "server-only";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

/**
 * The web server is an MCP *client* of the Reflect MCP server. Two transports:
 *
 *  - "stdio" (default): spawns packages/mcp-server as a child process: the same binary any MCP
 *    host (Claude Desktop, Cursor…) would run. Proves the server works as a real MCP server.
 *  - "inprocess": links client and server in memory. Use where child processes aren't allowed
 *    (serverless). Same protocol, same tool code.
 *
 * One connection is shared per server process (stored on globalThis so Next dev HMR doesn't
 * leak a child process per reload). A failed connection is dropped so the next call reconnects.
 */

type Conn = { client: Client; transport: "stdio" | "inprocess"; connectedAt: number };
const g = globalThis as unknown as { __reflectMcp?: Promise<Conn> };

async function connect(): Promise<Conn> {
  const mode = process.env.MCP_TRANSPORT === "inprocess" ? "inprocess" : "stdio";
  const client = new Client({ name: "reflect-companion-web", version: "0.1.0" });

  if (mode === "inprocess") {
    const { createReflectMcpServer, configFromEnv } = await import("@companion/mcp-server");
    const server = createReflectMcpServer(configFromEnv());
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(a), client.connect(b)]);
  } else {
    const serverDir = path.resolve(process.cwd(), "../../packages/mcp-server");
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", path.join(serverDir, "src/bin.ts")],
      cwd: serverDir,
      // Pass only what the server needs. No LLM keys reach the MCP process.
      env: {
        PATH: process.env.PATH ?? "",
        REFLECT_API_BASE_URL: process.env.REFLECT_API_BASE_URL ?? "",
        REFLECT_DOCS_INDEX_URL: process.env.REFLECT_DOCS_INDEX_URL ?? "",
        REFLECT_MCP_LOG: process.env.REFLECT_MCP_LOG ?? "",
      },
      stderr: "inherit",
    });
    transport.onclose = () => {
      g.__reflectMcp = undefined;
    };
    await client.connect(transport);
  }
  return { client, transport: mode, connectedAt: Date.now() };
}

export function getMcp(): Promise<Conn> {
  if (!g.__reflectMcp) {
    g.__reflectMcp = connect().catch((err) => {
      g.__reflectMcp = undefined;
      throw err;
    });
  }
  return g.__reflectMcp;
}

export interface ToolOutcome<T = Record<string, any>> {
  ok: boolean;
  data: T;
  ms: number;
  tool: string;
}

/** Call a tool and return its structured content. Transport failures become `ok:false`, never throws. */
export async function callTool<T = Record<string, any>>(tool: string, args: Record<string, unknown> = {}): Promise<ToolOutcome<T>> {
  const started = Date.now();
  try {
    const { client } = await getMcp();
    const res = (await client.callTool({ name: tool, arguments: args }, undefined, { timeout: 20_000 })) as {
      isError?: boolean;
      structuredContent?: T;
      content?: { type: string; text?: string }[];
    };
    const data = (res.structuredContent ?? safeJson(res.content?.[0]?.text) ?? {}) as T;
    return { ok: !res.isError, data, ms: Date.now() - started, tool };
  } catch (err) {
    // A slow tool is not a dead server: keep the connection on timeouts. Only drop it (so the next
    // call respawns the server) when the transport itself failed.
    const timedOut = err instanceof McpError && err.code === ErrorCode.RequestTimeout;
    if (!timedOut) g.__reflectMcp = undefined;
    return {
      ok: false,
      data: {
        ok: false,
        error: timedOut
          ? { code: "TIMEOUT", message: "Reflect is responding slowly right now", retryable: true }
          : { code: "MCP_UNAVAILABLE", message: "The Reflect MCP server is not reachable", retryable: true },
      } as T,
      ms: Date.now() - started,
      tool,
    };
  }
}

export async function listTools() {
  const { client, transport } = await getMcp();
  const { tools } = await client.listTools();
  return { tools, transport };
}

function safeJson(text?: string) {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}
