/**
 * The questions new Titan users actually ask, answered only from facts verified in Titan's own docs
 * (see RESEARCH_TITAN_UMBRA.md). Written to be spoken: short sentences, plain English, no hype.
 * If a fact isn't in the research file, it doesn't go here.
 */
export const FAQ_TOPICS = [
  "different",
  "getting_started",
  "fees",
  "fewer_tokens",
  "swap_failed",
  "sandwich",
  "prime_vs_manual",
  "dart",
  "slippage",
  "limit_orders",
  "private_swaps",
] as const;
export type FaqTopic = (typeof FAQ_TOPICS)[number];

export interface FaqEntry {
  question: string;
  answer: string;
  /** Question patterns, checked in FAQ_TOPICS order. */
  match: RegExp;
}

export const TITAN_FAQ: Record<FaqTopic, FaqEntry> = {
  different: {
    question: "How is Titan different from other DEXs?",
    answer:
      "A single DEX trades only against its own pools, and most aggregators use only their own router. Titan is a meta-aggregator: it collects quotes from several aggregators and market makers, simulates them, and sends your trade to the best one. It also has its own router, Argos, and an on-chain router, DART, that can re-split your trade across pools at the moment it executes. It won't beat every venue on every trade, but it does the comparing for you.",
    match: /\b(different|differ|difference|vs\.?|versus|compare|compared|better than|why (use )?titan|jupiter|raydium|orca|other (dex|exchange|aggregator)s?|meta.?aggregator)\b/i,
  },
  getting_started: {
    question: "What do I need to start?",
    answer:
      "You need a Solana wallet with a little SOL for network fees. Connect it, choose what you sell and what you buy, type the amount, check the rate, then press Review. You approve the trade in your own wallet. In this demo the wallet and trades are simulated.",
    match: /\b(get started|getting started|start|begin|first (time|trade|swap)|what do i need|new here|beginner|how (do i|to) use)\b/i,
  },
  fees: {
    question: "What fees will I pay?",
    answer:
      "Basic swaps have no Titan fee, though the venues your trade passes through may charge their own. Prime mode is zero. DART charges up to 1 basis point. Limit orders cost 10 basis points, and private swaps 0.25 percent. You also pay the Solana network fee.",
    match: /\b(fee|fees|cost|costs|charge|charges|commission|how much (does|do) it)\b/i,
  },
  fewer_tokens: {
    question: "Why did I get fewer tokens than the quote?",
    answer:
      "A quote is an estimate. You can receive a bit less because of price impact, since bigger trades move the price, because of venue fees, and because the price can move before your trade lands, up to your max slippage. Quotes refresh every second. If the price moves past your slippage limit, the swap fails instead of filling at a worse price.",
    match: /\b(fewer|less than|lower than|got less|received less|not what (i|the) (was )?quoted|price impact|why (is|was) the (rate|price))\b/i,
  },
  swap_failed: {
    question: "Why did my swap fail?",
    answer:
      "Usually the price moved past your max slippage, so the swap failed its safety check. Refresh the quote and try again, raise max slippage a little, or use Prime, which sets it for you. A failed transaction can still cost the Solana network fee.",
    match: /\b(fail|failed|failing|error|reverted|didn'?t go through|not going through|stuck)\b/i,
  },
  sandwich: {
    question: "How do I protect myself from sandwich attacks?",
    answer:
      "In a sandwich attack, a bot trades just before and just after you to profit from your slippage. Prime mode includes sandwich protection. In Manual mode you can choose MEV Protect, which sends your trade through Jito and Nozomi. Keeping max slippage tight also limits what a bot can take.",
    match: /\b(sandwich|mev|front.?run|frontrun|bot|bots|protect|protection|safe from)\b/i,
  },
  prime_vs_manual: {
    question: "Should I use Prime or Manual mode?",
    answer:
      "Prime sets slippage and transaction landing for you, includes sandwich protection, and has zero Titan fees, so it's the simple choice. Manual lets you set max slippage separately for regular tokens and for stablecoins or liquid staking tokens, and choose priority fees or MEV Protect, each on Auto or Custom.",
    match: /\b(prime|manual mode|manual)\b/i,
  },
  dart: {
    question: "What are DART and Argos?",
    answer:
      "Argos is Titan's own routing engine: it plans the route off-chain. DART, short for Dynamic Allocation and Real Time, is an on-chain router that can re-split your trade across pools at the moment it executes. Auto uses both and is recommended; Only and Off are the other modes. A green dot means DART is executing your route. DART works on listed pairs such as SOL and USDC.",
    match: /\b(dart|argos|rout(e|es|ing))\b/i,
  },
  slippage: {
    question: "What is slippage?",
    answer:
      "Max slippage is how far the price may move against you before the swap is cancelled. Titan keeps two values: one for regular tokens, and a separate one for stablecoins and liquid staking tokens, which move less. Prime sets it for you.",
    match: /\b(slippage|slip)\b/i,
  },
  limit_orders: {
    question: "How do limit orders work?",
    answer:
      "A limit order trades only at your price or better. Pick the pair, buy or sell, your limit price, the quantity and an expiry. The minimum order is 10 dollars, the fee is 10 basis points, and a limit price worse than the market isn't allowed. Market makers fill it, possibly in parts, and you can cancel an open order.",
    match: /\b(limit order|limit orders|limit price|limit)\b/i,
  },
  private_swaps: {
    question: "What are private swaps?",
    answer:
      "Private swaps go through a one-time Vanish wallet and signer. SOL must be one side of the trade, you should keep about 0.012 SOL in your wallet, and the fee is 0.25 percent.",
    match: /\b(private swap|private swaps|vanish|privacy|private)\b/i,
  },
};

/** The best-matching topic for a free-text question, or null. Specific topics are listed before broad ones. */
export function matchFaqTopic(text: string): FaqTopic | null {
  const order: FaqTopic[] = [
    "different",
    "fewer_tokens",
    "swap_failed",
    "sandwich",
    "private_swaps",
    "limit_orders",
    "dart",
    "slippage",
    "prime_vs_manual",
    "fees",
    "getting_started",
  ];
  return order.find((t) => TITAN_FAQ[t].match.test(text)) ?? null;
}
