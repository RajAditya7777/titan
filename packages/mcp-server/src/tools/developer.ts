import { z } from "zod";
import { defineTool, fail, failFrom, ok } from "../tool";

const SKILL_SOURCE = "https://github.com/palindrome-eng/agent-skills/blob/main/skills/integrate-reflect/SKILL.md";
const SPEC_SOURCE = "https://docs.reflect.money/api-reference/openapi.json";

// ───────────────────────────── check_integration ─────────────────────────────

type Severity = "error" | "warning" | "ok";
interface Finding {
  field: string;
  severity: Severity;
  message: string;
  fix?: string;
  source: string;
}

export const checkIntegration = defineTool({
  name: "reflect_check_integration",
  title: "Check integration config",
  description:
    "Validates a developer's Reflect mint/redeem request against the documented rules (body field names, 6-decimal units, slippage direction, supported stablecoin index, address format, transaction type). Returns findings with fixes. Pass whatever fields the developer has; missing ones are reported.",
  readOnly: true,
  inputSchema: {
    operation: z.enum(["mint", "redeem"]),
    requestBody: z.record(z.string(), z.unknown()).describe("The JSON body the developer sends to /stablecoin/{mint|burn} or /quote"),
    humanAmount: z.number().positive().optional().describe("The amount the developer *intends*, e.g. 100 for 100 USDC"),
    usesLegacyTransaction: z.boolean().optional(),
    includesAddressLookupTable: z.boolean().optional(),
  },
  async handler({ operation, requestBody, humanAmount, usesLegacyTransaction, includesAddressLookupTable }, { reflect }) {
    const findings: Finding[] = [];
    const add = (f: Finding) => findings.push(f);

    // Stale field names from older docs are the #1 integration mistake we observed.
    for (const [stale, current] of [["index", "stablecoinIndex"], ["amount", "depositAmount"]] as const) {
      if (stale in requestBody && !(current in requestBody)) {
        add({
          field: stale,
          severity: "error",
          message: `"${stale}" is not accepted by the live API (it returns 400 "Stablecoin index is required").`,
          fix: `Rename "${stale}" to "${current}".`,
          source: SPEC_SOURCE,
        });
      }
    }

    const index = requestBody.stablecoinIndex ?? requestBody.index;
    if (index === undefined) {
      add({ field: "stablecoinIndex", severity: "error", message: "Missing stablecoinIndex.", fix: "Use 0 for USDC+.", source: SPEC_SOURCE });
    } else {
      try {
        const types = await reflect.getStablecoinTypes();
        if (!types.some((t) => t.index === index)) {
          add({
            field: "stablecoinIndex",
            severity: "error",
            message: `Index ${String(index)} is not a live stablecoin. Live: ${types.map((t) => `${t.index}=${t.name}`).join(", ")}.`,
            fix: "Read indices from GET /stablecoin/types instead of hardcoding.",
            source: SPEC_SOURCE,
          });
        } else add({ field: "stablecoinIndex", severity: "ok", message: "Supported stablecoin index.", source: SPEC_SOURCE });
      } catch (err) {
        return failFrom(err);
      }
    }

    const amount = Number(requestBody.depositAmount ?? requestBody.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      add({ field: "depositAmount", severity: "error", message: "depositAmount must be a positive integer in base units.", source: SPEC_SOURCE });
    } else if (!Number.isInteger(amount)) {
      add({ field: "depositAmount", severity: "error", message: "depositAmount must be an integer of base units, not a decimal.", fix: "Multiply by 1_000_000.", source: SKILL_SOURCE });
    } else if (humanAmount !== undefined) {
      const ratio = amount / humanAmount;
      if (Math.abs(ratio - 1e9) < 1) {
        add({ field: "depositAmount", severity: "error", message: "Amount uses 9 decimals (SOL style). Reflect tokens use 6.", fix: `Use ${humanAmount * 1e6}.`, source: SKILL_SOURCE });
      } else if (Math.abs(ratio - 1) < 1e-9) {
        add({ field: "depositAmount", severity: "error", message: "Amount is in whole tokens; the API expects base units (6 decimals).", fix: `Use ${humanAmount * 1e6}.`, source: SKILL_SOURCE });
      } else if (Math.abs(ratio - 1e6) > 1) {
        add({ field: "depositAmount", severity: "warning", message: `depositAmount/humanAmount = ${ratio}; expected 1,000,000.`, source: SKILL_SOURCE });
      } else add({ field: "depositAmount", severity: "ok", message: "Correct 6-decimal base units.", source: SKILL_SOURCE });
    }

    if ("signer" in requestBody || "minimumReceived" in requestBody) {
      const signer = requestBody.signer;
      if (typeof signer !== "string" || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(signer)) {
        add({ field: "signer", severity: "error", message: "signer must be the user's base58 public key.", source: SPEC_SOURCE });
      }
      const min = Number(requestBody.minimumReceived);
      if (!min) {
        add({ field: "minimumReceived", severity: "error", message: "minimumReceived is zero or missing: users can be sandwiched.", fix: "Derive it from a fresh quote minus slippage.", source: SKILL_SOURCE });
      } else if (operation === "redeem" && Number.isFinite(amount) && min < amount) {
        add({ field: "minimumReceived", severity: "warning", message: "For USDC+ redeems, minimumReceived is normally ABOVE the input because USDC+ has appreciated.", fix: "Use the redeem quote minus slippage.", source: SKILL_SOURCE });
      }
    }

    if (usesLegacyTransaction) {
      add({ field: "transaction", severity: "error", message: "Legacy transactions fail. Always use VersionedTransaction (v0).", source: SKILL_SOURCE });
    }
    if (includesAddressLookupTable === false) {
      add({ field: "transaction", severity: "error", message: "Stablecoin SDK transactions require the address lookup table (stablecoin.lookupTable).", fix: "compileToV0Message([lut])", source: SKILL_SOURCE });
    }

    const errors = findings.filter((f) => f.severity === "error").length;
    return ok({ valid: errors === 0, errorCount: errors, findings }, "derived", [SPEC_SOURCE, SKILL_SOURCE]);
  },
});

// ───────────────────────────── explain_error ─────────────────────────────

interface KnownError {
  id: string;
  match: RegExp;
  title: string;
  explanation: string;
  fix: string[];
  source: string;
  /** "reflect-api" = observed from the live API; "reflect-docs" = documented; "solana" = general chain behaviour. */
  origin: "reflect-api" | "reflect-docs" | "solana";
}

export const ERROR_CATALOG: KnownError[] = [
  {
    id: "index-required",
    match: /stablecoin index is required|^\s*\d*\s*"?required"?\s*$/i,
    title: "Request body uses the wrong field names",
    explanation: "The API could not find `stablecoinIndex` in the body. Older docs used `index`/`amount`; the live API expects `stablecoinIndex`/`depositAmount`.",
    fix: ['Send {"stablecoinIndex": 0, "depositAmount": 1000000}.'],
    source: SPEC_SOURCE,
    origin: "reflect-api",
  },
  {
    id: "unsupported-index",
    match: /only stablecoin index .* supported|stablecoin with the specified index not found/i,
    title: "Unsupported stablecoin",
    explanation: "Only USDC+ (0) and USDT+ (1) are served by this API.",
    fix: ["Read the live list from GET /stablecoin/types."],
    source: SPEC_SOURCE,
    origin: "reflect-api",
  },
  {
    id: "rate-limited",
    match: /429|rate.?limit|too many requests/i,
    title: "Rate limited",
    explanation: "Too many requests in a short time.",
    fix: ["Back off exponentially with jitter: min(base·2^attempt + jitter, max).", "Cache read endpoints for a few seconds."],
    source: SKILL_SOURCE,
    origin: "reflect-docs",
  },
  {
    id: "slippage",
    match: /slippage|minimum.?received|exceeds? desired slippage|0x1771/i,
    title: "Price moved past your minimum received",
    explanation: "The program refused the trade because the output would be below `minimumReceived`. This protects you; it means the exchange rate moved between quote and execution.",
    fix: ["Fetch a fresh quote and rebuild the transaction.", "For redeems, remember USDC+ has appreciated: minimum USDC should be above the USDC+ input."],
    source: SKILL_SOURCE,
    origin: "reflect-docs",
  },
  {
    id: "not-whitelisted",
    match: /whitelist|not allowed|unauthori[sz]ed signer/i,
    title: "Wallet not whitelisted (closed beta)",
    explanation: "Reflect is in closed beta; wallets must be whitelisted before they can mint or redeem.",
    fix: ["Ask the integration owner to call POST /whitelabel/whitelist for this wallet."],
    source: SKILL_SOURCE,
    origin: "reflect-docs",
  },
  {
    id: "legacy-tx",
    match: /legacy|versioned transaction|address (table )?lookup|transaction too large|too many account keys/i,
    title: "Transaction format",
    explanation: "Reflect stablecoin instructions need a v0 VersionedTransaction with the stablecoin's address lookup table; legacy transactions are too large.",
    fix: ["new TransactionMessage({...}).compileToV0Message([lut])", "Load the ALT from stablecoin.lookupTable."],
    source: SKILL_SOURCE,
    origin: "reflect-docs",
  },
  {
    id: "account-not-initialized",
    match: /account(not)?initialized|account does not exist|could not find account|AccountNotInitialized|0xbc4/i,
    title: "Token account not initialised",
    explanation: "This wallet has never held the stablecoin, so its token account does not exist yet.",
    fix: ["Include stablecoin.initializeTokenAccounts(...) before the first mint (the REST endpoints usually handle this)."],
    source: SKILL_SOURCE,
    origin: "reflect-docs",
  },
  {
    id: "not-loaded",
    match: /not loaded|load\(\)|cannot read propert(y|ies) of undefined.*(controller|collaterals)/i,
    title: "SDK used before load()",
    explanation: "The stable.ts SDK must fetch on-chain state with `.load(connection)` at the start of each session.",
    fix: ["await stablecoin.load(connection) before mint/redeem."],
    source: SKILL_SOURCE,
    origin: "reflect-docs",
  },
  {
    id: "blockhash",
    match: /blockhash not found|block height exceeded|expired/i,
    title: "Transaction expired",
    explanation: "Solana transactions embed a recent blockhash and expire after roughly 60–90 seconds.",
    fix: ["Prepare the transaction again and sign promptly."],
    source: "https://solana.com/docs/core/transactions",
    origin: "solana",
  },
  {
    id: "insufficient-funds",
    match: /insufficient (funds|lamports)|0x1\b/i,
    title: "Insufficient balance",
    explanation: "The wallet lacks the token amount or SOL for network fees/rent.",
    fix: ["Check the token balance and keep a little SOL for fees."],
    source: "https://solana.com/docs/core/fees",
    origin: "solana",
  },
  {
    id: "permissioned",
    match: /rebalance|permission|admin/i,
    title: "Permissioned instruction",
    explanation: "Instructions such as rebalance, freeze and updateCap are admin-only and must never be called by integrations.",
    fix: ["Remove the call; only mint/redeem/initializeTokenAccounts are user-facing."],
    source: SKILL_SOURCE,
    origin: "reflect-docs",
  },
];

export const explainError = defineTool({
  name: "reflect_explain_error",
  title: "Explain an error",
  description:
    "Translate a Reflect API, SDK or Solana transaction error into plain language with concrete fixes. Pass the raw error message (and HTTP status if any). Only known, documented errors are matched; unknown errors are reported as unknown rather than guessed.",
  readOnly: true,
  inputSchema: {
    message: z.string().min(1).max(4000),
    httpStatus: z.number().int().optional(),
  },
  async handler({ message, httpStatus }) {
    const haystack = `${httpStatus ?? ""} ${message}`;
    const matches = ERROR_CATALOG.filter((e) => e.match.test(haystack));
    if (matches.length === 0) {
      return ok(
        {
          matched: false,
          explanation: "This error is not in the documented catalog. Check docs.reflect.money or share the full transaction logs.",
          searchDocs: "Use reflect_get_documentation with keywords from the error.",
        },
        "static-docs",
      );
    }
    return ok(
      { matched: true, matches: matches.map(({ match: _m, ...rest }) => rest) },
      "static-docs",
      [...new Set(matches.map((m) => m.source))],
    );
  },
});

// ───────────────────────────── get_documentation ─────────────────────────────

interface DocEntry {
  title: string;
  url: string;
  summary: string;
}

let docsCache: { at: number; entries: DocEntry[] } | null = null;

/** Parses the `- [Title](url): summary` lines of docs.reflect.money/llms.txt. */
export function parseLlmsTxt(text: string): DocEntry[] {
  const entries: DocEntry[] = [];
  for (const line of text.split("\n")) {
    const m = /^- \[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?$/.exec(line.trim());
    if (m) entries.push({ title: m[1]!, url: m[2]!, summary: (m[3] ?? "").slice(0, 300) });
  }
  return entries;
}

export function rankDocs(entries: DocEntry[], query: string, limit: number): DocEntry[] {
  const terms = query.toLowerCase().split(/[^a-z0-9+]+/).filter((t) => t.length > 1);
  return entries
    .map((e) => {
      const title = e.title.toLowerCase();
      const body = `${e.summary} ${e.url}`.toLowerCase();
      const score = terms.reduce((s, t) => s + (title.includes(t) ? 3 : 0) + (body.includes(t) ? 1 : 0), 0);
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}

export const getDocumentation = defineTool({
  name: "reflect_get_documentation",
  title: "Search Reflect docs",
  description:
    "Search the official Reflect documentation index (docs.reflect.money/llms.txt) and return the most relevant pages with URLs and summaries, for citing sources.",
  readOnly: true,
  inputSchema: {
    query: z.string().min(2).max(200),
    limit: z.number().int().min(1).max(10).default(5),
  },
  async handler({ query, limit }, { fetch, docsIndexUrl }) {
    try {
      if (!docsCache || Date.now() - docsCache.at > 60 * 60 * 1000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8_000);
        const res = await fetch(docsIndexUrl, { signal: controller.signal }).finally(() => clearTimeout(timer));
        if (!res.ok) return fail("UPSTREAM_ERROR", `Docs index returned HTTP ${res.status}`, { retryable: res.status >= 500 });
        docsCache = { at: Date.now(), entries: parseLlmsTxt(await res.text()) };
      }
      const results = rankDocs(docsCache.entries, query, limit);
      return ok({ query, results, totalIndexed: docsCache.entries.length }, "live", [docsIndexUrl]);
    } catch {
      return fail("NETWORK", "Could not reach docs.reflect.money", { retryable: true });
    }
  },
});

export function __resetDocsCache() {
  docsCache = null;
}
