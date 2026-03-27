import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";


import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  Calendar,
  X,
  DollarSign,
  Percent,
  Calculator,
  User,
  FileText,
  Download,
  Clock,
  AlertCircle,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";
import MetricCard from "../../../components/shared/MetricCard";
import { formatCurrency } from "../../../utils/designSystem";

const formatCurrencyFull = (amount) => {
  const value = Number(amount || 0);
  return `₹ ${value.toLocaleString("en-IN")}`;
};

const formatLoanTypeLabel = (loanType) => {
  if (!loanType) return "Personal Loan";
  return loanType
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};


const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",

    month: "short",

    day: "numeric",

    hour: "2-digit",

    minute: "2-digit",
  });
};

// ✅ Put this OUTSIDE the component, reuse everywhere

const getStatusColor = (status) => {


  switch (status?.toLowerCase()) {
    case "kyc_pending":
      return "bg-orange-100 text-orange-800 border border-orange-200";

    case "DOC_COMPLETE":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";

    case "under_review":
      return "bg-indigo-100 text-indigo-800 border border-indigo-200";

    case "in_process":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";

    case "submitted":
      return "bg-blue-100 text-blue-800 border border-blue-200";

    case "approved":
      return "bg-green-100 text-green-800 border border-green-200";

    case "agreement":
      return "bg-cyan-100 text-cyan-800 border border-cyan-200";

    case "disbursed":

    case "disburse":
      return "bg-purple-100 text-purple-800 border border-purple-200";

    case "rejected":
      return "bg-red-100 text-red-800 border border-red-200";

    case "pending":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";

    case "active":
      return "bg-green-100 text-green-800 border border-green-200";

    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
};

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("all");

  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [commissionPercentage, setCommissionPercentage] = useState("");

  // API state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [loanTypeOpen, setLoanTypeOpen] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;


  const location = useLocation();
  const { id } = location.state || {};


  useEffect(() => {
    setSearchTerm(id);
  }, [id]);

  const navigate = useNavigate();

  // Fetch customers data from API
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/rm/customers`, {
        headers: {
          Authorization: `Bearer ${rmToken}`,
        },
      });


      setCustomers(response.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch customers"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // ✅ When navigated with partnerName, set it in search bar

  useEffect(() => {
    if (location.state?.partnerName) {
      setSearchTerm(location.state.partnerName);
    }
  }, [location.state]);

  const filteredCustomers = customers?.filter((customer) => {

    const searchTermLower = searchTerm?.toLowerCase() || "";
    const selectedFilterLower = selectedFilter?.toLowerCase() || "all";
    const selectedLoanTypeLower = selectedLoanType?.toLowerCase() || "all";



    ("customer : ", customer);


    // ✅ Match correct fields from API response
    const matchesSearch =
      customer.customerName?.toLowerCase().includes(searchTermLower) ||

      customer.customerEmployeeId?.toLowerCase().includes(searchTermLower) ||
      customer.email?.toLowerCase().includes(searchTermLower) ||
      customer.contact?.toLowerCase().includes(searchTermLower) ||
      customer.customerId?.toLowerCase().includes(searchTermLower) ||
      customer.partner?.partnerId?.toLowerCase().includes(searchTermLower);




    // ✅ Status match (normalize DRAFT to SUBMITTED, case-insensitive)
    const customerStatus = customer.status?.toUpperCase();
    const normalizedStatus = customerStatus === "DRAFT" ? "SUBMITTED" : customerStatus;
    const matchesStatus =
      selectedFilterLower === "all" ||
      normalizedStatus?.toLowerCase() === selectedFilterLower;

    // ✅ Loan type match (if your API gives loanType)
    const matchesLoanType =
      selectedLoanTypeLower === "all" ||
      customer.loanType?.toLowerCase() === selectedLoanTypeLower;

    return matchesSearch && matchesStatus && matchesLoanType;
  });

  const sortedFilteredCustomers = [...(filteredCustomers || [])].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime; // newest first
  });

  const totalPages = Math.max(1, Math.ceil(sortedFilteredCustomers.length / rowsPerPage));
  const paginatedCustomers = sortedFilteredCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, selectedLoanType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const loanTypeOptions = [
    { label: "All", value: "All" },
    { label: "Business Loan", value: "BUSINESS" },
    { label: "Personal Loan", value: "PERSONAL" },
    { label: "Home Loan", value: "HOME" },
  ];

  const getAccountTypeColor = (type) => {
    switch (type) {
      case "Home Loan":
        return "bg-purple-100 text-purple-700";

      case "Business Loan":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const calculateCommission = () => {
    const loanAmount =
      selectedCustomer?.loanAmount || selectedCustomer?.totalLoan;
    if (!loanAmount || !commissionPercentage) return 0;

    return (loanAmount * parseFloat(commissionPercentage)) / 100;
  };

  const closeModal = () => {
    setShowPayoutModal(false);

    setSelectedCustomer(null);

    setCommissionPercentage("");
  };

  const saveCommission = () => {
    // Here you would typically save to your backend/database

  
    closeModal();
  };

  const [open, setOpen] = useState(false);

  const [selected, setSelected] = useState("Filter");

  const handleSelect = (value) => {
    setSelected(value);

    setSelectedFilter(value === "All" ? "all" : value); // support 'All'

    setOpen(false);
  };

  function InProcessCount(applications) {
    if (!Array.isArray(applications)) return 0;
    // Count applications that are in process (not DISBURSED, REJECTED, or APPROVED)
    return applications.filter((app) => {
      const status = app.status?.toUpperCase();
      return status && !["DISBURSED", "REJECTED", "APPROVED"].includes(status);
    }).length;
  }

  function RejectedCount(applications) {
    if (!Array.isArray(applications)) return 0;
    // Count applications where status is REJECTED
    return applications.filter((app) => {
      const status = app.status?.toUpperCase();
      return status === "REJECTED";
    }).length;
  }

  function DisbursedCount(applications) {
    if (!Array.isArray(applications)) return 0;
    // Count applications where status is DISBURSED
    return applications.filter((app) => {
      const status = app.status?.toUpperCase();
      return status === "DISBURSED";
    }).length;
  }

  const stats = [
    {
      title: "Total Customers",
      value: customers.length,
      icon: Users,
      subtitle: "All assigned customers",
      onClick: () => navigate("/rm/customers"),
    },

    {
      title: "In Process",
      value: InProcessCount(customers),
      icon: TrendingUp,
      subtitle: "Applications under process",
      onClick: () => {
        setSelected("IN_PROCESS");
        setSelectedFilter("in_process");
      },
    },

    {
      title: "Rejected",
      value: RejectedCount(customers),
      icon: UserPlus,
      subtitle: "Needs follow-up",
      onClick: () => {
        setSelected("REJECTED");
        setSelectedFilter("rejected");
      },
    },

    {
      title: "Total Disbursed",
      value: DisbursedCount(customers),
      icon: CreditCard,
      subtitle: "Completed disbursement",
      onClick: () => {
        setSelected("DISBURSED");
        setSelectedFilter("disbursed");
      },
    },
  ];


  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            <span className="text-gray-700 text-lg">Loading customers...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Customers
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCustomers}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

    
  const loginAsUser = async (userId, navigate) => {
    try {
      const { rmToken } = getAuthData();
      if (!rmToken) throw new Error("Admin not authenticated");
  
      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${rmToken}` } }
      );
  
      const { token, user } = res.data;
  
      // Save impersonated token without removing admin token
      saveAuthData(token, user, true);
  
      // Navigate to role
      switch (user.role) {
        case "ASM": navigate("/asm"); break;
        case "RM": navigate("/rm"); break;
        case "PARTNER": navigate("/partner"); break;
        case "CUSTOMER": navigate("/customer"); break;
        default: navigate("/"); break;
      }
    } catch (err) {
      console.error("Login as user failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || err.message || "Login as user failed");
    }
  };
  
 // Usage in component
const handleLoginAs = (userId) => {
  console.log(userId)
loginAsUser(userId, navigate);
};

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <main className="mx-auto flex max-w-7xl flex-col gap-4 p-3 md:gap-5 md:p-6">
          {/* Stats Cards */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <MetricCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                subtitle={stat.subtitle}
                onClick={stat.onClick}
                colorIndex={index}
                compact
              />
            ))}
          </div>

          {/* Search & Filter */}

          <div className="mb-2 rounded-xl bg-white p-2 shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search */}

              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="text"
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Loan Type Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLoanTypeOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs text-white transition hover:bg-teal-700"
                  type="button"
                >
                  <span>{selectedLoanType || "Loan Type"}</span>
                  <ChevronDown size={18} />
                </button>

                {loanTypeOpen && (
                  <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <ul className="py-2 text-gray-700">
                      {loanTypeOptions.map((option) => (
                        <li
                          key={option.value}
                          onClick={() => {
                            setSelectedLoanType(option.value);
                            setLoanTypeOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {option.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Filter with dropdown */}

              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs text-white transition hover:bg-teal-700"
                >
                  <Filter size={20} />

                  <span>{selected}</span>

                  <ChevronDown size={18} />
                </button>

                {open && (
                  <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <ul className="py-2 text-gray-700">
                      {[
                        "All",
                        "DOC_INCOMPLETE",
                        "DOC_COMPLETE",
                        "UNDER_REVIEW",
                        "SUBMITTED",
                        "APPROVED",
                        "AGREEMENT",
                        "DISBURSED",
                        "REJECTED",
                      ].map((status) => (
                        <li
                          key={status}
                          onClick={() => handleSelect(status)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Table */}

          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 md:px-5">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Customer List</h2>
                </div>
                <div>
                  <h2 className="flex items-center justify-center rounded-md bg-teal-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {filteredCustomers.length}
                  </h2>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Manage and view all customer information
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-xs md:text-sm">
                <thead className="sticky top-0 z-10 bg-teal-500">
                  <tr>
                    <th className="w-[17%] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white/95 md:px-2.5">
                      User Name
                    </th>

                    <th className="w-[13%] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white/95 md:px-2.5">
                      Application Date
                    </th>

                    <th className="w-[19%] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white/95 md:px-2.5">
                      Loan Type
                    </th>

                    <th className="w-[15%] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white/95 md:px-2.5">
                      Loan Amount
                    </th>

                    <th className="w-[15%] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white/95 md:px-2.5">
                      Approval Amount
                    </th>
                    
                 
                    <th className="w-[10%] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white/95 md:px-2.5">
                      Status
                    </th>

                    <th className="w-[8%] px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white/95 md:px-2.5">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {paginatedCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="align-top transition-colors hover:bg-slate-50/70"
                    >
                      {/* User Name */}

                      <td className="px-2 py-2.5 align-top md:px-2.5">
                        <div className="flex items-start gap-1.5">
                          <div>
                            <p className="truncate text-sm font-semibold leading-5 text-slate-900 md:text-sm" title={customer.firstName && customer.lastName
                                ? `${customer.firstName} ${customer.lastName}`.trim()
                                : customer.customerName || "N/A"}>
                              {customer.firstName && customer.lastName
                                ? `${customer.firstName} ${customer.lastName}`.trim()
                                : customer.customerName || "N/A"}
                            </p>
                            <p className="mt-0.5 break-words text-[11px] text-slate-500">
                              ID: {customer?.customerEmployeeId || "N/A"}
                            </p>
                            <p className="break-words text-[11px] text-slate-500">
                              Contact: {customer.contact || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Application Date */}

                      <td className="break-words px-2 py-2.5 align-top text-xs text-slate-600 md:px-2.5">
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleDateString()
                          : customer.joinDate || "N/A"}
                      </td>

                      {/* Loan Type */}

                      <td className="overflow-hidden px-2 py-2.5 align-top md:px-2.5">
                        <span
                          className={`inline-flex max-w-[170px] whitespace-normal break-all rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ${getAccountTypeColor(
                            customer.loanType || "Personal Loan"
                          )}`}
                          title={formatLoanTypeLabel(customer.loanType)}
                        >
                          {formatLoanTypeLabel(customer.loanType)}
                        </span>
                      </td>

                      {/* Loan Amount */}

                      <td className="break-words px-2 py-2.5 align-top text-xs font-semibold text-slate-800 md:px-2.5">
                        {formatCurrencyFull(customer.requestedAmount || 0)}
                      </td>

                      {/* Approval Amount */}

                      <td className="break-words px-2 py-2.5 align-top text-xs font-semibold text-slate-800 md:px-2.5">
                        {customer.approvedAmount ? formatCurrencyFull(customer.approvedAmount) : "-"}
                      </td>

                      {/* Status */}

                      <td className="px-2 py-2.5 align-top md:px-2.5">
                        <span
                          className={`inline-flex max-w-full break-words rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(
                            customer.status === "DRAFT" ? "SUBMITTED" : customer.status
                          )}`}
                        >
                          {customer.status === "DRAFT" ? "SUBMITTED" : (customer.status || "N/A")}
                        </span>
                      </td>

                      {/* Action */}

                      <td className="px-2 py-2.5 align-top md:px-2.5">
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              navigate("/rm/CustomerAppliction", {
                                state: {
                                  customerId: customer?.customerId,
                                  applicationId: customer?.applicationId,
                                },
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50"
                            title="View"
                          >
                            <Eye size={13} className="text-teal-600" />
                            <span className="hidden md:inline">View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedFilteredCustomers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-2.5">
                <p className="text-xs text-slate-600">
                  Showing {(currentPage - 1) * rowsPerPage + 1}-
                  {Math.min(currentPage * rowsPerPage, sortedFilteredCustomers.length)} of {sortedFilteredCustomers.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {sortedFilteredCustomers.length === 0 && (
              <div className="py-12 text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />

                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No customers found
                </h3>

                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Payout Modal */}

        {showPayoutModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}

              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center font-medium">
                    {(selectedCustomer.firstName && selectedCustomer.lastName
                      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                      : selectedCustomer.name || "N/A"
                    )

                      .split(" ")

                      .map((n) => n[0])

                      .join("")}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">Commission Calculator</h2>

                    <p className="text-sm text-gray-600">
                      {selectedCustomer.firstName && selectedCustomer.lastName
                        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.trim()
                        : selectedCustomer.name || "N/A"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}

              <div className="p-6">
                {/* Customer Loan Info */}

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3">Loan Details</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Total Disburesed Amount:
                      </span>

                      <span className="font-bold text-lg">
                        ₹
                        {(
                          selectedCustomer.loanAmount ||
                          selectedCustomer.totalLoan ||
                          0
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Loan Type:</span>

                      <span className="font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        {selectedCustomer.loanType || "Personal Loan"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Commission:</span>

                      <span className="font-medium text-teal-600">
                        {selectedCustomer.currentCommission || 2.5}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Commission Percentage Input */}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Commission Percentage (%)
                  </label>

                  <div className="relative">
                    <Percent
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="number"
                      placeholder="Enter commission percentage"
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(e.target.value)}
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Calculated Commission */}

                {commissionPercentage && (
                  <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="text-teal-600" size={20} />

                      <h4 className="font-medium text-teal-800">
                        Calculated Partner Commission
                      </h4>
                    </div>

                    <div className="text-3xl font-bold text-teal-700">
                      ₹
                      {calculateCommission().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,

                        maximumFractionDigits: 2,
                      })}
                    </div>

                    <div className="text-sm text-teal-600 mt-1">
                      {commissionPercentage}% of ₹
                      {(
                        selectedCustomer.loanAmount ||
                        selectedCustomer.totalLoan ||
                        0
                      ).toLocaleString("en-IN")}{" "}
                      loan amount
                    </div>
                  </div>
                )}

                {/* Action Buttons */}

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveCommission}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!commissionPercentage}
                  >
                    Save Commission
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Customers;
