# Implementation roadmap

Phases run strictly in order. Each one ends stable, tested and committed. The detailed prompts are in `ANTIGRAVITY_TASKS/PHASE_XX.md`.

| # | Phase | Depends on | Done when |
|---|---|---|---|
| 01 | Baseline and engine split | — | Tag `reflect-final`; `CompanionProvider` split into hooks; all existing tests pass unchanged |
| 02 | Product adapter and registry abstraction | 01 | Reflect runs as adapter #1 through `makeStepSchema`; tests green |
| 03 | Intent, run context, deterministic planner, replanning | 02 | Unit tests: explain vs act, modify re-plans without restart, questions mid-run keep the run |
| 04 | `mcp-kit` + `titan-companion-mcp` | 01 | MCP tests with mocked fetch; live quote with a key, mock without; MCP registry in web |
| 05 | Titan UI + adapter + planners | 03, 04 | `/titan/swap` and `/titan/limit`; "swap SOL for USDC" walkthrough; "what is slippage" starts no walkthrough |
| 06 | `umbra-companion-mcp` | 04 | Static and derived tools tested; privacy report covers the documented leaks |
| 07 | Umbra UI + simulator + adapter + planners | 03, 06 | `/umbra`; register → deposit → private send → withdraw, with the recipient-unregistered path |
| 08 | Hub, product switching, voice data, Reflect removal | 05, 07 | `/` hub; cross-product intent switches product; Reflect code removed; tests green |
| 09 | Polish, security and reliability tests | 08 | e2e for every demo script; safety test suite; Lighthouse ≥ 90 accessibility |
| 10 | Summit release | 09 | README, walkthroughs, known limitations, troubleshooting, demo videos, regression checklist |

## External dependencies
| Item | Needed for | If missing |
|---|---|---|
| `TITAN_API_KEY` (free Sandbox, developer.titan.exchange) | Live Titan quotes | Mock quotes, labelled |
| `TITAN_QUOTE_PUBKEY` (any public address; the quote API requires `userPublicKey`) | Live quotes | Mock quotes |
| Groq key (existing `.env.local`) | LLM and Whisper | Rules fallback and browser speech |
| Umbra gateway token | Not used (mainnet-only, real funds) | Full simulation (D-008) |

## Top risks
1. **Titan's docs disagree with the live UI** (tab names, Private tab). *Mitigation:* use the doc names, re-check before the summit.
2. **The 1 req/s Sandbox limit during a live demo.** *Mitigation:* 2 s quote cache, coalescing, mock fallback.
3. **The free LLM tier's tokens-per-minute cap** with two products' tools. *Mitigation:* only the active product's tools plus a compact prompt.
4. **Brand.** *Mitigation:* no logos or trade dress, an "independent, not affiliated" banner everywhere.
5. **Scope.** *Mitigation:* phases 05 and 07 ship one golden path first, extras after.

## Summit-ready means
- Four scripted demos pass end to end by voice and by text:
  1. Swap SOL→USDC, change to USDT mid-run, stop at review.
  2. "Why fewer tokens?" gives a diagnosis with no walkthrough.
  3. A limit order with validation.
  4. Private USDC send, including recipient-not-registered recovery.
- Every number is live or badged Simulated. No signing path exists.
- All tests are green, and the docs and videos are committed.
