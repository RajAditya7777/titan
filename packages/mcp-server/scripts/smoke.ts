/**
 * End-to-end smoke test against the LIVE Reflect API through a real stdio MCP connection.
 * Run: pnpm --filter @companion/mcp-server smoke
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const bin = fileURLToPath(new URL("../src/bin.ts", import.meta.url));
const transport = new StdioClientTransport({ command: "npx", args: ["tsx", bin], env: { ...process.env, REFLECT_MCP_LOG: "silent" } as Record<string, string> });
const client = new Client({ name: "smoke", version: "0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`connected · ${tools.length} tools`);

const calls: [string, Record<string, unknown>][] = [
  ["reflect_get_stablecoin_overview", {}],
  ["reflect_get_protocol_stats", { historyDays: 3 }],
  ["reflect_get_protocol_events", { limit: 2 }],
  ["reflect_get_mint_quote", { amount: "100" }],
  ["reflect_get_redeem_quote", { amount: "100" }],
  ["reflect_get_whitelabel_options", {}],
  ["reflect_get_documentation", { query: "mint quote" }],
];

let failures = 0;
for (const [name, args] of calls) {
  const t = Date.now();
  const r = (await client.callTool({ name, arguments: args })) as { isError?: boolean; structuredContent?: any };
  const s = r.structuredContent;
  const summary =
    name === "reflect_get_mint_quote" || name === "reflect_get_redeem_quote"
      ? `${s.input?.amount} ${s.input?.token} → ${s.expectedOutput?.amount} ${s.expectedOutput?.token}`
      : name === "reflect_get_stablecoin_overview"
        ? s.stablecoins?.map((c: any) => `${c.symbol} apy=${c.apy?.percent}% rate=${c.exchangeRate?.usdPerToken}`).join(" | ")
        : r.isError
          ? JSON.stringify(s.error)
          : "ok";
  if (r.isError) failures++;
  console.log(`${r.isError ? "✗" : "✓"} ${name} (${Date.now() - t}ms) ${summary}`);
}

await client.close();
process.exit(failures ? 1 : 0);
