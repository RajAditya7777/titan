import { createServer } from "@companion/mcp-kit";
import { ALL_TITAN_TOOLS } from "./tools/index";

export function createTitanMcpServer() {
  return createServer("titan-companion-mcp", "0.1.0", ALL_TITAN_TOOLS, {});
}
