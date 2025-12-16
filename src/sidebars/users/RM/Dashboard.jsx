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
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { fetchDashboard } from "../../../feature/thunks/rmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import {backendurl} from "../../../feature/urldata"



const Dashboard = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.rm.dashboard);

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchDashboard, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Sample data
  const metrics = {
    partners: data?.activePartners ? data?.activePartners : "NA",
    customers: data?.avgRating ? data?.avgRating : "NA",
    leads: data?.totalPartners ? data?.totalPartners : "NA",
    revenue: data?.totalRevenu ? data?.totalRevenu : "NA"
  };

  const targetVsAchievement = useMemo(() => {
    return (data?.targets || [])?.map((item) => {
      const percentage =
        item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;

      return {
        month: item.month,
        target: item.target,
        achievement: item.achieved,
        percentage,
      };
    });
  }, [data?.targets]);

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

  const formatCurrency = (amount) => {
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
    switch (status.toLowerCase()) {
      case "disburse":
        return "text-green-700 bg-green-100 border-green-200";
      case "in process":
        return "text-blue-700 bg-blue-100 border-blue-200";
    }
  };

  const getPartnerStatusColor = (status) => {
    switch (status.toLowerCase()) {
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
                style={{ backgroundColor: "#12B99C" }} // primary color
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
                  backgroundColor: "#12B99C", // primary color
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
          <div
            className="cursor-pointer bg-white rounded-2xl p-6 transition-shadow shadow-md border border-gray-200"
            onClick={() => {
              navigate("/rm/partners");
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: "#12B99C" }}
              >
                <Users className="text-white" size={24} />
              </div>
           
            </div>
            <div>
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: "#111827" }}
              >
                {data?.totals?.activePartners}
              </p>
              <p className="text-sm font-medium text-gray-600">
                Active Partners
              </p>

              {/* <p className="text-xs text-gray-500 mt-1">3 new this month</p> */}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: "#F59E0B" }}
              >
                <UserCheck className=" text-white" size={24} />
              </div>
            
            </div>
            <div className="cursor-pointer"
              onClick={() => {
                navigate("/rm/customers");
              }}
            >
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: "#111827" }}
              >
                {data?.totals?.totalCustomers}
              </p>
              <p className="text-sm font-medium text-gray-600">
                Total Customers
              </p>
              {/* <p className="text-xs text-gray-500 mt-1">12 new acquisitions</p> */}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500">
                <TrendingUp className="text-white" size={24} />
              </div>
            
            </div>
            <div>
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: "#111827" }}
              >
                {data?.totals?.inProcessApplications}
              </p>
              <p className="text-sm font-medium text-gray-600">
                Active Pipeline
              </p>
              {/* <p className="text-xs text-gray-500 mt-1">
                ₹2.8Cr potential value
              </p> */}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: "#12B99C" }}
              >
                <IndianRupee className="text-white" size={24} />
              </div>
              <div className="text-right">
            
              </div>
            </div>
            <div>
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: "#111827" }}
              >
                {formatCurrency(data?.totals?.totalRevenue)}
              </p>
              <p className="text-sm font-medium text-gray-600">
                Revenue Generated
              </p>
              {/* <p className="text-xs text-gray-500 mt-1">
                95% of quarterly target
              </p> */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-5 ">

        <div className="space-y-4">
              {targetVsAchievement.map((item, index) => (

                <>

              { item.month == monthNames[currentDate.getMonth()] &&

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
                          else return "#12B99C"; // green
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
                          else return "#12B99C"; // green
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
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        customer.status
                      )}`}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "#12B99C" }}
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
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "#12B99C" }}
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
