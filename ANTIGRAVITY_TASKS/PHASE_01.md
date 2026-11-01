# Phase 01: Baseline and engine split
Read `README.md` in this folder first.

**Objective:** Create a safe restore point, then split `apps/web/components/companion/CompanionProvider.tsx` (818 lines) without changing behaviour.

**Steps**
1. `git tag reflect-final`. Run all tests and record the counts in `PROJECT_STATUS.md`.
2. Create these hooks under `apps/web/components/companion/hooks/`, moving code without rewriting it:
   - `useVoice.ts`: the voice wiring effect, `toggleMic`, `setMuted`, `MUTE_KEY`.
   - `useFieldRegistry.ts`: `registerField`, `notifyFieldChange`, `fill`, the field timers.
   - `useGuideRunner.ts`: `runFrom`, `executeStep`, `startWorkflow`, `completeStep`, `cancel`, `back`, `repeat`, `restart`, `retry`, `confirmOffer`.
3. `CompanionProvider.tsx` composes the hooks and keeps the same context value (`useCompanion()` API unchanged).

**Preserve:** every exported name used by `Panel.tsx`, `PetLayer.tsx`, `NewUserHelp.tsx` and the `(app)` pages.

**Acceptance**
- All unit tests pass and all 9 e2e tests pass, with no test edits.
- The provider file is under 300 lines.

**Rollback:** `git reset --hard reflect-final`.
