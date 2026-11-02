export const TITAN_SPOKEN_TICKERS = [
  "SOL",
  "USDC",
  "USDT",
  "JUP",
  "BONK",
  "cbBTC",
];

export const TITAN_VOICE_CORRECTIONS: [RegExp, string][] = [
  [/\b(dirt|dart|d\.a\.r\.t|dark)\b/gi, "DART"],
  [/\b(argus|argos|augus)\b/gi, "Argos"],
  [/\b(sleepage|slipage|slipping)\b/gi, "slippage"],
  [/\b(soul|solana|s\.o\.l)\b/gi, "SOL"],
  [/\b(u\.s\.d\.c|usd coin)\b/gi, "USDC"],
  [/\b(u\.s\.d\.t|tether)\b/gi, "USDT"],
  [/\b(jupiter|jup)\b/gi, "JUP"],
  [/\b(bonk)\b/gi, "BONK"],
  [/\b(prime mode|prime)\b/gi, "Prime"],
];
