import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Award, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAdminIncentives } from "../../../feature/thunks/adminThunks";

const AdminIncentives = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data = [] } = useSelector(
    (state) =>
      state.admin?.incentives || { data: [], loading: false, error: null }
  );

  const [year, setYear] = React.useState(new Date().getFullYear());
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);

  useEffect(() => {
    dispatch(fetchAdminIncentives({ year, month }));
  }, [dispatch, year, month]);

  const incentives = Array.isArray(data) ? data : [];

  // For admin (same semantics as ASM dashboard):
  // - Pending Incentive  = partners who are NOT yet eligible for incentive
  // - Eligible Incentive = partners who are eligible but incentive is NOT paid
  // - Done Incentive     = partners who are eligible and incentive is PAID
  const pendingCount = incentives.filter((i) => !i.eligibleForIncentive).length;
  const eligibleCount = incentives.filter(
    (i) => i.eligibleForIncentive && !i.incentivePaid
  ).length;
  const doneCount = incentives.filter(
    (i) => i.eligibleForIncentive && i.incentivePaid
  ).length;

  const IncentiveCard = ({ title, count, iconName, bgGradient, path }) => {
    const IconComponent = iconName === "Clock" ? Clock : CheckCircle;

    return (
      <div
        className="rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        style={{ background: bgGradient }}
        onClick={() => navigate(path, { state: { year, month } })}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-3xl font-bold text-white">{count || 0}</p>
          </div>
          <div className="p-3 rounded-full bg-white/20">
            <IconComponent size={32} className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center text-lg text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Dashboard
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Incentive Management (Admin)
          </h1>
          <p className="text-gray-600">
            Track partner targets, review eligible incentives and confirm payments.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Award size={24} className="mr-3 w-6 h-6 text-[#12B99C]" />
              <h2 className="text-2xl font-semibold" style={{ color: "#111827" }}>
                Incentives Overview
              </h2>
            </div>
            <div className="flex gap-3 text-sm">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  )
                )}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString("default", {
                      month: "short",
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IncentiveCard
              title="Pending Incentive"
              count={pendingCount}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/admin/incentives/pending"
            />

            <IncentiveCard
              title="Eligible Incentive"
              count={eligibleCount}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
              path="/admin/incentives/eligible"
            />

            <IncentiveCard
              title="Done Incentive"
              count={doneCount}
              iconName="CheckCircle"
              bgGradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              path="/admin/incentives/done"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIncentives;
