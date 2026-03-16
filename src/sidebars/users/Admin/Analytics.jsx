import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Users, IndianRupee, UserCheck, Banknote, TrendingUp } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAnalyticsdashboard } from "../../../feature/thunks/adminThunks";
import { getAuthData } from "../../../utils/localStorage";
import { designSystem, formatCurrency, formatNumber } from "../../../utils/designSystem";
import { parseAnalyticsData, getRoleMetrics } from "../../../utils/analyticsParser";
import MetricCard from "../../../components/shared/MetricCard";

const Analytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [userAnalyticsID, setUserAnalyticsID] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const Analyticsdashboard = useSelector((state) => state.admin?.Analyticsdashboard || { loading: false, error: null, data: null });

  // Extract ID from location state or query params
  const ID = useMemo(() => {
    // First try location state

    if (location?.state) {
      const incoming = location.state.id;

      if (typeof incoming === "string") {
        return incoming;
      }

      if (typeof incoming === "object" && incoming !== null) {
        return (
          incoming.ID ||
          incoming.employeeId ||
          incoming.asmEmployeeId ||
          incoming.query ||
          null
        );
      }
    }

    // Fallback to URL params
    const params = new URLSearchParams(location.search);
    return params.get("ID");
  }, [location]);

  // Update userAnalyticsID when ID changes
  useEffect(() => {
    if (ID) {
      setUserAnalyticsID(ID);
    }
  }, [ID]);

  // Fetch analytics data
  useEffect(() => {
    if (!ID) {
      setError("No ASM , RM ,  ID provided");
      return;
    }

    const { adminToken } = getAuthData();

    if (!adminToken) {
      setError("No admin token found");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        dispatch(fetchAnalyticsdashboard({ ID, token: adminToken }));
      } catch (err) {
        setError("Failed to fetch analytics data");
        console.error("Analytics fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ID, dispatch]);

  // Get role from location state
  const role = useMemo(() => {
    return location?.state?.role || "ASM";
  }, [location]);

  // Process analytics data using universal parser
  const analyticsData = useMemo(() => {
    const parsed = parseAnalyticsData(Analyticsdashboard?.data, role);
    
    return {
      totalRM: parsed.totals.totalRMs || parsed.totals.rms || 0,
      totalRSM: parsed.totals.totalRSMs || parsed.totals.rsms || 0,
      partner: parsed.totals.partners || 0,
      customerCount: parsed.totals.customers || 0,
      totalRevenue: parsed.assignedTarget.targetValue,
      totalDisburse: parsed.totalDisbursed,
      userName: parsed.profile.name,
      status: parsed.profile.status,
      phone: parsed.profile.phone,
      email: parsed.profile.email,
      employeeId: parsed.profile.employeeId,
      performance: parsed.performance,
      performancePercentage: parsed.performancePercentage,
      targetValue: parsed.assignedTarget.targetValue,
      role: parsed.profile.role || role,
    };
  }, [Analyticsdashboard, role]);

  // Navigate to RM page
  const handleNavigateToRM = useCallback(() => {
    if (userAnalyticsID) {
      navigate("/admin/RM", { state: userAnalyticsID });
    }
  }, [navigate, userAnalyticsID]);

  const handleNavigateToPartner = useCallback(() => {
    if (userAnalyticsID) {
      navigate("/admin/Partner", { state: userAnalyticsID });
    }
  }, [navigate, userAnalyticsID]);

  // Format currency helper
  const formatCurrencyHelper = useCallback((value) => {
    return formatCurrency(value);
  }, []);

  // Format number helper
  const formatNumberHelper = useCallback((value) => {
    return formatNumber(value);
  }, []);

  // Loading state
  if (isLoading || Analyticsdashboard?.loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#12B99C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || Analyticsdashboard?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: designSystem.colors.background }}>
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
          <div className="bg-red-100 text-red-600 w-16 h-16 flex items-center justify-center rounded-full text-4xl shadow-sm mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-6">{error || Analyticsdashboard?.error || "An unexpected error occurred"}</p>
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
        {/* User Info Card - Supports all roles */}
        <div className={`${designSystem.card.base} ${designSystem.card.padding} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 - Basic Info */}
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: designSystem.colors.text.primary }}>
              {analyticsData.userName}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={
                analyticsData.status === "ACTIVE"
                  ? designSystem.badge.active
                  : analyticsData.status === "SUSPENDED"
                  ? designSystem.badge.rejected
                  : designSystem.badge.inactive
              }>
                {analyticsData.status}
              </span>
              <span className={designSystem.badge.active}>
                {analyticsData.role}
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
                <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>{analyticsData.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>{analyticsData.email}</p>
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
                  {analyticsData.employeeId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards - Dynamic based on role - Using shared MetricCard component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Show RSM count for ASM role */}
        {analyticsData.role === "ASM" && analyticsData.totalRSM > 0 && (
          <MetricCard
            title="Total RSMs"
            value={formatNumberHelper(analyticsData.totalRSM)}
            icon={UserCheck}
            colorIndex={0}
            subtitle="Regional Sales Managers"
            onClick={handleNavigateToRM}
          />
        )}

        {/* Show RM count for ASM and RSM roles */}
        {(analyticsData.role === "ASM" || analyticsData.role === "RSM") && analyticsData.totalRM > 0 && (
          <MetricCard
            title="Total RMs"
            value={formatNumberHelper(analyticsData.totalRM)}
            icon={UserCheck}
            colorIndex={1}
            subtitle="Relationship Managers"
            onClick={analyticsData.role === "ASM" ? handleNavigateToRM : undefined}
          />
        )}

        {/* Show Partners for ASM, RSM, RM roles */}
        {analyticsData.role !== "PARTNER" && analyticsData.role !== "CUSTOMER" && (
          <MetricCard
            title="Total Partners"
            value={formatNumberHelper(analyticsData.partner)}
            icon={Users}
            colorIndex={2}
            subtitle="Active partners"
            onClick={analyticsData.role === "ASM" ? handleNavigateToPartner : undefined}
          />
        )}

        <MetricCard
          title="Total Customers"
          value={formatNumberHelper(analyticsData.customerCount)}
          icon={Users}
          colorIndex={3}
          subtitle="Customer base"
        />

        <MetricCard
          title="Target"
          value={formatCurrencyHelper(analyticsData.targetValue)}
          icon={TrendingUp}
          colorIndex={4}
          subtitle="Monthly target"
        />

        <MetricCard
          title="Total Disbursed"
          value={formatCurrencyHelper(analyticsData.totalDisburse)}
          icon={IndianRupee}
          colorIndex={5}
          subtitle="Disbursed amount"
        />
      </div>

      {/* Performance Section */}
      <div className={`${designSystem.card.base} ${designSystem.card.padding}`}>
        <h2 className="text-xl font-bold mb-6" style={{ color: designSystem.colors.text.primary }}>
          Performance
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium" style={{ color: designSystem.colors.text.primary }}>
              {new Date().getFullYear()} Performance
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              analyticsData.performancePercentage >= 100
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}>
              {Math.min(analyticsData.performancePercentage.toFixed(2), 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-sm mb-2" style={{ color: designSystem.colors.text.secondary }}>
            <span>Disbursed: {formatCurrencyHelper(analyticsData.totalDisburse)}</span>
            <span>Target: {formatCurrencyHelper(analyticsData.targetValue)}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analyticsData.performancePercentage >= 100
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-orange-500 to-orange-600"
              }`}
              style={{
                width: `${Math.min(analyticsData.performancePercentage, 100).toFixed(2)}%`,
              }}
              role="progressbar"
              aria-valuenow={Math.min(analyticsData.performancePercentage, 100)}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Performance: ${Math.min(analyticsData.performancePercentage, 100).toFixed(2)}%`}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Analytics;
