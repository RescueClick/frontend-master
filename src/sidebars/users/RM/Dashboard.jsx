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
  Search,
  Download,
  FileText,
  Target,
  Activity,
  CheckCircle,
  IndianRupee,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { fetchDashboard } from "../../../feature/thunks/rmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import {backendurl} from "../../../feature/urldata"
import MetricCard from "../../../components/shared/MetricCard";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import EntityStatusBadge from "../../../components/shared/EntityStatusBadge";
import toast from "react-hot-toast";
import { downloadXlsx } from "../../../utils/downloadXlsx";



const Dashboard = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const openPartnerAnalytics = useCallback((p) => {
    if (!p?.id) return;
    navigate("/rm/analytics", {
      state: {
        id: p.id,
        role: "RM",
        name: p.name || "",
        detail: "Partner",
      },
    });
  }, [navigate]);

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.rm.dashboard);

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchDashboard, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  const metricCards = useMemo(
    () => [
      {
        title: "Active Partners",
        value: data?.totals?.activePartners ?? 0,
        icon: Users,
        onClick: () => navigate("/rm/partners"),
        subtitle: "Partners under you",
      },
      {
        title: "Total Customers",
        value: data?.totals?.totalCustomers ?? 0,
        icon: UserCheck,
        onClick: () => navigate("/rm/customers"),
        subtitle: "Customer base",
      },
      {
        title: "Active Pipeline",
        value: data?.totals?.inProcessApplications ?? 0,
        icon: TrendingUp,
        onClick: () => navigate("/rm/Rm-Application"),
        subtitle: "In-process applications",
      },
      {
        title: "Total Disbursed",
        value: formatCurrency(data?.totals?.totalRevenue ?? 0),
        icon: IndianRupee,
        onClick: () => navigate("/rm/Revenue-generated"),
        subtitle: "Disbursed amount",
      },
    ],
    [data?.totals, navigate]
  );

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

  const topCustomers = [
    {
      name: "Acme Corporation",
      value: "₹45,00,000",
      status: "Disburse",
      growth: "+12%",
      type: "Enterprise",
    },
    {
      name: "Tech Solutions Ltd",
      value: "₹38,50,000",
      status: "Disburse",
      growth: "+8%",
      type: "Corporate",
    },
    {
      name: "Global Industries",
      value: "₹32,00,000",
      status: "Disburse",
      growth: "+15%",
      type: "Enterprise",
    },
    {
      name: "Smart Enterprises",
      value: "₹28,75,000",
      status: "Disburse",
      growth: "+5%",
      type: "SME",
    },
  ];

  const topPartners = [
    {
      name: "Alpha Banking Solutions",
      deals: 12,
      value: "₹2,40,00,000",
      rating: 4.8,
      status: "Premium",
    },
    {
      name: "Beta Finance Group",
      deals: 8,
      value: "₹1,80,00,000",
      rating: 4.5,
      status: "Gold",
    },
    {
      name: "Gamma Capital Partners",
      deals: 15,
      value: "₹3,20,00,000",
      rating: 4.9,
      status: "Premium",
    },
    {
      name: "Delta Holdings Inc",
      deals: 6,
      value: "₹1,50,00,000",
      rating: 4.2,
      status: "Silver",
    },
  ];

  const leadsData = [
    {
      name: "Rajesh Kumar",
      company: "Kumar Industries Pvt Ltd",
      status: "In Process",
      date: "2024-08-22",
      value: "₹12,50,000",
      stage: "Qualified",
    },
    {
      name: "Priya Sharma",
      company: "Sharma Textiles Group",
      status: "In Process",
      date: "2024-08-23",
      value: "₹8,75,000",
      stage: "Negotiation",
    },
    {
      name: "Amit Patel",
      company: "Patel Constructions Ltd",
      status: "In Process",
      date: "2024-08-21",
      value: "₹15,20,000",
      stage: "Initial Contact",
    },
    {
      name: "Sneha Reddy",
      company: "Reddy Electronics Corp",
      status: "In Process",
      date: "2024-08-24",
      value: "₹6,30,000",
      stage: "Qualification",
    },
  ];

  const alerts = [
    {
      type: "KYC Verification",
      message: "KYC pending for 3 high-value customers",
      count: 3,
      urgent: true,
      action: "Review Documents",
    },
    {
      type: "Document Review",
      message: "Credit documents require approval",
      count: 5,
      urgent: false,
      action: "Approve/Reject",
    },
    {
      type: "Credit Review",
      message: "Monthly compliance review due",
      count: 2,
      urgent: true,
      action: "Schedule Review",
    },
  ];

  const recentActivities = [
    {
      action: "New customer onboarded",
      customer: "Tech Innovations Ltd",
      time: "2 hours ago",
      value: "₹25,00,000",
    },
    {
      action: "Loan approved",
      customer: "Global Manufacturing",
      time: "4 hours ago",
      value: "₹1,20,00,000",
    },
    {
      action: "Partnership renewed",
      customer: "Alpha Finance",
      time: "1 day ago",
      value: "₹50,00,000",
    },
  ];

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [partnerSnapshotQuery, setPartnerSnapshotQuery] = useState("");

  function formatCurrency(amount) {
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
  }
  

  const currentDate = new Date();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredPartnerSnapshot = useMemo(() => {
    const rows = data?.partnerPayoutSummary || [];
    const term = partnerSnapshotQuery.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const status = (p.status || "").toString().toLowerCase();
      return name.includes(term) || status.includes(term);
    });
  }, [data?.partnerPayoutSummary, partnerSnapshotQuery]);

  const exportPartnerSnapshot = useCallback(() => {
    const rows = filteredPartnerSnapshot.map((p) => ({
      Partner: p.name || "",
      Status: p.status || "",
      "Deals (month)": p.dealsThisMonth ?? 0,
      Disbursed: p.totalDisbursed ?? 0,
      Payout: p.totalPayout ?? 0,
    }));
    if (!downloadXlsx(rows, "rm-dashboard-partners.xlsx", "Partners")) {
      toast.error("No rows to export");
    }
  }, [filteredPartnerSnapshot]);

  const partnerSnapshotColumns = [
    {
      title: "Partner",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, p) => <EntityStatusBadge status={p.status} />,
    },
    {
      title: "Deals (month)",
      dataIndex: "dealsThisMonth",
      key: "deals",
      render: (v) => v ?? 0,
    },
    {
      title: "Disbursed",
      key: "disbursed",
      render: (_, p) => (
        <span className="font-semibold text-emerald-700">
          {formatCurrency(p.totalDisbursed || 0)}
        </span>
      ),
    },
    {
      title: "Payout",
      key: "payout",
      render: (_, p) => (
        <span className="font-semibold text-violet-700">
          {formatCurrency(p.totalPayout || 0)}
        </span>
      ),
    },
    {
      title: "Analytics",
      key: "view",
      align: "right",
      render: (_, p) => (
        <button
          type="button"
          onClick={() => openPartnerAnalytics(p)}
          className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
        >
          Analytics
        </button>
      ),
    },
  ];

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
                <span className="text-white font-bold text-xl">RM</span>
              </div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: "#111827" }}
              >
                Rahul Mehta
              </h2>
              <p className="text-sm mb-2" style={{ color: "#111827" }}>
                Relationship Manager
              </p>
              <p className="text-sm" style={{ color: "#111827" }}>
                Email: rm@example.com
              </p>
              <p className="text-sm" style={{ color: "#111827" }}>
                Phone: +91 98765 43210
              </p>

              <button
                className="mt-4 w-full py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "var(--color-brand-primary)", // primary color
                  color: "white",
                }}
                onClick={() => alert("Edit profile clicked")}
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
              colorIndex={idx}
              isLoading={loading}
            />
          ))}
        </div>

        {data?.partnerPayoutSummary?.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Partner snapshot
                </h3>
                <p className="text-sm text-gray-500">
                  Disbursement and completed payout by partner (top {data.partnerPayoutSummary.length})
                  {partnerSnapshotQuery.trim()
                    ? ` — showing ${filteredPartnerSnapshot.length} match${filteredPartnerSnapshot.length !== 1 ? "es" : ""}`
                    : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/rm/partners")}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                View partner list
              </button>
            </div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={partnerSnapshotQuery}
                  onChange={(e) => setPartnerSnapshotQuery(e.target.value)}
                  placeholder="Search partner or status..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              <button
                type="button"
                onClick={exportPartnerSnapshot}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
              >
                <Download size={16} />
                Export
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white p-2">
              <AppAntTable
                rowKey={(row) => String(row.id ?? row.name)}
                columns={partnerSnapshotColumns}
                dataSource={filteredPartnerSnapshot}
                size="small"
                scroll={{ x: 640 }}
                pagination={false}
                compact
              />
            </div>
          </div>
        ) : null}

        {/* Current Month Target - RM focuses on Disbursement (Business Metric) */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Month Target</h3>
            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">Revenue Target</span>
          </div>
          <div className="space-y-3">
            {/* Disbursement Target - Primary Metric for RM */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Disbursement Target</span>
                    <span className="text-xs text-gray-600">Sum of all Partner targets under you</span>
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

   

              {targetVsAchievement.map((item, index) => (

         <>

         {item.target!= 0 &&

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
                          className={`text-xs px-2 py-1 rounded-full ${item.percentage >= 100
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
                        width: `${Math.min((item.achievement / item.target) * 100, 100)}%`,
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


         }


         </>

           

              ))}
            </div>

          </div>
          <div className="bg-white rounded-2xl p-6 lg:col-span-1 border shadow-md border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#111827" }}
                >
                  High-Value Customers
                </h3>
                <p className="text-sm text-gray-600">
                  Top performing client relationships
                </p>
              </div>
              <PieChart className="text-gray-400" size={20} />
            </div>
            <div className="space-y-4">
              {data?.highValueCustomers?.map((customer, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "#111827" }}
                        >
                          {customer.name}
                        </p>
                      </div>
                    </div>
                    <LoanStatusBadge status={customer.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--color-brand-primary)" }}
                      >
                        ₹{customer.maxLoan.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#111827" }}
                >
                  Sales Pipeline
                </h3>
                <p className="text-sm text-gray-600">
                  Active leads requiring attention
                </p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
            <div className="space-y-4">
              {data?.salesPipeline.map((lead, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {lead.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "#111827" }}
                        >
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-500">{lead.company}</p>
                        <p className="text-xs text-gray-400">{lead.stage}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LoanStatusBadge status={lead.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--color-brand-primary)" }}
                      >
                        {lead.maxLoan}
                      </p>
                      {/* <span className="text-xs text-gray-400">
                        Due: {lead.date}
                      </span> */}
                    </div>
                    <div className="flex space-x-2">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-gray-500 hover:text-gray-500 text-sm transition-colors"
                          >
                            {lead.phone}
                          </a>
                        </div>
                      </div>
                      <a
                        href="mailto:someone@example.com"
                        className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors inline-flex items-center"
                      >
                        <Mail size={12} className="inline mr-1" />
                        Email
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
