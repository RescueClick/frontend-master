import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Gift, Crown } from "lucide-react";
import AdminReferralRewards from "./AdminReferralRewards";
import AdminPartnerLevels from "./AdminPartnerLevels";

export default function RewardsAndLevelsHub({ initialTab }) {
  const location = useLocation();

  // Tab state: 'rewards' | 'levels'
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    if (location.state?.defaultTab) return location.state.defaultTab;
    if (location.pathname.includes("partner-levels")) return "levels";
    return "rewards";
  });

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("rewards")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "rewards"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Gift size={16} />
            Referral Rewards
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("levels")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "levels"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Crown size={16} />
            Levels & Benefits
          </button>
        </div>
        <div className="text-xs text-gray-500 pr-2 hidden sm:block">
          {activeTab === "rewards"
            ? "Manage referral rewards, payouts & status"
            : "Configure partner tiers, volume targets, badges & perks"}
        </div>
      </div>

      {/* Tab Screen Content */}
      <div>
        {activeTab === "rewards" && <AdminReferralRewards />}
        {activeTab === "levels" && <AdminPartnerLevels />}
      </div>
    </div>
  );
}
