# Reflect Companion: independent proof of concept

A voice-first AI guide that walks users through Reflect Money workflows. You say what you want; an animated companion moves to the right control, spotlights it, explains it with live Reflect data, waits for you, and stops before anything is signed.

> Independent demo. Not affiliated with or operated by Reflect Money. Visual language is inspired by reflect.money (Geist type, ink and Reflect-blue palette); all code and artwork are original. Live data comes from Reflect's public API.

## Quick start

```bash
pnpm install
```

```bash
cp .env.example apps/web/.env.local   # optional: add an OpenAI-compatible LLM key
```

```bash
pnpm dev                               # http://localhost:3200
```

Use Chrome or Edge for voice. With no `LLM_API_KEY`, the companion runs on the deterministic offline planner; the badge in the panel says which engine answered.

The MCP server works on its own too:

```bash
pnpm --filter @companion/mcp-server smoke      # live stdio round-trip against Reflect's API
```

```bash
pnpm mcp:inspect                               # MCP Inspector UI
```

Claude Desktop / Cursor config: `{"command": "npx", "args": ["tsx", "<repo>/packages/mcp-server/src/bin.ts"]}`.

## Tests

```bash
pnpm test                        # 55 unit/integration tests (mocked API)
```

```bash
pnpm e2e                         # Playwright: 3 demos + safety, against the LIVE API (system Chrome)
```

## What's live, derived, mocked or unavailable

| Capability | Status |
|---|---|
| Stablecoin overview (APY, exchange rate, supply) | **Live**, `reflect_get_stablecoin_overview` |
| Protocol stats + 30-day APY / rate history | **Live**, `reflect_get_protocol_stats` |
| Recent protocol events | **Live**, `reflect_get_protocol_events` |
| Mint / redeem quotes | **Live**, `reflect_get_mint_quote` / `reflect_get_redeem_quote` |
| Whitelabel collateral options + APYs | **Live**, `reflect_get_whitelabel_options` |
| Oracle signed messages | **Live endpoint**, `reflect_get_oracle_data` (needs a configured asset mint) |
| Docs search | **Live**, `reflect_get_documentation` (docs.reflect.money/llms.txt) |
| Unsigned mint/redeem transaction | **Live but unused in the UI**: `reflect_prepare_transaction` needs a wallet address and never signs |
| Integration checker, error explainer | **Derived**: rules from the OpenAPI spec, the agent skill, and observed API errors |
| Balances, portfolio, personal history | **Mocked**, labelled "Demo data" (no wallet connection) |
| Wallet signing, whitelabel deployment, restaking | **Unavailable by design**: the companion stops before them |
| LLM | Any OpenAI-compatible endpoint (tested: Groq `qwen/qwen3.8-27b`), else the **offline rules** planner |
| Voice input | **Server Whisper large-v3** (`/api/stt`, open weights, tuned for Indian English: 16.3% → 9.2% word errors vs turbo on en-IN clips) when `STT_MODEL` is set, else browser Web Speech in `en-IN` |
| Voice output | **Local Kokoro-82M** (Apache-2.0, runs in a worker thread, no key; Indian English voice `hf_alpha`, model auto-downloads ~92 MB to `apps/web/.models`); falls back to the browser voice. "Voice on/off" in the panel (or say "voice off") gives text only, remembered per browser |

## LLM and voice setup (Groq example)

In `apps/web/.env.local` (gitignored, never commit keys):

```bash
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=<your key>
LLM_MODEL=qwen/qwen3.8-27b
STT_MODEL=whisper-large-v3
# STT_LANGUAGE=en          # or "auto"; KOKORO_VOICE=hf_alpha|hf_beta|hm_omega|hm_psi; TTS_ENGINE=kokoro|provider|off
# TTS_MODEL=canopylabs/orpheus-v1-english   # accept the model terms on console.groq.com first
```

Why qwen and not `gpt-oss-120b`: on Groq, gpt-oss regularly produced invalid tool calls in the round after a tool result (calls to non-existent tools, broken JSON), and Groq rejects those server-side. qwen passed the same two-round test reliably. Free-tier keys are capped at 8k tokens/minute, so the orchestrator sends only the tools relevant to the question and a compact prompt.

## The companion

- **Voice-first.** The mic toggles hands-free listening; speech is interruptible by pressing the mic, saying "stop", or pressing Esc. Control words (`stop`, `repeat`, `next`/`skip`, `go back`, `start again`, `explain this`, `yes`/`no`, spoken numbers) are parsed locally, never sent to the LLM. Typed input works everywhere as a fallback.
- **Physically guides.** It walks to the target, avoiding the target itself and the panels, faces it, points, and spotlights it. It re-tracks on scroll and resize, and the bubble doubles as live captions.
- **Has a personality.** It reacts differently on each hover (wave, spin, wiggle, giggle, hop, hearts), follows your cursor with its eyes, blinks, and falls asleep after 25s idle.
- **Persists** across pages because it lives in the root layout.

## Demo script (2–3 min)

1. **0:00 Hook.** "Instead of learning Reflect, just tell it what you want." Hover the pet: it waves, then giggles.
2. **0:15 Demo A.** Mic: *"I'm new here. Show me how Reflect works."* It tours stablecoins, APY, Mint and Redeem, walks to the USDC+ page, and reads the live exchange rate. Say *"stop"* mid-way to show control.
3. **1:00 Demo B.** *"Help me mint 100 USDC+."* It opens Mint and points at the amount; say *"yes"* to fill it. It speaks the **live MCP quote**, waits for you to click Review, then points at "Approve in wallet" and stops: *"Only you can sign."*
4. **1:50 Demo C.** *"I want to create my own yieldcoin."* Name, a deliberately bad ticker (the pet looks confused), a fixed ticker, live collateral APYs, a fee, the summary, and Deploy stays disabled.
5. **2:30 Close.** Show the tool-call chips with `live` provenance, then `pnpm --filter @companion/mcp-server smoke` hitting the real API.

See `RESEARCH.md` for the investigation and API discrepancies found, and `ARCHITECTURE.md` for the design, safety model and failure behaviour.
