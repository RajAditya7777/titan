/**
 * Jupiter Gacha: packs of real, graded, tokenized collectible cards, bought with USDC.
 * Pack names, prices, odds tiers, buyback rate and recent pulls are as shown on jup.ag/gacha
 * (captured Nov 2026). Opening is simulated here: no real purchase or card ever moves (D-008).
 */

export type Tier = "Epic" | "Rare" | "Uncommon" | "Common";

export interface OddsRow {
  tier: Tier;
  chance: number; // 0..1
  min: number;
  max: number;
}

export interface Pack {
  id: string;
  name: string;
  tagline: string;
  category: "Pokémon" | "Mixed";
  price: number;
  /** The site shows EV a touch above price on its featured pack. */
  expectedValue: number;
  odds: OddsRow[];
  limited?: string;
  colors: [string, string];
}

/** Odds on jup.ag's Lucky pack; other packs scale the same tier shape to their price. */
const LUCKY_ODDS: OddsRow[] = [
  { tier: "Epic", chance: 0.01, min: 500, max: 2_500 },
  { tier: "Rare", chance: 0.04, min: 200, max: 500 },
  { tier: "Uncommon", chance: 0.2, min: 100, max: 200 },
  { tier: "Common", chance: 0.75, min: 50, max: 100 },
];
const scaled = (k: number): OddsRow[] => LUCKY_ODDS.map((o) => ({ ...o, min: Math.round(o.min * k), max: Math.round(o.max * k) }));

export const PACKS: Pack[] = [
  { id: "void", name: "Void", tagline: "Grails worth up to $50K, a 1000x pull", category: "Pokémon", price: 50, expectedValue: 50.4, odds: scaled(0.5), limited: "Limited: 7 days only", colors: ["#2b1a6b", "#7b5cff"] },
  { id: "lucky", name: "Lucky", tagline: "Luck-of-the-draw chase pulls", category: "Pokémon", price: 100, expectedValue: 100.61, odds: LUCKY_ODDS, colors: ["#0f5132", "#4cd07d"] },
  { id: "trick-or-treat", name: "Trick or Treat", tagline: "Spooky-season chase cards", category: "Pokémon", price: 250, expectedValue: 251.2, odds: scaled(2.5), colors: ["#3b1450", "#ff8a3d"] },
  { id: "angels", name: "Angels", tagline: "Heavenly holos and full arts", category: "Pokémon", price: 300, expectedValue: 301.5, odds: scaled(3), colors: ["#5a2a4a", "#ff9ecf"] },
  { id: "black-magic", name: "Black Magic", tagline: "Mixed franchises, dark-themed grails", category: "Mixed", price: 444, expectedValue: 446, odds: scaled(4.44), colors: ["#1a1a2e", "#8f6bff"] },
  { id: "immortal", name: "Immortal", tagline: "High-end vintage grails", category: "Pokémon", price: 5_000, expectedValue: 5_030, odds: scaled(50), colors: ["#1c2a5a", "#7fb2ff"] },
];

export const CATEGORIES = ["Spotlight", "All packs", "Pokémon", "Watches", "One Piece", "Sport", "Riftbound", "Dragon Ball", "Mixed"] as const;

export const BUYBACK_RATE = 0.93;
export const BUYBACK_DAYS = 3;

export interface GradedCard {
  name: string;
  grade: string;
  value: number;
}

/** "Latest Pulls" as listed on jup.ag/gacha (value in USDC; % is versus a $100 pack). */
export const LATEST_PULLS: GradedCard[] = [
  { name: "2006 #100 Charizard Gold Star", grade: "CGC GEM MINT 10", value: 99_000 },
  { name: "2010 #81 Espeon-Holo", grade: "PSA GEM-MT 10", value: 67_000 },
  { name: "2006 #5 Deoxys Reverse Foil", grade: "PSA MINT 9", value: 5_700 },
  { name: "2017 #068 Pikachu (Japanese)", grade: "PSA GEM-MT 10", value: 4_500 },
  { name: "2016 #XY143 Magikarp-Holo", grade: "PSA GEM-MT 10", value: 3_400 },
  { name: "2021 #227 Full Art Pikachu", grade: "PSA GEM-MT 10", value: 3_250 },
  { name: "2000 #8 Dark Gyarados-Holo", grade: "PSA GEM-MT 10", value: 3_150 },
  { name: "2024 #232 Mew ex", grade: "CGC PRISTINE 10", value: 2_800 },
];

export const MARKET_LISTINGS: GradedCard[] = [
  { name: "2025 Captain Pikachu (Simplified Chinese)", grade: "CGC PRISTINE 10", value: 40.39 },
  { name: "2022 #179 Full Art Keldeo (Japanese)", grade: "PSA GEM-MT 10", value: 51.35 },
  { name: "2019 #SM211 Charizard GX Promo", grade: "PSA NM-MT 8", value: 43 },
  { name: "2023 #044 Charmander Promo", grade: "PSA NM 7", value: 67 },
  { name: "2024 #078 Persian, Shrouded Fable", grade: "PSA GEM-MT 10", value: 316 },
  { name: "2021 #251 Full Art Mew V", grade: "PSA MINT 9", value: 109.26 },
  { name: "2019 Pikachu & Zekrom GX Judge", grade: "PSA MINT 9", value: 190 },
  { name: "2024 #202 Flareon EX (Japanese)", grade: "PSA GEM-MT 10", value: 127 },
  { name: "2021 Passimian VMAX Climax", grade: "BGS 10 BLACK LABEL", value: 2_935 },
  { name: "2023 #GG69 Giratina VSTAR", grade: "PSA MINT 9", value: 274 },
  { name: "2025 #105 Team Rocket's Weezing", grade: "PSA GEM-MT 10", value: 56 },
  { name: "2025 #176 Iron Leaves EX", grade: "PSA GEM-MT 10", value: 87 },
];

/** Card names a simulated pull can land on, per tier. */
const POOL: Record<Tier, { name: string; grade: string }[]> = {
  Epic: [
    { name: "2000 #8 Dark Gyarados-Holo", grade: "PSA GEM-MT 10" },
    { name: "2024 #232 Mew ex", grade: "CGC PRISTINE 10" },
    { name: "2018 #160 Full Art Rayquaza GX", grade: "PSA GEM-MT 10" },
  ],
  Rare: [
    { name: "2023 #GG69 Giratina VSTAR", grade: "PSA MINT 9" },
    { name: "2024 #078 Persian, Shrouded Fable", grade: "PSA GEM-MT 10" },
    { name: "2019 Pikachu & Zekrom GX Judge", grade: "PSA MINT 9" },
  ],
  Uncommon: [
    { name: "2024 #202 Flareon EX (Japanese)", grade: "PSA GEM-MT 10" },
    { name: "2021 #251 Full Art Mew V", grade: "PSA MINT 9" },
    { name: "2002 #006 Cyndaquil McDonald's", grade: "PSA MINT 9" },
  ],
  Common: [
    { name: "2025 #176 Iron Leaves EX", grade: "PSA GEM-MT 10" },
    { name: "2023 #074 Raichu (Japanese)", grade: "CGC PRISTINE 10" },
    { name: "2025 #105 Team Rocket's Weezing", grade: "PSA GEM-MT 10" },
    { name: "2022 #054 Full Art Mew VMAX", grade: "PSA GEM-MT 10" },
  ],
};

export interface Pull extends GradedCard {
  tier: Tier;
  pack: string;
}

/** One simulated pull: tier by the pack's odds, value uniformly within that tier's range. */
export function rollPull(pack: Pack, rnd: () => number = Math.random): Pull {
  let r = rnd();
  const row = pack.odds.find((o) => (r -= o.chance) < 0) ?? pack.odds[pack.odds.length - 1]!;
  const pool = POOL[row.tier];
  const card = pool[Math.floor(rnd() * pool.length)]!;
  const value = Math.round((row.min + rnd() * (row.max - row.min)) * 100) / 100;
  return { ...card, value, tier: row.tier, pack: pack.name };
}

export const GACHA_KNOWLEDGE = `JUPITER GACHA (jup.ag/gacha) — exact facts:
- What it is: buy digital packs and "open" them to pull a real, professionally graded collectible card (PSA, CGC or BGS slabs). Cards are tokenized, so you own them on Solana and can trade them. "Guaranteed Authenticity". Paid in USDC. It is NOT a token lottery and does not pay out tokens.
- Three tabs: Packs (buy and open), Collection (your graded items, with Items, Activity and Shipping), Marketplace (buy and sell graded, tokenized cards with other collectors).
- Categories: Spotlight, All packs, Pokémon (new), Watches, One Piece, Sport, Riftbound, Dragon Ball, Mixed.
- Packs right now: Void $50 (Pokémon, limited 7 days, grails worth up to $50K, a 1000x pull), Lucky $100 (Pokémon, "luck-of-the-draw chase pulls"), Trick or Treat $250 (Pokémon), Angels $300 (Pokémon), Black Magic $444 (Mixed), Immortal $5,000 (Pokémon).
- Every pack shows its Expected value (EV): the average value of a pull. The Lucky pack's EV is $100.61 for a $100 pack. EV is an average; a single pull is usually worth less than the top cards.
- Lucky pack odds ("Statistics & odds"): Epic 1% ($500+), Rare 4% ($200 to $500), Uncommon 20% ($100 to $200), Common 75% ($50 to $100). So 3 in 4 pulls are Common and worth less than the $100 pack price.
- You can choose how many packs to open at once (pack count stepper).
- Turbo: auto-sells your Common pulls for USDC straight away.
- Instant buyback: sell any pull back for USDC at 93% of its value, within 3 days.
- Latest Pulls show big hits, e.g. a 2006 Charizard Gold Star CGC 10 at 99,000 USDC (+98,900%) and a 2010 Espeon-Holo PSA 10 at 67,000; these are rare outliers.
- Opening on the page: drag to spin the packs and tap one to open. Connect a wallet to open.
- Honest framing: it's chance-based. Most pulls are Common. Only spend what you're happy to lose; buyback at 93% means selling right away loses about 7%.
- In this demo, opening is simulated with play USDC; no real card or money moves.`;
