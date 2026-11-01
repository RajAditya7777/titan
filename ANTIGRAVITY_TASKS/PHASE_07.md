# Phase 07: Umbra UI, simulator, adapter and planners
**Objective:** An Umbra-inspired privacy UI (original design) with a fully simulated account.

**Steps**
1. **`lib/products/umbra/simulator.ts`:** a client store (persisted per tab) with:
   - `walletConnected` (simulated), `registered`, `publicBalances`, `privateBalances`, `history`
   - a fake recipient directory with one registered and one unregistered address.
   - **Operations:**
     - `register()` takes 1.5 s, then sets registered.
     - `deposit`, `send`, `withdraw` each go through the states `preparing → proving → submitted → done` with delays.
     - They fail with the documented codes for: insufficient balance, unregistered recipient, unsupported token.
   - **No real keys.** Show a "Simulated: no real funds or keys" badge on every panel.
2. **Pages:** `app/(umbra)/umbra/page.tsx` with Deposit / Send / Withdraw tabs, as observed in the v2 app.
   - Account panel: Create account / registered status; public vs private balances.
   - The Send tab has a "Receiving address" field plus a Private/Public account choice, and a "What's visible?" drawer fed by `umbra_privacy_report`.
   - Confirm buttons are `sensitive` and end at "Approve in wallet (simulated)".
3. **`lib/products/umbra/`:** `registry.ts`, `state.ts` (`UmbraAppState` mirrors the simulator, no keys), `planner.ts`, `prompt.ts`, `voice.ts`, `rules.ts`.
   - Goals: `register`, `deposit`, `private_send`, `withdraw`, `explain_privacy`.
   - `private_send` uses `skipIf registered` and `skipIf privateBalance >= amount` (else insert a deposit sub-plan), then checks recipient registration through `umbra_check_transfer_readiness`. If unregistered, it explains and offers a public send or asking the recipient to register.

**Acceptance (e2e)**
- "send 10 USDC privately" from an unregistered account → register → deposit → send → stop before approve.
- An unregistered recipient → a correct explanation.
- "what can people see?" → the privacy report, with no run started.
