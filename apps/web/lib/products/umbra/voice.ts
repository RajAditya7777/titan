/**
 * Voice STT/TTS configuration and phonetic corrections for Umbra / Nimbus.
 */

export const umbraVoiceConfig = {
  sttPrompt:
    "Umbra, Nimbus, Solana, shielded, unshield, deposit, private send, withdraw, relayer, platform wallet, identity commitment, USDC, USDT, SOL, CipherOwl, OFAC, confidential note, nullifier, zk-SNARK.",

  spokenTickers: ["SOL", "USDC", "USDT"],

  corrections: [
    [/\b(amber|umber|umbrella|ombra)\b/gi, "Umbra"],
    [/\b(nim bus|nimbis|nembus)\b/gi, "Nimbus"],
    [/\b(relator|re-layer)\b/gi, "relayer"],
    [/\b(un shield|un-shield)\b/gi, "unshield"],
    [/\b(sheeled|sheild)\b/gi, "shield"],
    [/\b(nulifier|nullifyer)\b/gi, "nullifier"],
    [/\b(u s d c|you s d c)\b/gi, "USDC"],
    [/\b(u s d t|tether)\b/gi, "USDT"],
    [/\b(sol|soul)\b/gi, "SOL"],
  ] as [RegExp, string][],
};
