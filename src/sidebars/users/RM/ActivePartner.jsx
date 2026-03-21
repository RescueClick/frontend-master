import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Star,
  TrendingUp,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Target,
  Activity,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Building2,
  Handshake,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";

const ActivePartner = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Sample partner data
  const partners = [
    {
      id: 1,
      name: "Alpha Financial Services",
      logo: "AF",
      type: "Credit Partner",
      tier: "Platinum",
      rating: 4.9,
      location: "Mumbai, Maharashtra",
      joinDate: "2022-01-15",
      status: "Active",
      dealsClosedThisMonth: 24,
      revenueGenerated: 2400000,
      avgDealSize: 100000,
      successRate: 92,
      lastActivity: "2 hours ago",
      specialization: ["Personal Loans", "Business Loans", "Mortgage"],
      contactPerson: "Rajesh Sharma",
      contactEmail: "rajesh@alpha.com",
      contactPhone: "+91 98765 43210",
      performance: { trend: "up", change: "+15%" },
    },
    {
      id: 2,
      name: "Beta Investment Group",
      logo: "BIG",
      type: "Investment Partner",
      tier: "Gold",
      rating: 4.7,
      location: "Delhi, NCR",
      joinDate: "2022-03-20",
      status: "Active",
      dealsClosedThisMonth: 18,
      revenueGenerated: 1800000,
      avgDealSize: 150000,
      successRate: 88,
      lastActivity: "5 hours ago",
      specialization: ["Mutual Funds", "Insurance", "Wealth Management"],
      contactPerson: "Priya Patel",
      contactEmail: "priya@beta.com",
      contactPhone: "+91 87654 32109",
      performance: { trend: "up", change: "+8%" },
    },
    {
      id: 3,
      name: "Gamma Credit Solutions",
      logo: "GCS",
      type: "Credit Partner",
      tier: "Silver",
      rating: 4.5,
      location: "Bangalore, Karnataka",
      joinDate: "2022-06-10",
      status: "Active",
      dealsClosedThisMonth: 12,
      revenueGenerated: 1200000,
      avgDealSize: 80000,
      successRate: 85,
      lastActivity: "1 day ago",
      specialization: ["SME Loans", "Working Capital", "Equipment Finance"],
      contactPerson: "Amit Kumar",
      contactEmail: "amit@gamma.com",
      contactPhone: "+91 76543 21098",
      performance: { trend: "down", change: "-3%" },
    },
    {
      id: 4,
      name: "Delta Insurance Brokers",
      logo: "DIB",
      type: "Insurance Partner",
      tier: "Gold",
      rating: 4.6,
      location: "Chennai, Tamil Nadu",
      joinDate: "2021-11-05",
      status: "Active",
      dealsClosedThisMonth: 15,
      revenueGenerated: 1500000,
      avgDealSize: 50000,
      successRate: 90,
      lastActivity: "3 days ago",
      specialization: [
        "Life Insurance",
        "Health Insurance",
        "General Insurance",
      ],
      contactPerson: "Sneha Reddy",
      contactEmail: "sneha@delta.com",
      contactPhone: "+91 65432 10987",
      performance: { trend: "stable", change: "+2%" },
    },
  ];

  const partnerStats = {
    totalPartners: 48,
    activePartners: 42,
    newThisMonth: 6,
    totalRevenue: 12500000,
    avgPartnerRating: 4.7,
    topPerformer: "Alpha Financial Services",
  };

  const recentActivities = [
    {
      partner: "Alpha Financial Services",
      action: "Closed deal worth ₹2,50,000",
      time: "2 hours ago",
      type: "success",
    },
    {
      partner: "Beta Investment Group",
      action: "New lead assigned",
      time: "4 hours ago",
      type: "info",
    },
    {
      partner: "Gamma Credit Solutions",
      action: "Document verification pending",
      time: "1 day ago",
      type: "warning",
    },
    {
      partner: "Delta Insurance Brokers",
      action: "Monthly review completed",
      time: "2 days ago",
      type: "success",
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-700 bg-green-100 border-green-200";
      case "inactive":
        return "text-red-700 bg-red-100 border-red-200";
      case "under review":
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "suspended":
        return "text-red-700 bg-red-100 border-red-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      partner.type.toLowerCase().includes(selectedFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Partner List */}
          <div className="lg:col-span-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "#111827" }}
                  >
                    Active Partners
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Search partners..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                
                  </div>
                </div>
              </div>

              {/* Partner Cards */}

              <div className="p-4 space-y-4">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="p-4 shadow-md border border-gray-200 rounded-xl hover:shadow-lg transition-shadow bg-white"
                  >
                    {/* Top Section */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      {/* Left: Logo + Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {partner.logo}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">
                            {partner.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {partner.type}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                                partner.status
                              )}`}
                            >
                              {partner.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stats */}
                      <div className="grid grid-cols-2 lg:flex lg:space-x-6 gap-3 lg:gap-12 w-full lg:w-auto">
                        {/* Deals */}
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">
                            {partner.dealsClosedThisMonth}
                          </p>
                          <p className="text-xs text-gray-600">Deals</p>
                        </div>

                        {/* Revenue */}
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(partner.revenueGenerated)}
                          </p>
                          <p className="text-xs text-gray-600">Revenue</p>
                        </div>

                        {/* Success */}
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-600">
                            {partner.successRate}%
                          </p>
                          <p className="text-xs text-gray-600">Success</p>
                        </div>

                        {/* Performance */}
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <p
                              className="text-lg font-bold"
                              style={{
                                color:
                                  partner.performance.trend === "up"
                                    ? "#16A34A" // green-600
                                    : partner.performance.trend === "down"
                                    ? "#DC2626" // red-600
                                    : "#F59E0B", // amber-500
                              }}
                            >
                              {partner.performance.change}
                            </p>
                            {partner.performance.trend === "up" ? (
                              <ArrowUp className="text-green-600" size={14} />
                            ) : partner.performance.trend === "down" ? (
                              <ArrowDown className="text-red-600" size={14} />
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-600">Performance</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-4 gap-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="text-gray-400" size={14} />
                        <span>{partner.location}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center space-x-1 px-2 py-1 border border-gray-300 rounded-lg bg-gray-50">
                          <Phone size={14} className="text-gray-500" />
                          <span>{partner.contactPhone}</span>
                        </div>

                        <a
                          href={`mailto:${partner.contactEmail}`}
                          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <Mail size={14} className="mr-1" />
                          Email
                        </a>

                        <button
                          className="px-3 py-1 text-white rounded-lg hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: "var(--color-brand-primary)" }}
                        >
                          View Details
                        </button>

                        <button
                          className="px-3 py-1 text-white rounded-lg hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: "var(--color-brand-primary)" }}
                        >
                          Show Customers
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performer */}
          {/* <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "#111827" }}
                  >
                    Top Performance
                  </h3>
                  <p className="text-sm text-gray-600">
                    Active leads requiring attention
                  </p>
                </div>
                <Calendar className="text-gray-400" size={20} />
              </div>
              <div className="space-y-4">
                {leadsData.map((lead, index) => (
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
                          <p className="text-xs text-gray-500">
                            {lead.company}
                          </p>
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
                          style={{ color: "var(--color-brand-primary)" }}
                        >
                          {lead.value}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                          <Phone size={12} className="inline mr-1" />
                          Call
                        </button>
                        <button className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                          <Mail size={12} className="inline mr-1" />
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

         
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ActivePartner;

