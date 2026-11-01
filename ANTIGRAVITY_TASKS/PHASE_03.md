# Phase 03: Intent, run context, deterministic planner, replanning
**Objective:** Dynamic workflows (D-004, D-005).

**Steps**
1. `lib/companion/engine/types.ts`: `Intent`, `RunContext` (see `TARGET_ARCHITECTURE.md`).
2. `app/api/companion/route.ts` + `orchestrator.ts`:
   - `TurnInput` gains `product`, `appState` (validated with the adapter's `appStateSchema`, unknown keys stripped) and `run`.
   - `companion_respond` gains `intent {type, product, goal?, slots}`.
   - The system prompt includes the active run in one line and the adapter's `promptFragment`.
3. Server dispatch by intent:
   - `act` → `adapter.goals[goal](slots, appState)`.
   - `modify` → merge `run.slots` with the new slots and re-plan.
   - `learn`/`explain`/`diagnose`/`compare` → speech (+ point / `call_tool`), with **no workflow**.
   - `cancel` → stop.
   - Return `{speech, intent, workflow?, replan?: boolean}`.
4. Runner:
   - `replan(workflow)` swaps the steps and continues at the first step whose `skipIf` is false, without restarting narration.
   - A question during a run pauses it, answers, then says "Shall we continue?". "yes" resumes; "stop" cancels.
5. Rules fallback returns `Intent` too ("what is X" → explain; "swap/send/deposit" → act; "instead/change" → modify).

**Tests (no LLM, unit)**
- "what is slippage" makes no workflow.
- "I want to swap SOL for USDC" makes a workflow.
- "actually USDT" during a run re-plans and keeps the step index of completed steps.
- "stop" cancels.
- `appState` with an extra field `privateKey` is stripped.

**Acceptance:** all tests green. Reflect still works.
