#!/usr/bin/env node
import { createUmbraMcpServer } from "./server.js";

async function main() {
  const { startStdio } = createUmbraMcpServer();
  await startStdio();
}

main().catch((err) => {
  console.error("umbra-companion-mcp error:", err);
  process.exit(1);
});
