# Rules for every phase (read before each PHASE_XX.md)

1. Read `PROJECT_STATUS.md`, `TARGET_ARCHITECTURE.md`, `DECISIONS.md`, and `RESEARCH_TITAN_UMBRA.md` for any product fact.
2. Implement **only** the current phase. Open every file before you change it. Don't refactor unrelated code.
3. Never invent APIs, endpoints or SDK methods. Use only what `RESEARCH_TITAN_UMBRA.md` marks V. Anything simulated is labelled "Simulated" in the UI and returns `simulated: true` from tools.
4. **Safety invariants, never weakened:**
   - The engine never clicks.
   - Fills happen only after an explicit "yes".
   - `stop_before_signing` is always last.
   - No keys, seeds or signatures anywhere.
   - The LLM can only name registered ids.
5. **Gate before you finish:**
   - `pnpm -r test` (all green).
   - `pnpm --filter @companion/web typecheck`.
   - `pnpm --filter @companion/web e2e` (dev server on :3200).
6. Commit locally with the message `phase-XX: <summary>`. Don't push.
7. Update `PROJECT_STATUS.md`: phase, files changed, what works, open issues, test counts, next task. Add a `DECISIONS.md` entry for any new design choice. Then **stop**.
