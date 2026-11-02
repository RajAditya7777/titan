import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CompanionProvider } from "@/components/companion/CompanionProvider";
import { PetLayer } from "@/components/companion/PetLayer";
import { CompanionPanel } from "@/components/companion/Panel";

// Geist is open-source (SIL OFL) and the typeface family observed on reflect.money.
const ui = Geist({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-num", display: "swap" });

export const metadata: Metadata = {
  title: "Milo — AI Companion for Titan Exchange",
  description: "A voice-first AI guide for Titan Exchange on Solana. Independent demo, not affiliated.",
};

/**
 * The companion lives in the root layout, outside the page tree. App Router keeps layouts
 * mounted across client navigations, so the pet, its state and an in-progress workflow
 * survive page changes, which is how it can "walk" the user from page to page. Each route group
 * ((site) for the marketing pages, (app) for the product) brings its own chrome.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${mono.variable}`}>
      <body className="font-sans">
        <CompanionProvider>
          {children}
          <CompanionPanel />
          <PetLayer />
        </CompanionProvider>
      </body>
    </html>
  );
}
