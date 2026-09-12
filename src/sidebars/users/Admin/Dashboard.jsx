import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdminDashboard, fetchRecentActivities } from '../../../feature/thunks/adminThunks';
import { useRealtimeData } from '../../../utils/useRealtimeData';

import {
  BarChart3,
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  Bell,
  Menu,
  ChevronDown,
  Settings,
  Mail,
  FileText,
  LayoutGrid,
  Download,
  Banknote,
  User,
  IndianRupee,
  Award,
  Sparkles,
  ChevronRight,
  Calendar,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { formatCurrency, formatNumber, formatPercentage, typography } from '../../../utils/designSystem';
import PageHeader from "../../../components/shared/PageHeader";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Month-basis filter state: default to current month & year (or from navigation state)
  const [year, setYear] = useState(
    location.state?.year !== undefined ? location.state.year : currentYear
  );
  const [month, setMonth] = useState(
    location.state?.month !== undefined ? location.state.month : currentMonth
  );
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const { data } = useSelector((state) => state.admin.dashboard);
  const recentActivitiesState = useSelector((state) => state.admin.recentActivities || { activities: [] });
  const activities = recentActivitiesState.activities || [];

  const isFiltered = year !== "all" || month !== "all";
  const isCurrentMonthActive = year === currentYear && month === currentMonth;

  // Period label for titles & subtitles
  const periodLabel = useMemo(() => {
    if (year === "all" && month === "all") return "All Time";
    if (month === "all") return `Year ${year}`;
    const mIdx = typeof month === "number" ? month - 1 : parseInt(month, 10) - 1;
    const mStr = SHORT_MONTH_NAMES[mIdx] || `Month ${month}`;
    if (year === "all") return `All Years • ${mStr}`;
    return `${mStr} ${year}`;
  }, [year, month]);

  const fullPeriodLabel = useMemo(() => {
    if (year === "all" && month === "all") return "All Time (Company-wide)";
    if (month === "all") return `Full Year ${year}`;
    const mIdx = typeof month === "number" ? month - 1 : parseInt(month, 10) - 1;
    const mStr = MONTH_NAMES[mIdx] || `Month ${month}`;
    if (year === "all") return `${mStr} across all years`;
    return `${mStr} ${year}`;
  }, [year, month]);

  // Real-time dashboard updates with 30 second polling
  const fetchDashboardAction = useCallback(
    () => fetchAdminDashboard({ year, month }),
    [year, month]
  );

  useRealtimeData(fetchDashboardAction, {
    interval: 30000, // 30 seconds
    enabled: true,
    dependencies: [year, month],
  });

  // Explicit initial fetch & refetch on filter change
  useEffect(() => {
    dispatch(fetchAdminDashboard({ year, month }));
  }, [dispatch, year, month]);

  // Fetch recent activities on mount and every 30 seconds
  useEffect(() => {
    dispatch(fetchRecentActivities(10));
    const interval = setInterval(() => {
      dispatch(fetchRecentActivities(10));
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Escape key handler for breakdown modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowBreakdownModal(false);
      }
    };
    if (showBreakdownModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showBreakdownModal]);

  // Quick preset handlers
  const handleSelectThisMonth = () => {
    setYear(currentYear);
    setMonth(currentMonth);
  };

  const handleSelectLastMonth = () => {
    const prevDate = new Date(currentYear, currentMonth - 2, 1);
    setYear(prevDate.getFullYear());
    setMonth(prevDate.getMonth() + 1);
  };

  const handleSelectAllTime = () => {
    setYear("all");
    setMonth("all");
  };

  // Helper to navigate with current month state preserved
  const navigateWithPeriod = (path) => {
    navigate(path, { state: { year, month } });
  };

  // Monthly breakdown from backend
  const monthlyBreakdown = data?.monthlyBreakdown || [];
  const maxMonthlyRevenue = useMemo(() => {
    if (!monthlyBreakdown.length) return 1;
    return Math.max(...monthlyBreakdown.map((m) => Number(m.revenue || 0)), 1);
  }, [monthlyBreakdown]);

  // Current volume for milestone calculator
  const milestoneVolume = Number(
    (isFiltered ? data?.periodRevenue : data?.monthlyRevenue) ?? data?.totalRevenue ?? 0
  );

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Top Page Header */}
      <div className="mb-4">
        <PageHeader
          title="Dashboard Overview"
          subtitle="Monitor company performance, disbursement volumes, payouts, and partner metrics by month"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBreakdownModal(true)}
                className="text-xs px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold shadow-xs hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                title="View 12-Month Performance Breakdown"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Monthly Breakdown</span>
              </button>
              <button
                type="button"
                onClick={() => navigateWithPeriod("/admin/disbursed-loans")}
                className="text-xs px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Disbursed Loans</span>
              </button>
              <button
                type="button"
                onClick={() => navigateWithPeriod("/admin/payout")}
                className="text-xs px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"
              >
                <Banknote className="w-3.5 h-3.5 text-white" />
                <span>View Payouts</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Monthly Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3.5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Indicator & Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Month Basis:</span>
              <span className="font-bold text-emerald-700">{fullPeriodLabel}</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectThisMonth}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isCurrentMonthActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleSelectLastMonth}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  month === (currentMonth === 1 ? 12 : currentMonth - 1) &&
                  year === (currentMonth === 1 ? currentYear - 1 : currentYear)
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={handleSelectAllTime}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  year === "all" && month === "all"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setShowBreakdownModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-xs transition-all flex items-center gap-1.5 ml-1"
                title="View 12-Month Performance Breakdown Table"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>12 Months Breakdown</span>
              </button>
            </div>
          </div>

          {/* Right: Year & Month Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="admin-dash-year" className="text-xs font-medium text-gray-500">Year:</label>
              <select
                id="admin-dash-year"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
                }
                className="text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Years</option>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="admin-dash-month" className="text-xs font-medium text-gray-500">Month:</label>
              <select
                id="admin-dash-month"
                value={month}
                onChange={(e) =>
                  setMonth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
                }
                className="text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m - 1]}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button (visible when non-default) */}
            {!isCurrentMonthActive && (
              <button
                type="button"
                onClick={handleSelectThisMonth}
                title="Reset to current month"
                className="p-1.5 text-gray-500 hover:text-emerald-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Grid (Filtered by Month Basis) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5 mb-6">
        {/* PAYOUT CARD */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigateWithPeriod("/admin/payout")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className={`${typography.captionSmall()} uppercase tracking-wider`}>
                  {isFiltered ? `Payouts (${periodLabel})` : "All Time Payout"}
                </p>
                {isFiltered && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-red-50 text-red-700 border border-red-200">
                    Monthly
                  </span>
                )}
              </div>
              <p className={`${typography.h2()} mb-1 truncate`}>
                {formatCurrency(data?.totalPayout || 0)}
              </p>
              <p className={typography.tiny()}>
                {isFiltered
                  ? `All-Time: ${formatCurrency(data?.allTimePayout || 0)}`
                  : "Total partner commission payouts made"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Banknote className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* TOTAL DISBURSED */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigateWithPeriod("/admin/disbursed-loans")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className={`${typography.captionSmall()} uppercase tracking-wider`}>
                  {isFiltered ? `Disbursed (${periodLabel})` : "Total Disbursed"}
                </p>
                {isFiltered && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                    Monthly
                  </span>
                )}
              </div>
              <p className={`${typography.h2()} mb-1 truncate`}>
                {formatCurrency(data?.totalRevenue || 0)}
              </p>
              <p className={typography.tiny()}>
                {isFiltered
                  ? `All-Time: ${formatCurrency(data?.allTimeRevenue || 0)} • ${formatNumber(data?.disbursedFiles || 0)} loans`
                  : `${formatNumber(data?.disbursedFiles || 0)} total loans disbursed`}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* ASM */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/asm")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Area Sales Managers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalASM || 0)}</p>
              <p className={typography.tiny()}>Active ASMs</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* RSMs */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/rsm")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Regional Sales Managers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalRSM || 0)}</p>
              <p className={typography.tiny()}>Active RSMs</p>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* RM */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/rm")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Relationship Managers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalRM || 0)}</p>
              <p className={typography.tiny()}>Active RMs</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* PARTNERS */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/partner")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Active Partners</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.activePartners ?? data?.totalPartners ?? 0)}</p>
              <p className={typography.tiny()}>
                {isFiltered ? (
                  <>
                    <span className="font-semibold text-emerald-600">{formatNumber(data?.activePartnersInPeriod || 0)} active in {periodLabel}</span> • {formatNumber(data?.totalPartners || 0)} total
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-emerald-600">{formatNumber(data?.activePartners ?? 0)} Active</span> • {formatNumber(data?.totalPartners || 0)} Total
                  </>
                )}
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/customer")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Customers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalCustomers || 0)}</p>
              <p className={typography.tiny()}>
                {isFiltered && data?.newCustomersInPeriod ? (
                  <span className="font-semibold text-purple-700">{formatNumber(data.newCustomersInPeriod)} new in {periodLabel}</span>
                ) : (
                  "With loan applications"
                )}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Monthly Unlocked Cash Bonus Pool */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigateWithPeriod("/admin/incentives")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-full opacity-60"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2 text-amber-700 font-semibold`}>
                Bonus Pool ({periodLabel})
              </p>
              <p className={`${typography.h2()} mb-1 text-amber-900 truncate`}>
                {formatCurrency(data?.monthlyBonusUnlocked || 0)}
              </p>
              <p className={typography.tiny()}>
                <span className="font-semibold text-amber-700">{formatNumber(data?.partnersWithBonus || 0)} Partners</span> unlocked bonuses in {periodLabel}
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Achieved Company Disbursement */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigateWithPeriod("/admin/disbursed-loans")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>
                {isFiltered ? `Achieved in ${periodLabel}` : "Achieved Disbursement"}
              </p>
              <p className={`${typography.h2()} mb-1 truncate`}>
                {formatCurrency(data?.totalRevenue || 0)}
              </p>
              <p className={typography.tiny()}>
                {isFiltered
                  ? `Volume disbursed for ${periodLabel}`
                  : data?.monthlyRevenue != null
                  ? `${formatCurrency(data.monthlyRevenue)} this month`
                  : "Company-wide disbursement"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Applications Pipeline Funnel (Month Basis) */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className={typography.h3()}>
                Application Pipeline & Funnel — <span className="text-emerald-700">{periodLabel}</span>
              </h2>
              <p className={`${typography.caption()} text-gray-500`}>
                Breakdown of loan applications registered and processed in this period
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateWithPeriod("/admin/disbursed-loans")}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1"
          >
            <span>View All Loans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Funnel Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {/* Total Files */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Files</span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">{formatNumber(data?.totalFiles || 0)}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isFiltered ? `Submitted in ${periodLabel}` : "All submitted files"}
            </p>
          </div>

          {/* In Process */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-700 uppercase">In Process</span>
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <p className="text-xl font-extrabold text-blue-900">{formatNumber(data?.inProcessFiles || 0)}</p>
            <p className="text-[11px] text-blue-600 mt-1">
              {data?.totalFiles
                ? `${Math.round(((data.inProcessFiles || 0) / data.totalFiles) * 100)}% of total`
                : "Under active review"}
            </p>
          </div>

          {/* Approved */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-teal-700 uppercase">Approved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <p className="text-xl font-extrabold text-teal-900">{formatNumber(data?.approvedFiles || 0)}</p>
            <p className="text-[11px] text-teal-600 mt-1">
              {data?.totalFiles
                ? `${Math.round(((data.approvedFiles || 0) / data.totalFiles) * 100)}% approval rate`
                : "Sanctioned files"}
            </p>
          </div>

          {/* Disbursed */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Disbursed</span>
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-emerald-900">{formatNumber(data?.disbursedFiles || 0)}</p>
            <p className="text-[11px] text-emerald-600 mt-1">
              {data?.totalFiles
                ? `${Math.round(((data.disbursedFiles || 0) / data.totalFiles) * 100)}% conversion`
                : "Successfully paid out"}
            </p>
          </div>

          {/* Rejected */}
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-rose-700 uppercase">Rejected</span>
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-xl font-extrabold text-rose-900">{formatNumber(data?.rejectedFiles || 0)}</p>
            <p className="text-[11px] text-rose-600 mt-1">
              {data?.totalFiles
                ? `${Math.round(((data.rejectedFiles || 0) / data.totalFiles) * 100)}% rejected`
                : "Declined files"}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Milestone & Volume Progression */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={typography.h3()}>
                Disbursement Volume & Milestone Rewards ({periodLabel})
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                ₹1,000 / ₹10L Plan Active
              </span>
            </div>
            <p className={`${typography.caption()} mt-1 text-gray-500`}>
              Pure volume progression for {periodLabel} — no file count limits or arbitrary target hurdles
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateWithPeriod("/admin/incentives")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <span>Incentives Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(() => {
          const currentVolume = milestoneVolume;
          const unitMilestone = 1000000; // ₹10 Lakhs
          const nextBenchmark = Math.max(unitMilestone, (Math.floor(currentVolume / unitMilestone) + 1) * unitMilestone);
          const prevBenchmark = Math.floor(currentVolume / unitMilestone) * unitMilestone;
          const range = nextBenchmark - prevBenchmark;
          const progressInBlock = currentVolume - prevBenchmark;
          const blockPct = Math.min(100, Math.max(0, Math.round((progressInBlock / range) * 100)));
          const remainingToNext = Math.max(0, nextBenchmark - currentVolume);

          const radius = 52;
          const circumference = 2 * Math.PI * radius;
          const visualPct = Math.min(100, blockPct);
          const offset = circumference - (visualPct / 100) * circumference;

          return (
            <div className="flex items-center gap-8 flex-wrap">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-gray-900 leading-tight">
                    {blockPct}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    To Next ₹10L
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-[220px] space-y-3">
                <div>
                  <p className={typography.captionSmall()}>Disbursed Volume ({periodLabel})</p>
                  <p className={`${typography.h2()} mt-1 text-emerald-700`}>
                    {formatCurrency(currentVolume)}
                  </p>
                  <p className={`${typography.caption()} text-gray-500 mt-1`}>
                    Total company disbursement volume for {fullPeriodLabel}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Next Milestone Tier</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(nextBenchmark)}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      +{formatCurrency(1000)} Bonus
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Volume Needed</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(remainingToNext)}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      to level up
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2 text-gray-600 flex-wrap gap-2">
                  <span>
                    Bonus Pool ({periodLabel}): <strong className="text-emerald-700 font-bold">{formatCurrency(data?.monthlyBonusUnlocked || 0)}</strong>
                  </span>
                  <span>
                    Qualified Partners: <strong className="text-gray-900 font-bold">{formatNumber(data?.partnersWithBonus || 0)}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Additional Dashboard Content: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 20rem)', height: 'calc(100vh - 20rem)' }}
        >
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h3 className={typography.h3()}>Recent Activity</h3>
              <p className={`${typography.caption()} mt-1`}>Latest system activities and updates</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <Bell className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => {
                const getIcon = () => {
                  switch (activity.icon) {
                    case "users":
                      return <Users size={16} className="text-white" />;
                    case "banknote":
                      return <Banknote size={16} className="text-white" />;
                    case "userCheck":
                      return <UserCheck size={16} className="text-white" />;
                    case "fileText":
                      return <FileText size={16} className="text-white" />;
                    default:
                      return <Bell size={16} className="text-white" />;
                  }
                };

                const getIconColor = () => {
                  switch (activity.iconColor) {
                    case "blue":
                      return "bg-gradient-to-br from-blue-500 to-blue-600";
                    case "green":
                      return "bg-gradient-to-br from-emerald-500 to-emerald-600";
                    case "purple":
                      return "bg-gradient-to-br from-purple-500 to-purple-600";
                    case "red":
                      return "bg-gradient-to-br from-red-500 to-red-600";
                    default:
                      return "bg-gradient-to-br from-gray-500 to-gray-600";
                  }
                };

                return (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 flex-shrink-0 group"
                  >
                    <div
                      className={`w-10 h-10 ${getIconColor()} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200`}
                    >
                      {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${typography.label()} mb-1`}>{activity.title}</p>
                      <p className={`${typography.caption()} line-clamp-2 mb-1`}>{activity.description}</p>
                      <p className={`${typography.tiny()} font-medium`}>{activity.timeAgo}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400 flex-shrink-0">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className={typography.label()}>No recent activities</p>
                <p className={`${typography.caption()} mt-1`}>Activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 20rem)', height: 'calc(100vh - 20rem)' }}
        >
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h3 className={typography.h3()}>Quick Actions</h3>
              <p className={`${typography.caption()} mt-1`}>Frequently used actions</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <LayoutGrid className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1 content-start">
            {/* Add ASM */}
            <button
              onClick={() => {
                navigate('/admin/add-asm-page');
              }}
              className="group cursor-pointer flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Users size={24} className="text-white" />
              </div>
              <span className={`${typography.label("text-blue-900")}`}>Add ASM</span>
              <span className={`${typography.caption("text-blue-600")} mt-1`}>Create new ASM</span>
            </button>

            {/* Add RM */}
            <button
              onClick={() => {
                navigate('/admin/add-rm-page');
              }}
              className="group cursor-pointer flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Users size={24} className="text-white" />
              </div>
              <span className={`${typography.label("text-indigo-900")}`}>Add RM</span>
              <span className={`${typography.caption("text-indigo-600")} mt-1`}>Create new RM</span>
            </button>

            {/* Add RSM */}
            <button
              onClick={() => {
                navigate('/admin/add-rsm-page');
              }}
              className="group cursor-pointer flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Users size={24} className="text-white" />
              </div>
              <span className={`${typography.label("text-emerald-900")}`}>Add RSM</span>
              <span className={`${typography.caption("text-emerald-600")} mt-1`}>Create new RSM</span>
            </button>
          </div>
        </div>
      </div>

      {/* 12-Month Performance Breakdown Modal */}
      {showBreakdownModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
          onClick={() => setShowBreakdownModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-50/70 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h2 className={typography.h3()}>
                    Monthly Performance Breakdown — Year {data?.filter?.yearForBreakdown || (year === "all" ? currentYear : year)}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    12 Months Comparison
                  </span>
                </div>
                <p className={`${typography.caption()} mt-1 text-gray-500`}>
                  Click any month below to instantly load and filter the entire dashboard by that month
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Modal Year Selector */}
                <div className="flex items-center gap-1.5">
                  <label htmlFor="modal-breakdown-year" className="text-xs font-medium text-gray-500">Year:</label>
                  <select
                    id="modal-breakdown-year"
                    value={year === "all" ? currentYear : year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    className="text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="overflow-y-auto overflow-x-auto p-5 max-h-[calc(90vh-140px)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-600">
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3">Disbursed Volume</th>
                    <th className="py-3 px-3 text-center">Disbursed Loans</th>
                    <th className="py-3 px-3">Partner Payouts</th>
                    <th className="py-3 px-3">Bonus Pool</th>
                    <th className="py-3 px-3 text-center">Active Partners</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {monthlyBreakdown.length > 0 ? (
                    monthlyBreakdown.map((mItem) => {
                      const isSelected =
                        month === mItem.month &&
                        (year === "all" || year === mItem.year);
                      const isCurrent =
                        mItem.month === currentMonth && mItem.year === currentYear;
                      const revBarPct = Math.min(
                        100,
                        Math.round((Number(mItem.revenue || 0) / maxMonthlyRevenue) * 100)
                      );

                      const handleSelect = () => {
                        setYear(mItem.year);
                        setMonth(mItem.month);
                        setShowBreakdownModal(false);
                      };

                      return (
                        <tr
                          key={`modal-month-row-${mItem.month}`}
                          className={`hover:bg-emerald-50/40 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50/70 font-semibold"
                              : isCurrent
                              ? "bg-slate-50/50"
                              : ""
                          }`}
                          onClick={handleSelect}
                        >
                          {/* Month Name */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isSelected ? "text-emerald-700" : "text-gray-900"}`}>
                                {mItem.monthName} {mItem.year}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-600 text-white">
                                  Active
                                </span>
                              )}
                              {isCurrent && !isSelected && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-gray-200 text-gray-700">
                                  Now
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Disbursed Volume */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="font-bold text-gray-900">
                                {formatCurrency(mItem.revenue || 0)}
                              </span>
                              {/* Mini volume indicator */}
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${revBarPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Disbursed Loans */}
                          <td className="py-3 px-3 whitespace-nowrap text-center font-medium text-gray-700">
                            {formatNumber(mItem.disbursedFiles || 0)}
                          </td>

                          {/* Partner Payouts */}
                          <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-medium">
                            {formatCurrency(mItem.payoutAmount || 0)}
                          </td>

                          {/* Bonus Pool */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`font-semibold ${mItem.bonusUnlocked > 0 ? "text-amber-700" : "text-gray-500"}`}>
                              {formatCurrency(mItem.bonusUnlocked || 0)}
                            </span>
                          </td>

                          {/* Active Partners */}
                          <td className="py-3 px-3 whitespace-nowrap text-center font-medium text-gray-700">
                            {formatNumber(mItem.activePartners || 0)}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect();
                              }}
                              className={`text-xs px-2.5 py-1 rounded font-semibold transition-all ${
                                isSelected
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-700"
                              }`}
                            >
                              {isSelected ? "Selected" : "Filter"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No monthly breakdown data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/60 flex-wrap gap-2">
              <span className="text-xs text-gray-500">
                Clicking any month or Filter selects that month and updates your dashboard.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectAllTime();
                    setShowBreakdownModal(false);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Clear Filter (All Time)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
