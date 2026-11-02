import type { DocContent } from "../schema";

const D = "/titan/docs/developer-doc";
const P = `${D}/developers-portal`;
const R = `${P}/reference`;
const S = `${D}/swap-api`;

/** Page bodies for this section, keyed by slug. Own words; facts exact. */
export const PAGES: Record<string, DocContent> = {
  "developers-portal/reference/quote-swap": {
    lead: "Query parameters and response fields for GET /api/v1/quote/swap.",
    blocks: [
      { t: "p", text: "Gives back one or more swap routes, ready to execute, for a token pair and an amount." },
      { t: "code", code: "GET https://portal.api.titan.exchange/api/v1/quote/swap" },
      {
        t: "table",
        head: ["Header", "Value"],
        rows: [
          ["`x-api-key`", "Your API key. Required."],
          ["`Accept`", "`application/json` or `application/vnd.msgpack`. MessagePack is used if you leave it out."],
        ],
      },
      { t: "h2", text: "Query parameters" },
      { t: "p", text: `All parameters are plain query-string values: lists use commas, booleans are \`true\` or \`false\`, and public keys are base58 strings. A bound described as server-defined can be read from [\`/api/v1/info\`](${R}/info-venues-providers#info).` },
      { t: "h3", text: "Required" },
      {
        t: "table",
        head: ["Parameter", "Type", "Description"],
        rows: [
          ["`inputMint`", "pubkey", "Mint address of the token you are selling."],
          ["`outputMint`", "pubkey", "Mint address of the token you are buying."],
          ["`amount`", "u64", "Amount of `inputMint` in its smallest unit: lamports for SOL, micro-USDC (10⁻⁶) for USDC. Do not scale by decimals."],
          ["`userPublicKey`", "pubkey", "The wallet that will sign and run the swap. Instructions are built around this wallet's token accounts."],
        ],
      },
      { t: "h3", text: "Routing" },
      {
        t: "table",
        head: ["Parameter", "Type", "Default", "Description"],
        rows: [
          ["`slippageBps`", "u16", "`100`", "Largest slippage allowed, in basis points. Bounds are set by the server."],
          ["`numQuotes`", "u8", "`1`", "Most provider quotes to return. The maximum is `10`. If more providers can quote, the worst are dropped."],
          ["`providers`", "list", "all", `Provider IDs to limit quoting to. Valid IDs come from [\`/api/v1/providers\`](${R}/info-venues-providers#providers).`],
          ["`dexes`", "list", "all", `Venue labels to include. Valid labels come from [\`/api/v1/venues\`](${R}/info-venues-providers#venues).`],
          ["`excludeDexes`", "list", "—", "Venue labels to leave out."],
          ["`venueAllowlist`", "list of pubkey", "—", "Pool addresses routing is limited to. This filters single pools, whereas `dexes` filters by label."],
          ["`venueBanlist`", "list of pubkey", "—", "Pool addresses to leave out. Takes priority over `venueAllowlist`."],
          ["`noVoteAccounts`", "bool", "`false`", "Leaves out a set of market-maker venues curated by the server."],
          ["`onlyDirectRoutes`", "bool", "`false`", "Returns only single-hop routes between the two mints."],
        ],
      },
      { t: "callout", tone: "warning", text: `An unknown \`dexes\` label does not produce an error. It limits routing to a venue that matches nothing, which ends in \`404 -7\`. Use labels from [\`/api/v1/venues\`](${R}/info-venues-providers#venues).` },
      { t: "h3", text: "Transaction sizing" },
      {
        t: "table",
        head: ["Parameter", "Type", "Default", "Description"],
        rows: [
          ["`addSizeConstraint`", "bool", "`true`", "Returns only routes that fit inside the transaction size limit."],
          ["`sizeConstraint`", "u32", "`1168`", "Largest transaction size in bytes. It is clamped to the format limit: 1232 for V0, 4096 for V1."],
          ["`accountsLimitTotal`", "u16", "—", "Most accounts a route may reference. Transaction V1 allows at most 64."],
          ["`accountsLimitWritable`", "u16", "`64`", "Most writable accounts a route may reference."],
          ["`transactionTemplate`", "string", "—", `Holds back room for instructions and lookup tables you add after quoting. MessagePack-encoded, then base64. Cannot be combined with the three parameters above. See [Transaction Template](${S}/guides/transaction-template).`],
        ],
      },
      { t: "h3", text: "Transaction" },
      {
        t: "table",
        head: ["Parameter", "Type", "Default", "Description"],
        rows: [
          ["`closeInputTokenAccount`", "bool", "`false`", "Closes the input token account as part of the swap."],
          ["`createOutputTokenAccount`", "bool", "`true`", "Adds an idempotent create-ATA instruction for the output token."],
          ["`outputAccount`", "pubkey", "user's ATA", "Delivers the output to a particular token account."],
          ["`outputWsol`", "bool", "`false`", "Keeps the output as wrapped SOL instead of unwrapping it to native SOL. Only applies when `outputMint` is wSOL. Needs the V3 swap program (default)."],
          ["`payer`", "pubkey", "—", "A separate wallet that covers network fees and rent. It must also sign the transaction. Needs the V3 swap program (default)."],
          ["`positiveSlippageFeeReceiver`", "pubkey", "—", "Token account of `outputMint` that receives the surplus when execution beats the quote, capped at 10 bps of `outAmount`. Needs the V3 swap program (default)."],
          ["`transactionFormat`", "`0` | `1`", "`0`", "`0` gives a versioned V0 transaction. `1` picks Transaction V1, which needs cluster support and the V3 swap program (default)."],
          ["`titanSwapVersion`", "`2` | `3`", "`3`", `\`2\` picks the earlier V2 swap program. See [Swap V2 vs Swap V3](${S}/guides/swap-v2-vs-v3).`],
        ],
      },
      { t: "h3", text: "Performance" },
      {
        t: "table",
        head: ["Parameter", "Type", "Default", "Description"],
        rows: [
          ["`simulate`", "bool", "`true`", "Simulates each route against current chain state before returning it, which tightens realized slippage. `false` skips this and lowers latency, but loses the pre-flight check."],
          ["`maxPriceDeviationBps`", "u16", "`1000`", "Rejects quotes that stray from the reference price by more than this many basis points. `10000` or more switches the check off. The check lets quotes through when reference prices are unavailable."],
        ],
      },
      { t: "h3", text: "Response options" },
      {
        t: "table",
        head: ["Parameter", "Type", "Default", "Description"],
        rows: [
          ["`includeAltContents`", "bool", "`false`", "Adds the full contents of every address lookup table the routes use, in a top-level `alts` array."],
        ],
      },
      { t: "h2", text: "Response" },
      {
        t: "table",
        head: ["Field", "Type", "Description"],
        rows: [
          ["`id`", "string", "Identifier of this quote request. Include it when reporting a problem."],
          ["`inputMint`, `outputMint`", "pubkey", "Echo of the request."],
          ["`amount`", "u64", "Echo of the request."],
          ["`quotes`", "map", "One entry for each provider that could quote, keyed by provider ID. Not an array."],
          ["`metadata`", "object", "The recommendation and pricing context."],
          ["`alts`", "array", "Lookup table contents. Only present with `includeAltContents=true`. Each entry is `{ \"p\": <table address>, \"a\": [<addresses>] }`."],
        ],
      },
      { t: "h3", text: "`metadata`", id: "metadata" },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`ExpectedWinner`", "Provider ID of the route Titan recommends, which is the best slippage-adjusted one. Pick this instead of sorting by `outAmount`. Also returned as `expectedWinner` with the same value."],
          ["`inputPriceUSD`, `outputPriceUSD`", "Reference USD prices of the two tokens when the quote was made."],
          ["`inputMintDecimals`, `outputMintDecimals`", "Decimal places of each mint, so you can format amounts without a separate token lookup."],
        ],
      },
      { t: "h3", text: "Route" },
      { t: "p", text: "Each value in `quotes`." },
      {
        t: "table",
        head: ["Field", "Type", "Description"],
        rows: [
          ["`inAmount`", "u64", "Input tokens used, in smallest units."],
          ["`outAmount`", "u64", "Expected output tokens, in smallest units, before slippage."],
          ["`slippageBps`", "u16", "Slippage tolerance the route was built with."],
          ["`steps`", "array of Step", "The hops of the route. Empty when the provider fills directly instead of routing through pools."],
          ["`instructions`", "array of Instruction", "Instructions to execute. Some providers include a compute-budget instruction, so look for the `ComputeBudget111111111111111111111111111111` program before adding your own."],
          ["`addressLookupTables`", "array of pubkey", "Lookup tables the instructions depend on."],
          ["`contextSlot`", "u64", "Slot the route was computed against."],
          ["`computeUnits`", "u64", "Compute units the route is expected to use."],
          ["`computeUnitsSafe`", "u64", "Suggested compute unit limit for the transaction. Differs between providers."],
          ["`expiresAtMs`, `expiresAfterSlot`", "u64", "A hard expiry, when the provider sets one."],
          ["`referenceId`", "string", "Provider-specific reference for this quote. Put it in support requests."],
          ["`timeTakenNs`", "u64", "Time spent computing the route, in nanoseconds, reported by some providers."],
        ],
      },
      { t: "h3", text: "Step" },
      { t: "p", text: "Each entry in `steps`." },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`ammKey`", "Address of the pool or market used at this hop."],
          ["`label`", "Venue name, matching the labels from `/api/v1/venues`."],
          ["`inputMint`, `outputMint`", "Tokens going in and out at this hop."],
          ["`inAmount`, `outAmount`", "Amounts at this hop."],
          ["`allocPpb`", "Share of the order that goes through this hop, in parts per billion. `1000000000` is the whole order. Split routes have several steps whose values add up to `1000000000`."],
          ["`feeMint`, `feeAmount`", "The venue fee, when reported."],
          ["`contextSlot`", "Slot the pool state was read at."],
        ],
      },
      { t: "h3", text: "Instruction" },
      { t: "p", text: "Instructions use short field names." },
      {
        t: "code",
        lang: "json",
        code: `{\n  "p": "T1TANpTeScyeqVzzgNViGDNrkQ6qHz9KrSBS4aNXvGT",\n  "a": [ { "p": "8AdYBZcRixYVacvhGG2PBNruyoWfmagR6aiBUq6qE1nf", "s": true, "w": true } ],\n  "d": "KgIAypo7AAAAADe2AQYAAAAAZAACAAAUBAAAAA0A"\n}`,
      },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`p`", "Program ID."],
          ["`a`", "Accounts, in order. Each has `p` (address), `s` (is signer) and `w` (is writable)."],
          ["`d`", "Instruction data: base64 in JSON, raw bytes in MessagePack."],
        ],
      },
      { t: "h2", text: "Example" },
      {
        t: "code",
        lang: "bash",
        code: `curl "https://portal.api.titan.exchange/api/v1/quote/swap?\\\ninputMint=So11111111111111111111111111111111111111112&\\\noutputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&\\\namount=1000000000&\\\nuserPublicKey=8AdYBZcRixYVacvhGG2PBNruyoWfmagR6aiBUq6qE1nf&\\\nslippageBps=50&\\\nnumQuotes=5&\\\nincludeAltContents=true" \\\n  -H "x-api-key: $TITAN_API_KEY" \\\n  -H "Accept: application/json"`,
      },
      { t: "p", text: `The [Quickstart](${P}/quickstart) has a full response and the code that turns it into a signed transaction.` },
      { t: "h2", text: "Errors" },
      {
        t: "table",
        head: ["Status", "Body", "Meaning"],
        rows: [
          ["`400`", "Plain text naming the field", "A parameter is missing or malformed."],
          ["`400`", "JSON with an engine `code`", "A parameter falls outside the bounds published by `/api/v1/info`."],
          ["`401`", "`{\"error\":{\"code\":\"invalid_api_key\"}}`", "The key is missing, unknown or revoked."],
          ["`404`", "JSON with `code: -7`", "No provider could build a route. `metadata.errors` lists one reason per provider."],
          ["`429`", "`{\"error\":{\"code\":...}}`", "The plan rate limit or credit allowance was exceeded."],
        ],
      },
      { t: "p", text: `The complete list is on [Errors](${P}/errors).` },
    ],
  },

  "developers-portal/reference/info-venues-providers": {
    lead: "Protocol version, parameter bounds, venue labels and provider IDs.",
    blocks: [
      { t: "p", text: "Use these three discovery endpoints to look up parameter bounds, venue labels and provider IDs. Fetch them when your app boots rather than hard-coding the values." },
      { t: "h2", text: "Info" },
      { t: "code", code: "GET https://portal.api.titan.exchange/api/v1/info" },
      { t: "p", text: "Returns the protocol version along with the current defaults and bounds for request parameters. It takes no parameters." },
      {
        t: "code",
        lang: "json",
        code: `{\n  "protocolVersion": { "major": 1, "minor": 9, "patch": 0 },\n  "settings": {\n    "quoteUpdate": {\n      "intervalMs": { "min": 400, "max": 3600000, "default": 800 },\n      "numQuotes":  { "min": 1,   "max": 10,      "default": 1 }\n    },\n    "swap": {\n      "slippageBps": { "min": 0, "max": 10000, "default": 100 },\n      "onlyDirectRoutes": false,\n      "addSizeConstraint": true,\n      "sizeConstraint": 1168\n    },\n    "transaction": {\n      "closeInputTokenAccount": false,\n      "createOutputTokenAccount": true\n    },\n    "connection": { "concurrentStreams": 1 }\n  }\n}`,
      },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`protocolVersion`", "`major` goes up for backward-incompatible changes and `minor` for additive ones."],
          ["`settings.*`", `Any entry with \`min\`, \`max\` and \`default\` gives the accepted range for the [Quote Swap](${R}/quote-swap) parameter with the same name.`],
        ],
      },
      { t: "p", text: "`quoteUpdate.intervalMs` and `connection.concurrentStreams` describe Titan Direct streaming settings and have no effect on Portal requests." },
      { t: "h2", text: "Venues" },
      { t: "code", code: "GET https://portal.api.titan.exchange/api/v1/venues" },
      { t: "p", text: "Returns all on-chain venues that routes may be assembled from. Any label can be passed to the `dexes` and `excludeDexes` parameters." },
      {
        t: "table",
        head: ["Parameter", "Type", "Default", "Description"],
        rows: [["`includeProgramIds`", "bool", "`false`", "Also returns the program ID of each venue."]],
      },
      {
        t: "code",
        lang: "json",
        code: `{\n  "labels":     [ "Raydium", "Whirlpool", "Phoenix", "Meteora", "PancakeSwap", ... ],\n  "programIds": [ "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", ... ]\n}`,
      },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`labels`", "Venue labels."],
          ["`programIds`", "Program ID of each venue, in the same order as `labels`. Only present when `includeProgramIds=true`."],
        ],
      },
      { t: "callout", tone: "warning", text: "The order of labels changes between requests. Pair `labels[i]` with `programIds[i]` inside a single response, and never store positions." },
      { t: "h2", text: "Providers" },
      { t: "code", code: "GET https://portal.api.titan.exchange/api/v1/providers" },
      { t: "p", text: "Returns the quote providers available on the Portal: `Titan` and `Titan-DART`. An `id` can be given in the `providers` parameter, and it doubles as the key in a quote's `quotes` map and in `metadata.ExpectedWinner`." },
      {
        t: "table",
        head: ["Parameter", "Type", "Default", "Description"],
        rows: [["`includeIcons`", "bool", "`false`", "Adds a 48×48 icon for each provider as a data URI in `iconUri48`."]],
      },
      {
        t: "code",
        lang: "json",
        code: `[\n  { "id": "Titan",      "name": "Titan",      "kind": "DexAggregator" },\n  { "id": "Titan-DART", "name": "titan_dart", "kind": "DexAggregator" }\n]`,
      },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`id`", "Provider ID. Use it in the `providers` parameter and when reading `quotes`."],
          ["`name`", "Display name, which can differ from `id`."],
          ["`kind`", "Provider category."],
          ["`iconUri48`", "Data URI of a 48×48 icon. Only present when `includeIcons=true`."],
        ],
      },
    ],
  },

  "swap-api/guides/stream-and-execute": {
    "lead": "Connect to Titan Direct, stream live quotes, and execute a swap end to end.",
    "blocks": [
      {
        "t": "p",
        "text": "This guide is about **Titan Direct**, the WebSocket route. If you would rather make one request through Titan Gateway, read the [Quickstart](/titan/docs/developer-doc/swap-api/quickstart). For self-serve REST with an API key, use the [Developers Portal Quickstart](/titan/docs/developer-doc/developers-portal/quickstart)."
      },
      {
        "t": "p",
        "text": "It follows the whole lifecycle: connecting over WebSocket, streaming live quotes, choosing the best one, building and signing a transaction, and closing down cleanly. The code talks to the raw WebSocket and MessagePack directly. For a higher-level interface, look at the [@titanexchange/sdk-ts](/titan/docs/developer-doc/resources/sdk) SDK."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "Before you begin you need a distributor JWT and an endpoint URL. If you don't have them, see [Get API Access](/titan/docs/developer-doc/getting-started/api-access)."
      },
      {
        "t": "h2",
        "text": "Prerequisites"
      },
      {
        "t": "code",
        "lang": "bash",
        "code": "npm install ws @msgpack/msgpack bs58 @solana/web3.js http-encoding"
      },
      {
        "t": "p",
        "text": "Set these environment variables:"
      },
      {
        "t": "code",
        "lang": "bash",
        "code": "export TITAN_ENDPOINT=\"wss://YOUR_ENDPOINT/api/v1/ws\"\nexport TITAN_JWT=\"YOUR_JWT\"\nexport SOLANA_RPC_URL=\"https://YOUR_RPC_ENDPOINT\""
      },
      {
        "t": "h3",
        "text": "Connect and negotiate the protocol"
      },
      {
        "t": "p",
        "text": "Titan Direct sends [MessagePack](/titan/docs/developer-doc/swap-api/reference/wire-protocol) over WebSocket. Put the compression schemes you support in the [`Sec-WebSocket-Protocol`](/titan/docs/developer-doc/swap-api/reference/direct/connection) header; the server chooses the best match and reports it when the connection opens."
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "import WebSocket from 'ws';\nimport { Encoder, Decoder } from '@msgpack/msgpack';\nimport bs58 from 'bs58';\nimport {\n  zstdCompress, zstdDecompress,\n  brotliCompress, brotliDecompress,\n  gzipCompress, gzipDecompress,\n} from 'http-encoding';\n\n// useBigInt64 ensures amounts encode as int64, not float64\nconst encoder = new Encoder({ useBigInt64: true });\nconst decoder = new Decoder({ useBigInt64: true });\n\n// Build the WebSocket URL with auth token as query param\nconst url = `${process.env.TITAN_ENDPOINT}?auth=${process.env.TITAN_JWT}`;\n\n// List supported protocols in preference order — server picks the best match\n// zstd gives the best compression ratio, fallback to brotli, gzip, or none\nconst ws = new WebSocket(url, [\n  'v1.api.titan.ag+zstd',    // preferred — best ratio + speed\n  'v1.api.titan.ag+brotli',  // fallback\n  'v1.api.titan.ag+gzip',    // fallback\n  'v1.api.titan.ag',          // no compression\n]);\n\n// Compress/decompress default to identity (no-op) — overwritten on open\nlet compress: (data: Uint8Array) => Promise<Uint8Array> | Uint8Array = (d) => d;\nlet decompress: (data: Uint8Array) => Promise<Uint8Array> | Uint8Array = (d) => d;\nlet requestId = 0;\n\nws.on('open', () => {\n  // The server confirms which protocol it selected via ws.protocol\n  const proto = ws.protocol;\n  console.log('Connected — protocol:', proto);\n\n  // Match the negotiated protocol to the correct codec\n  if (proto.endsWith('+zstd')) {\n    compress = zstdCompress;\n    decompress = zstdDecompress;\n  } else if (proto.endsWith('+brotli')) {\n    compress = brotliCompress;\n    decompress = brotliDecompress;\n  } else if (proto.endsWith('+gzip')) {\n    compress = gzipCompress;\n    decompress = gzipDecompress;\n  }\n  // If none matched, no compression — identity functions stay in place\n});\n\n// Encode a request as MessagePack, compress, and send\nasync function sendRequest(data: Record<string, unknown>): Promise<number> {\n  const id = requestId++;\n  const encoded = encoder.encode({ id, data });\n  ws.send(await compress(encoded));\n  return id;\n}\n\n// Decompress an incoming binary frame and decode from MessagePack\nasync function decodeMessage(raw: Buffer): Promise<any> {\n  const data = await decompress(raw);\n  return decoder.decode(data);\n}\n\nws.on('error', (err) => {\n  console.error('WebSocket error:', err.message);\n});"
      },
      {
        "t": "h3",
        "text": "Call GetInfo"
      },
      {
        "t": "p",
        "text": "Send [`GetInfo`](/titan/docs/developer-doc/swap-api/reference/direct/get-info) as soon as you are connected. This verifies the connection and reveals the defaults the server currently uses: the update interval, slippage bounds and stream limits."
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "ws.on('open', () => {\n  sendRequest({ GetInfo: {} });\n});\n\nws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Response' in msg && 'GetInfo' in msg.Response.data) {\n    const info = msg.Response.data.GetInfo;\n    console.log('Protocol version:', info.protocolVersion);\n    console.log('Default update interval:', info.settings.quoteUpdate.intervalMs.default, 'ms');\n  }\n});"
      },
      {
        "t": "h3",
        "text": "Open a quote stream"
      },
      {
        "t": "p",
        "text": "Send [`NewSwapQuoteStream`](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) to start receiving live quotes. `swap` describes what should be quoted, while `transaction` provides the wallet details required to build executable instructions."
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "const SOL  = bs58.decode('So11111111111111111111111111111111111111112');\nconst USDC = bs58.decode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\nconst userPublicKey = bs58.decode('YOUR_WALLET_PUBLIC_KEY');\n\nsendRequest({\n  NewSwapQuoteStream: {\n    swap: {\n      inputMint: SOL,\n      outputMint: USDC,\n      amount: 1_000_000_000n, // 1 SOL in lamports\n      slippageBps: 50,\n    },\n    transaction: {\n      userPublicKey,\n    },\n  },\n});"
      },
      {
        "t": "p",
        "text": "The server replies with a `stream.id`. Keep it so you can stop the stream later."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Use a `BigInt` for `amount`. In MessagePack, numbers above 2^32 are encoded as float64, which the server refuses."
      },
      {
        "t": "h3",
        "text": "Read quotes and pick the best"
      },
      {
        "t": "p",
        "text": "The server pushes [`StreamData`](/titan/docs/developer-doc/swap-api/reference/types) messages at the negotiated interval. Every update carries `metadata.ExpectedWinner`, which is **Titan's recommendation for the best slippage-adjusted route.**"
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "let streamId: number | undefined;\n\nws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Response' in msg && 'NewSwapQuoteStream' in msg.Response.data) {\n    streamId = msg.Response.stream.id;\n    console.log(`Stream ${streamId} open`);\n    return;\n  }\n\n  if ('StreamData' in msg) {\n    const swapQuotes = msg.StreamData.payload.SwapQuotes;\n\n    // Use metadata.ExpectedWinner for the best slippage-adjusted route\n    const winner = swapQuotes.metadata?.ExpectedWinner;\n    const bestRoute = winner && swapQuotes.quotes[winner];\n\n    if (bestRoute?.instructions?.length) {\n      console.log(`Best: ${winner} — ${bestRoute.outAmount} out`);\n    }\n  }\n});"
      },
      {
        "t": "h3",
        "text": "Build, sign, and send"
      },
      {
        "t": "p",
        "text": "Each quote has `instructions` and `addressLookupTables`, part of the [`SwapRoute`](/titan/docs/developer-doc/swap-api/reference/types) type. Fetch the lookup table accounts, compile a V0 message, sign it and send it."
      },
      {
        "t": "p",
        "text": "Take the compute budget from `computeUnitsSafe`. It allows for on-chain variance, so the transaction still lands when a slot turns out slightly heavier."
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "import {\n  Connection,\n  VersionedTransaction,\n  TransactionMessage,\n  AddressLookupTableAccount,\n  TransactionInstruction,\n  PublicKey,\n} from '@solana/web3.js';\n\nconst connection = new Connection(process.env.SOLANA_RPC_URL!);\n\nfunction toSolanaInstruction(ix: any): TransactionInstruction {\n  return new TransactionInstruction({\n    programId: new PublicKey(ix.p),\n    keys: ix.a.map((acc: any) => ({\n      pubkey: new PublicKey(acc.p),\n      isSigner: acc.s,\n      isWritable: acc.w,\n    })),\n    data: Buffer.from(ix.d),\n  });\n}\n\nasync function executeQuote(route: any): Promise<void> {\n  const altAccounts: AddressLookupTableAccount[] = [];\n  for (const altPubkey of (route.addressLookupTables ?? [])) {\n    const { value } = await connection.getAddressLookupTable(new PublicKey(altPubkey));\n    if (value) altAccounts.push(value);\n  }\n\n  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();\n\n  const message = new TransactionMessage({\n    payerKey: new PublicKey(userPublicKey),\n    recentBlockhash: blockhash,\n    instructions: route.instructions.map(toSolanaInstruction),\n  }).compileToV0Message(altAccounts);\n\n  const tx = new VersionedTransaction(message);\n\n  // Sign the transaction — use your wallet adapter or Keypair\n  // Client-side:  const signed = await signTransaction(tx);\n  // Server-side:  tx.sign([keypair]);\n\n  try {\n    const sig = await connection.sendRawTransaction(tx.serialize());\n    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });\n    console.log('Confirmed:', sig);\n\n    if (streamId !== undefined) {\n      sendRequest({ StopStream: { id: streamId } });\n    }\n  } catch (err: any) {\n    console.error('Send failed:', err.message);\n  }\n}"
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "A route can expire. `expiresAtMs` holds the expiry as a UNIX timestamp in milliseconds, and `expiresAfterSlot` holds the last slot in which the route is valid. When they are present, check them before executing, because the route may be out of date by the time your transaction lands."
      },
      {
        "t": "h3",
        "text": "Stop the stream"
      },
      {
        "t": "p",
        "text": "When you have executed, send [`StopStream`](/titan/docs/developer-doc/swap-api/reference/direct/stop-stream) so the connection is free for other streams."
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "sendRequest({ StopStream: { id: streamId! } });"
      },
      {
        "t": "h3",
        "text": "Handle StreamEnd and errors"
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "ws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Error' in msg) {\n    console.error(`Request ${msg.Error.requestId} failed [${msg.Error.code}]: ${msg.Error.message}`);\n  }\n\n  if ('StreamEnd' in msg) {\n    const { id, errorCode, errorMessage } = msg.StreamEnd;\n    if (errorCode) {\n      console.error(`Stream ${id} error ${errorCode}: ${errorMessage}`);\n    } else {\n      console.log(`Stream ${id} closed`);\n    }\n    ws.close();\n  }\n});"
      },
      {
        "t": "p",
        "text": "Reconnect patterns are in [Error Handling & Reconnect](/titan/docs/developer-doc/swap-api/guides/error-handling)."
      },
      {
        "t": "divider"
      },
      {
        "t": "h2",
        "text": "Key details"
      },
      {
        "t": "list",
        "items": [
          "**`quotes` shape**: a `Record<string, SwapRoute>` indexed by provider ID rather than an array.",
          "**Transaction building**: assemble a V0 transaction from `instructions` plus `addressLookupTables`.",
          "**Compute budget**: use `computeUnitsSafe`, which allows for on-chain variance.",
          "**Quote expiry**: when a route expires, `expiresAtMs` and `expiresAfterSlot` are set. Check them before executing."
        ]
      },
      {
        "t": "divider"
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing): narrow venues and providers",
          "[Error Handling & Reconnect](/titan/docs/developer-doc/swap-api/guides/error-handling): the codes, and how to reconnect",
          "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol): how MessagePack and compression work",
          "[Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection): the negotiation handshake explained",
          "[Types Reference](/titan/docs/developer-doc/swap-api/reference/types): `SwapRoute`, `StreamData` and every other type",
          "[NewSwapQuoteStream Reference](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream)",
          "[CPI Example (Anchor)](https://github.com/Titan-Pathfinder/titan-v2-cpi-example): an Anchor program that makes a cross-program invocation into Titan's `swap_route_v2` instruction"
        ]
      }
    ]
  },

  "swap-api/guides/configure-routing": {
    "lead": "Control which venues, providers and route shapes Titan uses when it computes swap quotes.",
    "blocks": [
      {
        "t": "p",
        "text": "By default Titan routes through [Argos](/titan/docs/developer-doc/getting-started/introduction) across every available venue and provider. The parameters below narrow or filter that routing. All of them go in the `swap` or `transaction` object of your request."
      },
      {
        "t": "h2",
        "text": "Routing parameters"
      },
      {
        "t": "p",
        "text": "These fields belong to [`SwapParams`](/titan/docs/developer-doc/swap-api/reference/types):"
      },
      {
        "t": "list",
        "items": [
          "**`dexes`** (`string[]`): route only through these venues. Venues are on-chain liquidity sources such as Raydium, Phoenix, Meteora, Orca, Whirlpool and PumpFun.",
          "**`excludeDexes`** (`string[]`): keep these venues out of routing. Every other venue stays available.",
          "**`venueAllowlist`** (`Pubkey[]`): limit quotes to routes whose venues (pools) all have an **address** in this list. It filters by the address of each venue, whereas `dexes` and `excludeDexes` filter by label.",
          "**`venueBanlist`** (`Pubkey[]`): discard every route that touches a venue (pool) with an address on this list. The banlist takes priority over `venueAllowlist`, so a venue that appears on both is always excluded.",
          "**`noVoteAccounts`** (`bool`): leave out a set of market-maker venues configured on the server. When absent or false, those venues are included as usual.",
          "**`providers`** (`string[]`): restrict quoting to these providers. Providers are the sources that compete for the best price, for example `Titan`, `Metis` and `Okx`.",
          "**`onlyDirectRoutes`** (`bool`): excludes multi-hop routes. Useful for predictable gas costs, or if you want to steer clear of intricate route shapes.",
          "**`addSizeConstraint`** (`bool`): when true, only quotes whose transactions fit the size constraint are returned.",
          "**`sizeConstraint`** (`u32`): the maximum transaction size in bytes, applied when `addSizeConstraint` is set. Anything above the limit of the requested format is clamped to it: 1232 bytes for V0 and 4096 bytes for V1.",
          "**`accountsLimitTotal`** (`u16`): most accounts in total per route. Transaction V1 supports at most 64 addresses, and larger values are clamped.",
          "**`accountsLimitWritable`** (`u16`): most writable accounts per route. If unset, any number that still gives an executable transaction is allowed (currently 64)."
        ]
      },
      {
        "t": "p",
        "text": "Choose the transaction format with `transaction.transactionFormat`: `0` for V0 (the default) or `1` for Transaction V1. Compatibility and activation requirements are in [NewSwapQuoteStream → Transaction format](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#transaction-format)."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "Providers and venues filter different things. A provider determines *who computes* the route, and a venue determines *where the liquidity comes from*. The two can be combined."
      },
      {
        "t": "h2",
        "text": "Example: combining multiple filters"
      },
      {
        "t": "codeTabs",
        "tabs": [
          {
            "label": "Titan Direct",
            "code": "import WebSocket from 'ws';\nimport { Encoder } from '@msgpack/msgpack';\nimport bs58 from 'bs58';\nimport { zstdCompress } from 'http-encoding';\n\nconst encoder = new Encoder({ useBigInt64: true });\n\nconst url = `${process.env.TITAN_ENDPOINT}?auth=${process.env.TITAN_JWT}`;\nconst ws = new WebSocket(url, [\n  'v1.api.titan.ag+zstd',\n  'v1.api.titan.ag',\n]);\n\nlet useCompression = false;\nlet requestId = 0;\n\nws.on('open', async () => {\n  useCompression = ws.protocol !== 'v1.api.titan.ag';\n\n  const encoded = encoder.encode({\n    id: requestId++,\n    data: {\n      NewSwapQuoteStream: {\n        swap: {\n          inputMint: bs58.decode('So11111111111111111111111111111111111111112'),\n          outputMint: bs58.decode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),\n          amount: 1_000_000_000n,\n          slippageBps: 50,\n          dexes: ['Raydium', 'Whirlpool', 'Phoenix'],  // Only these venues\n          providers: ['Titan', 'Metis'],                 // Only these providers\n          onlyDirectRoutes: true,                        // No multi-hop\n          addSizeConstraint: true,\n          accountsLimitTotal: 40,\n        },\n        transaction: {\n          userPublicKey: bs58.decode('YOUR_WALLET_PUBLIC_KEY'),\n        },\n      },\n    },\n  });\n  ws.send(useCompression ? await zstdCompress(encoded) : encoded);\n});"
          },
          {
            "label": "Titan Gateway",
            "code": "import { decode } from '@msgpack/msgpack';\n\nconst params = new URLSearchParams({\n  inputMint: 'So11111111111111111111111111111111111111112',\n  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',\n  amount: '1000000000',\n  userPublicKey: 'YOUR_WALLET_PUBLIC_KEY',\n  slippageBps: '50',\n  dexes: 'Raydium,Whirlpool,Phoenix',\n  providers: 'Titan,Metis',\n  onlyDirectRoutes: 'true',\n  addSizeConstraint: 'true',\n  accountsLimitTotal: '40',\n});\n\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/quote/swap?${params}`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\n\nconst buffer = await res.arrayBuffer();\nconst quotes = decode(new Uint8Array(buffer)) as any;"
          }
        ]
      },
      {
        "t": "h2",
        "text": "List available venues and providers"
      },
      {
        "t": "p",
        "text": "Ask the server at runtime which venues and providers are active right now."
      },
      {
        "t": "codeTabs",
        "tabs": [
          {
            "label": "Titan Direct",
            "code": "// List all venues with their program IDs\nsendRequest({ GetVenues: { includeProgramIds: true } });\n\n// List all active providers\nsendRequest({ ListProviders: {} });"
          },
          {
            "label": "Titan Gateway",
            "code": "import { decode } from '@msgpack/msgpack';\n\nconst venuesRes = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/venues?includeProgramIds=true`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\nconst venues = decode(new Uint8Array(await venuesRes.arrayBuffer())) as any;\nconsole.log('Available venues:', venues.labels);\n\nconst providersRes = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/providers`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\nconst providers = decode(new Uint8Array(await providersRes.arrayBuffer())) as any[];\nconsole.log('Active providers:', providers.map((p: any) => p.id));"
          }
        ]
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Stream & Execute a Swap](/titan/docs/developer-doc/swap-api/guides/stream-and-execute): the complete walkthrough, including building transactions and handling errors",
          "[Fee Collection](/titan/docs/developer-doc/swap-api/guides/fee-collection): include platform fees in swap transactions",
          "[Types Reference](/titan/docs/developer-doc/swap-api/reference/types): `SwapParams`, `TransactionParams` and all remaining types",
          "[GetVenues / ListProviders Reference](/titan/docs/developer-doc/swap-api/reference/direct/venues-providers): complete response schemas"
        ]
      }
    ]
  },

  "swap-api/guides/fee-collection": {
    "lead": "Take a fee on every swap by giving a fee account and a basis-point rate in your request.",
    "blocks": [
      {
        "t": "p",
        "text": "If you build a product on top of Titan, you can charge a fee on each swap. The fee is deducted from the swap output (or input) and paid into a token account you control."
      },
      {
        "t": "h2",
        "text": "How fees work"
      },
      {
        "t": "p",
        "text": "By default the fee comes out of the **output token**. To take it from the input side instead, set `feeFromInputMint: true`."
      },
      {
        "t": "p",
        "text": "Your fee account has to be a token account for the right mint: the output mint by default, or the input mint when `feeFromInputMint` is true. The account must already exist, or you have to add the ATA creation instruction yourself."
      },
      {
        "t": "p",
        "text": "While fees are active, every [`SwapRoute`](/titan/docs/developer-doc/swap-api/reference/types) in the quote response has a `platformFee` field giving the exact fee amount and rate. Display it to users ahead of signing."
      },
      {
        "t": "p",
        "text": "These fields belong to [`TransactionParams`](/titan/docs/developer-doc/swap-api/reference/types):"
      },
      {
        "t": "list",
        "items": [
          "**`feeAccount`** (`Pubkey`): the ATA that the fee is paid into. Either it already exists on-chain or you have to include the instruction that creates it.",
          "**`feeBps`** (`u16`): the fee rate in basis points (1 bps = 0.01%), up to `10000` (100%). Omit it and your account's default fee is used.",
          "**`feeFromInputMint`** (`bool`): when `true`, the fee is taken from the input mint. Defaults to `false`."
        ]
      },
      {
        "t": "h2",
        "text": "Collect fees on output token (default)"
      },
      {
        "t": "p",
        "text": "Before the first request, create an ATA for the output mint; after that, include `feeAccount` and `feeBps` in your transaction parameters."
      },
      {
        "t": "codeTabs",
        "tabs": [
          {
            "label": "Titan Direct",
            "code": "import WebSocket from 'ws';\nimport { Encoder, Decoder } from '@msgpack/msgpack';\nimport bs58 from 'bs58';\nimport { zstdCompress, zstdDecompress } from 'http-encoding';\n\nconst encoder = new Encoder({ useBigInt64: true });\nconst decoder = new Decoder({ useBigInt64: true });\n\nconst url = `${process.env.TITAN_ENDPOINT}?auth=${process.env.TITAN_JWT}`;\nconst ws = new WebSocket(url, [\n  'v1.api.titan.ag+zstd',\n  'v1.api.titan.ag',\n]);\n\nconst SOL  = bs58.decode('So11111111111111111111111111111111111111112');\nconst USDC = bs58.decode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\nconst userPublicKey = bs58.decode('YOUR_WALLET_PUBLIC_KEY');\n\n// Your ATA for the output mint (USDC in this case)\nconst feeAccount = bs58.decode('YOUR_USDC_FEE_ATA');\n\nlet useCompression = false;\nlet requestId = 0;\n\nws.on('open', async () => {\n  useCompression = ws.protocol !== 'v1.api.titan.ag';\n\n  const id = requestId++;\n  const encoded = encoder.encode({\n    id,\n    data: {\n      NewSwapQuoteStream: {\n        swap: {\n          inputMint: SOL,\n          outputMint: USDC,\n          amount: 1_000_000_000n, // 1 SOL\n          slippageBps: 50,\n        },\n        transaction: {\n          userPublicKey,\n          feeAccount,\n          feeBps: 100, // 1% fee\n        },\n      },\n    },\n  });\n  ws.send(useCompression ? await zstdCompress(encoded) : encoded);\n});"
          },
          {
            "label": "Titan Gateway",
            "code": "import { decode } from '@msgpack/msgpack';\n\nconst SOL  = 'So11111111111111111111111111111111111111112';\nconst USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';\n\nconst params = new URLSearchParams({\n  inputMint: SOL,\n  outputMint: USDC,\n  amount: '1000000000',\n  userPublicKey: 'YOUR_WALLET_PUBLIC_KEY',\n  slippageBps: '50',\n  feeAccount: 'YOUR_USDC_FEE_ATA',    // ATA for the output mint\n  feeBps: '100',                        // 1% fee\n});\n\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/quote/swap?${params}`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\n\nconst buffer = await res.arrayBuffer();\nconst quotes = decode(new Uint8Array(buffer)) as any;"
          }
        ]
      },
      {
        "t": "h2",
        "text": "Collect fees on input token"
      },
      {
        "t": "p",
        "text": "Use `feeFromInputMint: true`, and check that the fee account is an ATA for the **input** mint rather than the output mint."
      },
      {
        "t": "codeTabs",
        "tabs": [
          {
            "label": "Titan Direct",
            "code": "import WebSocket from 'ws';\nimport { Encoder, Decoder } from '@msgpack/msgpack';\nimport bs58 from 'bs58';\nimport { zstdCompress, zstdDecompress } from 'http-encoding';\n\nconst encoder = new Encoder({ useBigInt64: true });\nconst decoder = new Decoder({ useBigInt64: true });\n\nconst url = `${process.env.TITAN_ENDPOINT}?auth=${process.env.TITAN_JWT}`;\nconst ws = new WebSocket(url, [\n  'v1.api.titan.ag+zstd',\n  'v1.api.titan.ag',\n]);\n\nconst SOL  = bs58.decode('So11111111111111111111111111111111111111112');\nconst USDC = bs58.decode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\nconst userPublicKey = bs58.decode('YOUR_WALLET_PUBLIC_KEY');\n\n// Fee from input — ATA must be for SOL (wrapped SOL), not USDC\nconst feeAccount = bs58.decode('YOUR_SOL_FEE_ATA');\n\nlet useCompression = false;\nlet requestId = 0;\n\nws.on('open', async () => {\n  useCompression = ws.protocol !== 'v1.api.titan.ag';\n\n  const id = requestId++;\n  const encoded = encoder.encode({\n    id,\n    data: {\n      NewSwapQuoteStream: {\n        swap: {\n          inputMint: SOL,\n          outputMint: USDC,\n          amount: 1_000_000_000n,\n          slippageBps: 50,\n        },\n        transaction: {\n          userPublicKey,\n          feeAccount,\n          feeBps: 50, // 0.5% fee\n          feeFromInputMint: true,\n        },\n      },\n    },\n  });\n  ws.send(useCompression ? await zstdCompress(encoded) : encoded);\n});"
          },
          {
            "label": "Titan Gateway",
            "code": "import { decode } from '@msgpack/msgpack';\n\nconst SOL  = 'So11111111111111111111111111111111111111112';\nconst USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';\n\nconst params = new URLSearchParams({\n  inputMint: SOL,\n  outputMint: USDC,\n  amount: '1000000000',\n  userPublicKey: 'YOUR_WALLET_PUBLIC_KEY',\n  slippageBps: '50',\n  feeAccount: 'YOUR_SOL_FEE_ATA',\n  feeBps: '50',\n  feeFromInputMint: 'true',\n});\n\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/quote/swap?${params}`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\n\nconst buffer = await res.arrayBuffer();\nconst quotes = decode(new Uint8Array(buffer)) as any;"
          }
        ]
      },
      {
        "t": "h2",
        "text": "Read the fee from quote response"
      },
      {
        "t": "p",
        "text": "Each [`SwapRoute`](/titan/docs/developer-doc/swap-api/reference/types) that includes a fee has a `platformFee` object. Look at it before your user signs, since this is what your UI should display."
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "// Use metadata.ExpectedWinner for the best slippage-adjusted route\nconst best = quotes.quotes[quotes.metadata?.ExpectedWinner];\n\nif (best.platformFee) {\n  const feeAmount = BigInt(best.platformFee.amount);\n  const fee_bps = best.platformFee.fee_bps;\n\n  console.log(`Platform fee: ${feeAmount} tokens (${fee_bps} bps)`);\n  // Example: \"Platform fee: 1428570 tokens (100 bps)\"\n}\n\n// Show the fee to your user before they sign\nconsole.log(`Output after fee: ${best.outAmount}`);"
      },
      {
        "t": "p",
        "text": "The [`PlatformFee`](/titan/docs/developer-doc/swap-api/reference/types) type:"
      },
      {
        "t": "list",
        "items": [
          "**`amount`** (`u64`): the fee in absolute terms, in the token's smallest unit.",
          "**`fee_bps`** (`u8`): the fee rate in basis points."
        ]
      },
      {
        "t": "h2",
        "text": "Important notes"
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Only validated users may set a `feeAccount`. Contact the Titan team to have your account approved for fee collection."
      },
      {
        "t": "p",
        "text": "`feeBps` takes values from `0` to `10000` (100%). Anything higher is rejected, and no quotes come back. Every account tier has the same limit, whatever its validation status."
      },
      {
        "t": "p",
        "text": "The fee is **deducted from** the swap amount instead of being added to it. Say a user swaps 1 SOL with a 1% fee: with `feeFromInputMint` true they get the output for 0.99 SOL of input, and with the fee on the output side (the default) they get 1% less output."
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Stream & Execute a Swap](/titan/docs/developer-doc/swap-api/guides/stream-and-execute): the complete walkthrough, including building and signing transactions and handling errors",
          "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing): narrow venues and providers",
          "[Types Reference](/titan/docs/developer-doc/swap-api/reference/types): `SwapRoute`, `PlatformFee`, `TransactionParams` and all remaining types",
          "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol): how MessagePack and compression work"
        ]
      }
    ]
  },

  "swap-api/guides/transaction-template": {
    "lead": "Hold back room in the swap transaction for your own instructions and address lookup tables, so the route Titan returns still fits when you put the final transaction together.",
    "blocks": [
      {
        "t": "p",
        "text": "Swap transactions often need extra instructions that belong to you, such as a compute-budget setting, a memo, a custom fee transfer, an oracle update or an app-specific log. Each byte you add eats into the transaction size limit (1232 bytes for V0, 4096 bytes for Transaction V1), so the route Titan returned might no longer fit."
      },
      {
        "t": "p",
        "text": "`transactionTemplate` solves that. Beforehand, you describe the extra instructions, ALTs and account metas that will share the final transaction with the swap. Titan then chooses a route small enough that the **assembled** transaction remains inside Solana's limits after you combine the pieces."
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "**`transactionTemplate` only affects route sizing.** Titan measures the template while choosing a route but does not send its contents back. Each route holds the swap instructions alone, and you build the final transaction yourself."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "**`transactionTemplate` cannot be combined with `accountsLimitTotal`, `accountsLimitWritable` or `sizeConstraint`.** The template **is** the sizing constraint, so sending both produces an error."
      },
      {
        "t": "h2",
        "text": "When to use it"
      },
      {
        "t": "list",
        "items": [
          "Your transaction carries instructions around the swap that are not part of it (custom fee transfers, memos, oracle pokes, app-specific logs, compute-budget settings).",
          "You use your own ALTs (a rebate program, a fee program, app-specific routing).",
          "Merging the route with your own instructions leads to transaction-size errors."
        ]
      },
      {
        "t": "p",
        "text": "In every other case the default sizing (`accountsLimitTotal` / `accountsLimitWritable`) is enough."
      },
      {
        "t": "h2",
        "text": "Pair with V3"
      },
      {
        "t": "p",
        "text": "**Whenever `transactionTemplate` is in use, set `titanSwapVersion: 3`.** Because V3 manages the input and output token accounts internally, the router adds **no** ATA create/close instructions around the swap, leaving all remaining bytes for the route. Under V2 the router continues to insert wSOL wrap/unwrap and ATA-creation instructions, so a template's effect is harder to predict."
      },
      {
        "t": "callout",
        "tone": "danger",
        "text": "**Send `titanSwapVersion` as the integer `3`; the string `\"V3\"` will not work.** A string is turned away with `Failed to deserialize query string: titanSwapVersion: invalid digit found in string`."
      },
      {
        "t": "h2",
        "text": "The template"
      },
      {
        "t": "p",
        "text": "The full struct is documented under [`TransactionTemplate`](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#transaction-template). It has four fields:"
      },
      {
        "t": "list",
        "items": [
          "**`i`**: the instructions that go into the final transaction **ahead of** the swap. They are measured for sizing but never sent back, so hold on to your own copy for assembly. Include ATA creation or deletion for the input and output mints yourself if you need it, since the template does not assume the router adds it (V3 needs none; V2 may).",
          "**`a`**: the ALTs already used by the rest of the transaction. **Their order matters**, since Solana resolves ALTs greedily; list them in the same order as when you compile the message. For sizing, Titan adds the ALTs the swap requires, yet it does not return that merged list. Instead, the response lists the route's ALT addresses on their own, and the final message is compiled from both sets.",
          "**`m`**: additional account metas that are part of the surrounding transaction yet unreachable from every instruction in `i`. That is uncommon, so keep it empty unless required.",
          "**`c`**: priority fee and compute-budget settings at the transaction level. Needed for Transaction V1, ignored for V0. In Transaction V1 these values sit in the transaction envelope rather than in `ComputeBudgetProgram` instructions."
        ]
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "When `transactionFormat: 1` is used, `c` must be supplied and `a` is disregarded, as Transaction V1 has no address lookup table support."
      },
      {
        "t": "h3",
        "text": "Wire format"
      },
      {
        "t": "p",
        "text": "The MessagePack wire format uses **single-letter field names** to save space."
      },
      {
        "t": "table",
        "head": [
          "Type",
          "Wire field",
          "Meaning"
        ],
        "rows": [
          [
            "`TransactionTemplate`",
            "`i`",
            "`instructions` (array)"
          ],
          [
            "`TransactionTemplate`",
            "`a`",
            "`alts` (array)"
          ],
          [
            "`TransactionTemplate`",
            "`m`",
            "`accountMetas` (array)"
          ],
          [
            "`TransactionTemplate`",
            "`c`",
            "`TransactionConfigParams` (object; required for V1)"
          ],
          [
            "`Instruction`",
            "`p`",
            "`programId` (32-byte pubkey)"
          ],
          [
            "`Instruction`",
            "`a`",
            "`accounts` (array of `AccountMeta`)"
          ],
          [
            "`Instruction`",
            "`d`",
            "`data` (raw bytes)"
          ],
          [
            "`AccountMeta`",
            "`p`",
            "`pubkey` (32-byte pubkey)"
          ],
          [
            "`AccountMeta`",
            "`s`",
            "`isSigner` (bool)"
          ],
          [
            "`AccountMeta`",
            "`w`",
            "`isWritable` (bool)"
          ],
          [
            "`AddressLookupTableAccount`",
            "`p`",
            "`key` (32-byte ALT account address)"
          ],
          [
            "`AddressLookupTableAccount`",
            "`a`",
            "`addresses` (array of 32-byte pubkeys *inside* the ALT, in order)"
          ]
        ]
      },
      {
        "t": "p",
        "text": "**Pubkeys and instruction `data` are always raw byte arrays; Base58 or Base64 strings do not work.**"
      },
      {
        "t": "h2",
        "text": "REST vs WebSocket transport"
      },
      {
        "t": "p",
        "text": "The template has the same shape on both transports, but it is wrapped differently:"
      },
      {
        "t": "list",
        "items": [
          "**REST (Gateway):** encode the template as MessagePack, **Base64-encode the resulting bytes**, and send that as the `transactionTemplate` query-string value.",
          "**WebSocket (Direct):** embed the template **inline** in the `swap` object of the `NewSwapQuoteStream` request. Since the entire frame is MessagePack already, nothing needs Base64."
        ]
      },
      {
        "t": "h2",
        "text": "Example: V3 + compute-budget template"
      },
      {
        "t": "p",
        "text": "A USDC to SOL swap on V3 with a minimal template holding just the two compute-budget instructions. This is the standard real-world pattern."
      },
      {
        "t": "codeTabs",
        "tabs": [
          {
            "label": "Titan Gateway (REST)",
            "code": "import { Encoder, decode } from '@msgpack/msgpack';\nimport bs58 from 'bs58';\nimport {\n  Connection,\n  MessageV0,\n  PublicKey,\n  TransactionInstruction,\n  VersionedTransaction,\n} from '@solana/web3.js';\n\nconst encoder = new Encoder({ useBigInt64: true });\n\n// --- Step 1: build the two compute-budget instructions ---\nconst CB_PROGRAM_ID = new PublicKey('ComputeBudget111111111111111111111111111111');\n\nfunction setComputeUnitLimitData(units: number): Uint8Array {\n  // Discriminator 0x02 + u32 LE\n  const data = new Uint8Array(5);\n  data[0] = 0x02;\n  new DataView(data.buffer).setUint32(1, units, true);\n  return data;\n}\n\nfunction setComputeUnitPriceData(microLamports: bigint): Uint8Array {\n  // Discriminator 0x03 + u64 LE\n  const data = new Uint8Array(9);\n  data[0] = 0x03;\n  new DataView(data.buffer).setBigUint64(1, microLamports, true);\n  return data;\n}\n\n// --- Step 2: assemble the TransactionTemplate using wire-format field names ---\nconst template = {\n  i: [\n    { p: CB_PROGRAM_ID.toBytes(), a: [], d: setComputeUnitLimitData(1_400_000) },\n    { p: CB_PROGRAM_ID.toBytes(), a: [], d: setComputeUnitPriceData(0n) }, // sub real priority fee in prod\n  ],\n  a: [],\n  m: [],\n};\n\n// --- Step 3: MessagePack-encode, then Base64-encode ---\nconst transactionTemplate = Buffer.from(encoder.encode(template)).toString('base64');\n\n// --- Step 4: send the quote request ---\nconst USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';\nconst SOL  = 'So11111111111111111111111111111111111111112';\nconst USER = 'Affd7LDkUY9fjWjjQSr9bvises1Cku4WSwdLNGBhgVW3';\n\nconst params = new URLSearchParams({\n  inputMint: USDC,\n  outputMint: SOL,\n  amount: '100000000',           // 100 USDC\n  userPublicKey: USER,\n  slippageBps: '50',\n  titanSwapVersion: '3',         // integer 3, not \"V3\"\n  simulate: 'false',\n  transactionTemplate,\n});\n\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/quote/swap?${params}`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\n\nconst quotes = decode(new Uint8Array(await res.arrayBuffer())) as any;\nconst winner = quotes.metadata?.ExpectedWinner;\nconst route = winner && quotes.quotes[winner];\n\n// --- Step 5: assemble [templateInstructions, ...routeInstructions] ---\nfunction titanIxToTransactionIx(ix: any): TransactionInstruction {\n  return new TransactionInstruction({\n    programId: new PublicKey(ix.p),\n    data: Buffer.from(ix.d),\n    keys: ix.a.map((a: any) => ({\n      pubkey: new PublicKey(a.p),\n      isSigner: a.s,\n      isWritable: a.w,\n    })),\n  });\n}\n\nconst templateIxs = template.i.map(titanIxToTransactionIx);\nconst swapIxs = route.instructions.map(titanIxToTransactionIx);\nconst allIxs = [...templateIxs, ...swapIxs];\n\n// Compile into a v0 message with the route's ALTs, sign and send"
          },
          {
            "label": "Titan Direct (WebSocket)",
            "code": "import WebSocket from 'ws';\nimport { Encoder, decode } from '@msgpack/msgpack';\nimport { PublicKey } from '@solana/web3.js';\n\nconst encoder = new Encoder({ useBigInt64: true });\n\nconst CB_PROGRAM_ID = new PublicKey('ComputeBudget111111111111111111111111111111');\n\nfunction setComputeUnitLimitData(units: number) {\n  const data = new Uint8Array(5);\n  data[0] = 0x02;\n  new DataView(data.buffer).setUint32(1, units, true);\n  return data;\n}\n\nfunction setComputeUnitPriceData(microLamports: bigint) {\n  const data = new Uint8Array(9);\n  data[0] = 0x03;\n  new DataView(data.buffer).setBigUint64(1, microLamports, true);\n  return data;\n}\n\nconst template = {\n  i: [\n    { p: CB_PROGRAM_ID.toBytes(), a: [], d: setComputeUnitLimitData(1_400_000) },\n    { p: CB_PROGRAM_ID.toBytes(), a: [], d: setComputeUnitPriceData(0n) },\n  ],\n  a: [],\n  m: [],\n};\n\nconst ws = new WebSocket(\n  `${process.env.TITAN_WS_ENDPOINT}/api/v1/ws`,\n  ['v1.api.titan.ag'],\n  { headers: { Authorization: `Bearer ${process.env.TITAN_JWT}` } },\n);\n\nws.on('open', () => {\n  ws.send(encoder.encode({\n    id: 1,\n    data: {\n      NewSwapQuoteStream: {\n        swap: {\n          inputMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v').toBytes(),\n          outputMint: new PublicKey('So11111111111111111111111111111111111111112').toBytes(),\n          amount: 100_000_000n,\n          slippageBps: 50,\n          providers: ['Metis', 'Titan'],\n          transactionTemplate: template,   // inline, no Base64\n        },\n        transaction: {\n          userPublicKey: new PublicKey('Affd7LDkUY9fjWjjQSr9bvises1Cku4WSwdLNGBhgVW3').toBytes(),\n          titanSwapVersion: 3,             // integer 3\n        },\n        update: { intervalMs: 60_000, numQuotes: 1 },\n      },\n    },\n  }));\n});\n\nws.on('message', (raw) => {\n  const msg = decode(raw as Uint8Array) as any;\n  if ('StreamData' in msg && 'SwapQuotes' in msg.StreamData.payload) {\n    const quotes = msg.StreamData.payload.SwapQuotes;\n    const winner = quotes.metadata?.ExpectedWinner;\n    const route = winner && quotes.quotes[winner];\n    // Assemble [template.i, ...route.instructions] as in the REST tab\n  }\n});"
          }
        ]
      },
      {
        "t": "h2",
        "text": "What comes back"
      },
      {
        "t": "p",
        "text": "A template leaves the response shape unchanged. Each route is the same [`SwapRoute`](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#response) object, with `instructions` holding the swap and `addressLookupTables` holding the ALT addresses the router picked. The template influences which route wins, not how the response is structured."
      },
      {
        "t": "p",
        "text": "Assembling the final transaction is your job. Start from the winning route's `instructions`, and place your own around them following the order declared in `i`, which puts yours first and the swap after. `addressLookupTables` gives only keys, not table contents, so fetch every ALT account via `getAddressLookupTable` and compile a v0 message in which your ALT accounts precede the route's, in the order declared in `a`."
      },
      {
        "t": "p",
        "text": "Request a fresh quote whenever your instruction set changes, because a route sized for the earlier template may no longer fit."
      },
      {
        "t": "h2",
        "text": "What changes in the route"
      },
      {
        "t": "p",
        "text": "With no template, Titan sizes routes as if the swap were the sole content of the transaction, within the server defaults (currently 1168 bytes and 64 accounts)."
      },
      {
        "t": "p",
        "text": "When a template is given, Titan **takes the template's footprint off** those budgets prior to picking a route:"
      },
      {
        "t": "list",
        "items": [
          "A template that holds only compute-budget settings (14 bytes, 0 accounts) barely changes routing; V3 routes typically still arrive as a single instruction using the ALTs the router would have chosen anyway.",
          "A larger template (custom program calls, several ALTs, many account metas) nudges the router to shorter routes with fewer hops and venues so there is space. Any provider unable to fit a route in what remains is silently left out of the response.",
          "Should every provider fail to fit a route, Gateway answers 404 and Direct returns an empty `quotes` map."
        ]
      },
      {
        "t": "h2",
        "text": "Pitfalls"
      },
      {
        "t": "list",
        "items": [
          "**Don't combine with `accountsLimitTotal` / `accountsLimitWritable` / `sizeConstraint`.** The template replaces them, and sending both returns 400.",
          "**`titanSwapVersion` is the integer `3`, not the string `\"V3\"`.** Strings are rejected with `invalid digit found in string`.",
          "**Use the wire-format field names.** Long names (`programId`, `accounts` and so on) return `400 Bad Request: missing field 'p'`.",
          "**Place the template instructions BEFORE the route instructions** in the final v0 message. Titan will not do this for you because its response contains just the swap. The template stands for the rest of the transaction, and the swap comes after it.",
          "**ALT order is significant.** Because Solana resolves ALTs greedily, the earliest ALT holding an account is the one used. When one of your ALTs and one of Titan's both hold the same account, their order determines which gets used.",
          "**Binary values go in as bytes, not Base58.** In the MessagePack template, pubkeys and instruction `data` are raw bytes (msgpack `bin`); do not turn them into strings first."
        ]
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[NewSwapQuoteStream → Transaction Template](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#transaction-template): the type definition",
          "[NewSwapQuoteStream → Swap V3](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#swap-v3): what to know about the V3 router",
          "[Quote Swap (Gateway)](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap): the Gateway swap reference",
          "[Stream & Execute a Swap](/titan/docs/developer-doc/swap-api/guides/stream-and-execute): a step-by-step guide to building the transaction",
          "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing): `accountsLimitTotal`, `accountsLimitWritable` and further size controls"
        ]
      }
    ]
  },

  "swap-api/guides/error-handling": {
    "lead": "Deal with server errors, stream failures and dropped connections in Titan Direct integrations.",
    "blocks": [
      {
        "t": "p",
        "text": "Titan Direct relies on a single long-lived WebSocket connection, and connections drop, tokens expire and streams end without warning. This guide walks through each failure mode and how to write a reconnect loop that keeps your integration running."
      },
      {
        "t": "h2",
        "text": "Server messages"
      },
      {
        "t": "p",
        "text": "Every server message is one of four types: `Response`, `Error`, `StreamData` or `StreamEnd`. Full definitions of the types are in the [Types Reference](/titan/docs/developer-doc/swap-api/reference/types)."
      },
      {
        "t": "h2",
        "text": "Server errors"
      },
      {
        "t": "p",
        "text": "If a request fails, the server sends an [`Error`](/titan/docs/developer-doc/swap-api/reference/types) in place of a `Response`. Look for the `Error` key in every message handler:"
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "ws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Error' in msg) {\n    const { code, message, requestId } = msg.Error;\n    console.error(`Request ${requestId} failed — code ${code}: ${message}`);\n    return;\n  }\n});"
      },
      {
        "t": "h2",
        "text": "Stream errors"
      },
      {
        "t": "p",
        "text": "A stream can end abnormally. [`StreamEnd`](/titan/docs/developer-doc/swap-api/reference/types) has an optional `errorCode` and `errorMessage`. When they are present, the stream did not end cleanly:"
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "ws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('StreamEnd' in msg) {\n    const { id, errorCode, errorMessage } = msg.StreamEnd;\n\n    if (errorCode !== undefined) {\n      console.error(`Stream ${id} ended with error ${errorCode}: ${errorMessage}`);\n      // Restart the stream or reconnect\n    } else {\n      console.log(`Stream ${id} ended cleanly`);\n    }\n  }\n});"
      },
      {
        "t": "h2",
        "text": "Connection drops"
      },
      {
        "t": "p",
        "text": "Once the WebSocket closes, all active streams are gone. Listen for the `close` event and start your reconnect logic from it:"
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "ws.on('close', (code: number, reason: Buffer) => {\n  console.warn(`Connection closed — code: ${code}, reason: ${reason.toString()}`);\n\n  if (code !== 1000) {\n    // Abnormal close — reconnect\n    scheduleReconnect();\n  }\n});\n\nws.on('error', (err: Error) => {\n  console.error('WebSocket error:', err.message);\n  // 'close' will fire after this\n});"
      },
      {
        "t": "h2",
        "text": "Token expiry"
      },
      {
        "t": "p",
        "text": "A connection with a JWT whose `exp` claim lies in the past is refused by the server. If you are turned away immediately, check the token is still valid before reconnecting:"
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "function isTokenExpired(token: string): boolean {\n  const [, payload] = token.split('.');\n  const claims = JSON.parse(Buffer.from(payload, 'base64').toString());\n  return Date.now() / 1000 > claims.exp;\n}"
      },
      {
        "t": "p",
        "text": "If the token is close to expiring, refresh it before you call `connect()`."
      },
      {
        "t": "h2",
        "text": "Reconnect with exponential backoff"
      },
      {
        "t": "p",
        "text": "The SDK does not reconnect for you; that is your job. Here is a complete reconnect loop:"
      },
      {
        "t": "code",
        "lang": "typescript",
        "code": "import WebSocket from 'ws';\nimport { Encoder, Decoder } from '@msgpack/msgpack';\nimport bs58 from 'bs58';\nimport { zstdCompress, zstdDecompress } from 'http-encoding';\n\nconst encoder = new Encoder({ useBigInt64: true });\nconst decoder = new Decoder({ useBigInt64: true });\n\nconst BASE_DELAY_MS = 1_000;\nconst MAX_DELAY_MS = 30_000;\n\nlet useCompression = false;\n\nasync function sendRequest(ws: WebSocket, id: number, data: Record<string, unknown>) {\n  const encoded = encoder.encode({ id, data });\n  ws.send(useCompression ? await zstdCompress(encoded) : encoded);\n}\n\nasync function decodeMessage(raw: Buffer): Promise<any> {\n  const data = useCompression ? await zstdDecompress(raw) : raw;\n  return decoder.decode(data);\n}\n\nasync function connect(): Promise<WebSocket> {\n  const url = `${process.env.TITAN_ENDPOINT}?auth=${process.env.TITAN_JWT}`;\n\n  return new Promise((resolve, reject) => {\n    const ws = new WebSocket(url, [\n      'v1.api.titan.ag+zstd',\n      'v1.api.titan.ag',\n    ]);\n\n    ws.once('open', () => {\n      useCompression = ws.protocol !== 'v1.api.titan.ag';\n      resolve(ws);\n    });\n    ws.once('error', reject);\n  });\n}\n\nasync function runWithReconnect() {\n  let attempt = 0;\n\n  while (true) {\n    try {\n      const ws = await connect();\n      console.log('Connected');\n      attempt = 0; // reset backoff on success\n\n      // Set up your message handler and streams here\n      await setupStreams(ws);\n\n      // Wait for connection to close\n      await new Promise<void>((resolve) => ws.once('close', resolve));\n\n    } catch (err) {\n      attempt++;\n      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);\n      console.warn(`Reconnect attempt ${attempt} in ${delay}ms...`);\n      await new Promise((resolve) => setTimeout(resolve, delay));\n    }\n  }\n}\n\nasync function setupStreams(ws: WebSocket) {\n  let requestId = 0;\n\n  // Call GetInfo first to confirm connection\n  sendRequest(ws, requestId++, { GetInfo: {} });\n\n  ws.on('message', async (raw: Buffer) => {\n    const msg = await decodeMessage(raw);\n\n    if ('Response' in msg && 'GetInfo' in msg.Response.data) {\n      // Connection confirmed — open your streams\n      openQuoteStream(ws, requestId++);\n    }\n\n    if ('Error' in msg) {\n      console.error(`Error ${msg.Error.code}: ${msg.Error.message}`);\n    }\n\n    if ('StreamEnd' in msg && msg.StreamEnd.errorCode !== undefined) {\n      console.error(`Stream error: ${msg.StreamEnd.errorMessage}`);\n      ws.close(); // trigger reconnect\n    }\n  });\n}\n\nasync function openQuoteStream(ws: WebSocket, id: number) {\n  const SOL  = bs58.decode('So11111111111111111111111111111111111111112');\n  const USDC = bs58.decode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\n\n  sendRequest(ws, id, {\n    NewSwapQuoteStream: {\n      swap: {\n        inputMint: SOL,\n        outputMint: USDC,\n        amount: 1_000_000_000n,\n        slippageBps: 50,\n      },\n      transaction: {\n        userPublicKey: bs58.decode('YOUR_WALLET_PUBLIC_KEY'),\n      },\n    },\n  });\n}\n\nrunWithReconnect();"
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "Stream IDs do not survive a reconnect. After reconnecting you must open a new stream, because the old stream ID is no longer valid."
      },
      {
        "t": "h2",
        "text": "Best practices"
      },
      {
        "t": "list",
        "items": [
          "Call [`GetInfo`](/titan/docs/developer-doc/swap-api/reference/direct/get-info) after every reconnect to make sure the server can be reached before you open streams.",
          "If a route has `expiresAtMs` or `expiresAfterSlot` set, check them before building a transaction, since a quote that was valid on arrival can be stale by the time it lands on-chain.",
          "Keep the reconnect loop apart from your quote-processing logic, so that a stream error cannot quietly kill the reconnect handler."
        ]
      },
      {
        "t": "divider"
      },
      {
        "t": "h2",
        "text": "Related pages"
      },
      {
        "t": "list",
        "items": [
          "[Stream & Execute a Swap](/titan/docs/developer-doc/swap-api/guides/stream-and-execute): the complete walkthrough, including building transactions and handling errors",
          "[Error Codes](/titan/docs/developer-doc/swap-api/reference/error-codes): a list of the numeric error codes",
          "[Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection): the negotiation handshake explained",
          "[Types Reference](/titan/docs/developer-doc/swap-api/reference/types): `ServerMessage`, `ResponseError`, `StreamEnd` and every other type"
        ]
      }
    ]
  },

  "swap-api/guides/swap-v2-vs-v3": {
    "lead": "What Swap V3 changes compared with V2, and how to opt in.",
    "blocks": [
      {
        "t": "p",
        "text": "Swap V3 is the more recent version of the Titan Exchange Router, selected for each request through `titanSwapVersion`."
      },
      {
        "t": "callout",
        "tone": "warning",
        "text": "**V3 is the default.** Omit `titanSwapVersion` and you get V3; V2 remains available only if you ask for it explicitly (`titanSwapVersion: 2`). Details are in [Migrating to V3](#migrating-to-v3) below."
      },
      {
        "t": "h2",
        "text": "What's new in V3"
      },
      {
        "t": "p",
        "text": "**Account handling now lives in the instruction.** The swap instruction itself creates the output ATA and wraps or unwraps wSOL, so where V2 gave you several separate instructions, a V3 route gives one combined swap instruction. You therefore have less to put together when building the transaction."
      },
      {
        "t": "p",
        "text": "**Separate fee payer (`payer`).** A different account can pay all SOL-denominated costs (network fees, ATA rent for wSOL wrapping and the output ATA, and rent refunds) in place of the user. The payer must co-sign the transaction. If unset, the user pays. This makes sponsored, gasless-style swap flows possible."
      },
      {
        "t": "p",
        "text": "**Positive-slippage capture (`positiveSlippageFeeReceiver`).** If the output actually realized beats the quote, the extra can be paid to an account you pick, up to 10 bps of the output. That account must be a token account of the output mint and must already exist. The user keeps anything past the cap."
      },
      {
        "t": "p",
        "text": "**Keep output as wSOL (`outputWsol`).** By default, when the output mint is wrapped SOL (`So11111111111111111111111111111111111111112`), the router converts the result to native SOL. With `outputWsol: true` the output stays as the wSOL SPL token, which is useful if the following step expects a token account instead of native lamports. The flag is a boolean, `false` unless set, and matters only when `outputMint` is wSOL."
      },
      {
        "t": "code",
        "lang": "jsonc",
        "code": "{\n  \"transaction\": {\n    \"userPublicKey\": \"72neGwRAi6QWsFQjy3PkDuYBC5GNCRwC2aUMGcrkoJuP\",\n    \"outputWsol\": true\n  }\n}"
      },
      {
        "t": "h2",
        "text": "Selecting a version"
      },
      {
        "t": "p",
        "text": "You pick the version per request through the `titanSwapVersion` field of `TransactionParams`. Set it to `3` for V3, which unlocks `payer`, `positiveSlippageFeeReceiver` and `outputWsol`."
      },
      {
        "t": "code",
        "lang": "jsonc",
        "code": "{\n  \"transaction\": {\n    \"userPublicKey\": \"72neGwRAi6QWsFQjy3PkDuYBC5GNCRwC2aUMGcrkoJuP\",\n    \"titanSwapVersion\": 3\n  }\n}"
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "Give `titanSwapVersion` as the integer `3`, **never** the string `\"V3\"`. Strings get rejected with `Failed to deserialize query string: titanSwapVersion: invalid digit found in string`."
      },
      {
        "t": "h2",
        "text": "Pinning to V2"
      },
      {
        "t": "p",
        "text": "Not ready to migrate? Set `titanSwapVersion: 2` explicitly. A request that pins the version like this remains on V2 until V2 is fully retired."
      },
      {
        "t": "code",
        "lang": "jsonc",
        "code": "{\n  \"transaction\": {\n    \"userPublicKey\": \"72neGwRAi6QWsFQjy3PkDuYBC5GNCRwC2aUMGcrkoJuP\",\n    \"titanSwapVersion\": 2\n  }\n}"
      },
      {
        "t": "callout",
        "tone": "info",
        "text": "Pinning to V2 is a stopgap, not a place to stay. Use the pin to buy time for migration, not to remain on V2 indefinitely."
      },
      {
        "t": "h2",
        "text": "Migrating to V3"
      },
      {
        "t": "p",
        "text": "V3 being the default, a request lacking `titanSwapVersion` is already on V3. To move over after pinning `titanSwapVersion: 2`, either delete the field or change it to `3`."
      },
      {
        "t": "p",
        "text": "V3 adds three optional fields to `TransactionParams`. None of them is needed to migrate, so adopt them only if you want what they offer:"
      },
      {
        "t": "list",
        "items": [
          "**`payer`**: an additional account that bears the swap's SOL-denominated costs and has to co-sign the transaction. If you do not set it, the user's public key is used.",
          "**`positiveSlippageFeeReceiver`**: the account that is paid whatever positive-slippage surplus occurs.",
          "**`outputWsol`**: when the output mint is wSOL, keeps the output as wrapped SOL and skips unwrapping to native SOL. Default is `false`."
        ]
      },
      {
        "t": "p",
        "text": "When you assemble the transaction yourself from the route's `instructions` and `addressLookupTables`, remember that V3 differs from V2 in what it gives you: one combined swap instruction in place of V2's several. Work from whatever instructions come back, rather than assuming the V2 layout."
      },
      {
        "t": "p",
        "text": "Take the transaction's compute-unit limit from the quote's `computeUnitsSafe` rather than hard-coding one; that is the server's recommended value with a buffer included."
      },
      {
        "t": "h3",
        "text": "Migration checklist"
      },
      {
        "t": "list",
        "ordered": true,
        "items": [
          "Set `titanSwapVersion: 3` on your swap requests.",
          "Adopt `payer`, `positiveSlippageFeeReceiver` or `outputWsol` only if your flow needs them.",
          "If you set compute-unit limits by hand, use the quote's `computeUnitsSafe`.",
          "Drop `titanSwapVersion` entirely, since V3 is the default."
        ]
      },
      {
        "t": "h2",
        "text": "Comparison"
      },
      {
        "t": "table",
        "head": [
          "",
          "Swap V2",
          "Swap V3"
        ],
        "rows": [
          [
            "Status",
            "Opt-in (`titanSwapVersion: 2`)",
            "Default"
          ],
          [
            "ATA creation + SOL wrap/unwrap",
            "Separate instructions around the swap",
            "Handled inside the swap instruction (one consolidated instruction)"
          ],
          [
            "Separate fee payer",
            "No",
            "Yes (`payer`, must co-sign)"
          ],
          [
            "Positive-slippage capture",
            "No",
            "Yes (≤ 10 bps, output-mint token account)"
          ],
          [
            "Keep output as wSOL",
            "No",
            "Yes (`outputWsol`)"
          ]
        ]
      }
    ]
  },
};
