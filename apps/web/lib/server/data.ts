import "server-only";
import { callTool } from "./mcp-client";

/**
 * Page data goes through the same MCP server the LLM uses, so the UI and the companion
 * can never disagree about a number.
 */

export interface StablecoinInfo {
  symbol: string;
  index: number;
  underlying: string | null;
  apy: { percent: number; rawBps: number; asOf: string } | null;
  exchangeRate: { usdPerToken: number; asOf: string } | null;
  supply: { current: number; cap: number; remaining: number; utilizationPercent: number } | null;
}

export const getOverview = () => callTool<{ stablecoins: StablecoinInfo[]; error?: { message: string } }>("reflect_get_stablecoin_overview", {});

export const getStats = (historyDays?: number) =>
  callTool<{
    holders: number;
    totalSupply: number;
    cumulativeVolume: number;
    totalYieldDistributed: number;
    history: { apy: { date: string; percent: number }[]; exchangeRate: { date: string; usdPerToken: number }[] } | null;
    error?: { message: string };
  }>("reflect_get_protocol_stats", historyDays ? { historyDays } : {});

export const getEvents = (limit = 6) =>
  callTool<{
    events: { type: string; at: string; signer: string | null; amount: number | null; signature: string | null; explorer: string | null }[];
    error?: { message: string };
  }>("reflect_get_protocol_events", { limit });
