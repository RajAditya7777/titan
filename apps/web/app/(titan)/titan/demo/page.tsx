"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Pet } from "@/components/companion/Pet";
import type { PetState } from "@/components/companion/CompanionProvider";
import type { Reaction } from "@/components/companion/Pet";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Heart,
  Volume2,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

interface DemoScene {
  title: string;
  subtitle: string;
  speech: string;
  state: PetState;
  reaction: Reaction | null;
  lookAngle: number | null;
  voiceLevel: number;
  highlightTarget?: string;
  fillAmount?: string;
  durationMs: number;
}

const DEMO_SCENES: DemoScene[] = [
  {
    title: "1. Meet Milo",
    subtitle: "2D Pixel Husky Companion for Titan Exchange",
    speech: "Woof! I'm Milo, your on-chain companion guide on Titan Exchange.",
    state: "idle",
    reaction: null,
    lookAngle: null,
    voiceLevel: 0,
    durationMs: 4000,
  },
  {
    title: "2. Friendly Greeting",
    subtitle: "Curious head-tilt and natural paw wave",
    speech: "I help you navigate swaps, limit orders, and DCA with zero custody risk!",
    state: "speaking",
    reaction: "hi",
    lookAngle: 340,
    voiceLevel: 0.6,
    durationMs: 4000,
  },
  {
    title: "3. Grass Belly-Rub Roll!",
    subtitle: "Playful rolling animation inspired by happy puppies",
    speech: "I love belly rubs between trades! Paws up, rolling with joy!",
    state: "idle",
    reaction: "roll",
    lookAngle: null,
    voiceLevel: 0.2,
    durationMs: 4500,
  },
  {
    title: "4. Expressive Hearts & Love",
    subtitle: "Pixel hearts floating up with cheerful bounce",
    speech: "Always here by your side while you trade on Solana.",
    state: "speaking",
    reaction: "hearts",
    lookAngle: 20,
    voiceLevel: 0.7,
    durationMs: 3800,
  },
  {
    title: "5. Puppy Claps & Hops",
    subtitle: "Natural paw gestures (grounded, no inverted flips)",
    speech: "Cheering on your best execution! Let's check the markets.",
    state: "celebrating",
    reaction: "clap",
    lookAngle: null,
    voiceLevel: 0.4,
    durationMs: 3800,
  },
  {
    title: "6. AI Market Reasoning",
    subtitle: "Nosana vLLM · Qwen 27B analyzing live liquidity",
    speech: "Analyzing live liquidity pools across Orca, Raydium, and Phoenix...",
    state: "thinking",
    reaction: null,
    lookAngle: 280,
    voiceLevel: 0,
    durationMs: 4200,
  },
  {
    title: "7. Smart Swap Guidance",
    subtitle: "Argos Off-Chain Solver + DART On-Chain Re-Split",
    speech: "Want to swap 2 SOL to USDC? I've set up 2 SOL for ~187.52 USDC!",
    state: "pointing",
    reaction: null,
    lookAngle: 90,
    voiceLevel: 0.5,
    fillAmount: "2",
    highlightTarget: "swap-input",
    durationMs: 4500,
  },
  {
    title: "8. Prime Zero-Fee Execution",
    subtitle: "Nozomi + Jito MEV sandwich protection",
    speech: "Prime mode active: 0% protocol fees, fully protected from sandwich bots.",
    state: "pointing",
    reaction: null,
    lookAngle: 45,
    voiceLevel: 0.6,
    highlightTarget: "prime-badge",
    durationMs: 4200,
  },
  {
    title: "9. Victory Celebration!",
    subtitle: "Non-custodial: only you sign in your wallet",
    speech: "You're in total control. Ready to trade on Titan Exchange!",
    state: "celebrating",
    reaction: "hop",
    lookAngle: null,
    voiceLevel: 0.8,
    durationMs: 4500,
  },
];

export default function TitanDemoPage() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedSpeech, setTypedSpeech] = useState("");

  const curScene = DEMO_SCENES[sceneIndex] ?? DEMO_SCENES[0]!;

  // Typewriter effect for speech bubble - strictly keyed by sceneIndex
  useEffect(() => {
    let charIdx = 0;
    const fullText = DEMO_SCENES[sceneIndex]?.speech ?? "";
    setTypedSpeech("");
    const typeTimer = setInterval(() => {
      charIdx++;
      setTypedSpeech(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) clearInterval(typeTimer);
    }, 25);
    return () => clearInterval(typeTimer);
  }, [sceneIndex]);

  // Timeline progression - advances after curScene.durationMs
  useEffect(() => {
    if (!isPlaying) return;
    const duration = DEMO_SCENES[sceneIndex]?.durationMs ?? 4200;
    const timer = setTimeout(() => {
      setSceneIndex((prev) => (prev + 1) % DEMO_SCENES.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [sceneIndex, isPlaying]);

  return (
    <div className="w-full text-white flex flex-col font-sans select-none pb-8">
      {/* Top Banner Row */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#20201d] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#f7d046] tracking-wider uppercase font-semibold">
            Scene {sceneIndex + 1} / {DEMO_SCENES.length}
          </span>
          <span className="text-xs text-[#78766d]">·</span>
          <span className="text-xs font-mono text-[#78766d]">{curScene.subtitle}</span>
        </div>

        {/* Live Status Pills & Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181816] border border-[#2c2c28] text-[11px] text-[#9a988d]">
            <Cpu className="h-3 w-3 text-[#3c8bea]" />
            <span>Nosana vLLM · Qwen 27B</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#20201d] hover:bg-[#2b2927] border border-[#33312e] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            type="button"
            onClick={() => setSceneIndex(0)}
            className="p-1 rounded-lg bg-[#20201d] hover:bg-[#2b2927] border border-[#33312e] text-white transition-colors cursor-pointer"
            title="Restart Demo"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-4">
        {curScene.title}
      </h1>

      {/* 2-Column Split: Milo on Left, Titan Exchange on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-2">
        {/* Milo's Interactive Stage (Left Column) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-6">
          {/* Ambient Glow behind Milo */}
          <div className="absolute h-72 w-72 rounded-full bg-gradient-to-tr from-[#3c8bea]/15 via-[#f7d046]/10 to-transparent blur-3xl -z-10 pointer-events-none" />

          {/* Speech Bubble */}
          <div className="relative mb-6 max-w-sm w-full bg-[#181815] border border-[#30302c] rounded-2xl p-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wide uppercase text-[#f7d046] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Milo (Titan Companion)
              </span>
              <span className="text-[10px] font-mono text-[#78766d] px-1.5 py-0.5 rounded bg-[#22221f]">
                {curScene.state}
              </span>
            </div>
            <p className="text-sm text-[#e6e4dd] leading-relaxed min-h-[44px]">
              {typedSpeech}
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#f7d046] animate-pulse align-middle" />
            </p>
            {/* Speech bubble tail pointing down */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#181815] border-r border-b border-[#30302c] rotate-45" />
          </div>

          {/* Milo Pixel Husky Avatar (Large & Crisp) */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-b from-[#1b1b18]/80 to-[#121210]/90 border border-[#2b2927] shadow-2xl flex flex-col items-center">
            <div
              className="transition-transform duration-300"
              style={{ imageRendering: "pixelated" }}
            >
              <Pet
                state={curScene.state}
                reaction={curScene.reaction}
                lookAngle={curScene.lookAngle}
                voiceLevel={curScene.voiceLevel}
                size={200}
              />
            </div>

            {/* Pedestal shadow */}
            <div className="w-36 h-3 rounded-full bg-black/60 blur-sm mt-1" />

            {/* Current Animation Badge */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#20201d] border border-[#2e2d2a] font-mono text-[#c5c3b8]">
                State: <strong className="text-white">{curScene.state}</strong>
              </span>
              {curScene.reaction && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#3c8bea]/15 border border-[#3c8bea]/30 font-mono text-[#7eb3ef]">
                  Reaction: <strong className="text-white">{curScene.reaction}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Titan Exchange UI Preview (Right Column) */}
        <div className="lg:col-span-7 bg-[#151513] border border-[#262624] rounded-2xl p-5 shadow-2xl">
          {/* Header of Swap Interface */}
          <div className="flex items-center justify-between border-b border-[#262624] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white px-2.5 py-1 rounded bg-[#20201d] border border-[#30302c]">
                Instant Swap
              </span>
              <span className="text-xs text-[#78766d] px-2.5 py-1 rounded hover:text-white cursor-pointer">
                Limit
              </span>
              <span className="text-xs text-[#78766d] px-2.5 py-1 rounded hover:text-white cursor-pointer">
                DCA
              </span>
              <span className="text-xs text-[#78766d] px-2.5 py-1 rounded hover:text-white cursor-pointer">
                Slice
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  curScene.highlightTarget === "prime-badge"
                    ? "bg-[#f7d046] text-black ring-2 ring-[#f7d046]/50 shadow-lg scale-105"
                    : "bg-[#20201d] text-[#f7d046] border border-[#f7d046]/30"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Prime Active</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#20201d] border border-[#2e2d2a] text-xs text-[#9a988d]">
                <Zap className="h-3 w-3 text-[#3c8bea]" />
                <span>DART: Auto</span>
              </div>
            </div>
          </div>

          {/* Sell Box */}
          <div
            className={`rounded-xl border p-4 mb-3 transition-all ${
              curScene.highlightTarget === "swap-input"
                ? "border-[#f7d046] bg-[#222119] ring-2 ring-[#f7d046]/30"
                : "border-[#2b2927] bg-[#1c1c1a]"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#78766d] mb-1">
              <span>You Pay</span>
              <span>Balance: 14.50 SOL ($1,359.50)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-mono font-medium text-white">
                {curScene.fillAmount || "2"}
              </span>
              <div className="flex items-center gap-2 rounded-full bg-[#151513] border border-[#2b2927] px-3 py-1.5 text-sm font-semibold text-white">
                <span className="h-5 w-5 rounded-full bg-gradient-to-tr from-[#9945ff] to-[#14f195] flex items-center justify-center text-[10px]">
                  S
                </span>
                <span>SOL</span>
              </div>
            </div>
            <div className="text-xs text-[#78766d] mt-1">≈ $187.52</div>
          </div>

          {/* Invert Button */}
          <div className="flex justify-center -my-1 z-10 relative">
            <div className="h-8 w-8 rounded-full bg-[#20201d] border border-[#2b2927] flex items-center justify-center text-[#78766d]">
              ↓
            </div>
          </div>

          {/* Receive Box */}
          <div className="rounded-xl border border-[#2b2927] bg-[#1c1c1a] p-4 mt-2 mb-4">
            <div className="flex items-center justify-between text-xs text-[#78766d] mb-1">
              <span>You Receive (Estimated)</span>
              <span>Balance: 1,250.00 USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-mono font-medium text-[#10b981]">
                187.52
              </span>
              <div className="flex items-center gap-2 rounded-full bg-[#151513] border border-[#2b2927] px-3 py-1.5 text-sm font-semibold text-white">
                <span className="h-5 w-5 rounded-full bg-[#2775ca] flex items-center justify-center text-[10px]">
                  $
                </span>
                <span>USDC</span>
              </div>
            </div>
            <div className="text-xs text-[#78766d] mt-1">1 SOL ≈ 93.759 USDC</div>
          </div>

          {/* Route Summary */}
          <div className="rounded-lg bg-[#181816] border border-[#262624] p-3 text-xs text-[#9a988d] mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-white font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#10b981]" />
                Best Execution Route (Argos + DART)
              </span>
              <span className="text-[#10b981]">0.00% Titan Fee</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span>• 64% Orca Whirlpool (SOL/USDC 0.04%)</span>
              <span>• 36% Raydium CPMM (SOL/USDC 0.25%)</span>
            </div>
          </div>

          {/* Review Button */}
          <button
            type="button"
            className="w-full py-3 rounded-xl bg-[#f7d046] hover:bg-[#e5be35] text-black font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Review Swap</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scene Navigation Scrub Bar at Bottom */}
      <div className="mt-6 pt-4 border-t border-[#20201d]">
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
          {DEMO_SCENES.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setSceneIndex(idx)}
              className={`py-2 px-1 rounded-lg text-left transition-all border cursor-pointer ${
                sceneIndex === idx
                  ? "bg-[#20201d] border-[#f7d046] text-[#f7d046] ring-1 ring-[#f7d046]/30"
                  : "bg-[#141412] border-[#22221f] text-[#78766d] hover:text-white hover:bg-[#1a1a18]"
              }`}
            >
              <div className="font-mono text-[10px] font-semibold truncate">
                {idx + 1}. {s.title.split(". ")[1]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
