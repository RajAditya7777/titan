# Architectural decisions

Each entry: context → decision → why → consequences. Newest last. Add a new entry rather than
editing an old one; mark superseded entries.

## D-001 Evolve the existing app, don't rebuild
- **Context:** The Reflect companion already has a working pet, voice, guide engine, MCP plumbing and tests (`PROJECT_AUDIT.md` §2, §6).
- **Decision:** Keep the Next.js monorepo and stack. Change content and product logic; refactor the engine only where two products require it.
- **Why:** Most of the hard parts (voice fallbacks, spotlight positioning, the never-click/never-sign guarantees, cancellation) are product-agnostic and already tested.
- **Consequences:** Every phase must keep the engine regression tests green.

## D-002 One shared engine, products as adapters
- **Decision:** A `ProductAdapter` per product (`titan`, `umbra`) owns its registry (pages and elements), state schema, templates, prompt fragment, voice vocabulary, rules fallback and MCP server id. The engine (runner, schema factory, planner, voice, pet) knows nothing product-specific.
- **Why:** Adding a third product should mean adding a folder, not editing the engine. This is the open/closed principle, applied through ports and adapters.

## D-003 Step schema is built per registry, not hard-coded
- **Context:** `StepSchema` in `lib/companion/actions.ts` uses `z.enum(ELEMENT_IDS)` for one product.
- **Decision:** `makeStepSchema(registry)` returns the Zod schema for a product. Validation stays strict: unknown ids are rejected.
- **Why:** This keeps the security boundary (the LLM can only name registered ids) while supporting several registries.

## D-004 The LLM extracts intent and slots; a deterministic planner builds steps
- **Decision:** `companion_respond` returns a typed `intent` (`act | learn | explain | diagnose | compare | explore | modify | resume | cancel | chat`), `product`, and `slots` (e.g. `{inputToken:"SOL", outputToken:"USDC", amount:"1"}`). For `act`/`modify`, a deterministic `plan(goal, appState)` function in the product adapter builds the steps and skips steps whose precondition is already met. Free-form `custom_steps` remain only for short explore/explain tours, and are still schema-validated.
- **Why:** Plans that depend on live UI state must be correct every time; LLMs are good at understanding requests and bad at keeping multi-step state consistent. This also makes "swap USDT instead" a slot change plus a replan, not a restart, and lets the whole planner be unit-tested without an LLM.
- **Consequences:** Each "act" capability needs a goal type and a planner function. Unknown goals degrade to explanation plus pointing.

## D-005 App state is a typed, non-sensitive snapshot from the browser
- **Decision:** Each product exposes a Zod-typed `AppState` (e.g. selected tokens, amount, whether a quote is shown, simulated account-registered flag). It's sent with every turn and used by the planner and `observe`/`skipIf` steps. It never contains keys, seed phrases or signatures.
- **Why:** "Inspect the current application state" (the vision's step 3) needs data, and passing a whitelist-typed snapshot is the least-privilege way to provide it.

## D-006 Two MCP servers sharing a small kit
- **Decision:** `packages/titan-mcp` (server name `titan-companion-mcp`) and `packages/umbra-mcp` (`umbra-companion-mcp`), both built on `packages/mcp-kit` (extracted from `packages/mcp-server/src/tool.ts`). `lib/server/mcp-client.ts` becomes a registry holding one connection per server. Tool names are prefixed `titan_*` and `umbra_*`.
- **Why:** This was required by the brief, and it makes each server independently testable. Prefixes keep the LLM's tool namespace unambiguous.

## D-007 Provenance gains `mock`
- **Decision:** `Provenance = live | derived | static-docs | mock | not-implemented`. Every mock result also carries `simulated: true`, and the UI shows a "Simulated" badge wherever mock data is displayed.
- **Why:** The brief forbids passing off simulated quotes, balances or transactions as real; provenance already exists for exactly this.

## D-008 No real wallet in the summit demo
- **Decision:** The demo uses a clearly labelled simulated wallet. Nothing connects to a real wallet, builds a real transaction or touches real keys. Signing steps end with `stop_before_signing` on a simulated "Review in wallet" screen.
- **Why:** This removes the entire class of key-handling and accidental-transaction risks. It suits an independent demo, which has no authorization to transact on the products' behalf.
- **Revisit if:** a product team authorizes a real integration; then add read-only wallet balance first.

## D-009 Reflect code is archived, not deleted mid-migration
- **Decision:** Tag `reflect-final` before Phase 4. `packages/mcp-server` and `packages/reflect-api` stay in the build until both new servers pass their tests, then they're removed in one commit.
- **Why:** This gives a reversible migration with a working app at every phase.

## D-010 Engine refactor before product work
- **Decision:** Split `CompanionProvider.tsx` (818 lines) into `useVoice`, `useGuideRunner`, `useFieldRegistry` and a thin provider before touching products.
- **Why:** Phases 3–6 all edit this file; splitting it first lowers the merge and regression risk for the coding agent.
