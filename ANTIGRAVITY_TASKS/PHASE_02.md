# Phase 02: Product adapter and registry abstraction
**Objective:** Two products can plug into one engine. Prove it by running Reflect as adapter #1.

**Steps**
1. `lib/companion/engine/registry-types.ts`: move `ElementSpec`, `ElementKind`, `ValidationRule`, `validate()` and `getElement`-style helpers out of `lib/companion/registry.ts`, generic over a `Registry {pages, elements}`.
2. `lib/companion/engine/actions.ts`: `makeStepSchema(registry)`, `makeWorkflowSchema`, `auditWorkflow(wf, registry)`. Keep `renderTemplate`.
   - Add step kinds `explain {say, target?}` and `observe {until, timeoutMs<=30000, say?}`.
   - Add an optional `skipIf` on every step. A predicate is `{state: string path, equals?: string, exists?: boolean}`; it is data only.
3. `lib/products/types.ts`: `ProductAdapter` exactly as in `TARGET_ARCHITECTURE.md`.
4. `lib/products/reflect/`: move the current registry, workflows and rules there behind the adapter.
5. The runner and orchestrator take the adapter (from the URL path via `productForPath`) instead of importing Reflect modules.
6. Runner support for `explain`, `observe` (poll the `AppState` getter every 250 ms until the predicate holds or the timeout fires, then fail gracefully) and `skipIf`.

**Tests**
- Unit tests for `makeStepSchema`: rejects ids from another registry.
- Unit tests for `skipIf` and `observe` predicate evaluation.
- Existing tests still pass.

**Acceptance:** the Reflect demos A/B/C pass e2e unchanged.
