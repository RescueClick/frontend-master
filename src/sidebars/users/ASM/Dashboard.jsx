import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  Target,
  CheckCircle,
  Award,
  Building2,
  BarChart3,
  IndianRupee,
  FileText,
} from "lucide-react";
import { fetchAsmDashboard } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import { PeriodStatCard, PipelineFunnel, usePeriodLabel } from "../../../components/shared/RoleDashboardStats";
import DashboardPeriodFilter from "../../../components/DashboardPeriodFilter";
import { designSystem, formatCurrency, formatNumber, formatPercentage, typography } from "../../../utils/designSystem";

const Dashboard = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  const isRsm = location.pathname.startsWith("/rsm");
  const basePath = isRsm ? "/rsm" : "/asm";
  // Hierarchy: RSM has ASMs under them; ASM has RMs under them
  const subordinateLabel = isRsm ? "Area Sales Managers" : "Relationship Managers";
  const subordinateShort = isRsm ? "ASMs" : "RMs";
  const subordinatePath = isRsm ? "/rsm/asms" : "/asm/rms";

  const openSubordinateAnalytics = useCallback(
    (performer) => {
      if (!performer?.id) return;
      navigate(`${basePath}/analytics`, {
        state: {
          id: performer.id,
          role: isRsm ? "ASM" : "RM",
          name: performer.name || "",
          detail: isRsm
            ? (performer.asmType || performer.rsmType || "Area Sales Manager")
            : "Relationship Manager",
        },
      });
    },
    [navigate, basePath, isRsm]
  );

  const dispatch = useDispatch();

  const { data, loading, success, error } = useSelector(
    (state) => state.asm.dashboard
  );

  const fetchDashboardAction = useCallback(
    () => fetchAsmDashboard({ year, month }),
    [year, month]
  );

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchDashboardAction, {
    interval: 30000, // 30 seconds
    enabled: true,
    dependencies: [year, month],
  });

  useEffect(() => {
    dispatch(fetchAsmDashboard({ year, month }));
  }, [dispatch, year, month]);

  const periodLabel = usePeriodLabel(year, month);
  const fileStats = data?.fileStats;
  const isFiltered = Boolean(fileStats?.isFiltered);

  const metrics = useMemo(() => {
    const t = data?.totals || {};
    const subTotal = isRsm ? (t.totalASMs ?? t.totalRSMs ?? 0) : (t.totalRMs || 0);
    const subAll = t.allSubordinatesCount ?? subTotal;
    return [
      {
        label: subordinateLabel,
        value: isFiltered ? fileStats?.subordinates?.newInPeriod : subTotal,
        subtitle: isFiltered
          ? `Added in ${periodLabel} • ${formatNumber(subTotal)} total`
          : `${formatNumber(subTotal)} Active • ${formatNumber(subAll)} Total`,
        icon: Users,
        color: "blue",
        path: subordinatePath,
      },
      {
        label: "Partners",
        allTimeLabel: "Active Partners",
        value: isFiltered ? fileStats?.partners?.newInPeriod : t.activePartners,
        subtitle: isFiltered
          ? `Added in ${periodLabel} • ${formatNumber(fileStats?.partners?.withActivityInPeriod || 0)} with activity • ${formatNumber(t.totalPartners || 0)} total`
          : `${formatNumber(t.activePartners || 0)} Active • ${formatNumber(t.totalPartners || 0)} Total`,
        icon: Building2,
        color: "emerald",
        path: `${basePath}/partners`,
      },
      {
        label: "Customers",
        allTimeLabel: "Total Customers",
        value: isFiltered ? fileStats?.period?.customers : (fileStats?.allTime?.customers ?? t.totalCustomers),
        subtitle: isFiltered
          ? `All-Time: ${formatNumber(fileStats?.allTime?.customers ?? t.totalCustomers ?? 0)} customers`
          : "With loan files",
        icon: UserCheck,
        color: "purple",
        path: `${basePath}/applications`,
      },
      {
        label: "Disbursed",
        allTimeLabel: "Total Disbursed",
        value: t.totalRevenue,
        currency: true,
        subtitle: isFiltered
          ? `All-Time: ${formatCurrency(t.allTimeRevenue || 0)} • ${formatNumber(t.periodDisbursedFiles || 0)} loans`
          : `${formatNumber(t.disbursedApplications || 0)} total loans disbursed`,
        icon: IndianRupee,
        color: "orange",
        path: `${basePath}/applications`,
      },
    ];
  }, [data?.totals, fileStats, isFiltered, isRsm, periodLabel, subordinateLabel, subordinatePath, basePath]);

  const targetVsAchievement = useMemo(() => {
    return (data?.targets || []).map((item) => {
      const target = item.disbursementTarget || item.target || 0; // Use disbursementTarget from hierarchical model
      const achievement = item.achieved || 0;
      const fileCountTarget = item.fileCountTarget || 0;
      const achievedFileCount = item.achievedFileCount || 0;
      const percentage = formatPercentage(achievement, target);
      const filePercentage = formatPercentage(achievedFileCount, fileCountTarget);

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
    const list = isRsm
      ? (data?.topASMPerformers || data?.topRSMPerformers || data?.topPerformers || [])
      : (data?.topRMPerformers || data?.topPerformers || []);
    return list.map((item, index) => ({
      id: item.id,
      name: item.name,
      revenue: item.totalRevenue ? `₹${(item.totalRevenue / 10000000).toFixed(2)}Cr` : "₹0.00",
      achievement: `${item.totalDisbursedApps || 0} Apps`,
      rank: index + 1,
      roleType: isRsm ? (item.asmType || item.rsmType || "ASM") : "RM",
    }));
  }, [isRsm, data?.topASMPerformers, data?.topRSMPerformers, data?.topRMPerformers, data?.topPerformers]);


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
            {isRsm ? "RSM Dashboard" : "ASM Dashboard"}
          </h1>
          <p className={`${typography.bodySmall()} mt-2`} style={{ color: designSystem.colors.text.secondary }}>
            {isRsm
              ? "Regional Sales Manager - Monitor ASM Performance, Manage Payouts & Incentives"
              : "Area Sales Manager - Monitor RM Performance, Manage Applications"}
          </p>
        </div>

        <div className="mb-6">
          <DashboardPeriodFilter
            year={year}
            month={month}
            onYearChange={setYear}
            onMonthChange={setMonth}
          />
        </div>

        {/* Top Row - Metric Cards (Linear Design) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric) => (
            <PeriodStatCard
              key={metric.label}
              {...metric}
              isFiltered={isFiltered}
              periodLabel={periodLabel}
              loading={loading && !data}
              onClick={metric.path ? () => navigate(metric.path, { state: { year, month } }) : undefined}
            />
          ))}
        </div>

        <PipelineFunnel
          fileStats={fileStats}
          periodLabel={periodLabel}
          loading={loading}
          onViewAll={() => navigate(`${basePath}/applications`, { state: { year, month } })}
        />

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
                    <span className={typography.caption()}>
                      {isRsm ? "Sum of all ASM targets in your region" : "Sum of all RM targets in your area"}
                    </span>
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
                        {formatPercentage(currentMonthTarget.achievedDisbursement, currentMonthTarget.disbursementTarget)}
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
                  Monthly target vs achievement comparison ({subordinateShort} Performance)
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
                              item.target > 0 && item.achievement >= item.target
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {item.percentage}
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

          {/* Top Performers */}
          <div className={`${designSystem.card.base} ${designSystem.card.padding}`}>
            <div className="flex items-center mb-6">
              <Award className="text-amber-500 mr-2" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Top {subordinateShort} Performers</h3>
            </div>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div
                    key={performer.id || index}
                    className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-3 transition-colors"
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
                          {performer.roleType} • Rank {performer.rank}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="text-[11px] font-medium text-slate-600 hover:text-brand-primary hover:underline"
                        onClick={() => openSubordinateAnalytics(performer)}
                      >
                        Analytics
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
                  <p>No {subordinateShort} performance data available</p>
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
