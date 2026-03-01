import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Users, DollarSign, UserCheck, Banknote } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAnalyticsdashboard } from "../../../feature/thunks/adminThunks";
import { getAuthData } from "../../../utils/localStorage";

const Analytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [userAnalyticsID, setUserAnalyticsID] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { Analyticsdashboard } = useSelector((state) => state.admin);

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

  // Process analytics data with better error handling
  const analyticsData = useMemo(() => {
    if (!Analyticsdashboard?.data) {
      return {
        totalRM: 0,
        partner: 0,
        customerCount: 0,
        totalRevenue: 0,
        totalDisburse: 0,
        asmName: "ASM",
        status: "UNKNOWN",
        phone: "N/A",
        email: "N/A",
        employeeId: "N/A",
        asmCode: "N/A",
        performance: "0.00%",
        performancePercentage: 0,
        targetValue: 0,
      };
    }

    const { profile = {}, analytics = {} } = Analyticsdashboard.data;
    const totals = analytics.totals || {};

    const disbursed = Number(analytics.totalDisbursed) || 0;
    // Backend returns assignedTarget as a number; normalise and guard against NaN
    const targetValue = Number(analytics.assignedTarget);
    const safeTargetValue = Number.isFinite(targetValue) && targetValue > 0 ? targetValue : 0;

    // Calculate performance percentage safely to avoid NaN/Infinity
    const performancePercentage =
      safeTargetValue > 0 ? (disbursed / safeTargetValue) * 100 : 0;
    const performance = `${performancePercentage.toFixed(2)}%`;

    return {
      totalRM: totals.rms ?? 0,
      partner: totals.partners ?? 0,
      customerCount: totals.customers ?? 0,
      totalRevenue: safeTargetValue,
      totalDisburse: disbursed,
      asmName: profile.name || "ASM",
      status: profile.status || "UNKNOWN",
      phone: profile.phone || "N/A",
      email: profile.email || "N/A",
      employeeId: profile.employeeId || "N/A",
      asmCode: profile.asmCode || "N/A",
      performance: analytics.performance || performance,
      performancePercentage,
      targetValue: safeTargetValue,
    };
  }, [Analyticsdashboard]);

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

  // Format currency values
  const formatCurrency = useCallback((value) => {
    if (typeof value !== "number") return "0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Format number with commas
  const formatNumber = useCallback((value) => {
    if (typeof value !== "number") return "0";
    return new Intl.NumberFormat("en-IN").format(value);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-slate-600">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-slate-200 text-center animate-fade-in">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 text-red-600 w-16 h-16 flex items-center justify-center rounded-full text-4xl shadow-sm">
              ⚠️
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Oops! Something went wrong
          </h2>

          {/* Message */}
          <p className="text-slate-600 mb-6 leading-relaxed">
            {error || "An unexpected error occurred. Please try again."}
          </p>

          {/* Retry Button */}
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-transform shadow-md"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-2">
      {/* ASM Info Card */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 - Basic Info */}
          <div>
            <h3 className="text-xl font-semibold mb-1 text-[#111827]">
              {analyticsData.asmName}
            </h3>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                analyticsData.status === "SUSPENDED"
                  ? "bg-red-50 text-red-600"
                  : analyticsData.status === "ACTIVE"
                  ? "bg-[#12B99C]/20 text-[#12B99C]" // Primary color for active status
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {analyticsData.status}
            </span>
          </div>

          {/* Column 2 - Contact Information */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E3A8A] mb-2">
              Contact Information
            </h4>
            <div className="space-y-1">
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-[#111827]">{analyticsData.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-[#111827]">{analyticsData.email}</p>
              </div>
            </div>
          </div>

          {/* Column 3 - System Information */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E3A8A] mb-2">
              System Information
            </h4>
            <div className="space-y-1">
              <div>
                <p className="text-xs text-gray-500">Employee ID</p>
                <p className="text-sm text-[#111827]">
                  {analyticsData.employeeId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {location.state.role == "ASM" && (
          <MetricCard
            title="Total RM"
            value={formatNumber(analyticsData.totalRM)}
            icon={<UserCheck className="w-5 h-5 text-white" />}
            color="bg-teal-500"
            onClick={handleNavigateToRM}
            isClickable={true}
            ariaLabel={`${analyticsData.totalRM} relationship managers`}
          />
        )}

        {location.state.role !== "Partner" && (
          <MetricCard
            title="Total Partners"
            value={formatNumber(analyticsData.partner)}
            icon={<Users className="w-5 h-5 text-white" />}
            color="bg-blue-800"
            onClick={handleNavigateToPartner}
            ariaLabel={`${analyticsData.partner} partners`}
          />
        )}

        <MetricCard
          title="Total Customers"
          value={formatNumber(analyticsData.customerCount)}
          icon={<Users className="w-5 h-5 text-white" />}
          color="bg-amber-500"
          ariaLabel={`${analyticsData.customerCount} customers`}
        />

        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analyticsData.totalRevenue)}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="bg-green-600"
          ariaLabel={`Revenue of ${formatCurrency(analyticsData.totalRevenue)}`}
        />

        <MetricCard
          title="Total Disbursed"
          value={formatCurrency(analyticsData.totalDisburse)}
          icon={<Banknote className="w-5 h-5 text-white" />}
          color="bg-purple-600"
          ariaLabel={`Disbursed amount of ${formatCurrency(
            analyticsData.totalDisburse
          )}`}
        />
      </div>

      {/* Performance Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-slate-700 mb-6">Performance</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-medium">
              {new Date().getFullYear()} Performance
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                analyticsData.targetValue > 0 &&
                analyticsData.totalDisburse / analyticsData.targetValue >= 1
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {Math.min(
                analyticsData.performancePercentage.toFixed(1),
                100
              )}
              %
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>
              Disbursed: {formatCurrency(analyticsData.totalDisburse)}
            </span>
            <span>Target: {formatCurrency(analyticsData.targetValue)}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(
                  analyticsData.performancePercentage,
                  100
                ).toFixed(2)}%`,
              }}
              role="progressbar"
              aria-valuenow={Math.min(
                analyticsData.performancePercentage,
                100
              ).toFixed(2)}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Performance: ${Math.min(
                analyticsData.performancePercentage,
                100
              ).toFixed(2)}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced MetricCard component
const MetricCard = ({
  title,
  value,
  icon,
  color,
  onClick,
  isClickable = false,
  ariaLabel,
}) => {
  const cardClasses = `
    bg-white p-6 rounded-lg shadow-md transition-all duration-200
    ${
      isClickable
        ? "hover:shadow-lg hover:scale-[1.02] cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
        : "hover:shadow-lg"
    }
  `;

  const CardContent = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-600 font-medium text-sm">{title}</h3>
        <div
          className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center shadow-sm`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </>
  );

  if (isClickable && onClick) {
    return (
      <button
        className={cardClasses}
        onClick={onClick}
        aria-label={ariaLabel || `View details for ${title}: ${value}`}
        type="button"
      >
        <CardContent />
      </button>
    );
  }

  return (
    <div className={cardClasses} aria-label={ariaLabel}>
      <CardContent />
    </div>
  );
};

export default Analytics;
