import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Plus,
  Phone,
  Users,
  Clock,
  XCircle,
  CheckCircle,
  ChevronDown,
  Eye,
  Menu,
  Download,
} from "lucide-react";

import { getAuthData } from "../../../utils/localStorage";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import { getLoanStatusLabel, normalizeLoanStatus } from "../../../utils/loanStatus";
import toast from "react-hot-toast";
import { downloadXlsx } from "../../../utils/downloadXlsx";

const Customer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [customersData, setCustomersData] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check screen size for mobile responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { partnerToken } = getAuthData();
        const response = await axios.get(`${backendurl}/partner/customers`, {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
        });

        setCustomersData(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customersData.filter((customer) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      customer.customerName.toLowerCase().includes(search) ||
      customer.customerEmployeeId.toLowerCase().includes(search) ||
      customer.contact.includes(search);

    // Centralized status normalization for filtering
    const normalizedStatus = normalizeLoanStatus(customer.status);
    const matchesStatus =
      statusFilter === "All" ||
      normalizedStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const sortedFilteredCustomers = [...(filteredCustomers || [])].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime; // newest first
  });

  const handleExport = useCallback(() => {
    const rows = sortedFilteredCustomers.map((c) => ({
      "User Name": c.customerName || "",
      "User ID": c.customerEmployeeId || "",
      Contact: c.contact || "",
      "Application Date": c.createdAt
        ? new Date(c.createdAt).toLocaleDateString("en-IN")
        : "",
      "Loan Amount": c.loanAmount ?? "",
      "Disbursed Amount": c.approvedAmount ?? "",
      Payout: c.payoutAmount ?? "",
      Status: getLoanStatusLabel(c.status) || String(c.status || ""),
    }));
    if (!downloadXlsx(rows, "partner-customers.xlsx", "Customers")) {
      toast.error("No rows to export");
    }
  }, [sortedFilteredCustomers]);

  const { totalLoanAmount, count } = customersData.reduce(
    (acc, customer) => {
      let amount = 0;

      switch (customer.status) {
        case "APPROVED":
          amount = customer.approvedAmount || 0;
          break;
        default:
          amount = customer.loanAmount || 0;
          break;
      }

      if (amount > 0) {
        acc.totalLoanAmount += amount;
        acc.count += 1;
      }

      return acc;
    },
    { totalLoanAmount: 0, count: 0 }
  );

  const averageLoanAmount = count > 0 ? totalLoanAmount / count : 0;

  function getStatusCount(customers, status) {
    if (!Array.isArray(customers)) return 0;

    return customers.filter(
      (customer) =>
        customer.status &&
        customer.status.toUpperCase() === status.toUpperCase()
    ).length;
  }

  const desktopColumns = useMemo(
    () => [
      {
        title: "User Name",
        key: "name",
        render: (_, customer) => (
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0">
              {customer?.customerName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="font-medium text-gray-900 min-w-0">
              <div className="truncate">{customer.customerName}</div>
            </div>
          </div>
        ),
      },
      {
        title: "User ID",
        dataIndex: "customerEmployeeId",
        key: "uid",
        className: "font-mono font-medium text-teal-500",
      },
      {
        title: "Contact",
        key: "contact",
        render: (_, customer) => (
          <div className="flex items-center text-gray-600">
            <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{customer.contact}</span>
          </div>
        ),
      },
      {
        title: "Application Date",
        key: "created",
        render: (_, customer) =>
          new Date(customer.createdAt).toLocaleDateString("en-IN"),
      },
      {
        title: "Loan Amount",
        dataIndex: "loanAmount",
        key: "loan",
        render: (v) => (
          <span className="font-medium text-gray-900 whitespace-nowrap">₹ {v}</span>
        ),
      },
      {
        title: "Disbursed Amount",
        key: "appr",
        render: (_, customer) => (
          <span className="font-medium text-green-700 whitespace-nowrap">
            {customer.approvedAmount ? (
              `₹ ${Number(customer.approvedAmount).toLocaleString("en-IN")}`
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </span>
        ),
      },
      {
        title: "Payout",
        key: "payout",
        render: (_, customer) => (
          <span className="font-medium text-purple-700 whitespace-nowrap">
            ₹ {(customer.payoutAmount || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (s) => (
          <LoanStatusBadge status={s} className="whitespace-nowrap" />
        ),
      },
    ],
    []
  );

  // Mobile Card Component
  const MobileCustomerCard = ({ customer }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0">
            {customer?.customerName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">{customer.customerName}</div>
            <div className="text-sm font-mono text-teal-600">{customer.customerEmployeeId}</div>
          </div>
        </div>
                          <LoanStatusBadge
                            status={customer.status}
                            className="whitespace-nowrap ml-2"
                          />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0" />
          <span>{customer.contact}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">Loan Amount</div>
            <div className="font-medium text-gray-900">₹ {customer.loanAmount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Disbursed</div>
            <div className="font-medium text-green-700">
              {customer.approvedAmount ? `₹ ${Number(customer.approvedAmount).toLocaleString("en-IN")}` : <span className="text-gray-400">—</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="text-xs text-gray-500 mb-1">Applied On</div>
            <div className="text-gray-700">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Payout</div>
            <div className="font-medium text-purple-700">
              ₹ {(customer.payoutAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-list-page min-h-screen w-full overflow-x-hidden">
      <div className="container mx-auto max-w-7xl py-3 sm:py-4 md:py-5">
        {/* Summary Cards - Enhanced responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[ 
            { count: customersData.length, label: "Total Customers", bg: "bg-blue-600", icon: <Users size={16} className="text-blue-200 sm:w-5 sm:h-5" /> },
            { count: getStatusCount(customersData, "SUBMITTED") + getStatusCount(customersData, "DRAFT"), label: "Pending", bg: "bg-yellow-500", icon: <Clock size={16} className="text-yellow-100 sm:w-5 sm:h-5" /> },
            { count: getStatusCount(customersData, "REJECTED"), label: "Rejected", bg: "bg-red-600", icon: <XCircle size={16} className="text-red-100 sm:w-5 sm:h-5" /> },
            { count: getStatusCount(customersData, "DISBURSED"), label: "Disbursed", bg: "bg-green-600", icon: <CheckCircle size={16} className="text-green-100 sm:w-5 sm:h-5" /> },
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 lg:p-5 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">{item.count}</div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600 leading-tight">{item.label}</div>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                {item.icon}
              </div>
            </div>
          ))}
        </div>
  
        {/* Portfolio Summary - Better mobile layout */}
        <div className="rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 text-white bg-teal-600">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-medium mb-2">Total Customer Portfolio</h3>
              <div className="text-base sm:text-xl lg:text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                ₹
                {totalLoanAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-sm opacity-80 mb-1">Average Loan Amount</div>
              <div className="text-base sm:text-lg lg:text-xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] mx-auto sm:mx-0">
                ₹
                {averageLoanAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </div>
  
        {/* Search and Filter - Improved mobile stacking */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, ID, or phone..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative sm:w-48 lg:w-56">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                className="w-full pl-10 pr-8 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 bg-white appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="DOC_INCOMPLETE">Document Incomplete</option>
                <option value="DOC_COMPLETE">Document Complete</option>
                <option value="DOC_SUBMITTED">Document Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISBURSED">Disbursed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto w-full"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
  
        {/* Customer Data Display - Conditional rendering for mobile vs desktop */}
        {isMobileView ? (
          // Mobile Card Layout
          <div className="space-y-4">
            {sortedFilteredCustomers?.map((customer) => (
              <MobileCustomerCard key={customer.customerId} customer={customer} />
            ))}
          </div>
        ) : (
          <div className="app-list-page__table-wrap">
            <AppAntTable
              rowKey="customerId"
              columns={desktopColumns}
              dataSource={sortedFilteredCustomers}
              size="small"
              scroll={{ x: 900 }}
            />
          </div>
        )}
  
        {/* No Results */}
        {sortedFilteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg sm:rounded-xl shadow-sm">
            <div className="mb-4">
              <Search size={40} className="mx-auto text-gray-300 sm:w-12 sm:h-12" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-sm sm:text-base px-4">No customers match your search criteria.</p>
          </div>
        )}
  
        {/* Results Summary */}
        {sortedFilteredCustomers.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600 px-4">
            Showing {sortedFilteredCustomers.length} of {customersData.length} customers
          </div>
        )}
      </div>
    </div>
  );
};

export default Customer;