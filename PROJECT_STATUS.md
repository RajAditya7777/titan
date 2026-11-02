# Project status (the single source of truth: update at the end of every phase)

**Current phase:** Umbra Privacy completed end-to-end ✅ | Titan integration ready
**Next exact task:** Titan MCP server (`packages/titan-mcp`) & hub integration

## Completed
| Phase | Commit / Date | Notes |
|---|---|---|
| 00 | Prior | Audit, research, decisions, architecture, roadmap, phase prompts |
| REA | Prior | Connected REA MCP to 8 agents, verified with `rea doctor` |
| Titan Web | Prior | Reconstructed Titan UI (`/titan`, `/titan/swap`, `/titan/limit`, `/titan/learn`), state, quote engine, planner, 9 tests |
| Umbra Web | Prior | Reconstructed Umbra UI (`/umbra`), stealth tokens, zk-proving simulator, privacy matrix, 22 tests |
| `mcp-kit` | Current | Created `@companion/mcp-kit` shared MCP server and tool infrastructure |
| `umbra-mcp` | Current | Built `@companion/umbra-mcp` (`umbra-companion-mcp`) with 10 verified tools and forbidden words audit |
| Umbra Companion | Current | Wired Umbra MCP and workflows into `mcp-client.ts`, `orchestrator.ts`, `rules.ts`, and `workflows.ts` |

## Baseline status
- **Tests:** 137 unit tests green across workspace:
  - `apps/web`: 102 passed
  - `packages/mcp-kit`: 3 passed
  - `packages/umbra-mcp`: 5 passed
  - `packages/mcp-server`: 12 passed
  - `packages/reflect-api`: 15 passed
- **Production Build:** Next.js Turbopack build succeeded with 0 errors.
- **Active Routes:**
  - Umbra: `/umbra` (Account Status, Deposit/Shield, Private Send, Withdraw, Transparency Card)
  - Titan: `/titan`, `/titan/swap`, `/titan/limit`, `/titan/learn`
- **Works:**
  - voice in/out (Whisper large-v3, local Kokoro TTS, browser fallbacks)
  - voice on/off
  - the pixel pup with spotlight and movement
  - guided workflows, never-click and never-sign rules
  - Reflect MCP server.

## Key paths
- Engine: `apps/web/components/companion/*`, `apps/web/lib/companion/*`
- Server: `apps/web/lib/server/*`, `apps/web/app/api/*`
- MCP: `packages/mcp-server` (to be replaced by `packages/{mcp-kit,titan-mcp,umbra-mcp}`)

## Environment (`apps/web/.env.local`, never committed)
| Var | Purpose |
|---|---|
| `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | Groq LLM |
| `STT_MODEL=whisper-large-v3`, `STT_LANGUAGE` | Speech-to-text |
| `TTS_ENGINE`, `KOKORO_VOICE` | Voice |
| `TITAN_API_KEY`, `TITAN_QUOTE_PUBKEY` | Phase 04+, optional: live Titan quotes |

## Pending features
Phases 01–10 (see `IMPLEMENTATION_ROADMAP.md`).

## Known issues
- `apps/web/next-env.d.ts` flips between dev and prod builds (ignore).
- Kokoro first-boot model download is about 92 MB.

## External dependencies / approvals
- Titan Portal Sandbox key (free, self-serve).
- No Umbra access needed (simulated).
- No Titan or Umbra brand approval obtained, so the demo stays clearly independent.
