import { TitanDocsView } from "@/components/titan/TitanDocsView";

export const metadata = {
  title: "Titan Knowledge & GitBook Documentation",
  description: "Learn about Argos routing, DART, and Titan Prime with Milo AI companion.",
};

export default function TitanLearnPage() {
  return (
    <div className="py-4 sm:py-6">
      <TitanDocsView />
    </div>
  );
}

