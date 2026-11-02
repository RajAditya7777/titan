import { UmbraApp } from "@/components/umbra/UmbraApp";
import { ConsoleChrome } from "@/components/umbra/ConsoleChrome";

export const metadata = {
  title: "Nimbus Console · Umbra (Simulated Demo)",
  description: "Deposit, transfer and withdraw confidentially on Solana with the Nimbus privacy protocol.",
};

export default function UmbraConsolePage() {
  return (
    <ConsoleChrome>
      <UmbraApp />
    </ConsoleChrome>
  );
}
