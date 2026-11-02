import { UmbraWebApp } from "@/components/umbra-web/WebApp";

export const metadata = {
  title: "Umbra App",
  description: "Deposit, send, swap and withdraw privately. Simulated wallet; independent demo.",
};

export default function UmbraAppPage() {
  return <UmbraWebApp />;
}
