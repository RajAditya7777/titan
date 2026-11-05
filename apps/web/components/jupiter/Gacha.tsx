"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Archive, Box, ChevronDown, ChevronUp, Filter, Minus, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Store, X, Zap } from "lucide-react";
import { useCompanion, useGuidedField } from "@/components/companion/CompanionProvider";
import { BUYBACK_DAYS, BUYBACK_RATE, CATEGORIES, LATEST_PULLS, MARKET_LISTINGS, PACKS, type GradedCard, type Pack, type Tier } from "@/lib/products/jupiter/gacha";
import { gachaProblem, sellBack, setJup, useJup } from "./store";

const TIER_COLOR: Record<Tier, string> = { Epic: "#b06cff", Rare: "#4ea8ff", Uncommon: "#3ec98a", Common: "#8a99a6" };
const usd = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** A pack's foil wrapper, drawn in CSS (original art). */
function PackArt({ pack, size = "sm" }: { pack: Pack; size?: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${lg ? "h-[300px] w-[200px]" : "h-[96px] w-[64px]"}`}
      style={{ background: `linear-gradient(160deg, ${pack.colors[0]}, ${pack.colors[1]} 55%, ${pack.colors[0]})`, boxShadow: lg ? `0 30px 60px -20px ${pack.colors[1]}` : undefined }}
    >
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,.35) 0 2px, transparent 2px 9px)" }} />
      <div className="absolute inset-x-0 top-0 h-[10%] bg-black/25" />
      <div className="absolute inset-x-0 bottom-0 h-[10%] bg-black/25" />
      <div className="absolute inset-0 grid place-items-center">
        <span className={`font-black uppercase italic tracking-tight text-white drop-shadow ${lg ? "text-[34px]" : "text-[11px]"}`} style={{ textShadow: "0 2px 0 rgba(0,0,0,.35)" }}>
          {pack.name}
        </span>
      </div>
      <Sparkles className={`absolute text-white/70 ${lg ? "right-4 top-8" : "right-1 top-3"}`} size={lg ? 22 : 9} />
    </div>
  );
}

/** A graded slab: label with grade on top, the card underneath (original drawing). */
function Slab({ card, tier, small }: { card: GradedCard; tier?: Tier; small?: boolean }) {
  const grade = card.grade.match(/\d+(\.\d)?/)?.[0] ?? "";
  const glow = tier ? TIER_COLOR[tier] : "#4ea8ff";
  return (
    <div className={`rounded-lg bg-gradient-to-b from-[#e9edf0] to-[#c9d0d6] p-1.5 ${small ? "w-[128px]" : "w-[170px]"}`} style={{ boxShadow: tier && tier !== "Common" ? `0 0 26px -4px ${glow}` : undefined }}>
      <div className="flex items-center justify-between rounded-sm bg-white px-1.5 py-1">
        <span className="line-clamp-2 text-[7.5px] font-semibold leading-tight text-[#b4232c]">{card.name}</span>
        <span className="ml-1 shrink-0 text-[15px] font-black text-[#1a1a1a]">{grade}</span>
      </div>
      <div className={`mt-1.5 grid place-items-center rounded-sm ${small ? "h-[130px]" : "h-[170px]"}`} style={{ background: `linear-gradient(150deg, ${glow}33, #1b242c 60%), repeating-linear-gradient(45deg, rgba(255,255,255,.04) 0 6px, transparent 6px 12px)` }}>
        <span className="text-[34px]" aria-hidden>{/charizard|dark|black/i.test(card.name) ? "🔥" : /pikachu|raichu|zekrom/i.test(card.name) ? "⚡" : /mew|espeon|giratina/i.test(card.name) ? "🔮" : /gyarados|magikarp|keldeo/i.test(card.name) ? "🌊" : "✨"}</span>
      </div>
    </div>
  );
}

export function GachaView() {
  const s = useJup();
  const { setPageContext } = useCompanion();
  const [tab, setTab] = useState<"packs" | "collection" | "market">("packs");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Spotlight");
  const [below, setBelow] = useState<"inside" | "pulls">("pulls");
  const [oddsOpen, setOddsOpen] = useState(true);
  const count = useGuidedField("jup-gacha-count", s.gachaCount, (v) => setJup({ gachaCount: v }));
  const pack = PACKS.find((p) => p.id === s.gachaPack) ?? PACKS[1]!;
  const problem = gachaProblem(s);
  const shown = PACKS.filter((p) => category === "Spotlight" || category === "All packs" || p.category === category);

  useEffect(() => {
    setPageContext(() => ({
      product: "jupiter",
      page: "gacha",
      tab,
      connected: s.connected,
      usdcBalance: s.balances.USDC,
      selectedPack: { name: pack.name, price: pack.price, expectedValue: pack.expectedValue, odds: pack.odds.map((o) => `${o.tier} ${o.chance * 100}% ($${o.min}-$${o.max})`) },
      packCount: s.gachaCount,
      turbo: s.turbo,
      collection: s.collection.slice(0, 8).map((p) => `${p.name} (${p.tier}, ${usd(p.value)} USDC)`),
      lastPulls: s.reveal?.map((p) => `${p.name} ${p.tier} ${usd(p.value)}${p.sold ? " (sold back)" : ""}`) ?? null,
      problem,
    }));
  }, [s, tab, pack, problem, setPageContext]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-5">
      <div data-companion="jup-gacha-tabs" className="flex justify-center gap-1">
        {(
          [
            ["packs", "Packs", Box],
            ["collection", "Collection", Archive],
            ["market", "Marketplace", Store],
          ] as const
        ).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] ${tab === id ? "bg-[#c7f284]/10 text-[#c7f284]" : "text-[#b7c3cc] hover:text-white"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "packs" && (
        <>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-lg px-3 py-1.5 text-[12.5px] ${category === c ? "bg-[#c7f284]/10 text-[#c7f284]" : "text-[#b7c3cc] hover:bg-white/[0.04]"}`}>
                {c}
                {c === "Pokémon" && <span className="ml-1.5 rounded bg-[#c7f284]/10 px-1 text-[10px] text-[#c7f284]">New</span>}
              </button>
            ))}
          </div>

          <div data-companion="jup-gacha-packs" className="mt-4 flex gap-5 overflow-x-auto pb-2">
            {shown.length === 0 && <p className="py-8 text-[13px] text-[#6b7a86]">New {category} packs are coming soon.</p>}
            {shown.map((p) => (
              <button key={p.id} type="button" onClick={() => setJup({ gachaPack: p.id })} className={`shrink-0 rounded-xl p-2 text-center transition ${s.gachaPack === p.id ? "bg-white/[0.06] ring-1 ring-[#c7f284]/50" : "hover:bg-white/[0.03]"}`}>
                {p.limited && <span className="mb-1 block text-[10px] text-[#c7f284]">⏱ 2d 5h</span>}
                <PackArt pack={p} />
                <span className="mt-1.5 block text-[12px] font-medium">{p.name}</span>
                <span className="block text-[11.5px] text-[#b7c3cc]">${usd(p.price)}</span>
                <span className="block text-[10px] text-[#6b7a86]">{p.category}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="relative grid min-h-[420px] place-items-center overflow-hidden rounded-2xl bg-[#0f151a]">
              <div className="flex items-end">
                {[-2, -1, 0, 1, 2].map((i) => (
                  <motion.div
                    key={`${pack.id}${i}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: i === 0 ? 1 : 0.55, y: Math.abs(i) * 18, rotate: i * 6, scale: i === 0 ? 1 : 0.82 }}
                    whileHover={i === 0 ? { y: -10, rotate: [0, -2, 2, 0] } : undefined}
                    transition={{ type: "spring", stiffness: 160, damping: 16, delay: Math.abs(i) * 0.05 }}
                    className={i === 0 ? "z-10 cursor-pointer" : "-mx-16"}
                    onClick={() => i === 0 && !problem && s.connected && setJup({ stage: "review", review: "gacha" })}
                  >
                    <PackArt pack={pack} size="lg" />
                  </motion.div>
                ))}
              </div>
              <p className="absolute bottom-4 flex items-center gap-1.5 text-[12px] text-[#8a99a6]"><RefreshCw size={12} /> Tap the pack to open</p>
            </div>

            <aside className="space-y-3">
              {pack.limited && (
                <div className="rounded-xl border border-white/[0.06] bg-[#131a20] p-3 text-[12px]">
                  <p className="font-medium">The Void Pack Is Here!</p>
                  <p className="text-[#8a99a6]">Limited to 7 days only, with grails worth up to <span className="text-[#c7f284]">$50K</span>, a <span className="text-[#c7f284]">1000x</span> pull.</p>
                </div>
              )}
              <div className="rounded-xl border border-white/[0.06] bg-[#131a20] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[16px] font-semibold">{pack.category === "Mixed" ? "" : "Pokemon "}{pack.name} Pack</p>
                  <span className="rounded-full bg-[#2775ca]/20 px-2 py-0.5 text-[12px] text-[#8fc0ff]">● {usd(pack.price)}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-[#8a99a6]">{pack.tagline}</p>
                <div data-companion="jup-gacha-ev" className="mt-3 flex items-center justify-between text-[13px]">
                  <span className="text-[#c7f284]">Expected value</span>
                  <span className="text-[16px] font-semibold">${usd(pack.expectedValue)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px]">
                  <span className="text-[#8a99a6]">Packs</span>
                  <span className="flex items-center gap-2">
                    <button type="button" aria-label="Fewer packs" onClick={() => count(String(Math.max(1, Number(s.gachaCount) - 1)))} className="rounded p-1 text-[#8a99a6] hover:text-white"><Minus size={13} /></button>
                    <input data-companion="jup-gacha-count" value={s.gachaCount} onChange={(e) => count(e.target.value.replace(/\D/g, ""))} className="w-8 bg-transparent text-center focus:outline-none" />
                    <button type="button" aria-label="More packs" onClick={() => count(String(Math.min(10, Number(s.gachaCount) + 1)))} className="rounded p-1 text-[#8a99a6] hover:text-white"><Plus size={13} /></button>
                  </span>
                </div>
                {s.connected ? (
                  <button type="button" data-companion="jup-gacha-open" disabled={!!problem} onClick={() => setJup({ stage: "review", review: "gacha" })} className="mt-3 h-11 w-full rounded-xl bg-[#c7f284] text-[14px] font-semibold text-[#0b1014] disabled:bg-[#1b242c] disabled:text-[#6b7a86]">
                    {problem ?? `Open ${s.gachaCount} pack${Number(s.gachaCount) > 1 ? "s" : ""} · ${usd(pack.price * Number(s.gachaCount))} USDC`}
                  </button>
                ) : (
                  <button type="button" data-companion="jup-gacha-open" onClick={() => setJup({ stage: "connect" })} className="mt-3 h-11 w-full rounded-xl bg-[#c7f284] text-[14px] font-semibold text-[#0b1014]">Connect wallet to open</button>
                )}
              </div>
              <button type="button" data-companion="jup-gacha-turbo" onClick={() => setJup({ turbo: !s.turbo })} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#131a20] p-3 text-left">
                <span>
                  <span className="flex items-center gap-1.5 text-[13px]"><Zap size={13} className="text-[#c7f284]" /> Turbo</span>
                  <span className="text-[11.5px] text-[#8a99a6]">Auto-sell common pulls for USDC</span>
                </span>
                <span className={`relative h-5 w-9 rounded-full transition ${s.turbo ? "bg-[#c7f284]" : "bg-white/10"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${s.turbo ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </button>
              <div data-companion="jup-gacha-buyback" className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#131a20] p-3">
                <span>
                  <span className="block text-[13px]">Instant buyback</span>
                  <span className="text-[11.5px] text-[#8a99a6]">Sell any pull back for USDC within {BUYBACK_DAYS} days</span>
                </span>
                <span className="rounded-md bg-[#c7f284]/10 px-2 py-0.5 text-[13px] font-semibold text-[#c7f284]">{BUYBACK_RATE * 100}%</span>
              </div>
              <div data-companion="jup-gacha-odds" className="rounded-xl border border-white/[0.06] bg-[#131a20] p-3">
                <button type="button" onClick={() => setOddsOpen((o) => !o)} className="flex w-full items-center justify-between text-[13px]">
                  Statistics &amp; odds {oddsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {oddsOpen && (
                  <div className="mt-2 space-y-2">
                    {pack.odds.map((o) => (
                      <div key={o.tier} className="flex items-center justify-between text-[12.5px]">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: TIER_COLOR[o.tier] }} />
                          <span>
                            <span className="block">{o.tier}</span>
                            <span className="text-[11px] text-[#6b7a86]">{o.tier === "Epic" ? `$${usd(o.min)}+` : `$${usd(o.min)} – $${usd(o.max)}`}</span>
                          </span>
                        </span>
                        <span>{o.chance * 100}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>

          <section data-companion="jup-gacha-pulls" className="mt-5">
            <div className="flex items-center gap-2 text-[13px]">
              <button type="button" onClick={() => setBelow("inside")} className={`rounded-lg px-3 py-1.5 ${below === "inside" ? "bg-[#c7f284]/10 text-[#c7f284]" : "text-[#b7c3cc]"}`}>What&apos;s Inside?</button>
              <button type="button" onClick={() => setBelow("pulls")} className={`rounded-lg px-3 py-1.5 ${below === "pulls" ? "bg-[#c7f284]/10 text-[#c7f284]" : "text-[#b7c3cc]"}`}>Latest Pulls</button>
              <span className="ml-auto flex items-center gap-1 text-[12px] text-[#8a99a6]"><ShieldCheck size={13} /> Guaranteed Authenticity</span>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {(below === "pulls" ? LATEST_PULLS : MARKET_LISTINGS.slice(0, 8)).map((c) => (
                <div key={c.name} className="shrink-0">
                  <Slab card={c} small />
                  <p className="mt-1.5 w-[128px] truncate text-[11.5px]">{c.name}</p>
                  <p className="text-[12px] font-semibold">
                    {usd(c.value)} {below === "pulls" && <span className="text-[#3ec98a]">+{usd(((c.value - 100) / 100) * 100)}%</span>}
                  </p>
                  <p className="text-[10.5px] text-[#6b7a86]">{c.grade}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "collection" && (
        <div className="mt-6">
          <h1 className="text-[26px] font-semibold">Collection</h1>
          <p className="text-[13px] text-[#8a99a6]">View and manage the graded items you own.</p>
          {s.collection.length === 0 ? (
            <div className="mt-6 grid place-items-center rounded-2xl border border-white/[0.06] bg-[#131a20] py-16 text-center">
              <p className="text-[14px]">Open a pack to pull your first graded item.</p>
              <button type="button" onClick={() => setTab("packs")} className="mt-3 rounded-lg bg-[#c7f284] px-4 py-2 text-[13px] font-semibold text-[#0b1014]">Open a pack</button>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {s.collection.map((p) => (
                <div key={p.id}>
                  <Slab card={p} tier={p.tier} />
                  <p className="mt-1.5 truncate text-[12px]">{p.name}</p>
                  <p className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold">{usd(p.value)} USDC</span>
                    <span style={{ color: TIER_COLOR[p.tier] }}>{p.tier}</span>
                  </p>
                  <button type="button" onClick={() => sellBack(p.id)} className="mt-1 w-full rounded-lg bg-[#1b242c] py-1.5 text-[11.5px] hover:bg-[#232e38]">Sell back · {usd(p.value * BUYBACK_RATE)} USDC</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "market" && (
        <div className="mt-6">
          <h1 className="text-[26px] font-semibold">Marketplace</h1>
          <p className="text-[13px] text-[#8a99a6]">Buy and sell graded, tokenized cards with other collectors.</p>
          <div className="mt-4 flex gap-2 text-[12.5px]">
            <span className="flex items-center gap-1.5 rounded-lg bg-[#131a20] px-3 py-2 text-[#b7c3cc]"><Filter size={13} /> Filters</span>
            <span className="flex flex-1 items-center gap-1.5 rounded-lg bg-[#131a20] px-3 py-2 text-[#6b7a86]"><Search size={13} /> Search by name or address</span>
            <span className="rounded-lg bg-[#131a20] px-3 py-2 text-[#b7c3cc]">List Date: Newest to Oldest</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {MARKET_LISTINGS.map((c) => (
              <div key={c.name}>
                <Slab card={c} small />
                <p className="mt-1.5 truncate text-[11.5px]">{c.name}</p>
                <p className="flex justify-between text-[11.5px] text-[#8a99a6]"><span>Price <b className="font-semibold text-white">{usd(c.value)}</b></span><span>{c.grade.replace(/^(PSA|CGC|BGS) /, "")}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Reveal />
    </div>
  );
}

/** Pulls flip in one by one; each can be kept or sold back at 93%. */
function Reveal() {
  const s = useJup();
  if (!s.reveal) return null;
  return (
    <AnimatePresence>
      <motion.div key="reveal" className="fixed inset-0 z-[45] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="relative w-full max-w-[860px] rounded-2xl border border-white/[0.07] bg-[#0f151a] p-6 text-center">
          <button type="button" onClick={() => setJup({ reveal: null })} aria-label="Close" className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8a99a6] hover:bg-white/5"><X size={16} /></button>
          <p className="text-[18px] font-semibold">Your pull{s.reveal.length > 1 ? "s" : ""}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-5">
            {s.reveal.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ rotateY: 180, opacity: 0, y: 20 }}
                animate={{ rotateY: 0, opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.35, type: "spring", stiffness: 120, damping: 14 }}
                className="w-[170px]"
              >
                <Slab card={p} tier={p.tier} />
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: TIER_COLOR[p.tier] }}>{p.tier}</p>
                <p className="truncate text-[12.5px]">{p.name}</p>
                <p className="text-[15px] font-semibold">{usd(p.value)} USDC</p>
                {p.sold ? (
                  <p className="mt-1.5 text-[11.5px] text-[#8a99a6]">Sold back · {usd(p.value * BUYBACK_RATE)} USDC</p>
                ) : (
                  <button type="button" onClick={() => sellBack(p.id)} className="mt-1.5 w-full rounded-lg bg-[#1b242c] py-1.5 text-[11.5px] hover:bg-[#232e38]">Sell back · {usd(p.value * BUYBACK_RATE)}</button>
                )}
              </motion.div>
            ))}
          </div>
          <button type="button" onClick={() => setJup({ reveal: null })} className="mt-6 rounded-xl bg-[#c7f284] px-6 py-2.5 text-[13.5px] font-semibold text-[#0b1014]">Keep and close</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
