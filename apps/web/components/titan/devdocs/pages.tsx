import Link from "next/link";
import { ExternalLink, Info } from "lucide-react";
import { DOCS_NAV, docHref, originalHref } from "@/lib/products/titan/devdocs";
import type { TocItem } from "./DocsShell";
import { Callout, Code, CodeBlock, CodeTabs, H1, H2, Lead, P, Steps, Table } from "./blocks";

/**
 * Page bodies. The Developers Portal introduction is summarized in full, in our own words; facts
 * (hosts, headers, endpoints, plan prices and limits) match the original exactly. Other pages carry
 * a short summary and a link to the original.
 */

const BASE_URL = "https://portal.api.titan.exchange";

export const INTRO_TOC: TocItem[] = [
  { id: "quickstart", title: "Quickstart", depth: 2 },
  { id: "sign-in", title: "Sign in", depth: 3 },
  { id: "create-an-api-key", title: "Create an API key", depth: 3 },
  { id: "pass-the-key", title: "Pass the key", depth: 3 },
  { id: "set-the-accept-header", title: "Set the Accept header", depth: 3 },
  { id: "choose-a-plan", title: "Choose a plan", depth: 2 },
  { id: "base-url", title: "Base URL", depth: 2 },
  { id: "using-your-api-key", title: "Using your API key", depth: 2 },
  { id: "response-format", title: "Response format", depth: 2 },
  { id: "reading-a-quote-response", title: "Reading a quote response", depth: 2 },
  { id: "portal-or-distributor-access", title: "Portal or distributor access", depth: 2 },
  { id: "next-steps", title: "Next steps", depth: 2 },
];

export const INTRO_MARKDOWN = `# Introduction
Get a Titan API key and make your first request.

Base URL: ${BASE_URL}
Header: x-api-key: <your key>
Accept: application/json (default is MessagePack)
Endpoints (GET): /api/v1/quote/swap, /api/v1/info, /api/v1/venues, /api/v1/providers
Original: ${originalHref("developers-portal/introduction")}`;

const CURL = `curl "${BASE_URL}/api/v1/info" \\
  -H "x-api-key: $TITAN_API_KEY" \\
  -H "Accept: application/json"`;
const TS = `const res = await fetch("${BASE_URL}/api/v1/info", {
  headers: {
    "x-api-key": process.env.TITAN_API_KEY!,
    Accept: "application/json",
  },
});
console.log(await res.json());`;
const PY = `import os, requests

res = requests.get(
    "${BASE_URL}/api/v1/info",
    headers={"x-api-key": os.environ["TITAN_API_KEY"], "Accept": "application/json"},
)
print(res.json())`;

const NEXT_STEPS: Array<[string, string, string]> = [
  ["developers-portal/quickstart", "Quickstart", "Build and sign a swap transaction."],
  ["developers-portal/authentication", "Authentication", "Handling, scoping and rotating keys."],
  ["developers-portal/reference", "API Reference", "Parameters and fields for all four endpoints."],
  ["developers-portal/plans-rate-limits-credits", "Plans, Rate Limits & Credits", "Tier limits, credits and upgrades."],
  ["developers-portal/titan-genesis-50", "Titan Genesis 50", "Launch offer: 25% off paid plans for 12 months."],
  ["developers-portal/latency", "Latency and Server Locations", "Regions and colocation."],
  ["developers-portal/errors", "Errors", "Every error response and what to do about it."],
  ["developers-portal/faq", "FAQ", "Access, requests, plans and Genesis 50."],
];

export function PortalIntroduction() {
  return (
    <>
      <H1 icon={<Info className="h-8 w-8" />}>Introduction</H1>
      <Lead>Get a Titan API key and make your first request.</Lead>
      <P>
        The Developers Portal is self-serve REST access to Titan&apos;s swap routing. You create a key, send it as a header, and get back quoted routes
        together with the on-chain instructions needed to execute them.
      </P>
      <P>
        Those routes come from the same routing engine behind Titan Direct and every distributor integration. Only how you connect and how responses
        are encoded differ; route quality is the same.
      </P>

      <H2 id="quickstart">Quickstart</H2>
      <Steps
        steps={[
          {
            id: "sign-in",
            title: "Sign in",
            body: (
              <>
                Open{" "}
                <a href="https://developer.titan.exchange" target="_blank" rel="noreferrer" className="text-[#f2d364] underline decoration-[#f2d364]/40 underline-offset-2">
                  developer.titan.exchange ↗
                </a>
                .
              </>
            ),
          },
          { id: "create-an-api-key", title: "Create an API key", body: "Keys belong to your organization." },
          {
            id: "pass-the-key",
            title: "Pass the key",
            body: (
              <>
                Include it as the <Code>x-api-key</Code> header on every request to <Code>portal.api.titan.exchange</Code>.
              </>
            ),
          },
          {
            id: "set-the-accept-header",
            title: "Set the Accept header",
            body: (
              <>
                Send <Code>application/json</Code> unless you want MessagePack.
              </>
            ),
          },
        ]}
      />

      <H2 id="choose-a-plan">Choose a plan</H2>
      <P>Every plan shares one base URL and one routing engine. Higher tiers get a higher rate limit and more included credits.</P>
      <Table
        head={["Plan", "Price", "Requests/sec", "For"]}
        rows={[
          ["Sandbox", "$0", "1", "Testing and prototyping"],
          ["Build", "$25/mo", "10", "Your first integration"],
          ["Scale", "$100/mo", "50", "Production workloads"],
          ["Growth", "$500/mo", "150", "High-volume production"],
          ["Enterprise", "Custom", "Custom", "Custom limits, Titan Direct streaming, SLAs and dedicated support"],
        ]}
      />
      <P>
        Credit allowances, key counts and upgrades are covered in{" "}
        <DocLink slug="developers-portal/plans-rate-limits-credits">Plans, Rate Limits &amp; Credits</DocLink>.
      </P>

      <H2 id="base-url">Base URL</H2>
      <CodeBlock code={BASE_URL} />
      <P>
        One hostname serves all plans, and requests go to the nearest region automatically, so there is nothing regional to configure. See{" "}
        <DocLink slug="developers-portal/latency">Latency and Server Locations</DocLink>.
      </P>
      <P>There are four endpoints, all GET:</P>
      <Table
        head={["Endpoint", "Returns"]}
        rows={[
          [<Code key="q">/api/v1/quote/swap</Code>, "Quoted routes with executable instructions"],
          [<Code key="i">/api/v1/info</Code>, "Protocol version and parameter bounds"],
          [<Code key="v">/api/v1/venues</Code>, "Venue labels you can use in routing filters"],
          [<Code key="p">/api/v1/providers</Code>, "Providers that are quoting right now"],
        ]}
      />

      <H2 id="using-your-api-key">Using your API key</H2>
      <CodeTabs
        tabs={[
          { label: "curl", code: CURL },
          { label: "TypeScript", code: TS },
          { label: "Python", code: PY },
        ]}
      />

      <H2 id="response-format">Response format</H2>
      <Table
        head={["Accept header", "Encoding", "Best for"]}
        rows={[
          [<Code key="j">application/json</Code>, "Public keys as base58 strings, instruction data as base64", "Development, debugging, any language"],
          [<Code key="m">application/vnd.msgpack</Code>, "Public keys as 32-byte arrays, data as raw bytes", "Latency-sensitive production integrations"],
        ]}
      />
      <Callout>
        MessagePack is the default, so set <Code>Accept</Code> on every request.
      </Callout>

      <H2 id="reading-a-quote-response">Reading a quote response</H2>
      <Table
        head={["Field", "Description"]}
        rows={[
          [
            <Code key="q">quotes</Code>,
            <span key="qd">
              An object keyed by provider ID, not an array; iterate with <Code>Object.entries(quotes)</Code>. You get one entry unless you set{" "}
              <Code>numQuotes</Code> (up to 10).
            </span>,
          ],
          [
            <Code key="w">metadata.ExpectedWinner</Code>,
            <span key="wd">
              The route Titan recommends. Use it instead of sorting by <Code>outAmount</Code>.
            </span>,
          ],
        ]}
      />

      <H2 id="portal-or-distributor-access">Portal or distributor access</H2>
      <P>Titan is also offered through Triton and QuickNode, which issue a JWT and give you their own endpoint.</P>
      <Table
        head={["", "Developers Portal", "Distributor"]}
        rows={[
          ["Access", "Self-serve key", "Token issued by your provider"],
          ["Host", <Code key="h">portal.api.titan.exchange</Code>, "Provider-supplied endpoint"],
          ["Credential", <Code key="c">x-api-key</Code>, <Code key="b">Authorization: Bearer &lt;jwt&gt;</Code>],
          ["Encoding", "JSON or MessagePack", "MessagePack"],
          ["Interfaces", "REST", "REST, plus WebSocket streaming for enterprise customers"],
        ]}
      />
      <Callout>
        The two credentials can&apos;t be swapped: a distributor JWT sent to <Code>portal.api.titan.exchange</Code> returns <Code>401 invalid_api_key</Code>,
        and so does a Portal key sent to a distributor endpoint.
      </Callout>

      <H2 id="next-steps">Next steps</H2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {NEXT_STEPS.map(([slug, title, body]) => (
          <Link key={slug} href={docHref(slug)} className="rounded-xl border border-[#3d392e] p-4 transition hover:border-[#f2d364]/60 hover:bg-white/[0.02]">
            <p className="font-medium text-[#fffff9]">{title}</p>
            <p className="mt-1 text-sm text-[#c7c0a9]">{body}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function DocLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <Link href={docHref(slug)} className="text-[#f2d364] underline decoration-[#f2d364]/40 underline-offset-2 hover:decoration-[#f2d364]">
      {children}
    </Link>
  );
}

/** One-line summaries in our own words, from facts in RESEARCH_TITAN_UMBRA.md. */
const SUMMARIES: Record<string, string> = {
  "developers-portal/reference": "Query parameters and response fields for the four GET endpoints. A swap quote needs inputMint, outputMint, amount (in base units) and userPublicKey; slippageBps defaults to 100 and numQuotes goes up to 10.",
  "developers-portal/errors": "What each error means: 400 for a bad parameter, 401 invalid_api_key, 403 'Missing Authentication Token' for a wrong path or method, 404 code -7 when no route exists, and 429 for rate_limited (honour retry-after) or allowance_exhausted.",
  "developers-portal/plans-rate-limits-credits": "Sandbox is free at 1 request per second; paid tiers raise the rate limit and included credits. The Sandbox plan includes 2.5M credits a month.",
  "developers-portal/titan-genesis-50": "A launch offer: 25% off paid plans for 12 months.",
  "dart-swap-api/overview": "DART's own API (beta) at api.titan.exchange/dart, with /health, /markets and /swap. It needs no key and allows 1 request per second per IP.",
  "special-order-types/overview": "DCA, triggers and Slice orders through a partner API that uses partner keys and Sign-In with Solana.",
};

export function SummaryPage({ slug, title }: { slug: string; title: string }) {
  return (
    <>
      <H1>{title}</H1>
      <Lead>{SUMMARIES[slug] ?? `${title} in Titan's developer docs.`}</Lead>
      <Callout>
        This demo summarizes the Developers Portal introduction in full. For everything on this page, read it on Titan&apos;s docs:{" "}
        <a href={originalHref(slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#f2d364] underline decoration-[#f2d364]/40 underline-offset-2">
          {title} <ExternalLink className="h-3 w-3" />
        </a>
      </Callout>
    </>
  );
}

export function DocsHome() {
  return (
    <>
      <H1>Developer Docs</H1>
      <Lead>Build on Titan&apos;s routing: quotes over REST, DART, special order types and limit-order searching.</Lead>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {DOCS_NAV.filter((g) => g.label).map((g) => (
          <Link key={g.label} href={docHref(g.pages[0]!.slug)} className="rounded-xl border border-[#3d392e] p-4 transition hover:border-[#f2d364]/60 hover:bg-white/[0.02]">
            <p className="font-medium text-[#fffff9]">{g.label}</p>
            <p className="mt-1 text-sm text-[#c7c0a9]">{g.pages.map((p) => p.title).join(" · ")}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
