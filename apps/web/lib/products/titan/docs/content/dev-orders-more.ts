import type { DocContent } from "../schema";

/** Page bodies for this section, keyed by slug. Own words; facts exact. */
export const PAGES: Record<string, DocContent> = {
  "special-order-types/order-types/dca": {
    "blocks": [
      {
        "t": "p",
        "text": "**With a `dca` order, a set `amountPerCycle` of the input mint is swapped on a repeating schedule, and the order ends once `totalAmount` has been spent.** At the start the user deposits the whole `totalAmount` in a single transaction. The manager holds it, and Titan swaps out one slice each cycle."
      },
      {
        "t": "p",
        "text": "Only DCA supports modification after creation, and only DCA can generate several executions."
      },
      {
        "t": "h2",
        "text": "Config"
      },
      {
        "t": "code",
        "code": "{\n  \"orderType\": \"dca\",\n  \"userPubkey\": \"<user's external Solana wallet>\",\n  \"config\": {\n    \"inputMint\":  \"So11111111111111111111111111111111111111112\",\n    \"outputMint\": \"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\",\n    \"totalAmount\":           \"1000000000\",\n    \"amountPerCycle\":        \"100000000\",\n    \"cycleFrequencySeconds\": 86400,\n    \"minOutputPerCycle\":     \"0\",\n    \"maxOutputPerCycle\":     \"0\",\n    \"startAt\":               1735689600,\n    \"expiresAt\":             1767225600\n  }\n}",
        "lang": "json"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Required",
          "Notes"
        ],
        "rows": [
          [
            "`inputMint`",
            "Yes",
            "SPL mint address. Must differ from `outputMint`."
          ],
          [
            "`outputMint`",
            "Yes",
            "SPL mint address."
          ],
          [
            "`totalAmount`",
            "Yes",
            "Total input the user spends over the order's life, funded as a single deposit at creation."
          ],
          [
            "`amountPerCycle`",
            "Yes",
            "Input spent each cycle. By default it must be worth at least **$10 USD**, which is your tenant's configured floor."
          ],
          [
            "`cycleFrequencySeconds`",
            "Yes",
            "Seconds between cycles. Minimum **60**."
          ],
          [
            "`minOutputPerCycle`",
            "No",
            "A cycle is skipped if its quote falls below this."
          ],
          [
            "`maxOutputPerCycle`",
            "No",
            "A cycle is skipped if its quote rises above this."
          ],
          [
            "`startAt`",
            "No",
            "Unix seconds. The first cycle waits until then."
          ],
          [
            "`expiresAt`",
            "No",
            "Unix seconds. The order expires automatically at this time."
          ]
        ]
      },
      {
        "t": "p",
        "text": "The top-level fields `userPubkey`, `outputRecipientAddress`, `platformFee` and `onboardIfNeeded` are common to every order type and are described in [Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders)."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Titan prices `amountPerCycle` at request time so it can apply the minimum. USDC and USDT are valued at $1.00 and every other mint goes through the oracle. An amount under the floor gets `400 MIN_NOTIONAL_NOT_MET`, and `details` repeats `mint`, `amount`, `usdCents` and `requiredCents`. When the oracle has no price for the mint the response is `503 PRICE_ORACLE_UNAVAILABLE`; that is a transient condition, so try again soon."
      },
      {
        "t": "p",
        "text": "Recurring cycle executions have their Solana network fees paid by Titan, so the manager does not need to hold SOL to keep the schedule going."
      },
      {
        "t": "h2",
        "text": "Read progress"
      },
      {
        "t": "p",
        "text": "`GET /dca/{orderId}` returns the order with its progress counters filled in:"
      },
      {
        "t": "code",
        "code": "{\n  \"cyclesCompleted\": 3,\n  \"totalCycles\": 10,\n  \"amountSpent\":    \"300000000\",\n  \"amountReceived\": \"150000000\",\n  \"nextExecutionAt\": \"2025-01-04T00:00:00.000Z\",\n  \"lastExecutionAt\": \"2025-01-03T00:00:00.000Z\",\n  \"lastExecutionTxHash\": \"<solana tx signature or null>\"\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "Because `nextExecutionAt` tells you when the next cycle will run, polling a DCA order is inexpensive and a tight loop is unnecessary. For per-cycle history call `GET /orders/{orderId}/executions`: it has one row per cycle (`executionType: \"dca_cycle\"`), newest first, up to 500 rows. See [Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema) for every field."
      },
      {
        "t": "p",
        "text": "It returns `404 NOT_FOUND` when the order does not exist, is not a DCA order, or belongs to another user."
      },
      {
        "t": "h2",
        "text": "Modify"
      },
      {
        "t": "p",
        "text": "`PATCH /dca/{orderId}` edits an `active` or `paused` DCA order; no other order type supports this. Editable fields: `amountPerCycle`, `cycleFrequencySeconds`, `totalCycles`, `totalAmount`, `minOutputPerCycle`, `maxOutputPerCycle`."
      },
      {
        "t": "p",
        "text": "Most edits apply immediately:"
      },
      {
        "t": "code",
        "code": "{ \"success\": true, \"data\": { \"requiresTransaction\": false, \"order\": { \"…\": \"…\" } } }",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "Changing `totalAmount` is different, because the difference must be deposited or withdrawn on-chain. Modify then becomes a two-step flow like creation, and the response includes an unsigned transaction:"
      },
      {
        "t": "code",
        "code": "{\n  \"success\": true,\n  \"data\": {\n    \"requiresTransaction\": true,\n    \"transactionType\": \"deposit\",\n    \"transactionAmount\": \"1000000000\",\n    \"newTotalAmount\":    \"2000000000\",\n    \"transaction\": \"<base64 unsigned tx>\",\n    \"encoding\": \"base64\",\n    \"memoId\": \"dca-modify-9b3f1ad0-…\",\n    \"cyclesCompleted\": 3,\n    \"config\": { \"…\": \"echoed config you submitted\" }\n  }\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "The user signs it, then you submit it to `POST /dca/{orderId}/modify/confirm` with the same `cyclesCompleted` and `config` that came back."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "While a modification awaits signing, cycle executions are paused. This guarantees that the signed `totalAmount` is applied to the same on-chain state the user reviewed. The lock expires on its own after **30 seconds**; if that happens before confirm, you receive `409 LOCK_EXPIRED` and need to start the modify intent over. Should a cycle slip in mid-signature, `cyclesCompleted` stops matching and confirm answers `400 MODIFICATION_ERROR`. Fetch the order again and ask the user to confirm once more."
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`VALIDATION_ERROR`",
            "Bad config."
          ],
          [
            "400",
            "`MIN_NOTIONAL_NOT_MET`",
            "New `amountPerCycle` is below your tenant's floor. Only checked when `amountPerCycle` changes."
          ],
          [
            "400",
            "`MODIFICATION_ERROR`",
            "A server-side guard rejected the change (for example shrinking `totalAmount` below what is already spent), or `cyclesCompleted` did not match."
          ],
          [
            "400",
            "`INVALID_REQUEST`",
            "The `/modify/confirm` body has the wrong shape."
          ],
          [
            "400",
            "`TRANSACTION_EXPIRED` / `TRANSACTION_TAMPERED`",
            "The 5-minute window passed, or the signed transaction differs from the unsigned one."
          ],
          [
            "404",
            "`NOT_FOUND`",
            "Order missing or not yours."
          ],
          [
            "409",
            "`LOCK_FAILED`",
            "Another modification is already in progress."
          ],
          [
            "409",
            "`LOCK_EXPIRED`",
            "The 30-second lock ran out before confirm arrived."
          ],
          [
            "503",
            "`PRICE_ORACLE_UNAVAILABLE`",
            "A non-stable `inputMint` could not be priced. Retry shortly."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Lifecycle"
      },
      {
        "t": "code",
        "code": "intent ──confirm──▶ active ──cycle..N──▶ completed\n                      │\n                      ├─ pending  ── (only with a future config.startAt;\n                      │               becomes active at that time)\n                      │\n                      ├─ pause/resume ↔  paused\n                      │\n                      ├─ executing  ── (during a cycle)\n                      │\n                      ├─ pending_modification  ── (during modify signing)\n                      │\n                      ├─ failed  ── (retry budget exhausted) ── unspent input auto-returned\n                      │              (retry ──▶ active only in the brief pre-return window)\n                      │\n                      ├─ cancelled  ── (user cancel)\n                      │\n                      └─ expired   ── (config.expiresAt reached)",
        "lang": "text"
      },
      {
        "t": "p",
        "text": "DCA has three behaviours of its own. First, setting a future `config.startAt` keeps the order `pending` until then; that is the sole route into that status, and with no `startAt`, confirm moves straight to `active`. Second, `POST /orders/{orderId}/retry` can bring a `failed` order back to `active`, but only during the brief window before the unspent input is auto-returned. Third, an `expired` DCA order is **not** auto-returned (trigger orders are), so call [order-level withdraw](/titan/docs/developer-doc/special-order-types/guides/withdrawals#order-level-withdrawals) yourself."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): how the two-step flow works and which top-level fields are shared",
          "[Managing Orders](/titan/docs/developer-doc/special-order-types/guides/managing-orders): pause, resume, retry, cancel",
          "[Lifecycle & Polling](/titan/docs/developer-doc/special-order-types/guides/lifecycle): statuses and polling cadence"
        ]
      }
    ],
    "lead": "Recurring swaps on a fixed schedule — config fields, progress tracking, and modification."
  },
  "special-order-types/order-types/stop-loss-take-profit": {
    "blocks": [
      {
        "t": "p",
        "text": "**A `stop_loss` or `take_profit` order puts up its whole `amount` as an upfront deposit, monitors a price, and performs a single swap when that trigger is crossed. The monitored price is either the pair ratio or the input token's USD price, depending on the order's `priceBasis`.** The config fields are identical for both types; they differ only in which way the comparison runs."
      },
      {
        "t": "table",
        "head": [
          "`orderType`",
          "Fires when"
        ],
        "rows": [
          [
            "`stop_loss`",
            "`price <= triggerPrice`: the market fell to the trigger"
          ],
          [
            "`take_profit`",
            "`price >= triggerPrice`: the market rose to the trigger"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Either can be made [trailing](/titan/docs/developer-doc/special-order-types/order-types/trailing) with `trailingStopBps`, which changes the meaning of `triggerPrice`. This page covers the static behaviour only."
      },
      {
        "t": "h2",
        "text": "Price basis"
      },
      {
        "t": "p",
        "text": "All prices on a trigger order are fixed-point numbers sent as a **string**, scaled by `10^priceDecimals`. That covers `triggerPrice`, `takeProfitPrice`, `stopLossPrice` and, in responses, `currentTriggerPrice`, `highestObservedPrice` and `executedPrice`. They all use a single denomination, which you choose at creation through the optional `priceBasis` field:"
      },
      {
        "t": "table",
        "head": [
          "`priceBasis`",
          "`triggerPrice` means",
          "Use for"
        ],
        "rows": [
          [
            "`\"pair\"` (default)",
            "The pair ratio `inputTokenUsd / outputTokenUsd`, i.e. output token per 1 input token",
            "Any order, and **all buy-side orders** (stablecoin input)"
          ],
          [
            "`\"usd\"`",
            "**USD per 1 whole input token**, independent of the output token",
            "Sell-side orders where the user thinks in dollars, such as \"sell JUP for SOL when JUP reaches $0.50\""
          ]
        ]
      },
      {
        "t": "code",
        "code": "// Both bases use the same scaling; only the meaning of the number differs.\nconst toPrice = (value: number, priceDecimals = 6): string =>\n  BigInt(Math.round(value * 10 ** priceDecimals)).toString();\n\ntoPrice(74);            // pair: SOL → USDC at $74   → \"74000000\"\ntoPrice(1 / 74, 9);     // pair: USDC → SOL at $74   → \"13513514\"\ntoPrice(0.45);          // usd:  JUP at $0.45        → \"450000\"",
        "lang": "typescript"
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "**The pair-basis trap.** On `SOL → USDC` the ratio coincidentally matches SOL's USD price, but flip the pair and it no longer does. Take a `USDC → SOL` order with SOL at $74: the right ratio is `1 / 74 ≈ 0.0135`, not `74`. If you are placing sell-side orders, `priceBasis: \"usd\"` sidesteps the conversion entirely."
      },
      {
        "t": "p",
        "text": "`priceDecimals` is chosen per order, from `0` to `18`:"
      },
      {
        "t": "table",
        "head": [
          "Case",
          "`priceDecimals`"
        ],
        "rows": [
          [
            "Prices of $1 and above, or pair ratios above 1",
            "`6`"
          ],
          [
            "Pair ratios below 1",
            "`9`"
          ],
          [
            "`usd` orders on a token priced below $1",
            "`9`, or more for sub-cent tokens"
          ]
        ]
      },
      {
        "t": "p",
        "text": "With 6 decimals, a $0.00002 token comes out as the integer `20`. That means triggers can only move in 5% steps, and a trailing stop advances in whole steps. The oracle itself carries 9 decimals."
      },
      {
        "t": "h3",
        "text": "Rules for priceBasis: \"usd\""
      },
      {
        "t": "table",
        "head": [
          "Rule",
          "Detail"
        ],
        "rows": [
          [
            "Prices the **input** token",
            "With a stablecoin input (USDC, USDT, PYUSD, USDS and similar) the value is about 1.00 and can't meaningfully trigger, so the request returns `400 VALIDATION_ERROR` at path `config.priceBasis`. Buy-side orders use `pair`."
          ],
          [
            "Immutable",
            "Like `priceDecimals`, it is fixed after creation and echoed on every read; orders created before the field existed read `\"pair\"`."
          ],
          [
            "Trigger semantics unchanged",
            "Stop-loss fires on the way down and take-profit on the way up; trailing peaks, OCO ordering and `minOutputAmount` all work the same. Only the compared number differs."
          ],
          [
            "`minOutputAmount`",
            "Always in **output-mint atoms**, whatever the basis. On a `usd` order, derive it from the trigger using the output token's USD price rather than multiplying `amount` by the USD trigger."
          ],
          [
            "Stablecoin output",
            "For `SOL → USDC`, the two bases differ only by the stablecoin's deviation from $1."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Config"
      },
      {
        "t": "code",
        "code": "POST /orders/intent\nX-Titan-Key: <partner-api-key>\nX-Titan-User: <your stable user id>\nContent-Type: application/json\n\n{\n  \"orderType\": \"stop_loss\",\n  \"userPubkey\": \"<user's external Solana wallet>\",\n  \"config\": {\n    \"inputMint\":  \"So11111111111111111111111111111111111111112\",\n    \"outputMint\": \"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\",\n    \"amount\": \"1000000000\",\n    \"triggerPrice\": \"50000000\",\n    \"priceDecimals\": 6,\n    \"minOutputAmount\": \"45000000\",\n    \"expiresAt\": 1767225600\n  }\n}",
        "lang": "http"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Required",
          "Notes"
        ],
        "rows": [
          [
            "`inputMint`",
            "Yes",
            "Base58. Must differ from `outputMint`."
          ],
          [
            "`outputMint`",
            "Yes",
            "Base58."
          ],
          [
            "`amount`",
            "Yes",
            "String, `> 0`. The input tokens sold when the trigger fires; this is the deposit."
          ],
          [
            "`triggerPrice`",
            "Yes",
            "String, `> 0`. On the order's `priceBasis`, scaled by `10^priceDecimals`."
          ],
          [
            "`priceDecimals`",
            "Yes",
            "Integer `0`–`18`."
          ],
          [
            "`priceBasis`",
            "No",
            "`\"pair\"` (default) or `\"usd\"`; see [Price basis](#price-basis). `\"usd\"` with a stablecoin `inputMint` returns `400 VALIDATION_ERROR`."
          ],
          [
            "`minOutputAmount`",
            "No",
            "String, `> 0`. Execution floor in **output-mint atoms**, on any basis. If the trigger is crossed but the quote is below it, the order **waits** rather than filling badly, for up to 120 consecutive below-floor quotes, then fails. See [Unreachable floor](#unreachable-floor)."
          ],
          [
            "`expiresAt`",
            "No",
            "Unix seconds, must be in the future. At expiry the deposit is auto-returned."
          ],
          [
            "`trailingStopBps`",
            "No",
            "Integer `1`–`9999`. Makes the order trailing; see [Trailing Stops](/titan/docs/developer-doc/special-order-types/order-types/trailing)."
          ],
          [
            "`trailingMode`",
            "No",
            "`stop_loss` only, requires `trailingStopBps`. A UI-only label; see [Trailing Stops](/titan/docs/developer-doc/special-order-types/order-types/trailing)."
          ],
          [
            "`onFillOco`",
            "No",
            "Arms a bracket on the bought tokens when this order fills; see [Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco)."
          ]
        ]
      },
      {
        "t": "p",
        "text": "Now the same stop denominated in USD, on a non-stable output: \"sell 100 JUP for SOL if JUP falls to $0.45\". Because a pair ratio would drift with SOL's price, it cannot represent this trigger:"
      },
      {
        "t": "code",
        "code": "POST /orders/intent\nX-Titan-Key: <partner-api-key>\nX-Titan-User: <your stable user id>\nContent-Type: application/json\n\n{\n  \"orderType\": \"stop_loss\",\n  \"userPubkey\": \"<user's external Solana wallet>\",\n  \"config\": {\n    \"inputMint\":  \"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN\",\n    \"outputMint\": \"So11111111111111111111111111111111111111112\",\n    \"amount\": \"100000000\",\n    \"triggerPrice\": \"450000\",\n    \"priceDecimals\": 6,\n    \"priceBasis\": \"usd\"\n  }\n}",
        "lang": "http"
      },
      {
        "t": "p",
        "text": "Every order type shares the top-level fields (`userPubkey`, `outputRecipientAddress`, `platformFee`, `onboardIfNeeded`, plus the optional `X-Idempotency-Key` header); they are covered in [Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders). The `confirm` call is identical to the one used for DCA."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "The minimum-notional check looks at the **entire `amount`**, not at a single cycle's slice. With a $10 floor, the order must total $10, and a shortfall returns the same `400 MIN_NOTIONAL_NOT_MET`."
      },
      {
        "t": "h3",
        "text": "Unfillable configurations"
      },
      {
        "t": "p",
        "text": "Creating an order whose trigger has already been passed is fine, and it executes right away. What Titan refuses are configurations that could **never** fill, answering `400 MIN_OUTPUT_UNSATISFIABLE`, in two cases:"
      },
      {
        "t": "table",
        "head": [
          "Case",
          "Applies to",
          "Condition",
          "`details`"
        ],
        "rows": [
          [
            "Structural (checked first)",
            "`stop_loss` only",
            "`minOutputAmount` is more than the output implied by `triggerPrice`. A stop-loss only fires at or below its trigger, so this is a limit above the stop and can't fill at any market price. Trailing stops are included, evaluated at the seed `triggerPrice`.",
            "`priceBasis`, `triggerPrice`, `minOutputAmount`, `outputAtTriggerPrice` (the highest floor that would be accepted)"
          ],
          [
            "Instant-fire",
            "`stop_loss`, `take_profit`",
            "The trigger is already crossed at the current price **and** `minOutputAmount` is more than the input's current market value.",
            "`priceBasis`, `triggerPrice`, `currentPrice` (the market on the order's basis), `minOutputAmount`, `fairOutputAmount`"
          ]
        ]
      },
      {
        "t": "p",
        "text": "When `priceBasis` is `\"usd\"`, the output implied by the trigger hinges on the output token's USD price. The structural check therefore uses the **current** output price; it is only advisory and is skipped if the oracle is down."
      },
      {
        "t": "p",
        "text": "In both cases, lower `minOutputAmount` or change `triggerPrice`."
      },
      {
        "t": "p",
        "text": "`400 VALIDATION_ERROR` also covers these trigger-specific problems: an `expiresAt` in the past; `priceDecimals` outside `0`–`18`; `amount` or any price not `> 0`; `minOutputAmount` not `> 0`; `priceBasis` set to something other than `\"pair\"` or `\"usd\"`; `priceBasis: \"usd\"` with a stablecoin `inputMint`; a malformed `onFillOco`; and any retired take-profit field (`scaleSteps`, `entryPrice`, `minProfitBps`)."
      },
      {
        "t": "h2",
        "text": "Read"
      },
      {
        "t": "p",
        "text": "`GET /stop-loss/{orderId}` and `GET /take-profit/{orderId}` return the base [Order](/titan/docs/developer-doc/special-order-types/reference/schema#order) shape plus type-specific fields:"
      },
      {
        "t": "table",
        "head": [
          "Endpoint",
          "Adds"
        ],
        "rows": [
          [
            "`/stop-loss/{orderId}`",
            "`amount`, `triggerPrice`, `priceDecimals`, `priceBasis`, `minOutputAmount?`, `expiresAt?`, `executedPrice?`, `executedPriceDecimals?`, `amountReceived?`, the trailing state `trailingStopBps?`, `trailingMode?`, `currentTriggerPrice`, `highestObservedPrice?`, the bracket fields `onFillOco?`, `childOrderId?`, `onFillError?`, and the below-floor streak `minOutputUnmetCount`, `minOutputUnmetSince?`, `lastQuoteOutputAmount?` (see [Unreachable floor](#unreachable-floor))"
          ],
          [
            "`/take-profit/{orderId}`",
            "The same, with take-profit trailing state (`trailingStopBps?`, `trailingActivated`, `highestObservedPrice?`, and no `currentTriggerPrice`), plus `amountRemaining` and `scaleStepsExecuted`"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Amount and price fields are all strings. Every timestamp in a response is ISO-8601, `expiresAt` included, even though you submitted it in Unix seconds. `priceBasis` is always returned (it reads `\"pair\"` for orders created before the field was introduced) and it determines the units of every price on the object, `executedPrice` too."
      },
      {
        "t": "h3",
        "text": "executedPrice scale"
      },
      {
        "t": "p",
        "text": "Scale `executedPrice` with `executedPriceDecimals`, not `priceDecimals`. Once filled, `executedPrice` is the realized price on the same basis as `triggerPrice` (for `\"pair\"`, output tokens received per input token sold; for `\"usd\"`, dollars per input token; both counted in whole tokens), scaled by `executedPriceDecimals`, which matches `priceDecimals`. It reports the actual fill from the route, whereas `triggerPrice` is checked against the oracle mark, so slippage and fees explain any gap between them."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Orders that filled before `executedPriceDecimals` existed return `executedPrice` with no `executedPriceDecimals`. Such legacy values are the unprocessed swap-quote ratio (output atoms per input atom at 9 decimals), so they are off by `10^(inputDecimals − outputDecimals)`, which is 1000× for SOL/USDC. Never assume a scale for them; a missing `executedPriceDecimals` means the number cannot be rendered as a price."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "If the id exists but belongs to another `orderType`, both endpoints answer `404 NOT_FOUND`. Take `orderType` from `GET /me/orders` and route by it instead of trying endpoints one after another."
      },
      {
        "t": "p",
        "text": "**You can disregard these when present:** `entryPrice`, `minProfitBps` and `scaleSteps` are legacy fields that older orders may still carry. They have no meaning for orders you create, so build your UI only on the fields documented above."
      },
      {
        "t": "h2",
        "text": "Executions"
      },
      {
        "t": "p",
        "text": "Exactly **one** execution row is written for a trigger order, at the moment it fires. Its `executionType` is `stop_loss` or `take_profit_full`, and `price` is the triggering price using the same fixed-point encoding as the order."
      },
      {
        "t": "h2",
        "text": "Lifecycle"
      },
      {
        "t": "code",
        "code": "intent ──confirm──▶ active ──trigger crossed──▶ executing ──▶ completed\n                      │\n                      ├─ pause/resume ↔ paused          (price not watched while paused)\n                      │\n                      ├─ cancelled  ── (user cancel; withdraw flow as DCA)\n                      │\n                      ├─ failed   ── deposit auto-returned within ~1 minute\n                      │\n                      └─ expired  ── (config.expiresAt reached) ── deposit auto-returned",
        "lang": "text"
      },
      {
        "t": "p",
        "text": "Four things differ from DCA, and each affects your integration. One: once confirmed, the order is **`active` immediately**, with nothing like `startAt`, so it is never `pending`, and `pending_modification` is not a state it can have. Two: **modify** covers parameters alone. Prices, expiry and trail change in place through `PATCH /stop-loss/{orderId}` or `PATCH /take-profit/{orderId}`, no transaction involved ([Modify a trigger order](/titan/docs/developer-doc/special-order-types/guides/managing-orders#modify-a-trigger-order)); `amount` and mints cannot change, so to resize, cancel and recreate. Three: **retry does not exist**. `POST /orders/{orderId}/retry` returns `400 RETRY_NOT_SUPPORTED`, although `400 ALREADY_WITHDRAWN` is what you will usually see first, since auto-return normally finishes in under a minute. Four: **`expired` is auto-returned too**, which DCA does not do, meaning `withdrawalStatus` becomes `completed` by itself for `failed` and `expired` alike."
      },
      {
        "t": "p",
        "text": "A `completed` trigger order has nothing left to withdraw. Its one fill consumed the entire deposit and sent the output to `outputRecipientAddress` when it executed, so `POST /orders/{orderId}/withdraw` returns `400 NOTHING_TO_WITHDRAW`. Order-level withdrawal is relevant only for `cancelled` trigger orders, because their deposit never left the manager."
      },
      {
        "t": "p",
        "text": "Pausing, resuming and cancelling work through the same endpoints, with the same semantics, as for DCA. A paused trigger order is not watched for price, and it re-arms the moment you resume."
      },
      {
        "t": "p",
        "text": "An entry order with `onFillOco` that completes carries a `childOrderId` pointing to the bracket it created; see [Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco)."
      },
      {
        "t": "h3",
        "text": "Unreachable floor"
      },
      {
        "t": "p",
        "text": "When `minOutputAmount` is set and the trigger has been crossed but the quote can't reach the floor, Titan re-quotes on each price evaluation and the order remains `active` in the meantime. After **120 consecutive** quotes below the floor, the order becomes `failed` with `failureReason: \"min_output_unreachable\"`, and its deposit is auto-returned as for any failed trigger order."
      },
      {
        "t": "p",
        "text": "While the streak runs, the detail endpoints expose it:"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Meaning"
        ],
        "rows": [
          [
            "`minOutputUnmetCount`",
            "Consecutive below-floor quotes. `0` when there is no streak."
          ],
          [
            "`minOutputUnmetSince`",
            "When the streak began. Absent when the count is `0`."
          ],
          [
            "`lastQuoteOutputAmount`",
            "The latest quote that missed the floor, in output-mint atoms."
          ]
        ]
      },
      {
        "t": "p",
        "text": "This is all you need to display \"the market would pay X, your minimum is Y\". The streak starts over when a quote clears the floor, when price moves back away from the trigger, or when you update `minOutputAmount` with `PATCH`."
      },
      {
        "t": "p",
        "text": "Counting happens per evaluation, and the cadence follows price-feed coverage (roughly once a second for streamed pairs, otherwise once every 30 seconds). So 120 evaluations equal somewhere between about 2 minutes and about 1 hour of real time."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Since a trigger order might fire **whenever** the market crosses it, and has no `nextExecutionAt`, there is no schedule to time your polling by. For as long as an armed order is shown to the user, poll its detail endpoint or `GET /me/orders/active` at a sensible rate. Titan offers no webhooks."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Trailing Stops](/titan/docs/developer-doc/special-order-types/order-types/trailing): the changes `trailingStopBps` makes for each order type",
          "[OCO Brackets](/titan/docs/developer-doc/special-order-types/order-types/oco): take-profit and stop-loss sharing one deposit",
          "[Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco): buy when a condition is met, then bracket automatically",
          "[Managing Orders](/titan/docs/developer-doc/special-order-types/guides/managing-orders#modify-a-trigger-order): editing prices, expiry and trail without recreating"
        ]
      }
    ],
    "lead": "One-shot orders that sell the full deposit when the watched price crosses a trigger."
  },
  "special-order-types/order-types/oco": {
    "blocks": [
      {
        "t": "p",
        "text": "**An `oco` order protects a position using one deposit, with a take-profit above the entry and a stop-loss below it.** Whichever leg triggers first swaps the whole `amount` and cancels the other; that is where the name One-Cancels-Other comes from."
      },
      {
        "t": "p",
        "text": "Placing two independent orders instead would reserve the deposit twice, whereas OCO reserves it only once."
      },
      {
        "t": "table",
        "head": [
          "Leg",
          "Fires when"
        ],
        "rows": [
          [
            "Take-profit",
            "`price >= takeProfitPrice`"
          ],
          [
            "Stop-loss",
            "`price <= stopLossPrice`"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Prices follow the stop-loss and take-profit conventions: the same fixed-point encoding and [price basis](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#price-basis), meaning a pair ratio unless you set `priceBasis: \"usd\"` for USD per input token. The two legs use a single `priceDecimals` and a single `priceBasis`."
      },
      {
        "t": "h2",
        "text": "Config"
      },
      {
        "t": "code",
        "code": "POST /orders/intent\nX-Titan-Key: <partner-api-key>\nX-Titan-User: <your stable user id>\nContent-Type: application/json\n\n{\n  \"orderType\": \"oco\",\n  \"userPubkey\": \"<user's external Solana wallet>\",\n  \"config\": {\n    \"inputMint\":  \"So11111111111111111111111111111111111111112\",\n    \"outputMint\": \"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\",\n    \"amount\": \"1000000000\",\n    \"takeProfitPrice\": \"200000000\",\n    \"stopLossPrice\": \"50000000\",\n    \"priceDecimals\": 6,\n    \"expiresAt\": 1767225600\n  }\n}",
        "lang": "http"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Required",
          "Notes"
        ],
        "rows": [
          [
            "`inputMint`",
            "Yes",
            "Must differ from `outputMint`."
          ],
          [
            "`outputMint`",
            "Yes",
            "Output token mint."
          ],
          [
            "`amount`",
            "Yes",
            "String, `> 0`. One deposit shared by both legs."
          ],
          [
            "`takeProfitPrice`",
            "Yes",
            "String, `> 0`. On the order's `priceBasis`, scaled by `10^priceDecimals`."
          ],
          [
            "`stopLossPrice`",
            "Yes",
            "String, `> 0`, and **strictly less than** `takeProfitPrice`."
          ],
          [
            "`priceDecimals`",
            "Yes",
            "Integer `0`–`18`, shared by both legs."
          ],
          [
            "`priceBasis`",
            "No",
            "`\"pair\"` (default) or `\"usd\"`, shared by both legs. Same rules as [stop-loss](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#rules-for-pricebasis-usd)."
          ],
          [
            "`expiresAt`",
            "No",
            "Unix seconds, must be in the future. At expiry the deposit is auto-returned."
          ],
          [
            "`trailingStopBps`",
            "No",
            "Integer `1`–`9999`. Makes the **stop-loss leg** trailing; see [Trailing Stops](/titan/docs/developer-doc/special-order-types/order-types/trailing)."
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Sending `stopLossPrice >= takeProfitPrice` yields `400 VALIDATION_ERROR`, since a bracket requires a gap between the legs. Also note that `minOutputAmount` is **not supported on OCO**; if you send it, it is ignored without error, so leave it out of your OCO UI."
      },
      {
        "t": "p",
        "text": "Like every other order type, OCO uses the standard top-level fields (`userPubkey`, `outputRecipientAddress`, `platformFee`, `onboardIfNeeded`) and the same `confirm` step; details are in [Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders). As with any trigger order, the minimum-notional floor is checked against the full `amount`."
      },
      {
        "t": "h2",
        "text": "Read"
      },
      {
        "t": "p",
        "text": "`GET /oco/{orderId}` responds with the base [Order](/titan/docs/developer-doc/special-order-types/reference/schema#order) fields and, on top of them, `amount`, `takeProfitPrice`, `stopLossPrice`, `priceDecimals`, `priceBasis`, `expiresAt?`, `executedPrice?`, `executedPriceDecimals?`, `amountReceived?`, `pendingLeg?`, `parentOrderId?`, plus the trailing state of the stop-loss leg (`trailingStopBps?`, `currentTriggerPrice`, `highestObservedPrice?`)."
      },
      {
        "t": "p",
        "text": "`parentOrderId` is present when the OCO was generated automatically as the bracket of a [conditional entry](/titan/docs/developer-doc/special-order-types/order-types/otoco). To scale `executedPrice`, use `executedPriceDecimals`; see [`executedPrice` scale](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#executedprice-scale)."
      },
      {
        "t": "p",
        "text": "While the order is `executing`, `pendingLeg` (`stop_loss` or `take_profit`) names the leg that is currently mid-execution; at other times it is absent. It lets you show which side is filling."
      },
      {
        "t": "p",
        "text": "The response is `404 NOT_FOUND` when the order is missing, belongs to someone else, or is not an `oco` order."
      },
      {
        "t": "h2",
        "text": "Executions"
      },
      {
        "t": "p",
        "text": "The fill of an OCO is logged with the type of **the leg** that fired, either `stop_loss` or `take_profit_full`; no `oco` execution type exists. To learn which side triggered, check `executionType` on the single execution row."
      },
      {
        "t": "h2",
        "text": "Lifecycle"
      },
      {
        "t": "p",
        "text": "Lifecycle matches [stop-loss and take-profit](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#lifecycle): the order is `active` straight after confirm, retry is unavailable, and both `failed` and `expired` are auto-returned. `PATCH /oco/{orderId}` changes both legs' prices, the expiry and the trail in place; see [Modify a trigger order](/titan/docs/developer-doc/special-order-types/guides/managing-orders#modify-a-trigger-order). If you cancel before either leg triggers, the deposit remains in the manager, which makes a `cancelled` OCO the one situation where order-level withdrawal is relevant."
      },
      {
        "t": "p",
        "text": "Pausing stops both legs being watched at once, and resuming re-arms both."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Stop-Loss & Take-Profit](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit): how price basis works, plus the single-leg types",
          "[Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco): the OCO that gets created on its own once an entry order fills",
          "[Trailing Stops](/titan/docs/developer-doc/special-order-types/order-types/trailing): how the stop-loss leg can trail while the take-profit ceiling stays put",
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): the two-step flow all order types share"
        ]
      }
    ],
    "lead": "One deposit, two triggers — a take-profit ceiling and a stop-loss floor where the first fill cancels the other."
  },
  "special-order-types/order-types/otoco": {
    "blocks": [
      {
        "t": "p",
        "text": "Attach `onFillOco` to a `stop_loss`, `take_profit` or `slice` order (the **entry**). Once the entry fills, Titan opens a second order, the **bracket**, using the tokens the entry purchased. All of it needs one request, one signature and one deposit."
      },
      {
        "t": "p",
        "text": "Titan creates the bracket inside the same database transaction that sets the entry to `completed`, so the purchased tokens cannot be withdrawn in the gap. They are counted as locked in [`GET /me/balance`](/titan/docs/developer-doc/special-order-types/reference/endpoints#balances) from the instant the entry's swap is sent, first as the entry's pending output and afterwards as the bracket's `amount`."
      },
      {
        "t": "table",
        "head": [
          "Bracket field",
          "Value",
          "Settable"
        ],
        "rows": [
          [
            "`inputMint`",
            "The entry's `outputMint`",
            "No"
          ],
          [
            "`outputMint`",
            "The entry's `inputMint`",
            "No"
          ],
          [
            "`amount`",
            "The **actual on-chain output** of the entry's fill, with fees and slippage already netted",
            "No"
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Bracket shape"
      },
      {
        "t": "p",
        "text": "Supply `takeProfitPrice`, `stopLossPrice` or both, but at least one is mandatory. Which legs you include determines the bracket's `orderType`:"
      },
      {
        "t": "table",
        "head": [
          "Legs supplied",
          "Bracket `orderType`",
          "Bracket trigger"
        ],
        "rows": [
          [
            "Both",
            "`oco`",
            "`takeProfitPrice` / `stopLossPrice`, plus a trailing stop leg if `trailingStopBps` is set"
          ],
          [
            "`takeProfitPrice` only",
            "`take_profit`",
            "`triggerPrice = takeProfitPrice`"
          ],
          [
            "`stopLossPrice` only",
            "`stop_loss`",
            "`triggerPrice = stopLossPrice`, plus `trailingStopBps` if set"
          ]
        ]
      },
      {
        "t": "p",
        "text": "The bracket is a normal order of the resulting type. You can read it through the matching detail endpoint (`GET /oco/{id}`, `GET /take-profit/{id}` or `GET /stop-loss/{id}`) or in the lists, routing on its `orderType`. Its `parentOrderId` points back to the entry."
      },
      {
        "t": "h2",
        "text": "config.onFillOco"
      },
      {
        "t": "p",
        "text": "Allowed on `stop_loss`, `take_profit` and `slice` only, as an optional field; any other `orderType` gets `400 VALIDATION_ERROR`."
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Required",
          "Notes"
        ],
        "rows": [
          [
            "`takeProfitPrice`",
            "One of the two",
            "String, `> 0`. On the **bracket's** `priceBasis`, scaled by the bracket's `10^priceDecimals`."
          ],
          [
            "`stopLossPrice`",
            "One of the two",
            "String, `> 0`. When both prices are present, **strictly less than** `takeProfitPrice`."
          ],
          [
            "`priceDecimals`",
            "Yes",
            "Integer `0`–`18`. Independent of the entry's."
          ],
          [
            "`priceBasis`",
            "No",
            "`\"pair\"` (default) or `\"usd\"`. It prices the bracket's input token, which is the entry's `outputMint`. `\"usd\"` when that is a stablecoin returns `400 VALIDATION_ERROR` at path `config.onFillOco.priceBasis`. See [Price basis](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#price-basis)."
          ],
          [
            "`trailingStopBps`",
            "No",
            "Integer `1`–`9999`. Makes the stop leg trailing. Needs `stopLossPrice`; otherwise `400 VALIDATION_ERROR` at path `config.onFillOco.trailingStopBps`."
          ],
          [
            "`expiresAt`",
            "No",
            "Unix seconds, in the future. If the entry has `expiresAt`, this must be **later** than it."
          ],
          [
            "`outputRecipientAddress`",
            "No",
            "Where the bracket's fill is delivered. Defaults to `userPubkey`; must be `userPubkey` or the user's manager. Echoed back on reads."
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "**The entry has to deliver to the manager.** With `onFillOco` present, you may omit the entry's top-level `outputRecipientAddress` (it then resolves to the manager rather than the normal `userPubkey` default) or explicitly set it to the manager; anything else gets `400 VALIDATION_ERROR`. This requirement is what allows the bracket to trade the purchased tokens without a second deposit. The **bracket's** own `outputRecipientAddress` marks where the round trip finishes, so keep the default to send proceeds back to the user's wallet."
      },
      {
        "t": "p",
        "text": "`onFillOco` cannot be changed after creation."
      },
      {
        "t": "h2",
        "text": "Example"
      },
      {
        "t": "p",
        "text": "For example, to buy SOL using 1,000 USDC when SOL dips to $150 and then bracket the resulting position at $200 / $135 in USD:"
      },
      {
        "t": "code",
        "code": "POST /orders/intent\nX-Titan-Key: <partner-api-key>\nX-Titan-User: <your stable user id>\nContent-Type: application/json\n\n{\n  \"orderType\": \"take_profit\",\n  \"userPubkey\": \"<user's external Solana wallet>\",\n  \"config\": {\n    \"inputMint\":  \"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\",\n    \"outputMint\": \"So11111111111111111111111111111111111111112\",\n    \"amount\": \"1000000000\",\n    \"triggerPrice\": \"6666667\",\n    \"priceDecimals\": 9,\n    \"createdAs\": \"limit\",\n    \"onFillOco\": {\n      \"takeProfitPrice\": \"200000000\",\n      \"stopLossPrice\":   \"135000000\",\n      \"priceDecimals\": 6,\n      \"priceBasis\": \"usd\"\n    }\n  }\n}",
        "lang": "http"
      },
      {
        "t": "p",
        "text": "The entry buys, so its `triggerPrice` is a pair ratio (SOL per USDC, `1/150` at 9 decimals) as the [price-basis rules](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#price-basis) require. Selling SOL is the bracket's job, so it is free to use `\"usd\"`."
      },
      {
        "t": "h2",
        "text": "Slice Order entries"
      },
      {
        "t": "p",
        "text": "With a [`slice`](/titan/docs/developer-doc/special-order-types/order-types/slice) entry, the slices begin running right away as normal, and the bracket is armed once the **whole Slice Order is complete**, inside the transaction that sets the entry to `completed`."
      },
      {
        "t": "table",
        "head": [
          "Behavior",
          "Detail"
        ],
        "rows": [
          [
            "Bracket `amount`",
            "The **sum of every slice's actual on-chain output**, read from each slice's own transaction, never a quote and never the wallet balance. Tokens already in the manager, or arriving from another source while slices run, are excluded."
          ],
          [
            "While running",
            "Accumulated slice output counts as locked in `GET /me/balance`, as the entry's `amountReceived`. On completion, `amountReceived` is rewritten to the exact on-chain sum."
          ],
          [
            "After completion",
            "The completed Slice Order owns nothing. `POST /orders/{entryId}/withdraw` returns `400 NOTHING_TO_WITHDRAW`."
          ],
          [
            "Partial fill",
            "A `failed` Slice Order (fewer slices landed than `executionsTotal`) creates **no** bracket. Slices that did land sit in the manager as available balance, recoverable through the entry's order-level withdraw or a wallet-level withdraw. Unspent input is auto-returned as usual."
          ],
          [
            "`expiresAt`",
            "Allowed in the spec with no ordering rule, since a Slice Order has no expiry of its own."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Reads"
      },
      {
        "t": "table",
        "head": [
          "Order",
          "Adds"
        ],
        "rows": [
          [
            "Entry: `GET /stop-loss/{id}`, `GET /take-profit/{id}`, `GET /slice/{id}`, lists",
            "`onFillOco` (the stored spec, prices as strings, `outputRecipientAddress` always filled in), `childOrderId` (set once the bracket exists), `onFillError`"
          ],
          [
            "Bracket: `GET /oco/{id}`, or `GET /take-profit/{id}` / `GET /stop-loss/{id}` for a single-leg bracket",
            "`parentOrderId`"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Start by polling the entry. As soon as `status` reads `completed` and `childOrderId` is set, poll the bracket instead. It is a regular order of its own type, `active`, funded with `fundingSource: \"balance\"` and holding no separate deposit. Never assume it is an `oco`; check `orderType` in the list response or in `GET /orders/{id}`."
      },
      {
        "t": "h2",
        "text": "Lifecycle"
      },
      {
        "t": "table",
        "head": [
          "Phase",
          "Behavior"
        ],
        "rows": [
          [
            "Before the entry fills",
            "Same as any `stop_loss` or `take_profit`: pause, resume, cancel with withdrawal of the deposit, expiry, and failure with auto-return. In every terminal state other than a fill, the spec is discarded with the entry and no bracket is created."
          ],
          [
            "After the entry fills",
            "The entry is `completed` and owns nothing, so `POST /orders/{entryId}/withdraw` returns `400 NOTHING_TO_WITHDRAW`. The bracket is a normal order of its type: pause, resume, [modify](/titan/docs/developer-doc/special-order-types/guides/managing-orders#modify-a-trigger-order), and it fires like any other."
          ],
          [
            "Exiting early",
            "Cancel the bracket: `POST /orders/{childOrderId}/cancel` with the default `withdraw: true` cancels it and builds the withdrawal of its full `amount` (the bought tokens) to `userPubkey`."
          ]
        ]
      },
      {
        "t": "h3",
        "text": "onFillError"
      },
      {
        "t": "p",
        "text": "If Titan can't confirm the entry's on-chain output from its transactions, it does **not** create the bracket, since one sized from a quote could be larger than what really landed and would fail at trigger time. Before giving up it keeps retrying verification for several minutes, holding the entry in `executing` with the tokens still locked. For a Slice Order entry, the worker's retries last about 30 seconds and the recovery sweep then makes one final attempt."
      },
      {
        "t": "p",
        "text": "If verification does fail, the entry still completes, but with `onFillError: \"amount_unverified\"` and no `childOrderId`. The purchased tokens remain in the manager as **available** balance, from which you can set up the bracket by hand."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Stop-Loss & Take-Profit](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit): which order types can serve as entries, and price basis",
          "[Slice Orders](/titan/docs/developer-doc/special-order-types/order-types/slice): running a Slice Order as the entry",
          "[OCO Brackets](/titan/docs/developer-doc/special-order-types/order-types/oco): the bracket type that has two legs"
        ]
      }
    ],
    "lead": "Buy on a condition, then protect the position automatically — one request, one signature, one deposit."
  },
  "special-order-types/order-types/trailing": {
    "blocks": [
      {
        "t": "p",
        "text": "**A single field, `trailingStopBps`, makes any trigger order trail.** Its effect *varies* by order type, and the three behaviours truly differ. Confusing them is the quickest way to ship a trailing UI that misleads users."
      },
      {
        "t": "table",
        "head": [
          "Order type",
          "What `trailingStopBps` does",
          "Render the live trigger from"
        ],
        "rows": [
          [
            "`stop_loss`",
            "The trigger **ratchets up** as the market makes new highs",
            "`currentTriggerPrice` (server-computed)"
          ],
          [
            "`take_profit`",
            "`triggerPrice` becomes an **arm level** rather than a sell level",
            "compute it client-side"
          ],
          [
            "`oco`",
            "The **stop-loss leg** ratchets; the take-profit ceiling stays put",
            "`currentTriggerPrice` (server-computed)"
          ]
        ]
      },
      {
        "t": "p",
        "text": "`trailingStopBps` is an integer between `1` and `9999`, expressing pullback from the tracked peak in basis points, so `500` equals 5%."
      },
      {
        "t": "p",
        "text": "Dollar figures are used below for readability. In requests and responses each value is really a fixed-point string on the order's [price basis](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#price-basis): pair ratio by default, or USD per input token when `priceBasis: \"usd\"`."
      },
      {
        "t": "h2",
        "text": "Trailing stop-loss"
      },
      {
        "t": "p",
        "text": "Put `trailingStopBps` on a `stop_loss` order and its trigger climbs with the market. Each fresh high re-anchors the trigger to `peak × (1 − trailingStopBps/10000)`. The trigger **can only rise**: when the trail is wider than the space between market and stop, it stays at `triggerPrice` instead of dropping beneath it. Execution happens when price comes back down to the trigger's value at that instant."
      },
      {
        "t": "p",
        "text": "With `triggerPrice` at $90 and `trailingStopBps: 500`:"
      },
      {
        "t": "table",
        "head": [
          "Market does",
          "Trigger becomes"
        ],
        "rows": [
          [
            "Sits at $100",
            "$95"
          ],
          [
            "Runs to $120",
            "$114"
          ],
          [
            "Falls to $114",
            "**Fills**"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Absent a run-up, it behaves like a plain static $90 stop, because the trigger can't ratchet beneath your chosen value."
      },
      {
        "t": "p",
        "text": "In responses, `currentTriggerPrice` is the live trigger and `highestObservedPrice` is the peak so far (missing until the first new high). A stop-loss **always includes** `currentTriggerPrice`, which equals `triggerPrice` until the first ratchet, so your UI can read it for any stop-loss, whether or not it trails."
      },
      {
        "t": "callout",
        "tone": "danger",
        "text": "After an order starts trailing, display `currentTriggerPrice` instead of `triggerPrice`. `triggerPrice` is the initial stop and stays at its original value permanently; if you showed it to a user whose trail had moved up to $114, they would think their stop was still $90."
      },
      {
        "t": "h3",
        "text": "There's no separate \"pure trailing\" type"
      },
      {
        "t": "p",
        "text": "Since `triggerPrice` doubles as the initial stop and the floor, you build a pure trail yourself; there's no type to request. Compute the seed for `triggerPrice` from the live market with `market × (1 − trailingStopBps/10000)`, where `market` is the pair ratio for a `pair` order and the input token's USD price for a `usd` order. Then pass `trailingMode: \"pure\"`, which lets your UI distinguish the two intentions on later reads."
      },
      {
        "t": "p",
        "text": "Allowed `trailingMode` values are `\"pure\"` (you derived `triggerPrice` from the market as the trail's seed) and `\"stop_and_trail\"` (the user picked a hard stop and you put a trail on top). The field requires `trailingStopBps`, applies only to `stop_loss`, and is stored and echoed back on reads. Execution **never depends on it**; its sole purpose is helping your UI reconstruct the user's intent."
      },
      {
        "t": "h2",
        "text": "Trailing take-profit"
      },
      {
        "t": "p",
        "text": "This inverts what `triggerPrice` means, so it deserves a separate mental model. With `trailingStopBps` set on a `take_profit` order, hitting `triggerPrice` no longer sells; instead it **arms the trail**. From then on the order follows the peak and fires when price drops back by `trailingStopBps` from it. The derived trigger has `triggerPrice` as its floor, so the fill can match or beat what the static order would have got, and never do worse."
      },
      {
        "t": "p",
        "text": "With `triggerPrice` at $110 and `trailingStopBps: 500`:"
      },
      {
        "t": "table",
        "head": [
          "Market does",
          "Order does"
        ],
        "rows": [
          [
            "Rises to $110",
            "Arms the trail, **no sale**"
          ],
          [
            "Runs to $130",
            "Derived trigger becomes $123.50"
          ],
          [
            "Falls to $123.50",
            "**Fills**, about 12% above the static target"
          ]
        ]
      },
      {
        "t": "p",
        "text": "If the market instead stalls at $110 and drifts back down, the floor triggers around $110, which is about the static fill one tick later."
      },
      {
        "t": "p",
        "text": "Be upfront with users about the trade-off: selling at the first touch of `triggerPrice` is given up in exchange for unlimited upside should the move go on. If price touches and then crashes, the fill lands near `triggerPrice` on the way down, with ordinary slippage."
      },
      {
        "t": "p",
        "text": "Reads report `trailingActivated` to show whether the trail is armed, and `highestObservedPrice` for the peak being tracked (not present until armed). There is no `currentTriggerPrice` on a take-profit, so calculate the live derived trigger on your side:"
      },
      {
        "t": "code",
        "code": "const derivedTrigger = (order: {\n  highestObservedPrice?: string;\n  triggerPrice: string;\n  trailingStopBps: number;\n}): bigint => {\n  const floor = BigInt(order.triggerPrice);\n  if (!order.highestObservedPrice) return floor;\n  const trailed =\n    (BigInt(order.highestObservedPrice) * BigInt(10_000 - order.trailingStopBps)) / 10_000n;\n  return trailed > floor ? trailed : floor;\n};",
        "lang": "typescript"
      },
      {
        "t": "p",
        "text": "Without `trailingStopBps`, `triggerPrice` sells on first touch, as described in [Stop-Loss & Take-Profit](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit)."
      },
      {
        "t": "h2",
        "text": "Trailing an OCO's stop-loss leg"
      },
      {
        "t": "p",
        "text": "With `trailingStopBps` on an `oco` order, the stop-loss leg ratchets just like a standalone trailing stop, but it is anchored to `stopLossPrice` instead of `triggerPrice`. Responses carry the same `currentTriggerPrice` and `highestObservedPrice`; until the first ratchet, `currentTriggerPrice` is equal to `stopLossPrice`."
      },
      {
        "t": "p",
        "text": "The take-profit leg stays put, unaffected. It is evaluated first, so the trailing trigger can never climb above `takeProfitPrice`; as the market approaches that ceiling, the two legs just form a bracket that keeps narrowing."
      },
      {
        "t": "h2",
        "text": "Pause and resume"
      },
      {
        "t": "p",
        "text": "While paused, a trailing order is not watched for price and therefore cannot ratchet. Its state is kept, though: after resuming, a trailing stop retains the ratcheted trigger, and a trailing take-profit retains both its armed state and its peak."
      },
      {
        "t": "h2",
        "text": "Modifying a trailing order"
      },
      {
        "t": "p",
        "text": "`trailingStopBps` can be changed or removed with a `PATCH` carrying only parameters. The trailing state is recomputed from the observed peak rather than reset. A wider trail lowers the live trigger and a narrower one raises it, while lowering `triggerPrice` on its own cannot loosen a stop that has already ratcheted past it. Setting a trailing take-profit's target above the observed peak disarms it. For the complete rules see [Modify a trigger order](/titan/docs/developer-doc/special-order-types/guides/managing-orders#trailing-state)."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Stop-Loss & Take-Profit](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit): static behaviour along with the complete config table",
          "[OCO Brackets](/titan/docs/developer-doc/special-order-types/order-types/oco): the two-leg order that a trail can be attached to",
          "[Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema): all trailing fields as they appear in a read response"
        ]
      }
    ],
    "lead": "Make a trigger follow the market with trailingStopBps — on a stop-loss, a take-profit, or an OCO's stop leg."
  },
  "special-order-types/order-types/slice": {
    "blocks": [
      {
        "t": "p",
        "text": "A **Slice Order** (`orderType: \"slice\"`) takes one deposit and swaps it as `executions` smaller swaps called *slices*, executed sequentially starting when the deposit confirms. A slice is quoted only once its predecessor is confirmed on-chain, so each quote already accounts for all earlier fills. It is meant for reducing price impact on an amount that would move the pool if swapped at once."
      },
      {
        "t": "table",
        "head": [
          "Property",
          "Behavior"
        ],
        "rows": [
          [
            "Funding",
            "Deposit only: `POST /orders/intent` then `POST /orders/confirm`, with one user signature."
          ],
          [
            "Timing",
            "No schedule and no duration cap. Slices run as fast as they confirm, subject to an optional minimum gap."
          ],
          [
            "Concurrency",
            "Up to your integration's cap of `active` or `executing` Slice Orders per user: **1** by default, raised per partner on request. Going over the cap returns `409 ACTIVE_BURST_EXISTS`. Different users are independent."
          ],
          [
            "Lifecycle controls",
            "None. Once confirmed there is no pause, resume, cancel, modify or retry."
          ],
          [
            "Output",
            "Each slice's output goes to `outputRecipientAddress` at swap time (default `userPubkey`)."
          ],
          [
            "Failure",
            "A slice that can't be built or sent is retried with a fresh quote up to 4 times, with a short back-off. If every attempt fails, the order **stops at that slice** and ends `failed` as a partial fill: slices already filled keep their output, no more slices are attempted, and unspent input is auto-returned."
          ],
          [
            "Bracket",
            "`onFillOco` is supported: a bracket is armed when the whole Slice Order completes. See [Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco)."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Create"
      },
      {
        "t": "p",
        "text": "The top-level request fields and the two-step flow are shared with all other order types: `userPubkey`, `outputRecipientAddress`, `platformFee`, `onboardIfNeeded` and the optional `X-Idempotency-Key` header. See [Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders)."
      },
      {
        "t": "code",
        "code": "POST /orders/intent\nX-Titan-Key: <partner-api-key>\nX-Titan-User: <your stable user id>\nContent-Type: application/json\n\n{\n  \"orderType\": \"slice\",\n  \"userPubkey\": \"<user's external Solana wallet>\",\n  \"config\": {\n    \"inputMint\":  \"So11111111111111111111111111111111111111112\",\n    \"outputMint\": \"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\",\n    \"amount\": \"1000000000\",\n    \"executions\": 10,\n    \"minGapSeconds\": 3\n  }\n}",
        "lang": "http"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Required",
          "Notes"
        ],
        "rows": [
          [
            "`inputMint`",
            "Yes",
            "Token to sell. Must differ from `outputMint`."
          ],
          [
            "`outputMint`",
            "Yes",
            "Token to buy."
          ],
          [
            "`amount`",
            "Yes",
            "**Total** input for the whole order, in base units as a string, `> 0`. It is split into `executions` near-equal slices. The split is deterministic, and slice amounts are deliberately not identical."
          ],
          [
            "`executions`",
            "Yes",
            "Integer `2`–`15`. Number of slices."
          ],
          [
            "`minGapSeconds`",
            "No",
            "Integer `0`–`30`, default `0`. **Minimum** spacing between consecutive slice sends, measured from the previous slice's first send. It is a floor, not a schedule: if the previous slice confirms sooner the engine waits out the gap, and if it confirms later the next slice is quoted immediately."
          ],
          [
            "`onFillOco`",
            "No",
            "Bracket to arm on completion; see [Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco). Forces the order's `outputRecipientAddress` to the manager."
          ]
        ]
      },
      {
        "t": "p",
        "text": "No slippage, price or expiry fields exist. Sending an unrecognized field gives `400 VALIDATION_ERROR`; that includes `intervalSeconds`, which belonged to an earlier revision of this product."
      },
      {
        "t": "table",
        "head": [
          "Behavior",
          "Detail"
        ],
        "rows": [
          [
            "Minimum value",
            "Applies **per slice**. The check prices `amount / executions` against your tenant's per-cycle USD floor ($10 by default). `400 MIN_NOTIONAL_NOT_MET` reports the per-slice amount in `details.amount`, not the total."
          ],
          [
            "Deposit transaction",
            "Moves `amount` into the manager and creates the recipient's output token account if needed. Rent is paid by the user's external wallet."
          ],
          [
            "Status after confirm",
            "`active` immediately, then `executing` once the executor picks it up (usually within seconds), and `executing` for the whole run."
          ],
          [
            "Per-user cap",
            "`POST /orders/intent` counts the user's `active` or `executing` Slice Orders against your integration's cap (1 by default) and returns `409 ACTIVE_BURST_EXISTS` before the user signs. A concurrent create can still lose the race at `confirm` and get the same `409`. In that case the deposit has landed but **no order was created**; the funds sit in the manager as available balance in `GET /me/balance`, and the user can withdraw them or create a new Slice Order once one finishes. Contact Titan to raise the cap if users need several Slice Orders in flight at once."
          ]
        ]
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`VALIDATION_ERROR`",
            "`executions` or `minGapSeconds` out of range, or an unknown field."
          ],
          [
            "400",
            "`MIN_NOTIONAL_NOT_MET`",
            "Per-slice value is below the floor."
          ],
          [
            "409",
            "`ACTIVE_BURST_EXISTS`",
            "The user already has the maximum number of `active` or `executing` Slice Orders for your integration. `details: { active, cap }`."
          ]
        ]
      },
      {
        "t": "p",
        "text": "All other rows in the [intent error table](/titan/docs/developer-doc/special-order-types/guides/creating-orders#errors), including those for `onboardIfNeeded`, apply as they are."
      },
      {
        "t": "h2",
        "text": "Read"
      },
      {
        "t": "p",
        "text": "Track progress with `GET /slice/{orderId}`, polling every **2–3 seconds** as long as `status` is `active` or `executing`."
      },
      {
        "t": "code",
        "code": "{\n  \"success\": true,\n  \"data\": {\n    \"order\": {\n      \"id\": \"0f2c…\",\n      \"orderType\": \"slice\",\n      \"status\": \"executing\",\n      \"userId\": \"<opaque Titan user id>\",\n      \"walletAddress\": \"<manager>\",\n      \"outputRecipientAddress\": \"<userPubkey>\",\n      \"inputMint\": \"So111…\",\n      \"outputMint\": \"EPjFW…\",\n      \"totalAmount\": \"1000000000\",\n      \"amountSpent\": \"400000000\",\n      \"amountReceived\": \"60120000\",\n      \"executionsTotal\": 10,\n      \"minGapSeconds\": 3,\n      \"withdrawalStatus\": \"none\",\n      \"failureReason\": null,\n      \"createdAt\": \"2026-09-03T03:12:00.000Z\",\n      \"updatedAt\": \"2026-09-03T03:12:08.000Z\"\n    },\n    \"chunks\": [\n      { \"index\": 1, \"inputAmount\": \"99999995\", \"outputAmount\": \"15030000\", \"txSignature\": \"5x…\", \"executedAt\": \"2026-09-03T03:12:05.000Z\" },\n      { \"index\": 2, \"inputAmount\": \"100000001\", \"outputAmount\": \"15030000\", \"txSignature\": \"5y…\", \"executedAt\": \"2026-09-03T03:12:08.000Z\" }\n    ]\n  }\n}",
        "lang": "json"
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "In the response, the order sits under `data.order` and the slices under `data.chunks`, whereas the other per-type detail endpoints give you the order directly as `data`."
      },
      {
        "t": "p",
        "text": "`order` holds the base [Order](/titan/docs/developer-doc/special-order-types/reference/schema#order) fields plus:"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Meaning"
        ],
        "rows": [
          [
            "`totalAmount`",
            "Total input deposited."
          ],
          [
            "`amountSpent`",
            "Input used by confirmed slices. Grows as each slice confirms."
          ],
          [
            "`amountReceived`",
            "Output from confirmed slices. A quoted estimate while running; on a `completed` order carrying `onFillOco`, rewritten to the exact on-chain sum."
          ],
          [
            "`executionsTotal`",
            "`executions` from creation."
          ],
          [
            "`minGapSeconds`",
            "`minGapSeconds` from creation (`0` when not set)."
          ],
          [
            "`onFillOco` / `childOrderId` / `onFillError`",
            "Bracket fields, present only when a bracket was requested; see [Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco#reads)."
          ],
          [
            "`failedChunk`",
            "On a `failed` order: the slice the run stopped at, as `{ index, txSignature, reason }`; see [Lifecycle](#lifecycle). Absent otherwise."
          ]
        ]
      },
      {
        "t": "p",
        "text": "`chunks` contains **confirmed** slices only, ordered by `index` (starting at 1). Compute progress as `chunks.length / order.executionsTotal` and `amountSpent / totalAmount`, and never from elapsed time. When `chunkSignatures` and `executionInFlight` show up, skip them: they hold internal recovery metadata and can change without warning."
      },
      {
        "t": "p",
        "text": "It returns `404 NOT_FOUND` if the order doesn't exist, isn't a Slice Order, or doesn't belong to the authenticated user."
      },
      {
        "t": "p",
        "text": "Slice Orders also show up in `GET /me/orders?type=slice`, `GET /me/orders/active`, `GET /me/orders/history`, `GET /partners/me/orders?orderType=slice` and `GET /partners/me/orders/{id}`, with the same `order` shape and no `chunks`."
      },
      {
        "t": "h2",
        "text": "Executions"
      },
      {
        "t": "p",
        "text": "Each confirmed slice adds one row to `GET /orders/{orderId}/executions` and `GET /partners/me/executions`, with `executionType: \"slice_fill\"` and `executionIndex` holding the 1-based slice number. The row includes that slice's platform-fee snapshot, for reconciliation."
      },
      {
        "t": "h2",
        "text": "Lifecycle"
      },
      {
        "t": "code",
        "code": "intent ──confirm──▶ active ──picked up──▶ executing ──all slices confirmed──▶ completed\n                                              │\n                                              └─ failed  ── partial or zero fill ── unspent input auto-returned",
        "lang": "text"
      },
      {
        "t": "table",
        "head": [
          "State",
          "Meaning"
        ],
        "rows": [
          [
            "`completed`",
            "Every slice filled. Output is at `outputRecipientAddress`. With `onFillOco`, `childOrderId` points to the bracket, or `onFillError` explains why none was created."
          ],
          [
            "`failed`",
            "Fewer slices landed than `executionsTotal`. Unspent input is auto-returned within about a minute and `withdrawalStatus` becomes `completed` without any call from you. Slices that landed keep their output where it was delivered."
          ],
          [
            "`executing` after all slices landed",
            "Normal for a few seconds while the last slice is verified. If a slice's outcome can't be proven for about 90 seconds, the run stops and the order stays `executing` until the recovery sweep settles it as `completed` or `failed`, typically within 10 minutes. Keep polling."
          ]
        ]
      },
      {
        "t": "p",
        "text": "`failureReason` on a `failed` order is a coarse label:"
      },
      {
        "t": "table",
        "head": [
          "`failureReason`",
          "Meaning"
        ],
        "rows": [
          [
            "`execution_failed`",
            "One or more slices could not fill. Includes partial fills."
          ],
          [
            "`simulation_failed`",
            "A slice failed simulation."
          ],
          [
            "`reverted_on_chain`",
            "A slice reverted on-chain."
          ],
          [
            "`output_account_closed`",
            "The recipient's output token account was closed before the first slice. Nothing was sent; the full deposit is returned."
          ]
        ]
      },
      {
        "t": "p",
        "text": "Derive \"filled X of N\" from `chunks.length`, and not from the label."
      },
      {
        "t": "p",
        "text": "`failedChunk` shows where the run stopped and the cause. `index` is the 1-based slice that could not fill; all slices before it landed and appear in `chunks`, and none after it was attempted. `reason` is one of:"
      },
      {
        "t": "table",
        "head": [
          "`failedChunk.reason`",
          "Meaning"
        ],
        "rows": [
          [
            "`simulation_failed`",
            "Every attempt was rejected in preflight. Nothing was broadcast."
          ],
          [
            "`reverted_on_chain`",
            "An attempt landed and reverted. `txSignature` is set."
          ],
          [
            "`expired`",
            "Broadcast, but no attempt landed before its blockhash expired."
          ],
          [
            "`execution_failed`",
            "The quote or transaction could not be built."
          ],
          [
            "`quote_below_fair_value`",
            "Every quote for the slice was worth too little against independent market prices, so no fair route was found. Nothing was broadcast."
          ],
          [
            "`interrupted`",
            "The run was cut off before this slice was broadcast."
          ]
        ]
      },
      {
        "t": "p",
        "text": "`txSignature` is `null` for every `reason` apart from `reverted_on_chain`, so only link to an explorer in that case. Here is an example for a 4-of-5 fill:"
      },
      {
        "t": "code",
        "code": "\"failedChunk\": { \"index\": 5, \"txSignature\": null, \"reason\": \"simulation_failed\" }",
        "lang": "json"
      },
      {
        "t": "h3",
        "text": "Unsupported operations"
      },
      {
        "t": "table",
        "head": [
          "Call",
          "Response"
        ],
        "rows": [
          [
            "`POST /orders/{id}/cancel`",
            "`400 CANCEL_NOT_SUPPORTED`"
          ],
          [
            "`POST /orders/{id}/pause`",
            "`400 PAUSE_NOT_SUPPORTED`"
          ],
          [
            "`POST /orders/{id}/retry`",
            "`400 RETRY_NOT_SUPPORTED`, usually preceded by `400 ALREADY_WITHDRAWN` since auto-return is fast"
          ],
          [
            "Modify",
            "No `PATCH` endpoint exists"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Hide these controls for Slice Orders."
      },
      {
        "t": "h3",
        "text": "Withdrawals"
      },
      {
        "t": "p",
        "text": "A `completed` Slice Order has nothing to withdraw: its output went out at swap time or belongs to the bracket, so `POST /orders/{id}/withdraw` returns `400 NOTHING_TO_WITHDRAW`. A `failed` one is auto-returned; order-level withdraw is only relevant in the brief window before that return runs, and afterwards yields `400 ALREADY_WITHDRAWN`."
      },
      {
        "t": "callout",
        "tone": "danger",
        "text": "Keep users from closing the recipient's output token account while a Slice Order is `active` or `executing`. Closing before the first slice makes the order fail with `output_account_closed`, and nothing gets sent. Closing partway through makes the remaining slices fail, leaving the order as a partial fill."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco): attach a take-profit and stop-loss bracket that arms on completion",
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): the two-step flow common to all types",
          "[Lifecycle & Polling](/titan/docs/developer-doc/special-order-types/guides/lifecycle): how often to poll Slice Orders"
        ]
      }
    ],
    "lead": "One deposit swapped as a sequence of smaller back-to-back swaps, each quoted after the previous one confirms, to reduce price impact."
  },
  "special-order-types/guides/onboarding": {
    "blocks": [
      {
        "t": "p",
        "text": "A user signs exactly once before placing their first order, no matter the type. You send that Sign-In-with-Solana signature to `POST /partner/onboard`, which sets up the user's Titan-managed manager and saves their external wallet as the funding and withdrawal address. From then on the `X-Titan-User` header is all you need to act for the user; per-request signatures are no longer required."
      },
      {
        "t": "p",
        "text": "The call is **idempotent and resumable**: repeating it with the same `sub` replays the same `userId` and `walletAddress`. That makes it safe to run on every login if you prefer not to track who has been onboarded."
      },
      {
        "t": "h2",
        "text": "What it provisions"
      },
      {
        "t": "p",
        "text": "One call looks up or creates the user's Titan identity (within your tenant), builds their **manager** with the signing policy included, and attaches the external wallet to that identity. Under the policy the manager may only perform order-execution swaps (DCA cycles and trigger fills) and withdraw **solely** to the user's own external wallet, so funds can't be sent elsewhere by you or by Titan."
      },
      {
        "t": "h2",
        "text": "Build the canonical message"
      },
      {
        "t": "p",
        "text": "The user signs exactly these bytes using their external wallet. `Address:` has to equal `userPubkey`, and `User:` has to equal the `sub` in your request body."
      },
      {
        "t": "code",
        "code": "Titan DCA wants you to link this Solana wallet.\n\nAddress: <userPubkey — base58>\nUser: <your stable user id>\nIssued At: <ISO-8601, within ±10 min of now>\nNonce: <opaque random string>",
        "lang": "text"
      },
      {
        "t": "code",
        "code": "function buildSiwsMessage(address: string, sub: string): string {\n  return (\n    `Titan DCA wants you to link this Solana wallet.\\n\\n` +\n    `Address: ${address}\\n` +\n    `User: ${sub}\\n` +\n    `Issued At: ${new Date().toISOString()}\\n` +\n    `Nonce: ${crypto.randomUUID()}\\n` // trailing newline is required\n  );\n}",
        "lang": "typescript"
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "The signed bytes must follow the canonical form exactly: LF line endings, a final `\\n` after `Nonce:`, and no more than 1024 bytes. `Issued At` must fall within ±10 minutes of server time. Any deviation produces `400 SIWS_INVALID`."
      },
      {
        "t": "p",
        "text": "In your frontend, the user's wallet signs the message bytes; your backend then receives the base58 signature:"
      },
      {
        "t": "code",
        "code": "const message = buildSiwsMessage(userPubkey, sub);\n// const { signature } = await wallet.signMessage(new TextEncoder().encode(message));\n// const signatureBase58 = bs58.encode(signature);",
        "lang": "typescript"
      },
      {
        "t": "h2",
        "text": "Submit it"
      },
      {
        "t": "code",
        "code": "const res = await fetch(`${process.env.TITAN_DCA_BASE_URL}/partner/onboard`, {\n  method: 'POST',\n  headers: {\n    'X-Titan-Key': process.env.TITAN_DCA_API_KEY!,\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify({\n    sub,\n    userPubkey,\n    siws: { message, signature: signatureBase58 },\n  }),\n});\n\nconst { data } = await res.json();\n// { userId: \"<opaque Titan user id>\", walletAddress: \"<manager pubkey>\" }",
        "lang": "typescript"
      },
      {
        "t": "p",
        "text": "Only `X-Titan-Key` is used for this call. `X-Titan-User` doesn't exist yet, because this is the call that establishes the mapping."
      },
      {
        "t": "p",
        "text": "Store `userId`: it is Titan's opaque id, used in the [partner reporting](/titan/docs/developer-doc/special-order-types/reference/endpoints#partner-reporting) filters (`?userId=…`), and it is **not** your `sub`. After this point, identify the user on each call with `X-Titan-User: <sub>`."
      },
      {
        "t": "h2",
        "text": "Replay and freshness"
      },
      {
        "t": "p",
        "text": "Along with the signature and ownership checks, Titan enforces the ±10-minute `Issued At` window. `Nonce` is opaque and isn't stored, so single use is not checked and a message can be resubmitted while it is still fresh. This is harmless since onboarding is idempotent; a replay only returns the same `userId` and `walletAddress`. Even so, create a new `Issued At` and nonce for each attempt."
      },
      {
        "t": "h2",
        "text": "Single-transaction onboarding"
      },
      {
        "t": "p",
        "text": "The flow shown so far makes the user sign twice before the first order: the SIWS message, then the deposit transaction. A brand-new wallet can get by with one. Pass `onboardIfNeeded: true` to [`POST /orders/intent`](/titan/docs/developer-doc/special-order-types/guides/creating-orders#get-an-unsigned-deposit-transaction). If the `X-Titan-User` id hasn't been onboarded yet, Titan sets up the manager inline and returns the deposit transaction as normal. The deposit is signed by `userPubkey`, so that signature serves as ownership proof too: a wrong or unowned address is unable to fund the order, and before it's signed the manager is an empty wallet whose policy allows outflows solely to `userPubkey`."
      },
      {
        "t": "p",
        "text": "You must opt in explicitly: the flag has to be exactly `true`, and it only provisions **new** users. Already-onboarded users have it ignored (the intent proceeds as usual, including `403 VALIDATION_ERROR` when `userPubkey` differs from the attested wallet). It cannot attach an *extra* wallet to an existing user; that still requires the SIWS flow."
      },
      {
        "t": "callout",
        "tone": "danger",
        "text": "**Implement the two-step fallback before shipping the one-shot path.** A wallet new to *you* might already be known to *Titan*, since the user may have used it in the Titan app or via another partner, and wallets are recognized platform-wide rather than per tenant. For such a wallet, `onboardIfNeeded: true` answers `409 USER_PUBKEY_CONFLICT` instead of quietly linking you to that account. Catch the `409` and fall back to the two-step SIWS flow; otherwise those users cannot place a first order. This can occur the first time you ever see a user."
      },
      {
        "t": "p",
        "text": "Handling the `409`:"
      },
      {
        "t": "steps",
        "items": [
          {
            "title": "The one-shot intent came back `409`",
            "body": "`POST /orders/intent` with `onboardIfNeeded: true` came back with `409 USER_PUBKEY_CONFLICT`. That means the wallet is already attached to a Titan account, whether yours, the Titan app's or another partner's."
          },
          {
            "title": "Onboard with SIWS",
            "body": "Obtain one SIWS signature and call `POST /partner/onboard` as shown earlier. That confirms the user owns the wallet and ties your `X-Titan-User` id to the existing account. The call is idempotent, so retrying is safe."
          },
          {
            "title": "Re-issue the intent",
            "body": "Call `POST /orders/intent` again **without** `onboardIfNeeded` (the user is onboarded now), then `POST /orders/confirm` as usual."
          }
        ]
      },
      {
        "t": "p",
        "text": "A brand-new wallet takes one signature; a wallet Titan already knows takes the usual two. New users, the common case, never see the `409`. Use `POST /partner/onboard` directly when you want to bind the wallet before any deposit, or need the `userId` for reporting before the first order."
      },
      {
        "t": "h2",
        "text": "Errors"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`BAD_REQUEST`",
            "Missing `sub`, `userPubkey`, `siws.message` or `siws.signature`, or invalid JSON."
          ],
          [
            "400",
            "`SIWS_INVALID`",
            "The signature, canonical-form, freshness or ownership check failed: bad signature, `Address` ≠ `userPubkey`, `User` ≠ `sub`, or `Issued At` outside ±10 min."
          ],
          [
            "400",
            "`PARTNER_NOT_CONFIGURED`",
            "Your tenant isn't enabled for partner onboarding."
          ],
          [
            "401",
            "`INVALID_API_KEY` / `KEY_REVOKED` / `ENV_MISMATCH`",
            "Standard `X-Titan-Key` failures."
          ],
          [
            "409",
            "`USER_PUBKEY_CONFLICT`",
            "Your `sub` and the attested wallet resolve to two different existing Titan identities."
          ],
          [
            "409",
            "`WALLET_NEEDS_USER_CONSENT`",
            "The wallet exists with no manager set up and Titan can't attach one server-side (a rare edge case)."
          ],
          [
            "500 / 502",
            "`PROVISIONING_FAILED`",
            "Provisioning error (`502` upstream, `500` unexpected). Safe to retry because the call is idempotent."
          ]
        ]
      },
      {
        "t": "p",
        "text": "A user-scoped call against a manager that isn't fully provisioned returns `409 ONBOARDING_INCOMPLETE`. Call `POST /partner/onboard` again (idempotent), then retry the original request."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Quickstart](/titan/docs/developer-doc/special-order-types/quickstart): onboarding in the context of the full flow",
          "[Authentication](/titan/docs/developer-doc/special-order-types/reference/authentication): how `X-Titan-User` resolves a user after onboarding",
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): the first thing to do once a user is onboarded"
        ]
      }
    ],
    "lead": "Bind a user's external wallet to a Titan-managed manager with one SIWS signature."
  },
  "special-order-types/guides/creating-orders": {
    "blocks": [
      {
        "t": "p",
        "text": "**All order types are created with the same pair of calls.** `POST /orders/intent` gives back an unsigned deposit transaction, the user signs it, and `POST /orders/confirm` submits it and activates the order. Until the signature comes in, nothing moves."
      },
      {
        "t": "p",
        "text": "The flow has two steps since the order's input comes out of the user's external wallet and only that user can sign the deposit. Between a DCA order and a stop-loss, just `orderType` and `config` change; see [Order Types](/titan/docs/developer-doc/special-order-types/order-types) for each `config` shape."
      },
      {
        "t": "h2",
        "text": "Get an unsigned deposit transaction"
      },
      {
        "t": "code",
        "code": "const intent = await callTitanDca('/orders/intent', {\n  method: 'POST',\n  sub,\n  body: {\n    orderType: 'dca',                    // or 'stop_loss' | 'take_profit' | 'oco' | 'slice'\n    userPubkey,\n    onboardIfNeeded: true,               // optional; must be exactly true\n    outputRecipientAddress: userPubkey,  // optional; defaults to userPubkey\n    platformFee: { bps: 50 },            // optional per-order override\n    config: { /* per order type — see Order Types */ },\n  },\n});\n\nconst { pendingOrderId, transaction, expiresAt } = intent.data;",
        "lang": "typescript"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Required",
          "Notes"
        ],
        "rows": [
          [
            "`orderType`",
            "Yes",
            "`dca`, `stop_loss`, `take_profit`, `oco` or `slice`. Anything else returns `400 INVALID_ORDER_TYPE`."
          ],
          [
            "`userPubkey`",
            "Yes",
            "The user's **external** wallet. It pays Solana network fees on the deposit and, by default, receives swap output. Must be the wallet attested at onboarding."
          ],
          [
            "`config`",
            "Yes",
            "Depends on the order type. See [Order Types](/titan/docs/developer-doc/special-order-types/order-types)."
          ],
          [
            "`onboardIfNeeded`",
            "No",
            "Exactly `true` to provision a brand-new user inline instead of returning `401`. See [Single-transaction onboarding](/titan/docs/developer-doc/special-order-types/guides/onboarding#single-transaction-onboarding)."
          ],
          [
            "`outputRecipientAddress`",
            "No",
            "Where swap output is delivered: either `userPubkey` (default) or the user's manager address. Immutable once confirmed. With [`onFillOco`](/titan/docs/developer-doc/special-order-types/order-types/otoco) it defaults to the manager, and must be the manager."
          ],
          [
            "`platformFee.bps`",
            "No",
            "Per-order override of your tenant default. Must satisfy `0 ≤ bps ≤ maxFeeBps`. See [Platform Fees](/titan/docs/developer-doc/special-order-types/guides/platform-fees)."
          ]
        ]
      },
      {
        "t": "p",
        "text": "Using a `userPubkey` that differs from the wallet the user attested during onboarding returns `403 VALIDATION_ERROR`."
      },
      {
        "t": "p",
        "text": "The response holds the transaction the user has to sign, along with details you should display before they sign:"
      },
      {
        "t": "code",
        "code": "{\n  \"success\": true,\n  \"data\": {\n    \"pendingOrderId\": \"9b3f1ad0-7c34-4e1f-bcfb-1c9a5a3a7b21\",\n    \"memoId\": \"9b3f1ad0-7c34-4e1f-bcfb-1c9a5a3a7b21\",\n    \"transaction\": \"<base64 unsigned deposit tx>\",\n    \"encoding\": \"base64\",\n    \"expiresAt\": \"2025-01-01T00:05:00.000Z\",\n    \"orderType\": \"dca\",\n    \"outputRecipientAddress\": \"<userPubkey or manager — echoes the resolved destination>\",\n    \"inputMint\": \"So111…\",\n    \"inputAmount\": \"1000000000\",\n    \"feeLamports\": \"0\"\n  }\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "`feeLamports` is `\"0\"` where execution fees are sponsored in your environment, as is the default for partners. In any other case it is `\"5000000\"` (0.005 SOL), and that amount is built into the deposit transaction the user signs, so check the field rather than presuming zero."
      },
      {
        "t": "p",
        "text": "The user must sign before `expiresAt`, **5 minutes** from now. Once that passes, the pending order is dead and you need to request a fresh intent."
      },
      {
        "t": "h2",
        "text": "Confirm with the signed transaction"
      },
      {
        "t": "code",
        "code": "const confirmed = await callTitanDca('/orders/confirm', {\n  method: 'POST',\n  sub,\n  body: { pendingOrderId, signedTransaction },\n});\n\nconst { order, txSignature, deposit } = confirmed.data;",
        "lang": "typescript"
      },
      {
        "t": "p",
        "text": "Titan adds its co-signature, sends the transaction to Solana and activates the order. From that moment it is `active`. A DCA order starts running cycles at its cadence, a trigger order starts watching the price, and a Slice Order begins with its first slice. A DCA order with a future `config.startAt` is the sole exception: it sits in `pending` and turns `active` when that time arrives."
      },
      {
        "t": "h3",
        "text": "Token-2022 transfer fees"
      },
      {
        "t": "p",
        "text": "Confirm responses carry `deposit: { sent, received }`. `sent` echoes the intent's input amount, whereas `received` is the on-chain measurement of what reached the manager. The two differ solely for a Token-2022 mint with a **transfer fee**, in which the mint keeps a share of each transfer."
      },
      {
        "t": "p",
        "text": "The order's size is derived from `received`:"
      },
      {
        "t": "list",
        "items": [
          "On the returned order, `totalAmount` / `amount` holds the received amount.",
          "For a DCA order, the final cycle spends whatever remains.",
          "An absolute `minOutputAmount` gets scaled by the same ratio, so the price floor it expresses is kept."
        ]
      },
      {
        "t": "p",
        "text": "Present both numbers to the user, such as \"sent 100, received 97 (token transfer fee)\". The fee hits three times: on the deposit, inside every swap, and on any refund back to the user."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "If you intend to retry `intent` or `confirm`, include an `X-Idempotency-Key`. Choose a deterministic key for each logical action, e.g. `dca:create:<your-order-id>:v1`, so a retry after a network failure hashes to the same key and doesn't create a second order. Only `2xx` responses are cached, and for 24 hours. Details: [Limits & Idempotency](/titan/docs/developer-doc/special-order-types/reference/limits#idempotency)."
      },
      {
        "t": "h2",
        "text": "Where swap output lands"
      },
      {
        "t": "p",
        "text": "Output is delivered directly to the user's external wallet (`userPubkey`) by default: each cycle for a DCA order, the one fill for a trigger order, or every slice for a Slice Order. If you'd rather keep it in the manager, which suits a user accumulating up to a single withdrawal, set `outputRecipientAddress` to the manager address (the `walletAddress` from onboarding). Only those two addresses are accepted, and the choice is locked once the order is confirmed."
      },
      {
        "t": "h2",
        "text": "Verify the deposit"
      },
      {
        "t": "p",
        "text": "`GET /orders/{orderId}/deposit` gives back the funding transfer (external wallet to manager) that produced the order, for every order type:"
      },
      {
        "t": "code",
        "code": "{\n  \"success\": true,\n  \"data\": {\n    \"txSignature\": \"<solana tx signature of the deposit>\",\n    \"submittedAt\": \"2025-01-01T00:00:00.000Z\"\n  }\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "The response is `404 NOT_FOUND` when the order is missing, belongs to someone else, or has no recorded deposit. That happens when the order was created before deposit linkage existed, or when its deposit never received a submitted signature. For back-office use, `GET /partners/me/orders/{id}/deposit` provides the same thing scoped to the tenant."
      },
      {
        "t": "h2",
        "text": "Errors"
      },
      {
        "t": "p",
        "text": "Intent-step failures:"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`VALIDATION_ERROR`",
            "Invalid body, address or amount. `details.issues` lists each failure."
          ],
          [
            "400",
            "`INVALID_ORDER_TYPE`",
            "`orderType` isn't one of the five."
          ],
          [
            "400",
            "`INVALID_MINTS`",
            "`inputMint === outputMint`."
          ],
          [
            "400",
            "`MIN_NOTIONAL_NOT_MET`",
            "Below your tenant's minimum ($10 USD default): per cycle for DCA, on the full `amount` for trigger orders, per slice for Slice Orders. `details`: `mint`, `amount`, `usdCents`, `requiredCents`."
          ],
          [
            "400",
            "`MIN_OUTPUT_UNSATISFIABLE`",
            "Trigger orders only: a configuration that could never fill, either a stop-loss `minOutputAmount` above the output implied by `triggerPrice`, or a trigger already crossed with `minOutputAmount` above the input's market value. See [Unfillable configurations](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#unfillable-configurations)."
          ],
          [
            "401",
            "`UNAUTHORIZED`",
            "Missing `X-Titan-User`, or a `sub` that was never onboarded."
          ],
          [
            "403",
            "`VALIDATION_ERROR`",
            "`userPubkey` isn't the wallet the user attested at onboarding."
          ],
          [
            "409",
            "`ONBOARDING_INCOMPLETE`",
            "The manager isn't fully provisioned. Call `POST /partner/onboard` again (idempotent), then retry."
          ],
          [
            "409",
            "`USER_PUBKEY_CONFLICT`",
            "With `onboardIfNeeded: true`: the wallet already belongs to a Titan account. [Fall back to SIWS](/titan/docs/developer-doc/special-order-types/guides/onboarding#single-transaction-onboarding)."
          ],
          [
            "409",
            "`ACTIVE_BURST_EXISTS`",
            "Slice Orders only: the user already has the maximum number of `active` or `executing` Slice Orders for your integration (1 by default). `details: { active, cap }`. `confirm` also returns it if a concurrent create won the race; see [Slice Orders](/titan/docs/developer-doc/special-order-types/order-types/slice#create)."
          ],
          [
            "422",
            "`IDEMPOTENCY_KEY_REUSED`",
            "The same `X-Idempotency-Key` was sent with a different body."
          ],
          [
            "503",
            "`PRICE_ORACLE_UNAVAILABLE`",
            "A non-stable `inputMint` could not be priced to enforce the minimum. Transient; retry shortly."
          ]
        ]
      },
      {
        "t": "p",
        "text": "Confirm-step failures:"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`MISSING_PARAMS`",
            "Body is missing `pendingOrderId` or `signedTransaction`."
          ],
          [
            "400",
            "`INVALID_STATUS`",
            "The pending order was already used, for example confirmed before."
          ],
          [
            "400",
            "`EXPIRED`",
            "The 5-minute window passed. Request a new intent."
          ],
          [
            "400",
            "`INVALID_STATE`",
            "The transaction Titan stored server-side is missing or expired. Request a new intent."
          ],
          [
            "400",
            "`TRANSACTION_TAMPERED`",
            "The signed transaction doesn't match the one Titan stored."
          ],
          [
            "403",
            "`FORBIDDEN`",
            "The pending order belongs to another user or tenant."
          ],
          [
            "404",
            "`NOT_FOUND`",
            "The pending order doesn't exist."
          ],
          [
            "500",
            "`SUBMIT_FAILED` / `CONFIRMATION_FAILED` / `ORDER_FINALIZE_FAILED`",
            "A server-side failure while submitting, confirming on-chain, or finalizing. Safe to retry with an idempotency key. Structural problems with the submitted transaction (bad base64, wrong shape, missing signatures) also appear as `SUBMIT_FAILED`."
          ]
        ]
      },
      {
        "t": "p",
        "text": "The full catalog is in [Error Codes](/titan/docs/developer-doc/special-order-types/reference/error-codes)."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Order Types](/titan/docs/developer-doc/special-order-types/order-types): the `config` shape of every type",
          "[Managing Orders](/titan/docs/developer-doc/special-order-types/guides/managing-orders): pausing, resuming, cancelling and retrying",
          "[Onboarding (SIWS)](/titan/docs/developer-doc/special-order-types/guides/onboarding): what has to happen before the first intent"
        ]
      }
    ],
    "lead": "The two-step intent/confirm flow that creates every order type, and the fields they share."
  },
  "special-order-types/guides/managing-orders": {
    "blocks": [
      {
        "t": "p",
        "text": "An active order supports five operations: modify, pause, resume, cancel and retry. Which ones apply depends on the order type."
      },
      {
        "t": "table",
        "head": [
          "Operation",
          "`dca`",
          "Trigger orders",
          "`slice`"
        ],
        "rows": [
          [
            "Modify",
            "Yes: [`PATCH /dca/{orderId}`](/titan/docs/developer-doc/special-order-types/order-types/dca#modify)",
            "Yes: [parameter-only `PATCH`](#modify-a-trigger-order)",
            "No"
          ],
          [
            "Pause / resume",
            "Yes",
            "Yes",
            "No: `400 PAUSE_NOT_SUPPORTED`"
          ],
          [
            "Cancel",
            "Yes",
            "Yes",
            "No: `400 CANCEL_NOT_SUPPORTED`"
          ],
          [
            "Retry a `failed` order",
            "Yes (brief window)",
            "No: `400 RETRY_NOT_SUPPORTED`",
            "No: `400 RETRY_NOT_SUPPORTED`"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Slice Orders are fire-and-forget once confirmed, and a failed one automatically returns its unspent input. See [Slice Orders](/titan/docs/developer-doc/special-order-types/order-types/slice#lifecycle)."
      },
      {
        "t": "h2",
        "text": "Read order state"
      },
      {
        "t": "table",
        "head": [
          "Endpoint",
          "Returns"
        ],
        "rows": [
          [
            "`GET /me/orders?status=&type=`",
            "All of the user's orders, optionally filtered."
          ],
          [
            "`GET /me/orders/active`",
            "Currently running orders."
          ],
          [
            "`GET /me/orders/history`",
            "Terminal orders (`completed`, `cancelled`, `failed`, `expired`)."
          ],
          [
            "`GET /dca/{orderId}`",
            "One DCA order with full cycle progress."
          ],
          [
            "`GET /stop-loss/{orderId}`, `/take-profit/{orderId}`, `/oco/{orderId}`",
            "One trigger order with its type-specific fields."
          ],
          [
            "`GET /slice/{orderId}`",
            "One Slice Order with its confirmed slices."
          ],
          [
            "`GET /orders/{orderId}/executions`",
            "Execution history, newest first. Capped at 500 rows."
          ]
        ]
      },
      {
        "t": "p",
        "text": "`type` accepts `dca`, `stop_loss`, `take_profit`, `oco` or `slice`; `status` accepts any value from the status enum."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Both filters match **exactly and are not validated**. Misspelled or unrecognized values give `{ \"success\": true, \"data\": [] }`, i.e. a success with an empty list instead of an error. If you get an empty response, double-check your filter string before concluding that the user has no orders."
      },
      {
        "t": "p",
        "text": "If the id exists but belongs to a different `orderType`, the per-type detail endpoints respond `404 NOT_FOUND`; so use the `orderType` field in the list response to choose the endpoint, not trial and error. [Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema) documents every field."
      },
      {
        "t": "p",
        "text": "Three additional views of pending orders handle the gap between intent and confirm: `GET /orders/pending` (waiting for confirmation), `GET /orders/pending/failed` (timed out or failed before becoming active) and `GET /orders/pending/history` (all pending rows of any status, limited to **50** instead of 500)."
      },
      {
        "t": "h2",
        "text": "Modify a trigger order"
      },
      {
        "t": "code",
        "code": "PATCH /stop-loss/{orderId}     PATCH /take-profit/{orderId}     PATCH /oco/{orderId}",
        "lang": "text"
      },
      {
        "t": "code",
        "code": "{ \"config\": { \"triggerPrice\": \"48000000\" } }",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "This changes an `active` or `paused` trigger order directly. It involves **no transaction, signing step or lock**: `amount`, mints, `priceDecimals`, `priceBasis`, `outputRecipientAddress` and `onFillOco` cannot be changed, so no funds move and the change lands atomically. A patch containing any of those immutable fields gets `400 VALIDATION_ERROR`."
      },
      {
        "t": "h3",
        "text": "Editable fields"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "`stop_loss`",
          "`take_profit`",
          "`oco`",
          "`null` clears"
        ],
        "rows": [
          [
            "`triggerPrice`",
            "Yes",
            "Yes",
            "n/a",
            "No"
          ],
          [
            "`takeProfitPrice` / `stopLossPrice`",
            "n/a",
            "n/a",
            "Yes",
            "No"
          ],
          [
            "`minOutputAmount`",
            "Yes",
            "Yes",
            "n/a",
            "Yes"
          ],
          [
            "`expiresAt`",
            "Yes",
            "Yes",
            "Yes",
            "Yes"
          ],
          [
            "`trailingStopBps`",
            "Yes",
            "Yes",
            "Yes",
            "Yes"
          ],
          [
            "`trailingMode`",
            "Yes",
            "n/a",
            "n/a",
            "Yes"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Omitted fields stay as they are. At least one field is required."
      },
      {
        "t": "h3",
        "text": "Validation"
      },
      {
        "t": "p",
        "text": "Validation is applied to the **merged** result (stored order plus patch) under the same rules as creation:"
      },
      {
        "t": "table",
        "head": [
          "Rule",
          "Detail"
        ],
        "rows": [
          [
            "OCO ordering",
            "`stopLossPrice < takeProfitPrice`. With a trailing stop leg, `takeProfitPrice` must also stay above the leg's **live** ratcheted trigger (`currentTriggerPrice`). Lowering the target below a ratcheted stop is rejected unless the trail is widened in the same patch."
          ],
          [
            "Trailing mode",
            "`trailingMode` requires a trail. Clearing `trailingStopBps` also clears `trailingMode`."
          ],
          [
            "Limit take-profit",
            "A take-profit created with `createdAs: \"limit\"` can't be given a trail."
          ],
          [
            "OTOCO entry expiry",
            "An entry's `expiresAt`, when set, must stay before its `onFillOco.expiresAt`. Clearing it is allowed, as at create."
          ],
          [
            "Expiry",
            "`expiresAt` must be in the future."
          ],
          [
            "Unfillable configurations",
            "Both [`MIN_OUTPUT_UNSATISFIABLE`](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#unfillable-configurations) checks, with the same `details` as at create. The instant-fire check uses the **current** ratcheted trigger, not the base one. They run only when the patch touches `triggerPrice`, `minOutputAmount` or `trailingStopBps`."
          ]
        ]
      },
      {
        "t": "p",
        "text": "You may move a trigger beyond the current market; as at creation, it fires at the next evaluation."
      },
      {
        "t": "h3",
        "text": "Trailing state"
      },
      {
        "t": "p",
        "text": "Trailing state is recomputed, not reset."
      },
      {
        "t": "table",
        "head": [
          "Change",
          "Effect"
        ],
        "rows": [
          [
            "Change `trailingStopBps` on a trailing stop",
            "The observed peak is kept and the live trigger is re-derived as `max(newStop, peak × (1 − newBps/10000))`. A wider trail lowers the live trigger; a narrower one raises it."
          ],
          [
            "Lower `triggerPrice` on a trailing stop",
            "Does **not** loosen a stop the trail has already ratcheted above it. Widen `trailingStopBps` instead."
          ],
          [
            "Raise the stop above the observed peak",
            "Clears the peak. If the market is already below the new stop, the order fires instead of ratcheting."
          ],
          [
            "Remove the trail",
            "Resets the live trigger to the stop price."
          ],
          [
            "Raise a trailing take-profit's `triggerPrice` above the observed peak",
            "**Disarms** the trail, since otherwise it would floor-fire below the new target on the next tick. A trailing take-profit stays armed only if the observed peak still reaches the new `triggerPrice`."
          ]
        ]
      },
      {
        "t": "h3",
        "text": "Response"
      },
      {
        "t": "code",
        "code": "{ \"success\": true, \"data\": { \"order\": { \"…\": \"…\" } } }",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "`data.order` holds the order. The per-type `GET` returns it straight as `data`, and the object has the same shape either way."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "**After a `2xx` comes back, the old parameters will not decide any fill**, since the executor reloads the order after every claim. If a fill had already been claimed when the `PATCH` arrived, you get `409 EXECUTION_IN_FLIGHT`, and should poll the detail endpoint."
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`VALIDATION_ERROR`",
            "Invalid or immutable field, no fields, a merged-invariant violation, or a retired take-profit shape (`entryPrice`, `minProfitBps`, `scaleSteps`)."
          ],
          [
            "400",
            "`MIN_OUTPUT_UNSATISFIABLE`",
            "The same two cases and `details` as at create."
          ],
          [
            "400",
            "`INVALID_STATE`",
            "The order has any status other than `active` or `paused`: terminal, or a transient lock state."
          ],
          [
            "404",
            "`NOT_FOUND`",
            "Missing, not yours, or a different order type from the path."
          ],
          [
            "409",
            "`EXECUTION_IN_FLIGHT`",
            "A fill is executing, or the order changed during the request (a claim that was then released, or a ratchet on an OCO). Retry in a few seconds."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Pause and resume"
      },
      {
        "t": "p",
        "text": "`POST /orders/{orderId}/pause` halts an `active` order and `POST /orders/{orderId}/resume` starts a `paused` one again. Both return the updated order. They respond `400 INVALID_STATE` when the order is in the wrong state or a withdrawal is in flight, and `404 NOT_FOUND` if it doesn't belong to the user."
      },
      {
        "t": "p",
        "text": "Pausing has different effects per type. A DCA order that is paused simply stops running cycles. A paused trigger order isn't monitored at all, so it can't fire and a trailing trigger can't ratchet. Resuming re-arms it at once and preserves its trailing state: the trailing stop's ratcheted trigger, or the trailing take-profit's armed state and peak."
      },
      {
        "t": "h2",
        "text": "Cancel"
      },
      {
        "t": "p",
        "text": "`POST /orders/{orderId}/cancel` takes a body discriminated by the `withdraw` flag:"
      },
      {
        "t": "code",
        "code": "// Cancel only — no transaction built.\nawait callTitanDca(`/orders/${orderId}/cancel`, {\n  method: 'POST', sub,\n  body: { withdraw: false },\n});\n\n// Cancel and get an unsigned multi-token withdrawal tx back.\nawait callTitanDca(`/orders/${orderId}/cancel`, {\n  method: 'POST', sub,\n  body: { withdraw: true, userPubkey },\n});",
        "lang": "typescript"
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Omitting the body entirely makes `withdraw` default to `true`, which still requires `userPubkey`, so an empty body fails with `400 VALIDATION_ERROR`. Always explicitly send one of the two shapes shown above."
      },
      {
        "t": "p",
        "text": "When `withdraw: true`, you get back a `transaction` and a `withdrawalAmounts` array listing the per-mint amounts the transaction would move, limited to what the manager actually holds; display these to the user before they sign. Send the signed transaction to `POST /orders/{orderId}/withdraw/confirm`. If nothing is available to withdraw, the response has a `message` in place of `transaction`. If the chain shows nothing left right now, the order is cancelled anyway, with `withdrawalAmounts: []` and no `transaction`, and the order-level withdrawal remains open so `POST /orders/{orderId}/withdraw` can be retried later."
      },
      {
        "t": "p",
        "text": "For a different trigger price, use [modify](#modify-a-trigger-order); for a different size, cancel and create a new order."
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`VALIDATION_ERROR`",
            "Invalid body, including `withdraw: true` without `userPubkey`, or an empty body."
          ],
          [
            "400",
            "`NOT_CANCELLABLE`",
            "The order can't be cancelled in its current state (already terminal, or a lost race)."
          ],
          [
            "400",
            "`CANCEL_NOT_SUPPORTED`",
            "The order is a Slice Order."
          ],
          [
            "404",
            "`NOT_FOUND`",
            "Order missing or not yours."
          ],
          [
            "409",
            "`EXECUTION_IN_FLIGHT`",
            "A swap attempt is still being reconciled. Resolves itself; retry shortly."
          ],
          [
            "500",
            "`WITHDRAWAL_BUILD_FAILED`",
            "The cancel succeeded but the withdrawal transaction failed to build. The order is `cancelled`; call `POST /orders/{orderId}/withdraw` to retry only the withdrawal leg."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Retry a failed order"
      },
      {
        "t": "p",
        "text": "Use `POST /orders/{orderId}/retry` to flip a `failed` **DCA** order to `active` and have Titan resume trying. It fits when execution burned through its retries within a cycle yet the user wants the schedule to carry on."
      },
      {
        "t": "callout",
        "tone": "danger",
        "text": "Soon after an order fails, its unspent input is **auto-returned** to the user's external wallet. Retry works only during the brief window before that return begins; once it's under way or done, you get `409 WITHDRAWAL_IN_PROGRESS` or `400 ALREADY_WITHDRAWN`, and a new order is needed."
      },
      {
        "t": "p",
        "text": "Trigger orders and Slice Orders cannot be retried. Calling `POST /orders/{orderId}/retry` for either returns `400 RETRY_NOT_SUPPORTED`, but in practice `400 ALREADY_WITHDRAWN` appears first, because that check runs earlier and auto-return generally completes within a minute. Hide the retry button for both. The supported path is failure, auto-return, then a new order."
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`ALREADY_WITHDRAWN`",
            "`withdrawalStatus = completed`: funds were already returned. Checked before `RETRY_NOT_SUPPORTED`."
          ],
          [
            "400",
            "`RETRY_NOT_SUPPORTED`",
            "The order is a trigger order or a Slice Order."
          ],
          [
            "400",
            "`ORDER_NOT_FAILED`",
            "The order isn't `failed`. `details.status` echoes the current status."
          ],
          [
            "400",
            "`INSUFFICIENT_FUNDS`",
            "The manager no longer holds enough of the input mint. `details`: `mint`, `required`, `currentBalance`, `gap`."
          ],
          [
            "400",
            "`INVALID_STATE`",
            "The atomic transition lost a race. Re-fetch and decide."
          ],
          [
            "409",
            "`WITHDRAWAL_IN_PROGRESS`",
            "`withdrawalStatus = pending`: finish or abandon it before retrying."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): the two-step flow that preceded this",
          "[DCA](/titan/docs/developer-doc/special-order-types/order-types/dca#modify): how DCA modification works, which may involve a transaction",
          "[Lifecycle & Polling](/titan/docs/developer-doc/special-order-types/guides/lifecycle): each status and ways to keep the UI current"
        ]
      }
    ],
    "lead": "Read order state, then modify, pause, resume, cancel, or retry — and what each order type supports."
  },
  "special-order-types/guides/lifecycle": {
    "blocks": [
      {
        "t": "p",
        "text": "From creation until it reaches a terminal state, an order passes through a fixed set of statuses. Titan doesn't push these changes (webhooks aren't available today), so poll the read endpoints whenever a user is viewing their orders."
      },
      {
        "t": "h2",
        "text": "The status enum"
      },
      {
        "t": "p",
        "text": "Every order has a `status` from the same enum, whatever its type:"
      },
      {
        "t": "p",
        "text": "`pending | active | executing | pending_modification | paused | completed | cancelled | failed | expired`"
      },
      {
        "t": "p",
        "text": "DCA orders can use every status. `pending` is more limited than it looks: an order is only parked there if you set a future `config.startAt`, so most DCA orders move directly to `active` on confirm. Trigger orders use fewer: they're always `active` after confirm, never `pending` or `pending_modification`, and can't be retried out of `failed`. Slice Orders use fewer still: `active` after confirm, `executing` throughout the run, and finally `completed` or `failed`."
      },
      {
        "t": "h3",
        "text": "DCA"
      },
      {
        "t": "code",
        "code": "intent ──confirm──▶ active ──cycle..N──▶ completed\n                      │\n                      ├─ pending  ── (only with a future config.startAt;\n                      │               becomes active at that time)\n                      │\n                      ├─ pause/resume ↔  paused\n                      │\n                      ├─ executing  ── (during a cycle)\n                      │\n                      ├─ pending_modification  ── (during modify signing)\n                      │\n                      ├─ failed  ── (retry budget exhausted) ── unspent input auto-returned\n                      │              (retry ──▶ active only in the brief pre-return window)\n                      │\n                      ├─ cancelled  ── (user cancel)\n                      │\n                      └─ expired   ── (config.expiresAt reached)",
        "lang": "text"
      },
      {
        "t": "h3",
        "text": "Trigger orders"
      },
      {
        "t": "code",
        "code": "intent ──confirm──▶ active ──trigger crossed──▶ executing ──▶ completed\n                      │\n                      ├─ pause/resume ↔ paused          (price not watched while paused)\n                      │\n                      ├─ cancelled  ── (user cancel)\n                      │\n                      ├─ failed   ── deposit auto-returned within ~1 minute\n                      │\n                      └─ expired  ── (config.expiresAt reached) ── deposit auto-returned",
        "lang": "text"
      },
      {
        "t": "p",
        "text": "A trigger order created with [`onFillOco`](/titan/docs/developer-doc/special-order-types/order-types/otoco) that completes has a `childOrderId` pointing to the bracket order it created. Poll the bracket from then on."
      },
      {
        "t": "h3",
        "text": "Slice Orders"
      },
      {
        "t": "code",
        "code": "intent ──confirm──▶ active ──picked up──▶ executing ──all slices confirmed──▶ completed\n                                              │\n                                              └─ failed  ── partial or zero fill ── unspent input auto-returned",
        "lang": "text"
      },
      {
        "t": "p",
        "text": "Slice Orders cannot be paused, cancelled, modified or retried. After the last slice, an order can remain `executing` for several minutes while the recovery sweep checks an unresolved slice; keep polling and don't treat it as an error. See [Slice Orders](/titan/docs/developer-doc/special-order-types/order-types/slice#lifecycle)."
      },
      {
        "t": "p",
        "text": "`executing` and `pending_modification` are transient: an order passes through them during a cycle or while a modification is being signed. `previousStatus` records the resting state it will go back to, so you can continue displaying \"active\" or \"paused\" and avoid flicker."
      },
      {
        "t": "h2",
        "text": "Automatic input return"
      },
      {
        "t": "p",
        "text": "Titan automatically returns the remaining unspent input to the user's external wallet when an order **fails** permanently (a partially filled Slice Order counts) or when a **trigger order expires**. Neither partner action nor a user signature is needed, and funds reserved for the user's other active orders are left alone."
      },
      {
        "t": "p",
        "text": "For this reason `withdrawalStatus` reaches `completed` on these orders with no effort on your part. Skip building a manual \"withdraw failed order\" step, and surface the return via `withdrawalStatus` and `withdrawalTxHash`."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "One gap remains: **an `expired` DCA order is not auto-returned.** Only trigger orders get the automatic return on expiry. To recover the unspent input from an expired DCA order, call [order-level withdraw](/titan/docs/developer-doc/special-order-types/guides/withdrawals#order-level-withdrawals) yourself."
      },
      {
        "t": "p",
        "text": "`withdrawalStatus` follows the return of an order's funds: `none → pending → completed` (or back to `none` through abandon). In the cases above it moves forward by itself, and when you call order-level withdraw for a `completed` or `cancelled` order, it advances on request. `withdrawalTxHash` is the on-chain signature of the return, either a real signature or `null` if no transfer was required."
      },
      {
        "t": "p",
        "text": "Nothing is returned for a `completed` trigger order or Slice Order: its fills consumed the full deposit and the output was sent to `outputRecipientAddress` at execution time."
      },
      {
        "t": "h2",
        "text": "What to poll"
      },
      {
        "t": "table",
        "head": [
          "Surface",
          "Endpoint"
        ],
        "rows": [
          [
            "Active-orders list (the user's dashboard)",
            "`GET /me/orders/active`"
          ],
          [
            "DCA order detail (user has it open)",
            "`GET /dca/{orderId}`"
          ],
          [
            "Armed trigger order (user has it open)",
            "`GET /stop-loss/{orderId}`, `/take-profit/{orderId}`, `/oco/{orderId}`"
          ],
          [
            "Slice Order in progress (user has it open)",
            "`GET /slice/{orderId}` every 2–3 seconds; progress is `chunks.length / order.executionsTotal`"
          ],
          [
            "Execution history (during/after a fill)",
            "`GET /orders/{orderId}/executions`"
          ],
          [
            "Back-office reconciliation",
            "`GET /partners/me/executions?createdAtGte=…`"
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "Cadence depends on the order type. A DCA order announces its next cycle through `nextExecutionAt`, so you can poll sparingly and schedule it. A trigger order has no schedule and may fire at **any moment**, so an armed order that is visible deserves more regular polling. A Slice Order completes in seconds to minutes; poll it every 2–3 seconds during the run."
      },
      {
        "t": "p",
        "text": "A few rules keep polling cheap and correct:"
      },
      {
        "t": "p",
        "text": "**Skip polling during the two-step flows.** Between `intent`, the user's signature and `confirm`, simply wait for the signature, then call `confirm`. Once `confirm` returns, pending-order transitions are deterministic."
      },
      {
        "t": "p",
        "text": "**Back off on `EXECUTION_IN_FLIGHT`.** If cancel or withdraw returns `409`, a swap is still being reconciled. Retry after a few seconds; Titan's recovery loop settles it within a short, bounded period."
      },
      {
        "t": "p",
        "text": "**Avoid polling the same user twice.** When a list and a detail view are open together, share the state in your frontend rather than hitting both endpoints for identical data."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Managing Orders](/titan/docs/developer-doc/special-order-types/guides/managing-orders): the transitions you cause yourself",
          "[Withdrawals](/titan/docs/developer-doc/special-order-types/guides/withdrawals): how `withdrawalStatus` progresses",
          "[Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema): every status-related field"
        ]
      }
    ],
    "lead": "Order statuses, the withdrawal lifecycle, and how to keep your UI in sync by polling."
  },
  "special-order-types/guides/withdrawals": {
    "blocks": [
      {
        "t": "p",
        "text": "Money in a user's manager can only ever return to that user's own external wallet, because the manager's policy permits nothing else. There are two ways to move it, and both follow the same intent, sign, confirm pattern as order creation."
      },
      {
        "t": "h2",
        "text": "Wallet-level withdrawals"
      },
      {
        "t": "p",
        "text": "These flows withdraw a token of your choice from the manager, independent of any order. They back a \"withdraw available balance\" action."
      },
      {
        "t": "p",
        "text": "First check what's available:"
      },
      {
        "t": "code",
        "code": "const { data } = await callTitanDca('/me/balance?hideZero=true', { sub });\n// each balance row: totalBalance, lockedForFutureTxns, withdrawalPending, availableToWithdraw",
        "lang": "typescript"
      },
      {
        "t": "p",
        "text": "`availableToWithdraw` is calculated as `max(total − locked − withdrawalPending, 0)`; treat it as the source of truth for a \"withdraw max\" button. An active order locks its unspent input until it finishes. For a DCA order or a Slice Order in progress, that is `totalAmount − amountSpent`; for an armed trigger order it is the whole unspent `amount`. Output mints stay unlocked with a single exception: tokens bought through a [conditional entry](/titan/docs/developer-doc/special-order-types/order-types/otoco) are locked from the moment its swap is sent until they become the bracket's `amount`."
      },
      {
        "t": "p",
        "text": "On each row, `lockedBreakdown` assigns the lock to specific orders, with `orderType` being `dca`, `stop_loss`, `take_profit`, `oco` or `slice`. This is sufficient to tell the user *which* order holds their balance."
      },
      {
        "t": "p",
        "text": "Build the withdrawal transaction, leaving out `amount` to withdraw the maximum:"
      },
      {
        "t": "code",
        "code": "const intent = await callTitanDca('/withdraw/transaction', {\n  method: 'POST',\n  sub,\n  body: {\n    userPubkey,                                            // fee payer & destination\n    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',\n    amount: '400000',                                      // optional; omit for max\n  },\n});\n\n// user signs intent.data.transaction, then:\nawait callTitanDca('/withdraw/confirm', {\n  method: 'POST', sub,\n  body: { signedTransaction },\n});",
        "lang": "typescript"
      },
      {
        "t": "p",
        "text": "At confirm time Titan repeats the lock-aware check using the `(mint, amount)` from the unsigned transaction it returned. If that transaction goes stale within its 5-minute window (say another withdrawal landed meanwhile), it is rejected before broadcast instead of overdrawing."
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`INSUFFICIENT_AVAILABLE`",
            "The whole balance is locked, or the wallet is empty."
          ],
          [
            "400",
            "`FUNDS_LOCKED`",
            "`requested > available`: some balance is locked by orders or a pending withdrawal. `details` has the breakdown."
          ],
          [
            "400",
            "`INSUFFICIENT_BALANCE`",
            "`requested > chainBalance`: the wallet really doesn't hold that much."
          ],
          [
            "409",
            "`ONBOARDING_INCOMPLETE`",
            "Manager not fully provisioned. Call onboard again, then retry."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Order-level withdrawals"
      },
      {
        "t": "p",
        "text": "These return the funds tied to one terminal order (`completed`, `cancelled`, `failed` or `expired`) to the external wallet."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "**`failed` orders and `expired` trigger orders are returned automatically.** Titan sends back their unspent input with no call from you (see [Lifecycle](/titan/docs/developer-doc/special-order-types/guides/lifecycle#automatic-input-return)), so withdrawing one typically reports `NOTHING_TO_WITHDRAW` or `ALREADY_WITHDRAWN`. Use order-level withdrawal for `completed` and `cancelled` orders, and for `expired` **DCA** orders, the single expiry case that isn't auto-returned."
      },
      {
        "t": "p",
        "text": "Withdrawing from a `completed` trigger order or Slice Order accomplishes nothing as well. The fills spent the entire deposit and the output was handed over at execution (or belongs to a bracket order), giving `400 NOTHING_TO_WITHDRAW`. Order-level withdrawal is meaningful for trigger orders only after a cancel. Slice Orders can't be cancelled, so it only applies in the brief period before a failed one is auto-returned."
      },
      {
        "t": "p",
        "text": "If you want out of a bracket early, cancel the bracket order using `withdraw: true`, and its withdrawal hands back the bought tokens. Details in [Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco#lifecycle)."
      },
      {
        "t": "code",
        "code": "const intent = await callTitanDca(`/orders/${orderId}/withdraw`, { method: 'POST', sub });\n// intent.data.withdrawalAmounts → [{ mint, amount }, …] — preview before the user signs\n\nawait callTitanDca(`/orders/${orderId}/withdraw/confirm`, {\n  method: 'POST', sub,\n  body: { signedTransaction },\n});",
        "lang": "typescript"
      },
      {
        "t": "p",
        "text": "You can safely retry `POST /orders/{orderId}/withdraw`. Every call produces a new transaction (so the user's wallet can prompt them again) and restarts the automatic recovery process's inactivity timer. In `withdrawalAmounts` you find the amounts per mint, one entry for each non-zero mint, to show the user before signing. Since amounts never exceed what the manager truly holds, neither a Token-2022 transfer fee nor an earlier wallet-level withdrawal can result in a transaction that can't land."
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`NOTHING_TO_WITHDRAW`",
            "No order-owned funds remain (the user probably drained them through a wallet-level withdrawal)."
          ],
          [
            "400",
            "`INVALID_STATE`",
            "The order isn't `completed`, `cancelled`, `failed` or `expired`."
          ],
          [
            "400",
            "`ALREADY_WITHDRAWN`",
            "A prior withdrawal already completed, including the automatic return on a failed order or an expired trigger order."
          ],
          [
            "409",
            "`EXECUTION_IN_FLIGHT`",
            "A swap attempt is still being reconciled. Resolves itself; retry shortly."
          ],
          [
            "503",
            "`RPC_UNAVAILABLE`",
            "The on-chain balance couldn't be fetched. Retry shortly."
          ]
        ]
      },
      {
        "t": "h3",
        "text": "Releasing a stuck withdrawal lock"
      },
      {
        "t": "p",
        "text": "When the user dismisses the wallet prompt from `POST /orders/{orderId}/withdraw`, the order remains at `withdrawalStatus: pending`. Call `POST /orders/{orderId}/withdraw/abandon` to make the \"Withdraw\" button usable again right away; it is idempotent. The lock does clear by itself without it, but slowly, taking up to **8 minutes**, long enough for users to notice, which is the reason abandon exists."
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "400",
            "`ALREADY_WITHDRAWN`",
            "The withdrawal already completed, so there is nothing to abandon."
          ],
          [
            "404",
            "`NOT_FOUND`",
            "Order missing or not yours."
          ],
          [
            "409",
            "`WITHDRAWAL_IN_FLIGHT`",
            "Lost the race to `/withdraw/confirm`. Retry briefly."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Managing Orders](/titan/docs/developer-doc/special-order-types/guides/managing-orders): cancelling with withdraw sets up an order-level withdrawal in one call",
          "[Lifecycle & Polling](/titan/docs/developer-doc/special-order-types/guides/lifecycle): how `withdrawalStatus` moves and how input is returned automatically",
          "[Error Codes](/titan/docs/developer-doc/special-order-types/reference/error-codes): every withdrawal-related error"
        ]
      }
    ],
    "lead": "Return funds from a user's manager to their external wallet — wallet-level and per-order."
  },
  "special-order-types/guides/platform-fees": {
    "blocks": [
      {
        "t": "p",
        "text": "A platform fee can be taken by Titan from each execution's swap output and paid to a wallet that you control. It covers all order types, charging a DCA cycle, a trigger fill and every Slice Order slice in the same manner. Since the fee runs through Titan's native swap fee mechanism, it is collected as the execution happens and is never invoiced separately."
      },
      {
        "t": "h2",
        "text": "How it's configured"
      },
      {
        "t": "p",
        "text": "Defaults and ceilings sit on your tenant and are set during onboarding:"
      },
      {
        "t": "table",
        "head": [
          "Setting",
          "Where it lives",
          "Notes"
        ],
        "rows": [
          [
            "Fee collection wallet",
            "Tenant config (set at onboarding)",
            "The Solana address that **receives** your fees. Provide one to collect fees; leave it out to run fee-free."
          ],
          [
            "`platformFeeBps`",
            "Tenant config",
            "Your default fee in basis points (`10` = 0.1%)."
          ],
          [
            "`maxFeeBps`",
            "Tenant config",
            "Hard ceiling for per-order overrides."
          ],
          [
            "`platformFee.bps`",
            "Per order, on `POST /orders/intent`",
            "Overrides the default for one order, whatever its type. Must satisfy `0 ≤ bps ≤ maxFeeBps`. Omit it to use the tenant default."
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "If your tenant has no fee wallet configured, fees are **turned off** and nothing is taken, whatever `bps` is. The wallet gets set once at onboarding, and the API offers no way to change it; a later change has to be requested from Titan."
      },
      {
        "t": "p",
        "text": "Because the fee mint varies per execution (explained below) and the wallet receives whatever each swap yields across many mints, the fee wallet must be capable of receiving arbitrary SPL tokens. Use a normal self-custodial Solana wallet rather than a single-token deposit address."
      },
      {
        "t": "h2",
        "text": "Which mint the fee is taken in"
      },
      {
        "t": "p",
        "text": "The choice is deterministic and made per execution, checking these in order:"
      },
      {
        "t": "list",
        "ordered": true,
        "items": [
          "First: the fee is taken in the **output** mint if that mint is liquid (USDC, USDT or WSOL).",
          "Second: failing that, the fee is taken in the **input** mint if it is liquid.",
          "Third: if neither applies, the output mint is used."
        ]
      },
      {
        "t": "p",
        "text": "So `USDC → USDT` pays its fee in USDT (output has priority), `BONK → USDC` pays in USDC (liquid output), and `BONK → WIF` drops to rule 3, paying in WIF."
      },
      {
        "t": "h2",
        "text": "Per-order override"
      },
      {
        "t": "p",
        "text": "Send `platformFee.bps` on `POST /orders/intent` to override your tenant default for one order, including `0` to waive the fee for that order, subject to your contract:"
      },
      {
        "t": "code",
        "code": "await callTitanDca('/orders/intent', {\n  method: 'POST', sub,\n  body: {\n    orderType: 'dca',        // works the same on stop_loss | take_profit | oco | slice\n    userPubkey,\n    platformFee: { bps: 25 }, // 0.25% on this order; must be ≤ maxFeeBps\n    config: { /* … */ },\n  },\n});",
        "lang": "typescript"
      },
      {
        "t": "p",
        "text": "A `bps` above your `maxFeeBps` returns `400 VALIDATION_ERROR`, with `details.maxAllowed` echoing the ceiling."
      },
      {
        "t": "h2",
        "text": "Reconciling what was charged"
      },
      {
        "t": "p",
        "text": "Each execution saves a fee snapshot: one row for each DCA cycle, trigger fill or slice. Read it per order with `GET /orders/{orderId}/executions`, or across your whole tenant for billing via `GET /partners/me/executions`:"
      },
      {
        "t": "code",
        "code": "{\n  \"platformFeeWallet\": \"FeEa…\",\n  \"platformFeeBps\": 50,\n  \"platformFeeMint\": \"EPjFW…\",\n  \"platformFeeAmount\": \"25000\"\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "All four `platformFee*` fields are filled together when a fee was charged. They are all `null` when no fee was taken, either because the order's effective `bps` was `0` or because your tenant has no fee wallet configured."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): where you set `platformFee.bps`",
          "[Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema): the complete execution row, fee snapshot included",
          "[Endpoints → Partner reporting](/titan/docs/developer-doc/special-order-types/reference/endpoints#partner-reporting): tenant-wide execution rows for billing purposes"
        ]
      }
    ],
    "lead": "Collect a platform fee on every execution — DCA cycles and trigger fills alike."
  },
  "special-order-types/reference/authentication": {
    "blocks": [
      {
        "t": "p",
        "text": "Two headers make up the API's auth. It has no OAuth, no token exchange and no partner-signed JWT; your backend keeps one API key and refers to users by the same id it already uses. The sole signature in the whole flow is the user's one-time SIWS during [onboarding](/titan/docs/developer-doc/special-order-types/guides/onboarding)."
      },
      {
        "t": "table",
        "head": [
          "Header",
          "Required on",
          "Purpose"
        ],
        "rows": [
          [
            "`X-Titan-Key`",
            "**every** request",
            "Authenticates your integration (your tenant). Keep it server-side and never ship it to a browser."
          ],
          [
            "`X-Titan-User`",
            "every **user-scoped** request",
            "Your stable id for the end user, the same value you onboarded as `sub`. Titan maps it to that user's manager."
          ]
        ]
      },
      {
        "t": "p",
        "text": "All headers originate on your backend; nothing travels from the end user's browser directly to Titan."
      },
      {
        "t": "table",
        "head": [
          "Header",
          "Value"
        ],
        "rows": [
          [
            "`X-Titan-Key`",
            "Your partner API key. Never expose it to browsers."
          ],
          [
            "`X-Titan-User`",
            "Your stable id for the user the request acts on. Required on user-scoped routes."
          ],
          [
            "`Content-Type`",
            "`application/json` on POST/PATCH."
          ],
          [
            "`X-Idempotency-Key`",
            "Optional on selected POSTs. A stable string that is unique per operation. See [Idempotency](/titan/docs/developer-doc/special-order-types/reference/limits#idempotency)."
          ],
          [
            "`X-Request-Id`",
            "Optional. If set, Titan keeps it in logs and echoes it back as `x-request-id`. Otherwise one is generated."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Request tiers"
      },
      {
        "t": "table",
        "head": [
          "Tier",
          "Headers",
          "Endpoints"
        ],
        "rows": [
          [
            "**Public**",
            "none",
            "`GET /health`"
          ],
          [
            "**Partner-only**",
            "`X-Titan-Key`",
            "`POST /partner/onboard`, `GET /partners/me/*` (reporting)"
          ],
          [
            "**User-scoped**",
            "`X-Titan-Key` + `X-Titan-User`",
            "Everything that acts on a specific user: balances, orders, withdrawals, `GET /me`."
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "Reporting is **scoped to the tenant, not to the user header**. The `/partners/me/*` endpoints take `X-Titan-Key` only and return rows for your whole tenant. To filter to one user, add `?userId=<the userId returned by POST /partner/onboard>`; that `userId` is Titan's opaque id and **not** your `sub` / `X-Titan-User`. Storing the `userId` that onboarding returns is chiefly for this reason."
      },
      {
        "t": "h2",
        "text": "User consent"
      },
      {
        "t": "p",
        "text": "A SIWS signature, collected once at `POST /partner/onboard`, ties a user's external wallet to their manager. Afterwards you act for them inside the on-chain policy by sending `X-Titan-User`, and no further per-request user signature is needed. The policy limits the manager to two things: order-execution swaps (DCA cycles and trigger fills), and withdrawals exclusively to that same external wallet. Neither you nor Titan can route funds anywhere else."
      },
      {
        "t": "h2",
        "text": "Auth errors"
      },
      {
        "t": "p",
        "text": "These apply to every authenticated endpoint:"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "`error.code`",
          "When"
        ],
        "rows": [
          [
            "401",
            "`INVALID_API_KEY`",
            "Missing or unknown `X-Titan-Key`."
          ],
          [
            "401",
            "`KEY_REVOKED`",
            "Your key was revoked."
          ],
          [
            "401",
            "`ENV_MISMATCH`",
            "The key was issued for a different environment."
          ],
          [
            "401",
            "`UNAUTHORIZED`",
            "On a user-scoped route: `X-Titan-User` is missing, or the supplied id was never onboarded. Call `POST /partner/onboard` for that user first."
          ],
          [
            "403",
            "`PRODUCT_DISABLED`",
            "The product is disabled on your key."
          ],
          [
            "403",
            "`PRODUCT_EXPIRED`",
            "Your product grant has expired."
          ],
          [
            "403",
            "`TENANT_SUSPENDED`",
            "Your tenant is suspended (recoverable; contact Titan)."
          ],
          [
            "403",
            "`TENANT_DELETED`",
            "Your tenant is deleted."
          ],
          [
            "403",
            "`TENANT_NOT_PROVISIONED`",
            "The key is valid but there is no tenant row yet, meaning an onboarding step is missing on Titan's side."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Verify your plumbing"
      },
      {
        "t": "p",
        "text": "`GET /me` resolves who the current request is for, making it the fastest smoke test that `X-Titan-Key` and `X-Titan-User` map to the user you expect:"
      },
      {
        "t": "code",
        "code": "{\n  \"success\": true,\n  \"data\": { \"userId\": \"<opaque user id>\", \"walletAddress\": \"GZk2v…\", \"sessionId\": \"\" }\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "`sessionId` stays empty for every partner integration and can be disregarded. Use `userId` and `walletAddress` and handle both as opaque strings: the field names won't change, but their format might."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Onboarding (SIWS)](/titan/docs/developer-doc/special-order-types/guides/onboarding): where the `X-Titan-User` to manager mapping originates",
          "[Endpoints](/titan/docs/developer-doc/special-order-types/reference/endpoints): which tier each route falls under",
          "[Error Codes](/titan/docs/developer-doc/special-order-types/reference/error-codes): the full error catalog"
        ]
      }
    ],
    "lead": "The two headers that authenticate every request, and the three request tiers."
  },
  "special-order-types/reference/endpoints": {
    "blocks": [
      {
        "t": "p",
        "text": "This is the full route contract. Paths are relative to your environment's base URL. The auth tier for each route is in [Authentication](/titan/docs/developer-doc/special-order-types/reference/authentication), and the complete error catalog is in [Error Codes](/titan/docs/developer-doc/special-order-types/reference/error-codes)."
      },
      {
        "t": "p",
        "text": "On success the response envelope is `{ \"success\": true, \"data\": … }`, and on failure `{ \"success\": false, \"error\": { \"code\", \"message\", \"details\" } }`. `GET /health` is the sole exception."
      },
      {
        "t": "h2",
        "text": "Public"
      },
      {
        "t": "h3",
        "text": "GET /health"
      },
      {
        "t": "p",
        "text": "A liveness and database probe that needs no auth. It comes in three forms: `200` with `status: \"ok\"` and `services.database: \"healthy\"`; `200` with `status: \"degraded\"` and `services.database: \"unhealthy\"`; or `503` with `status: \"error\"` and no `services` field whatsoever. The `503` body carries no error detail. It is the one endpoint outside the standard envelope, because load balancers read it, not partner code."
      },
      {
        "t": "h2",
        "text": "Onboarding"
      },
      {
        "t": "h3",
        "text": "POST /partner/onboard"
      },
      {
        "t": "p",
        "text": "Needs only `X-Titan-Key`. Provisions a user's manager from a one-time SIWS signature, idempotently. [Onboarding](/titan/docs/developer-doc/special-order-types/guides/onboarding) walks through the details."
      },
      {
        "t": "code",
        "code": "// Request\n{ \"sub\": \"<your user id>\", \"userPubkey\": \"<base58>\", \"siws\": { \"message\": \"<canonical>\", \"signature\": \"<base58>\" } }\n// Response\n{ \"success\": true, \"data\": { \"userId\": \"<opaque>\", \"walletAddress\": \"<manager pubkey>\" } }",
        "lang": "json"
      },
      {
        "t": "h2",
        "text": "User session"
      },
      {
        "t": "h3",
        "text": "GET /me"
      },
      {
        "t": "p",
        "text": "`X-Titan-Key` + `X-Titan-User`. Resolves the current user and returns `{ userId, walletAddress, sessionId }` (`sessionId` is always empty for partners)."
      },
      {
        "t": "h2",
        "text": "Balances"
      },
      {
        "t": "h3",
        "text": "GET /me/balance?hideZero=false"
      },
      {
        "t": "p",
        "text": "Shows the manager's per-mint holdings split into total, locked and available. With `hideZero=true`, rows where all buckets are zero are omitted."
      },
      {
        "t": "code",
        "code": "{\n  \"success\": true,\n  \"data\": {\n    \"walletAddress\": \"GZk2v…\",\n    \"balances\": [\n      {\n        \"mint\": \"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\",\n        \"symbol\": \"USDC\", \"decimals\": 6, \"programId\": \"token\",\n        \"totalBalance\": \"1000000\", \"lockedForFutureTxns\": \"600000\",\n        \"withdrawalPending\": \"0\", \"availableToWithdraw\": \"400000\",\n        \"lockedBreakdown\": [\n          { \"orderId\": \"…\", \"orderType\": \"dca\", \"status\": \"active\", \"kind\": \"locked\", \"amount\": \"600000\" }\n        ]\n      }\n    ]\n  }\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "`lockedBreakdown.orderType` takes `dca`, `stop_loss`, `take_profit`, `oco` or `slice`. An armed trigger order locks its entire unspent `amount`, and a Slice Order locks its unspent input while running. A deposit from a `POST /orders/confirm` that is still underway also appears, with `kind: \"deposit_in_flight\"` and `orderId` equal to the pending order id, until the order exists a few seconds later. Field semantics are described in [Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema#balance-row). Errors: `401 UNAUTHORIZED`, `500 RPC_ERROR`."
      },
      {
        "t": "h2",
        "text": "Orders — create"
      },
      {
        "t": "p",
        "text": "Two steps for every order type. `intent` gives back an unsigned deposit transaction, and `confirm` submits the signed one and activates the order."
      },
      {
        "t": "h3",
        "text": "POST /orders/intent"
      },
      {
        "t": "p",
        "text": "User-scoped, with an optional `X-Idempotency-Key`. `orderType` can be `dca`, `stop_loss`, `take_profit`, `oco` or `slice`. [Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders) covers the shared top-level fields and [Order Types](/titan/docs/developer-doc/special-order-types/order-types) each `config` shape. Setting `onboardIfNeeded: true` provisions a brand-new user inline, skipping the separate SIWS step; see [Single-transaction onboarding](/titan/docs/developer-doc/special-order-types/guides/onboarding#single-transaction-onboarding)."
      },
      {
        "t": "code",
        "code": "// Response\n{\n  \"success\": true,\n  \"data\": {\n    \"pendingOrderId\": \"9b3f1ad0-…\",\n    \"memoId\": \"9b3f1ad0-…\",\n    \"transaction\": \"<base64 unsigned deposit tx>\",\n    \"encoding\": \"base64\",\n    \"expiresAt\": \"2025-01-01T00:05:00.000Z\",\n    \"orderType\": \"dca\",\n    \"outputRecipientAddress\": \"<userPubkey or manager>\",\n    \"inputMint\": \"So111…\", \"inputAmount\": \"1000000000\",\n    \"feeLamports\": \"0\"\n  }\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "`feeLamports` is `\"0\"` when execution fees are sponsored in your environment (the partner default), and `\"5000000\"` (0.005 SOL) otherwise, included in the deposit transaction."
      },
      {
        "t": "h3",
        "text": "POST /orders/confirm"
      },
      {
        "t": "code",
        "code": "// Request\n{ \"pendingOrderId\": \"9b3f1ad0-…\", \"signedTransaction\": \"<base64 signed tx>\" }\n// Response\n{ \"success\": true, \"data\": { \"order\": { \"…\": \"…\" }, \"txSignature\": \"<sig>\", \"pendingOrderId\": \"9b3f1ad0-…\", \"deposit\": { \"sent\": \"100000000\", \"received\": \"97000000\" } } }",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "`deposit.sent` echoes the intent's input amount, and `deposit.received` is the amount that actually landed in the manager. Only a Token-2022 mint with a transfer fee makes them differ, and the order is sized from `received`; details in [Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders#token-2022-transfer-fees)."
      },
      {
        "t": "p",
        "text": "Following a `200`, a DCA order starts cycling by itself, a trigger order becomes `active` and starts watching price, and a Slice Order begins executing. A Slice Order's `confirm` may return `409 ACTIVE_BURST_EXISTS` when a concurrent create reached the per-user cap first, meaning the deposit landed but no order was made."
      },
      {
        "t": "h2",
        "text": "Orders — read"
      },
      {
        "t": "table",
        "head": [
          "Endpoint",
          "Returns"
        ],
        "rows": [
          [
            "`GET /me/orders?status={status}&type={type}`",
            "All of the user's orders. `status`: `pending`, `active`, `executing`, `pending_modification`, `paused`, `completed`, `cancelled`, `failed` or `expired`. `type`: `dca`, `stop_loss`, `take_profit`, `oco` or `slice`."
          ],
          [
            "`GET /me/orders/active`",
            "Currently running orders."
          ],
          [
            "`GET /me/orders/history`",
            "Terminal orders (`completed`, `cancelled`, `failed`, `expired`)."
          ],
          [
            "`GET /orders/pending`",
            "Orders awaiting confirmation (signed transaction not yet submitted, or in flight)."
          ],
          [
            "`GET /orders/pending/failed`",
            "Pending orders that timed out or failed before activating."
          ],
          [
            "`GET /orders/pending/history`",
            "All pending-order rows, any status, newest first. **Capped at 50 rows.**"
          ],
          [
            "`GET /dca/{orderId}`",
            "One DCA order with full cycle progress."
          ],
          [
            "`GET /stop-loss/{orderId}`",
            "One stop-loss order. Adds `amount`, `triggerPrice`, `priceDecimals`, `priceBasis`, `minOutputAmount?`, `expiresAt?`, `executedPrice?`, `executedPriceDecimals?`, `amountReceived?`, `trailingStopBps?`, `trailingMode?`, `currentTriggerPrice`, `highestObservedPrice?`, the bracket fields `onFillOco?`, `childOrderId?`, `onFillError?`, and the below-floor streak `minOutputUnmetCount`, `minOutputUnmetSince?`, `lastQuoteOutputAmount?`."
          ],
          [
            "`GET /take-profit/{orderId}`",
            "One take-profit order. Like stop-loss, but with `trailingActivated` instead of `currentTriggerPrice`, plus `amountRemaining` and `scaleStepsExecuted`."
          ],
          [
            "`GET /oco/{orderId}`",
            "One OCO order. Adds `amount`, `takeProfitPrice`, `stopLossPrice`, `priceDecimals`, `priceBasis`, `expiresAt?`, `executedPrice?`, `executedPriceDecimals?`, `amountReceived?`, `pendingLeg?`, `parentOrderId?`, and the stop-loss leg's `trailingStopBps?` / `currentTriggerPrice` / `highestObservedPrice?`."
          ],
          [
            "`GET /slice/{orderId}`",
            "One Slice Order. Returns `{ order, chunks }`: the order under `data.order`, with confirmed slices in `data.chunks`. See [Slice Orders](/titan/docs/developer-doc/special-order-types/order-types/slice#read)."
          ],
          [
            "`GET /orders/{orderId}/executions`",
            "Execution history, newest first. Capped at 500 rows."
          ],
          [
            "`GET /orders/{orderId}/deposit`",
            "The funding transfer that created the order, for any order type. Returns `{ txSignature, submittedAt }`."
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "On `GET /me/orders`, `status` and `type` are **matched exactly and unvalidated**: an unrecognized value yields `{ \"success\": true, \"data\": [] }` and not an error. Verify your filter string before treating an empty list as \"no orders\"."
      },
      {
        "t": "p",
        "text": "If the order is missing, isn't this user's, **or has a different `orderType`**, all five detail endpoints return `404 NOT_FOUND`; route on `orderType` from the list response and don't probe. `GET /orders/{orderId}/deposit` also returns `404` for an order with no recorded deposit. [Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema#order) has the complete field lists."
      },
      {
        "t": "h2",
        "text": "Orders — modify, pause, resume, retry, cancel"
      },
      {
        "t": "table",
        "head": [
          "Endpoint",
          "What it does"
        ],
        "rows": [
          [
            "`PATCH /dca/{orderId}`",
            "**DCA only.** Modify an `active` or `paused` order. Returns `requiresTransaction: false` for in-place edits, or `true` with an unsigned transaction when `totalAmount` changes."
          ],
          [
            "`POST /dca/{orderId}/modify/confirm`",
            "**DCA only.** Submit the signed modify transaction with the matching `cyclesCompleted` and `config`."
          ],
          [
            "`PATCH /stop-loss/{orderId}`, `PATCH /take-profit/{orderId}`, `PATCH /oco/{orderId}`",
            "Modify an `active` or `paused` trigger order's prices, expiry and trail in place. Body `{ \"config\": { …partial… } }`. No transaction. Returns `{ order }` under `data`."
          ],
          [
            "`POST /orders/{orderId}/pause`",
            "Pause an `active` order. DCA and trigger orders; `400 PAUSE_NOT_SUPPORTED` on a Slice Order."
          ],
          [
            "`POST /orders/{orderId}/resume`",
            "Resume a `paused` order. DCA and trigger orders."
          ],
          [
            "`POST /orders/{orderId}/retry`",
            "**DCA only.** Turns a `failed` order back into `active`, only before auto-return runs. Trigger orders and Slice Orders return `400 RETRY_NOT_SUPPORTED` (usually preceded by `400 ALREADY_WITHDRAWN`)."
          ],
          [
            "`POST /orders/{orderId}/cancel`",
            "Cancel, discriminated on `withdraw`: `{ withdraw: false }` or `{ withdraw: true, userPubkey }`. DCA and trigger orders; `400 CANCEL_NOT_SUPPORTED` on a Slice Order."
          ]
        ]
      },
      {
        "t": "p",
        "text": "[Managing Orders](/titan/docs/developer-doc/special-order-types/guides/managing-orders) covers the flows and per-endpoint error codes, with [Modify a trigger order](/titan/docs/developer-doc/special-order-types/guides/managing-orders#modify-a-trigger-order) for triggers and [DCA](/titan/docs/developer-doc/special-order-types/order-types/dca#modify) for DCA modify."
      },
      {
        "t": "h2",
        "text": "Wallet-level withdrawals"
      },
      {
        "t": "table",
        "head": [
          "Endpoint",
          "What it does"
        ],
        "rows": [
          [
            "`POST /withdraw/transaction`",
            "Build an unsigned wallet withdrawal transaction. Body: `{ userPubkey, tokenMint, amount? }`; omit `amount` for the maximum."
          ],
          [
            "`POST /withdraw/confirm`",
            "Submit the signed transaction. Body: `{ signedTransaction }`."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Order-level withdrawals"
      },
      {
        "t": "table",
        "head": [
          "Endpoint",
          "What it does"
        ],
        "rows": [
          [
            "`POST /orders/{orderId}/withdraw`",
            "Build a withdrawal transaction for one terminal order. Returns `withdrawalAmounts` (a per-mint preview). Safe to retry."
          ],
          [
            "`POST /orders/{orderId}/withdraw/confirm`",
            "Submit the signed transaction."
          ],
          [
            "`POST /orders/{orderId}/withdraw/abandon`",
            "Release a stuck `withdrawalStatus: pending` lock. Idempotent."
          ]
        ]
      },
      {
        "t": "p",
        "text": "Both withdrawal flows are walked through in [Withdrawals](/titan/docs/developer-doc/special-order-types/guides/withdrawals)."
      },
      {
        "t": "h2",
        "text": "Partner reporting"
      },
      {
        "t": "p",
        "text": "Server-to-server and `X-Titan-Key` only, with no `X-Titan-User`. Rows belong to your tenant and are limited to 500. To filter on a single user, use `?userId=<the userId from onboarding>` (Titan's opaque id, not your `sub`)."
      },
      {
        "t": "h3",
        "text": "GET /partners/me/orders"
      },
      {
        "t": "p",
        "text": "Query params: `status` (comma-separated; allowed subset: `active`, `paused`, `completed`, `failed`, `cancelled`), `orderType` (`dca`, `stop_loss`, `take_profit`, `oco` or `slice`), `userId`, `createdAtGte`, `createdAtLte` (ISO-8601; an invalid timestamp returns `400 VALIDATION_ERROR`)."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "The `status` filter on this endpoint covers a deliberate subset only. You can't filter by `executing`, `pending`, `pending_modification` or `expired`. Orders in those states are still returned when `status=` is omitted."
      },
      {
        "t": "p",
        "text": "Rows look like those from the per-type detail endpoints **apart from** `originatingPartner` and the internal `tenantId`, which are omitted since each row is yours by definition."
      },
      {
        "t": "h3",
        "text": "GET /partners/me/orders/{id}"
      },
      {
        "t": "p",
        "text": "Fetches one order by id within your tenant. Returns `404` if it doesn't exist **or** belongs to another partner, so existence is never revealed across tenants."
      },
      {
        "t": "h3",
        "text": "GET /partners/me/orders/{id}/deposit"
      },
      {
        "t": "p",
        "text": "This is the tenant-scoped counterpart of `GET /orders/{orderId}/deposit`, with the same `{ txSignature, submittedAt }` response. The `404` conditions are identical, with one addition: an order that belongs to another partner."
      },
      {
        "t": "h3",
        "text": "GET /partners/me/executions"
      },
      {
        "t": "p",
        "text": "Rows for each execution, fee snapshot included, for billing reconciliation. Query params: `userId`, `createdAtGte`, `createdAtLte`. `executionType` is `dca_cycle`, `stop_loss`, `take_profit_full`, `take_profit_scaled` or `slice_fill`. [Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema#execution) defines the row shape and fixed-point rules."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Order & Execution Schema](/titan/docs/developer-doc/special-order-types/reference/schema): all fields on an order, execution and balance row",
          "[Error Codes](/titan/docs/developer-doc/special-order-types/reference/error-codes): the whole catalog, organized by category",
          "[Limits & Idempotency](/titan/docs/developer-doc/special-order-types/reference/limits): row caps, TTLs and how idempotency works"
        ]
      }
    ],
    "lead": "Every route — method, auth tier, request, and response — across all five order types."
  },
  "special-order-types/reference/limits": {
    "blocks": [
      {
        "t": "h2",
        "text": "Limits"
      },
      {
        "t": "table",
        "head": [
          "Limit",
          "Value"
        ],
        "rows": [
          [
            "List endpoints",
            "At most **500 rows**, unless stated otherwise. Use `createdAtGte` / `createdAtLte` on `/partners/me/*` for older data."
          ],
          [
            "`GET /orders/pending/history`",
            "**50 rows**, the one exception to the 500 cap."
          ],
          [
            "SIWS message",
            "Max **1024 bytes**; the signed bytes must match the canonical form exactly (LF endings, trailing `\\n` after `Nonce:`); `Issued At` within **±10 minutes**."
          ],
          [
            "Cycle frequency",
            "Minimum **60 seconds** (`cycleFrequencySeconds`)."
          ],
          [
            "Minimum notional",
            "**$10 USD** by default, configurable per tenant. For DCA it applies per cycle (`amountPerCycle`), enforced at create and whenever it changes. For trigger orders the same floor applies to the full `amount`; for Slice Orders, to each slice (`amount / executions`). USDC and USDT count as $1.00; other mints are priced by the oracle at request time."
          ],
          [
            "Trigger order fields",
            "`priceDecimals` `0`–`18`. `priceBasis` `\"pair\"` or `\"usd\"` (`\"usd\"` isn't allowed with a stablecoin `inputMint`). `trailingStopBps` `1`–`9999` (on `stop_loss`, `take_profit` and the `oco` stop-loss leg). `expiresAt` must be in the future. OCO requires `stopLossPrice < takeProfitPrice`."
          ],
          [
            "Slice Order fields",
            "`executions` `2`–`15`. `minGapSeconds` `0`–`30`. Up to your integration's cap (1 by default) of `active` / `executing` Slice Orders per user at a time."
          ],
          [
            "Pending order TTL",
            "**5 minutes** between `intent` and `confirm`."
          ],
          [
            "Modification lock",
            "**30 seconds** between a modify intent returning `requiresTransaction: true` and `modify/confirm`. DCA only."
          ],
          [
            "Idempotency replay window",
            "**24 hours**. Only `2xx` responses are cached."
          ],
          [
            "Order-level withdrawal auto-recovery",
            "A stuck `withdrawalStatus: pending` lock clears by itself within **about 8 minutes**. Call `…/withdraw/abandon` to release it immediately."
          ],
          [
            "API key environment",
            "A key is tied to exactly one environment (`staging` or `production`)."
          ],
          [
            "Rate limits",
            "Configured per partner during onboarding."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Idempotency"
      },
      {
        "t": "p",
        "text": "Every authenticated `POST` in the user-scoped tier supports an `X-Idempotency-Key` header: `/orders/intent`, `/orders/confirm`, `/dca/{id}/modify/confirm`, `/orders/{id}/cancel`, `/orders/{id}/withdraw`, `/orders/{id}/withdraw/confirm`, `/orders/{id}/withdraw/abandon`, `/orders/{id}/pause`, `/orders/{id}/resume`, `/orders/{id}/retry`, `/withdraw/transaction` and `/withdraw/confirm`. It is optional, so omit it on first attempts and add it to calls you expect to retry."
      },
      {
        "t": "p",
        "text": "`POST /partner/onboard` needs no key because it is inherently idempotent: calling it again with the same `sub` replays the same `userId` / `walletAddress`. Idempotency doesn't apply to GET endpoints or partner-only endpoints."
      },
      {
        "t": "p",
        "text": "**The rules:**"
      },
      {
        "t": "list",
        "items": [
          "A key is scoped to **(your tenant, end user, key string)**, so two different users who use the same key value don't collide.",
          "With the same key **and the same body**, Titan replays the cached JSON response exactly (including the original `2xx` status) for **24 hours**.",
          "Same key **and a different body**: `422 IDEMPOTENCY_KEY_REUSED`. Pick a fresh key.",
          "**Only `2xx` responses are cached.** A `4xx` or `5xx` from the first call means the key is not recorded, so retrying with that key runs the handler once more. A failed `/orders/intent` (e.g. a bad mint) shouldn't stay bound for good to one request body."
        ]
      },
      {
        "t": "p",
        "text": "Pick a deterministic key on the client for each logical user action, e.g. `dca:create:<your-internal-order-id>:v1`. Never randomize it per network attempt, since the aim is for retries to yield an identical key."
      },
      {
        "t": "h2",
        "text": "Polling, not webhooks"
      },
      {
        "t": "p",
        "text": "Titan won't push state changes; webhooks don't exist today. While a user is looking at their orders, poll the read endpoints, following the cadence advice in [Lifecycle & Polling](/titan/docs/developer-doc/special-order-types/guides/lifecycle). Because trigger orders may fire at any time instead of on a known schedule, they need steadier polling than DCA does. A running Slice Order should be polled every 2–3 seconds."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): the place idempotency keys count most",
          "[Error Codes](/titan/docs/developer-doc/special-order-types/reference/error-codes): `IDEMPOTENCY_KEY_REUSED` along with the retryable codes",
          "[Lifecycle & Polling](/titan/docs/developer-doc/special-order-types/guides/lifecycle): how often to poll, and when to back off"
        ]
      }
    ],
    "lead": "Row caps, TTLs, per-cycle minimums, and the idempotency contract."
  },
  "special-order-types/reference/schema": {
    "blocks": [
      {
        "t": "p",
        "text": "This page describes the objects returned by the API. Amounts are integer strings in the token's smallest unit, and timestamps are ISO-8601 unless marked as Unix seconds. Every id should be treated as opaque."
      },
      {
        "t": "p",
        "text": "All order types share the base `Order` shape below and add their own type-specific fields on top."
      },
      {
        "t": "h2",
        "text": "Order"
      },
      {
        "t": "p",
        "text": "`POST /orders/confirm`, the order lists and each per-type detail endpoint all return this. The example is a DCA order; on a trigger order, the trigger fields documented further down replace the cycle fields."
      },
      {
        "t": "code",
        "code": "{\n  \"id\": \"9b3f1ad0-7c34-4e1f-bcfb-1c9a5a3a7b21\",\n  \"tenantId\": \"<your tenant uuid>\",\n  \"originatingPartner\": { \"id\": \"your-partner-id\", \"name\": \"Your Brand\" },\n  \"userId\": \"<opaque Titan user id>\",\n  \"walletAddress\": \"GZk2v…\",\n  \"outputRecipientAddress\": \"GZk2v…\",\n  \"orderType\": \"dca\",\n  \"status\": \"active\",\n  \"previousStatus\": null,\n  \"inputMint\": \"So111…\",\n  \"outputMint\": \"EPjFW…\",\n  \"totalAmount\": \"1000000000\",\n  \"amountPerCycle\": \"100000000\",\n  \"cycleFrequencySeconds\": 86400,\n  \"minOutputPerCycle\": null,\n  \"maxOutputPerCycle\": null,\n  \"cyclesCompleted\": 3,\n  \"totalCycles\": 10,\n  \"amountSpent\": \"300000000\",\n  \"amountReceived\": \"150000000\",\n  \"startAt\": null,\n  \"expiresAt\": null,\n  \"nextExecutionAt\": \"2025-01-04T00:00:00.000Z\",\n  \"lastExecutionAt\": \"2025-01-03T00:00:00.000Z\",\n  \"lastExecutionTxHash\": \"<sig or null>\",\n  \"createdAt\": \"2025-01-01T00:00:00.000Z\",\n  \"updatedAt\": \"2025-01-01T00:00:00.000Z\",\n  \"cancelledAt\": null,\n  \"completedAt\": null,\n  \"failedAt\": null,\n  \"failureReason\": null,\n  \"withdrawalStatus\": \"none\",\n  \"withdrawalTxHash\": null,\n  \"withdrawalRequestedAt\": null,\n  \"withdrawalCompletedAt\": null,\n  \"platformFeeBpsOverride\": 50\n}",
        "lang": "json"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Meaning"
        ],
        "rows": [
          [
            "`tenantId`",
            "Your tenant uuid. Present on user-scoped reads and **omitted** on `/partners/me/*` reporting reads."
          ],
          [
            "`originatingPartner`",
            "Resolved partner attribution. Present on user-scoped reads and **omitted** on `/partners/me/*` reads."
          ],
          [
            "`userId`",
            "The opaque Titan user id (the same value `GET /me` returns)."
          ],
          [
            "`walletAddress`",
            "The user's **manager** (a Titan-managed Solana pubkey)."
          ],
          [
            "`outputRecipientAddress`",
            "Where swap output lands: the manager (`walletAddress`) or the user's external `userPubkey`. Immutable after creation."
          ],
          [
            "`orderType`",
            "`dca`, `stop_loss`, `take_profit`, `oco` or `slice`."
          ],
          [
            "`status`",
            "`pending`, `active`, `executing`, `pending_modification`, `paused`, `completed`, `cancelled`, `failed` or `expired`. A DCA order is `pending` only while waiting for a future `startAt`; trigger orders never use `pending` or `pending_modification`; Slice Orders use only `active`, `executing`, `completed` and `failed`."
          ],
          [
            "`previousStatus`",
            "The resting state to display while an order passes through `executing` or `pending_modification`. `null` otherwise."
          ],
          [
            "`cyclesCompleted` / `totalCycles`",
            "DCA progress counters."
          ],
          [
            "`amountSpent` / `amountReceived`",
            "Cumulative input spent and output received across all executions."
          ],
          [
            "`nextExecutionAt` / `lastExecutionAt`",
            "`null` before the first cycle / after a terminal state. A trigger order has no schedule, so there is nothing for `nextExecutionAt` to refer to."
          ],
          [
            "`lastExecutionTxHash`",
            "Solana signature of the latest successful execution, or `null`."
          ],
          [
            "`failureReason`",
            "Set when `status = failed`. A short label fit for display: `execution_failed`, `simulation_failed`, `reverted_on_chain`, `output_account_closed`, or, for trigger orders only, `min_output_unreachable`."
          ],
          [
            "`withdrawalStatus`",
            "`none`, `pending` or `completed`. Independent of `status`."
          ],
          [
            "`withdrawalTxHash`",
            "Signature of the fund return once `withdrawalStatus = completed`, or `null` (including when an auto-return found nothing to send). Always a real signature or `null`, never a placeholder."
          ],
          [
            "`withdrawalRequestedAt` / `withdrawalCompletedAt`",
            "Track the withdrawal lifecycle in step with `withdrawalStatus`."
          ],
          [
            "`platformFeeBpsOverride`",
            "The per-order fee override, if one was set."
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "Stick to the documented fields. Responses can carry additional fields while an execution is in flight, and anything undocumented is internal and may change at any time."
      },
      {
        "t": "h2",
        "text": "Trigger-order fields"
      },
      {
        "t": "p",
        "text": "`GET /stop-loss/{orderId}`, `/take-profit/{orderId}` and `/oco/{orderId}` return the base `Order` above together with the following. Amounts and prices are all strings, and timestamps all ISO-8601, `expiresAt` included, even though you *sent* it in Unix seconds."
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Types",
          "Meaning"
        ],
        "rows": [
          [
            "`amount`",
            "all three",
            "The deposit: input tokens sold when the trigger fires."
          ],
          [
            "`triggerPrice`",
            "`stop_loss`, `take_profit`",
            "The **initial** trigger, on the order's `priceBasis`, scaled by `priceDecimals`. Frozen at its creation value unless modified, so on a trailing order it is no longer the live trigger."
          ],
          [
            "`takeProfitPrice` / `stopLossPrice`",
            "`oco`",
            "The two legs' triggers. Always `stopLossPrice < takeProfitPrice`."
          ],
          [
            "`priceDecimals`",
            "all three",
            "Integer `0`–`18`. The scale for every trigger price field on the order."
          ],
          [
            "`priceBasis`",
            "all three",
            "`\"pair\"` or `\"usd\"`. The denomination of every price field on the order, `executedPrice` included. Always present; `\"pair\"` on orders created before the field existed. See [Price basis](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#price-basis)."
          ],
          [
            "`minOutputAmount`",
            "`stop_loss`, `take_profit`",
            "Execution floor, in output-mint atoms. Not supported on `oco`."
          ],
          [
            "`expiresAt`",
            "all three",
            "Auto-return fires at expiry."
          ],
          [
            "`executedPrice`",
            "all three",
            "The realized fill price once `completed`, on the order's `priceBasis`. Scale it by `executedPriceDecimals`."
          ],
          [
            "`executedPriceDecimals`",
            "all three",
            "The scale of `executedPrice`; equals `priceDecimals`. **Absent** on orders filled before the field existed, whose `executedPrice` is a raw atom ratio and should be treated as not renderable. See [`executedPrice` scale](/titan/docs/developer-doc/special-order-types/order-types/stop-loss-take-profit#executedprice-scale)."
          ],
          [
            "`amountReceived`",
            "all three",
            "Output received from the fill."
          ],
          [
            "`trailingStopBps`",
            "all three",
            "`1`–`9999`. Present when the order is trailing (the stop-loss leg only, on `oco`)."
          ],
          [
            "`currentTriggerPrice`",
            "`stop_loss`, `oco`",
            "The **live** trigger, computed by the server. Always present, equal to `triggerPrice` / `stopLossPrice` until the first ratchet. Render this, not `triggerPrice`."
          ],
          [
            "`highestObservedPrice`",
            "all three",
            "The tracked peak. Absent until the first new high or, on a take-profit, until the trail arms."
          ],
          [
            "`trailingActivated`",
            "`take_profit`",
            "Whether the trail has armed. A take-profit has no `currentTriggerPrice`, so compute the derived trigger client-side."
          ],
          [
            "`trailingMode`",
            "`stop_loss`",
            "`\"pure\"` or `\"stop_and_trail\"`. A UI-only label that never affects execution."
          ],
          [
            "`pendingLeg`",
            "`oco`",
            "`stop_loss` or `take_profit`: which leg is mid-execution while `executing`. Absent otherwise."
          ],
          [
            "`amountRemaining` / `scaleStepsExecuted`",
            "`take_profit`",
            "Present on the response; meaningless for orders you create."
          ],
          [
            "`onFillOco`",
            "`stop_loss`, `take_profit`",
            "The stored bracket spec, when the order was created with one. Prices as strings; `outputRecipientAddress` always filled in. See [Conditional Entry & Bracket](/titan/docs/developer-doc/special-order-types/order-types/otoco)."
          ],
          [
            "`childOrderId`",
            "`stop_loss`, `take_profit`",
            "The bracket order's id, set once the bracket exists."
          ],
          [
            "`onFillError`",
            "`stop_loss`, `take_profit`",
            "`\"amount_unverified\"` when the entry completed but its on-chain output couldn't be verified, so no bracket was created."
          ],
          [
            "`parentOrderId`",
            "all three",
            "Set on a bracket order, pointing back to the entry that created it."
          ]
        ]
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "**Ignore `entryPrice`, `minProfitBps` and `scaleSteps`** if they appear on a read. They are legacy fields on older orders and mean nothing for orders you create."
      },
      {
        "t": "p",
        "text": "[Trailing Stops](/titan/docs/developer-doc/special-order-types/order-types/trailing) explains the meaning of each trailing field by type; the three types don't behave alike."
      },
      {
        "t": "h2",
        "text": "Slice Order fields"
      },
      {
        "t": "p",
        "text": "`GET /slice/{orderId}` returns `{ order, chunks }` inside `data`. `order` is the base `Order` above plus the fields below; order lists and partner reporting contain the same `order` shape, minus `chunks`."
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Meaning"
        ],
        "rows": [
          [
            "`totalAmount`",
            "Total input deposited."
          ],
          [
            "`amountSpent`",
            "Input used by confirmed slices."
          ],
          [
            "`amountReceived`",
            "Output from confirmed slices. A quoted estimate while running; on a `completed` order carrying `onFillOco`, rewritten to the exact on-chain sum."
          ],
          [
            "`executionsTotal`",
            "Number of slices requested at creation."
          ],
          [
            "`minGapSeconds`",
            "Minimum gap between slice sends (`0` when not set)."
          ],
          [
            "`onFillOco` / `childOrderId` / `onFillError`",
            "Bracket fields, present only when a bracket was requested."
          ]
        ]
      },
      {
        "t": "p",
        "text": "Each entry in `chunks` is one **confirmed** slice, sorted by `index`:"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Meaning"
        ],
        "rows": [
          [
            "`index`",
            "Slice number, 1-based."
          ],
          [
            "`inputAmount`",
            "Input spent by this slice."
          ],
          [
            "`outputAmount`",
            "Output received from this slice."
          ],
          [
            "`txSignature`",
            "The slice's Solana transaction signature."
          ],
          [
            "`executedAt`",
            "ISO-8601 confirmation time."
          ]
        ]
      },
      {
        "t": "p",
        "text": "Ignore `chunkSignatures` and `executionInFlight` if present; they are internal recovery metadata."
      },
      {
        "t": "h2",
        "text": "Execution"
      },
      {
        "t": "p",
        "text": "Returned by `GET /orders/{orderId}/executions` and `GET /partners/me/executions`. Capped at 500 rows, newest first."
      },
      {
        "t": "code",
        "code": "{\n  \"id\": \"c12a8b6f-2f5a-4e26-9c1b-8a4f9e7d1b22\",\n  \"orderId\": \"9b3f1ad0-…\",\n  \"executionType\": \"dca_cycle\",\n  \"status\": \"success\",\n  \"inputAmount\": \"100000000\",\n  \"outputAmount\": \"50000000\",\n  \"outputAmountUsd\": \"5000000\",\n  \"outputAmountUsdDecimals\": 6,\n  \"price\": \"500000\",\n  \"priceDecimals\": 6,\n  \"txSignature\": \"<sig>\",\n  \"failureReason\": null,\n  \"executedAt\": \"2025-01-02T00:00:00.000Z\",\n  \"platformFeeWallet\": \"FeEa…\",\n  \"platformFeeBps\": 50,\n  \"platformFeeMint\": \"EPjFW…\",\n  \"platformFeeAmount\": \"25000\"\n}",
        "lang": "json"
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Notes"
        ],
        "rows": [
          [
            "`executionType`",
            "`dca_cycle` (one row per DCA cycle), `stop_loss`, `take_profit_full` or `slice_fill`. A trigger order writes exactly one row, when it fires; an OCO fill is recorded under its leg's type, and there is no `oco` execution type. A Slice Order writes one `slice_fill` row per confirmed slice, with `executionIndex` set to the 1-based slice number. `take_profit_scaled` shows up only on historical scaled orders."
          ],
          [
            "`status`",
            "`pending` (in flight), `success` (confirmed on-chain) or `failed` (terminal for that cycle)."
          ],
          [
            "`price`",
            "Integer string, a fixed-point number scaled by `priceDecimals`. `price = \"500000\"` with `priceDecimals = 6` means 0.5 output per input. Don't parse it as a float."
          ],
          [
            "`outputAmountUsd`",
            "Same fixed-point convention, using `outputAmountUsdDecimals`. May be `null` if pricing wasn't available at execution time."
          ],
          [
            "`failureReason`",
            "Short error label when `status = failed`, otherwise `null`. (On the wire the field is `failureReason`, not `errorMessage`.)"
          ],
          [
            "`platformFee*`",
            "Snapshot of the fee taken on this execution. All four are filled together when a fee was charged and all four are `null` when none was (zero `bps`, or no tenant fee wallet)."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Balance row"
      },
      {
        "t": "p",
        "text": "Returned by `GET /me/balance` inside `data.balances[]`."
      },
      {
        "t": "table",
        "head": [
          "Field",
          "Meaning"
        ],
        "rows": [
          [
            "`totalBalance`",
            "Raw on-chain balance of the mint in the manager."
          ],
          [
            "`lockedForFutureTxns`",
            "Reserved by active orders: `totalAmount − amountSpent` of the input mint for DCA and Slice Orders, and the full unspent `amount` for an armed trigger order. Output mints are not locked, except a conditional entry's bought tokens, which stay locked until they become the bracket's `amount`. Also includes a deposit from an in-progress `POST /orders/confirm` whose order doesn't exist yet (`lockedBreakdown.kind = \"deposit_in_flight\"`, `orderId` = the pending order id); this clears within seconds once the order is created."
          ],
          [
            "`withdrawalPending`",
            "Reserved by an in-flight order-level withdrawal."
          ],
          [
            "`availableToWithdraw`",
            "`max(total − locked − withdrawalPending, 0)`. The source of truth for \"withdraw max\"."
          ],
          [
            "`programId`",
            "One of `native`, `token`, `token-2022`."
          ],
          [
            "`lockedBreakdown`",
            "Per-order attribution of the lock: `{ orderId, orderType, status, kind, amount }`. `orderType` is one of `dca`, `stop_loss`, `take_profit`, `oco`, `slice`."
          ],
          [
            "`symbol`",
            "Resolved for `SOL`, `USDC` and `USDT`; otherwise `null` (look it up in your token registry)."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Conventions"
      },
      {
        "t": "p",
        "text": "Amounts are integer strings in the smallest unit, which avoids precision loss in JavaScript. Order, pending-order and execution ids are UUIDv4; the Titan `userId` is an opaque string. Legacy SPL Token and Token-2022 mints are both supported, and Titan detects which applies to each mint. Token-2022 mints charging a **transfer fee** are handled by sizing the order from the amount the manager really received ([Token-2022 transfer fees](/titan/docs/developer-doc/special-order-types/guides/creating-orders#token-2022-transfer-fees)). A mint with transfer hooks or other unusual extensions might fail to transfer, and the API reports an explicit error if so."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Order Types](/titan/docs/developer-doc/special-order-types/order-types): the `config` behind each of these shapes",
          "[Lifecycle & Polling](/titan/docs/developer-doc/special-order-types/guides/lifecycle): how `status` and `withdrawalStatus` transition",
          "[Endpoints](/titan/docs/developer-doc/special-order-types/reference/endpoints): which routes return each object"
        ]
      }
    ],
    "lead": "Field-by-field reference for the Order, Execution, and balance-row objects, across all five order types."
  },
  "special-order-types/reference/error-codes": {
    "blocks": [
      {
        "t": "p",
        "text": "Every error response has the same shape:"
      },
      {
        "t": "code",
        "code": "{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Human-readable summary\",\n    \"details\": { \"…\": \"optional, code-specific\" }\n  }\n}",
        "lang": "json"
      },
      {
        "t": "p",
        "text": "Branch on `error.code` every time; `message` is human-readable and may change without notice. HTTP codes split as follows: `2xx` success, `4xx` client error, `409` race or state conflict, `422` idempotency mismatch, `5xx` server error."
      },
      {
        "t": "h2",
        "text": "Auth & tenancy"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "Code",
          "Meaning"
        ],
        "rows": [
          [
            "401",
            "`UNAUTHORIZED`",
            "On a user-scoped route: `X-Titan-User` is missing, or the supplied id was never onboarded. Call `POST /partner/onboard` first."
          ],
          [
            "401",
            "`INVALID_API_KEY`",
            "Missing or unknown `X-Titan-Key`."
          ],
          [
            "401",
            "`KEY_REVOKED`",
            "Your key was revoked."
          ],
          [
            "401",
            "`ENV_MISMATCH`",
            "The key was issued for a different environment."
          ],
          [
            "403",
            "`PRODUCT_DISABLED`",
            "The product is disabled on your key."
          ],
          [
            "403",
            "`PRODUCT_EXPIRED`",
            "Your product grant expired."
          ],
          [
            "403",
            "`TENANT_SUSPENDED`",
            "Tenant suspended (recoverable; contact Titan)."
          ],
          [
            "403",
            "`TENANT_DELETED`",
            "Tenant deleted."
          ],
          [
            "403",
            "`TENANT_NOT_PROVISIONED`",
            "The key is valid but there is no tenant row yet."
          ],
          [
            "422",
            "`IDEMPOTENCY_KEY_REUSED`",
            "The same `X-Idempotency-Key` was sent with a different body."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Onboarding (POST /partner/onboard)"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "Code",
          "Meaning"
        ],
        "rows": [
          [
            "400",
            "`BAD_REQUEST`",
            "Missing `sub`, `userPubkey`, `siws.message` or `siws.signature`, or invalid JSON."
          ],
          [
            "400",
            "`SIWS_INVALID`",
            "The signature, canonical-form, freshness or ownership check failed."
          ],
          [
            "400",
            "`PARTNER_NOT_CONFIGURED`",
            "The tenant isn't enabled for partner onboarding."
          ],
          [
            "409",
            "`USER_PUBKEY_CONFLICT`",
            "`sub` and the attested wallet resolve to two different Titan identities."
          ],
          [
            "409",
            "`WALLET_NEEDS_USER_CONSENT`",
            "The wallet exists with no manager set up and Titan can't attach one server-side (rare)."
          ],
          [
            "409",
            "`ONBOARDING_INCOMPLETE`",
            "A user-scoped call reached a manager that isn't fully provisioned. Call onboard again (idempotent), then retry."
          ],
          [
            "500 / 502",
            "`PROVISIONING_FAILED`",
            "Provisioning error (`502` upstream, `500` unexpected). Safe to retry."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Orders & transactions"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "Code",
          "Where / when"
        ],
        "rows": [
          [
            "400",
            "`VALIDATION_ERROR`",
            "Most invalid bodies and query params. `details` usually has a per-field breakdown."
          ],
          [
            "400",
            "`VALIDATION_ERROR` (trigger orders)",
            "Trigger-specific causes: `expiresAt` in the past, `stopLossPrice >= takeProfitPrice`, `priceDecimals` outside `0`–`18`, `amount` or prices not `> 0`, `minOutputAmount` not `> 0`, `priceBasis` not `\"pair\"` / `\"usd\"`, `priceBasis: \"usd\"` with a stablecoin `inputMint`, an invalid `onFillOco`, or a retired take-profit field (`scaleSteps`, `entryPrice`, `minProfitBps`). On a trigger `PATCH`: an immutable field, an empty patch, or a merged-invariant violation."
          ],
          [
            "400",
            "`VALIDATION_ERROR` (Slice Orders)",
            "`executions` outside `2`–`15`, `minGapSeconds` outside `0`–`30`, or an unknown `config` field."
          ],
          [
            "400",
            "`MISSING_PARAMS`",
            "`POST /orders/confirm`: required body fields are absent."
          ],
          [
            "400",
            "`INVALID_REQUEST`",
            "`POST /dca/{id}/modify/confirm`: invalid body shape."
          ],
          [
            "400",
            "`INVALID_ORDER_TYPE`",
            "`orderType` isn't one of `dca` / `stop_loss` / `take_profit` / `oco` / `slice`."
          ],
          [
            "400",
            "`INVALID_MINTS`",
            "Input and output mint are the same."
          ],
          [
            "400",
            "`MIN_NOTIONAL_NOT_MET`",
            "Below your tenant's minimum ($10 USD default): per cycle for DCA, on the full `amount` for trigger orders, per slice for Slice Orders. `details`: `mint`, `amount`, `usdCents`, `requiredCents`."
          ],
          [
            "400",
            "`MIN_OUTPUT_UNSATISFIABLE`",
            "`POST /orders/intent` and trigger `PATCH`, trigger orders only: the order could never fill. **Structural** (stop-loss): `minOutputAmount` above the output implied by `triggerPrice`; `details`: `priceBasis`, `triggerPrice`, `minOutputAmount`, `outputAtTriggerPrice`. **Instant-fire**: the trigger is already crossed **and** `minOutputAmount` is above the input's market value; `details`: `priceBasis`, `triggerPrice`, `currentPrice`, `minOutputAmount`, `fairOutputAmount`. Lower `minOutputAmount` or move the trigger."
          ],
          [
            "400",
            "`INVALID_TRANSACTION`",
            "A submitted transaction failed structural checks on the withdrawal or modify confirm endpoints (`/withdraw/confirm`, `/dca/{id}/modify/confirm`, `/orders/{id}/withdraw/confirm`). **Not** raised by `/orders/confirm`, where structural problems appear as `SUBMIT_FAILED`."
          ],
          [
            "400",
            "`INVALID_STATUS`",
            "The pending order was already used (for example, confirmed earlier)."
          ],
          [
            "400",
            "`EXPIRED`",
            "The pending order's 5-minute window passed (`/orders/confirm`)."
          ],
          [
            "400",
            "`TRANSACTION_EXPIRED`",
            "The unsigned transaction's 5-minute window passed. Request a new intent."
          ],
          [
            "400",
            "`TRANSACTION_TAMPERED`",
            "The submitted signed transaction doesn't match the unsigned one Titan returned."
          ],
          [
            "400",
            "`INVALID_STATE`",
            "An atomic transition lost a race, an order is in an unsupported state, or, on `/orders/confirm`, the server-side stored transaction is missing or expired (request a new intent in that last case)."
          ],
          [
            "400",
            "`ORDER_NOT_FAILED`",
            "`POST /orders/{id}/retry` on an order that isn't `failed`. `details.status` echoes the current status."
          ],
          [
            "400",
            "`RETRY_NOT_SUPPORTED`",
            "`POST /orders/{id}/retry` on a trigger order or a Slice Order. Checked **after** `ALREADY_WITHDRAWN`, so you'll usually see that one first."
          ],
          [
            "400",
            "`INSUFFICIENT_FUNDS`",
            "On retry, the wallet no longer holds enough of the input mint. `details`: `mint`, `required`, `currentBalance`, `gap`."
          ],
          [
            "400",
            "`NOT_CANCELLABLE`",
            "`POST /orders/{id}/cancel` on an order that can't be cancelled in its current state."
          ],
          [
            "400",
            "`CANCEL_NOT_SUPPORTED`",
            "`POST /orders/{id}/cancel` on a Slice Order. Slice Orders can't be cancelled; a failed one auto-returns its unspent input."
          ],
          [
            "400",
            "`PAUSE_NOT_SUPPORTED`",
            "`POST /orders/{id}/pause` on a Slice Order."
          ],
          [
            "400",
            "`ORDER_TYPE_NOT_SUPPORTED`",
            "A Slice Order was requested on the balance-funded create path. Slice Orders are deposit-funded only."
          ],
          [
            "400",
            "`MODIFICATION_ERROR`",
            "Modify was rejected by a server-side guard, or `cyclesCompleted` didn't match. Re-fetch and run the modify intent again."
          ],
          [
            "409",
            "`USER_PUBKEY_CONFLICT`",
            "`POST /orders/intent` with `onboardIfNeeded: true`: the wallet already belongs to a Titan account (yours, the Titan app's, or another partner's). Fall back to the two-step SIWS flow through `POST /partner/onboard`."
          ],
          [
            "403",
            "`FORBIDDEN`",
            "The pending order on `/orders/confirm` belongs to a different user or tenant."
          ],
          [
            "404",
            "`NOT_FOUND`",
            "The resource doesn't exist or isn't yours / this user's."
          ],
          [
            "409",
            "`EXECUTION_IN_FLIGHT`",
            "A swap attempt is still reconciling, or, on a trigger `PATCH`, a fill was claimed or the order changed during the request. Resolves itself; retry shortly."
          ],
          [
            "409",
            "`ACTIVE_BURST_EXISTS`",
            "`POST /orders/intent` or `POST /orders/confirm` for a Slice Order while the user already has the maximum number of `active` or `executing` Slice Orders for your integration (1 by default, raised per partner on request). `details: { active, cap }`. At `confirm`, the deposit has landed but no order was created; the funds are available balance."
          ],
          [
            "409",
            "`LOCK_FAILED`",
            "A concurrent modification on the same order at `PATCH /dca/{id}`."
          ],
          [
            "409",
            "`LOCK_EXPIRED`",
            "The 30-second modify lock ran out before `/modify/confirm`. Run `PATCH /dca/{id}` again."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Withdrawals"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "Code",
          "Where / when"
        ],
        "rows": [
          [
            "400",
            "`INSUFFICIENT_AVAILABLE`",
            "Wallet-level: the entire balance is locked or the wallet is empty."
          ],
          [
            "400",
            "`FUNDS_LOCKED`",
            "Wallet-level: `requested > available`. `details` includes the lock breakdown."
          ],
          [
            "400",
            "`INSUFFICIENT_BALANCE`",
            "Wallet-level: `requested > chainBalance`."
          ],
          [
            "400",
            "`NOTHING_TO_WITHDRAW`",
            "Order-level: no order-owned funds remain."
          ],
          [
            "400",
            "`ALREADY_WITHDRAWN`",
            "Order-level: a prior withdrawal already completed, including the auto-return on a failed order or an expired trigger order."
          ],
          [
            "409",
            "`WITHDRAWAL_IN_PROGRESS` / `WITHDRAWAL_IN_FLIGHT`",
            "Finish or abandon the pending withdrawal first."
          ],
          [
            "500",
            "`WITHDRAWAL_BUILD_FAILED`",
            "The cancel succeeded but the withdrawal transaction failed to build. The order is `cancelled`; call `POST /orders/{id}/withdraw` to retry the withdrawal leg."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Server & infrastructure"
      },
      {
        "t": "table",
        "head": [
          "HTTP",
          "Code",
          "Meaning"
        ],
        "rows": [
          [
            "500",
            "`RPC_ERROR`",
            "Couldn't reach Solana (for example on `GET /me/balance`)."
          ],
          [
            "500",
            "`SUBMIT_FAILED` / `CONFIRMATION_FAILED` / `ORDER_FINALIZE_FAILED`",
            "Failure during submit, on-chain confirmation or order finalization. Safe to retry; use idempotency on submit-style calls. `SUBMIT_FAILED` also covers structural problems with a transaction sent to `/orders/confirm`: bad base64, wrong shape, missing signatures."
          ],
          [
            "500",
            "`TX_FAILED`",
            "The submitted transaction didn't confirm on Solana."
          ],
          [
            "500",
            "`INTERNAL_ERROR`",
            "Unexpected server error."
          ],
          [
            "503",
            "`RPC_UNAVAILABLE`",
            "RPC temporarily unavailable. Retry shortly."
          ],
          [
            "503",
            "`PRICE_ORACLE_UNAVAILABLE`",
            "A non-stable input mint couldn't be priced to enforce the minimum notional. Retry shortly."
          ]
        ]
      },
      {
        "t": "h2",
        "text": "Handling strategy"
      },
      {
        "t": "p",
        "text": "`4xx` codes are ones your integration can act on: correct the request, re-onboard, or tell the user. A `409` is a transient race, so back off a few seconds and retry. `5xx` and `503` can be retried as server-side problems; add an `X-Idempotency-Key` to any submit-style POST you retry so that a success whose response you never saw doesn't apply twice. See [Limits & Idempotency](/titan/docs/developer-doc/special-order-types/reference/limits#idempotency)."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Authentication](/titan/docs/developer-doc/special-order-types/reference/authentication): auth and tenancy codes, in context",
          "[Creating Orders](/titan/docs/developer-doc/special-order-types/guides/creating-orders): how to handle errors at the intent and confirm steps",
          "[Managing Orders](/titan/docs/developer-doc/special-order-types/guides/managing-orders): errors from pause, resume, cancel and retry"
        ]
      }
    ],
    "lead": "Every error code, grouped by category, with what triggers it and how to handle it."
  }
};
