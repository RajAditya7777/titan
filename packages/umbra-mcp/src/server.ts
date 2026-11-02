import { createServer } from "@companion/mcp-kit";
import { ALL_UMBRA_TOOLS } from "./tools/index";

export function createUmbraMcpServer() {
  return createServer("umbra-companion-mcp", "0.1.0", ALL_UMBRA_TOOLS, {});
}
