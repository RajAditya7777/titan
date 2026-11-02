import type { ReactNode } from "react";
import Link from "next/link";
import { Shield, Lock, ExternalLink, ArrowLeft } from "lucide-react";

/** Chrome for the Nimbus console (the earlier dark Umbra demo), now served at /umbra/console. */
export function ConsoleChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07070a] text-white selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Summit Announcement Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950 px-4 py-2 text-center text-xs font-medium text-violet-200 border-b border-violet-800/30">
        <span>Solana Summit Proof of Concept · Umbra Privacy &amp; Nimbus Protocol · Simulated Demo with AI Companion</span>
      </div>

      {/* Stealth Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#07070a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <Link href="/umbra/console" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/60 group-hover:scale-105 transition-transform">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">umbra</span>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                  nimbus demo
                </span>
              </div>
            </Link>

            <nav className="hidden sm:flex items-center gap-4 text-xs font-medium text-white/60">
              <Link href="/umbra/console" className="text-violet-300 hover:text-white transition-colors">
                App
              </Link>
              <a
                href="https://docs.nimbusprivacy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <span>Docs</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
              <a
                href="https://sdk.nimbusprivacy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <span>SDK</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </nav>
          </div>

          {/* Right Header Status Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/umbra"
              className="hidden md:flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors pr-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Umbra</span>
            </Link>

            <div className="flex items-center gap-2 rounded-full border border-violet-500/25 bg-black/40 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-white/80">Solana (Simulated)</span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 text-xs font-mono text-white/70">
              <Lock className="h-3 w-3 text-violet-400" />
              <span>7XwK...9zQL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
