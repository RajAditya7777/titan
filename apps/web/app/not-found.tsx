import { ButtonLink, PageHeader } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="Ask the companion where you'd like to go." />
      <ButtonLink href="/">Back to dashboard</ButtonLink>
    </>
  );
}
