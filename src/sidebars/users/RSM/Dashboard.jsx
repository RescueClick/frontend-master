import { useEffect, useState, useMemo, useCallback } from "react";
import {
  User,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  UserCheck,
  TrendingUp,
  DollarSign,
  Bell,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Target,
  Activity,
  CheckCircle,
  IndianRupee,
  Building2,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { fetchRsmDashboard } from "../../../feature/thunks/rsmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import MetricCard from "../../../components/shared/MetricCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.rsm?.dashboard || { data: null, loading: false, error: null });

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchRsmDashboard, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  const targetVsAchievement = useMemo(() => {
    return (data?.targets || [])?.map((item) => {
      const target = item.disbursementTarget || item.target || 0;
      const achievement = item.achieved || 0;
      const fileCountTarget = item.fileCountTarget || 0;
      const achievedFileCount = item.achievedFileCount || 0;
      const percentage =
        target > 0 ? Math.round((achievement / target) * 100) : 0;
      const filePercentage =
        fileCountTarget > 0 ? Math.round((achievedFileCount / fileCountTarget) * 100) : 0;

      return {
        month: item.month,
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

  const [showProfileModal, setShowProfileModal] = useState(false);

  const formatCurrency = (amount) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) {
      // 1 Crore = 1 Cr = 10000000
      return `₹ ${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 Lakh = 1 L = 100000
      return `₹ ${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 Thousand = 1 K = 1000
      return `₹ ${(amount / 1000).toFixed(1)}K`;
    } else {
      // For amounts less than 1K
      return `₹ ${amount}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "disburse":
      case "disbursed":
        return "text-green-700 bg-green-100 border-green-200";
      case "in process":
      case "under review":
        return "text-blue-700 bg-blue-100 border-blue-200";
      case "approved":
        return "text-purple-700 bg-purple-100 border-purple-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getPartnerStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "premium":
        return "text-purple-700 bg-purple-100 border-purple-200";
      case "gold":
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "silver":
        return "text-gray-700 bg-gray-100 border-gray-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const currentDate = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get RSM user data for profile modal
  const { rsmUser } = getAuthData();

  const metricCards = useMemo(
    () => [
      {
        title: "Relationship Managers",
        value: data?.totals?.totalRMs || 0,
        icon: Users,
        onClick: () => navigate("/rsm/rms"),
        subtitle: "Under your management",
        colorIndex: 0,
      },
      {
        title: "Active Partners",
        value: data?.totals?.activePartners || 0,
        icon: Building2,
        onClick: () => navigate("/rsm/partners"),
        subtitle: "Active partners",
        colorIndex: 1,
      },
      {
        title: "Total Customers",
        value: data?.totals?.totalCustomers || 0,
        icon: UserCheck,
        onClick: () => navigate("/rsm/customers"),
        subtitle: "Customer base",
        colorIndex: 2,
      },
      {
        title: "Total Disbursed",
        value: formatCurrency(data?.totals?.totalRevenue),
        icon: IndianRupee,
        subtitle: "Disbursed amount",
        colorIndex: 3,
      },
    ],
    [data?.totals, navigate]
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* modal start */}
      {showProfileModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }} // semi-transparent overlay
        >
          <div
            className="rounded-xl p-6 w-80 relative shadow-lg"
            style={{ backgroundColor: "#F8FAFC" }} // background color
          >
            {/* Close Button */}
            <button
              className=" absolute top-2 right-2 font-bold"
              style={{ color: "#111827" }}
              onClick={() => setShowProfileModal(false)}
            >
              ✕
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--color-brand-primary)" }} // primary color
              >
                <span className="text-white font-bold text-xl">RSM</span>
              </div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: "#111827" }}
              >
                {rsmUser?.firstName} {rsmUser?.lastName}
              </h2>
              <p className="text-sm mb-2" style={{ color: "#111827" }}>
                Regional Sales Manager
              </p>
              <p className="text-sm" style={{ color: "#111827" }}>
                Email: {rsmUser?.email || "N/A"}
              </p>
              <p className="text-sm" style={{ color: "#111827" }}>
                Phone: {rsmUser?.phone || "N/A"}
              </p>

              <button
                className="mt-4 w-full py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "var(--color-brand-primary)", // primary color
                  color: "white",
                }}
                onClick={() => navigate("/rsm/settings")}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
      {/* modal end */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((m, idx) => (
            <MetricCard
              key={m.title}
              title={m.title}
              value={m.value}
              icon={m.icon}
              subtitle={m.subtitle}
              onClick={m.onClick}
              colorIndex={m.colorIndex ?? idx}
              isLoading={loading}
            />
          ))}
        </div>

        {/* Current Month Target - RSM focuses on Disbursement (Business Metric) */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Month Target</h3>
            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">Revenue Target</span>
          </div>
          <div className="space-y-3">
            {/* Disbursement Target - Primary Metric for RSM */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Disbursement Target</span>
                    <span className="text-xs text-gray-600">Sum of all RM targets under you</span>
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
                <span className="text-2xl font-bold text-gray-900">
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

        {/* Performance & Analysis Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Analytics */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#111827" }}
                >
                  Performance Analytics
                </h3>
                <p className="text-sm text-gray-600">
                  Monthly target vs achievement comparison
                </p>
              </div>
              <BarChart3 className="text-gray-400" size={20} />
            </div>

            <div className="space-y-4">
              {targetVsAchievement
                .filter((item) => item.target != 0)
                .map((item, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 w-8">
                          {item.month}
                        </span>
                        <div className="flex items-center space-x-2 ml-7">
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
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#111827" }}
                      >
                        {item.achievement}K / {item.target}K
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
                          backgroundColor: (() => {
                            const percent = (item.achievement / item.target) * 100;
                            if (percent < 50) return "#EF4444"; // red
                            else if (percent < 90) return "#F59E0B"; // yellow
                            else return "var(--color-brand-primary)"; // green
                          })(),
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              {targetVsAchievement.filter((item) => item.target != 0).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No target data available
                </div>
              )}
            </div>
          </div>

          {/* Top Performing RMs */}
          <div className="bg-white rounded-2xl p-6 lg:col-span-1 border shadow-md border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#111827" }}
                >
                  Top Performing RMs
                </h3>
                <p className="text-sm text-gray-600">
                  Best performing relationship managers
                </p>
              </div>
              <PieChart className="text-gray-400" size={20} />
            </div>
            <div className="space-y-4">
              {data?.topPerformers?.length > 0 ? (
                data.topPerformers.map((rm, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/rsm/rms`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "#111827" }}
                          >
                            {rm.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rm.totalDisbursedApps || 0} loans disbursed
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          "disbursed"
                        )}`}
                      >
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <p
                          className="text-sm font-bold"
                          style={{ color: "var(--color-brand-primary)" }}
                        >
                          ₹{rm.totalRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No performance data yet
                </div>
              )}
            </div>
          </div>

          {/* Application Pipeline */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#111827" }}
                >
                  Application Pipeline
                </h3>
                <p className="text-sm text-gray-600">
                  Active applications requiring attention
                </p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
            <div className="space-y-4">
              {data?.recentApplications?.length > 0 ? (
                data.recentApplications.slice(0, 4).map((app, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate("/rsm/applications")}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {app.customerName?.charAt(0) || "A"}
                          </span>
                        </div>
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "#111827" }}
                          >
                            {app.customerName || "Customer"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {app.appNo || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {app.loanType || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {app.status || "Pending"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <p
                          className="text-sm font-bold"
                          style={{ color: "var(--color-brand-primary)" }}
                        >
                          ₹{app.loanAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`tel:${app.phone || ""}`}
                          className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors inline-flex items-center"
                        >
                          <Phone size={12} className="inline mr-1" />
                          Call
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Fallback: Show application status counts */}
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        In Process
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          "in process"
                        )}`}
                      >
                        {data?.totals?.inProcessApplications || 0}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Disbursed
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          "disbursed"
                        )}`}
                      >
                        {data?.totals?.disbursedApplications || 0}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Rejected
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full border text-red-700 bg-red-100 border-red-200">
                        {data?.totals?.rejectedApplications || 0}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Pending
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full border text-gray-700 bg-gray-100 border-gray-200">
                        {data?.totals?.pendingApplications || 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
