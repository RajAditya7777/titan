import { PageHeader } from "@/components/ui/primitives";
import { WhitelabelWizard } from "@/components/pages/WhitelabelWizard";

export default function WhitelabelPage() {
  return (
    <>
      <PageHeader
        eyebrow="Whitelabel"
        title="Launch your own yieldcoin"
        subtitle="Wrap Reflect's yield in your brand. Configure it here; deployment stays disabled in this demo."
      />
      <WhitelabelWizard />
    </>
  );
}
