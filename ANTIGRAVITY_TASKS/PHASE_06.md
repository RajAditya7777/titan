# Phase 06: umbra-companion-mcp
**Objective:** A verified, read-only Umbra/Nimbus MCP server. No SDK, no network calls (D-008, research § Umbra).

**Steps**
1. `packages/umbra-mcp` (server `umbra-companion-mcp`) on `mcp-kit`. Tools as in `TARGET_ARCHITECTURE.md`.
2. `src/knowledge/*.ts`: paraphrased concepts with source URLs. Naming: "Umbra" for the app, "Nimbus" for the protocol/SDK.
3. `umbra_privacy_report(operation: register|deposit|private_send|withdraw)` returns `{hidden[], public[], caveats[]}` exactly from the documented leaks list. It never says "anonymous".
4. `umbra_check_transfer_readiness({senderRegistered, recipientRegistered, privateBalance, amount, token})` returns the ordered blockers, using the documented error codes (`account-unregistered`, `recipient-unregistered`, `amount-unfundable`, `mint-unsupported`).
5. `umbra_diagnose_error(code)` covers every code in the research file.

**Tests:**
- Each tool.
- A forbidden-words test: no tool output contains "anonymous", "untraceable" or "100% private".

**Acceptance:** package tests green; registered in the web MCP registry.
