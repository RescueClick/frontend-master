import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import PageHeader from "../../../components/shared/PageHeader";
import PasswordSettings from "../common/PasswordSettings";
import { designSystem } from "../../../utils/designSystem";

const PartnerSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <PageHeader
            title="Change Password"
            subtitle="Update your account password"
            right={
              <button
                type="button"
                onClick={() => navigate("/partner/dashboard")}
                className="text-sm px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            }
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </div>
            <div className="max-w-xl">
              <PasswordSettings />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerSettings;
