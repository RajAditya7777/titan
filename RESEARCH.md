# RESEARCH — Reflect Money public surface (investigated 2026-11-01)

Everything below was verified by direct inspection (GitHub API, npm registry, live HTTP calls).
Anything inferred rather than read is marked **(inferred)**.

## 1. Repositories inspected — `github.com/palindrome-eng` (27 public repos)

| Category | Repos | Notes |
|---|---|---|
| Web frontend / dashboard | **none** | No `app`, `web`, `dashboard`, `frontend`, `ui` or `whitelabel` repo is public. |
| SDK | `swig-ts`, `emerald-sdk`, `emerald-react`, `unstake-ag`, `loopscale-client` | None of these is the Reflect stablecoin SDK. |
| Stablecoin SDK source | `reflect-delta-neutral` | Referenced as `repository.url` of the npm package `@reflectmoney/stable.ts`, but **returns 404** — private. |
| Protocol / programs | `reflect-routing`, `reflect-ncn`, `srl-program`, `smart-account-program`, `swig-wallet`, `kora`, `doppler`, `protocol-v2`, `usdr` | Rust/Solana programs. |
| Integration templates | `integration-template`, `junior-tranche-router` | Rust templates for Argos routing integrations. |
| Analytics adapters | `DefiLlama-Adapters`, `dimension-adapters`, `yield-server` | Forks used for DefiLlama listings. |
| AI / agents | `agent-skills` | One skill: `skills/integrate-reflect/SKILL.md` (v1.1.0). No MCP server. |
| Design system / shared UI | **none** | |
| Audits | `audits` | |

## 2. Frontend source availability

- `https://app.reflect.money` is a **Next.js pages-router** build (`/_next/static/chunks/pages/[stablecoin]-*.js`), with custom `.otf` fonts. Source is not public.
- `https://reflect.money` marketing site tagline: *"Money can do more. Earn. Create. Protect."*

**Decision: no accessible official frontend → build an independent demonstration app.**
No Reflect source, fonts, logos or images are copied. The demo is labelled as an independent proof of concept on every page.

## 3. SDK / API functionality (verified)

npm packages (all MIT): `@reflectmoney/stable.ts@5.3.2`, `@reflectmoney/proxy.ts@2.9.0`, `@reflectmoney/oracle.ts`, `@reflectmoney/restaking` (post-beta only).

REST API: `https://prod.api.reflect.money` (dev: `https://dev.api.reflect.money`).
Authoritative spec: `https://docs.reflect.money/api-reference/openapi.json` (~100 operations).

Live probe results (all unauthenticated):

| Endpoint | Result | Used by tool |
|---|---|---|
| `GET /health` | 200 | health check |
| `GET /stablecoin/types` | 200 → `[{0,"USDC+"},{1,"USDT+"}]` | overview |
| `GET /stablecoin/limits` | 200 → supplyCap / currentSupply / remainingCapacity | overview |
| `GET /stablecoin/{index}/apy` | 200 → `{ apy: 172.94 }` | overview |
| `GET /stablecoin/apy` | **404 "No stablecoin yield data found"** | — (documented but broken today) |
| `GET /stablecoin/exchange-rates` | 200 → `base_usd_value_bps: 1012847375` | overview |
| `GET /stablecoin/{index}/apy/historical?days=N` | 200 | stats |
| `GET /stablecoin/exchange-rates/historical?stablecoin=0&days=N` | 200 | stats |
| `POST /stablecoin/quote/{mint\|redeem}` body `{stablecoinIndex, depositAmount}` | 200 → `{data: 99164212}` for 100 USDC | **quote tools** |
| `POST /stablecoin/mint` / `/burn` | returns unsigned base64 `VersionedTransaction` | prepare_transaction (requires a user pubkey) |
| `GET /stats` | 200 → users, supply, cumulativeVolume, tvl, totalYieldDistributed | stats |
| `GET /stats/historical?days=N` | 200 | stats |
| `GET /events/all/{limit}` | 200 | events |
| `GET /whitelabel/verified` | 200 | whitelabel examples |
| `GET /whitelabel/underlying/apy` | 200 → per-mint `apy_bps` | APY cross-check |
| `GET /oracle/signed-messages/{assetMint}` | documented; returns signed pull-oracle payloads | oracle tool |

### Discrepancies found (important for anyone integrating)

1. **Quote body shape.** `agent-skills/SKILL.md` documents `{"amount": 1000000, "index": 0}`. The live API rejects it (`400 "Stablecoin index is required"`). The OpenAPI spec's `{"stablecoinIndex", "depositAmount"}` works. The skill file is stale; the spec is the source of truth.
2. **`/integration/*` → `/whitelabel/*`.** The skill documents `/integration/...`; the API now serves `/whitelabel/...` (`/integration/verified` → 404).
3. **APY units.** The spec describes `apy` as "APY as a number" with example `5.25` (a percent). The live value is `172.94`, and `/whitelabel/underlying/apy` returns `apy_bps: 179` for the USDC+ mint at the same moment. **(inferred)** `apy` is in basis points (≈1.73 %). The demo converts bps → % and shows the raw value in tool output.
4. **`/stablecoin/apy` (all coins) returns 404** while the per-index route works → the MCP tool fans out per index instead.
5. **`/stats` → `tvl: 1`** while `supply` is `1866486207333` (≈ $1.87 M at 6 decimals). `tvl` looks unpopulated **(inferred)**; the UI shows supply and does not present `tvl` as dollars.
6. **License.** `agent-skills` README and SKILL frontmatter say MIT; the repo's `LICENSE` file is **GPL-3.0**. We do not copy code from it; we only cite it.
7. **Closed beta.** Per the skill, users must be whitelisted before transacting. A prepared mint tx for a non-whitelisted wallet may fail on-chain.

## 4. Existing MCP / Agent Skill functionality

- **No MCP server exists** in the org. `agent-skills` is a static Markdown reference for coding assistants.
- Our MCP server is therefore new work, built on the documented REST API.

## 5. Reusable code and licenses

| Asset | License | How we use it |
|---|---|---|
| REST API + OpenAPI spec | public docs | Endpoint shapes for the typed client |
| `@reflectmoney/*` SDKs | MIT | Not used: the REST API covers everything the demo needs without bundling Solana deps |
| `agent-skills` | GPL-3.0 (LICENSE file) | Referenced by URL only |

## 6. Known limitations

- No wallet connection in the demo; `reflect_prepare_transaction` requires a user-supplied public key and **never signs**.
- Whitelabel creation endpoints (`/whitelabel/initialize/flow`) create real on-chain state. No test environment is confirmed for them, so the demo **does not call them**; the whitelabel page is a guided configuration with validation and a summary only.
- Restaking: SDK not available until public beta → not implemented.
- Portfolio balances need a wallet → shown as clearly labelled **demo data**.
- Tranche endpoints are dev-API only → out of scope.

## 7. Final architecture decision

Independent pnpm monorepo:

- `packages/reflect-api`: typed, Zod-validated REST client (timeouts, read-only retries, 429 handling).
- `packages/mcp-server`: official `@modelcontextprotocol/sdk` server (stdio) exposing the verified tools.
- `apps/web`: Next.js demo app with the companion. The Next server is an **MCP client** of the server above and proxies the LLM, so no secret reaches the browser.

See `ARCHITECTURE.md`.
