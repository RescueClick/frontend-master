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


const colors = {
  primary: "#12B99C",
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
    },

    {
      title: "In Process",
      value: InProcessCount(customers),
      icon: TrendingUp,
    },

    {
      title: "Rejected",
      value: RejectedCount(customers),
      icon: UserPlus,
    },

    {
      title: "Total Disbursed",
      value: DisbursedCount(customers),
      icon: CreditCard,
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
      <div className="bg-gray-50 min-h-screen text-gray-900">
        <main className="">
          {/* Stats Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4 ">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow p-3 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-teal-500 p-3 rounded-lg text-white">
                    <stat.icon size={24} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold">{stat.value}</h3>

                <p className="text-gray-600 font-bold text-sm">{stat.count}</p>

                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Search & Filter */}

          <div className="bg-white rounded-xl shadow p-3 mb-3">
            <div className="flex flex-col sm:flex-row gap-4">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Loan Type Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLoanTypeOpen((prev) => !prev)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition"
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
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition"
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

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className=" flex justify-between ">
                <div className="">
                  {" "}
                  <h2 className="text-lg font-semibold">Customer List </h2>
                </div>
                <div className="">
                  {" "}
                  <h2 className="flex items-center justify-center text-sm font-semibold bg-teal-600 px-4 py-2 text-white">
                    {filteredCustomers.length}{" "}
                  </h2>{" "}
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                Manage and view all customer information
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className=" bg-teal-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-white">
                      User Name
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-white">
                      User Id
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-white">
                      Contact
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-white">
                      Application Date
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-white">
                      Loan Type
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-white">
                      Loan Amount
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-white">
                      Approval Amount
                    </th>
                    
                 
                    <th className="px-6 py-3 text-left font-medium text-white">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-white">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      {/* User Name */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">
                              {customer.firstName && customer.lastName
                                ? `${customer.firstName} ${customer.lastName}`.trim()
                                : customer.customerName || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* User Id */}

                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-500">
                          {customer?.customerEmployeeId}
                        </p>
                      </td>

                      {/* Contact */}

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            {customer.contact || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* Application Date */}

                      <td className="px-6 py-4 text-gray-600">
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleDateString()
                          : customer.joinDate || "N/A"}
                      </td>

                      {/* Loan Type */}

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(
                            customer.loanType || "Personal Loan"
                          )}`}
                        >
                          {customer.loanType || "Personal Loan"}
                        </span>
                      </td>

                      {/* Loan Amount */}

                      <td className="px-6 py-4 font-semibold">
                        ₹ {customer.requestedAmount}
                      </td>

                      {/* Approval Amount */}

                      <td className="px-6 py-4 font-semibold">
                        {customer.approvedAmount ? `₹ ${customer.approvedAmount} ` : "-"}
                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            customer.status === "DRAFT" ? "SUBMITTED" : customer.status
                          )}`}
                        >
                          {customer.status === "DRAFT" ? "SUBMITTED" : (customer.status || "N/A")}
                        </span>
                      </td>

                      {/* Action */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigate("/rm/CustomerAppliction", {
                                state: {
                                  customerId: customer?.customerId,
                                  applicationId: customer?.applicationId,
                                },
                              });
                            }}
                            className="p-2 rounded hover:bg-gray-100"
                            title="View"
                          >
                            <Eye size={16} className="text-teal-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCustomers.length === 0 && (
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
