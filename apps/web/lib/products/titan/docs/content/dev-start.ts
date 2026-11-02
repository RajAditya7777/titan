import type { DocContent } from "../schema";

const BASE = "https://portal.api.titan.exchange";

/** Page bodies for this section, keyed by slug. Own words; facts exact. */
export const PAGES: Record<string, DocContent> = {
  "developers-portal/introduction": {
    lead: "Get a Titan API key and make your first request.",
    blocks: [
      { t: "p", text: "The Developers Portal is self-serve REST access to Titan's swap routing. You create a key, send it as a header, and get back quoted routes together with the on-chain instructions needed to execute them." },
      { t: "p", text: "Those routes come from the same routing engine behind Titan Direct and every distributor integration. Only how you connect and how responses are encoded differ; route quality is the same." },
      { t: "h2", text: "Quickstart" },
      {
        t: "steps",
        items: [
          { title: "Sign in", body: "Open [developer.titan.exchange](https://developer.titan.exchange)." },
          { title: "Create an API key", body: "Keys belong to your organization." },
          { title: "Pass the key", body: "Include it as the `x-api-key` header on every request to `portal.api.titan.exchange`." },
          { title: "Set the Accept header", body: "Send `application/json` unless you want MessagePack." },
        ],
      },
      { t: "h2", text: "Choose a plan" },
      { t: "p", text: "Every plan shares one base URL and one routing engine. Higher tiers get a higher rate limit and more included credits." },
      {
        t: "table",
        head: ["Plan", "Price", "Requests/sec", "For"],
        rows: [
          ["Sandbox", "$0", "1", "Testing and prototyping"],
          ["Build", "$25/mo", "10", "Your first integration"],
          ["Scale", "$100/mo", "50", "Production workloads"],
          ["Growth", "$500/mo", "150", "High-volume production"],
          ["Enterprise", "Custom", "Custom", "Custom limits, Titan Direct streaming, SLAs and dedicated support"],
        ],
      },
      { t: "p", text: "Credit allowances, key counts and upgrades are covered in [Plans, Rate Limits & Credits](/titan/docs/developer-doc/developers-portal/plans-rate-limits-credits)." },
      { t: "h2", text: "Base URL" },
      { t: "code", code: BASE },
      { t: "p", text: "One hostname serves all plans, and requests go to the nearest region automatically, so there is nothing regional to configure. See [Latency and Server Locations](/titan/docs/developer-doc/developers-portal/latency)." },
      { t: "p", text: "There are four endpoints, all GET:" },
      {
        t: "table",
        head: ["Endpoint", "Returns"],
        rows: [
          ["`/api/v1/quote/swap`", "Quoted routes with executable instructions"],
          ["`/api/v1/info`", "Protocol version and parameter bounds"],
          ["`/api/v1/venues`", "Venue labels you can use in routing filters"],
          ["`/api/v1/providers`", "Providers that are quoting right now"],
        ],
      },
      { t: "h2", text: "Using your API key" },
      {
        t: "codeTabs",
        tabs: [
          { label: "curl", code: `curl "${BASE}/api/v1/info" \\\n  -H "x-api-key: $TITAN_API_KEY" \\\n  -H "Accept: application/json"` },
          { label: "TypeScript", code: `const res = await fetch("${BASE}/api/v1/info", {\n  headers: {\n    "x-api-key": process.env.TITAN_API_KEY!,\n    Accept: "application/json",\n  },\n});\nconsole.log(await res.json());` },
          { label: "Python", code: `import os, requests\n\nres = requests.get(\n    "${BASE}/api/v1/info",\n    headers={"x-api-key": os.environ["TITAN_API_KEY"], "Accept": "application/json"},\n)\nprint(res.json())` },
        ],
      },
      { t: "h2", text: "Response format" },
      {
        t: "table",
        head: ["Accept header", "Encoding", "Best for"],
        rows: [
          ["`application/json`", "Public keys as base58 strings, instruction data as base64", "Development, debugging, any language"],
          ["`application/vnd.msgpack`", "Public keys as 32-byte arrays, data as raw bytes", "Latency-sensitive production integrations"],
        ],
      },
      { t: "callout", tone: "info", text: "MessagePack is the default, so set `Accept` on every request." },
      { t: "h2", text: "Reading a quote response" },
      {
        t: "table",
        head: ["Field", "Description"],
        rows: [
          ["`quotes`", "An object keyed by provider ID, not an array; iterate with `Object.entries(quotes)`. You get one entry unless you set `numQuotes` (up to 10)."],
          ["`metadata.ExpectedWinner`", "The route Titan recommends. Use it instead of sorting by `outAmount`."],
        ],
      },
      { t: "h2", text: "Portal or distributor access" },
      { t: "p", text: "Titan is also offered through Triton and QuickNode, which issue a JWT and give you their own endpoint." },
      {
        t: "table",
        head: ["", "Developers Portal", "Distributor"],
        rows: [
          ["Access", "Self-serve key", "Token issued by your provider"],
          ["Host", "`portal.api.titan.exchange`", "Provider-supplied endpoint"],
          ["Credential", "`x-api-key`", "`Authorization: Bearer <jwt>`"],
          ["Encoding", "JSON or MessagePack", "MessagePack"],
          ["Interfaces", "REST", "REST, plus WebSocket streaming for enterprise customers"],
        ],
      },
      { t: "callout", tone: "warning", text: "The two credentials can't be swapped: a distributor JWT sent to `portal.api.titan.exchange` returns `401 invalid_api_key`, and so does a Portal key sent to a distributor endpoint." },
      { t: "h2", text: "Next steps" },
      {
        t: "cards",
        items: [
          { title: "Quickstart", body: "Build and sign a swap transaction.", href: "/titan/docs/developer-doc/developers-portal/quickstart" },
          { title: "Authentication", body: "Handling, scoping and rotating keys.", href: "/titan/docs/developer-doc/developers-portal/authentication" },
          { title: "API Reference", body: "Parameters and fields for all four endpoints.", href: "/titan/docs/developer-doc/developers-portal/reference" },
          { title: "Plans, Rate Limits & Credits", body: "Tier limits, credits and upgrades.", href: "/titan/docs/developer-doc/developers-portal/plans-rate-limits-credits" },
          { title: "Titan Genesis 50", body: "Launch offer: 25% off paid plans for 12 months.", href: "/titan/docs/developer-doc/developers-portal/titan-genesis-50" },
          { title: "Latency and Server Locations", body: "Regions and colocation.", href: "/titan/docs/developer-doc/developers-portal/latency" },
          { title: "Errors", body: "Every error response and what to do about it.", href: "/titan/docs/developer-doc/developers-portal/errors" },
          { title: "FAQ", body: "Access, requests, plans and Genesis 50.", href: "/titan/docs/developer-doc/developers-portal/faq" },
        ],
      },
    ],
  },
  "": {
    lead: "Build on the best swap execution on Solana.",
    blocks: [
      { t: "p", text: "Titan is the meta-aggregator that powers top-tier swap execution on Solana. Quotes come in from multiple providers, **Argos** simulates each one on-chain, and you receive transactions you can sign right away." },
      { t: "callout", tone: "success", text: "**The Titan Developers Portal is open.** Generate an API key at [developer.titan.exchange](https://developer.titan.exchange/) and use Titan's swap routing through REST. Send `Accept: application/json` to get JSON back. You do not need a distributor account, and the free Sandbox plan lets you begin at no cost. [Get started](/titan/docs/developer-doc/developers-portal/introduction)" },
      { t: "callout", tone: "info", text: "**DART Swap API** is Titan's on-chain dynamic routing, with JSON responses and its own API key. [Get started](/titan/docs/developer-doc/dart-swap-api/overview)" },
      { t: "divider" },
      { t: "h2", text: "Why Titan" },
      { t: "p", text: "The infrastructure behind titan.ag is offered to you as production-grade APIs." },
      {
        t: "table",
        head: ["Benefit", "What it means"],
        rows: [
          ["**Best Execution**", "Providers compete on every quote, and Titan returns the best route."],
          ["**No Trading Fees**", "Titan routes carry no per-swap fee. DART routes carry up to 1 bps."],
          ["**Low Slippage**", "Live simulations and algorithmic route selection keep slippage down."],
        ],
      },
      { t: "divider" },
      { t: "h2", text: "APIs" },
      { t: "p", text: "Use self-serve REST through the Developers Portal, or reach Titan Direct (WebSocket) and Titan Gateway (REST) through a distributor. All of them run on the same Argos routing engine." },
      {
        t: "cards",
        items: [
          { title: "Developers Portal", body: "Self-serve API keys and REST with JSON responses.", href: "/titan/docs/developer-doc/developers-portal/introduction" },
          { title: "Titan Direct", body: "Real-time streaming quotes over WebSocket. Enterprise only, via a distributor.", href: "/titan/docs/developer-doc/swap-api/reference/direct/connection" },
          { title: "Titan Gateway", body: "REST through a distributor, with JWT auth and MessagePack responses.", href: "/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap" },
          { title: "Direct vs Gateway", body: "Pick the interface that suits your use case.", href: "/titan/docs/developer-doc/swap-api/reference/direct-vs-gateway" },
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Get Started" },
      { t: "p", text: "Everything you need to send your first request." },
      {
        t: "cards",
        items: [
          { title: "Developers Portal Quickstart", body: "Go from an API key to a signed swap transaction over REST.", href: "/titan/docs/developer-doc/developers-portal/quickstart" },
          { title: "Distributor Quickstart", body: "Get a first quote with a JWT over Titan Direct or Titan Gateway.", href: "/titan/docs/developer-doc/swap-api/quickstart" },
          { title: "Authentication", body: "An API key or a JWT, depending on how you got access.", href: "/titan/docs/developer-doc/getting-started/authentication" },
          { title: "Get API Access", body: "Create a Portal key, or obtain a token from Triton or QuickNode.", href: "/titan/docs/developer-doc/getting-started/api-access" },
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Guides" },
      { t: "p", text: "Walkthroughs for common integration tasks." },
      {
        t: "cards",
        items: [
          { title: "Stream & Execute", body: "Stream quotes, build the transaction and send it on-chain.", href: "/titan/docs/developer-doc/swap-api/guides/stream-and-execute" },
          { title: "Configure Routing", body: "Filter by venue, provider and route type.", href: "/titan/docs/developer-doc/swap-api/guides/configure-routing" },
          { title: "Fee Collection", body: "Collect platform fees using feeAccount.", href: "/titan/docs/developer-doc/swap-api/guides/fee-collection" },
        ],
      },
      { t: "divider" },
      { t: "h2", text: "Resources" },
      { t: "p", text: "SDKs, AI tooling and community channels." },
      {
        t: "cards",
        items: [
          { title: "SDK Reference", body: "TypeScript and Rust SDKs.", href: "/titan/docs/developer-doc/resources/sdk" },
          { title: "AI / LLM Integration", body: "A Claude Code skill and llms.txt.", href: "/titan/docs/developer-doc/resources/ai-llm-integration" },
          { title: "Community & Support", body: "Discord, GitHub and support.", href: "/titan/docs/developer-doc/resources/community-and-support" },
        ],
      },
    ],
  },
  "getting-started/introduction": {
    lead: "What Titan is, what it offers, and where to start.",
    blocks: [
      { t: "p", text: "Titan is a meta-aggregator for Solana. It pulls quotes from many providers, both DEX aggregators and RFQ providers, runs them through Argos, and returns the best ones." },
      { t: "h2", text: "What Titan offers" },
      { t: "p", text: "**Titan Direct** is a WebSocket API aimed at enterprise customers and offered through distributors. Swap quotes are pushed to you continuously and update as on-chain state moves. Titan calls it the sole trading API on Solana designed natively around WebSockets, made for traders who can't live with outdated prices. Pick it for real-time pricing needs, like trading bots or live swap UIs, or any time you want quotes to refresh by themselves." },
      { t: "p", text: "**Titan Gateway** is a REST API: each request gets one quote back, and no connection stays open. It is positioned as the quickest path from nothing to production-grade swap execution on Solana. Pick it when one quote per action is sufficient, such as a swap button that fires in one click, a price readout, or a backend service pulling quotes on demand." },
      { t: "p", text: "Both give the same execution quality through Argos. What differs is the interface and the workflow, not the routing." },
      { t: "p", text: "**Developers Portal** lets you reach four Titan Gateway REST endpoints (quote/swap, info, venues, providers) on your own, with a key you create, JSON output and plans listed publicly. You do not need a distributor account. Details are in the [Developers Portal](/titan/docs/developer-doc/developers-portal/introduction) section." },
      { t: "p", text: "**Limit Orders** let you place resting on-chain orders that fill in full or in part as liquidity shows up. The program supports five time-in-force modes and takes its fees from takers, in the output token." },
      { t: "h2", text: "Routing with Argos" },
      { t: "p", text: "Each swap request is routed by **Argos**, Titan's own routing algorithm. Other aggregators lean on shortest-path methods and split liquidity into percentage buckets. Argos works out price impact with machine-level precision, without breaking up pools or leaving liquidity sources out, which yields a truly optimal on-chain price." },
      { t: "h2", text: "Next steps" },
      { t: "p", text: "To sign up yourself, go to [developer.titan.exchange](https://developer.titan.exchange/), generate an API key, and follow the [Developers Portal Quickstart](/titan/docs/developer-doc/developers-portal/quickstart). If you come through a distributor, start with [Get API Access](/titan/docs/developer-doc/getting-started/api-access) and move on to the [Swap API Quickstart](/titan/docs/developer-doc/swap-api/quickstart), which covers Titan Direct and Titan Gateway." },
    ],
  },
  "getting-started/authentication": {
    lead: "Credential types and headers for Titan API requests.",
    blocks: [
      { t: "p", text: "Titan takes two kinds of credential. The one you use follows from how you obtained access." },
      {
        t: "table",
        head: ["", "Developers Portal", "Distributor"],
        rows: [
          ["Credential", "API key", "JWT"],
          ["Header", "`x-api-key: <key>`", "`Authorization: Bearer <jwt>`"],
          ["Query alternative", "—", "`?auth=<jwt>`"],
          ["Host", "`portal.api.titan.exchange`", "Endpoint supplied by Triton or QuickNode"],
          ["Interfaces", "REST", "REST (Titan Gateway); WebSocket (Titan Direct) for enterprise customers"],
          ["Obtain from", "[developer.titan.exchange](https://developer.titan.exchange/)", "Your distributor"],
        ],
      },
      { t: "callout", tone: "warning", text: "The two credentials are not interchangeable. Presenting an API key to a distributor endpoint, or a JWT to `portal.api.titan.exchange`, returns a `401`. Match the credential to the host." },
      { t: "h2", text: "Developers Portal — API key" },
      { t: "p", text: "Put the key in the `x-api-key` header of every request:" },
      { t: "code", code: "x-api-key: <your key>" },
      { t: "p", text: "You create keys at [developer.titan.exchange](https://developer.titan.exchange/), and they belong to an organization. Verifying, handling and rotating keys is covered in [Developers Portal → Authentication](/titan/docs/developer-doc/developers-portal/authentication)." },
      { t: "h2", text: "Distributor — JWT" },
      { t: "p", text: "A distributor connection authenticates with a **JSON Web Token (JWT)** that Titan or a distributor hands out. You can send it in either of two ways." },
      { t: "p", text: "As a **Bearer token** in the `Authorization` header, which is the recommended choice for server-side integrations:" },
      { t: "code", code: "Authorization: Bearer <your-jwt>" },
      { t: "p", text: "Or as a query parameter, for browser clients and other places where custom headers are not possible (for example WebSocket clients that only support [`Sec-WebSocket-Protocol`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-WebSocket-Protocol)):" },
      { t: "code", code: "wss://YOUR_ENDPOINT/api/v1/ws?auth=<your-jwt>\nhttps://YOUR_ENDPOINT/api/v1/quote/swap?auth=<your-jwt>" },
      { t: "callout", tone: "warning", text: "**Never expose credentials in client-side code.** Run a middleware proxy that adds the token or key on the server. The [middleware example](https://github.com/Titan-Pathfinder/titan-sdk-ts/blob/main/examples/middleware.ts) is a simple reference." },
      { t: "callout", tone: "info", text: "If a distributor connection drops without warning, look at the token's expiry first. An expired JWT is the most frequent cause of distributor authentication failures." },
      { t: "h2", text: "Getting credentials" },
      { t: "p", text: "See [Get API Access](/titan/docs/developer-doc/getting-started/api-access)." },
    ],
  },
  "getting-started/api-access": {
    lead: "Self-serve and distributor paths to Titan API credentials.",
    blocks: [
      { t: "p", text: "There are two routes to Titan API access: sign up yourself on the Developers Portal, or go through a distributor." },
      { t: "h2", text: "Developers Portal" },
      { t: "p", text: "Log in at [developer.titan.exchange](https://developer.titan.exchange/), generate an API key, then send REST calls to `portal.api.titan.exchange`. Sandbox costs nothing, and the paid plans increase the rate limit and bring included credits." },
      {
        t: "table",
        head: ["", ""],
        rows: [
          ["Credential", "API key, sent in the `x-api-key` header"],
          ["Interfaces", "REST"],
          ["Response format", "JSON or MessagePack"],
          ["Plans", "Sandbox (free), Build, Scale, Growth"],
        ],
      },
      { t: "p", text: "Setup, plans and reference live in the [Developers Portal](/titan/docs/developer-doc/developers-portal/introduction) section." },
      { t: "h2", text: "Through a distributor" },
      { t: "p", text: "Titan can be reached through these distributors:" },
      {
        t: "list",
        items: [
          "[**Triton**](https://docs.triton.one/trading-apis/titan-swap-api): Titan Swap API documentation on Triton",
          "[**QuickNode**](https://marketplace.quicknode.com/add-on/titan-swap): the Titan Swap add-on on the QuickNode Marketplace",
        ],
      },
      { t: "p", text: "Your distributor supplies a JWT and a base URL. Through it you can use Titan Gateway (REST), and, if you are an enterprise customer, Titan Direct (WebSocket streaming). Under that base URL, Titan Direct is at `/api/v1/ws`, while Titan Gateway endpoints are under `/api/v1/`. If you already use Triton or QuickNode, you can get access without reaching out to Titan." },
      {
        t: "table",
        head: ["", ""],
        rows: [
          ["Credential", "JWT, sent as `Authorization: Bearer` or `?auth=`"],
          ["Interfaces", "REST and WebSocket"],
          ["Response format", "MessagePack"],
        ],
      },
      { t: "h2", text: "Which path" },
      {
        t: "table",
        head: ["Requirement", "Path"],
        rows: [
          ["Self-serve signup with no distributor account", "Developers Portal"],
          ["JSON responses", "Developers Portal"],
          ["Streaming quotes that update with on-chain state", "Distributor (Titan Direct, enterprise only)"],
          ["Existing Triton or QuickNode account", "Distributor"],
        ],
      },
      { t: "p", text: "Routing quality is the same whichever path you take." },
      { t: "callout", tone: "info", text: "Once you hold credentials, go to the [Developers Portal Quickstart](/titan/docs/developer-doc/developers-portal/quickstart) if you have an API key, or to the [Swap API Quickstart](/titan/docs/developer-doc/swap-api/quickstart) if you came via a distributor." },
    ],
  },
  "developers-portal/quickstart": {
    lead: "Fetch a quote and assemble an executable swap transaction.",
    blocks: [
      { t: "p", text: "Request a swap quote over HTTP, pick the recommended route, and turn it into a versioned transaction that is ready to sign and send." },
      { t: "h2", text: "Prerequisites" },
      {
        t: "table",
        head: ["Requirement", "Purpose"],
        rows: [
          ["API key from [developer.titan.exchange](https://developer.titan.exchange/)", "Authenticates every Portal request"],
          ["Solana RPC endpoint", "Reading blockhashes and submitting the transaction"],
          ["`@solana/web3.js`", "Building the versioned transaction"],
        ],
      },
      { t: "code", lang: "bash", title: ".env", code: "TITAN_API_KEY=your-api-key\nSOLANA_RPC_URL=https://your-rpc-endpoint" },
      { t: "h2", text: "Fetch a quote" },
      {
        t: "codeTabs",
        tabs: [
          { label: "curl", code: `curl "\${BASE}/api/v1/quote/swap?\\\ninputMint=So11111111111111111111111111111111111111112&\\\noutputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&\\\namount=1000000000&\\\nuserPublicKey=8AdYBZcRixYVacvhGG2PBNruyoWfmagR6aiBUq6qE1nf&\\\nnumQuotes=5&\\\nincludeAltContents=true" \\\\\n  -H "x-api-key: $TITAN_API_KEY" \\\\\n  -H "Accept: application/json"`.replace("\${BASE}", BASE) },
          { label: "TypeScript", code: `const params = new URLSearchParams({\n  inputMint: "So11111111111111111111111111111111111111112",\n  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",\n  amount: "1000000000",\n  userPublicKey: "8AdYBZcRixYVacvhGG2PBNruyoWfmagR6aiBUq6qE1nf",\n  numQuotes: "5",\n  includeAltContents: "true",\n});\n\nconst res = await fetch(\n  \`${BASE}/api/v1/quote/swap?\${params}\`,\n  { headers: { "x-api-key": process.env.TITAN_API_KEY!, Accept: "application/json" } },\n);` },
        ],
      },
      {
        t: "table",
        head: ["Parameter", "Description"],
        rows: [
          ["`inputMint`", "Mint address of the token you are selling."],
          ["`outputMint`", "Mint address of the token you are buying."],
          ["`amount`", "Amount of `inputMint` in its smallest unit. `1000000000` equals 1 SOL in lamports."],
          ["`userPublicKey`", "The wallet that will sign and execute the swap."],
          ["`numQuotes`", "Most provider quotes to return. Defaults to `1`, maximum `10`."],
          ["`includeAltContents`", "Returns address lookup table contents inline, in a top-level `alts` array."],
        ],
      },
      { t: "p", text: "In the response, `quotes` contains an entry for every provider, indexed by provider ID, and `metadata.ExpectedWinner` points to the route Titan recommends:" },
      {
        t: "code",
        lang: "json",
        code: `{
  "id": "swap:2afe554d-af4f-4c5d-a1c1-3f1fd6eb605a:0",
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": 1000000000,
  "quotes": {
    "Titan": {
      "inAmount": 1000000000,
      "outAmount": 100781959,
      "slippageBps": 100,
      "steps": [ ... ],
      "instructions": [ ... ],
      "addressLookupTables": [ "9Re4PV8SstkAFveSuVckncTJakQVS8aT3z8uZvWRY4QA" ],
      "contextSlot": 447800832,
      "computeUnits": 85743,
      "computeUnitsSafe": 171486
    },
    "Titan-DART": {
      "inAmount": 1000000000,
      "outAmount": 100772613,
      "slippageBps": 100,
      "steps": [],
      "instructions": [ ... ],
      "addressLookupTables": [ "9Re4PV8SstkAFveSuVckncTJakQVS8aT3z8uZvWRY4QA" ],
      "contextSlot": 447800832,
      "computeUnits": 1400000,
      "computeUnitsSafe": 1400000,
      "referenceId": "titan_dart"
    }
  },
  "metadata": {
    "ExpectedWinner": "Titan-DART",
    "inputMintDecimals": 9,
    "outputMintDecimals": 6,
    "inputPriceUSD": 100.51,
    "outputPriceUSD": 0.9998
  },
  "alts": [ { "p": "9Re4PV8SstkAFveSuVckncTJakQVS8aT3z8uZvWRY4QA", "a": [ ... ] } ]
}`,
      },
      { t: "h2", text: "Build the transaction" },
      {
        t: "code",
        lang: "typescript",
        code: `import {
  Connection, Keypair, PublicKey, TransactionInstruction, ComputeBudgetProgram,
  TransactionMessage, VersionedTransaction, AddressLookupTableAccount,
} from "@solana/web3.js";

const API = "${BASE}";
const headers = { "x-api-key": process.env.TITAN_API_KEY!, Accept: "application/json" };

const wallet = Keypair.fromSecretKey(/* your key */);
const connection = new Connection(process.env.SOLANA_RPC_URL!);

const params = new URLSearchParams({
  inputMint: "So11111111111111111111111111111111111111112",   // SOL
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // USDC
  amount: "1000000000",                                        // 1 SOL, in lamports
  userPublicKey: wallet.publicKey.toBase58(),
  slippageBps: "50",
  numQuotes: "5",
  includeAltContents: "true",
});

const res = await fetch(\`\${API}/api/v1/quote/swap?\${params}\`, { headers });
if (!res.ok) throw new Error(\`\${res.status} \${await res.text()}\`);
const quotes = await res.json();

// metadata.ExpectedWinner is the best slippage-adjusted route
const winner = quotes.metadata?.ExpectedWinner;
const route = quotes.quotes[winner];
if (!route) throw new Error("No route returned");

// Instructions use short field names: p = programId, a = accounts, d = data.
// Each account is { p: pubkey, s: isSigner, w: isWritable }.
const instructions = route.instructions.map((ix: any) => new TransactionInstruction({
  programId: new PublicKey(ix.p),
  keys: ix.a.map((m: any) => ({ pubkey: new PublicKey(m.p), isSigner: m.s, isWritable: m.w })),
  data: Buffer.from(ix.d, "base64"),
}));

// Some providers include a compute-budget instruction and some do not.
// Set the limit from computeUnitsSafe when the route omits it.
if (!instructions.some((ix) => ix.programId.equals(ComputeBudgetProgram.programId))) {
  instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units: route.computeUnitsSafe }));
}

// alts covers every returned route. Keep only the tables this route uses.
const needed = new Set(route.addressLookupTables);
const lookupTables = (quotes.alts ?? [])
  .filter((t: any) => needed.has(t.p))
  .map((t: any) => new AddressLookupTableAccount({
    key: new PublicKey(t.p),
    state: {
      deactivationSlot: BigInt("18446744073709551615"),  // u64::MAX, so the table is active
      lastExtendedSlot: 0,
      lastExtendedSlotStartIndex: 0,
      addresses: t.a.map((a: string) => new PublicKey(a)),
    },
  }));

const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
const message = new TransactionMessage({
  payerKey: wallet.publicKey,
  recentBlockhash: blockhash,
  instructions,
}).compileToV0Message(lookupTables);

const tx = new VersionedTransaction(message);
tx.sign([wallet]);

const signature = await connection.sendTransaction(tx, { maxRetries: 3 });
await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });`,
      },
      { t: "h2", text: "Implementation notes" },
      {
        t: "table",
        head: ["Behavior", "Detail"],
        rows: [
          ["Compute budget", "Some providers put a compute-budget instruction in the route and others do not. Look for the `ComputeBudget111111111111111111111111111111` program before adding your own; if it is missing, set the limit from `computeUnitsSafe`, which differs per provider."],
          ["Quote lifetime", "Routes are calculated against on-chain state at `contextSlot` and go stale within seconds. Never cache quotes."],
          ["Signing wallet", "The instructions point at the token accounts of the `userPublicKey` used when quoting. Signing with a different wallet fails."],
          ["Lookup tables", "If you leave out `includeAltContents`, fetch each address in `route.addressLookupTables` with `connection.getAddressLookupTable`."],
        ],
      },
      { t: "h2", text: "Parameter format" },
      { t: "p", text: "In Titan Direct requests, and in the WebSocket examples within the Swap API guides, parameters are fields of nested `SwapParams` and `TransactionParams` objects. The Portal flattens them all into query parameters, with list values joined by commas." },
      {
        t: "table",
        head: ["Titan Direct", "Portal"],
        rows: [
          ["`swap.dexes: [\"Raydium\", \"Phoenix\"]`", "`?dexes=Raydium,Phoenix`"],
          ["`swap.onlyDirectRoutes: true`", "`?onlyDirectRoutes=true`"],
          ["`transaction.createOutputTokenAccount: false`", "`?createOutputTokenAccount=false`"],
        ],
      },
      { t: "p", text: "Names and behavior are the same on both. The samples in [Configure Routing](/titan/docs/developer-doc/swap-api/guides/configure-routing) and [Transaction Template](/titan/docs/developer-doc/swap-api/guides/transaction-template) authenticate as a distributor, so when you adapt them keep the `x-api-key` and `Accept: application/json` headers used here. The complete parameter list is in the [Quote Swap reference](/titan/docs/developer-doc/developers-portal/reference/quote-swap)." },
    ],
  },
  "developers-portal/authentication": {
    lead: "Authenticate Portal requests with an API key.",
    blocks: [
      { t: "p", text: "Every call to `portal.api.titan.exchange` needs an API key placed in the `x-api-key` header. You can generate one at [developer.titan.exchange](https://developer.titan.exchange/)." },
      { t: "code", code: "x-api-key: <your key>" },
      { t: "p", text: "Fetching quotes needs no wallet signature. Signing only comes into play when you send the resulting transaction to Solana through your own RPC." },
      { t: "h2", text: "Verifying a key" },
      { t: "p", text: "`/api/v1/info` takes no parameters and returns the protocol version, so it is a convenient way to check a key works before you request quotes." },
      {
        t: "codeTabs",
        tabs: [
          { label: "curl", code: `curl "${BASE}/api/v1/info" \\\n  -H "x-api-key: $TITAN_API_KEY" \\\n  -H "Accept: application/json"` },
          { label: "TypeScript", code: `const res = await fetch("${BASE}/api/v1/info", {\n  headers: {\n    "x-api-key": process.env.TITAN_API_KEY!,\n    Accept: "application/json",\n  },\n});\nif (!res.ok) throw new Error(\`\${res.status} \${await res.text()}\`);` },
          { label: "Python", code: `import os, requests\n\nres = requests.get(\n    "${BASE}/api/v1/info",\n    headers={\n        "x-api-key": os.environ["TITAN_API_KEY"],\n        "Accept": "application/json",\n    },\n)\nres.raise_for_status()` },
        ],
      },
      { t: "p", text: "A missing, unknown or revoked key gets a `401`:" },
      { t: "code", lang: "json", code: '{ "error": { "code": "invalid_api_key" } }' },
      { t: "callout", tone: "warning", text: "Sending a distributor JWT to `portal.api.titan.exchange` produces the same `401 invalid_api_key`, as does sending a Portal key to a distributor endpoint. Check the hostname before you rotate a key that stopped working." },
      { t: "h2", text: "Key handling" },
      { t: "p", text: "A key identifies your organization, and every request made with it counts against your plan's rate limit and credit balance." },
      { t: "p", text: "Store keys on the server side only. Web and mobile apps should talk to your own backend, which keeps the key and relays the call. A sample of this proxy pattern is the [middleware example](https://github.com/Titan-Pathfinder/titan-sdk-ts/blob/main/examples/middleware.ts) in the TypeScript SDK repo." },
      { t: "p", text: "Each paid plan comes with five keys. The whole organization shares one pool of rate limit and credits, so giving every service or environment its own key costs you no throughput, and you can rotate keys with no downtime. See [Plans, Rate Limits & Credits](/titan/docs/developer-doc/developers-portal/plans-rate-limits-credits)." },
      { t: "h2", text: "Distributor access" },
      { t: "p", text: "Titan is also sold through [Triton](https://docs.triton.one/trading-apis/titan-swap-api) and [QuickNode](https://marketplace.quicknode.com/add-on/titan-swap), which issue a JWT and their own endpoint. That route is described under [Authentication](/titan/docs/developer-doc/getting-started/authentication) in Getting Started." },
    ],
  },
  "developers-portal/reference": {
    lead: "Endpoint reference for the Titan Developers Portal API.",
    blocks: [
      { t: "p", text: "The Developers Portal serves four endpoints at `https://portal.api.titan.exchange`. Every one is a `GET`, authenticates with the `x-api-key` header, and returns JSON or MessagePack depending on the `Accept` header." },
      {
        t: "table",
        head: ["Endpoint", "Returns", "Reference"],
        rows: [
          ["`/api/v1/quote/swap`", "Quoted routes with executable instructions", "[Quote Swap](/titan/docs/developer-doc/developers-portal/reference/quote-swap)"],
          ["`/api/v1/info`", "Protocol version and parameter bounds", "[Info](/titan/docs/developer-doc/developers-portal/reference/info-venues-providers#info)"],
          ["`/api/v1/venues`", "Venue labels and program IDs", "[Venues](/titan/docs/developer-doc/developers-portal/reference/info-venues-providers#venues)"],
          ["`/api/v1/providers`", "Providers currently quoting", "[Providers](/titan/docs/developer-doc/developers-portal/reference/info-venues-providers#providers)"],
        ],
      },
      { t: "p", text: "Parameters and response types are the same as Titan Gateway. The Portal takes every parameter as a flat query-string value, while the [Swap API reference](/titan/docs/developer-doc/swap-api/reference/gateway/gateway-quote-swap) documents the same fields next to Titan Direct's nested request objects." },
      { t: "callout", tone: "info", text: "`/api/v1/quote/price` and the WebSocket endpoint `/api/v1/ws` are not offered on the Portal. Streaming quotes come from [Titan Direct](/titan/docs/developer-doc/swap-api/reference/direct), an [Enterprise](/titan/docs/developer-doc/developers-portal/plans-rate-limits-credits#enterprise) feature that is currently delivered through distributors." },
    ],
  },
};
