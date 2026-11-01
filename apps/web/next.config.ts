import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@companion/reflect-api", "@companion/mcp-server"],
  // Native/wasm packages load at runtime from node_modules instead of being bundled.
  serverExternalPackages: ["@modelcontextprotocol/sdk", "kokoro-js", "@huggingface/transformers", "onnxruntime-node", "phonemizer"],
};

export default config;
