import { TitanDocsView } from "@/components/titan/TitanDocsView";

export const metadata = {
  title: "Titan Knowledge & GitBook Documentation",
  description: "Learn about Argos routing, DART, and Titan Prime with Milo companion.",
};

export default function TitanDocsPage() {
  return (
    <div className="py-4 sm:py-6">
      <TitanDocsView />
    </div>
  );
}
