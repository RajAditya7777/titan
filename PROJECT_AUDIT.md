# Project audit: Reflect AI Companion (baseline for the Titan + Umbra migration)

Audited at commit `2652ddf` (branch `feat/companion-milestone-1`). Every claim below points at a file
or function that exists in this repo. "Reflect-specific" means it must change for the new products.

## 1. Stack and layout

| Area | What exists | Where |
|---|---|---|
| Monorepo | pnpm workspaces, TypeScript everywhere | `pnpm-workspace.yaml`, `tsconfig.base.json` |
| Web app | Next.js 16.4 App Router, React 19.3, Tailwind 4, `motion` 14.9, lucide icons | `apps/web` |
| MCP server | Official `@modelcontextprotocol/sdk` 1.32.2, stdio transport | `packages/mcp-server` |
| API client | Zod-validated REST client for Reflect, with cache/retry/stale-if-error | `packages/reflect-api` |
| Tests | Vitest (unit, 3 packages), Playwright e2e against the live stack (system Chrome) | `apps/web/test`, `apps/web/e2e`, `packages/*/test` |
| Database / auth | **None.** No DB, no user accounts, no wallet connection ("Demo · no wallet" in the header) | — |

Route groups in `apps/web/app`:
- `(site)`: marketing pages (`/`, `/earn`, `/create`, `/protect`, `/build`, `/assets`, `/case-studies`, `/privacy`). All Reflect content.
- `(app)`: product app (`/dashboard`, `/mint`, `/redeem`, `/usdt`, `/stablecoins/[symbol]`, `/whitelabel`, `/portfolio`, `/stats`). All Reflect.
- `api`: `companion` (LLM turn), `mcp` (browser→MCP bridge, allow-listed), `stt`, `tts`, `voice` (capabilities).

## 2. The companion, precisely

### 2.1 Rendering and animation
- `components/companion/Pet.tsx`: SVG pixel pup. Pure function of `(state, lookAngle, gazeAngle, reaction, sleeping, voiceLevel)`. States come from `PetState` in `CompanionProvider.tsx` (`idle | listening | thinking | speaking | moving | pointing | waiting | celebrating | error`).
- `components/companion/pet-sprite.ts`: the art as data (20×20 grid, palette → CSS tokens `--pet-*` in `app/globals.css`). **Product-agnostic.**
- `components/companion/PetLayer.tsx` (`PetLayer`): positions the pet next to the current target with `placePet()` from `lib/companion/positioning.ts`, draws the spotlight and speech bubble (`BubbleText`, `BubbleTail`), gaze, sleep, hover reactions. **Product-agnostic.**
- `components/companion/Panel.tsx`: chat panel, suggestion chips, guidance bar (`GuidanceBar`), voice on/off. Suggestion chip texts are Reflect-specific.

### 2.2 Input → response
1. Voice or typed text enters `handleUtterance(raw, source)` in `CompanionProvider.tsx`.
2. `parseControlCommand()` (`lib/companion/commands.ts`) catches local commands first: stop, mute, unmute, repeat, next, back, restart, explain, confirm, decline, provide_value. These never hit the network.
3. Otherwise `send(text)` POSTs `{utterance, page, history, fields}` to `app/api/companion/route.ts`.
4. `runTurn()` in `lib/server/llm/orchestrator.ts`: LLM tool loop (≤4 rounds, 20 s budget) over MCP tools filtered by `toolIsRelevant()`, ending in the forced `companion_respond` function. Output is parsed by `finalize()` against `CompanionReplySchema` and `auditWorkflow()`.
5. If no LLM is configured or it fails, `planWithRules()` (`lib/server/llm/rules.ts`) answers with regex intent routing.
6. The browser receives `{speech, workflow?, point?, toolCalls, engine, needsClarification}`.

### 2.3 Intent understanding
- **There is no explicit intent model.** The LLM decides implicitly between speech-only, `point_target`, `workflow_id` (one of `WORKFLOW_IDS` in `lib/companion/workflows.ts`) or up to 8 `custom_steps`.
- The rules planner's `route()` is a sequence of regexes (mint/redeem/whitelabel/tour/APY/"where is").
- Consequence: "What is slippage?" vs "do a swap" is left to prompt wording. There's no intent type you can test or log.

### 2.4 Workflows
- Schema: `StepSchema` in `lib/companion/actions.ts`, a discriminated union of `navigate_to_page | point | request_input | call_tool | wait_for_user_action | stop_before_signing | celebrate`. Targets are `z.enum(ELEMENT_IDS)` and pages are `z.enum(PAGE_IDS)`, so **the step schema is compiled against the Reflect registry**.
- Templates: `buildWorkflow(id, params)` in `lib/companion/workflows.ts` (onboarding_tour, mint, redeem, create_whitelabel, explain_apy). All Reflect.
- Safety audit: `auditWorkflow()` (unknown targets, non-fillable inputs, sensitive controls, and `stop_before_signing` must come last).
- Execution: `runFrom(index)` and `executeStep()` in `CompanionProvider.tsx` run steps **linearly**. A cancellation token (`tokenRef`) aborts in-flight steps.
- Templates: `renderTemplate()` fills `{{result.x}}` and `{{field:id}}`.
- **Limitation:** a workflow is a fixed array decided once. "Actually, USDT instead" makes a new turn, which replaces the run (`startWorkflow`) rather than patching it. There's no replanning, no step preconditions, and no notion of "already satisfied, skip it".

### 2.5 UI element identification and spotlight
- `lib/companion/registry.ts`: `PAGES`, `ELEMENTS`, `ElementSpec {page, layout, kind, label, description, validation, sensitive, fillable}`, plus `validate()` and `elementsOnPage()`.
- The DOM is found only through `[data-companion="<id>"]` (`focus()` in the provider). The LLM never supplies selectors. **The mechanism is product-agnostic; the content is Reflect.**
- Scroll band: `focus()` keeps targets clear of the header and guidance bar (`topReserve` / `bottomReserve`).

### 2.6 Waiting for the user
- `request_input`: fields register via `registerField()`. `notifyFieldChange()` validates with `validate()`; the step resolves when valid. An autofill is offered as `offer`, and filled only after "yes" (`confirmOffer`, `fill`).
- `wait_for_user_action`: a capture-phase click listener on the target element (around `CompanionProvider.tsx:506`). The engine never clicks.
- `stop_before_signing`: terminal step. Explains the wallet takes over and ends the run.

### 2.7 Interruptions
- "stop" / Escape → `handleControl({kind:"stop"})` → `cancel()` bumps `tokenRef`.
- Barge-in while speaking: only `stop` and `mute` are accepted, and the echo filter `isLikelyEcho()` ignores the mic hearing the pet's own voice.
- Questions mid-workflow: a new non-command utterance goes to the LLM, but **the active run is not passed as context**. The LLM doesn't know a workflow is in progress.

### 2.8 Voice
- STT: `ServerSpeechToText` (MediaRecorder + `VoiceActivityDetector`) → `/api/stt` → Whisper large-v3 (`lib/server/voice.ts: transcribe`). The fallback is `BrowserSpeechToText` (en-IN).
- TTS: `ServerTextToSpeech` → `/api/tts` → local Kokoro-82M in a worker thread (`lib/server/tts/kokoro.ts`, `kokoro-worker.mjs`). The fallback is `BrowserTextToSpeech`. Replies are sentence-pipelined (`splitForSpeech`).
- **Reflect-specific bits:** `STT_VOCABULARY` and `applyDomainCorrections()` in `lib/server/voice.ts`, and the ticker list in `speechText()` in `lib/server/tts/kokoro.ts`.

### 2.9 MCP
- One server, `packages/mcp-server` (`createReflectMcpServer`, name `reflect-companion`). Tools: `reflect_get_stablecoin_overview`, `reflect_get_protocol_stats`, `reflect_get_protocol_events`, `reflect_get_oracle_data`, `reflect_get_mint_quote`, `reflect_get_redeem_quote`, `reflect_prepare_transaction`, `reflect_get_whitelabel_options`, `reflect_check_integration`, `reflect_explain_error`, `reflect_get_documentation`.
- Reusable patterns: `defineTool`, `ok/fail/failFrom`, and `Provenance = live | derived | static-docs | not-implemented` (`src/tool.ts`).
- Client: `lib/server/mcp-client.ts` (`getMcp`, `callTool`, `listTools`) is a **singleton connection to one server** spawned with `tsx packages/mcp-server/src/bin.ts`. It has a 20 s tool timeout and keeps the connection alive after a timeout.
- Browser bridge: `app/api/mcp/route.ts` only allows `BROWSER_CALLABLE_TOOLS` (`lib/companion/actions.ts`).

### 2.10 Abuse/cost controls and warm start
- `lib/server/rate-limit.ts` (`TokenBucketLimiter`, per-client buckets on companion/mcp/stt/tts).
- `instrumentation.ts` warms the Reflect reads and the Kokoro model at boot.

## 3. Reflect-specific inventory and classification

Legend: **R** reuse as is · **RM** reuse with modifications · **T** replace with Titan · **U** replace with Umbra/Nimbus · **N** build new · **X** remove (only if genuinely unnecessary)

| Component | File(s) | Class | Note |
|---|---|---|---|
| Pet art + animation | `Pet.tsx`, `pet-sprite.ts` | R | Palette tokens may be re-themed per product |
| Pet positioning, spotlight, bubble | `PetLayer.tsx`, `positioning.ts` | R | |
| Guide engine (runner, fields, waits, cancel) | `CompanionProvider.tsx` | RM | Split into engine + product-aware context; add replanning and run-context |
| Control commands | `commands.ts` | R | Add "change X to Y" detection (Phase 3) |
| Step schema + audit | `actions.ts` | RM | Generic over a product registry; add new step kinds |
| Registry mechanism | `registry.ts` (types, `validate`, `getElement`) | RM | Becomes per-product registries behind one interface |
| Registry content | `PAGES`, `ELEMENTS` in `registry.ts` | T + U | |
| Workflow templates | `workflows.ts` | T + U | Templates become optional starting points for the planner |
| Orchestrator loop, `finalize`, `speakable`, `voiceLength`, `dropNulls`, `llmFriendlySchema` | `orchestrator.ts` | RM | Product-agnostic loop; prompt, `CORE_TOOLS`, `siteMap` move to product adapters |
| LLM provider | `provider.ts` | R | |
| Rules fallback | `rules.ts` | T + U | One small rules planner per product |
| MCP client | `mcp-client.ts` | RM | Multi-server registry (titan, umbra), tool namespacing |
| MCP framework helpers | `packages/mcp-server/src/tool.ts` | RM | Extract to a shared package `packages/mcp-kit` |
| Reflect MCP tools + client | `packages/mcp-server/src/tools/*`, `packages/reflect-api` | X (archive) | Keep in git history; remove from the build once the new servers pass |
| Browser MCP bridge | `app/api/mcp/route.ts` | RM | Allow-list per product |
| Companion API route | `app/api/companion/route.ts` | RM | Accept `product`, `runContext`, `appState` |
| Voice STT/TTS engines + routes | `voice.ts`, `voice-server.ts`, `lib/server/voice.ts`, `lib/server/tts/*`, `app/api/stt,tts,voice` | R | Vocabulary/corrections/tickers → per-product data |
| Rate limiting | `rate-limit.ts` | R | |
| Warmup | `instrumentation.ts` | RM | Warm Titan/Umbra reads instead |
| App pages | `app/(app)/*`, `components/pages/TradeForm.tsx`, `WhitelabelWizard.tsx`, `NewUserHelp.tsx` | T + U | New Titan swap/limit UI and Umbra privacy UI |
| Marketing site | `app/(site)/*`, `components/site/*`, `lib/site/*` | X / N | Replace with one small landing page for the summit demo |
| AppShell / header / banner | `components/AppShell.tsx` | RM | Product switcher; keep the "independent demo" banner |
| UI primitives, motion helpers | `components/ui/*` | R | |
| Tests | `test/*.test.ts`, `e2e/companion.spec.ts`, MCP tests | RM | Keep the engine tests; rewrite the product tests |

## 4. Existing problems and technical debt (verified)
1. **The step schema is coupled to one product's ids at type level** (`z.enum(ELEMENT_IDS)` in `actions.ts`). Two products need a registry abstraction before anything else.
2. **No run context in LLM turns.** `TurnInput` has `page`, `history`, `fields`, but not the active workflow or step. Mid-workflow questions and "change X" can't be handled properly.
3. **No replanning.** Runs are immutable arrays. Modify/resume means a restart.
4. **Implicit intent.** You can't test "explain vs act vs diagnose" because no intent field exists.
5. **`CompanionProvider.tsx` is 818 lines** mixing voice wiring, runner, field registry and UI state. That's high change risk; split it before adding features.
6. **Single MCP connection** hard-wired to one server path.
7. **The free-tier LLM (Groq qwen3) has an 8k tokens/minute cap.** The compact prompt plus relevant-tool filtering exists for this reason. Two products double the tool surface, so routing must stay tight.
8. Domain words for voice (`STT_VOCABULARY`, `applyDomainCorrections`, `speechText`) are hard-coded constants.
9. `apps/web/next-env.d.ts` flips between dev and prod builds (cosmetic, ignored).
10. Kokoro model download (~92 MB) happens on first boot. Concurrent first boots can race (`lib/server/tts/kokoro-worker.mjs` handles failure by exiting; there's no pre-download script yet).

## 5. Missing capabilities for the new vision
- Product identification (Titan vs Umbra vs general).
- Explicit intent types: act, learn, explain, diagnose, compare, explore, resume, modify, cancel, question-during-run.
- An application-state snapshot sent to the planner (selected tokens, amount, quote shown, account registered, balances visible), not just field values.
- Step preconditions and `observe` steps, so the plan adapts to what the user already did.
- Two new MCP servers with honest provenance (`live` vs `mock`).
- Mock data layer for wallet/balances/quotes/private accounts, labelled in the UI.
- Titan and Umbra demo UIs.

## 6. What works today (regression baseline to preserve)
- 71 unit tests (web), 12 (mcp-server), 15 (reflect-api) and 9/9 Playwright e2e pass at `2652ddf`.
- Voice in/out with fallbacks, the pet across client-side navigation, spotlight, autofill-on-yes, stop/Escape, never-click and never-sign guarantees.
- Recorded demo videos: `apps/web/demo-videos/*.mp4`.
