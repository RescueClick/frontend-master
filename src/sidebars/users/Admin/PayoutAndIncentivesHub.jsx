import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { IndianRupee, Award } from "lucide-react";
import AdminPayouts from "./AdminPayouts";
import AdminIncentives from "./AdminIncentives";

export default function PayoutAndIncentivesHub({ initialTab }) {
  const location = useLocation();

  // Tab state: 'payout' | 'incentives'
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    if (location.state?.defaultMainTab) return location.state.defaultMainTab;
    if (location.pathname.includes("incentives")) return "incentives";
    return "payout";
  });

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("payout")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "payout"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <IndianRupee size={16} />
            Payout Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("incentives")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "incentives"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Award size={16} />
            Incentives
          </button>
        </div>
        <div className="text-xs text-gray-500 pr-2 hidden sm:block">
          {activeTab === "payout"
            ? "Partner commission payouts, pending approvals & disbursement claims"
            : "Performance incentive tiers, monthly targets & payout approval"}
        </div>
      </div>

      {/* Tab Screen Content */}
      <div>
        {activeTab === "payout" && <AdminPayouts />}
        {activeTab === "incentives" && <AdminIncentives />}
      </div>
    </div>
  );
}
