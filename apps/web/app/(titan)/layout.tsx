import React from "react";
import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { TitanStateProvider } from "@/lib/products/titan/state";
import { TitanHeader } from "@/components/titan/TitanHeader";
import { TitanTickerBar } from "@/components/titan/TitanTickerBar";
import { SettingsDrawer } from "@/components/titan/SettingsDrawer";
import { ReviewSwapModal } from "@/components/titan/ReviewSwapModal";
import { ConnectWalletModal } from "@/components/titan/ConnectWalletModal";
import { TitanToast } from "@/components/titan/TitanToast";
import { HideOn } from "@/components/titan/HideOn";

export const metadata: Metadata = {
  title: "Titan Exchange — AI Companion Demo",
  description:
    "Titan Exchange interface with Argos & DART routing, guided by Milo the 2D Companion.",
};

export default function TitanLayout({ children }: { children: React.ReactNode }) {
  return (
    <TitanStateProvider>
      <div className="min-h-screen bg-[#0d0d0c] text-white flex flex-col font-sans selection:bg-[#f2d363] selection:text-[#0d0d0c]">
        {/* Top Header */}
        <TitanHeader />

        {/* Live Marquee Ticker Bar */}
        <HideOn prefixes={["/titan/rewards"]}>
          <TitanTickerBar />
        </HideOn>

        {/* Global Settings & Review Modals */}
        <SettingsDrawer />
        <ReviewSwapModal />
        <ConnectWalletModal />
        <TitanToast />

        {/* Main Content Area */}
        <main className="flex-1 w-full px-2 sm:px-4 py-3 max-w-[1540px] mx-auto">
          {children}
        </main>

        {/* Footer matching Titan Official UI */}
        <footer className="border-t border-white/[0.06] bg-[#0d0d0c] py-4 px-6 text-xs text-[#78766d] select-none">
          <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left Copyright & Help */}
            <div className="flex items-center gap-2">
              <span>© 2026 Titan Exchange</span>
              <button
                type="button"
                className="hover:text-white transition-colors"
                title="Support"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Right Socials */}
            <div className="flex items-center gap-4 text-[#8a8a8a] sm:mr-28">
              {/* Discord Icon */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                title="Discord"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              {/* X / Twitter Icon */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                title="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </TitanStateProvider>
  );
}
