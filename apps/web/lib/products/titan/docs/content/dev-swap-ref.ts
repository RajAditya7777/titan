import type { DocContent } from "../schema";

/** Page bodies for this section, keyed by slug. Own words; facts exact. */
export const PAGES: Record<string, DocContent> = {
 "swap-api/reference/direct-vs-gateway": {
  "blocks": [
   {
    "t": "p",
    "text": "Both interfaces sit on the same execution infrastructure. Titan Direct is for enterprise customers and is reached through distributors. Titan Gateway is offered through distributors too, and anyone with an API key can use it on the [Developers Portal](/titan/docs/developer-doc/developers-portal/introduction). Each one is powered by Titan's routing algorithms, returns the same quote types and yields the same transactions. **What differs is the interface and the workflow, not how good the routes are.**"
   },
   {
    "t": "h2",
    "text": "Titan Direct — WebSocket API"
   },
   {
    "t": "p",
    "text": "Titan Direct is a WebSocket API for enterprise users whose business depends on latency and execution. Market makers, prop desks and quant or algo traders all work where a stale quote or a slow fill is costly."
   },
   {
    "t": "p",
    "text": "Because the connection stays open, there is no repeated HTTP handshake, and Titan can push fresh quotes to you instead of making you poll. Routes come from Argos, Titan's own routing engine, which searches the whole liquidity landscape for the best price."
   },
   {
    "t": "p",
    "text": "**No other trading API on Solana is WebSocket-native the way Titan Direct is, and it is made for traders who cannot tolerate stale quotes.**"
   },
   {
    "t": "p",
    "text": "**Pick Direct when you need:**"
   },
   {
    "t": "list",
    "items": [
     "Live quotes that refresh by themselves whenever on-chain state moves",
     "A standing connection for trading bots, market making or algorithmic strategies",
     "The shortest possible time between quote and execution"
    ]
   },
   {
    "t": "h2",
    "text": "Titan Gateway — REST API"
   },
   {
    "t": "p",
    "text": "Titan Gateway is a REST API for teams adding swaps to a product: wallets, aggregators, DeFi protocols and consumer apps. These teams already live in REST and do not want to rebuild around a WebSocket."
   },
   {
    "t": "p",
    "text": "**Starting from zero, the fastest path to production-grade swap execution on Solana is Titan Gateway.**"
   },
   {
    "t": "p",
    "text": "**Gateway is not a cut-down Direct.** Its design centers on integration workflows, and it runs on the same Argos engine as Direct, so **route quality is identical.** Only the interface and the style of integration set them apart."
   },
   {
    "t": "p",
    "text": "**Pick Gateway when you need:**"
   },
   {
    "t": "list",
    "items": [
     "Ordinary REST endpoints that slot into your current backend",
     "One quote per user action, such as a one-click swap button, a price display or a backend job",
     "An integration that needs no WebSocket infrastructure"
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
     "Titan Direct",
     "Titan Gateway"
    ],
    "rows": [
     [
      "Interface",
      "WebSocket",
      "REST"
     ],
     [
      "Quote delivery",
      "Streaming — continuous updates",
      "Per-request — one response per call"
     ],
     [
      "Connection",
      "Persistent",
      "Stateless"
     ]
    ]
   },
   {
    "t": "h2",
    "text": "API endpoint mapping"
   },
   {
    "t": "p",
    "text": "Each Titan Direct RPC method has a matching Gateway REST endpoint, with the same request parameters and response types."
   },
   {
    "t": "table",
    "head": [
     "Titan Gateway",
     "Titan Direct"
    ],
    "rows": [
     [
      "`GET /api/v1/info`",
      "`GetInfo`"
     ],
     [
      "`GET /api/v1/providers`",
      "`ListProviders`"
     ],
     [
      "`GET /api/v1/venues`",
      "`GetVenues`"
     ],
     [
      "`GET /api/v1/quote/swap`",
      "`NewSwapQuoteStream`"
     ]
    ]
   },
   {
    "t": "h2",
    "text": "Which should I use?"
   },
   {
    "t": "p",
    "text": "Without a distributor account, the [Developers Portal](/titan/docs/developer-doc/developers-portal/introduction) is the place to start: it exposes the Gateway endpoints behind an API key and answers in JSON. Enterprise customers who want streaming quotes should pick Titan Direct, where the [`@titanexchange/sdk-ts`](/titan/docs/developer-doc/resources/sdk) SDK handles the WebSocket connection, MessagePack encoding and compression negotiation for you. When REST fits your architecture better, or holding a connection open is not practical, go with Titan Gateway and get the same routing quality as a request and response."
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[Quickstart](/titan/docs/developer-doc/swap-api/quickstart) — get your first quote from Direct and from Gateway",
     "[Stream & Execute a Swap](/titan/docs/developer-doc/swap-api/guides/stream-and-execute) — full guide to using Titan Direct",
     "[Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection) — details of the WebSocket protocol",
     "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol) — how MessagePack and compression work"
    ]
   }
  ],
  "lead": "Side-by-side comparison of Titan's two integration paths."
 },
 "swap-api/reference/direct": {
  "blocks": [
   {
    "t": "p",
    "text": "**Aimed at traders who need fresh quotes at every moment.** Titan Direct is sold only to enterprises, through distributors. It keeps a WebSocket connection open and streams live swap quotes whenever on-chain state moves. Each message is a binary frame in [MessagePack](/titan/docs/developer-doc/swap-api/reference/wire-protocol)."
   }
  ],
  "lead": "Titan Direct — persistent WebSocket API with real-time streaming swap quotes."
 },
 "swap-api/reference/direct/connection": {
  "blocks": [
   {
    "t": "p",
    "text": "**Titan Direct is a persistent WebSocket connection.** Every message is a binary frame encoded with [MessagePack](/titan/docs/developer-doc/swap-api/reference/wire-protocol). Before the first request, client and server agree on a protocol version and an optional compression scheme through the `Sec-WebSocket-Protocol` header."
   },
   {
    "t": "h2",
    "text": "Protocol negotiation"
   },
   {
    "t": "p",
    "text": "The client lists the protocols it supports, most preferred first, in the `Sec-WebSocket-Protocol` header. The server picks the best one both sides support and echoes it in its response header. All version 1 protocols start with `v1.api.titan.ag`, and can end in `+zstd`, `+brotli` or `+gzip` to select compression. With no suffix there is no compression."
   },
   {
    "t": "p",
    "text": "**Compression is applied after MessagePack encoding, so the receiver must decompress before decoding.** Every Titan SDK example and guide uses zstd."
   },
   {
    "t": "h2",
    "text": "Authentication"
   },
   {
    "t": "p",
    "text": "**The server wants you authenticated before you can make any request.** You present a signed **JWT (JSON Web Token)** when you open the connection, in one of two ways:"
   },
   {
    "t": "list",
    "items": [
     "**Authorization header** (recommended) — `Authorization: Bearer <token>`",
     "**Query parameter** — `wss://YOUR_ENDPOINT/api/v1/ws?auth=<token>` — an option for clients unable to attach custom headers, browsers for example"
    ]
   },
   {
    "t": "h3",
    "text": "JWT claims"
   },
   {
    "t": "p",
    "text": "**Required:**"
   },
   {
    "t": "list",
    "items": [
     "**`iss`** — who issued the JWT.",
     "**`sub`** — the subject, a unique ID for the authenticated user.",
     "**`aud`** — the audience, which **must be `api.titan.ag`**.",
     "**`exp`** — when the token expires. A connection is refused if this moment has passed.",
     "**`iat`** — when the token was issued. Tokens issued in the future are rejected."
    ]
   },
   {
    "t": "p",
    "text": "**Optional:**"
   },
   {
    "t": "list",
    "items": [
     "**`nbf`** — not-before time. A connection is refused if this moment is still in the future.",
     "**`jti`** — the JWT ID. Where the server supports it, only one connection per distinct `jti` is accepted.",
     "**`https://api.titan.ag/upk_b58`** — a Solana public key as a Base58 string. When present, that key is used to build transactions, and **sending a different `userPublicKey` causes an error**."
    ]
   },
   {
    "t": "h2",
    "text": "Connecting"
   },
   {
    "t": "code",
    "code": "import WebSocket from 'ws';\nimport { Encoder, Decoder } from '@msgpack/msgpack';\nimport { zstdCompress, zstdDecompress } from 'http-encoding';\n\n// useBigInt64 is required — u64 values (amounts, timestamps) exceed Number.MAX_SAFE_INTEGER\nconst encoder = new Encoder({ useBigInt64: true });\nconst decoder = new Decoder({ useBigInt64: true });\nlet useCompression = false;\n\n// Pass your JWT as a query parameter\nconst url = `${process.env.TITAN_ENDPOINT}?auth=${process.env.TITAN_JWT}`;\n\n// Offer zstd compression with a plaintext fallback\nconst ws = new WebSocket(url, [\n  'v1.api.titan.ag+zstd',\n  'v1.api.titan.ag',\n]);\n\nws.on('open', () => {\n  // Check which protocol the server selected\n  useCompression = ws.protocol !== 'v1.api.titan.ag';\n  console.log('Connected. Negotiated protocol:', ws.protocol);\n});",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "Message format"
   },
   {
    "t": "p",
    "text": "**Messages travel as binary WebSocket frames; text frames are ignored.** The payload is always MessagePack, and the conventions, data types and serialization are covered on [Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol)."
   },
   {
    "t": "h2",
    "text": "RPC interface"
   },
   {
    "t": "p",
    "text": "The client makes requests with a set of parameters and gets back one response for each, either a success or an error."
   },
   {
    "t": "table",
    "head": [
     "Procedure",
     "Parameters",
     "Response",
     "Stream"
    ],
    "rows": [
     [
      "`GetInfo`",
      "`GetInfoRequest`",
      "`ServerInfo`",
      "—"
     ],
     [
      "`NewSwapQuoteStream`",
      "`SwapQuoteRequest`",
      "`QuoteSwapStreamResponse`",
      "`SwapQuotes`"
     ],
     [
      "`StopStream`",
      "`StopStreamRequest`",
      "`StopStreamResponse`",
      "—"
     ],
     [
      "`GetVenues`",
      "`GetVenuesRequest`",
      "`VenueInfo`",
      "—"
     ],
     [
      "`ListProviders`",
      "`ListProvidersRequest`",
      "`ProviderInfo[]`",
      "—"
     ]
    ]
   },
   {
    "t": "p",
    "text": "Each client request is a [`ClientRequest`](/titan/docs/developer-doc/swap-api/reference/wire-protocol#message-envelope-types) holding a numeric `id` and a `data` field with one of the RPC methods above. The server pairs responses with requests using `requestId`, and answers with one of four message types: **`Response`**, **`Error`**, **`StreamData`** or **`StreamEnd`**."
   },
   {
    "t": "p",
    "text": "The full type definitions are in the [Types Reference](/titan/docs/developer-doc/swap-api/reference/wire-protocol#message-envelope-types)."
   },
   {
    "t": "h3",
    "text": "Sending a request"
   },
   {
    "t": "code",
    "code": "// Monotonically increasing counter — server echoes this back in responses\nlet requestId = 0;\n\n// Encode and optionally compress before sending\nasync function sendRequest(ws: WebSocket, id: number, data: Record<string, unknown>) {\n  const encoded = encoder.encode({ id, data });\n  ws.send(useCompression ? await zstdCompress(encoded) : encoded);\n}\n\n// Decompress (if needed) and decode incoming messages\nasync function decodeMessage(raw: Buffer): Promise<any> {\n  const data = useCompression ? await zstdDecompress(raw) : raw;\n  return decoder.decode(data);\n}\n\n// Send GetInfo to confirm the connection is live\nawait sendRequest(ws, requestId++, { GetInfo: {} });\n\n// Handle all four server message types\nws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Response' in msg) {\n    // Successful RPC response — correlate via requestId\n    console.log('Response to request', msg.Response.requestId, msg.Response.data);\n  }\n\n  if ('Error' in msg) {\n    // RPC error — contains requestId, code, and message\n    console.error('Error on request', msg.Error.requestId, msg.Error.code, msg.Error.message);\n  }\n\n  if ('StreamData' in msg) {\n    // Stream update — contains id, seq, and payload\n  }\n\n  if ('StreamEnd' in msg) {\n    // Stream closed — check errorCode/errorMessage for abnormal termination\n  }\n});",
    "lang": "typescript"
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "Keep one incrementing `requestId` counter per connection. The server sends the same `requestId` back, so you can match responses to requests with no extra bookkeeping."
   },
   {
    "t": "h2",
    "text": "Ping / Pong"
   },
   {
    "t": "p",
    "text": "Client and server both support the standard WebSocket Ping/Pong frames. The `ws` library answers them on its own, so **you need no explicit handling** unless you want to watch connection health yourself."
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info) — confirm the server responds and fetch its default settings",
     "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol) — how MessagePack is used and how values are serialized",
     "[Titan Direct vs Titan Gateway](/titan/docs/developer-doc/swap-api/reference/direct-vs-gateway) — deciding whether WebSocket or REST suits you"
    ]
   }
  ],
  "lead": "Connect to Titan Direct, negotiate the protocol version and compression, and send your first request."
 },
 "swap-api/reference/direct/get-info": {
  "blocks": [
   {
    "t": "p",
    "text": "**`GetInfo` returns the server's protocol version plus the default, minimum and maximum of every configurable setting.** Call it once connected, to confirm the server answers and to learn the bounds you will need when configuring a stream."
   },
   {
    "t": "h2",
    "text": "Request"
   },
   {
    "t": "p",
    "text": "`GetInfoRequest` is an empty object with no parameters. The server ignores any unknown fields."
   },
   {
    "t": "code",
    "code": "// Empty request — no parameters needed\nawait sendRequest(ws, requestId++, { GetInfo: {} });",
    "lang": "typescript"
   },
   {
    "t": "p",
    "text": "The `sendRequest` and `decodeMessage` helpers are set up in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#sending-a-request)."
   },
   {
    "t": "h2",
    "text": "Response"
   },
   {
    "t": "p",
    "text": "The reply is a [`ServerInfo`](/titan/docs/developer-doc/swap-api/reference/types) object holding the protocol version and every server setting with its default and bounds."
   },
   {
    "t": "code",
    "code": "ws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Response' in msg && 'GetInfo' in msg.Response.data) {\n    const info = msg.Response.data.GetInfo;\n\n    // Protocol version — major changes are backwards-incompatible\n    console.log('Protocol version:', info.protocolVersion);\n    // { major: 1, minor: 9, patch: 0 }\n\n    // Quote stream settings — use these bounds when configuring NewSwapQuoteStream\n    console.log('Update interval — min/max/default (ms):',\n      info.settings.quoteUpdate.intervalMs.min,\n      info.settings.quoteUpdate.intervalMs.max,\n      info.settings.quoteUpdate.intervalMs.default,\n    );\n\n    console.log('Max quotes per update — default:',\n      info.settings.quoteUpdate.numQuotes.default\n    );\n\n    // How many streams you can open simultaneously on this connection\n    console.log('Concurrent streams allowed:',\n      info.settings.connection.concurrentStreams\n    );\n  }\n});",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "ServerInfo"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct ServerInfo {\n  /// Server protocol version information.\n  protocolVersion: VersionInfo,\n  /// Server settings and parameter bounds.\n  settings: ServerSettings,\n}\n\nstruct VersionInfo {\n  /// Major version — incremented for backwards-incompatible changes.\n  major: u16,\n  /// Minor version — incremented for backwards-compatible changes.\n  minor: u16,\n  /// Patch version — informational, no data format changes.\n  patch: u16,\n}\n\nstruct ServerSettings {\n  /// Settings and parameter bounds for quote updates.\n  quoteUpdate: QuoteUpdateSettings,\n  /// Settings and parameter bounds for swaps.\n  swap: SwapSettings,\n  /// Settings and parameter bounds for transaction generation.\n  transaction: TransactionSettings,\n  /// Settings and limits for the connection.\n  connection: ConnectionSettings,\n}\n\nstruct BoundedValueWithDefault<T> {\n  /// Minimum allowed value.\n  min: T,\n  /// Maximum allowed value.\n  max: T,\n  /// Default value when not specified in request.\n  default: T,\n}\n\nstruct QuoteUpdateSettings {\n  /// Bounds and default for the `intervalMs` parameter.\n  intervalMs: BoundedValueWithDefault<u64>,\n  /// Bounds and default for the `numQuotes` parameter.\n  numQuotes: BoundedValueWithDefault<u32>,\n}\n\nstruct SwapSettings {\n  /// Default and bounds for `slippageBps`.\n  slippageBps: BoundedValueWithDefault<u16>,\n  /// Default value for `onlyDirectRoutes`.\n  onlyDirectRoutes: bool,\n  /// Default value for `addSizeConstraint`.\n  addSizeConstraint: bool,\n}\n\nstruct TransactionSettings {\n  /// Default value for `closeInputTokenAccount`.\n  closeInputTokenAccount: bool,\n  /// Default value for `createOutputTokenAccount`.\n  createOutputTokenAccount: bool,\n}\n\nstruct ConnectionSettings {\n  /// Number of concurrent streams the user is allowed.\n  concurrentStreams: u32,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface ServerInfo {\n  // Server protocol version information.\n  protocolVersion: VersionInfo;\n  // Server settings and parameter bounds.\n  settings: ServerSettings;\n}\n\ninterface VersionInfo {\n  // Major version — incremented for backwards-incompatible changes.\n  major: number;\n  // Minor version — incremented for backwards-compatible changes.\n  minor: number;\n  // Patch version — informational, no data format changes.\n  patch: number;\n}\n\ninterface ServerSettings {\n  // Settings and parameter bounds for quote updates.\n  quoteUpdate: QuoteUpdateSettings;\n  // Settings and parameter bounds for swaps.\n  swap: SwapSettings;\n  // Settings and parameter bounds for transaction generation.\n  transaction: TransactionSettings;\n  // Settings and limits for the connection.\n  connection: ConnectionSettings;\n}\n\ninterface QuoteUpdateSettings {\n  // Bounds and default for `intervalMs` parameter.\n  intervalMs: { min: number; max: number; default: number };\n  // Bounds and default for `numQuotes` parameter.\n  numQuotes: { min: number; max: number; default: number };\n}\n\ninterface SwapSettings {\n  // Default and bounds for `slippageBps`.\n  slippageBps: { min: number; max: number; default: number };\n  // Default value for `onlyDirectRoutes`.\n  onlyDirectRoutes: boolean;\n  // Default value for `addSizeConstraint`.\n  addSizeConstraint: boolean;\n}\n\ninterface TransactionSettings {\n  // Default value for `closeInputTokenAccount`.\n  closeInputTokenAccount: boolean;\n  // Default value for `createOutputTokenAccount`.\n  createOutputTokenAccount: boolean;\n}\n\ninterface ConnectionSettings {\n  // Number of concurrent streams the user is allowed.\n  concurrentStreams: number;\n}"
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
     "[Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection) — how to open the socket and authenticate, plus the `sendRequest` and `decodeMessage` helpers from the example",
     "[NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) — start a live quote stream built on the settings GetInfo returned",
     "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol) — how MessagePack is used and how values are serialized"
    ]
   }
  ],
  "lead": "Read the server's protocol version and default settings before opening streams."
 },
 "swap-api/reference/direct/get-swap-price": {
  "blocks": [
   {
    "t": "p",
    "text": "**Returns a price quote with no instructions or transaction data.** Use it to show prices in a UI without paying for executable transactions; it is lighter than `NewSwapQuoteStream`."
   },
   {
    "t": "p",
    "text": "This is a single request rather than a stream. The server looks for the best direct route and uses its simulated output as the price."
   },
   {
    "t": "h2",
    "text": "Request"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct SwapPriceRequest {\n  /// Address of the input mint of the swap.\n  inputMint: Pubkey,\n  /// Address of the desired output token for the swap.\n  outputMint: Pubkey,\n  /// Raw number of tokens to swap, not scaled by decimals.\n  amount: u64,\n  /// If set, constrain quotes to the given set of DEXes.\n  dexes: Option<Vec<String>>,\n  /// If set, exclude the following DEXes when determining routes.\n  excludeDexes: Option<Vec<String>>,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface SwapPriceRequest {\n  // Address of the input mint.\n  inputMint: Pubkey;\n  // Address of the output mint.\n  outputMint: Pubkey;\n  // Raw number of tokens to swap. Use BigInt.\n  amount: number | bigint;\n  // If set, constrain to these DEXes.\n  dexes?: string[];\n  // If set, exclude these DEXes.\n  excludeDexes?: string[];\n}"
     }
    ]
   },
   {
    "t": "h2",
    "text": "Response"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct SwapPrice {\n  /// Identifier for this price quote.\n  id: String,\n  /// Address of the input mint.\n  inputMint: Pubkey,\n  /// Address of the output mint.\n  outputMint: Pubkey,\n  /// Amount that was used for the price.\n  amountIn: u64,\n  /// The amount out of the best simulated quote.\n  amountOut: u64,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface SwapPrice {\n  // Identifier for this price quote.\n  id: string;\n  // Address of the input mint.\n  inputMint: Pubkey;\n  // Address of the output mint.\n  outputMint: Pubkey;\n  // Amount used for pricing.\n  amountIn: number | bigint;\n  // Best simulated output amount.\n  amountOut: number | bigint;\n}"
     }
    ]
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "**Nothing in the response can be used to build a transaction, neither `instructions`, `addressLookupTables` nor anything else.** To get swap data you can execute, call [NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) or the Gateway [Quote Swap](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap) endpoint."
   },
   {
    "t": "h2",
    "text": "Example"
   },
   {
    "t": "code",
    "code": "import WebSocket from 'ws';\nimport { Encoder, Decoder } from '@msgpack/msgpack';\nimport { compressSync, decompressSync } from 'fflate';       // zstd-compatible deflate\nimport bs58 from 'bs58';\n\n// --- Encoder / Decoder with BigInt support for u64 fields ---\nconst encoder = new Encoder({ useBigInt64: true });\nconst decoder = new Decoder({ useBigInt64: true });\n\n// Connect with zstd sub-protocol for compressed frames\nconst url = `${process.env.TITAN_ENDPOINT}?auth=${process.env.TITAN_JWT}`;\nconst ws = new WebSocket(url, ['v1.api.titan.ag+zstd', 'v1.api.titan.ag']);\n\nlet requestId = 0;\n\n// Pubkeys as 32-byte binary — MessagePack sends these as raw bytes\nconst SOL  = bs58.decode('So11111111111111111111111111111111111111112');\nconst USDC = bs58.decode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\n\n/** Encode, optionally compress, and send a request frame. */\nfunction sendRequest(ws: WebSocket, id: number, data: Record<string, unknown>) {\n  const payload = encoder.encode({ id, data });\n\n  // If the server negotiated the +zstd sub-protocol, compress before sending\n  const frame =\n    ws.protocol === 'v1.api.titan.ag+zstd'\n      ? compressSync(new Uint8Array(payload))\n      : payload;\n\n  ws.send(frame);\n}\n\n/** Decompress (if needed) and decode an incoming frame. */\nfunction decodeMessage(raw: Buffer): any {\n  const bytes =\n    ws.protocol === 'v1.api.titan.ag+zstd'\n      ? decompressSync(new Uint8Array(raw))\n      : raw;\n\n  return decoder.decode(bytes);\n}\n\nws.on('open', () => {\n  // Request a price-only quote — no transaction data returned\n  sendRequest(ws, requestId++, {\n    GetSwapPrice: {\n      inputMint: SOL,\n      outputMint: USDC,\n      amount: 1_000_000_000n, // 1 SOL in lamports\n    },\n  });\n});\n\nws.on('message', async (raw: Buffer) => {\n  const msg = decodeMessage(raw);\n\n  // Price response — use amountOut for display\n  if ('Response' in msg && 'GetSwapPrice' in msg.Response.data) {\n    const price = msg.Response.data.GetSwapPrice;\n    console.log('Output amount:', price.amountOut);   // BigInt\n    ws.close();\n  }\n\n  if ('Error' in msg) {\n    console.error(`Error ${msg.Error.code}: ${msg.Error.message}`);\n    ws.close();\n  }\n});",
    "lang": "typescript"
   },
   {
    "t": "p",
    "text": "The `sendRequest` and `decodeMessage` helpers are set up in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#sending-a-request)."
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) — a full quote with executable instructions",
     "[Gateway Quote Price](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-price) — the REST equivalent",
     "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing) — venue filtering with `dexes` and `excludeDexes`"
    ]
   }
  ],
  "lead": "Get a price-only quote without transaction data."
 },
 "swap-api/reference/direct/new-swap-quote-stream": {
  "blocks": [
   {
    "t": "p",
    "text": "**Starts a live swap quote stream.** The server first replies with a stream ID, then sends [`StreamData`](/titan/docs/developer-doc/swap-api/reference/wire-protocol#message-envelope-types) messages on the configured interval for as long as the stream runs, that is until it is [stopped](/titan/docs/developer-doc/swap-api/reference/direct/stop-stream) or the connection closes."
   },
   {
    "t": "h2",
    "text": "Request"
   },
   {
    "t": "p",
    "text": "The request is a `SwapQuoteRequest` made of three sub-objects: `swap` (what to quote), `transaction` (wallet details used to build instructions) and `update` (optional stream tuning)."
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct SwapQuoteRequest {\n  /// Parameters for the swap.\n  swap: SwapParams,\n  /// Parameters for transaction generation.\n  transaction: TransactionParams,\n  /// Parameters for the stream of quote updates.\n  update: Option<QuoteUpdateParams>,\n}\n\nstruct SwapParams {\n  /// Address of the input mint of the swap.\n  inputMint: Pubkey,\n  /// Address of the desired output token for the swap.\n  outputMint: Pubkey,\n  /// Raw number of tokens to swap, not scaled by decimals.\n  amount: u64,\n  /// Swap mode for how the amount should be interpreted.\n  /// Either ExactIn or ExactOut, defaults to ExactIn.\n  swapMode: Option<SwapMode>,\n  /// Allowed slippage in basis points.\n  slippageBps: Option<u16>,\n  /// If set, constrain quotes to the given set of DEXes.\n  dexes: Option<Vec<String>>,\n  /// If set, exclude the following DEXes when determining routes.\n  excludeDexes: Option<Vec<String>>,\n  /// If true, exclude a server-configured set of market-maker venues from\n  /// routing. Included as normal when absent or false.\n  noVoteAccounts: Option<bool>,\n  /// If set to true, only direct routes between the input and output mint\n  /// will be considered.\n  onlyDirectRoutes: Option<bool>,\n  /// If set to true, only quotes with transactions that fit within the size\n  /// constraint are returned.\n  addSizeConstraint: Option<bool>,\n  /// The size constraint to use when `addSizeConstraint` is set.\n  /// Default is set by the server, normally slightly less than the maximum\n  /// for the requested transaction format. Values above the format maximum\n  /// are clamped: 1232 bytes for V0 and 4096 bytes for V1.\n  sizeConstraint: Option<u32>,\n  /// If set, limit quotes to the given set of provider IDs.\n  providers: Option<Vec<String>>,\n  /// If set, constrain quotes to routes that only use venues (pools) whose\n  /// address is in this list. Filters by individual venue address, unlike\n  /// `dexes`/`excludeDexes` which filter by venue label.\n  venueAllowlist: Option<Vec<Pubkey>>,\n  /// If set, exclude any route that uses a venue (pool) whose address is in\n  /// this list. The banlist overrides `venueAllowlist`: a venue in both lists\n  /// is always excluded.\n  venueBanlist: Option<Vec<Pubkey>>,\n  /// If set, limit total number of accounts used by routes.\n  /// V1 supports at most 64 addresses; higher values are clamped.\n  accountsLimitTotal: Option<u16>,\n  /// If set, limit total number of writable accounts used by routes.\n  /// If not set, up to 64 writable accounts are allowed.\n  accountsLimitWritable: Option<u16>,\n  /// If set, overrides the mesh size written into the swap instruction for\n  /// dynamic allocation routes (1–255). The on-chain optimizer splits each\n  /// venue group's input into `meshSize` chunks, so a smaller value gives a\n  /// coarser split that uses fewer compute units. Only honored by Titan DART.\n  meshSize: Option<u8>,\n  /// A template of instructions and ALTs the router must leave room for in\n  /// the transaction. Titan generates a swap that fits alongside them within\n  /// Solana's size limits. See \"Transaction Template\" below.\n  /// INCOMPATIBLE with `accountsLimitTotal`, `accountsLimitWritable`, and\n  /// `sizeConstraint` — passing both returns an error.\n  transactionTemplate: Option<TransactionTemplate>,\n}\n\nstruct TransactionParams {\n  /// Public key of the user requesting the swap.\n  /// NOTE: Setting this to a read-only system account will result in\n  /// simulations failing and no quotes being returned.\n  userPublicKey: Pubkey,\n  /// If true, close the input token account as part of the transaction.\n  closeInputTokenAccount: Option<bool>,\n  /// If true, an idempotent ATA will be added to the transactions.\n  createOutputTokenAccount: Option<bool>,\n  /// Token account for the output mint used to collect fees.\n  /// Must already exist on-chain.\n  feeAccount: Option<Pubkey>,\n  /// Fee amount to take, in basis points. Maximum 10000 (100%).\n  /// If not specified, default fee for the requester is used.\n  feeBps: Option<u16>,\n  /// Whether the fee should be taken in terms of the input mint.\n  /// Default is false (fee taken from output mint).\n  feeFromInputMint: Option<bool>,\n  /// Token account into which to place the output of the swap.\n  /// If not specified, the user's ATA is used.\n  outputAccount: Option<Pubkey>,\n  /// If true, leave the output as wrapped SOL (the wSOL SPL token) instead of\n  /// unwrapping it to native SOL. Only has an effect when the output mint is\n  /// wSOL; ignored otherwise. Default: false (output unwrapped to native SOL).\n  /// Requires `titanSwapVersion: 3`.\n  outputWsol: Option<bool>,\n  /// Router version to use: `3` for V3, otherwise V2. See \"Swap V3\" below.\n  titanSwapVersion: Option<u8>,\n  /// Solana transaction wire format Titan should use when sizing routes.\n  /// Defaults to V0. V1 requires Titan Swap V3.\n  transactionFormat: Option<TransactionFormat>,\n  /// Separate funder for SOL-denominated costs of the swap — network fees,\n  /// rent for any ATA the router creates (wSOL wrap ATA, output ATA), and\n  /// the destination for the rent refund when the wSOL ATA is closed.\n  /// The payer must sign the transaction alongside the user for it to land.\n  /// Requires `titanSwapVersion: 3`.\n  payer: Option<Pubkey>,\n  /// Token account that receives any surplus when realized DEX output\n  /// exceeds the quoted `outAmount`. The skim is capped at 10 bps of\n  /// `outAmount` — any surplus beyond that stays with the user.\n  /// MUST be a token account of the output mint — passing a wallet pubkey\n  /// or wrong-mint token account fails the transaction at execution.\n  /// Requires `titanSwapVersion: 3`.\n  positiveSlippageFeeReceiver: Option<Pubkey>,\n}\n\nstruct QuoteUpdateParams {\n  /// How often the server should send updates, in milliseconds.\n  intervalMs: Option<u64>,\n  /// Maximum number of quotes per update.\n  /// If more are available, the worst are filtered out.\n  numQuotes: Option<u32>,\n  /// Whether to include Address Lookup Table contents in responses.\n  /// If omitted, only ALT addresses are returned and the client must fetch\n  /// each table when building the transaction.\n  includeAltContents: Option<bool>,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface SwapQuoteRequest {\n  // Parameters for the swap.\n  swap: SwapParams;\n  // Parameters for transaction generation.\n  transaction: TransactionParams;\n  // Parameters for the stream of quote updates.\n  update?: QuoteUpdateParams;\n}\n\ninterface SwapParams {\n  // Address of input mint for the swap.\n  inputMint: Pubkey;\n  // Address of output mint of the swap.\n  outputMint: Pubkey;\n  // Raw number of tokens to swap, not scaled by decimals.\n  amount: number;\n  // Whether amount is in terms of inputMint or outputMint.\n  // Defaults to ExactIn.\n  swapMode?: SwapMode;\n  // Maximum allowed slippage, in basis points.\n  slippageBps?: number;\n  // If set, constrain quotes to the given set of DEXes.\n  dexes?: string[];\n  // If set, exclude the following DEXes when determining routes.\n  excludeDexes?: string[];\n  // If true, exclude a server-configured set of market-maker venues from\n  // routing. Included as normal when absent or false.\n  noVoteAccounts?: boolean;\n  // If true, only direct routes will be considered.\n  onlyDirectRoutes?: boolean;\n  // If true, only quotes that fit within the size constraint are returned.\n  addSizeConstraint?: boolean;\n  // The size constraint to use when `addSizeConstraint` is set.\n  // Default is set by the server, normally slightly less than the maximum\n  // for the requested transaction format. Values above the format maximum\n  // are clamped: 1232 bytes for V0 and 4096 bytes for V1.\n  sizeConstraint?: number;\n  // If set, limit quotes to the given set of provider IDs.\n  providers?: string[];\n  // Constrain quotes to routes that only use venues (pools) whose address is\n  // in this list. Filters by individual venue address, unlike\n  // `dexes`/`excludeDexes` which filter by venue label.\n  venueAllowlist?: Pubkey[];\n  // Exclude any route that uses a venue (pool) whose address is in this list.\n  // The banlist overrides `venueAllowlist`: a venue in both lists is always\n  // excluded.\n  venueBanlist?: Pubkey[];\n  // Max total accounts per route. V1 supports at most 64 addresses.\n  accountsLimitTotal?: number;\n  // Max writable accounts per route. Default: 64.\n  accountsLimitWritable?: number;\n  // Mesh size for dynamic allocation routes (1–255). Smaller values give a\n  // coarser split that uses fewer compute units. Only honored by Titan DART.\n  meshSize?: number;\n  // A template of instructions and ALTs the router must leave room for in\n  // the transaction. Titan generates a swap that fits alongside them within\n  // Solana's size limits. See \"Transaction Template\" below.\n  // INCOMPATIBLE with `accountsLimitTotal`, `accountsLimitWritable`, and\n  // `sizeConstraint` — passing both returns an error.\n  transactionTemplate?: TransactionTemplate;\n}\n\ninterface TransactionParams {\n  // Public key of the user requesting the swap.\n  // NOTE: Setting this to a read-only system account will result in\n  // simulations failing and no quotes being returned.\n  userPublicKey: Pubkey;\n  // If true, close the input token account as part of the transaction.\n  closeInputTokenAccount?: boolean;\n  // If true, an idempotent ATA creation is added to the transaction.\n  createOutputTokenAccount?: boolean;\n  // Token account for collecting fees. Must already exist on-chain.\n  feeAccount?: Pubkey;\n  // Fee amount in basis points. Maximum 10000 (100%). If not specified, default fee is used.\n  feeBps?: number;\n  // If true, fee is taken from input mint. Default: false (output mint).\n  feeFromInputMint?: boolean;\n  // Custom output token account. Defaults to the user's ATA.\n  outputAccount?: Pubkey;\n  // If true, leave the output as wrapped SOL (the wSOL SPL token) instead of\n  // unwrapping it to native SOL. Only has an effect when the output mint is\n  // wSOL; ignored otherwise. Default: false (output unwrapped to native SOL).\n  // Requires `titanSwapVersion: 3`.\n  outputWsol?: boolean;\n  // Router version to use: `3` for V3, otherwise V2. See \"Swap V3\" below.\n  titanSwapVersion?: number;\n  // Solana transaction wire format Titan should use when sizing routes.\n  // Defaults to V0. V1 requires Titan Swap V3.\n  transactionFormat?: TransactionFormat;\n  // Separate funder for SOL-denominated costs of the swap — network fees,\n  // rent for any ATA the router creates (wSOL wrap ATA, output ATA), and\n  // the destination for the rent refund when the wSOL ATA is closed.\n  // The payer must sign the transaction alongside the user for it to land.\n  // Requires `titanSwapVersion: 3`.\n  payer?: Pubkey;\n  // Token account that receives any surplus when realized DEX output\n  // exceeds the quoted `outAmount`. The skim is capped at 10 bps of\n  // `outAmount` — any surplus beyond that stays with the user.\n  // MUST be a token account of the output mint — passing a wallet pubkey\n  // or wrong-mint token account fails the transaction at execution.\n  // Requires `titanSwapVersion: 3`.\n  positiveSlippageFeeReceiver?: Pubkey;\n}\n\ninterface QuoteUpdateParams {\n  // How often the server should send updates, in milliseconds.\n  intervalMs?: number;\n  // Maximum number of quotes per update.\n  numQuotes?: number;\n  // Whether to include Address Lookup Table contents in responses.\n  // If omitted, only ALT addresses are returned and the client must fetch\n  // each table when building the transaction.\n  includeAltContents?: boolean;\n}"
     }
    ]
   },
   {
    "t": "h2",
    "text": "Response"
   },
   {
    "t": "p",
    "text": "A successful reply contains a [`QuoteSwapStreamResponse`](/titan/docs/developer-doc/swap-api/reference/types) with the confirmed update interval, and a [`StreamStart`](/titan/docs/developer-doc/swap-api/reference/wire-protocol#message-envelope-types) carrying the stream ID:"
   },
   {
    "t": "list",
    "items": [
     "**`intervalMs`** (`u64`) — the interval the server will really use for this stream.",
     "**`stream.id`** (`u32`) — **keep this ID so you can** [**stop the stream**](/titan/docs/developer-doc/swap-api/reference/direct/stop-stream) **later.**",
     "**`stream.dataType`** — always `\"SwapQuotes\"`."
    ]
   },
   {
    "t": "h2",
    "text": "Stream updates"
   },
   {
    "t": "p",
    "text": "Once the stream is open, the server pushes `StreamData` messages at the confirmed interval. Each holds a `SwapQuotes` payload: **a `quotes` map keyed by provider ID**, where every value is a `SwapRoute` with the quote and its executable instructions."
   },
   {
    "t": "h3",
    "text": "`metadata.ExpectedWinner`"
   },
   {
    "t": "p",
    "text": "Every `SwapQuotes` update has a `metadata` object with an `ExpectedWinner` field, which is **Titan's pick for the best slippage-adjusted route.** Do not sort by raw `outAmount`; use this field to choose the route Titan expects to execute best once slippage, simulation results and route reliability are counted."
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct SwapQuotes {\n  /// Unique identifier for the quote.\n  id: String,\n  /// Address of the input mint for this quote.\n  inputMint: Pubkey,\n  /// Address of the output mint for this quote.\n  outputMint: Pubkey,\n  /// What swap mode was used for the quotes.\n  swapMode: SwapMode,\n  /// Amount used for the quotes.\n  amount: u64,\n  /// A mapping of a provider identifier to their quoted route.\n  quotes: HashMap<String, SwapRoute>,\n  /// Metadata including the expected winning provider (when DART is enabled).\n  metadata: Option<SwapQuotesMetadata>,\n  /// Contents of Address Lookup Tables used by the returned routes, if requested.\n  /// Available since v1.9.\n  alts: Option<Vec<AddressLookupTableAccount>>,\n}\n\nstruct SwapQuotesMetadata {\n  /// The provider Titan expects to deliver the best slippage-adjusted execution.\n  ExpectedWinner: Option<String>,\n}\n\nstruct SwapRoute {\n  /// How many input tokens go through this route.\n  inAmount: u64,\n  /// How many output tokens are expected.\n  outAmount: u64,\n  /// Slippage incurred, in basis points.\n  slippageBps: u16,\n  /// Platform fee information, if a fee is charged.\n  platformFee: Option<PlatformFee>,\n  /// Steps that comprise this route.\n  steps: Vec<RoutePlanStep>,\n  /// Instructions needed to execute the route.\n  /// May not be provided if a full transaction is provided instead.\n  instructions: Vec<Instruction>,\n  /// Address lookup tables necessary to load.\n  addressLookupTables: Vec<Pubkey>,\n  /// Context slot for the route.\n  contextSlot: Option<u64>,\n  /// Time taken to generate the quote in nanoseconds.\n  timeTakenNs: Option<u64>,\n  /// If this route expires by time, millisecond UNIX timestamp.\n  expiresAtMs: Option<u64>,\n  /// If this route expires by slot, last valid slot.\n  expiresAfterSlot: Option<u64>,\n  /// Compute units this transaction is expected to consume.\n  computeUnits: Option<u64>,\n  /// Recommended compute unit budget.\n  /// Higher than computeUnits to account for on-chain fluctuations.\n  computeUnitsSafe: Option<u64>,\n  /// Transaction for the user to sign, if instructions are not provided.\n  transaction: Option<Vec<u8>>,\n  /// Provider-specific reference ID for this quote.\n  /// Mainly provided by RFQ-based providers.\n  reference_id: Option<String>,\n}\n\nstruct RoutePlanStep {\n  /// Which AMM is being executed on at this step.\n  ammKey: Pubkey,\n  /// Label for the protocol (e.g. \"Raydium AMM\", \"Phoenix\").\n  label: String,\n  /// Input mint for this step.\n  inputMint: Pubkey,\n  /// Output mint for this step.\n  outputMint: Pubkey,\n  /// Input tokens expected to go through this step.\n  inAmount: u64,\n  /// Output tokens expected from this step.\n  outAmount: u64,\n  /// Proportion of order flow in parts per billion.\n  allocPpb: u32,\n  /// Mint of the fee token, if applicable.\n  feeMint: Option<Pubkey>,\n  /// Fee amount charged by the venue.\n  feeAmount: Option<u64>,\n  /// Context slot for the pool data.\n  contextSlot: Option<u64>,\n}\n\nstruct PlatformFee {\n  /// Amount of tokens taken as a fee.\n  amount: u64,\n  /// Fee percentage, in basis points.\n  fee_bps: u8,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface SwapQuotes {\n  // Unique Quote identifier.\n  id: string;\n  // Address of the input mint.\n  inputMint: Uint8Array;\n  // Address of the output mint.\n  outputMint: Uint8Array;\n  // What swap mode was used.\n  swapMode: SwapMode;\n  // Amount used for the quotes.\n  amount: number;\n  // A mapping of provider identifier to their quoted route.\n  quotes: { [key: string]: SwapRoute };\n  // Contents of Address Lookup Tables used by the returned routes, if requested.\n  // Available since v1.9.\n  alts?: AddressLookupTableAccount[];\n}\n\ninterface SwapRoute {\n  // Input tokens going through this route.\n  inAmount: number;\n  // Expected output tokens.\n  outAmount: number;\n  // Slippage incurred, in basis points.\n  slippageBps: number;\n  // Platform fee information, if charged.\n  platformFee?: PlatformFee;\n  // Steps that comprise this route.\n  steps: RoutePlanStep[];\n  // Instructions needed to execute the route.\n  instructions: Instruction[];\n  // Address lookup tables necessary to load.\n  addressLookupTables: Pubkey[];\n  // Context slot for the route.\n  contextSlot?: number;\n  // Time taken to generate the quote in nanoseconds.\n  timeTaken?: number;\n  // If this route expires by time, millisecond UNIX timestamp.\n  expiresAtMs?: number;\n  // If this route expires by slot, last valid slot.\n  expiresAfterSlot?: number;\n  // Compute units this transaction is expected to consume.\n  computeUnits?: number;\n  // Recommended compute unit budget.\n  computeUnitsSafe?: number;\n  // Transaction for the user to sign, if instructions not provided.\n  transaction?: Uint8Array;\n  // Provider-specific reference ID for this quote.\n  referenceId?: string;\n}\n\ninterface RoutePlanStep {\n  // Which AMM is being executed on at this step.\n  ammKey: Uint8Array;\n  // Label for the protocol (e.g. \"Raydium AMM\", \"Phoenix\").\n  label: string;\n  // Input mint for this step.\n  inputMint: Uint8Array;\n  // Output mint for this step.\n  outputMint: Uint8Array;\n  // Input tokens expected to go through this step.\n  inAmount: number;\n  // Output tokens expected from this step.\n  outAmount: number;\n  // Proportion of order flow in parts per billion.\n  allocPpb: number;\n  // Mint of the fee token, if applicable.\n  feeMint?: Uint8Array;\n  // Fee amount charged by the venue.\n  feeAmount?: number;\n  // Context slot for the pool data.\n  contextSlot?: number;\n}\n\ninterface PlatformFee {\n  // Amount of tokens taken as a fee.\n  amount: number;\n  // Fee percentage, in basis points.\n  fee_bps: number;\n}"
     }
    ]
   },
   {
    "t": "callout",
    "tone": "warning",
    "text": "**`quotes` is a map, not an array.** A provider may be missing from any given update, so loop with `Object.entries`."
   },
   {
    "t": "h3",
    "text": "ALT contents"
   },
   {
    "t": "p",
    "text": "With `update.includeAltContents` set to `true`, the response includes the complete Address Lookup Table accounts behind the returned routes. They appear in the `SwapQuotes.alts` array as compact `AddressLookupTableAccount` values: `p` is the table's 32-byte public key, and `a` lists its 32-byte addresses in order. To compile a route's transaction, look up each `p` among the keys in that route's `addressLookupTables` array."
   },
   {
    "t": "p",
    "text": "If you leave `includeAltContents` out or set it to `false`, `alts` is left out. Each route still returns `addressLookupTables`, but you have to fetch those accounts yourself before building the transaction."
   },
   {
    "t": "h2",
    "text": "Transaction format"
   },
   {
    "t": "p",
    "text": "`transaction.transactionFormat` picks the Solana transaction wire format that Titan uses when sizing candidate routes. It is independent of `titanSwapVersion`, which picks the version of the Titan swap instruction."
   },
   {
    "t": "table",
    "head": [
     "Value",
     "SDK enum",
     "Format",
     "Maximum size",
     "Address lookup tables"
    ],
    "rows": [
     [
      "`0`",
      "`TransactionFormat.V0`",
      "Versioned v0 transaction",
      "1232 bytes",
      "Supported"
     ],
     [
      "`1`",
      "`TransactionFormat.V1`",
      "Agave 4.2 Transaction V1 ([SIMD-0385](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0385-transaction-v1.md))",
      "4096 bytes",
      "Not supported"
     ]
    ]
   },
   {
    "t": "p",
    "text": "V0 is used unless you choose otherwise. V1 spells out every account as a full 32-byte address and permits at most 64 of them, which means a V1 route normally hits the account limit before it reaches the byte limit."
   },
   {
    "t": "callout",
    "tone": "warning",
    "text": "**Transaction V1 only works if the cluster you submit to has the Agave 4.2 feature set active.** Titan reads `transactionFormat` just to size routes and never checks whether it is active. Keep using V0 until you have confirmed activation on your target cluster."
   },
   {
    "t": "p",
    "text": "Send `transactionFormat` as a number: `1`, not `\"V1\"`. V1 also depends on Titan Swap V3, so either set `titanSwapVersion: 3` or leave `titanSwapVersion` out and the server picks V3 itself. Combining an explicit V1 with Swap V2 gets the request rejected."
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "enum TransactionFormat {\n  V0 = 0,\n  V1 = 1,\n}\n\nstruct TransactionConfigParams {\n  /// Priority fee in lamports.\n  priorityFee: Option<u64>,\n  /// Maximum compute units.\n  computeUnitLimit: Option<u32>,\n  /// Maximum bytes of account data that may be loaded.\n  loadedAccountsDataSizeLimit: Option<u32>,\n  /// Requested heap size in bytes. Must be a multiple of 1024.\n  heapSize: Option<u32>,\n}"
     },
     {
      "label": "TypeScript",
      "code": "enum TransactionFormat {\n  V0 = 0,\n  V1 = 1,\n}\n\ninterface TransactionConfigParams {\n  // Priority fee in lamports.\n  priorityFee?: number;\n  // Maximum compute units.\n  computeUnitLimit?: number;\n  // Maximum bytes of account data that may be loaded.\n  loadedAccountsDataSizeLimit?: number;\n  // Requested heap size in bytes. Must be a multiple of 1024.\n  heapSize?: number;\n}"
     }
    ]
   },
   {
    "t": "p",
    "text": "In Transaction V1 the priority-fee and compute-budget settings live in the transaction envelope, not in `ComputeBudgetProgram` instructions. Every field you set adds 4 bytes, apart from `priorityFee`, which adds 8. Any field left out gets the runtime default."
   },
   {
    "t": "h2",
    "text": "Transaction Template"
   },
   {
    "t": "p",
    "text": "`transactionTemplate` reserves space in the transaction for instructions and address lookup tables you intend to add before or after the swap yourself, such as a custom fee transfer, an oracle update or an app-specific log. Titan includes the template when sizing routes, so the finished transaction still fits Solana's limits."
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct TransactionTemplate {\n  /// Instructions to reserve space for. It is assumed that you have\n  /// included the input mint and output mint account creation/deletion\n  /// instructions when necessary.\n  i: Vec<Instruction>,\n  /// Address lookup tables used in the instructions. Provide them in the\n  /// same order you'll use when compiling the message — Solana uses ALTs\n  /// greedily, so their effect depends on ordering. Titan extends this\n  /// vector with any ALTs it uses for the swap.\n  a: Vec<AddressLookupTableAccount>,\n  /// Additional account metas to include in sizing calculations.\n  m: Vec<AccountMeta>,\n  /// Transaction-level configuration. Required for V1; ignored for V0.\n  c: Option<TransactionConfigParams>,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface TransactionTemplate {\n  // Instructions to reserve space for. It is assumed that you have\n  // included the input mint and output mint account creation/deletion\n  // instructions when necessary.\n  i: Instruction[];\n  // Address lookup tables used in the instructions. Provide them in the\n  // same order you'll use when compiling the message — Solana uses ALTs\n  // greedily, so their effect depends on ordering. Titan extends this\n  // array with any ALTs it uses for the swap.\n  a: AddressLookupTableAccount[];\n  // Additional account metas to include in sizing calculations.\n  m: AccountMeta[];\n  // Transaction-level configuration. Required for V1; ignored for V0.\n  c?: TransactionConfigParams;\n}"
     }
    ]
   },
   {
    "t": "callout",
    "tone": "warning",
    "text": "**`transactionTemplate` cannot be combined with `accountsLimitTotal`, `accountsLimitWritable` or `sizeConstraint`.** The template is the sizing constraint, and sending both returns an error."
   },
   {
    "t": "callout",
    "tone": "warning",
    "text": "With `transactionFormat` set to V1, `c` is required because the compute budget lives in the transaction envelope. The `a` field is ignored, since Transaction V1 has no address lookup tables."
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "**To save space, the wire format abbreviates field names to one letter.** `Instruction` is serialized as `{ p, a, d }` (programId / accounts / data), `AccountMeta` as `{ p, s, w }` (pubkey / isSigner / isWritable), and `AddressLookupTableAccount` as `{ p, a }` (key / addresses). Every pubkey is a raw 32-byte array instead of a Base58 string. For a worked example, see the [Transaction Template guide](/titan/docs/developer-doc/swap-api/guides/transaction-template)."
   },
   {
    "t": "h2",
    "text": "Swap V3"
   },
   {
    "t": "p",
    "text": "Swap V3 is a newer routing version of the Titan Exchange Router (`T1TANpTeScyeqVzzgNViGDNrkQ6qHz9KrSBS4aNXvGT`). Choose it by setting `titanSwapVersion: 3` in `TransactionParams`; that also makes the `payer`, `positiveSlippageFeeReceiver` and `outputWsol` fields available."
   },
   {
    "t": "p",
    "text": "V3 is what Titan returns unless told otherwise. To remain on V2, set `titanSwapVersion: 2`, though the V3-only fields cannot be used with it."
   },
   {
    "t": "code",
    "code": "{\n  \"transaction\": {\n    \"userPublicKey\": \"72neGwRAi6QWsFQjy3PkDuYBC5GNCRwC2aUMGcrkoJuP\",\n    \"titanSwapVersion\": 3,\n    \"payer\": \"Gb4WdRjp7orviHSRz88pa3y9UkArLHR4gWWSv5HP31ZW\",\n    \"positiveSlippageFeeReceiver\": \"LzEWGGE7aGC3XVqmMhiTZsByJBhr16dJpJoNY5RuWQ5\"\n  }\n}",
    "lang": "json"
   },
   {
    "t": "h2",
    "text": "Example"
   },
   {
    "t": "code",
    "code": "import bs58 from 'bs58';\n\n// Pubkeys are 32-byte binary — decode from Base58 before sending\nconst SOL  = bs58.decode('So11111111111111111111111111111111111111112');\nconst USDC = bs58.decode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');\nconst userPublicKey = bs58.decode('YOUR_WALLET_PUBLIC_KEY');\n\n// Open a swap quote stream — server will push updates at the configured interval\nawait sendRequest(ws, requestId++, {\n  NewSwapQuoteStream: {\n    swap: {\n      inputMint: SOL,\n      outputMint: USDC,\n      amount: 1_000_000_000n, // 1 SOL in lamports — must be BigInt\n      slippageBps: 50,        // 0.5% slippage tolerance\n    },\n    transaction: {\n      userPublicKey,           // Needed for transaction/instruction generation\n    },\n  },\n});\n\n// Track the stream ID so we can stop it later\nlet streamId: number | undefined;\n\nws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  // Stream opened — capture the stream ID and confirmed interval\n  if ('Response' in msg && 'NewSwapQuoteStream' in msg.Response.data) {\n    streamId = msg.Response.stream.id;\n    console.log(`Stream ${streamId} open — interval: ${msg.Response.data.NewSwapQuoteStream.intervalMs}ms`);\n  }\n\n  // Quote update — quotes is a map keyed by provider ID, not an array\n  if ('StreamData' in msg) {\n    const quotes = msg.StreamData.payload.SwapQuotes;\n    for (const [provider, route] of Object.entries(quotes.quotes as Record<string, any>)) {\n      if (route.instructions?.length) {\n        console.log(`${provider}: ${route.outAmount} out`);\n      }\n    }\n  }\n\n  // RPC error — check code and message for details\n  if ('Error' in msg) {\n    console.error(`Error ${msg.Error.code}: ${msg.Error.message}`);\n  }\n\n  // Stream closed — check errorCode/errorMessage if present\n  if ('StreamEnd' in msg) {\n    console.log(`Stream ${msg.StreamEnd.id} ended`);\n    ws.close();\n  }\n});",
    "lang": "typescript"
   },
   {
    "t": "p",
    "text": "The `sendRequest` and `decodeMessage` helpers are set up in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#sending-a-request)."
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[StopStream](/titan/docs/developer-doc/swap-api/reference/direct/stop-stream) — end a running stream using its ID",
     "[Stream & Execute a Swap](/titan/docs/developer-doc/swap-api/guides/stream-and-execute) — the complete walkthrough covering transaction building, signing and error handling",
     "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing) — narrowing routes by venue or provider",
     "[Fee Collection](/titan/docs/developer-doc/swap-api/guides/fee-collection) — charge your own platform fee on swaps",
     "[Types Reference](/titan/docs/developer-doc/swap-api/reference/types) — definitions for `SwapQuoteRequest`, `SwapRoute`, `SwapQuotes` and the rest"
    ]
   }
  ],
  "lead": "Open a streaming swap quote that updates continuously as on-chain state changes."
 },
 "swap-api/reference/direct/stop-stream": {
  "blocks": [
   {
    "t": "p",
    "text": "**Asks the server to stop pushing data for a running stream.** Call it once you no longer need the quotes: after a swap has been executed, when the user navigates away, or ahead of opening a stream for a different pair."
   },
   {
    "t": "h2",
    "text": "Request"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct StopStreamRequest {\n  /// ID of the stream to stop.\n  id: u32,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface StopStreamRequest {\n  // ID of the stream to stop.\n  id: number;\n}"
     }
    ]
   },
   {
    "t": "h2",
    "text": "Response"
   },
   {
    "t": "p",
    "text": "The server answers with `StreamStopped`, which contains the ID of the stream it stopped."
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct StopStreamResponse {\n  /// Identifier of the stream that was stopped.\n  id: u32,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface StopStreamResponse {\n  // Identifier of the stream that was stopped.\n  id: number;\n}"
     }
    ]
   },
   {
    "t": "h2",
    "text": "Behavior"
   },
   {
    "t": "list",
    "items": [
     "**Messages already in the queue may still reach you.** Following a `StopStream`, the server can still deliver one or more `StreamData` messages it had queued beforehand, so your code should handle them gracefully.",
     "**`StreamEnd` always comes last.** The server sends `StreamEnd` once everything queued has been flushed. **The stream is fully closed only after `StreamEnd` arrives.**",
     "**Stream IDs do not carry over a reconnect.** When the WebSocket drops, every stream ends implicitly and the old IDs are invalid, so never call `StopStream` for a stream from an earlier connection."
    ]
   },
   {
    "t": "h2",
    "text": "Example"
   },
   {
    "t": "code",
    "code": "// Capture stream ID when a quote stream opens\nif ('Response' in msg && 'NewSwapQuoteStream' in msg.Response.data) {\n  streamId = msg.Response.stream.id;\n}\n\n// After receiving quotes, stop the stream\nif ('StreamData' in msg && streamId !== undefined) {\n  console.log('Got quotes, stopping stream', streamId);\n  await sendRequest(ws, requestId++, { StopStream: { id: streamId } });\n  streamId = undefined;\n}\n\n// Server confirms the stream was stopped\nif ('Response' in msg && 'StreamStopped' in msg.Response.data) {\n  console.log('Stream stopped:', msg.Response.data.StreamStopped.id);\n}\n\n// Stream is fully closed — no more data will arrive for this stream\nif ('StreamEnd' in msg) {\n  console.log('Stream ended:', msg.StreamEnd.id);\n}",
    "lang": "typescript"
   },
   {
    "t": "p",
    "text": "The `sendRequest` and `decodeMessage` helpers are set up in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#sending-a-request)."
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) — begin a live swap quote stream",
     "[Error Handling & Reconnect](/titan/docs/developer-doc/swap-api/guides/error-handling) — coping with lost connections and failed streams",
     "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol) — the MessagePack format and the envelope message variants"
    ]
   }
  ],
  "lead": "Stop an active quote stream by its ID."
 },
 "swap-api/reference/direct/venues-providers": {
  "blocks": [
   {
    "t": "p",
    "text": "**`GetVenues` lists every on-chain venue Titan can route through, and `ListProviders` lists the quote providers that compete for the best execution.** Both are light lookups you can send at any time on an open connection."
   },
   {
    "t": "h2",
    "text": "GetVenues"
   },
   {
    "t": "p",
    "text": "Returns venue labels, and optionally their Solana program IDs. The labels are the valid values for the `dexes` and `excludeDexes` routing parameters."
   },
   {
    "t": "h3",
    "text": "Request",
    "id": "getvenues-request"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct GetVenuesRequest {\n  /// Whether to include the program ID for each venue.\n  includeProgramIds: Option<bool>,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface GetVenuesRequest {\n  // Whether to include the program ID for each venue.\n  includeProgramIds?: boolean;\n}"
     }
    ]
   },
   {
    "t": "h3",
    "text": "Response",
    "id": "getvenues-response"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct VenueInfo {\n  /// List of venue labels. Each is a valid value for `dexes` and `excludeDexes`.\n  labels: Vec<String>,\n  /// Program ID for each label, same order. Only present when `includeProgramIds` is true.\n  programIds: Option<Vec<Pubkey>>,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface VenueInfo {\n  // Venue labels, valid for `dexes` and `excludeDexes` parameters.\n  labels: string[];\n  // Program ID for each label. Only present when `includeProgramIds` is true.\n  programIds?: Pubkey[];\n}"
     }
    ]
   },
   {
    "t": "h3",
    "text": "Example",
    "id": "getvenues-example"
   },
   {
    "t": "code",
    "code": "// Request all venues with their on-chain program IDs\nawait sendRequest(ws, requestId++, {\n  GetVenues: { includeProgramIds: true },\n});\n\nws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Response' in msg && 'GetVenues' in msg.Response.data) {\n    const venues = msg.Response.data.GetVenues;\n    console.log('Venue count:', venues.labels.length);\n    console.log('Labels:', venues.labels);\n    // e.g. ['Raydium', 'Whirlpool', 'Phoenix', 'Meteora', ...]\n  }\n});",
    "lang": "typescript"
   },
   {
    "t": "p",
    "text": "The `sendRequest` and `decodeMessage` helpers are set up in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#sending-a-request)."
   },
   {
    "t": "h2",
    "text": "ListProviders"
   },
   {
    "t": "p",
    "text": "**Returns the quote providers that are active on the server right now.** Every provider competes on its own to produce the best-priced route for each quote stream."
   },
   {
    "t": "h3",
    "text": "Request",
    "id": "listproviders-request"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct ListProvidersRequest {\n  /// Whether to include icon URLs for each provider.\n  /// By default, icons are not included.\n  includeIcons: Option<bool>,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface ListProvidersRequest {\n  // Whether to include icon URLs for each provider.\n  // By default, icons are not included.\n  includeIcons?: boolean;\n}"
     }
    ]
   },
   {
    "t": "h3",
    "text": "Response",
    "id": "listproviders-response"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct ProviderInfo {\n  /// Provider identifier. Valid value for the `providers` routing parameter.\n  id: String,\n  /// Human-readable display name.\n  name: String,\n  /// What kind of provider this is.\n  kind: ProviderKind,\n  /// URI for a 48x48 icon, if requested and available.\n  iconUri48: Option<String>,\n}\n\nenum ProviderKind {\n  DexAggregator,\n  RFQ,\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface ProviderInfo {\n  // Provider identifier. Valid for the `providers` routing parameter.\n  id: string;\n  // Human-readable display name.\n  name: string;\n  // What kind of provider this is.\n  kind: ProviderKind;\n  // URI for a 48x48 icon, if requested and available.\n  iconUri48?: string;\n}\n\ntype ProviderKind = \"DexAggregator\" | \"RFQ\";"
     }
    ]
   },
   {
    "t": "h3",
    "text": "Example",
    "id": "listproviders-example"
   },
   {
    "t": "code",
    "code": "// Request all active providers\nawait sendRequest(ws, requestId++, {\n  ListProviders: { includeIcons: false },\n});\n\nws.on('message', async (raw: Buffer) => {\n  const msg = await decodeMessage(raw);\n\n  if ('Response' in msg && 'ListProviders' in msg.Response.data) {\n    const providers = msg.Response.data.ListProviders;\n    providers.forEach((p: any) => {\n      console.log(`${p.name} (${p.id}) — ${p.kind}`);\n      // e.g. \"Titan (Titan) — DexAggregator\"\n    });\n  }\n});",
    "lang": "typescript"
   },
   {
    "t": "p",
    "text": "The `sendRequest` and `decodeMessage` helpers are set up in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#sending-a-request)."
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing) — filter by venue or provider when you open a quote stream",
     "[GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info) — the server's configuration and its protocol version",
     "[NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) — begin a live swap quote stream"
    ]
   }
  ],
  "lead": "Discover available venues and quote providers at runtime."
 },
 "swap-api/reference/gateway": {
  "blocks": [
   {
    "t": "p",
    "text": "**The quickest route from nothing to production-grade swap execution on Solana.** Titan Gateway gives you the same Argos routing engine as Titan Direct through plain REST endpoints. Through a distributor, every response is [MessagePack](/titan/docs/developer-doc/swap-api/reference/wire-protocol)-encoded. On the [Developers Portal](/titan/docs/developer-doc/developers-portal/introduction), set `Accept` to JSON or MessagePack and authenticate with `x-api-key`."
   }
  ],
  "lead": "Titan Gateway — simple REST endpoints backed by the Argos routing engine."
 },
 "swap-api/reference/gateway/gateway-quote-swap": {
  "blocks": [
   {
    "t": "p",
    "text": "**Returns swap quotes with executable instructions and address lookup tables. It is the Gateway counterpart of** [**NewSwapQuoteStream**](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream)**.** One REST call replaces a WebSocket stream."
   },
   {
    "t": "code",
    "code": "GET /api/v1/quote/swap",
    "lang": "http"
   },
   {
    "t": "p",
    "text": "**Authentication** — send an `Authorization: Bearer <token>` header or a `?auth=<token>` query parameter. JWT details are in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#authentication)."
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "**On the Developers Portal?** The parameters are the same. Use host `portal.api.titan.exchange`, the `x-api-key` header, and `Accept: application/json` for JSON. See [Portal Quote Swap](/titan/docs/developer-doc/developers-portal/reference/quote-swap)."
   },
   {
    "t": "h2",
    "text": "Query parameters"
   },
   {
    "t": "h3",
    "text": "Required"
   },
   {
    "t": "list",
    "items": [
     "**`inputMint`** — mint address (base58) of the token being sold.",
     "**`outputMint`** — mint address (base58) of the token being bought.",
     "**`amount`** — the amount expressed in the token's smallest unit, e.g. lamports for SOL. **Do not apply decimals.**",
     "**`userPublicKey`** — the wallet's public key (base58); required so the transaction and instructions can be generated."
    ]
   },
   {
    "t": "h3",
    "text": "Swap options"
   },
   {
    "t": "list",
    "items": [
     "**`slippageBps`** — the largest slippage you accept, in basis points. The server default applies if you leave it out.",
     "**`dexes`** — comma-separated venue labels to **include**. Valid labels come from [GetVenues](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-info#venues).",
     "**`excludeDexes`** — venue labels to **leave out**, separated by commas.",
     "**`venueAllowlist`** — venue **addresses** (base58), separated by commas, that restrict where routing may go. Unlike `dexes`/`excludeDexes`, which match venue labels, this matches each individual pool address.",
     "**`venueBanlist`** — venue **addresses** (base58), separated by commas, to leave out. It takes priority over `venueAllowlist`, so an address on both lists is always excluded.",
     "**`noVoteAccounts`** — `\"true\"` takes a server-configured group of market-maker venues out of routing. Leave it unset or use `\"false\"` and those venues remain available as usual.",
     "**`providers`** — comma-separated provider IDs. Valid IDs come from [ListProviders](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-info#providers).",
     "**`numQuotes`** — the maximum number of quotes in the response. When more providers can quote than this, the weakest ones are discarded, ranked by input or output amount according to swap mode. Omit it to use the server default; any value you send is validated against the server's configured bounds. In Titan Direct it sits within the streaming `update` object, whereas Gateway takes it as a plain query parameter.",
     "**`onlyDirectRoutes`** — `\"true\"` skips multi-hop routes, allowing only direct swaps between the input and output mint.",
     "**`addSizeConstraint`** — `\"true\"` returns only quotes that fit inside the transaction size limit.",
     "**`sizeConstraint`** — a custom maximum transaction size in bytes. Values are clamped to the maximum of the requested transaction format: 1232 bytes for V0 and 4096 bytes for V1.",
     "**`accountsLimitTotal`** — a cap on the total number of accounts a route can use. Transaction V1 allows no more than 64 addresses, so larger values are clamped down.",
     "**`accountsLimitWritable`** — the most writable accounts a route may use. Default: 64.",
     "**`meshSize`** — replaces the mesh size that is written into the swap instruction of dynamic-allocation routes; accepts `1` to `255`. On-chain, the optimizer divides each venue group's input into `meshSize` pieces, so a lower value gives a rougher split and costs fewer compute units. **Titan DART is the only provider that applies it; the others disregard it.**",
     "**`transactionTemplate`** — a [`TransactionTemplate`](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#transaction-template) encoded with **MessagePack and then Base64**, passed as a query-string value. Space is set aside in the transaction for instructions and ALTs that you add yourself, and routes are sized to fit next to them. **Cannot be combined with `accountsLimitTotal`, `accountsLimitWritable` or `sizeConstraint`.**"
    ]
   },
   {
    "t": "h3",
    "text": "Transaction options"
   },
   {
    "t": "list",
    "items": [
     "**`feeAccount`** — token account that collects platform fees (base58). **It must already exist on-chain.**",
     "**`feeBps`** — fee in basis points, at most `10000` (100%). Larger values are rejected and no quotes come back.",
     "**`feeFromInputMint`** — `\"true\"` takes the fee from the input mint. Default: `\"false\"` (fee comes from the output mint).",
     "**`closeInputTokenAccount`** — `\"true\"` closes the input token account as part of the transaction.",
     "**`createOutputTokenAccount`** — `\"true\"` adds an idempotent ATA creation instruction.",
     "**`outputAccount`** — an optional custom token account (base58) to receive the output; falls back to the user's ATA.",
     "**`transactionFormat`** — `\"0\"` for a versioned v0 transaction (default) or `\"1\"` for Agave 4.2 Transaction V1. Candidate routes are sized for whichever format you choose. V1 permits up to 4096 bytes, lacks ALT support and needs `titanSwapVersion=3`.",
     "**`outputWsol`** — `\"true\"` keeps the output as **wrapped SOL** (the wSOL SPL token) and skips the conversion to native SOL. The default is `\"false\"`, which unwraps the output to native SOL. **It has an effect only if `outputMint` is wSOL** (`So11111111111111111111111111111111111111112`) and any other output mint ignores it. Turn it on if whatever you do next needs a wSOL token account rather than native lamports. **Requires `titanSwapVersion=3`.**",
     "**`payer`** (base58) — a distinct account that covers the swap's SOL-denominated costs: network fees and the rent for any ATA the router creates (the wSOL wrap ATA and the output ATA). It also receives the rent refund once the wSOL ATA is closed. **The transaction will not land unless the payer signs it along with the user.** **Requires `titanSwapVersion=3`.**",
     "**`positiveSlippageFeeReceiver`** (base58) — the token account that is paid any surplus when the output actually realized on the DEX exceeds the quoted `outAmount`. **At most 10 bps of `outAmount` is taken**; whatever exceeds that remains with the user. **The account has to hold the `outputMint`**: passing a wallet pubkey, or a token account for another mint, makes the transaction fail when it executes. To route the surplus to a specific wallet, supply that wallet's ATA for `outputMint`, and create it beforehand, since the router will not. **Requires `titanSwapVersion=3`.**"
    ]
   },
   {
    "t": "h3",
    "text": "V3 router"
   },
   {
    "t": "list",
    "items": [
     "**`titanSwapVersion`** — `\"2\"` keeps you on the V2 router. Titan returns V3 by default. Details are in [NewSwapQuoteStream → Swap V3](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#swap-v3)."
    ]
   },
   {
    "t": "callout",
    "tone": "warning",
    "text": "**Transaction V1 only works if the cluster you submit to has the Agave 4.2 feature set active.** `transactionFormat` is used by Titan purely for sizing routes; activation is not verified. Stay on `transactionFormat=0` until you have confirmed activation. Pairing `transactionFormat=1` with `titanSwapVersion=2` gets the request rejected, but you may leave `titanSwapVersion` out and Titan will settle on V3."
   },
   {
    "t": "h3",
    "text": "Performance options"
   },
   {
    "t": "list",
    "items": [
     "**`simulate`** — `\"true\"` (default) or `\"false\"`. A simulated quote is more likely to execute and ends up with tighter realized slippage, since the server ran the route against live on-chain state first. **`\"false\"` skips simulation**, trading that pre-flight check for a clear drop in latency, as one RPC round-trip is avoided.",
     "**`maxPriceDeviationBps`** — the largest accepted deviation from the reference price, in basis points. Default: `1000` (10%). **Use `10000` or more to switch price checking off completely.**"
    ]
   },
   {
    "t": "h3",
    "text": "Response options"
   },
   {
    "t": "list",
    "items": [
     "**`includeAltContents`** — `\"true\"` puts the full Address Lookup Table accounts in the response's `alts` field. Default `\"false\"`; when omitted or `\"false\"`, each route gives only the ALT keys in `addressLookupTables`."
    ]
   },
   {
    "t": "h2",
    "text": "Simulation & price checking"
   },
   {
    "t": "p",
    "text": "Quotes are **simulated before they reach you** unless you say otherwise, which confirms they run against current on-chain state. The result is **dependable execution and tighter realized slippage**, because the route was already checked with the freshest account data. With `simulate=false` that step is skipped and **latency drops considerably**, since a full set of RPC calls goes away; the cost is losing the pre-flight check."
   },
   {
    "t": "p",
    "text": "To protect quotes that skip simulation, the server follows **reference prices** for the tokens you ask about and verifies that returned quotes fall in a sensible range. `maxPriceDeviationBps` sets that threshold:"
   },
   {
    "t": "list",
    "items": [
     "**Default (`1000` / 10%)** — quotes must deliver at least 90% of the value implied by reference rates. This rejects obviously bad quotes without being too strict.",
     "**`10000` or higher (at least 100%)** — price checking is **disabled entirely**."
    ]
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "So that it adds no latency, the price check **fails open**: if the server lacks fresh price data for both tokens (for example the first time a given token is quoted), quotes go through unchecked."
   },
   {
    "t": "h2",
    "text": "Response"
   },
   {
    "t": "p",
    "text": "**Responses from a distributor come back as MessagePack.** Send `Accept: application/vnd.msgpack` as a request header. On the Developers Portal you can send `Accept: application/json` to get JSON instead."
   },
   {
    "t": "p",
    "text": "The response is a [`SwapQuotes`](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#stream-updates) object, **identical to what Titan Direct streams in its updates.** Inside is a `quotes` map indexed by provider ID, and each entry is a [`SwapRoute`](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#stream-updates) that holds the instructions and the address lookup table keys."
   },
   {
    "t": "p",
    "text": "With `includeAltContents=true`, the top-level [`alts`](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#alt-contents) array contains the complete Address Lookup Table accounts behind the returned routes, which spares you from fetching every table before you compile."
   },
   {
    "t": "callout",
    "tone": "warning",
    "text": "**`quotes` is a map, not an array.** A provider may be absent from any response, so loop with `Object.entries`."
   },
   {
    "t": "h3",
    "text": "`metadata.ExpectedWinner`"
   },
   {
    "t": "p",
    "text": "The response has a `metadata` object with an `ExpectedWinner` field, **which is Titan's pick for the best slippage-adjusted route.**"
   },
   {
    "t": "code",
    "code": "{\n  \"metadata\": {\n    \"ExpectedWinner\": \"Titan-DART\"\n  },\n  \"quotes\": { ... }\n}",
    "lang": "json"
   },
   {
    "t": "p",
    "text": "Raw `outAmount` ignores slippage, execution quality and on-chain conditions, so do not sort by it. **Choose the route named by `metadata.ExpectedWinner`, which Titan expects to execute best in practice.** The routing engine decides the winner after weighing simulation results, slippage estimates and route reliability."
   },
   {
    "t": "h2",
    "text": "Example"
   },
   {
    "t": "code",
    "code": "import { Decoder } from '@msgpack/msgpack';\n\n// useBigInt64 required — amounts and timestamps are u64\nconst decoder = new Decoder({ useBigInt64: true });\n\n// 1 SOL → USDC swap quote\nconst params = new URLSearchParams({\n  inputMint: 'So11111111111111111111111111111111111111112',   // SOL\n  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC\n  amount: '1000000000',          // 1 SOL in lamports\n  userPublicKey: 'YOUR_WALLET_PUBLIC_KEY',\n  slippageBps: '50',             // 0.5% slippage tolerance\n});\n\n// Request swap quotes from Gateway\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/quote/swap?${params}`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack', // Required for MessagePack response\n    },\n  }\n);\n\nif (!res.ok) {\n  throw new Error(`${res.status}: ${res.statusText}`);\n}\n\n// Decode the MessagePack response\nconst buffer = await res.arrayBuffer();\nconst quotes = decoder.decode(new Uint8Array(buffer)) as any;\n\n// Use metadata.ExpectedWinner to pick the best slippage-adjusted route\nconst winner = quotes.metadata?.ExpectedWinner;\nconst route = winner && quotes.quotes[winner];\n\nif (route?.instructions?.length) {\n  console.log(`Best route: ${winner} — ${route.outAmount} out`);\n  // route.instructions and route.addressLookupTables are ready for transaction building\n}",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "Error responses"
   },
   {
    "t": "list",
    "items": [
     "**`400`** — **Invalid parameters.** A pubkey that is malformed, a required field that is missing, or a value that is out of bounds.",
     "**`401`** — **Credential absent or rejected.** Verify the JWT and its claims (distributor) or the `x-api-key` (Developers Portal).",
     "**`404`** — **No routes found** for this pair. Loosen the routing constraints (`dexes`, `excludeDexes`, `onlyDirectRoutes`)."
    ]
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) — the Direct (WebSocket) equivalent, with live updates and the full `SwapQuotes` / `SwapRoute` type definitions",
     "[Quote Price](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-price) — a slim endpoint that returns only a price, with no instructions",
     "[Fee Collection](/titan/docs/developer-doc/swap-api/guides/fee-collection) — take a platform fee through `feeAccount` and `feeBps`",
     "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing) — approaches to limiting venues and providers"
    ]
   }
  ],
  "lead": "Request swap quotes with executable instructions via REST."
 },
 "swap-api/reference/gateway/gateway-quote-price": {
  "blocks": [
   {
    "t": "p",
    "text": "**Returns a price quote with no instructions or transaction data.** Use it to **display prices** without paying for executable transactions. It is the Gateway counterpart of [GetSwapPrice](/titan/docs/developer-doc/swap-api/reference/direct/get-swap-price)."
   },
   {
    "t": "code",
    "code": "GET /api/v1/quote/price",
    "lang": "http"
   },
   {
    "t": "p",
    "text": "**Authentication** — send an `Authorization: Bearer <token>` header or a `?auth=<token>` query parameter. JWT details are in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#authentication)."
   },
   {
    "t": "h2",
    "text": "Query parameters"
   },
   {
    "t": "h3",
    "text": "Required"
   },
   {
    "t": "list",
    "items": [
     "**`inputMint`** — mint address (base58) of the token being sold.",
     "**`outputMint`** — mint address (base58) of the token being bought.",
     "**`amount`** — the amount expressed in the token's smallest unit, e.g. lamports for SOL. **Do not apply decimals.**"
    ]
   },
   {
    "t": "h3",
    "text": "Routing options"
   },
   {
    "t": "list",
    "items": [
     "**`dexes`** — comma-separated venue labels to **include**. Valid labels come from [GetVenues](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-info#venues).",
     "**`excludeDexes`** — venue labels to **leave out**, separated by commas."
    ]
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "This endpoint **does not** accept `userPublicKey`, `feeAccount` or any other transaction-related parameter. For executable swap data, use [Quote Swap](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap)."
   },
   {
    "t": "h2",
    "text": "Response"
   },
   {
    "t": "p",
    "text": "**The body of the response is MessagePack.** Include `Accept: application/vnd.msgpack` among the request headers."
   },
   {
    "t": "p",
    "text": "The response is a [`SwapPrice`](/titan/docs/developer-doc/swap-api/reference/direct/get-swap-price) object, **the same type the Titan Direct `GetSwapPrice` RPC method returns.** The full type definition is on the [GetSwapPrice](/titan/docs/developer-doc/swap-api/reference/direct/get-swap-price) page."
   },
   {
    "t": "h2",
    "text": "Example"
   },
   {
    "t": "code",
    "code": "import { Decoder } from '@msgpack/msgpack';\n\n// useBigInt64 required — amounts are u64\nconst decoder = new Decoder({ useBigInt64: true });\n\n// 1 SOL → USDC price check\nconst params = new URLSearchParams({\n  inputMint: 'So11111111111111111111111111111111111111112',   // SOL\n  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC\n  amount: '1000000000', // 1 SOL in lamports\n});\n\n// Fetch price from Gateway\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/quote/price?${params}`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack', // Required for MessagePack response\n    },\n  }\n);\n\nif (!res.ok) {\n  throw new Error(`${res.status}: ${res.statusText}`);\n}\n\n// Decode the MessagePack response\nconst buffer = await res.arrayBuffer();\nconst price = decoder.decode(new Uint8Array(buffer)) as any;\n\nconsole.log('Output amount:', price.amountOut);",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "Error responses"
   },
   {
    "t": "list",
    "items": [
     "**`400`** — **Invalid parameters.** A pubkey that is malformed, a required field that is missing, or a value that is out of bounds.",
     "**`401`** — **Authentication token absent or rejected.** Verify the JWT and its claims. Only distributors can call this endpoint, so an `x-api-key` will not work here.",
     "**`404`** — **No routes found** for this pair. Loosen the routing constraints."
    ]
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[Quote Swap](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap) — the complete quote, including instructions you can sign and submit",
     "[GetSwapPrice](/titan/docs/developer-doc/swap-api/reference/direct/get-swap-price) — the WebSocket counterpart under Direct; it returns the same `SwapPrice` type",
     "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing) — ways to narrow venues with `dexes` and `excludeDexes`"
    ]
   }
  ],
  "lead": "Get a price-only quote via REST without transaction data."
 },
 "swap-api/reference/gateway/gateway-info": {
  "blocks": [
   {
    "t": "p",
    "text": "**Three light endpoints that expose server configuration and let you discover the available venues and providers.** Each is a simple GET you can call whenever you like."
   },
   {
    "t": "p",
    "text": "**Every response from a distributor is MessagePack.** Add `Accept: application/vnd.msgpack` to the request headers. The [Developers Portal](/titan/docs/developer-doc/developers-portal/reference/info-venues-providers) serves the same endpoints too: it returns JSON when you send `Accept: application/json` and authenticates with `x-api-key`."
   },
   {
    "t": "p",
    "text": "**Authentication** — send an `Authorization: Bearer <token>` header or a `?auth=<token>` query parameter. JWT details are in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection#authentication)."
   },
   {
    "t": "h2",
    "text": "Info"
   },
   {
    "t": "code",
    "code": "GET /api/v1/info",
    "lang": "http"
   },
   {
    "t": "p",
    "text": "**Returns server settings, the protocol version and the bounds of configurable parameters.** It is the REST counterpart of [GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info). Call it to learn the defaults and limits you need when configuring swap requests."
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "The complete `ServerInfo` type definitions, including `VersionInfo`, `ServerSettings`, `BoundedValueWithDefault` and every sub-type, are on the [GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info) reference page."
   },
   {
    "t": "h3",
    "text": "Example",
    "id": "info-example"
   },
   {
    "t": "code",
    "code": "import { Decoder } from '@msgpack/msgpack';\n\n// useBigInt64 required — 64-bit integer fields (amounts, timestamps)\nconst decoder = new Decoder({ useBigInt64: true });\n\n// Fetch server info from the Gateway REST endpoint\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/info`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\n\n// Decode the MessagePack response\nconst info = decoder.decode(new Uint8Array(await res.arrayBuffer())) as any;\n\n// Protocol version — major changes are backwards-incompatible\nconsole.log('Protocol version:', info.protocolVersion);\n\n// Quote stream settings — use these bounds when configuring requests\nconsole.log('Default update interval:', info.settings.quoteUpdate.intervalMs.default, 'ms');",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "Venues"
   },
   {
    "t": "code",
    "code": "GET /api/v1/venues",
    "lang": "http"
   },
   {
    "t": "p",
    "text": "**Lists the on-chain venues that routing can use.** Any returned label can be passed to the `dexes` and `excludeDexes` query parameters of [Quote Swap](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap) and [Quote Price](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-price)."
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "The complete `VenueInfo` type definitions are on the [GetVenues / ListProviders](/titan/docs/developer-doc/swap-api/reference/direct/venues-providers) reference page."
   },
   {
    "t": "h3",
    "text": "Query parameters",
    "id": "venues-query-parameters"
   },
   {
    "t": "list",
    "items": [
     "**`includeProgramIds`** — `\"true\"` adds the Solana program ID of each venue."
    ]
   },
   {
    "t": "h3",
    "text": "Example",
    "id": "venues-example"
   },
   {
    "t": "code",
    "code": "// Fetch all available venues with their on-chain program IDs\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/venues?includeProgramIds=true`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\n\n// Decode and inspect the venue list\nconst venues = decoder.decode(new Uint8Array(await res.arrayBuffer())) as any;\nconsole.log('Available venues:', venues.labels);\n// e.g. ['Raydium', 'Whirlpool', 'Phoenix', 'Meteora', ...]",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "Providers"
   },
   {
    "t": "code",
    "code": "GET /api/v1/providers",
    "lang": "http"
   },
   {
    "t": "p",
    "text": "**Lists the quote providers currently active.** Each `id` can be used in the `providers` query parameter of [Quote Swap](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap). Each provider works independently, competing to come up with the best-priced route."
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "The complete `ProviderInfo` and `ProviderKind` type definitions are on the [GetVenues / ListProviders](/titan/docs/developer-doc/swap-api/reference/direct/venues-providers) reference page."
   },
   {
    "t": "h3",
    "text": "Query parameters",
    "id": "providers-query-parameters"
   },
   {
    "t": "list",
    "items": [
     "**`includeIcons`** — `\"true\"` adds a 48×48 icon URI for each provider."
    ]
   },
   {
    "t": "h3",
    "text": "Example",
    "id": "providers-example"
   },
   {
    "t": "code",
    "code": "// Fetch all active quote providers\nconst res = await fetch(\n  `${process.env.TITAN_ENDPOINT}/api/v1/providers`,\n  {\n    headers: {\n      'Authorization': `Bearer ${process.env.TITAN_JWT}`,\n      'Accept': 'application/vnd.msgpack',\n    },\n  }\n);\n\n// Decode and iterate over the provider list\nconst providers = decoder.decode(new Uint8Array(await res.arrayBuffer())) as any[];\nfor (const p of providers) {\n  console.log(`${p.name} (${p.id}) — ${p.kind}`);\n  // e.g. \"Titan (Titan) — DexAggregator\"\n}",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "Error responses"
   },
   {
    "t": "list",
    "items": [
     "**`400`** — **Invalid parameters.** A malformed query parameter value.",
     "**`401`** — **Credential absent or rejected.** Verify the JWT and its claims (distributor) or the `x-api-key` (Developers Portal)."
    ]
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info) — the Direct (WebSocket) equivalent, with the full `ServerInfo` type definitions",
     "[GetVenues / ListProviders](/titan/docs/developer-doc/swap-api/reference/direct/venues-providers) — the WebSocket-based Direct versions, including complete `VenueInfo` and `ProviderInfo` definitions",
     "[Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing) — apply venue and provider IDs to steer which routes get quoted",
     "[Titan Direct vs Titan Gateway](/titan/docs/developer-doc/swap-api/reference/direct-vs-gateway) — deciding whether WebSocket or REST suits you"
    ]
   }
  ],
  "lead": "Server info, venues, and providers via REST."
 },
 "swap-api/reference/types": {
  "blocks": [
   {
    "t": "p",
    "text": "Every type definition sits inline on the page where it is used. This page is just an index to help you jump to them."
   },
   {
    "t": "p",
    "text": "**Field names are `camelCase` on the wire (MessagePack) unless stated otherwise.** Rust SDK types use `snake_case` with serde renaming."
   },
   {
    "t": "h2",
    "text": "Wire protocol & common types"
   },
   {
    "t": "p",
    "text": "Defined on [Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol):"
   },
   {
    "t": "list",
    "items": [
     "**`Pubkey`** — Solana public key held as 32 raw bytes",
     "**`AccountMeta`** — short-form description of an account used by an instruction (`p`, `s`, `w`)",
     "**`Instruction`** — a single program call to run on-chain (`p`, `a`, `d`)",
     "**`SwapMode`** — either `ExactIn` or `ExactOut`",
     "**`ClientRequest`** — wrapper around each client request, carrying `id` and `data`",
     "**`ServerMessage`** — one of `Response`, `Error`, `StreamData`, `StreamEnd`",
     "**`ResponseSuccess`** / **`ResponseError`** — the shapes of a successful reply and of a failed one",
     "**`StreamData`** / **`StreamEnd`** / **`StreamStart`** — types covering the start, data and end of a stream"
    ]
   },
   {
    "t": "h2",
    "text": "Server info types"
   },
   {
    "t": "p",
    "text": "These come from [GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info):"
   },
   {
    "t": "list",
    "items": [
     "**`ServerInfo`** — the protocol version plus the server settings",
     "**`VersionInfo`** — `major`, `minor`, `patch`",
     "**`ServerSettings`** — settings grouped under quote update, swap, transaction and connection",
     "**`BoundedValueWithDefault<T>`** — `min`, `max`, `default`",
     "**`QuoteUpdateSettings`** / **`SwapSettings`** / **`TransactionSettings`** / **`ConnectionSettings`**"
    ]
   },
   {
    "t": "h2",
    "text": "Request types"
   },
   {
    "t": "p",
    "text": "Defined on [NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream):"
   },
   {
    "t": "list",
    "items": [
     "**`SwapQuoteRequest`** — `swap` + `transaction` + `update`",
     "**`SwapParams`** — input and output mints, amount, slippage, routing filters",
     "**`TransactionParams`** — wallet key, fee configuration, token account options",
     "**`TransactionFormat`** — numeric `V0` / `V1` selector for the transaction wire format",
     "**`TransactionConfigParams`** — compute-budget values set at the transaction level, used by Transaction V1 templates",
     "**`TransactionTemplate`** — what Titan uses to size a route: instructions, ALTs, account metas and, optionally, the V1 transaction config",
     "**`QuoteUpdateParams`** — how often the stream updates and how many quotes it returns"
    ]
   },
   {
    "t": "h2",
    "text": "Quote & stream data types"
   },
   {
    "t": "p",
    "text": "Defined on [NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream#stream-updates):"
   },
   {
    "t": "list",
    "items": [
     "**`SwapQuotes`** — a batch of quotes with a provider-keyed `quotes` map",
     "**`SwapRoute`** — one route with instructions, ALTs, expiry and compute budget",
     "**`RoutePlanStep`** — one hop of a multi-step route",
     "**`PlatformFee`** — `amount` and `fee_bps`"
    ]
   },
   {
    "t": "h2",
    "text": "Discovery types"
   },
   {
    "t": "p",
    "text": "These come from [GetVenues / ListProviders](/titan/docs/developer-doc/swap-api/reference/direct/venues-providers):"
   },
   {
    "t": "list",
    "items": [
     "**`VenueInfo`** — a venue's label, plus its program IDs when present",
     "**`ProviderInfo`** — a provider's id, name and kind, with an icon if it has one",
     "**`ProviderKind`** — `\"DexAggregator\"` or `\"RFQ\"`"
    ]
   },
   {
    "t": "h2",
    "text": "Stop stream types"
   },
   {
    "t": "p",
    "text": "Defined on [StopStream](/titan/docs/developer-doc/swap-api/reference/direct/stop-stream):"
   },
   {
    "t": "list",
    "items": [
     "**`StopStreamRequest`** — the ID of the stream to stop",
     "**`StopStreamResponse`** — the confirmed stream ID"
    ]
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol) — how messages are encoded, the shared types and the envelope variants",
     "[Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection) — opening the WebSocket and authenticating",
     "[NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) — types for the request, its response and the streamed data",
     "[GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info) — types describing server info and settings",
     "[GetVenues / ListProviders](/titan/docs/developer-doc/swap-api/reference/direct/venues-providers) — types for venue and provider discovery",
     "[StopStream](/titan/docs/developer-doc/swap-api/reference/direct/stop-stream) — types used to end a stream"
    ]
   }
  ],
  "lead": "Quick reference index for all Titan API types — links to the page where each type is defined."
 },
 "swap-api/reference/wire-protocol": {
  "blocks": [
   {
    "t": "p",
    "text": "Here you will find how data is encoded for transmission: the serialization format, the encoding conventions and the types common to all Titan API messages."
   },
   {
    "t": "p",
    "text": "**MessagePack binary is the sole encoding for Titan Direct and for Titan Gateway endpoints served by a distributor.** The [Developers Portal](/titan/docs/developer-doc/developers-portal/introduction) is able to respond with JSON as well if you send `Accept: application/json`."
   },
   {
    "t": "h2",
    "text": "Data format"
   },
   {
    "t": "p",
    "text": "All messages are serialized as **MessagePack**."
   },
   {
    "t": "list",
    "items": [
     "**Objects and structs are encoded as maps.** That lets new fields be added without breaking older versions.",
     "**Field names are `camelCase`** unless stated otherwise.",
     "**Integers use the smallest MessagePack int type** that holds the value.",
     "**Use `BigInt` for `u64` values** (amounts, timestamps). Above 2^53 they lose precision as float64, and the server rejects them."
    ]
   },
   {
    "t": "h2",
    "text": "Optional data"
   },
   {
    "t": "p",
    "text": "Optional values are typed `Option<T>` in Rust and `T?` or `T | null` in TypeScript."
   },
   {
    "t": "p",
    "text": "**An optional field in an object can simply be absent from the serialized map.** When it is not omitted, a missing optional value is written as `nil` (`0xc0`), which becomes `None` in Rust and `null` in TypeScript."
   },
   {
    "t": "h2",
    "text": "Simple enumerations"
   },
   {
    "t": "p",
    "text": "Simple enumerations, meaning those with no associated data, are **encoded as strings that match the variant name exactly**:"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "enum SwapMode {\n  ExactIn,\n  ExactOut,\n}\n// Encoded as: \"ExactIn\" or \"ExactOut\""
     },
     {
      "label": "TypeScript",
      "code": "enum SwapMode {\n  ExactIn = \"ExactIn\",\n  ExactOut = \"ExactOut\",\n}"
     }
    ]
   },
   {
    "t": "h2",
    "text": "Complex enumerations"
   },
   {
    "t": "p",
    "text": "Complex enumerations, meaning those with associated data, are **encoded as single-entry maps** from the variant name to its data."
   },
   {
    "t": "list",
    "items": [
     "One associated item: the value is that item.",
     "Several associated items: the value is an array."
    ]
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct Request2Data {\n  id: u32,\n  amount: u64,\n}\n\nenum Complex {\n  Request1(String),\n  Request2(Request2Data),\n  Request3(u32, u32),\n}\n\n// Valid encodings (shown as JSON for readability):\n// { \"Request1\": \"hello\" }\n// { \"Request2\": {\"id\": 1, \"amount\": 34} }\n// { \"Request3\": [3, 4] }"
     },
     {
      "label": "TypeScript",
      "code": "interface Request2Data {\n  id: number;\n  amount: number;\n}\n\ntype Complex =\n  | { Request1: string }\n  | { Request2: Request2Data }\n  | { Request3: [number, number] };"
     }
    ]
   },
   {
    "t": "p",
    "text": "The same pattern applies to client requests (`RequestData`) and to server messages (`ServerMessage`). **Identify the message by checking which key the top-level map contains.**"
   },
   {
    "t": "h2",
    "text": "Binary data"
   },
   {
    "t": "p",
    "text": "Raw binary values are written with the MessagePack `bin` formats."
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "// Variable-sized byte array\nVec<u8>\n// Fixed-size byte array (N bytes)\n[u8; N]"
     },
     {
      "label": "TypeScript",
      "code": "// Binary data in TypeScript\nUint8Array\n// or\nArrayBuffer"
     }
    ]
   },
   {
    "t": "p",
    "text": "TypeScript cannot express a byte array's size, so check the Rust types for size constraints."
   },
   {
    "t": "h2",
    "text": "Common types"
   },
   {
    "t": "h3",
    "text": "Pubkey"
   },
   {
    "t": "p",
    "text": "**Solana public keys are 32 bytes of binary data.** They use MessagePack `bin 8`, so every pubkey begins with `c4 20` followed by the 32 key bytes."
   },
   {
    "t": "p",
    "text": "Example, the WSOL public key `So11111111111111111111111111111111111111112`:"
   },
   {
    "t": "code",
    "code": "c4 20 069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001",
    "lang": "text"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "// Type alias for public keys\ntype Pubkey = [u8; 32];"
     },
     {
      "label": "TypeScript",
      "code": "// Type alias for public keys to differentiate from other binary data\ntype Pubkey = Uint8Array; // 32 bytes"
     }
    ]
   },
   {
    "t": "h3",
    "text": "AccountMeta"
   },
   {
    "t": "p",
    "text": "A compact account descriptor used inside instructions. **It uses single-letter field names to keep messages small.**"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct AccountMeta {\n  p: Pubkey, // public key\n  s: bool,   // is_signer\n  w: bool,   // is_writable\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface AccountMeta {\n  p: Pubkey;  // public key\n  s: boolean; // is_signer\n  w: boolean; // is_writable\n}"
     }
    ]
   },
   {
    "t": "h3",
    "text": "Instruction"
   },
   {
    "t": "p",
    "text": "One on-chain instruction. **It also uses single-letter field names for compactness.**"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct Instruction {\n  p: Pubkey,           // program_id\n  a: Vec<AccountMeta>, // accounts\n  d: Vec<u8>,          // data\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface Instruction {\n  p: Pubkey;        // program_id\n  a: AccountMeta[]; // accounts\n  d: Uint8Array;    // data\n}"
     }
    ]
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "**`AccountMeta` and `Instruction` use the single-letter field names `p`, `s`, `w`, `a` and `d` to shrink payloads.** They belong to Titan's wire format and are not abbreviations of the standard Solana SDK types."
   },
   {
    "t": "h2",
    "text": "Message envelope types"
   },
   {
    "t": "h3",
    "text": "ClientRequest"
   },
   {
    "t": "p",
    "text": "Every client request wraps an RPC method call together with a monotonically increasing `id`."
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "struct ClientRequest {\n  /// Request ID, echoed in the server's response.\n  id: u32,\n  /// One of the RPC method variants.\n  data: RequestData,\n}\n\nenum RequestData {\n  GetInfo(GetInfoRequest),\n  NewSwapQuoteStream(SwapQuoteRequest),\n  StopStream(StopStreamRequest),\n  GetVenues(GetVenuesRequest),\n  ListProviders(ListProvidersRequest),\n  GetSwapPrice(SwapPriceRequest),\n}"
     },
     {
      "label": "TypeScript",
      "code": "interface ClientRequest {\n  // Request ID, echoed in the server's response.\n  id: number;\n  // One of the RPC method variants.\n  data: RequestData;\n}\n\ntype RequestData =\n  | { GetInfo: GetInfoRequest }\n  | { NewSwapQuoteStream: SwapQuoteRequest }\n  | { StopStream: StopStreamRequest }\n  | { GetVenues: GetVenuesRequest }\n  | { ListProviders: ListProvidersRequest }\n  | { GetSwapPrice: SwapPriceRequest };"
     }
    ]
   },
   {
    "t": "h3",
    "text": "ServerMessage"
   },
   {
    "t": "p",
    "text": "**The server sends one of four message types:**"
   },
   {
    "t": "codeTabs",
    "tabs": [
     {
      "label": "Rust",
      "code": "/// A message sent by the server to the client.\nenum ServerMessage {\n  /// Successful response to a request, may optionally start a stream.\n  Response(ResponseSuccess),\n  /// An error response to a request.\n  Error(ResponseError),\n  /// Data for a stream.\n  StreamData(StreamData),\n  /// Notification that a stream has ended.\n  StreamEnd(StreamEnd),\n}\n\n/// A successful response.\nstruct ResponseSuccess {\n  /// Identifier of the request that triggered this response.\n  requestId: u32,\n  /// The response data.\n  data: ResponseData,\n  /// If this request starts a new stream, contains stream info.\n  stream: Option<StreamStart>,\n}\n\n/// An error response.\nstruct ResponseError {\n  /// Identifier of the request that triggered this response.\n  requestId: u32,\n  /// A numeric error code.\n  code: u32,\n  /// A message describing the error.\n  message: String,\n}\n\n/// Data packet for a stream.\nstruct StreamData {\n  /// ID of the stream.\n  id: u32,\n  /// Sequence number of this data packet.\n  seq: u32,\n  /// Data payload.\n  payload: StreamDataPayload,\n}\n\n/// Notification that a stream has closed.\nstruct StreamEnd {\n  /// ID of the stream that has ended.\n  id: u32,\n  /// Error code, if the stream ended abnormally.\n  errorCode: Option<u32>,\n  /// Error message, if the stream ended abnormally.\n  errorMessage: Option<String>,\n}\n\n/// Notification that a new stream has been started.\nstruct StreamStart {\n  /// Stream ID — present in all StreamData and StreamEnd for this stream.\n  id: u32,\n  /// Type of data that will be sent in this stream.\n  dataType: StreamDataType,\n}\n\nenum StreamDataType {\n  SwapQuotes,\n  // May be expanded in the future.\n}\n\nenum StreamDataPayload {\n  SwapQuotes(SwapQuotes),\n  // May be expanded in the future.\n}\n\nenum ResponseData {\n  GetInfo(ServerInfo),\n  NewSwapQuoteStream(QuoteSwapStreamResponse),\n  StreamStopped(StopStreamResponse),\n  GetVenues(VenueInfo),\n  ListProviders(Vec<ProviderInfo>),\n  GetSwapPrice(SwapPrice),\n}"
     },
     {
      "label": "TypeScript",
      "code": "type ServerMessage =\n  | { Response: ResponseSuccess }\n  | { Error: ResponseError }\n  | { StreamData: StreamData }\n  | { StreamEnd: StreamEnd };\n\ninterface ResponseSuccess {\n  // Identifier of the request that triggered this response.\n  requestId: number;\n  // The response data.\n  data: ResponseData;\n  // If the request started a new stream, contains stream info.\n  stream?: StreamStart;\n}\n\ninterface ResponseError {\n  // Identifier of the request that triggered this response.\n  requestId: number;\n  // A numeric error code.\n  code: number;\n  // A message describing the error.\n  message: string;\n}\n\ninterface StreamData {\n  // ID of the stream.\n  id: number;\n  // Sequence number of this data packet.\n  seq: number;\n  // Data payload.\n  payload: StreamDataPayload;\n}\n\ninterface StreamEnd {\n  // ID of the stream that has ended.\n  id: number;\n  // Error code, if the stream ended abnormally.\n  errorCode?: number;\n  // Error message, if the stream ended abnormally.\n  errorMessage?: string;\n}\n\ninterface StreamStart {\n  // Stream ID.\n  id: number;\n  // Type of data that will be sent in this stream.\n  dataType: StreamDataType;\n}\n\nenum StreamDataType {\n  SwapQuotes = \"SwapQuotes\",\n}\n\ntype StreamDataPayload = { SwapQuotes: SwapQuotes };\n\ntype ResponseData =\n  | { GetInfo: ServerInfo }\n  | { NewSwapQuoteStream: QuoteSwapStreamResponse }\n  | { StreamStopped: StopStreamResponse }\n  | { GetVenues: VenueInfo }\n  | { ListProviders: ProviderInfo[] }\n  | { GetSwapPrice: SwapPrice };"
     }
    ]
   },
   {
    "t": "h2",
    "text": "Compression"
   },
   {
    "t": "p",
    "text": "Compression wraps the MessagePack payload. The order of operations is:"
   },
   {
    "t": "p",
    "text": "**Sending:** serialize to MessagePack, compress, then send as a binary WebSocket frame"
   },
   {
    "t": "p",
    "text": "**Receiving:** receive the binary frame, decompress, then deserialize from MessagePack"
   },
   {
    "t": "p",
    "text": "The compression scheme is negotiated once, when the connection is made. Protocol strings and setup are in [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection)."
   },
   {
    "t": "h2",
    "text": "Gateway differences"
   },
   {
    "t": "p",
    "text": "Titan Gateway applies the identical MessagePack encoding, but over HTTP REST:"
   },
   {
    "t": "list",
    "items": [
     "**Requests** — sent as query parameters, with pubkeys as Base58 strings rather than binary",
     "**Responses** — MessagePack in the body with `Content-Type: application/vnd.msgpack` (distributor); on the Developers Portal you get JSON if `Accept: application/json` is sent",
     "**Pubkeys in responses** remain binary `Uint8Array` values within the MessagePack body"
    ]
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection) — opening the socket, authenticating and negotiating compression",
     "[GetInfo](/titan/docs/developer-doc/swap-api/reference/direct/get-info) — the server's configuration and its protocol version",
     "[NewSwapQuoteStream](/titan/docs/developer-doc/swap-api/reference/direct/new-swap-quote-stream) — live swap quotes over a stream"
    ]
   }
  ],
  "lead": "MessagePack encoding conventions, data types, and serialization rules for Titan's API."
 },
 "swap-api/reference/error-codes": {
  "blocks": [
   {
    "t": "p",
    "text": "When a request fails you receive a `ResponseError` containing a numeric `code` and a human-readable `message`. **Titan Direct** delivers it as the `Error` variant of `ServerMessage`; **Titan Gateway** via a distributor signals failure with an HTTP status code and a MessagePack body. For the Developers Portal's error bodies, `403` and `429` included, see [Developers Portal → Errors](/titan/docs/developer-doc/developers-portal/errors)."
   },
   {
    "t": "h2",
    "text": "Error response format"
   },
   {
    "t": "p",
    "text": "**Titan Direct**"
   },
   {
    "t": "code",
    "code": "{\n  Error: {\n    requestId: number;   // Matches the ID of the original request\n    code: number;        // Numeric error code for programmatic handling\n    message: string;     // Human-readable description for logging/debugging\n  }\n}",
    "lang": "typescript"
   },
   {
    "t": "callout",
    "tone": "info",
    "text": "`message` carries a specific description you can act on. **Branch on `code` in your logic**, and keep `message` for logs and debugging."
   },
   {
    "t": "p",
    "text": "**Titan Gateway**"
   },
   {
    "t": "table",
    "head": [
     "Status",
     "Description"
    ],
    "rows": [
     [
      "`400`",
      "Invalid parameters — a malformed pubkey, a missing required field, or an invalid value."
     ],
     [
      "`401`",
      "Missing or invalid authentication token."
     ],
     [
      "`404`",
      "No routes found for this swap pair."
     ]
    ]
   },
   {
    "t": "h2",
    "text": "Stream errors"
   },
   {
    "t": "p",
    "text": "A stream can finish with an error through the `StreamEnd` message:"
   },
   {
    "t": "code",
    "code": "{\n  StreamEnd: {\n    id: number;              // The stream ID that has ended\n    errorCode?: number;      // Present only if the stream ended due to an error\n    errorMessage?: string;   // Human-readable reason for the error, if any\n  }\n}",
    "lang": "typescript"
   },
   {
    "t": "callout",
    "tone": "warning",
    "text": "A `StreamEnd` **without** `errorCode` is a clean shutdown, for example after `StopStream`. A `StreamEnd` **with** `errorCode` means something went wrong, so read the message."
   },
   {
    "t": "h2",
    "text": "WebSocket close codes"
   },
   {
    "t": "p",
    "text": "The server may close the WebSocket connection with one of these close codes:"
   },
   {
    "t": "list",
    "items": [
     "**`3002`** — **Protocol error.** Either the protocol string offered during negotiation was invalid or unsupported, or the client violated the wire protocol once connected. Connect again with a valid `Sec-WebSocket-Protocol` header.",
     "**`1000`** — Normal closure: the server shut down cleanly.",
     "**`1001`** — Going away: the server is restarting or being taken down for maintenance."
    ]
   },
   {
    "t": "h2",
    "text": "SDK error classes"
   },
   {
    "t": "p",
    "text": "**If you use the** [**`@titanexchange/sdk-ts`**](https://www.npmjs.com/package/@titanexchange/sdk-ts) **TypeScript SDK**, errors are thrown as typed classes that you can catch and inspect:"
   },
   {
    "t": "h3",
    "text": "Connection errors"
   },
   {
    "t": "list",
    "items": [
     "**`ConnectionClosed`** — the WebSocket connection ended unexpectedly. Properties: `code` (the close code), `reason` (the close reason string), `wasClean` (whether it closed cleanly).",
     "**`ConnectionError`** — the WebSocket could not be established or kept alive. Property: `cause` (the underlying error).",
     "**`InvalidProtocolError`** — the server selected a protocol string that is not supported during negotiation. Property: the invalid protocol string."
    ]
   },
   {
    "t": "h3",
    "text": "RPC errors"
   },
   {
    "t": "list",
    "items": [
     "**`ErrorResponse`** — the server returned an error for one request. Properties: `response.code` (numeric error code), `response.message` (readable description), `response.requestId`.",
     "**`StreamError`** — a stream terminated with an error. Properties: `streamId`, `errorCode`, `errorMessage`.",
     "**`ProtocolError`** — the wire protocol was violated. Properties: `reason`, `data`."
    ]
   },
   {
    "t": "h3",
    "text": "Codec errors"
   },
   {
    "t": "list",
    "items": [
     "**`DecodeError`** — a MessagePack message could not be decoded. Properties: `reason`, `value`."
    ]
   },
   {
    "t": "h3",
    "text": "Recommended pattern"
   },
   {
    "t": "code",
    "code": "import { ErrorResponse, StreamError, ConnectionClosed } from '@titanexchange/sdk-ts';\n\ntry {\n  // ... SDK operations\n} catch (err) {\n  if (err instanceof ErrorResponse) {\n    // Server rejected the request — check code for programmatic handling\n    console.error(`RPC error ${err.response.code}: ${err.response.message}`);\n  } else if (err instanceof StreamError) {\n    // Stream ended abnormally — re-open it\n    console.error(`Stream ${err.streamId} error: ${err.errorMessage}`);\n  } else if (err instanceof ConnectionClosed) {\n    // WebSocket dropped — reconnect with backoff\n    console.warn(`Connection closed: code=${err.code}, clean=${err.wasClean}`);\n  }\n}",
    "lang": "typescript"
   },
   {
    "t": "h2",
    "text": "Handling errors"
   },
   {
    "t": "list",
    "items": [
     "**Authentication errors** — make sure the token is valid, still unexpired and contains the JWT claims that are required (`iss`, `sub`, `aud`, `exp`, `iat`). See [Connection & Negotiation](/titan/docs/developer-doc/swap-api/reference/direct/connection).",
     "**Invalid parameters** — verify that pubkeys are well-formed base58, amounts are positive integers and no required field is missing.",
     "**No routes found** — the pair may lack liquidity, or your routing constraints (`dexes`, `excludeDexes`, `onlyDirectRoutes`) may be too tight. **Loosen your filters** before deciding the pair is unsupported.",
     "**Stream errors** — if a stream stops without warning, start a new one. **Stream IDs obtained on an earlier connection no longer work after you reconnect.**"
    ]
   },
   {
    "t": "p",
    "text": "Reconnection patterns are in [Error Handling & Reconnect](/titan/docs/developer-doc/swap-api/guides/error-handling)."
   },
   {
    "t": "h2",
    "text": "Related pages"
   },
   {
    "t": "list",
    "items": [
     "[Error Handling & Reconnect](/titan/docs/developer-doc/swap-api/guides/error-handling) — how to retry, back off and reconnect",
     "[Wire Protocol](/titan/docs/developer-doc/swap-api/reference/wire-protocol) — how messages are wrapped and framed",
     "[Types Reference](/titan/docs/developer-doc/swap-api/reference/types) — a listing of every type definition"
    ]
   }
  ],
  "lead": "Error codes returned by the Titan API."
 }
};
