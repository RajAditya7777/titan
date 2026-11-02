"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";

export function TitanToast() {
  const { toast } = useTitan();

  if (!toast) return null;

  return (
    <div className="fixed top-16 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-md text-xs font-medium ${
          toast.type === "success"
            ? "border-[#00d692]/40 bg-[#0d0d0c]/90 text-[#00d692]"
            : toast.type === "error"
            ? "border-[#f34f6a]/40 bg-[#0d0d0c]/90 text-[#f34f6a]"
            : "border-[#f2d363]/40 bg-[#0d0d0c]/90 text-[#f2d363]"
        }`}
      >
        {toast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00d692]" />}
        {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-[#f34f6a]" />}
        {toast.type === "info" && <Info className="h-4 w-4 shrink-0 text-[#f2d363]" />}
        <span className="text-white">{toast.message}</span>
      </div>
    </div>
  );
}
