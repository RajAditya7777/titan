import { ButtonLink, PageHeader } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-24 md:px-8">
      <PageHeader title="Page not found" subtitle="Ask the companion where you&apos;d like to go." />
      <ButtonLink href="/">Back to home</ButtonLink>
    </div>
  );
}
