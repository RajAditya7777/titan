/**
 * Titan Rewards campaigns, hardcoded (D-011). Names, dates, pools and the one-line descriptions
 * were read from titan.exchange/rewards on 2026-11-02; all campaigns had ended. Partner logos are
 * not copied: each campaign gets a neutral letter badge instead.
 */
export interface Campaign {
  slug: string;
  name: string;
  /** As shown on the card, e.g. "Sep 8 - Oct 6". */
  dates: string;
  /** Total USDC pool, when the campaign states one. */
  pool: number | null;
  /** Number of weekly epochs (period length in weeks). */
  epochs: number;
  /** What the ranking counts, used in our own-words explanation. */
  volumeOf: string;
  description: string;
  badge: { letters: string; bg: string; fg: string };
}

export const CAMPAIGNS: Campaign[] = [
  { slug: "peaq", name: "Peaq campaign", dates: "Sep 8 - Oct 6", pool: 25_000, epochs: 4, volumeOf: "$PEAQ", description: "$25,000 USDC rewards distributed pro rata based on $PEAQ trading volume on Titan.", badge: { letters: "P", bg: "#ffffff", fg: "#5b5bd6" } },
  { slug: "solstice", name: "Solstice campaign", dates: "Jul 7 - Aug 4", pool: 30_000, epochs: 4, volumeOf: "$SLX", description: "$30,000 USDC rewards distributed pro rata based on $SLX trading volume on Titan.", badge: { letters: "S", bg: "#2a2550", fg: "#f2b9a0" } },
  { slug: "skhynix", name: "SK Hynix campaign", dates: "Jul 10 - Jul 24", pool: 10_000, epochs: 2, volumeOf: "$SKHY", description: "$10,000 USDC rewards distributed pro rata based on $SKHY trading volume on Titan.", badge: { letters: "SK", bg: "#2b1a12", fg: "#f26b3a" } },
  { slug: "robostrategy", name: "RoboStrategy campaign", dates: "Jul 2 - Jul 16", pool: 10_000, epochs: 2, volumeOf: "$BOT", description: "$10,000 USDC rewards distributed pro rata based on $BOT trading volume on Titan.", badge: { letters: "R", bg: "#151515", fg: "#e8e8e8" } },
  { slug: "micron", name: "Micron campaign", dates: "Jun 22 - Jul 6", pool: 10_000, epochs: 2, volumeOf: "$MU", description: "$10,000 USDC rewards distributed pro rata based on $MU trading volume on Titan.", badge: { letters: "M", bg: "#1b1530", fg: "#a78bfa" } },
  { slug: "spacex", name: "SPCX campaign", dates: "Jun 12 - Jun 26", pool: 10_000, epochs: 2, volumeOf: "$SPCX", description: "$10,000 USDC rewards distributed pro rata based on $SPCX (SpaceX - Backpack Securities) trading volume on Titan.", badge: { letters: "SX", bg: "#111111", fg: "#ffffff" } },
  { slug: "prestocks-4", name: "PreStocks campaign 4", dates: "May 14 - Jun 11", pool: 40_000, epochs: 4, volumeOf: "PreStocks", description: "$40,000 USDC rewards distributed pro rata based on PreStocks trading volume on Titan.", badge: { letters: "PS", bg: "#10241b", fg: "#00d692" } },
  { slug: "prestocks-3", name: "PreStocks campaign 3", dates: "Apr 15 - May 13", pool: 30_000, epochs: 4, volumeOf: "PreStocks", description: "$30,000 USDC rewards distributed pro rata based on PreStocks trading volume on Titan.", badge: { letters: "PS", bg: "#10241b", fg: "#00d692" } },
  { slug: "prestocks-2", name: "PreStocks campaign 2", dates: "Mar 18 - Apr 15", pool: 30_000, epochs: 4, volumeOf: "PreStocks", description: "$30,000 USDC rewards distributed pro rata based on PreStocks trading volume on Titan.", badge: { letters: "PS", bg: "#10241b", fg: "#00d692" } },
  { slug: "vanish", name: "Vanish campaign", dates: "Mar 18 - Mar 31", pool: null, epochs: 2, volumeOf: "Private", description: "USDC rewards distributed to the top 100 by Private trading volume on Titan.", badge: { letters: "V", bg: "#1d1d1b", fg: "#f2d363" } },
  { slug: "prestocks", name: "PreStocks campaign", dates: "Feb 18 - Mar 18", pool: 20_000, epochs: 4, volumeOf: "PreStocks", description: "$20,000 USDC rewards distributed pro rata based on PreStocks trading volume on Titan.", badge: { letters: "PS", bg: "#10241b", fg: "#00d692" } },
];

export const CAMPAIGNS_PER_PAGE = 6;

export function campaignBySlug(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.slug === slug);
}

/** Pool split evenly across weekly epochs (Peaq's page shows 25,000 → 6,250 over 4 epochs). */
export function epochReward(c: Campaign): number | null {
  return c.pool == null ? null : c.pool / c.epochs;
}

/** Explanations in our own words, built from each campaign's stated rules. */
export function howItWorks(c: Campaign): Array<{ title: string; body: string }> {
  const eligibility =
    c.slug === "peaq"
      ? "The top 100 wallets by $PEAQ volume in each epoch qualify, ranked separately every epoch. DCA, Limit and Conditional Order volume counts three times toward your rank. $PEAQ contract: PEAQjk7SRS6rXHVFFmpRr7zrC4g5ZuEebpwTxvaLr3b."
      : `Wallets are ranked by ${c.volumeOf} trading volume on Titan, separately in each epoch.`;
  return [
    { title: "Eligibility", body: eligibility },
    { title: "Reward distribution", body: c.pool == null ? "Rewards go to the top 100 wallets by volume." : "Each qualifying wallet gets a share of the pool equal to its share of the volume." },
    { title: "Rewards asset", body: "Rewards are paid in USDC to the wallet connected to Titan after each epoch." },
  ];
}
