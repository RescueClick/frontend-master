import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  DollarSign,
  Target,
  CheckCircle,
  Award,
  Building2,
  BarChart3,
  IndianRupee,
  FileText,
  Eye,
} from "lucide-react";
import { fetchAsmDashboard } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import MetricCard from "../../../components/shared/MetricCard";
import { designSystem, formatCurrency, formatNumber, typography } from "../../../utils/designSystem";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const openRsmAnalytics = useCallback(
    (performer) => {
      if (!performer?.id) return;
      navigate("/asm/analytics", {
        state: { id: performer.id, role: "RSM" },
      });
    },
    [navigate]
  );

  const dispatch = useDispatch();

  const { data, loading, success, error } = useSelector(
    (state) => state.asm.dashboard
  );

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchAsmDashboard, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Memoized metrics - ASM focuses on RSMs only (hierarchical access)
  const metrics = useMemo(() => [
    {
      title: "Regional Sales Managers",
      value: formatNumber(data?.totals?.totalRSMs || 0),
      icon: Users,
      path: "/asm/rsms",
      subtitle: "RSMs under your management"
    },
    {
      title: "Active Partners",
      value: formatNumber(data?.totals?.activePartners || 0),
      icon: Building2,
      path: "/asm/rms",
      subtitle: "Active partners in region"
    },
    {
      title: "Total Customers",
      value: formatNumber(data?.totals?.totalCustomers || 0),
      icon: UserCheck,
      path: "/asm/applications",
      subtitle: "Total customer base"
    },
    {
      title: "Total Disbursed",
      value: formatCurrency(data?.totals?.totalRevenue || 0),
      icon: IndianRupee,
      path: "/asm/applications",
      subtitle: "Disbursed amount"
    },
  ], [data?.totals]);

  const targetVsAchievement = useMemo(() => {
    return (data?.targets || []).map((item) => {
      const target = item.disbursementTarget || item.target || 0; // Use disbursementTarget from hierarchical model
      const achievement = item.achieved || 0;
      const fileCountTarget = item.fileCountTarget || 0;
      const achievedFileCount = item.achievedFileCount || 0;
      const percentage =
        target > 0 ? Math.round((achievement / target) * 100) : 0;
      const filePercentage =
        fileCountTarget > 0 ? Math.round((achievedFileCount / fileCountTarget) * 100) : 0;

      return {
        month: item.month.substring(0, 3),
        target,
        achievement,
        percentage,
        fileCountTarget,
        achievedFileCount,
        filePercentage,
      };
    });
  }, [data?.targets]);

  // Current month target data
  const currentMonthTarget = useMemo(() => {
    return data?.currentMonthTarget || {
      fileCountTarget: 0,
      disbursementTarget: 0,
      achievedFileCount: 0,
      achievedDisbursement: 0,
      fileTargetMet: false,
      disbursementTargetMet: false,
      targetAchieved: false,
    };
  }, [data?.currentMonthTarget]);

  const topPerformers = useMemo(() => {
    // ASM sees top RSM performers
    return (data?.topRSMPerformers || []).map((item, index) => ({
      id: item.id,
      name: item.name,
      revenue: `₹${(item.totalRevenue / 10000000).toFixed(2)}Cr`,
      achievement: `${item.totalDisbursedApps || 0} Apps`,
      rank: index + 1,
      rsmType: item.rsmType,
    }));
  }, [data?.topRSMPerformers]);


  const currentDate = new Date();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={typography.h1()} style={{ color: designSystem.colors.text.primary }}>
            ASM Dashboard
          </h1>
          <p className={`${typography.bodySmall()} mt-2`} style={{ color: designSystem.colors.text.secondary }}>
            Area Sales Manager - Monitor RSM Performance, Manage Payouts & Incentives
          </p>
        </div>

        {/* Top Row - Metric Cards (Linear Design) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              colorIndex={index}
              subtitle={metric.subtitle}
              onClick={metric.path ? () => navigate(metric.path) : undefined}
              isLoading={loading}
            />
          ))}
        </div>

        {/* Current Month Target Card - ASM focuses on Disbursement (Business Metric) */}
        <div className={`${designSystem.card.base} ${designSystem.card.padding} mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={typography.h4()}>Current Month Target</h3>
            <span className={`${typography.caption()} bg-blue-50 px-2 py-1 rounded`}>Revenue Target</span>
          </div>
          <div className="space-y-3">
            {/* Disbursement Target - Primary Metric for ASM */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <span className={`${typography.label()} block`}>Disbursement Target</span>
                    <span className={typography.caption()}>Sum of all RSM targets in your region</span>
                  </div>
                  <div className="flex items-center space-x-2 ml-auto">
                    {currentMonthTarget.disbursementTargetMet ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <Target size={18} className="text-orange-500" />
                    )}
                    <span
                      className={`text-sm px-3 py-1 rounded-full font-semibold ${
                        currentMonthTarget.disbursementTargetMet
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {currentMonthTarget.disbursementTarget > 0
                        ? Math.round((currentMonthTarget.achievedDisbursement / currentMonthTarget.disbursementTarget) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className={typography.h2()}>
                  ₹{(currentMonthTarget.achievedDisbursement / 100000).toFixed(1)}L / ₹{(currentMonthTarget.disbursementTarget / 100000).toFixed(1)}L
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      currentMonthTarget.disbursementTarget > 0
                        ? (currentMonthTarget.achievedDisbursement / currentMonthTarget.disbursementTarget) * 100
                        : 0,
                      100
                    )}%`,
                    backgroundColor: currentMonthTarget.disbursementTargetMet ? "#10B981" : "#F59E0B",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Analytics */}
          <div className={`lg:col-span-2 ${designSystem.card.base} ${designSystem.card.padding}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={typography.h4()}>
                  Performance Analytics
                </h3>
                <p className={typography.bodySmall()}>
                  Monthly target vs achievement comparison (RSM Performance)
                </p>
              </div>
              <BarChart3 className="text-gray-400" size={20} />
            </div>

            <div className="space-y-4">
              {targetVsAchievement
                .filter((item) => item?.target !== 0)
                .map((item, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 w-8">
                          {item.month}
                        </span>
                        <div className="flex items-center space-x-2">
                          {item.percentage >= 100 ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <Target size={16} className="text-orange-500" />
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.percentage >= 100
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.achievement)} / {formatCurrency(item.target)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (item.achievement / item.target) * 100,
                            100
                          )}%`,
                          backgroundColor:
                            item.achievement >= item.target ? designSystem.colors.primary : designSystem.colors.warning,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Performers - RSMs */}
          <div className={`${designSystem.card.base} ${designSystem.card.padding}`}>
            <div className="flex items-center mb-6">
              <Award className="text-amber-500 mr-2" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Top RSM Performers</h3>
            </div>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div
                    key={performer.id || index}
                    className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => openRsmAnalytics(performer)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openRsmAnalytics(performer);
                    }}
                  >
                    <div className="flex items-center min-w-0">
                      <div
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-amber-600"
                            : "bg-gray-300"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {performer.name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {performer.rsmType || "RSM"} • Rank {performer.rank}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-brand-primary/5"
                        title="Open RSM analytics"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRsmAnalytics(performer);
                        }}
                      >
                        <Eye size={14} className="text-brand-primary" />
                        View
                      </button>
                      <div className="text-right">
                        <p className="text-gray-800 text-sm font-semibold">
                          {performer.revenue || "-"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {performer.achievement || "0 Apps"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No RSM performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
