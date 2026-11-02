import type { ReactNode } from "react";
import { JupShell } from "@/components/jupiter/Shell";

export const metadata = {
  title: "Jupiter: The Home of Onchain Finance (demo)",
  description: "Independent Jupiter demo with Astro, an AI companion. Simulated wallet, fixed demo prices; not affiliated with Jupiter.",
};

export default function JupLayout({ children }: { children: ReactNode }) {
  return <JupShell>{children}</JupShell>;
}
