import React, { useCallback, useEffect, useMemo } from 'react'
import { Users, DollarSign, UserCheck, Banknote, TrendingUp, IndianRupee, FileText } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchRsmAnalytics } from '../../../feature/thunks/asmThunks';
import { designSystem, formatCurrency, formatNumber } from '../../../utils/designSystem';
import { parseAnalyticsData } from '../../../utils/analyticsParser';
import MetricCard from '../../../components/shared/MetricCard';


const ASManalytics = () => {

  const navigate = useNavigate();


  const dispatch = useDispatch();

  // Access state from Redux
  const { loading, error, data } = useSelector(
    (state) => state.asm.rsmAnalytics || { loading: false, error: null, data: null }
  );

  const location = useLocation();
  const { id, role } = location.state || {};

  // Call API when component mounts
  useEffect(() => {
    if (!id) {
      console.error("No RSM ID provided in navigation state");
      return;
    }
    dispatch(fetchRsmAnalytics(id)); // Fetch RSM analytics
  }, [dispatch, id]);

  // Process analytics data using universal parser
  const parsedData = useMemo(() => parseAnalyticsData(data, "RSM"), [data]);
  
  const analyticsData = useMemo(() => {
    return {
      rsm: {
        id: parsedData.profile.userId,
        name: parsedData.profile.name,
        email: parsedData.profile.email,
        phone: parsedData.profile.phone,
        employeeId: parsedData.profile.employeeId,
        rsmType: "N/A",
      },
      totals: {
        totalRMs: parsedData.totals.totalRMs || parsedData.totals.rms || 0,
        totalPartners: parsedData.totals.partners || 0,
        totalApplications: parsedData.totals.totalApplications || 0,
        disbursedApplications: parsedData.totals.disbursedApplications || 0,
        inProcessApplications: parsedData.totals.inProcessApplications || 0,
        totalDisbursed: parsedData.totalDisbursed,
        totalRevenue: parsedData.totalDisbursed,
      },
      monthlyPerformance: parsedData.monthlyPerformance || [],
      targetValue: parsedData.assignedTarget.targetValue,
      achievedValue: parsedData.assignedTarget.achievedValue || parsedData.totalDisbursed,
      performancePercentage: parsedData.performancePercentage,
      performance: parsedData.performance
    };
  }, [parsedData]);


  // Format currency helper
  const formatCurrencyHelper = useCallback((value) => {
    return formatCurrency(value);
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#12B99C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading RSM analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: designSystem.colors.background }}>
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
          <div className="bg-red-100 text-red-600 w-16 h-16 flex items-center justify-center rounded-full text-4xl shadow-sm mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#12B99C] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0EA688] transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* RSM Info Card */}
        <div className={`${designSystem.card.base} ${designSystem.card.padding} mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 - Basic Info */}
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: designSystem.colors.text.primary }}>
                {analyticsData?.rsm?.name || "RSM"}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={designSystem.badge.active}>
                  {analyticsData?.rsm?.rsmType || "RSM"}
                </span>
              </div>
            </div>

            {/* Column 2 - Contact Information */}
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: designSystem.colors.secondary }}>
                Contact Information
              </h4>
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>
                    {analyticsData?.rsm?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>
                    {analyticsData?.rsm?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 3 - System Information */}
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: designSystem.colors.secondary }}>
                System Information
              </h4>
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-500">Employee ID</p>
                  <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>
                    {analyticsData?.rsm?.employeeId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards - Linear Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total RMs"
            value={formatNumber(analyticsData?.totals?.totalRMs || 0)}
            icon={UserCheck}
            colorIndex={0}
            subtitle="Relationship Managers"
          />

          <MetricCard
            title="Total Partners"
            value={formatNumber(analyticsData?.totals?.totalPartners || 0)}
            icon={Users}
            colorIndex={1}
            subtitle="Active partners"
          />

          <MetricCard
            title="Target"
            value={formatCurrencyHelper(analyticsData?.targetValue ?? 0)}
            icon={TrendingUp}
            colorIndex={2}
            subtitle="Monthly target"
            isLoading={loading}
          />

          <MetricCard
            title="Total Disbursed"
            value={formatCurrencyHelper(parsedData.totalDisbursed || 0)}
            icon={IndianRupee}
            colorIndex={3}
            subtitle="Disbursed amount"
          />
        </div>

        {/* Target vs Achievement - ASM (This Month) */}
        <div className={`${designSystem.card.base} ${designSystem.card.padding} mb-6`}>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-xl font-bold" style={{ color: designSystem.colors.text.primary }}>
              Target vs Achievement
            </h2>
            <span className="text-xs font-medium text-gray-500">
              {(() => {
                const now = new Date();
                const monthNames = [
                  "January","February","March","April","May","June",
                  "July","August","September","October","November","December",
                ];
                return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
              })()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Disbursed vs assigned target for this month (ASM hierarchy)
          </p>

          <div className="flex flex-wrap items-center gap-8">
            {/* Pie */}
            <div className="relative w-28 h-28 flex-shrink-0">
              {(() => {
                const target = analyticsData.targetValue || 0;
                const achieved = analyticsData.achievedValue || 0;
                const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
                const radius = 44;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (pct / 100) * circumference;
                return (
                  <svg viewBox="0 0 100 100" className="w-28 h-28">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                );
              })()}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-[220px] space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  This Month
                </p>
                <p className="text-2xl font-semibold mt-1" style={{ color: designSystem.colors.text.primary }}>
                  {analyticsData.targetValue > 0
                    ? `${Math.min(analyticsData.performancePercentage || 0, 100).toFixed(0)}%`
                    : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ASM-level disbursed vs target
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-600">Achieved</span>
                </div>
                <span className="text-sm font-medium" style={{ color: designSystem.colors.text.primary }}>
                  {formatCurrencyHelper(analyticsData.achievedValue || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-600">Remaining to target</span>
                </div>
                <span className="text-sm font-medium" style={{ color: designSystem.colors.text.primary }}>
                  {analyticsData.targetValue > 0
                    ? formatCurrencyHelper(
                        Math.max(0, analyticsData.targetValue - (analyticsData.achievedValue || 0))
                      )
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly History - ASM */}
        <div className={`${designSystem.card.base} ${designSystem.card.padding}`}>
          <h2 className="text-xl font-bold mb-2" style={{ color: designSystem.colors.text.primary }}>
            Monthly History
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Previous months&apos; disbursement vs target (ASM hierarchy)
          </p>

          {analyticsData.monthlyPerformance && analyticsData.monthlyPerformance.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div className="flex items-end gap-4 h-40">
                {analyticsData.monthlyPerformance.map((m, idx) => {
                  const target = Number(m.targetValue || m.target || 0);
                  const achieved = Number(m.achievedValue || m.achieved || 0);
                  const pct = target > 0 ? Math.min(100, (achieved / target) * 100) : 0;
                  const monthLabel =
                    m.month && m.year
                      ? `${new Date(m.year, m.month - 1).toLocaleString("en-US", {
                          month: "short",
                        })}`
                      : `M${idx + 1}`;

                  return (
                    <div key={idx} className="flex flex-col items-center flex-shrink-0 min-w-[32px]">
                      <div className="relative w-5 bg-gray-100 rounded-md overflow-hidden h-24 flex items-end">
                        <div
                          className="w-full bg-emerald-500 rounded-md transition-all duration-300"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="mt-1 text-[10px] text-gray-600 text-center">
                        {monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              No monthly history data available yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );


}

export default ASManalytics
