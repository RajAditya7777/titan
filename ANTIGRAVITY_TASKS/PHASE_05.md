# Phase 05: Titan UI, adapter and planners
**Objective:** A Titan-inspired trading UI (original design, no Titan logos or trade dress) guided by the pet.

**Steps**
1. **Pages** under `app/(titan)/titan/`:
   - `swap`:
     - Mode tabs Instant / Limit, plus disabled DCA and Slice tabs marked "Explained only".
     - Prime/Manual toggle and a DART Auto/Only/Off select.
     - Sell card (amount, token select, Max/50%) and the switch button.
     - Buy card (read-only amount).
     - Rate line, quote details (route, price impact, min received, fees) and a Settings drawer (Max Slippage Base / Stable-LST, Priority Fee vs MEV Protect, Auto/Custom).
     - The "Review swap" button opens a simulated review that ends at "Approve in wallet (simulated)".
   - `limit`: pair, Buy/Sell, limit price with a Market reference, quantity, expiry, $10 minimum validation.
   - `learn`: concept cards.
   - Every live or mock number shows a source badge.
2. **`lib/products/titan/`:**
   - `registry.ts` (`data-companion` ids for every control above; the review/approve controls are `sensitive`).
   - `state.ts`: `TitanAppState {page, mode, prime, dart, inputToken, outputToken, amount, quote:{out, impactPct, route, provenance}|null, slippageBps, settingsOpen}`, from a small client store.
   - `planner.ts`: goals `swap {inputToken, outputToken, amount?}`, `limit_order {...}`, `adjust_slippage {bps}`, `tour`. Use `skipIf` on token and amount steps, `observe` until a quote exists, then explain the quote via `call_tool titan_explain_quote`, `wait_for_user_action` on Review, and `stop_before_signing`.
   - `prompt.ts`, `voice.ts` (SOL, USDC, USDT, JUP, BONK, "slippage", "DART", "Argos" corrections), `rules.ts`.
3. The browser bridge allow-list adds the Titan read tools.

**Acceptance (e2e)**
- "swap 1 SOL for USDC" → points sell token → amount → waits for quote → explains → waits at Review → stops before signing.
- "actually USDT instead" mid-run → only the output token step re-runs.
- "what is slippage?" → explanation, with no run started.
- "why am I getting fewer tokens?" on a shown quote → a diagnosis using the quote values.
