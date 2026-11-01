# Product research: Titan Exchange and Umbra / Nimbus

Checked on **2026-11-02** against official sources only. **V** = verified (source given), **U** = uncertain
or unverified. `GB` = `https://titan-exchange.gitbook.io/titan`. Re-check anything marked U before
building on it, and re-check everything before the summit (the docs move fast).

---

## Titan Exchange

### What it is
- **V:** A Solana **meta-aggregator**. It collects quotes from several DEX aggregators and RFQ providers, simulates them on-chain and routes to the best (GB/readme, GB/developer-doc/getting-started/introduction).
- **V:** **Argos** is Titan's own off-chain, optimisation-based routing algorithm (GB/codex-of-knowledge/editor).
- **V:** **DART** (Dynamic Allocation and Real Time) is an on-chain router that re-splits the trade across pools at execution, marketed with a "Best Bid Offer" guarantee (GB/codex-of-knowledge/dart-routing).
  - UI modes are **Auto** (Argos + DART, recommended), **Only** and **Off**.
  - The status dot is green when DART is the executing route.
  - DART works for listed pairs (SOL/USDC, SOL/USDT, USDT/USDC, cbBTC/USDC, …) (GB/getting-started/titan-dart).

### Swap settings (V, GB/getting-started/quickstart-1)
- **Prime Mode:** sets slippage and transaction landing automatically and includes sandwich protection. An animated Prime button means it is active. Zero Titan fees.
- **Manual Mode, Max Slippage:** two values, **Base Tokens** and **Stable/LST**.
- **Manual Mode, Transaction Fee Methods:** **Priority Fees** or **MEV Protect** (Jito + Nozomi, anti-sandwich), each **Auto** (estimated, capped) or **Custom**.
- **AMM Exclusion:** AMM names are normalised across aggregators.

### Swap behaviour (V, GB/getting-started/quickstart)
- Only the input amount can be typed.
- Quotes refresh every second and are simulated.
- The UI shows the number of pools and DEXes used.
- Max and % buttons size the input.
- A swap that fails simulation at the chosen slippage errors. A reverted swap still costs the network fee (quickstart-1).

### Limit orders (V, GB/getting-started/titan-limit-orders)
- On-chain orders filled by market makers, with partial fills.
- Fields: pair, Buy/Sell, limit price (with a "Market:" reference), quantity (Max/50%/25%), expiry (Custom/7D/1D/1H/Never).
- A limit price worse than market is not allowed. The minimum order is $10 notional.
- 10 bps fee, rent refundable. Open orders show progress and can be cancelled.

### Private swaps (V, GB/getting-started/titan-private-swaps)
- Uses a "Vanish wallet" plus a one-time signer.
- SOL must be on one side, with at least about 0.012 SOL kept in the wallet.
- 0.25% fee, Jito bundles. Error: "Insufficient SOL For Private Swap".
- **U:** not visible on the live /spot page while logged out.

### Fees (V)
| Product | Fee |
|---|---|
| Basic swaps | No Titan fee (venues may charge) |
| Prime | Zero |
| DART | Up to 1 bps |
| Limit orders | 10 bps |
| Private swaps | 0.25% |

### Live UI as observed logged out (V, browser)
- `app.titan.exchange` redirects to `titan.exchange/pro`. Swap is at `titan.exchange/spot`.
- Top navigation: Swap, Pro, Profile, Rewards, More, a SOL price, Connect Wallet.
- **/spot:**
  - Left rail "Order types": **Instant**, **Limit (Beta)**, **DCA**, **Slice**.
  - Above the box: **Prime** pill, **DART: Auto** dropdown, chart toggle, **Refresh quote**.
  - **Sell** card (amount, ≈$, token selector, Balance), **Switch tokens**, **Buy** card (token selector, Paste CA).
  - Rate line "1 SOL ≈ … USDC" with **Flip exchange rate**, then a **Connect Wallet** call to action.
- **DCA:** needs a "Titan embedded wallet" onboarding before any form appears.
- **U:** Settings panel labels were not visible (gated behind the wallet). Use the doc names above.

### Developer access
| Path | Access | Use in demo? |
|---|---|---|
| **Developers Portal**, base `https://portal.api.titan.exchange`, header `x-api-key`. GET `/api/v1/quote/swap`, `/api/v1/info`, `/api/v1/venues`, `/api/v1/providers`. MessagePack unless `Accept: application/json`. (GB/developer-doc/developers-portal/*) | **Self-serve key**, Sandbox plan **$0, 1 req/s**, 2.5M credits/month. Keys must stay server-side. | **Yes, optional.** Live quotes when `TITAN_API_KEY` is set, else mock |
| Quote params: required `inputMint`, `outputMint`, `amount` (base units), `userPublicKey`. Optional `slippageBps` (default 100), `numQuotes` (≤10), `dexes`, `excludeDexes`, `onlyDirectRoutes`, `simulate`. `quotes` is an object keyed by provider. Execute `metadata.ExpectedWinner`, not the max `outAmount`. (GB/…/reference/quote-swap) | | |
| **DART Swap API (beta)** `https://api.titan.exchange/dart`: `GET /health`, `GET /markets`, `POST /swap`. No key, 1 req/s per IP. (GB/developer-doc/dart-swap-api/*) | Free | **Read-only only:** `/health`, `/markets` (DART-eligible pairs). Never `/swap` |
| Titan Direct (WebSocket), Gateway, `@titanexchange/sdk-ts` | Distributor JWT / Enterprise | No: explain only |
| Special orders (DCA, triggers, Slice) at `api.chronos.titan.exchange` | Partner keys + Sign-In with Solana | No: explain and mock only |

**Portal errors (V, GB/…/developers-portal/errors):**
- 400: bad parameter.
- 401 `invalid_api_key`.
- 403 "Missing Authentication Token", which actually means a wrong path or method.
- 404 code `-7`: no route found.
- 429 `rate_limited` (honour `retry-after`) vs `allowance_exhausted`.

### Brand and legal (V/U)
- No terms of use or brand page was found (`titan.exchange/terms` is a 404).
- **Policy for the demo:** no Titan logos or trade dress, a clear "independent, not affiliated" banner, and a factual description only.

---

## Umbra / Nimbus

### Naming (V)
- **Umbra** is the consumer app and brand (https://www.umbraprivacy.com/).
- **Nimbus** is the protocol and SDK ("the privacy network for building products").
- `docs.umbraprivacy.com` has a 308 redirect to `docs.nimbusprivacy.xyz`. Same team: npm scope `@umbra-privacy/`, endpoints `*.api-v2.umbraprivacy.com`.
- **Demo naming:** "Umbra" in the UI, "Nimbus protocol / SDK" when explaining internals. This is our reading, not an official statement.

### Concepts (V)
- **Private account** (https://sdk.nimbusprivacy.xyz/explainers/private-account.md):
  - The wallet signs a fixed message, and keys are derived **in the browser**.
  - The same wallet gives the same account on any device. `accountIndex` gives multiple accounts.
  - The account has a derived **platform wallet** and a public identity.
  - The SDK never sends the signature or spending keys to any service.
- **Private balance:** a set of notes. The chain shows only pool totals.
- **Registration:** one transaction per wallet, user pays the network fee.
  - It publicly links the main wallet and the platform wallet.
  - **Recipients must be registered** before anyone can pay them.
  - The indexer sees a registration within seconds.
- **Deposit:** public (wallet, token and amount are visible). The protocol fee comes out of the amount.
- **Private Send:** submitted by a **relayer**. The sender signs nothing on-chain and pays no SOL.
- **Withdraw:** to any address via the relayer (public destination, token and amount).
- **Fees** (https://sdk.nimbusprivacy.xyz/explainers/fees.md):
  - Protocol fee: a share of the amount, governance-set. **No public rates found.**
  - Network fee and relayer tip. The tip is currently 0 because the relayer sponsors it.
- **Tokens:** SOL plus approved tokens; the SDK lists 57 mainnet mints. USDC = `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
- **Compliance:** screening (CipherOwl + an OFAC list) co-signs deposits, transfers and withdrawals. Viewing-key disclosure is split across guardian nodes (https://docs.nimbusprivacy.xyz/screening, /disclosure).

### Public vs private (V, https://docs.nimbusprivacy.xyz/privacy/leaks)
- **Hidden in a Private Send:** sender, recipient, amount, token.
- **Public:** the transaction, its timing and relayer; the tip; deposit details; withdrawal details; the registration link.
- **Documented leaks:**
  - The recipient can identify the sender.
  - Matching amount and timing can link a deposit to a withdrawal.
  - Withdrawing to an address already linked to you.
  - Rare tokens make pairing easier.
  - Regular schedules group your transactions.
  - IP addresses and request timing.
- **Trust:** the program upgrade authority can change rules with **no timelock**; operators can halt payments.
- **The companion must never say "anonymous" or "untraceable".** It explains these limits.

### SDK (V, https://sdk.nimbusprivacy.xyz/getting-started/quickstart, /reference, /production/endpoints.md)
- **Package:** `@umbra-privacy/nimbus-solana-web` + `@solana/kit`. **Browser only** (proofs on the device), needs COOP/COEP headers.
- **Exported functions:**
  - Setup and sessions: `loadNimbusSdk`, `openNimbusSession`
  - Registration: `readRegistration`, `register`
  - Operations: `deposit`, `transfer`, `withdraw`
  - Reads: `readBalances`, `syncNoteStore`
  - Errors: `isNimbusSdkError`
- **Mainnet only, real funds**, and a **gateway token** is required (request from dev@umbraprivacy.com).
- **Decision:** the demo **simulates** all Umbra flows (no devnet, no token, real funds otherwise). The SDK is not installed.

### Documented errors (V, https://sdk.nimbusprivacy.xyz/production/troubleshooting.md)
- `recipient-unregistered`, `account-unregistered`
- `fee-payer-unfunded` (detail `requiredLamports`)
- `unauthorized`, `misconfigured`, `unsupported-browser`
- `mint-unsupported`, `amount-unfundable`, `relay-unavailable`, `service-unavailable`
- A deposit with status `unknown` must not be resubmitted (use `resolvePendingDeposit`).
- Stale balance: sync the note store first.

### v2 app as observed (V, browser)
- Tabs: **Deposit / Send / Swap / Withdraw**.
- **Send:** amount and token, "Receiving address" with **Private Account / Public Account**, "Send Using: Umbra Privacy (Default)", total fee, total received.
- **Withdraw:** "Use a different wallet address" toggle, "Withdrawing to: Public wallet".
- The call to action without a wallet is **Create an account**.
- **U:** the token list shown without a wallet looked like placeholder data.
