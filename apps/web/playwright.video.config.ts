import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Records the three demo journeys as video (no audio: TTS is muted for deterministic pacing).
 * Run: pnpm --filter @companion/web exec playwright test -c playwright.video.config.ts
 */
export default defineConfig({
  ...base,
  grep: /Demo [ABC]/,
  outputDir: "./demo-videos/raw",
  reporter: [["list"]],
  use: {
    ...base.use,
    viewport: { width: 1440, height: 900 },
    video: { mode: "on", size: { width: 1440, height: 900 } },
    trace: "off",
  },
});
