# Project status (the single source of truth: update at the end of every phase)

**Current phase:** 00, audit and planning ✅ complete
**Next exact task:** `ANTIGRAVITY_TASKS/PHASE_01.md` (baseline tag + engine split)

## Completed
| Phase | Commit | Notes |
|---|---|---|
| 00 | (this commit) | Audit, research, decisions, architecture, roadmap, phase prompts |

## Baseline (Reflect companion at `2652ddf`)
- **Tests:** web 71 unit, mcp-server 12, reflect-api 15, e2e 9/9. All green.
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
