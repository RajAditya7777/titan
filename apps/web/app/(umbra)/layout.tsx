import type { ReactNode } from "react";
import { UmbraShell } from "@/components/umbra-web/chrome";

export const metadata = {
  title: "Umbra",
  description: "The Privacy Layer for your Money. Independent demo with an AI companion; not affiliated with Umbra.",
};

/** The umbraprivacy.com look: white, dot grid, electric blue. The Nimbus console brings its own chrome. */
export default function UmbraLayout({ children }: { children: ReactNode }) {
  return <UmbraShell>{children}</UmbraShell>;
}
