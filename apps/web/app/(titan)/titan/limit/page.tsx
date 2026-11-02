import { TitanTabs } from "@/components/titan/TitanTabs";
import { LimitOrderCard } from "@/components/titan/LimitOrderCard";

export default function TitanLimitPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-[520px]">
        {/* Navigation Tabs */}
        <TitanTabs />

        {/* Limit Order Card */}
        <LimitOrderCard />
      </div>
    </div>
  );
}
