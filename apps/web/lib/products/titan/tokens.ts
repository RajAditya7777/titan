import type { Token } from "./types";

export const TOKEN_SOL: Token = {
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
  mint: "So11111111111111111111111111111111111111112",
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  usdPrice: 93.759,
  balance: 12.5,
};

export const TOKEN_USDC: Token = {
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  usdPrice: 1.0,
  balance: 2500.0,
};

export const TOKEN_USDT: Token = {
  symbol: "USDT",
  name: "Tether USD",
  decimals: 6,
  mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
  usdPrice: 1.0,
  balance: 1850.0,
};

export const TOKEN_HYPE: Token = {
  symbol: "HYPE",
  name: "Hyperliquid",
  decimals: 6,
  mint: "HypeToken1111111111111111111111111111111111",
  icon: "https://coin-images.coingecko.com/coins/images/33649/large/hype.png",
  usdPrice: 86.929,
  balance: 45.0,
};

export const TOKEN_PUMP: Token = {
  symbol: "PUMP",
  name: "Pump.fun",
  decimals: 6,
  mint: "PumpToken1111111111111111111111111111111111",
  icon: "https://coin-images.coingecko.com/coins/images/36254/large/pump.png",
  usdPrice: 0.00412891,
  balance: 125000.0,
};

export const TOKEN_ZEC: Token = {
  symbol: "ZEC",
  name: "Zcash",
  decimals: 8,
  mint: "ZecToken11111111111111111111111111111111111",
  icon: "https://coin-images.coingecko.com/coins/images/486/large/circle-zcash-color.png",
  usdPrice: 1219.7,
  balance: 2.1,
};

export const TOKEN_CBBTC: Token = {
  symbol: "cbBTC",
  name: "Coinbase Wrapped BTC",
  decimals: 8,
  mint: "cbbtc257aBdcjhK2D4J48hZtM4F4D32N7B1E9J",
  icon: "https://coin-images.coingecko.com/coins/images/39943/large/cbbtc.webp",
  usdPrice: 77768.9,
  balance: 0.085,
};

export const TOKEN_ETH: Token = {
  symbol: "ETH",
  name: "Ethereum",
  decimals: 8,
  mint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  icon: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png",
  usdPrice: 2260.63,
  balance: 1.45,
};

export const TOKEN_TRUMP: Token = {
  symbol: "TRUMP",
  name: "Official Trump",
  decimals: 6,
  mint: "TrumpToken111111111111111111111111111111111",
  icon: "https://coin-images.coingecko.com/coins/images/34559/large/trump.png",
  usdPrice: 1.701,
  balance: 500.0,
};

export const TOKEN_WBTC: Token = {
  symbol: "WBTC",
  name: "Wrapped BTC",
  decimals: 8,
  mint: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  icon: "https://coin-images.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  usdPrice: 77775.57,
  balance: 0.12,
};

export const TOKEN_JUP: Token = {
  symbol: "JUP",
  name: "Jupiter",
  decimals: 6,
  mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png",
  usdPrice: 1.08,
  balance: 3450.0,
};

export const TOKEN_BONK: Token = {
  symbol: "BONK",
  name: "Bonk",
  decimals: 5,
  mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png",
  usdPrice: 0.0000224,
  balance: 45000000.0,
};

export const TITAN_TOKENS: Record<string, Token> = {
  SOL: TOKEN_SOL,
  USDC: TOKEN_USDC,
  USDT: TOKEN_USDT,
  HYPE: TOKEN_HYPE,
  PUMP: TOKEN_PUMP,
  ZEC: TOKEN_ZEC,
  cbBTC: TOKEN_CBBTC,
  ETH: TOKEN_ETH,
  TRUMP: TOKEN_TRUMP,
  WBTC: TOKEN_WBTC,
  JUP: TOKEN_JUP,
  BONK: TOKEN_BONK,
};

export const DEFAULT_INPUT_TOKEN: Token = TOKEN_USDC;
export const DEFAULT_OUTPUT_TOKEN: Token = TOKEN_SOL;

export function getToken(symbol: string): Token {
  const t = TITAN_TOKENS[symbol.toUpperCase()];
  if (!t) throw new Error(`Unknown token: ${symbol}`);
  return t;
}

export function formatTokenAmount(amount: number, decimals = 4): string {
  if (isNaN(amount) || amount === 0) return "0";
  if (amount < 0.0001) return "<0.0001";
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
