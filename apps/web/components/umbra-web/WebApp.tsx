"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useCompanion } from "@/components/companion/CompanionProvider";
import { Pet } from "@/components/companion/Pet";
import { DotArt, paintMountains } from "./DotArt";
import { UmbraWidget } from "./Widget";
import { useUmbra } from "./store";

const DISMISS_KEY = "umbra.newUserHelp.dismissed";
export const UMBRA_NEW_USER_PROMPT = "I'm new to Umbra. Guide me through my first private deposit of 25 USDC.";

/** The v2 app: hero, the action widget and a "guide me" card for first-timers. */
export function UmbraWebApp() {
  const s = useUmbra();
  const c = useCompanion();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* per-visitor convenience only */
    }
  };

  const hasDeposited = Object.values(s.private).some((v) => v > 0);

  return (
    <section className="relative min-h-[calc(100vh-82px)] overflow-hidden">
      <DotArt paint={paintMountains} cell={6} twinkle={false} color="120, 120, 140" className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] w-full opacity-35" density={0.9} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white/70" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center px-5 pb-28 pt-14 text-center md:pt-20">
        <h1 className="text-[44px] font-medium leading-[1.02] tracking-[-0.055em] text-[#10106b] md:text-[58px]">
          The Privacy <span className="text-[#2b2fd8]">Layer</span>
          <br />
          for your <span className="text-[#2b2fd8]">Money</span>
        </h1>
        <div className="mt-10 flex w-full justify-center">
          <UmbraWidget app />
        </div>

        {!hasDeposited && !dismissed && !c.run && (
          <div
            data-companion="umb-new-user"
            data-testid="umbra-new-user"
            className="mt-8 flex w-full max-w-[560px] items-center gap-4 rounded-[20px] bg-white/90 p-4 text-left ring-1 ring-black/[0.06] backdrop-blur"
          >
            <div className="umbra-ui hidden shrink-0 sm:block" aria-hidden>
              <Pet state="idle" lookAngle={null} size={56} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-[#0100ff]">New to Umbra?</p>
              <p className="text-[15px] leading-snug tracking-[-0.01em]">Let&apos;s make your first private deposit together.</p>
              <p className="mt-0.5 text-[12.5px] text-[#75757f]">I&apos;ll point at each step. Nothing moves until you approve it in your wallet.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                c.setPanelOpen(true);
                c.input(UMBRA_NEW_USER_PROMPT);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#0100ff] px-4 py-2 text-[13px] text-white hover:bg-[#2020ff]"
            >
              Guide me through it <ArrowRight size={13} />
            </button>
            <button type="button" onClick={dismiss} aria-label="Not now" className="rounded-full p-1 text-[#9a9aa3] hover:text-[#171717]">
              <X size={15} />
            </button>
          </div>
        )}
      </div>
      <div className="absolute bottom-4 left-6 flex gap-6 text-[11.5px] text-[#a6a6ae]">
        <span>Terms</span>
        <span>Privacy</span>
        <span>Operating Agreement</span>
      </div>
    </section>
  );
}
