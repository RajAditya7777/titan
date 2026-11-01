# Phase 08: Hub, product switching, voice data, Reflect removal
1. `/`: a hub with two cards (Titan trading guide, Umbra privacy guide), the independent-demo banner and a pet greeting.
2. Cross-product intent ("send privately" while on Titan) → the companion says it is switching and navigates to `/umbra`, keeping the slots.
3. `lib/server/voice.ts` STT prompt and corrections, plus Kokoro `speechText` tickers, are taken from the active adapter's `voice` data (pass `product` to `/api/stt` and `/api/tts` as a field).
4. Remove the following (one commit, after all tests are green):
   - `app/(site)`, `app/(app)`, `components/site`, `lib/site`, `components/pages/*` (Reflect)
   - `lib/products/reflect`
   - `packages/mcp-server`, `packages/reflect-api`
   - the Reflect warmup in `instrumentation.ts` (warm the Titan DART markets + Kokoro instead)
   - and update the e2e tests.

**Acceptance:** all green, and `grep -ri reflect apps packages` only hits docs and history notes.
