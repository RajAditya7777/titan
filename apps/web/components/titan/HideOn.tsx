"use client";

import { usePathname } from "next/navigation";

/** Renders children except on the given route prefixes (e.g. the ticker, which Titan's rewards pages don't show). */
export function HideOn({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const path = usePathname() ?? "";
  return prefixes.some((p) => path.startsWith(p)) ? null : <>{children}</>;
}
