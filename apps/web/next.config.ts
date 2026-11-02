import type { NextConfig } from "next";

/**
 * One codebase, several demo servers: NEXT_DIST_DIR gives a second `next dev` its own build folder
 * (two dev servers can't share one), and DEMO_HOME makes "/" open that demo (e.g. /jup on :3300).
 */
const home = process.env.DEMO_HOME;

const config: NextConfig = {
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  ...(home ? { redirects: async () => [{ source: "/", destination: home, permanent: false }] } : {}),
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@companion/reflect-api", "@companion/mcp-server"],
  // Native/wasm packages load at runtime from node_modules instead of being bundled.
  serverExternalPackages: ["@modelcontextprotocol/sdk", "kokoro-js", "@huggingface/transformers", "onnxruntime-node", "phonemizer"],
};

export default config;
