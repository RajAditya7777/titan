# Migration plan: Reflect companion → Titan + Umbra companion

Inputs: `PROJECT_AUDIT.md` (what exists), `RESEARCH_TITAN_UMBRA.md` (verified product facts), `DECISIONS.md`.

## Unchanged (keep working throughout)
- **Pet and positioning:** `Pet.tsx`, `pet-sprite.ts`, `PetLayer.tsx`, `positioning.ts`.
- **Voice stack:** `lib/companion/voice*.ts`, `lib/server/voice.ts`, `lib/server/tts/*`, `/api/stt`, `/api/tts`, `/api/voice`.
- **LLM and shared plumbing:** `provider.ts`, `rate-limit.ts`, `components/ui/*`.
- **Local commands and safety rules:** `commands.ts` (stop/mute/next/back/repeat/confirm), the never-click and never-sign rules.

## Changes
| From (Reflect) | To |
|---|---|
| One registry `lib/companion/registry.ts` | `lib/companion/engine/registry-types.ts` (types, `validate`) + `lib/products/{titan,umbra}/registry.ts` |
| `StepSchema` bound to Reflect ids | `makeStepSchema(registry)`; new steps `observe`, `explain`, `skipIf` precondition |
| `workflows.ts` fixed templates | `lib/products/*/planner.ts`: `plan(goal, appState)` deterministic, skips satisfied steps |
| LLM chooses `workflow_id` | LLM returns `intent`, `product`, `slots` via `companion_respond` (D-004) |
| `TurnInput {page, history, fields}` | + `product`, `appState` (typed), `run` (active goal, step, status) |
| `CompanionProvider.tsx` monolith | `useVoice`, `useGuideRunner` (with `replan`), `useFieldRegistry`, product `useAppState` |
| `mcp-client.ts` single server | Registry of `titan` and `umbra` stdio servers, tools `titan_*` / `umbra_*` |
| `packages/mcp-server` + `reflect-api` | `packages/mcp-kit`, `packages/titan-mcp`, `packages/umbra-mcp` (Reflect removed after Phase 8) |
| Reflect pages and site | `/` hub, `/titan/swap`, `/titan/limit`, `/titan/learn`, `/umbra` (Deposit/Send/Withdraw tabs, account panel) |
| Voice vocabulary constants | Per-product `voice.ts` data (tickers, corrections, STT prompt) |
| `rules.ts` | Per-product rules fallback (no-LLM mode) |

## Removed (only after replacements pass their tests)
- `app/(site)/*`, `components/site/*`, `lib/site/*`
- the Reflect `(app)` pages
- `packages/mcp-server`, `packages/reflect-api`

Tag `reflect-final` first (D-009).

## Data honesty
- **Titan quotes:** live from the Developers Portal when `TITAN_API_KEY` is set, otherwise a deterministic mock labelled **Simulated**.
- **DART-eligible pairs:** read from the free `GET /dart/markets`.
- **Umbra:** fully simulated (the SDK is browser-only, mainnet-only and gated by a token). The account, balances and operations live in a clearly labelled simulated store.
- **Simulated wallet:** "Demo wallet (simulated)". No real signing anywhere (D-008).
