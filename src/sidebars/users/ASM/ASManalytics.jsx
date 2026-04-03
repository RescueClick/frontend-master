import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, UserCheck, Banknote, TrendingUp, IndianRupee, FileText } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchRsmAnalytics } from '../../../feature/thunks/asmThunks';
import { fetchAnalyticsKpis } from "../../../feature/thunks/analyticsThunks";
import { designSystem, formatCurrency, formatNumber } from '../../../utils/designSystem';
import { parseAnalyticsData } from '../../../utils/analyticsParser';
import MetricCard from '../../../components/shared/MetricCard';
import PageHeader from "../../../components/shared/PageHeader";
import ReportingHierarchyCard from "../../../components/shared/ReportingHierarchyCard";
import ChartCard from "../../../components/shared/ChartCard";
import FiltersBar from "../../../components/shared/FiltersBar";
import { FunnelChart, ConversionChart, FinancialsChart, AgingChart } from "../../../components/shared/KpiCharts";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

function toYmd(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function presetToRange(preset, customStart, customEnd) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (preset === "custom") return { start: customStart || null, end: customEnd || null };
  if (preset === "today") return { start: toYmd(todayStart), end: toYmd(tomorrowStart) };
  if (preset === "7d") {
    const s = new Date(todayStart);
    s.setDate(s.getDate() - 7);
    return { start: toYmd(s), end: toYmd(tomorrowStart) };
  }
  if (preset === "30d") {
    const s = new Date(todayStart);
    s.setDate(s.getDate() - 30);
    return { start: toYmd(s), end: toYmd(tomorrowStart) };
  }
  if (preset === "mtd") {
    return { start: toYmd(new Date(now.getFullYear(), now.getMonth(), 1)), end: toYmd(tomorrowStart) };
  }
  if (preset === "qtd") {
    const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return { start: toYmd(new Date(now.getFullYear(), qStartMonth, 1)), end: toYmd(tomorrowStart) };
  }
  if (preset === "ytd") {
    return { start: toYmd(new Date(now.getFullYear(), 0, 1)), end: toYmd(tomorrowStart) };
  }
  const s = new Date(todayStart);
  s.setDate(s.getDate() - 30);
  return { start: toYmd(s), end: toYmd(tomorrowStart) };
}


const ASManalytics = () => {

  const navigate = useNavigate();


  const dispatch = useDispatch();

  // Access state from Redux
  const { loading, error, data } = useSelector(
    (state) => state.asm.rsmAnalytics || { loading: false, error: null, data: null }
  );

  const location = useLocation();
  const { id, role } = location.state || {};
  const [filters, setFilters] = useState({ preset: "30d" });
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisError, setKpisError] = useState(null);

  // Call API when component mounts
  useEffect(() => {
    if (!id) {
      console.error("No RSM ID provided in navigation state");
      return;
    }
    dispatch(fetchRsmAnalytics(id)); // Fetch RSM analytics
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    const { start, end } = presetToRange(filters.preset, filters.start, filters.end);
    setKpisLoading(true);
    setKpisError(null);
    dispatch(fetchAnalyticsKpis({ id, start, end }))
      .unwrap()
      .then((res) => setKpis(res?.kpis ?? res?.data?.kpis ?? null))
      .catch((e) => setKpisError(typeof e === "string" ? e : "Failed to load KPI analytics"))
      .finally(() => setKpisLoading(false));
  }, [id, filters, dispatch]);

  // Process analytics data using universal parser
  const parsedData = useMemo(() => parseAnalyticsData(data, "RSM"), [data]);

  const pageSubtitle = useMemo(() => {
    const nav = location.state || {};
    const empId = parsedData.profile?.employeeId;
    const idLabel =
      empId && empId !== "N/A"
        ? empId
        : id
        ? String(id).length > 12
          ? `…${String(id).slice(-8)}`
          : String(id)
        : "";
    const detail = nav.detail || "Regional Sales Manager";
    const nm =
      nav.name ||
      (parsedData.profile?.name && parsedData.profile.name !== "N/A"
        ? parsedData.profile.name
        : "");
    const parts = [
      idLabel ? `ID: ${idLabel}` : null,
      detail || null,
      nm || null,
    ].filter(Boolean);
    return parts.length
      ? parts.join(" · ")
      : "ASM view (RSM performance and monthly history)";
  }, [location.state, id, parsedData]);
  
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
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            className="bg-brand-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-primary-hover transition-colors"
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
        <div className="mb-6">
          <PageHeader
            title="Analytics"
            subtitle={pageSubtitle}
            right={
              <button
                type="button"
                onClick={() => navigate("/asm/dashboard")}
                className="text-sm px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            }
          />
        </div>
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

      {/* KPI section moved below Metrics Cards */}

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
          {parsedData.profile.reportingChain?.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <ReportingHierarchyCard chain={parsedData.profile.reportingChain} />
            </div>
          )}
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

        <FiltersBar value={filters} onChange={setFilters} className="mb-6" />

        {kpisError ? (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {kpisError}
          </div>
        ) : null}

        {!kpisError ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <ChartCard title="Funnel" subtitle="Application → Approved → Disbursed">
                {kpisLoading ? (
                  <p className="text-sm text-gray-500">Loading KPI analytics…</p>
                ) : (
                  <FunnelChart kpis={kpis} />
                )}
              </ChartCard>

              <ChartCard title="Conversion" subtitle="Stage-to-stage conversion rates">
                {kpisLoading ? (
                  <p className="text-sm text-gray-500">Loading KPI analytics…</p>
                ) : (
                  <ConversionChart kpis={kpis} />
                )}
              </ChartCard>

              <ChartCard title="Financials" subtitle="Payouts and incentives (by status)">
                {kpisLoading ? (
                  <p className="text-sm text-gray-500">Loading KPI analytics…</p>
                ) : (
                  <FinancialsChart kpis={kpis} />
                )}
              </ChartCard>
            </div>

            <div className="mb-8">
              <ChartCard title="SLA / Aging" subtitle="Open application aging buckets (by status)">
                {kpisLoading ? (
                  <p className="text-sm text-gray-500">Loading KPI analytics…</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                        <p className="text-[11px] text-gray-500">Disbursed avg (days)</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{kpis?.sla?.disbursedSla?.avgDays ?? 0}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                        <p className="text-[11px] text-gray-500">Median (days)</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{kpis?.sla?.disbursedSla?.medianDays ?? "—"}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                        <p className="text-[11px] text-gray-500">Disbursed count</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{kpis?.sla?.disbursedSla?.count ?? 0}</p>
                      </div>
                    </div>

                    {Number(kpis?.sla?.openCount || 0) > 0 ? (
                      <AgingChart kpis={kpis} variant="pie" />
                    ) : (
                      <div className="h-[260px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-center px-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">No open applications</p>
                          <p className="text-xs text-gray-500 mt-1">Try expanding the date range to see pending cases.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ChartCard>
            </div>
          </>
        ) : null}

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Disbursement Trend"
            subtitle="Monthly achieved amount (from monthlyPerformance)"
          >
            {analyticsData.monthlyPerformance && analyticsData.monthlyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={analyticsData.monthlyPerformance.map((m, idx) => ({
                    label:
                      m.label ||
                      (m.month && m.year
                        ? new Date(m.year, m.month - 1).toLocaleString("en-US", { month: "short" })
                        : `M${idx + 1}`),
                    achieved: Number(m.achievedValue || m.achieved || 0),
                    target: Number(m.targetValue || m.target || 0),
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <Tooltip
                    formatter={(v, k) => [
                      typeof v === "number" ? formatCurrency(v) : v,
                      k === "achieved" ? "Achieved" : "Target",
                    ]}
                  />
                  <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="achieved" stroke="#10B981" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400">No monthly history data available yet.</p>
            )}
          </ChartCard>

          <ChartCard
            title="Target vs Achieved"
            subtitle="Monthly target and achieved (bar comparison)"
          >
            {analyticsData.monthlyPerformance && analyticsData.monthlyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={analyticsData.monthlyPerformance.map((m, idx) => ({
                    label:
                      m.label ||
                      (m.month && m.year
                        ? new Date(m.year, m.month - 1).toLocaleString("en-US", { month: "short" })
                        : `M${idx + 1}`),
                    achieved: Number(m.achievedValue || m.achieved || 0),
                    target: Number(m.targetValue || m.target || 0),
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <Tooltip
                    formatter={(v, k) => [
                      typeof v === "number" ? formatCurrency(v) : v,
                      k === "achieved" ? "Achieved" : "Target",
                    ]}
                  />
                  <Bar dataKey="target" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="achieved" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400">No monthly history data available yet.</p>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );


}

export default ASManalytics
