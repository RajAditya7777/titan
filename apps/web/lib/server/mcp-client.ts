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

type ServerName = "reflect" | "umbra" | "titan";
type Conn = { client: Client; transport: "stdio" | "inprocess"; connectedAt: number };
const g = globalThis as unknown as {
  __mcpConns?: Record<string, Promise<Conn> | undefined>;
  __reflectMcp?: Promise<Conn>;
};
if (!g.__mcpConns) g.__mcpConns = {};

async function connectServer(server: ServerName): Promise<Conn> {
  const mode = process.env.MCP_TRANSPORT === "inprocess" ? "inprocess" : "stdio";
  const client = new Client({ name: `web-companion-${server}`, version: "0.1.0" });

  if (server === "titan") {
    if (mode === "inprocess") {
      const { createTitanMcpServer } = await import("@companion/titan-mcp/server");
      const { server: mcpServer } = createTitanMcpServer();
      const [a, b] = InMemoryTransport.createLinkedPair();
      await Promise.all([mcpServer.connect(a), client.connect(b)]);
    } else {
      const serverDir = path.resolve(process.cwd(), "../../packages/titan-mcp");
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: ["--import", "tsx", path.join(serverDir, "src/bin.ts")],
        cwd: serverDir,
        env: { PATH: process.env.PATH ?? "" },
        stderr: "inherit",
      });
      transport.onclose = () => {
        if (g.__mcpConns) g.__mcpConns.titan = undefined;
      };
      await client.connect(transport);
    }
    return { client, transport: mode, connectedAt: Date.now() };
  }

  if (server === "umbra") {
    if (mode === "inprocess") {
      const { createUmbraMcpServer } = await import("@companion/umbra-mcp");
      const { server: mcpServer } = createUmbraMcpServer();
      const [a, b] = InMemoryTransport.createLinkedPair();
      await Promise.all([mcpServer.connect(a), client.connect(b)]);
    } else {
      const serverDir = path.resolve(process.cwd(), "../../packages/umbra-mcp");
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: ["--import", "tsx", path.join(serverDir, "src/bin.ts")],
        cwd: serverDir,
        env: { PATH: process.env.PATH ?? "" },
        stderr: "inherit",
      });
      transport.onclose = () => {
        if (g.__mcpConns) g.__mcpConns.umbra = undefined;
      };
      await client.connect(transport);
    }
    return { client, transport: mode, connectedAt: Date.now() };
  }

  // Fallback: reflect server
  if (mode === "inprocess") {
    const { createReflectMcpServer, configFromEnv } = await import("@companion/mcp-server");
    const mcpServer = createReflectMcpServer(configFromEnv());
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([mcpServer.connect(a), client.connect(b)]);
  } else {
    const serverDir = path.resolve(process.cwd(), "../../packages/mcp-server");
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", path.join(serverDir, "src/bin.ts")],
      cwd: serverDir,
      env: {
        PATH: process.env.PATH ?? "",
        REFLECT_API_BASE_URL: process.env.REFLECT_API_BASE_URL ?? "",
        REFLECT_DOCS_INDEX_URL: process.env.REFLECT_DOCS_INDEX_URL ?? "",
        REFLECT_MCP_LOG: process.env.REFLECT_MCP_LOG ?? "",
      },
      stderr: "inherit",
    });
    transport.onclose = () => {
      if (g.__mcpConns) g.__mcpConns.reflect = undefined;
      g.__reflectMcp = undefined;
    };
    await client.connect(transport);
  }
  return { client, transport: mode, connectedAt: Date.now() };
}

export function getMcp(server: ServerName = "titan"): Promise<Conn> {
  if (!g.__mcpConns![server]) {
    g.__mcpConns![server] = connectServer(server).catch((err) => {
      g.__mcpConns![server] = undefined;
      if (server === "reflect") g.__reflectMcp = undefined;
      throw err;
    });
    if (server === "reflect") g.__reflectMcp = g.__mcpConns![server];
  }
  return g.__mcpConns![server]!;
}

export interface ToolOutcome<T = Record<string, any>> {
  ok: boolean;
  data: T;
  ms: number;
  tool: string;
}

function resolveServerForTool(tool: string): ServerName {
  if (tool.startsWith("titan_")) return "titan";
  if (tool.startsWith("umbra_")) return "umbra";
  return "titan";
}

/** Call a tool and return its structured content. Transport failures become `ok:false`, never throws. */
export async function callTool<T = Record<string, any>>(tool: string, args: Record<string, unknown> = {}): Promise<ToolOutcome<T>> {
  const started = Date.now();
  const server = resolveServerForTool(tool);
  try {
    const { client } = await getMcp(server);
    const res = (await client.callTool({ name: tool, arguments: args }, undefined, { timeout: 20_000 })) as {
      isError?: boolean;
      structuredContent?: T;
      content?: { type: string; text?: string }[];
    };
    const data = (res.structuredContent ?? safeJson(res.content?.[0]?.text) ?? {}) as T;
    return { ok: !res.isError, data, ms: Date.now() - started, tool };
  } catch (err) {
    const timedOut = err instanceof McpError && err.code === ErrorCode.RequestTimeout;
    if (!timedOut && g.__mcpConns) g.__mcpConns[server] = undefined;
    return {
      ok: false,
      data: {
        ok: false,
        error: timedOut
          ? { code: "TIMEOUT", message: `${server} is responding slowly right now`, retryable: true }
          : { code: "MCP_UNAVAILABLE", message: `The ${server} MCP server is not reachable`, retryable: true },
      } as T,
      ms: Date.now() - started,
      tool,
    };
  }
}

export async function listTools(server: ServerName = "titan") {
  const { client, transport } = await getMcp(server);
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
