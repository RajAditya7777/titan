import { UmbraLanding } from "@/components/umbra-web/Landing";
import { UmbraFooter } from "@/components/umbra-web/chrome";

export const metadata = {
  title: "Umbra",
  description: "The Privacy Layer for your Money. Independent demo with an AI companion; not affiliated with Umbra.",
};

export default function UmbraHomePage() {
  return (
    <>
      <UmbraLanding />
      <UmbraFooter />
    </>
  );
}
