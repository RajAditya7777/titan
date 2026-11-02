import type { DocContent } from "../schema";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DOCS = "/titan/docs/developer-doc";

/** Page bodies for this section, keyed by slug. Own words; facts exact. */
export const PAGES: Record<string, DocContent> = {
  "swap-api/quickstart": {
    lead: "Get your first swap quote with Titan.",
    blocks: [
      { t: "callout", tone: "info", text: `This quickstart assumes distributor access: a JWT plus an endpoint URL from Triton or QuickNode. If you still need one, see [Get API Access](${DOCS}/getting-started/api-access). If you hold an API key from developer.titan.exchange, follow the [Developers Portal Quickstart](${DOCS}/developers-portal/quickstart) instead.` },
      { t: "p", text: `Below is the smallest possible way to fetch a first quote. For a full integration covering transaction building, signing and error handling, read [Stream & Execute a Swap](${DOCS}/swap-api/guides/stream-and-execute).` },
      { t: "p", text: "Through a distributor you can integrate in two ways. **Titan Direct** is a WebSocket that keeps pushing fresh quotes. **Titan Gateway** is REST and answers each request with one set of quotes. The quotes are equally good either way." },
      { t: "callout", tone: "info", text: "Every swap quote request must include a `userPublicKey`, which is a valid Solana wallet address. The server builds the transaction instructions for that specific wallet." },
      { t: "p", text: `The [\`@titanexchange/sdk-ts\`](${DOCS}/resources/sdk) SDK works with Titan Direct (WebSocket) only.` },
      { t: "h2", text: "Titan Direct" },
      {
        t: "steps",
        items: [
          { title: "Install the SDK", body: "Install the SDK and `bs58` with `npm install @titanexchange/sdk-ts bs58`." },
          { title: "Set your credentials", body: "Export `TITAN_ENDPOINT` (the `wss://YOUR_ENDPOINT/api/v1/ws` URL) and `TITAN_JWT` (your token) as environment variables." },
          { title: "Connect and get a quote", body: "Connect with the JWT in the `auth` query parameter, open a quote stream, and read the first update that contains quotes." },
        ],
      },
      { t: "code", lang: "bash", code: `npm install @titanexchange/sdk-ts bs58` },
      { t: "code", lang: "bash", code: `export TITAN_ENDPOINT="wss://YOUR_ENDPOINT/api/v1/ws"\nexport TITAN_JWT="YOUR_JWT"` },
      {
        t: "code",
        lang: "typescript",
        code: `import { V1Client } from '@titanexchange/sdk-ts';
import bs58 from 'bs58';

const client = await V1Client.connect(
  \`\${process.env.TITAN_ENDPOINT}?auth=\${process.env.TITAN_JWT}\`
);

const { stream } = await client.newSwapQuoteStream({
  swap: {
    inputMint: bs58.decode('${SOL}'),
    outputMint: bs58.decode('${USDC}'),
    amount: BigInt(1_000_000_000), // 1 SOL in lamports
    slippageBps: 50,
  },
  transaction: {
    userPublicKey: bs58.decode('YOUR_WALLET_PUBLIC_KEY'),
  },
});

for await (const update of stream) {
  const quotes = update.quotes;
  if (!Object.keys(quotes).length) continue;

  for (const [provider, route] of Object.entries(quotes as Record<string, any>)) {
    console.log(\`\${provider}: \${route.outAmount} out\`);
  }

  break; // First update received, stop here
}

await client.close();`,
      },
      { t: "h2", text: "Titan Gateway" },
      {
        t: "steps",
        items: [
          { title: "Install dependencies", body: "Install the MessagePack decoder with `npm install @msgpack/msgpack`." },
          { title: "Set your Gateway credentials", body: "Export `TITAN_ENDPOINT` (the `https://YOUR_ENDPOINT` base URL) and `TITAN_JWT` (your token)." },
          { title: "Request a quote", body: "Call `GET /api/v1/quote/swap` with a Bearer token and decode the MessagePack reply." },
        ],
      },
      { t: "code", lang: "bash", code: `npm install @msgpack/msgpack` },
      { t: "code", lang: "bash", code: `export TITAN_ENDPOINT="https://YOUR_ENDPOINT"\nexport TITAN_JWT="YOUR_JWT"` },
      {
        t: "code",
        lang: "typescript",
        code: `import { decode } from '@msgpack/msgpack';

const params = new URLSearchParams({
  inputMint: '${SOL}',
  outputMint: '${USDC}',
  amount: '1000000000', // 1 SOL in lamports
  userPublicKey: 'YOUR_WALLET_PUBLIC_KEY',
  slippageBps: '50',
});

const res = await fetch(
  \`\${process.env.TITAN_ENDPOINT}/api/v1/quote/swap?\${params}\`,
  {
    headers: {
      'Authorization': \`Bearer \${process.env.TITAN_JWT}\`,
      'Accept': 'application/vnd.msgpack',
    },
  }
);

if (!res.ok) throw new Error(\`\${res.status}: \${res.statusText}\`);

const data = decode(new Uint8Array(await res.arrayBuffer())) as any;

for (const [provider, route] of Object.entries(data.quotes as Record<string, any>)) {
  console.log(\`\${provider}: \${route.outAmount} out\`);
}`,
      },
      { t: "h2", text: "What a quote looks like" },
      { t: "p", text: "The reply holds a `quotes` map whose keys are provider IDs such as `\"Titan\"`, `\"Metis\"` and `\"Okx\"`. Each value is a `SwapRoute` carrying everything required to build and submit a transaction:" },
      {
        t: "list",
        items: [
          "**`inAmount`** / **`outAmount`**: the amounts going in and coming out on this route.",
          "**`slippageBps`**: the slippage tolerance this quote was built with.",
          "**`computeUnitsSafe`**: a compute budget recommendation that leaves room for on-chain variance.",
          "**`instructions`**: the swap instructions to place in your transaction.",
          "**`addressLookupTables`**: the lookup table (ALT) addresses you need to compile a V0 transaction.",
          "**Quote expiry**: when a route can expire, `expiresAtMs` is the deadline as a UNIX timestamp in milliseconds and `expiresAfterSlot` is the last slot it is valid for. Check both before executing.",
        ],
      },
      { t: "p", text: "A provider will not always be present. Loop over `Object.entries(quotes)` and pick `quotes[metadata.ExpectedWinner]`, Titan's recommended best route after slippage, instead of sorting by `outAmount`." },
      { t: "h2", text: "Next steps" },
      {
        t: "list",
        items: [
          `[Stream & Execute a Swap](${DOCS}/swap-api/guides/stream-and-execute): the full guide with transaction building, signing and error handling`,
          `[Configure Routing](${DOCS}/swap-api/guides/configure-routing): filter venues and providers and set account limits`,
          `[Authentication](${DOCS}/getting-started/authentication): API key and JWT credentials`,
        ],
      },
    ],
  },

  "swap-api/guides": {
    lead: "Step-by-step guides for common Titan Swap API workflows.",
    blocks: [
      { t: "p", text: `**Hands-on walkthroughs for the most frequent Swap API tasks.** Each one extends the [Quickstart](${DOCS}/swap-api/quickstart) and expects you to already have a working connection.` },
    ],
  },

  "swap-api/reference": {
    lead: "Complete API reference for Titan Direct (WebSocket) and Titan Gateway (REST).",
    blocks: [
      { t: "p", text: `**This section documents each RPC method, endpoint, type and error code across the two Titan interfaces.** Gateway endpoints are also exposed by the [Developers Portal](${DOCS}/developers-portal/reference), which uses API-key authentication and returns JSON. Choose [Titan Direct](${DOCS}/swap-api/reference/direct-vs-gateway) if you need live WebSocket streams, or [Titan Gateway](${DOCS}/swap-api/reference/direct-vs-gateway) if ordinary REST calls are enough. Both are backed by the same Argos routing engine.` },
    ],
  },

  "dart-swap-api/overview": {
    lead: "DART — Dynamically Allocated Real Time Routing for best swap execution on Solana.",
    blocks: [
      { t: "callout", tone: "info", text: "**Beta**: this API is still in its beta phase." },
      { t: "p", text: "Using Titan's **DART (Dynamically Allocated Real Time)** engine, this API serves swap quotes for a fixed list of Solana token pairs." },
      { t: "p", text: "Everything here goes through DART alone, meaning the Titan DART provider is the only router used. Rather than settling the route when the quote is produced, DART re-optimizes the trade at the instant it executes, so execution quality is best at the point that matters." },
      { t: "p", text: "**Base URL:** `https://api.titan.exchange/dart`" },
      { t: "p", text: "Access is free and needs no API key. Responses come back as JSON, the fee is up to 1 bps, and the rate limit is 1 req/sec." },
      { t: "h2", text: "Supported pairs" },
      { t: "p", text: "To fetch the pairs programmatically, call `GET /markets`; the same pairs are listed below." },
      {
        t: "list",
        items: [
          "**SOL and stablecoin routes:** USDT/USDC, SOL/USDT, SOL/USDC",
          "**Wrapped majors:** wETH/USDC, cbBTC/USDC",
          "**Stablecoins:** PYUSD/USDC, USD1/USDC, syrupUSD/USDC, USDG/USDC, CASH/USDC",
          "**Other tokens:** HYPE/USDC, ZEC/USDC, TRUMP/USDC, PENGU/USDC, AAVE/USDC, PUMP/USDC, FARTCOIN/USDC, MEGA/USDC, SPCX/USDC, MU/USDC",
        ],
      },
      { t: "p", text: "`/swap` works for the pairs shown above." },
      { t: "h2", text: "Rate limits & fees" },
      {
        t: "list",
        items: [
          "**1 request per second** for each IP address. Going over returns HTTP 429.",
          "**Up to 1 bps fee** on every swap, collected by the on-chain program.",
        ],
      },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Get API Access](${DOCS}/dart-swap-api/get-api-access): the free public endpoint, partner access and API keys`,
          `[How to Use](${DOCS}/dart-swap-api/how-to-use): the endpoints, the request and response shapes, and assembling the transaction`,
        ],
      },
    ],
  },

  "dart-swap-api/get-api-access": {
    lead: "How to get access to the DART Swap API.",
    blocks: [
      { t: "h2", text: "Free public endpoint" },
      { t: "p", text: "A public DART endpoint exists for testing and light use. It needs no API key." },
      { t: "p", text: "**Base URL:** `https://api.titan.exchange/dart`" },
      {
        t: "list",
        items: ["**1 request per second** for each IP address", "REST only, with JSON responses", "DART provider only"],
      },
      { t: "divider" },
      { t: "h2", text: "Partner access" },
      { t: "p", text: "For higher rate limits, send your API key in a header:" },
      {
        t: "codeTabs",
        tabs: [
          { label: "Authorization header", code: `curl -X POST https://api.titan.exchange/dart/swap \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ ... }'` },
          { label: "X-API-Key header", code: `curl -X POST https://api.titan.exchange/dart/swap \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ ... }'` },
        ],
      },
      { t: "callout", tone: "warning", text: `DART partner keys are a separate credential from [Developers Portal](${DOCS}/developers-portal/introduction) keys. A Portal key is rejected by \`api.titan.exchange/dart\`, and a DART key is rejected by \`portal.api.titan.exchange\`.` },
      { t: "p", text: "To ask for a partner API key, submit the application form: [Apply for DART API Access](https://tally.so/r/1AvYeL)" },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Overview](${DOCS}/dart-swap-api/overview): a summary of DART, its pairs and its fee`,
          `[How to Use](${DOCS}/dart-swap-api/how-to-use): the endpoints, the request and response shapes, and assembling the transaction`,
        ],
      },
    ],
  },

  "dart-swap-api/how-to-use": {
    lead: "Guide for the DART public endpoint — free, no API key, 1 req/sec, JSON responses.",
    blocks: [
      { t: "p", text: `DART is an ordinary **JSON REST API**: no MessagePack and no WebSocket, only HTTP requests. You can use it without a key, or send a key to raise the rate limit (see [Get API Access](${DOCS}/dart-swap-api/get-api-access)).` },
      { t: "p", text: "**Base URL:** `https://api.titan.exchange/dart`" },
      { t: "divider" },
      { t: "h2", text: "`GET /health`", id: "get-health" },
      { t: "p", text: "A simple health check." },
      { t: "code", lang: "bash", code: `curl https://api.titan.exchange/dart/health` },
      { t: "code", lang: "json", code: `{ "status": "ok" }` },
      { t: "divider" },
      { t: "h2", text: "`GET /markets`", id: "get-markets" },
      { t: "p", text: "Lists the trading pairs that are supported." },
      { t: "code", lang: "bash", code: `curl https://api.titan.exchange/dart/markets` },
      { t: "code", lang: "json", code: `{\n  "markets": [\n    {\n      "name": "SOL/USDC",\n      "tokenA": "${SOL}",\n      "tokenB": "${USDC}"\n    }\n  ]\n}` },
      { t: "divider" },
      { t: "h2", text: "`POST /swap`", id: "post-swap" },
      { t: "p", text: "Returns a swap quote together with instructions ready to put in a transaction. Compute budget instructions are already set up for efficient execution." },
      { t: "p", text: "**Request body (JSON):**" },
      {
        t: "table",
        head: ["Field", "Type", "Required", "Description"],
        rows: [
          ["`inputMint`", "string", "Yes", "Mint address of the input token (base58)."],
          ["`outputMint`", "string", "Yes", "Mint address of the output token (base58)."],
          ["`amount`", "string", "Yes", "Amount in the token's smallest unit, for example lamports."],
          ["`userPublicKey`", "string", "Yes", "The wallet's public key (base58). It must be on-curve."],
          ["`slippageBps`", "number", "No", "Slippage tolerance in basis points. Default `50`."],
          ["`computeUnitPrice`", "number", "No", "Compute unit price in microLamports. Default `10000`."],
          ["`includeDexes`", "string[]", "No", "Restrict routing to these DEX venues."],
          ["`excludeDexes`", "string[]", "No", "Keep these DEX venues out of routing."],
          ["`meshSize`", "number", "No", "Mesh size for on-chain dynamic allocation, from `1` to `255`. The on-chain optimizer divides each venue group's input into `meshSize` chunks, so a lower value splits more coarsely and uses fewer compute units. Default `20`."],
        ],
      },
      { t: "p", text: "**Example:**" },
      {
        t: "code",
        lang: "bash",
        code: `curl -X POST https://api.titan.exchange/dart/swap \\
  -H "Content-Type: application/json" \\
  -d '{
    "inputMint": "${SOL}",
    "outputMint": "${USDC}",
    "amount": "1000000000",
    "userPublicKey": "YourWalletPublicKeyHere"
  }'`,
      },
      { t: "p", text: "**Response:**" },
      {
        t: "code",
        lang: "json",
        code: `{
  "outputAmount": "84550000",
  "inputAmount": "1000000000",
  "provider": "Titan-DART",
  "slippageBps": 50,
  "instructions": [
    {
      "programId": "ComputeBudget111111111111111111111111111111",
      "accounts": [],
      "data": "AQAABAA="
    },
    {
      "programId": "ComputeBudget111111111111111111111111111111",
      "accounts": [
        {
          "pubkey": "jitodontfronttitandart111111111111111111111",
          "isSigner": false,
          "isWritable": false
        }
      ],
      "data": "AsBcFQA="
    },
    {
      "programId": "ComputeBudget111111111111111111111111111111",
      "accounts": [],
      "data": "AxAnAAAAAAAA"
    },
    {
      "programId": "T1TANpTeScyeqVzzgNViGDNrkQ6qHz9KrSBS4aNXvGT",
      "accounts": [
        {
          "pubkey": "YourWalletPublicKeyHere",
          "isSigner": true,
          "isWritable": true
        }
      ],
      "data": "..."
    }
  ],
  "addressLookupTables": [
    "RyXhBMnPkYJyWEkBmYAnW7A8LCKfrEgAABB2xVZrwy3"
  ]
}`,
      },
      { t: "p", text: "**Response fields:**" },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`outputAmount`", "Expected output, in the smallest unit."],
          ["`inputAmount`", "Input amount, in the smallest unit."],
          ["`provider`", "Always `Titan-DART`."],
          ["`slippageBps`", "The slippage tolerance that was applied."],
          ["`instructions`", "Swap instructions with the compute budget already configured. `programId` and `pubkey` are base58; `data` is base64."],
          ["`addressLookupTables`", "Base58 address lookup table keys, used to compile a V0 transaction."],
        ],
      },
      { t: "p", text: "**Compute budget (added at the front automatically):**" },
      {
        t: "table",
        head: ["Setting", "Value"],
        rows: [
          ["`requestHeapFrame`", "256 KB"],
          ["`setComputeUnitLimit`", "1,400,000 CUs"],
          ["`setComputeUnitPrice`", "Configurable (default 10,000 microLamports)"],
        ],
      },
      { t: "p", text: "**Errors:**" },
      {
        t: "table",
        head: ["Status", "Meaning"],
        rows: [
          ["`400`", "A required field is missing, the JSON is invalid, or `meshSize` is out of range."],
          ["`404`", "No route exists for the requested pair."],
          ["`429`", "The rate limit was exceeded."],
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Building a transaction" },
      { t: "p", text: "The response already contains every instruction you need. Deserialize them, build a V0 transaction, sign it, and send it:" },
      {
        t: "code",
        lang: "typescript",
        code: `import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

// 1. Deserialize instructions from the response
const instructions = response.instructions.map(
  (ix) =>
    new TransactionInstruction({
      programId: new PublicKey(ix.programId),
      keys: ix.accounts.map((acc) => ({
        pubkey: new PublicKey(acc.pubkey),
        isSigner: acc.isSigner,
        isWritable: acc.isWritable,
      })),
      data: Buffer.from(ix.data, "base64"),
    })
);

// 2. Fetch address lookup tables
const connection = new Connection("https://api.mainnet-beta.solana.com");
const altAccounts = await Promise.all(
  response.addressLookupTables.map(async (key) => {
    const alt = await connection.getAddressLookupTable(new PublicKey(key));
    return alt.value;
  })
);

// 3. Build V0 transaction
const { blockhash } = await connection.getLatestBlockhash();
const message = new TransactionMessage({
  payerKey: walletPublicKey,
  recentBlockhash: blockhash,
  instructions,
}).compileToV0Message(altAccounts.filter(Boolean));

const transaction = new VersionedTransaction(message);

// 4. Sign and send
transaction.sign([wallet]);
const signature = await connection.sendTransaction(transaction);`,
      },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Overview](${DOCS}/dart-swap-api/overview): a summary of DART, its pairs and its fee`,
          `[Get API Access](${DOCS}/dart-swap-api/get-api-access): how to raise your rate limit`,
        ],
      },
    ],
  },

  "resources/sdk": {
    lead: "Official SDKs for Titan Direct — TypeScript (high-level client) and Rust (types + codec).",
    blocks: [
      { t: "p", text: "**There are official Titan SDKs for both TypeScript and Rust.** Each one connects to Titan Direct over a WebSocket and uses MessagePack for messages, with compression as an option." },
      { t: "divider" },
      { t: "h2", text: "TypeScript SDK" },
      { t: "p", text: "**A fully typed, high-level client that manages the connection and agrees on compression for you.**" },
      {
        t: "list",
        items: [
          "**Package name:** `@titanexchange/sdk-ts`",
          "**Repository:** [github.com/Titan-Pathfinder/titan-sdk-ts](https://github.com/Titan-Pathfinder/titan-sdk-ts)",
          "**Node.js:** version 18.19 or newer",
        ],
      },
      { t: "h3", text: "Installation" },
      { t: "code", lang: "bash", code: `npm install @titanexchange/sdk-ts` },
      { t: "h3", text: "Connecting" },
      {
        t: "code",
        lang: "typescript",
        code: `import { V1Client } from '@titanexchange/sdk-ts';

// The SDK automatically negotiates compression (zstd, brotli, gzip, or none)
const url = \`wss://\${process.env.TITAN_ENDPOINT}/api/v1/ws?auth=\${process.env.TITAN_JWT}\`;
const client = await V1Client.connect(url);`,
      },
      { t: "p", text: "**Connection state:**" },
      {
        t: "table",
        head: ["Member", "Description"],
        rows: [
          ["`client.closed`", "A `boolean`; `true` once the connection is closed."],
          ["`client.listen_closed()`", "Returns a `Promise` that resolves with the close event."],
          ["`client.close()`", "Closes the connection gracefully."],
        ],
      },
      { t: "h3", text: "API methods" },
      {
        t: "table",
        head: ["Method", "Returns", "Description"],
        rows: [
          ["`client.getInfo()`", "`ServerInfo`", "Protocol version and server settings."],
          ["`client.newSwapQuoteStream(params)`", "`{ response, stream, streamId }`", "Opens a streaming quote."],
          ["`client.stopStream(streamId)`", "`StopStreamResponse`", "Stops the stream with the given ID."],
          ["`client.getVenues(params?)`", "`VenueInfo`", "Lists the on-chain venues that are available."],
          ["`client.listProviders(params?)`", "`ProviderInfo[]`", "Lists the quote providers that are active."],
          ["`client.getSwapPrice(params)`", "`SwapPrice`", "A one-off price check with no streaming."],
        ],
      },
      { t: "h3", text: "Streaming quotes" },
      {
        t: "code",
        lang: "typescript",
        code: `import bs58 from 'bs58';

const { stream, streamId } = await client.newSwapQuoteStream({
  swap: {
    inputMint: bs58.decode('${SOL}'),
    outputMint: bs58.decode('${USDC}'),
    amount: 1_000_000_000n, // 1 SOL, must be BigInt
    slippageBps: 50,
  },
  transaction: {
    userPublicKey: bs58.decode('YOUR_WALLET_PUBLIC_KEY'),
  },
});

// Async iterator: yields SwapQuotes on each update
for await (const quotes of stream) {
  // Use metadata.ExpectedWinner for the best slippage-adjusted route
  const winner = quotes.metadata?.ExpectedWinner;
  const best = winner && quotes.quotes[winner];

  if (best?.instructions?.length) {
    console.log(\`Best: \${winner} — \${best.outAmount} out\`);
  }
}`,
      },
      { t: "h3", text: "Stopping a stream" },
      {
        t: "code",
        lang: "typescript",
        code: `// Method 1: via client
await client.stopStream(streamId);

// Method 2: via stream (calls stopStream() internally)
await stream.cancel('done');`,
      },
      { t: "h3", text: "Types" },
      {
        t: "code",
        lang: "typescript",
        code: `import { types } from '@titanexchange/sdk-ts';

types.v1.SwapQuoteRequest;
types.v1.SwapParams;
types.v1.TransactionParams;
types.v1.TransactionFormat;`,
      },
      { t: "h3", text: "Selecting a transaction format" },
      { t: "p", text: "`transactionFormat` chooses the Solana transaction wire format Titan assumes when it measures candidate routes. It is independent of `titanSwapVersion`, which chooses the version of the Titan swap instruction." },
      {
        t: "code",
        lang: "typescript",
        code: `import { types } from '@titanexchange/sdk-ts';

const { stream } = await client.newSwapQuoteStream({
  swap: {
    inputMint,
    outputMint,
    amount: 1_000_000n,
  },
  transaction: {
    userPublicKey,
    titanSwapVersion: types.v1.SwapVersion.V3,
    transactionFormat: types.v1.TransactionFormat.V1,
  },
});`,
      },
      { t: "p", text: "The default is `TransactionFormat.V0` (`0`). Choosing `TransactionFormat.V1` (`1`) sizes routes for Transaction V1 against a 4096-byte limit, does not support ALTs, and requires Titan Swap V3. If you omit `titanSwapVersion`, the server resolves V1 requests to V3, whereas a request that combines Transaction V1 with Swap V2 is rejected." },
      { t: "callout", tone: "warning", text: "Transaction V1 requires the Agave 4.2 feature set to be switched on in the cluster you send to. Titan does not verify that, so keep using V0 until you have confirmed it is active." },
      { t: "h3", text: "Error handling" },
      { t: "p", text: "The SDK exports all of its error classes:" },
      {
        t: "table",
        head: ["Class", "Meaning", "Properties"],
        rows: [
          ["`ConnectionClosed`", "The WebSocket connection closed.", "`code`, `reason`, `wasClean`"],
          ["`ConnectionError`", "The WebSocket raised an error event.", "`cause`"],
          ["`ErrorResponse`", "The server rejected a request.", "`response` (with `code`, `message`, `requestId`)"],
          ["`StreamError`", "A stream ended with an error.", "`streamId`, `errorCode`, `errorMessage`"],
          ["`ProtocolError`", "An implementation bug. **Report it to Titan.**", "`reason`, `data`"],
        ],
      },
      { t: "h3", text: "Reconnection" },
      { t: "p", text: "**The SDK has no automatic reconnect.** You need to handle it yourself:" },
      {
        t: "code",
        lang: "typescript",
        code: `client.listen_closed().then(async (event) => {
  if (!event.wasClean) {
    // Reconnect and re-establish streams
    const newClient = await V1Client.connect(url);
    // Re-open your streams on newClient
  }
});`,
      },
      { t: "p", text: `For backoff strategies, see [Error Handling & Reconnect](${DOCS}/swap-api/guides/error-handling).` },
      { t: "h3", text: "Browser usage" },
      { t: "code", lang: "typescript", code: `import { V1Client } from '@titanexchange/sdk-ts/browser';` },
      { t: "callout", tone: "warning", text: "**Never expose your JWT in client-side code.** Run a middleware proxy that accepts user connections, checks their authentication, and forwards to Titan with the JWT held on the server. The SDK repository has an example at `examples/middleware.ts`." },
      { t: "h3", text: "Key details" },
      {
        t: "list",
        items: [
          "**BigInt amounts**: pass `amount` as a `BigInt` (for example `1_000_000_000n`). Numbers of 2^32 or more may be encoded as float64, **which the server rejects.**",
          "**`quotes` is a map**: `SwapQuotes.quotes` is a `Record<string, SwapRoute>` keyed by provider ID, and not every provider shows up in every update.",
          "**`num_quotes` uses snake_case**: inside `QuoteUpdateParams` the field is named `num_quotes`, not `numQuotes`.",
        ],
      },
      { t: "p", text: "**Logging BigInt values:**" },
      {
        t: "code",
        lang: "typescript",
        code: `JSON.stringify(data, (key, value) => {
  if (typeof value === 'bigint') return value.toString() + 'n';
  if (value instanceof Uint8Array) return \`<Uint8Array: \${value.length} bytes>\`;
  return value;
}, 2);`,
      },
      { t: "divider" },
      { t: "h2", text: "Rust SDK" },
      { t: "p", text: "**Low-level types and a MessagePack codec, with the WebSocket connection left for you to manage.**" },
      {
        t: "list",
        items: [
          "**Crates search:** [crates.io/search?q=titan-api-types](https://crates.io/search?q=titan-api-types)",
          "**`titan-api-types`**: the types that describe each WebSocket request and response message.",
          "**`titan-api-codec`**: encodes and decodes MessagePack, and handles zstd, brotli and gzip compression.",
        ],
      },
      { t: "h3", text: "Rust installation", id: "rust-installation" },
      { t: "code", lang: "toml", code: `[dependencies]\ntitan-api-types = "5"\ntitan-api-codec = "1.2"` },
      { t: "callout", tone: "info", text: "The Rust SDK has **no high-level client**. Manage the WebSocket with `tokio-tungstenite` (or another async WebSocket library) and use the codec to serialize messages." },
      { t: "h3", text: "Rust connecting", id: "rust-connecting" },
      {
        t: "code",
        lang: "rust",
        code: `use titan_api_codec::codec::{ws::v1::ClientCodec, Codec};
use titan_api_types::ws::v1;
use tokio_tungstenite::{
    connect_async,
    tungstenite::{
        client::IntoClientRequest,
        http::header::{AUTHORIZATION, SEC_WEBSOCKET_PROTOCOL},
        http::HeaderValue,
    },
};

let mut request = url.into_client_request()?;

// Set protocol negotiation header
let protocols = HeaderValue::from_str(
    &v1::WEBSOCKET_SUBPROTOCOLS.join(", ")
)?;
request.headers_mut().insert(SEC_WEBSOCKET_PROTOCOL, protocols);

// Set auth header
let bearer = HeaderValue::from_str(&format!("Bearer {}", token))?;
request.headers_mut().insert(AUTHORIZATION, bearer);

// Connect and create codec from negotiated protocol
let (stream, response) = connect_async(request).await?;
let protocol_str = response
    .headers()
    .get(SEC_WEBSOCKET_PROTOCOL)
    .and_then(|v| v.to_str().ok())
    .unwrap();
let codec = ClientCodec::from_str(protocol_str)?;

let (sink, stream) = stream.split();`,
      },
      { t: "h3", text: "Sending requests" },
      {
        t: "code",
        lang: "rust",
        code: `use titan_api_types::ws::v1::*;
use titan_api_codec::codec::Codec;

let encoder = codec.encoder();
let decoder = codec.decoder();

// GetInfo request
let request = ClientRequest {
    id: 0,
    data: RequestData::GetInfo(GetInfoRequest::default()),
};

// Encode to MessagePack and send as binary frame
let bytes = encoder.encode(&request)?;
sink.send(Message::Binary(bytes)).await?;`,
      },
      { t: "h3", text: "Rust streaming quotes", id: "rust-streaming-quotes" },
      {
        t: "code",
        lang: "rust",
        code: `let request = ClientRequest {
    id: 1,
    data: RequestData::NewSwapQuoteStream(SwapQuoteRequest {
        swap: SwapParams {
            input_mint: sol_mint,
            output_mint: usdc_mint,
            amount: 1_000_000_000u64,
            slippage_bps: Some(50),
            ..Default::default()
        },
        transaction: TransactionParams {
            user_public_key: wallet,
            ..Default::default()
        },
        update: None,
    }),
};`,
      },
      { t: "h3", text: "Processing responses" },
      {
        t: "code",
        lang: "rust",
        code: `while let Some(msg) = stream.next().await {
    let msg = msg?;
    if let Message::Binary(data) = msg {
        let server_msg: ServerMessage = decoder.decode(data.into())?;
        match server_msg {
            ServerMessage::Response(resp) => {
                // Handle RPC response
            }
            ServerMessage::StreamData(data) => {
                if let StreamDataPayload::SwapQuotes(quotes) = data.payload {
                    for (provider, route) in &quotes.quotes {
                        println!("{}: {} out", provider, route.out_amount);
                    }
                }
            }
            ServerMessage::Error(err) => {
                eprintln!("Error {}: {}", err.code, err.message);
            }
            ServerMessage::StreamEnd(end) => {
                println!("Stream {} ended", end.id);
            }
        }
    }
}`,
      },
      { t: "h3", text: "Field naming" },
      { t: "p", text: "Rust code uses normal **snake_case** field names, and serde converts them to camelCase on the wire:" },
      {
        t: "list",
        items: ["`input_mint` becomes `inputMint`", "`output_mint` becomes `outputMint`", "`slippage_bps` becomes `slippageBps`", "`user_public_key` becomes `userPublicKey`", "`only_direct_routes` becomes `onlyDirectRoutes`"],
      },
      { t: "h3", text: "Rust reconnection", id: "rust-reconnection" },
      { t: "p", text: "**There is no built-in reconnect.** As with the TypeScript SDK, you must detect dropped connections and re-open streams yourself." },
      { t: "h3", text: "Dependencies" },
      {
        t: "list",
        items: [
          "**`tokio-tungstenite`**: an async WebSocket client.",
          "**`rmp-serde`**: serializes to and from MessagePack.",
          "**`zstd`**: compresses with Zstandard.",
          "**`brotli`**: compresses with Brotli.",
          "**`flate2`**: compresses with Gzip.",
          "**`five8` / `five8_const`**: encodes public keys as base58.",
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Quickstart](${DOCS}/swap-api/quickstart): a complete integration from start to finish`,
          `[Stream & Execute a Swap](${DOCS}/swap-api/guides/stream-and-execute): the detailed guide, including how to build the transaction`,
          `[Wire Protocol](${DOCS}/swap-api/reference/wire-protocol): how data is encoded and how messages are wrapped`,
          `[Error Codes](${DOCS}/swap-api/reference/error-codes): the codes along with the SDK error classes`,
        ],
      },
    ],
  },

  "resources/community-and-support": {
    lead: "Get help, report issues, and connect with the Titan community.",
    blocks: [
      { t: "p", text: "**Contact the Titan team and the wider community here for help, feedback and updates.**" },
      { t: "divider" },
      { t: "h2", text: "Discord" },
      { t: "p", text: "The Titan Discord offers live help, announcements, and a place to talk with fellow developers." },
      { t: "callout", tone: "info", text: "**Discord gets you support fastest.** Team members actively watch the developer channels." },
      { t: "divider" },
      { t: "h2", text: "GitHub" },
      {
        t: "list",
        items: [
          "**TypeScript SDK repo**: [github.com/Titan-Pathfinder/titan-sdk-ts](https://github.com/Titan-Pathfinder/titan-sdk-ts)",
          "**Rust SDK on crates.io**: [titan-api-types](https://crates.io/crates/titan-api-types) and [titan-api-codec](https://crates.io/crates/titan-api-codec)",
        ],
      },
      { t: "p", text: "**Spotted a bug?** Open an issue in the relevant SDK repository and describe how to reproduce it." },
      { t: "divider" },
      { t: "h2", text: "Getting API access" },
      { t: "p", text: `Generate an API key at [developer.titan.exchange](https://developer.titan.exchange/), or obtain a JWT from a distributor. [Get API Access](${DOCS}/getting-started/api-access) has the details.` },
      { t: "h2", text: "Reporting an issue" },
      { t: "p", text: `If your report concerns a Developers Portal request, include its \`x-amzn-requestid\` response header, plus the response \`id\` or \`quoteId.tag\` when it was a quote request. See [Errors](${DOCS}/developers-portal/errors#debugging).` },
    ],
  },

  "resources/ai-llm-integration": {
    lead: "Integrate Titan swap functionality into AI agents and LLM-powered applications.",
    blocks: [
      { t: "p", text: "**Titan's swap infrastructure can be driven by AI agents, LLM tool-calling pipelines and autonomous trading systems.**" },
      { t: "divider" },
      { t: "h2", text: "Which endpoint and credential" },
      { t: "p", text: "There are two ways in, and each has its own host, credential and protocol. Before building an integration, an agent should pick the path that matches the credential its user holds." },
      {
        t: "table",
        head: ["Credential held", "Path", "Host", "Protocol", "Auth header", "Encoding"],
        rows: [
          ["API key from developer.titan.exchange", "Developers Portal", "`portal.api.titan.exchange`", "REST, `GET` only", "`x-api-key: <key>`", "JSON with `Accept: application/json`; MessagePack by default"],
          ["JWT from Triton or QuickNode", "Distributor", "Base URL supplied by the distributor; `/api/v1/ws` for Titan Direct, `/api/v1/*` for Titan Gateway", "WebSocket (Titan Direct) or REST (Titan Gateway)", "`Authorization: Bearer <jwt>` or `?auth=<jwt>`", "MessagePack"],
          ["DART API key", `[DART Swap API](${DOCS}/dart-swap-api/get-api-access)`, "`api.titan.exchange/dart`", "REST", "`X-API-Key: <key>`", "JSON"],
        ],
      },
      {
        t: "table",
        head: ["Rule", "Detail"],
        rows: [
          ["Credentials are not interchangeable", "Sending a JWT to the Portal host, or an API key to a distributor endpoint, returns `401`. DART keys and Portal keys are different credentials for different hosts."],
          ["The Portal has no WebSocket", "`/api/v1/ws` does not exist on `portal.api.titan.exchange`. Streaming (Titan Direct) is enterprise-only and needs a distributor JWT."],
          ["The Portal has no `/api/v1/quote/price`", "There are only four endpoints: `/api/v1/quote/swap`, `/api/v1/info`, `/api/v1/venues`, `/api/v1/providers`."],
          ["Parameters are flat on the Portal", "`swap.dexes: [...]` in the Direct schema turns into `?dexes=a,b` on the Portal. Names and meaning are unchanged."],
          ["Route selection", "Read `metadata.ExpectedWinner` and execute `quotes[ExpectedWinner]`. Do not sort by `outAmount`."],
          ["`quotes` is an object", "It is keyed by provider ID, so `quotes[0]` is undefined."],
        ],
      },
      { t: "p", text: `The Claude Code skill below targets the distributor path, which means Titan Direct over WebSocket. If you are integrating through the Portal, a complete REST example that has been tested is in the [Developers Portal Quickstart](${DOCS}/developers-portal/quickstart).` },
      { t: "divider" },
      { t: "h2", text: "Claude Code Skill" },
      { t: "p", text: "**This is the fastest way to build a Titan integration with AI.** Installing the `@titanexchange/titan-api-skill` package lets Claude Code write code that respects the Titan API protocol." },
      {
        t: "list",
        items: [
          "**Package name:** [@titanexchange/titan-api-skill](https://www.npmjs.com/package/@titanexchange/titan-api-skill)",
          "**Repository:** [github.com/Titan-Pathfinder/titan-api-claude-skills](https://github.com/Titan-Pathfinder/titan-api-claude-skills)",
        ],
      },
      { t: "h3", text: "What it provides" },
      {
        t: "list",
        items: [
          "**Protocol-aware code generation**: writes TypeScript that follows the Titan WebSocket API spec, using proper MessagePack encoding, BigInt amounts and token mints decoded with bs58.",
          "**SDK or raw WebSocket**: supports integrations built on the SDK as well as ones that talk to the WebSocket directly.",
          "**Parameter structure enforcement**: puts fields such as `slippageBps`, `intervalMs` and `num_quotes` in the right nested objects of the request schema.",
          "**Runnable examples included**: comes with working TypeScript examples you can run as they are.",
        ],
      },
      { t: "h3", text: "Installation" },
      { t: "p", text: "**npx (recommended):**" },
      {
        t: "code",
        lang: "bash",
        code: `# For current project
npx @titanexchange/titan-api-skill

# For all projects (global)
npx @titanexchange/titan-api-skill --global

# Overwrite existing install
npx @titanexchange/titan-api-skill --force`,
      },
      { t: "p", text: "After that, type `/titan-swap-api` in Claude Code to invoke the skill." },
      { t: "p", text: "**Manual install (curl):**" },
      {
        t: "code",
        lang: "bash",
        code: `# Global
mkdir -p ~/.claude/skills/titan-swap-api
curl -o ~/.claude/skills/titan-swap-api/SKILL.md \\
  https://raw.githubusercontent.com/Titan-Pathfinder/titan-api-claude-skills/main/SKILL.md

# Project-level
mkdir -p .claude/skills/titan-swap-api
curl -o .claude/skills/titan-swap-api/SKILL.md \\
  https://raw.githubusercontent.com/Titan-Pathfinder/titan-api-claude-skills/main/SKILL.md`,
      },
      { t: "h3", text: "Quick example" },
      { t: "p", text: "Ask Claude Code something like:" },
      { t: "callout", tone: "info", text: "\"Help me stream USDC to SOL quotes using Titan API\"" },
      { t: "p", text: "Claude will then write protocol-correct code:" },
      {
        t: "code",
        lang: "typescript",
        code: `import { V1Client } from "@titanexchange/sdk-ts";
import bs58 from "bs58";

const client = await V1Client.connect(\`\${WS_URL}?auth=\${AUTH_TOKEN}\`);

const { stream } = await client.newSwapQuoteStream({
  swap: {
    inputMint: bs58.decode("${USDC}"),
    outputMint: bs58.decode("${SOL}"),
    amount: BigInt(100_000_000), // 100 USDC, must be BigInt
  },
  transaction: {
    userPublicKey: bs58.decode(USER_PUBLIC_KEY),
  },
});

for await (const quotes of stream) {
  console.log(quotes);
}`,
      },
      { t: "h3", text: "Runnable examples" },
      { t: "p", text: "The `/examples` directory holds working TypeScript examples:" },
      {
        t: "code",
        lang: "bash",
        code: `cd examples
npm install
cp .env.example .env
# Edit .env with your credentials

npm run stream-sdk   # SDK streaming
npm run stream-raw   # Raw WebSocket
npm run proxy        # Backend proxy`,
      },
      { t: "h3", text: "Required credentials" },
      {
        t: "list",
        items: [
          "**`WS_URL`**: the Titan Direct WebSocket endpoint, provided by your distributor.",
          `**\`AUTH_TOKEN\`**: the JWT issued by your distributor. See [Get API Access](${DOCS}/getting-started/api-access).`,
        ],
      },
      { t: "p", text: "A Developers Portal API key will not work with this skill, because the Portal is REST only." },
      { t: "divider" },
      { t: "h2", text: "LLM-friendly docs (llms.txt)" },
      { t: "p", text: "**Titan's documentation is published in LLM-ready formats** following the [llms.txt](https://llmstxt.org/) standard, so agents and models can read all of it without scraping HTML." },
      {
        t: "list",
        items: [
          "**`/llms.txt`**: an index of all doc sections, linking to each page in Markdown.",
          "**`/llms-full.txt`**: the whole documentation in one Markdown file, ideal for loading into a single context.",
          "**Every page as `.md`**: add `.md` to any doc page URL to get its raw Markdown.",
        ],
      },
      { t: "callout", tone: "info", text: "GitBook **generates these endpoints automatically** and refreshes them on every publish. Nothing needs configuring." },
      { t: "divider" },
      { t: "h2", text: "Protocol summary" },
      { t: "h3", text: "Titan Direct (distributor, WebSocket)" },
      {
        t: "list",
        items: [
          "**Protocol**: WebSocket with MessagePack (not JSON).",
          "**Amounts**: must be `BigInt`, never `number`.",
          "**Token mints**: must be `Uint8Array`, produced by `bs58.decode()`.",
          "**Parameters**: `slippageBps` belongs in `swap`; `numQuotes`, `intervalMs` and `includeAltContents` belong in `update`; `userPublicKey` belongs in `transaction`.",
        ],
      },
      { t: "h3", text: "Developers Portal (API key, REST)" },
      {
        t: "list",
        items: [
          "**Protocol**: HTTPS `GET`. Send `Accept: application/json` for JSON; MessagePack is the default.",
          "**Amounts**: decimal strings passed in the query string, expressed in the token's smallest unit.",
          "**Token mints**: base58-encoded strings passed in the query string.",
          "**Parameters**: plain, flat query parameters; list values are joined with commas.",
          "**Instructions**: come back with short field names: `p` (program), `a` (accounts), `d` (data, base64).",
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Related pages" },
      {
        t: "list",
        items: [
          `[Developers Portal Quickstart](${DOCS}/developers-portal/quickstart): using REST with an API key`,
          `[Developers Portal API Reference](${DOCS}/developers-portal/reference): the flat query parameters and the fields in responses`,
          `[SDK Reference](${DOCS}/resources/sdk): docs for the TypeScript and Rust SDKs`,
          `[Connection & Negotiation](${DOCS}/swap-api/reference/direct/connection): how the WebSocket is set up and the protocol it speaks`,
          `[Quickstart](${DOCS}/swap-api/quickstart): a worked Titan Direct integration`,
        ],
      },
    ],
  },
};
