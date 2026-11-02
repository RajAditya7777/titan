"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, Check, ChevronDown, ArrowRight } from "lucide-react";
import { useCompanion } from "@/components/companion/CompanionProvider";
import { DotArt, paintCoins, paintGlobe, paintLock, paintSend, paintShield, paintSwap, paintText, paintVault } from "./DotArt";
import { UmbraWidget } from "./Widget";

const MANIFESTO = [
  "Financial privacy should be easy, accessible and ubiquitous.",
  "This is already expected of the world outside of crypto and with growing surveillance both offchain and onchain.",
  "It is critical now more than ever that you have a safe haven for your money, true private property & ownership of your assets, and the freedom to make your own choices.",
  "We are building Umbra to make this the default.",
];

const FEATURES = [
  { id: "swap", title: "Swap privately", body: "Exchange supported assets directly from your private balance. Keep your trade amounts and activity out of public view.", paint: paintSwap, tall: true },
  { id: "hold", title: "Hold privately", body: "Move supported assets from your wallet into a private balance. Keep your holdings out of public view while retaining ownership and control of your funds.", paint: paintVault, tall: false },
  { id: "earn", title: "Earn privately", body: "Earn up to 3.5% yield with USDv, a fully reserved digital dollar on Solana. USDv keeps your money liquid and productive while Umbra keeps it private.", paint: paintText("3.5%", 800, 0.7), tall: false },
  { id: "send", title: "Send privately", body: "Send supported assets through private pools on Solana, including Privacy Cash, with Helius support coming soon. Keep who you pay and how much you send out of public view.", paint: paintSend, tall: true },
];

const COMPLIANCE = [
  { n: "01", t: "Perimeter Screening", b: "Screen public wallet addresses with providers such as Range and Cipherowl before assets enter or leave private balances." },
  { n: "02", t: "Registered Recipients", b: "Every private transfer within the shielded pool must go to a registered recipient address that meets KYP requirements." },
  { n: "03", t: "Granular Self Disclosure", b: "Grant granular access to transaction details. Select what to disclose by time, mint, duration and address." },
  { n: "04", t: "Self Custody", b: "Keep ownership and control of your assets. Your keys authorize access to your private funds." },
];

const NIMBUS = [
  { t: "Private payments", b: "Let your users send money without the amount, mints and identity going on public display." },
  { t: "Self-custody, built in", b: "Your users hold their own assets. Your product handles the experience, never the money." },
  { t: "One integration", b: "One integration covers wallets, fintech apps and onchain services." },
  { t: "Everything in Umbra", b: "Deposit, Private Send, Private Swap and Withdraw are all in the SDK. Build whatever you need on top." },
];

const USE_CASES = [
  { t: "Payments", b: "Pay employees, contractors and vendors without publicly exposing compensation, rates or commercial terms." },
  { t: "Cross-border", b: "Move stablecoins across borders without publicly exposing payment amounts or counterparties." },
  { t: "Tokenised Stocks", b: "Bring privacy to supported tokenised stock and fund trades, keeping position size and trade direction out of public view." },
  { t: "Strategic Deals", b: "Keep acquisition payments and token buybacks private so commercial decisions do not become early market signals." },
  { t: "Wallets", b: "Bring private transfers into your wallet experience, so users can send assets without putting their financial activity on public display." },
  { t: "Treasury", b: "Manage operational transfers with privacy, keeping sensitive payment flows out of public view." },
  { t: "DeFi Apps", b: "Build private financial experiences on Nimbus, giving users more control over the activity they share publicly." },
  { t: "Merchant Checkout", b: "Add private stablecoin payments to checkout without publicly linking customer wallets to purchase amounts." },
];

const FAQ: { q: string; a: string; more: string }[] = [
  { q: "What is Umbra?", a: "Umbra lets you hold and send crypto privately on Solana. Unlike a regular wallet transfer, a payment between Umbra users does not publicly show who paid whom, how much was sent, or which token was used.", more: "What is Umbra?" },
  { q: "How does Umbra work?", a: "Connect your Solana wallet, register, and deposit supported tokens into a private balance. You can then send tokens privately to another Umbra user or withdraw them to a regular Solana wallet.", more: "How it works · How Umbra uses proofs" },
  { q: "What information is private?", a: "Private transfers hide the sender, recipient, token, and amount from anyone viewing Solana. Deposits still show the wallet, token, and amount going in; withdrawals show the receiving address, token, and amount coming out.", more: "What is public and private" },
  { q: "Can other people see my balance?", a: "Your individual private balance is not shown on the blockchain. Your device works it out from encrypted records, although some services that help process transactions can learn parts of your activity.", more: "Who can see what · Privacy limits" },
  { q: "Do I need a new wallet or address?", a: "No. You can use your existing Solana wallet. Umbra sets up the keys needed for private payments when you register, so there is no separate receiving address to manage.", more: "Account setup · What registration reveals" },
  { q: "Does the person I'm paying need Umbra?", a: "It depends on how you want to pay them. If they have registered with Umbra, you can send them a private transfer to their existing Solana address. If they have not, you can still pay them by withdrawing to their address, but that withdrawal is public.", more: "How Umbra works · Withdrawal visibility" },
  { q: "Can I withdraw to a regular Solana wallet?", a: "Yes. A normal withdrawal shows the receiving address, token, and amount publicly, but does not show which private balance paid for it. Withdrawing to an address already linked to you can still reveal the connection.", more: "What withdrawals reveal · How privacy can be lost" },
  { q: "Is Umbra completely anonymous?", a: "Yes, but with some limits. Private transfers hide payment details from public blockchain observers. Deposits, withdrawals, timing, and linked addresses can still reveal patterns, and services handling your requests may see your IP address or other information.", more: "Privacy limitations" },
  { q: "Who controls my funds?", a: "You do. Umbra is non-custodial and does not control your funds. Only your wallet holds the keys needed to spend your private balance.", more: "Trust and security · Governance and upgrades" },
  { q: "Which networks and tokens can I use?", a: "Umbra's documented protocol runs on Solana and supports SOL and approved Solana tokens. Not every token is eligible for deposit, and the protocol does not document direct bank-currency deposits.", more: "Supported assets and design" },
  { q: "What fees do I pay, and do I need SOL?", a: "Payments can have a protocol fee and a tip for the service that submits them. That service can pay the Solana network fee for a private transfer, but registration and deposits may still require SOL in your wallet.", more: "How payment fees work · Relayers" },
  { q: "What happens if I lose my wallet?", a: "Umbra cannot recover your private balance without the wallet used to create your account. Keep access to that wallet and its recovery method safe, because losing it may mean losing access to your funds.", more: "Account recovery risks" },
];

function PixelIcon({ seed }: { seed: number }) {
  // A tiny 5×5 pixel glyph per card, like the originals' icon style.
  const cells = Array.from({ length: 25 }, (_, i) => ((i * 7 + seed * 13) % 5 !== 0 && (i + seed) % 3 !== 1) || i === 12);
  return (
    <span className="grid h-[18px] w-[18px] grid-cols-5 gap-[1px]" aria-hidden>
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-current" : ""} />
      ))}
    </span>
  );
}

function ManifestoLine({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.45"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.14, 1]);
  return (
    <motion.p ref={ref} style={{ opacity }} className="mx-auto max-w-[760px] text-[26px] leading-[1.28] tracking-[-0.02em] text-[#171717] md:text-[34px]">
      {text}
    </motion.p>
  );
}

export function UmbraLanding() {
  const { setPageContext } = useCompanion();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    setPageContext(() => ({ product: "umbra_web", page: "landing" }));
  }, [setPageContext]);

  return (
    <>
      {/* Hero */}
      <section data-companion="umb-hero" className="umbra-dots relative overflow-hidden pb-24 pt-14 md:pt-20">
        <DotArt paint={paintShield} cell={9} className="pointer-events-none absolute left-1/2 top-2 h-[620px] w-[620px] -translate-x-1/2 opacity-[0.28] md:h-[700px] md:w-[700px]" density={0.55} />
        <div className="relative mx-auto flex max-w-[1440px] flex-col items-center px-5 text-center">
          <h1 className="umbra-gradient-text text-[48px] font-medium leading-[1.02] tracking-[-0.055em] md:text-[66px]">
            The Privacy Layer
            <br />
            for your Money
          </h1>
          <p className="mt-5 text-[15.5px] leading-snug text-[#3d3d45] md:text-[17px]">
            Privacy for your transactions. Ownership of your assets.
            <br />
            Use Umbra &amp; explore crypto in a whole new way.
          </p>
          <div data-companion="umb-hero-widget" className="mt-9 flex w-full justify-center">
            <UmbraWidget />
          </div>
          <a href="#manifesto" className="mt-6 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] text-[#171717] shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05]">
            Learn More <ArrowDown size={12} />
          </a>
        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" data-companion="umb-manifesto" className="umbra-dots relative overflow-hidden py-40 text-center">
        <DotArt paint={paintShield} cell={9} className="pointer-events-none absolute left-1/2 top-10 h-[700px] w-[700px] -translate-x-1/2 opacity-30" density={0.6} />
        <div className="relative space-y-9 px-5">
          {MANIFESTO.map((t) => (
            <ManifestoLine key={t} text={t} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" data-companion="umb-features" className="umbra-dots bg-[#fafafb] px-5 py-28">
        <div className="mx-auto max-w-[1060px]">
          <h2 className="text-center text-[34px] leading-[1.12] tracking-[-0.035em] md:text-[44px]">
            Send, hold, swap &amp; earn
            <br />
            while keeping your money private.
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-center text-[14.5px] text-[#55555e]">
            Four ways to use your money with privacy built in. Move assets into a private balance, send and swap from one familiar interface.
          </p>
          <div className="mt-14 space-y-4">
            {[FEATURES.slice(0, 2), FEATURES.slice(2)].map((row, r) => (
              <div key={r} className={`grid gap-4 ${r === 0 ? "md:grid-cols-[1.35fr_1fr]" : "md:grid-cols-[1fr_1.35fr]"}`}>
                {row.map((f, i) => {
                  const bottomText = f.id === "hold" || f.id === "send";
                  return (
                    <motion.article
                      key={f.id}
                      {...(f.id === "earn" ? { "data-companion": "umb-feature-earn" } : {})}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ delay: i * 0.08 }}
                      className="relative flex min-h-[440px] flex-col overflow-hidden rounded-[22px] bg-[#f1f1f4]"
                    >
                      <div className={`relative z-10 p-7 ${bottomText ? "order-2" : ""}`}>
                        <h3 className="text-[24px] tracking-[-0.03em]">{f.title}</h3>
                        <p className="mt-2 max-w-[420px] text-[13.5px] leading-relaxed text-[#55555e]">{f.body}</p>
                      </div>
                      <DotArt paint={f.paint} cell={7} className={`block min-h-[240px] w-full flex-1 ${bottomText ? "order-1" : ""}`} />
                    </motion.article>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section data-companion="umb-compliance" className="umbra-dots bg-[#f6f6f8] px-5 py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 md:grid-cols-2">
          <DotArt paint={paintLock} cell={8} className="mx-auto block aspect-square w-full max-w-[460px]" />
          <div>
            <ul className="space-y-1">
              {["Perimeter Screening.", "Registered Recipients.", "Granular Self Disclosure.", "Self Custody."].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[30px] leading-[1.12] tracking-[-0.03em] text-[#0100ff] md:text-[40px]">
                  <Check size={22} className="shrink-0 opacity-70" /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[460px] text-[14px] text-[#55555e]">
              Private transfers and swaps, with compliance built in. Screen activity at the perimeter, send to registered recipients and control what you disclose.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {COMPLIANCE.map((c) => (
                <div key={c.n} className="flex gap-3">
                  <span className="pt-0.5 text-[11px] text-[#0100ff]">{c.n}</span>
                  <div>
                    <p className="text-[14px]">{c.t}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-[#75757f]">{c.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nimbus */}
      <section data-companion="umb-nimbus" className="umbra-dots-dark relative overflow-hidden rounded-t-[28px] bg-[#0a0a0c] px-5 pb-20 pt-16 text-white md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-[40px] tracking-[-0.04em] md:text-[56px]">Build with Nimbus</h2>
              <p className="mt-3 max-w-[560px] text-[15px] text-white/70">
                Nimbus is the privacy network for your product. Build on the same private infrastructure that powers Umbra and create your own experience.
              </p>
            </div>
            <span className="mt-3 shrink-0 rounded-full border border-white/15 px-3.5 py-1.5 text-[12.5px] text-white/80">Coming soon</span>
          </div>
          <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {NIMBUS.map((n, i) => (
              <div key={n.t}>
                <span className="text-[#8c8cff]">
                  <PixelIcon seed={i + 2} />
                </span>
                <p className="mt-5 text-[15px]">{n.t}</p>
                <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-white/60">{n.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-36">
            <p className="text-[30px] leading-tight tracking-[-0.03em] md:text-[40px]">Privacy that fits your product.</p>
            <p className="text-[30px] leading-tight tracking-[-0.03em] text-white/45 md:text-[40px]">Nimbus brings financial privacy to the services you build.</p>
            <a href="https://docs.umbraprivacy.com/" target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-full bg-white/10 px-4 py-2 text-[13px] hover:bg-white/15">
              View Docs
            </a>
          </div>
        </div>
      </section>

      {/* Use cases + closing */}
      <section data-companion="umb-usecases" className="relative overflow-hidden bg-[#0100ff] px-5 pb-16 pt-12 text-white md:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((u, i) => (
            <motion.div
              key={u.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.05 }}
              className="min-h-[190px] rounded-[16px] bg-[#0f0fb8]/70 p-5 ring-1 ring-white/10"
            >
              <span className="text-white/75">
                <PixelIcon seed={i} />
              </span>
              <p className="mt-6 text-[15px]">{u.t}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/70">{u.b}</p>
            </motion.div>
          ))}
        </div>
        <DotArt paint={paintGlobe} cell={8} color="255, 255, 255" className="pointer-events-none absolute -bottom-24 -right-16 h-[420px] w-[420px] opacity-70" />
        <DotArt paint={paintCoins} cell={8} color="255, 255, 255" className="pointer-events-none absolute -bottom-10 left-[38%] h-[200px] w-[260px] opacity-40" />
        <div className="relative mx-auto mt-40 flex max-w-[1440px] flex-wrap items-end justify-between gap-6">
          <p className="text-[38px] leading-[1.05] tracking-[-0.04em] md:text-[56px]">
            Your money. Your choices.
            <br />
            Your privacy.
          </p>
          <Link href="/umbra/app" className="mb-2 rounded-full bg-white px-5 py-2.5 text-[14px] text-[#0100ff] hover:bg-white/90 md:mr-[30%]">
            Use Umbra Web
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="umbra-guide" data-companion="umb-faq" className="umbra-dots px-5 py-28">
        <h2 className="text-center text-[34px] tracking-[-0.035em] md:text-[40px]">Your Questions, Answered</h2>
        <div className="mx-auto mt-10 max-w-[620px] space-y-2">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-[12px] bg-[#f7f7f9]">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[14px]">
                {f.q}
                <ChevronDown size={15} className={`shrink-0 text-[#75757f] transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-[13.5px] leading-relaxed text-[#55555e]">
                  {f.a}
                  <p className="mt-2 flex items-center gap-1 text-[12.5px] text-[#0100ff]">
                    Read more: {f.more} <ArrowRight size={12} />
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
