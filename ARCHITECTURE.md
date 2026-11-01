# Architecture

```
 Browser (Next.js client)                          Next.js server (Node)                 MCP server (child process, stdio)
┌───────────────────────────────────────┐        ┌──────────────────────────────┐      ┌──────────────────────────────┐
│ Mic ─► SpeechToText (adapter)          │        │ POST /api/companion          │      │ McpServer (official SDK)     │
│          │                             │        │   Zod-validate request       │      │  11 tools, Zod input schemas │
│          ▼                             │ fetch  │   runTurn():                 │stdio │  provenance + sources on     │
│ Command parser (stop/next/yes/…) ──────┼──────► │    LLM provider (OpenAI-     │◄────►│  every result                │
│   local, instant, offline              │        │    compatible) + MCP tools   │ MCP  │          │                   │
│          │ not a command               │        │    or offline rules planner  │      │          ▼                   │
│          ▼                             │        │   finalize(): Zod + audit    │      │ ReflectClient                │
│ CompanionProvider (state machine)      │ ◄──────┤   → CompanionReply           │      │  timeouts, read-only retries │
│   guide.navigate / highlight / fill /  │        │                              │      │  429 backoff, cache,         │
│   waitForAction / cancel …             │        │ POST /api/mcp (allow-list of │      │  coalescing, no-body logs    │
│          │                             │ ──────►│   5 read-only tools)         │      │          │                   │
│          ▼                             │        │                              │      │          ▼                   │
│ Element registry (data-companion ids)  │        │ Server components ── callTool│      │ prod.api.reflect.money (live)│
│ PetLayer: placement maths, spotlight,  │        └──────────────────────────────┘      └──────────────────────────────┘
│   bubble   TextToSpeech (adapter) ─► 🔊│
└───────────────────────────────────────┘
```

## Layers and why they're separate

| Layer | Files | Responsibility | Why it's its own layer |
|---|---|---|---|
| Reflect client | `packages/reflect-api` | Typed REST access, unit conversion, resilience | One place knows the API's quirks (body names, units, error shapes). |
| MCP server | `packages/mcp-server` | Tools for any MCP host | Reusable outside this app (Claude Desktop, Cursor). The web app is just one client. |
| Orchestrator | `apps/web/lib/server/llm` | Intent → tools → validated reply | The LLM is swappable; the rules planner keeps the product working without it. |
| Guide engine | `apps/web/components/companion/CompanionProvider.tsx` | Runs typed steps, owns state | The only code that touches the DOM, and only through the registry. |
| Audio | `apps/web/lib/companion/voice.ts` | STT/TTS behind interfaces | Swap Web Speech for a realtime API without touching guidance. |
| Pet | `Pet.tsx`, `PetLayer.tsx`, `positioning.ts` | Rendering, motion, placement | Placement is a pure function, so it can be unit-tested without a DOM. |

## Safety model (defence in depth)

1. **The LLM has no DOM access.** It can only return `companion_respond` arguments.
2. **Schema:** `StepSchema` is a discriminated union over registered element ids. Selectors, code and URLs can't be expressed.
3. **Audit:** `auditWorkflow` rejects input steps on sensitive or non-fillable elements and requires `stop_before_signing` to be terminal. It runs on the server (after the LLM) and again in the browser (before execution).
4. **LLM ad-hoc steps** are limited to `navigate`, `point` and `celebrate`. Money flows come only from reviewed templates in `workflows.ts`.
5. **The engine never dispatches clicks.** `wait_for_user_action` listens for a *trusted* user click. `fill()` refuses `sensitive` and non-`fillable` elements, and only runs after an explicit "yes" or a button press.
6. **Browser → MCP bridge** is an allow-list of five read-only tools. `reflect_prepare_transaction` isn't reachable from the browser or the chat LLM, since no wallet is connected.
7. **Secrets:** LLM keys live only in the Next server env. The MCP child gets an explicit, minimal env. Logs carry method/path/status/latency, never bodies.

## Behaviour at scale and under failure

- **Reflect API slow or down:** 8s read timeout, 2 retries with exponential backoff and jitter (reads and quotes only), and 429 → `RATE_LIMITED` with a longer base delay. Tools return `{ok:false, error:{code, retryable, hint}}`; the UI shows an error card, the pet shows its error state, and the guidance bar offers Retry/Skip.
- **Load:** a 15s GET cache with in-flight coalescing, so N users on the dashboard make about one upstream call per endpoint per 15s. There's also a client-side 10 req/s budget. A multi-instance deployment would need a shared cache (Redis) instead of per-process memory.
- **LLM down or misbehaving:** provider errors fall back to the rules planner, and invalid output is dropped field by field, keeping the speech.
- **MCP child crashes:** the connection is dropped on close, and the next call respawns it. `MCP_TRANSPORT=inprocess` covers platforms without child processes (serverless).
- **DOM changes:** missing elements are awaited (MutationObserver, 4s), then reported with Skip/Stop. The pet goes home if its target unmounts.

## What could break it later

- **Upstream contract drift.** Zod schemas turn drift into `INVALID_RESPONSE` instead of wrong numbers, and the unit inferences (APY in bps, limits in whole tokens) are documented in RESEARCH.md and should be confirmed with Reflect.
- **Web Speech availability.** Chrome and Edge support recognition; Safari and Firefox are partial. Typed input is always available.
- **Registry ids drifting from markup.** The e2e suite exercises every workflow target on the real DOM.
