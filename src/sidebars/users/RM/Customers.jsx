import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";


import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Eye,
  Edit,
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
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import { formatCurrency } from "../../../utils/designSystem";
import toast from "react-hot-toast";
import { getLoanStatusLabel } from "../../../utils/loanStatus";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";

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


const formatApplicationDateCell = (customer) => {
  const raw = customer.createdAt || customer.joinDate;
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};

const formatNumericLoanCell = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const formatDisburseCell = (customer) => {
  const st = String(customer.status || "").toUpperCase();
  if (st !== "DISBURSED") return "—";
  const n = Number(customer.approvedAmount);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const displayCustomerName = (customer) => {
  if (customer.firstName || customer.lastName) {
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
  }
  return customer.customerName || "—";
};

const RM_STATUS_FILTER_OPTIONS = [
  "All",
  "DOC_INCOMPLETE",
  "DOC_COMPLETE",
  "UNDER_REVIEW",
  "SUBMITTED",
  "APPROVED",
  "AGREEMENT",
  "DISBURSED",
  "REJECTED",
];

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

  const [selectedLoanType, setSelectedLoanType] = useState("All");

  const statusSelectValue = useMemo(() => {
    const sf = selectedFilter;
    if (sf === "all" || sf === "in_process") return "All";
    if (sf === "rejected") return "REJECTED";
    if (sf === "disbursed") return "DISBURSED";
    const u = String(sf || "").toUpperCase();
    if (RM_STATUS_FILTER_OPTIONS.includes(u)) return u;
    return "All";
  }, [selectedFilter]);


  const location = useLocation();
  const { id } = location.state || {};


  useEffect(() => {
    setSearchTerm(id != null && id !== "" ? String(id) : "");
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
    if (location.state?.partnerName != null && location.state.partnerName !== "") {
      setSearchTerm(String(location.state.partnerName));
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

  const handleExport = useCallback(() => {
    const rows = sortedFilteredCustomers.map((c) => {
      const displayName =
        c.firstName && c.lastName
          ? `${c.firstName} ${c.lastName}`.trim()
          : c.customerName || "";
      return {
        "User Name": displayName,
        "Customer ID": c.customerEmployeeId || c.customerId || "",
        Contact: c.contact || "",
        "Application Date": c.createdAt
          ? new Date(c.createdAt).toLocaleDateString("en-IN")
          : c.joinDate || "",
        "Loan Type": loanTypeToTableShort(c.loanType),
        "Loan Amount": c.requestedAmount ?? "",
        "Approval Amount": c.approvedAmount ?? "",
        Status: getLoanStatusLabel(c.status) || String(c.status || ""),
      };
    });
    if (!downloadXlsx(rows, "rm-customers.xlsx", "Customers")) {
      toast.error("No rows to export");
    }
  }, [sortedFilteredCustomers]);

  const loanTypeOptions = [
    { label: "All", value: "All" },
    { label: "Business Loan", value: "BUSINESS" },
    { label: "Personal Loan", value: "PERSONAL" },
    { label: "Home Loan", value: "HOME" },
  ];

  const columns = useMemo(
    () => [
      {
        title: "User Name",
        key: "userName",
        ellipsis: true,
        render: (_, customer) => (
          <span className="text-sm font-semibold text-gray-900">
            {displayCustomerName(customer)}
          </span>
        ),
      },
      {
        title: "User ID",
        key: "userId",
        width: 120,
        render: (_, customer) => (
          <span className="font-mono text-sm text-gray-800">
            {customer.customerEmployeeId || "—"}
          </span>
        ),
      },
      {
        title: "Contact",
        key: "contact",
        width: 130,
        render: (_, customer) => (
          <span className="text-sm text-gray-800">{customer.contact || "—"}</span>
        ),
      },
      {
        title: "Application Date",
        key: "date",
        width: 130,
        render: (_, customer) => (
          <span className="text-sm text-gray-800">
            {formatApplicationDateCell(customer)}
          </span>
        ),
      },
      {
        title: "Loan Type",
        key: "loanType",
        ellipsis: true,
        render: (_, customer) => (
          <span
            className="text-xs font-semibold tracking-wide text-gray-900"
            title={formatLoanTypeLabel(customer.loanType)}
          >
            {loanTypeToTableShort(customer.loanType)}
          </span>
        ),
      },
      {
        title: "Loan",
        key: "loan",
        align: "right",
        width: 110,
        render: (_, customer) => (
          <span className="text-sm font-medium text-gray-900 tabular-nums">
            {formatNumericLoanCell(
              customer.requestedAmount ?? customer.approvedAmount
            )}
          </span>
        ),
      },
      {
        title: "Disburse",
        key: "disburse",
        align: "right",
        width: 110,
        render: (_, customer) => (
          <span className="text-sm font-medium text-gray-900 tabular-nums">
            {formatDisburseCell(customer)}
          </span>
        ),
      },
      {
        title: "Status",
        key: "status",
        width: 160,
        render: (_, customer) => (
          <LoanStatusBadge status={customer.status} className="max-w-full" />
        ),
      },
      {
        title: "Action",
        key: "action",
        width: 72,
        align: "center",
        render: (_, customer) => (
          <button
            type="button"
            onClick={() =>
              navigate("/rm/CustomerAppliction", {
                state: {
                  customerId: customer?.customerId,
                  applicationId: customer?.applicationId,
                },
              })
            }
            className="rounded-full bg-gray-100 p-1 text-gray-700 transition-colors hover:bg-gray-200"
            title="View details"
          >
            <Eye size={14} />
          </button>
        ),
      },
    ],
    [navigate]
  );

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
        setSelectedFilter("in_process");
      },
    },

    {
      title: "Rejected",
      value: RejectedCount(customers),
      icon: UserPlus,
      subtitle: "Needs follow-up",
      onClick: () => {
        setSelectedFilter("rejected");
      },
    },

    {
      title: "Total Disbursed",
      value: DisbursedCount(customers),
      icon: CreditCard,
      subtitle: "Completed disbursement",
      onClick: () => {
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

  return (
    <>
      <div className="min-h-screen text-gray-900" style={{ background: "#F8FAFC" }}>
        <div className="mx-auto w-full max-w-[min(100%,1600px)] px-2 pt-3 md:px-5 md:pt-4">
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
        </div>

        <DashboardTablePage
          title="Customer Applications"
          subtitle={`Total ${sortedFilteredCustomers.length} records found`}
          headerRight={
            <>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  className="w-[min(100vw-2rem,220px)] rounded-md border border-gray-300 py-2 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary sm:w-56"
                  placeholder="Search name, ID, email, phone…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search customers"
                />
              </div>
              <select
                className="rounded-md border border-gray-300 bg-white py-2 pl-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={selectedLoanType}
                onChange={(e) => setSelectedLoanType(e.target.value)}
                aria-label="Loan type"
              >
                {loanTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="max-w-[11rem] rounded-md border border-gray-300 bg-white py-2 pl-2 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary sm:max-w-none"
                value={statusSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedFilter(v === "All" ? "all" : v);
                }}
                aria-label="Status filter"
              >
                {RM_STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "All" ? "All status" : opt}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                onClick={handleExport}
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
            </>
          }
        >
          <AppAntTable
            rowKey={(row, index) =>
              `${row.applicationId ?? ""}-${row.customerId ?? ""}-${row.customerEmployeeId ?? index}`
            }
            columns={columns}
            dataSource={sortedFilteredCustomers}
            loading={loading}
            size="small"
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (searchTerm ?? "").trim() ? (
                <div className="py-12 text-center text-gray-600">
                  No customers match your search.
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">No records</h3>
                  <p className="text-gray-600">Try adjusting your filters.</p>
                </div>
              ),
            }}
          />
        </DashboardTablePage>
      </div>

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
    </>
  );
};

export default Customers;
