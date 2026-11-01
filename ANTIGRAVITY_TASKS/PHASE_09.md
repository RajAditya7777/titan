# Phase 09: Polish, security and reliability
1. **Polish:**
   - loading skeletons on quotes and simulator steps
   - error toasts with retry
   - pet states mapped to simulator progress (thinking while "proving")
   - reduced-motion support kept
   - mobile layout at 375 px.
2. **Security test suite (`test/safety.test.ts`):**
   - the LLM proposing an unknown id, a click on a `sensitive` control, or `stop_before_signing` not last → all rejected
   - `appState` key stripping
   - the API key never appears in any `/api/*` response (scan JSON)
   - no `fetch` to a POST endpoint of Titan in the `titan-mcp` source (static test).
3. **Reliability:**
   - kill the titan-mcp mid-turn → the companion answers from rules
   - Portal 429 → mock fallback with a badge
   - TTS failure → browser voice.
4. **e2e** for all four summit scripts (see `IMPLEMENTATION_ROADMAP.md`), by typed input.

**Acceptance:** all green; a manual voice check in Chrome logged in `PROJECT_STATUS.md`.
