import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@companion/reflect-api", "@companion/mcp-server"],
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
};

export default config;
