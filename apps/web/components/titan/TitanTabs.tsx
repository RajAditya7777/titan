"use client";

import { useRouter, usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";

export function TitanTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const { mode, setMode } = useTitan();

  const isSwap = pathname === "/titan/swap" || pathname === "/titan";
  const isLimit = pathname === "/titan/limit";

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#151513] p-1 mb-4">
      {/* Instant Tab */}
      <button
        type="button"
        data-companion="titan-tab-instant"
        onClick={() => {
          setMode("instant");
          if (!isSwap) router.push("/titan/swap");
        }}
        className={`flex-1 rounded-lg py-2 px-3 text-center text-xs font-medium transition-all ${
          isSwap && mode === "instant"
            ? "bg-[#2b2927] text-white shadow-sm font-semibold"
            : "text-[#a8a69f] hover:text-white hover:bg-white/[0.02]"
        }`}
      >
        Instant
      </button>

      {/* Limit Tab */}
      <button
        type="button"
        data-companion="titan-tab-limit"
        onClick={() => {
          setMode("limit");
          if (!isLimit) router.push("/titan/limit");
        }}
        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-center text-xs font-medium transition-all ${
          isLimit || mode === "limit"
            ? "bg-[#2b2927] text-white shadow-sm font-semibold"
            : "text-[#a8a69f] hover:text-white hover:bg-white/[0.02]"
        }`}
      >
        <span>Limit</span>
        <span className="rounded bg-[#f2d363]/15 px-1 py-0.2 text-[9px] font-semibold text-[#f2d363]">
          Beta
        </span>
      </button>

      {/* DCA Tab (Explained only) */}
      <button
        type="button"
        data-companion="titan-tab-dca"
        onClick={() => setMode("dca")}
        className="group relative flex-1 flex items-center justify-center gap-1 rounded-lg py-2 px-3 text-center text-xs font-medium text-[#78766d] hover:text-[#a8a69f] transition-all cursor-not-allowed opacity-80"
      >
        <span>DCA</span>
        <Info className="h-3 w-3 text-[#78766d] group-hover:text-[#f2d363]" />
        <span className="absolute -top-7 hidden rounded bg-[#20201d] px-2 py-0.5 text-[10px] text-[#f2d363] border border-white/10 group-hover:block whitespace-nowrap shadow-lg z-20">
          Chronos Partner API • Explained only
        </span>
      </button>

      {/* Slice Tab (Explained only) */}
      <button
        type="button"
        data-companion="titan-tab-slice"
        onClick={() => setMode("slice")}
        className="group relative flex-1 flex items-center justify-center gap-1 rounded-lg py-2 px-3 text-center text-xs font-medium text-[#78766d] hover:text-[#a8a69f] transition-all cursor-not-allowed opacity-80"
      >
        <span>Slice</span>
        <Info className="h-3 w-3 text-[#78766d] group-hover:text-[#f2d363]" />
        <span className="absolute -top-7 hidden rounded bg-[#20201d] px-2 py-0.5 text-[10px] text-[#f2d363] border border-white/10 group-hover:block whitespace-nowrap shadow-lg z-20">
          TWAP & Slicing • Explained only
        </span>
      </button>
    </div>
  );
}
