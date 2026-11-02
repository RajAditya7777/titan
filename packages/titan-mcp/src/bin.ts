#!/usr/bin/env node
import { createTitanMcpServer } from "./server";

async function main() {
  const { startStdio } = createTitanMcpServer();
  await startStdio();
}

main().catch((err) => {
  console.error("titan-companion-mcp error:", err);
  process.exit(1);
});
