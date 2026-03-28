import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { matchesSearchTerm, matchesStatusFilter, normalizeStatus } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import { getLoanStatusLabel, normalizeLoanStatus } from "../../../utils/loanStatus";
import toast from "react-hot-toast";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";

const Application = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // remark
  const [open, setOpen] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState("");

  const remark = "This is the remark you want to show in the popup."; // You can replace with dynamic data

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { partnerToken } = getAuthData(); // 🔑 Adjust if you store token differently
        const res = await axios.get(`${backendurl}/partner/get-applications`, {
          headers: { Authorization: `Bearer ${partnerToken}` },
        });

        const mappedData = res.data.map((app) => {
          // Derive latest payout amount from payouts array (if present)
          let latestPayoutAmount = 0;
          if (Array.isArray(app.payouts) && app.payouts.length > 0) {
            const latestPayout = app.payouts[app.payouts.length - 1];
            latestPayoutAmount = Number(latestPayout.amount) || 0;
          }

          return {
            id: app.appNo || app._id, // Prefer appNo (e.g., TLF0001)
            applicationId: app._id, // Store MongoDB _id for API calls
            customerId:
              app.customerId?._id ||
              app.customerId ||
              app.customer?._id ||
              "", // Store customer ID
            customerName: `${app.customer?.firstName || ""} ${
              app.customer?.lastName || ""
            }`.trim(),
            contact: app.customer?.phone || app.customerId?.phone || "—",
            dateSubmitted: app.createdAt, // ISO string → will format later in UI
            loanType: app.loanType || "—",
            loanAmount: app.customer?.loanAmount
              ? `₹${app.customer.loanAmount.toLocaleString("en-IN")}`
              : "—",
            approvalAmount: app.approvedLoanAmount
              ? `₹${app.approvedLoanAmount.toLocaleString("en-IN")}`
              : "—",
            disbursedAmount:
              app.status === "DISBURSED" && app.approvedLoanAmount
                ? app.approvedLoanAmount
                : 0, // Disbursed amount (only when status is DISBURSED)
            payoutAmount:
              typeof app.payoutAmount === "number" && app.payoutAmount > 0
                ? app.payoutAmount
                : latestPayoutAmount, // Use backend field if present, else latest payout
            status: mapStatus(app.status), // normalize backend → UI
            stageHistory: app.stageHistory || [],
          };
        });

        setApplications(mappedData);
      } catch (err) {
        console.error("Error fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const mapStatus = (status) => normalizeLoanStatus(status);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredApplications = applications.filter((application) => {
    const matchesSearch = matchesSearchTerm(searchTerm, [
      application.customerName,
      application.id,
      application.loanType,
    ]);

    const status = normalizeStatus(application.status);
    const matchesStatus = matchesStatusFilter(status, statusFilter);

    return matchesSearch && matchesStatus;
  });

  const sortedFilteredApplications = sortNewestFirst(filteredApplications, {
    dateKeys: ["dateSubmitted"],
  });

  const handleExport = useCallback(() => {
    const rows = sortedFilteredApplications.map((a) => ({
      "App ID": a.id || "",
      "Customer Name": a.customerName || "",
      Contact: a.contact || "",
      "Date Submitted": a.dateSubmitted
        ? formatDate(a.dateSubmitted)
        : "",
      "Loan Type": loanTypeToTableShort(a.loanType),
      "Loan Amount": a.loanAmount || "",
      "Approval Amount": a.approvalAmount || "",
      Disbursed: a.disbursedAmount ?? "",
      Payout: a.payoutAmount ?? "",
      Status: getLoanStatusLabel(a.status) || String(a.status || ""),
    }));
    if (!downloadXlsx(rows, "partner-applications.xlsx", "Applications")) {
      toast.error("No rows to export");
    }
  }, [sortedFilteredApplications]);

  const summaryStats = {
    total: applications.length,
    inProcess: applications.filter((a) => 
      !["DISBURSED", "REJECTED", "APPROVED"].includes(a.status)
    ).length,
    disbursed: applications.filter((a) => a.status === "DISBURSED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

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
        title: "Name",
        key: "name",
        render: (_, application) => (
          <div className="flex items-center min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs mr-2 flex-shrink-0">
              {application.customerName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div
              className="text-xs font-medium truncate"
              style={{ color: "#111827" }}
              title={application.customerName}
            >
              {application.customerName}
            </div>
          </div>
        ),
      },
      {
        title: "App ID",
        dataIndex: "id",
        key: "id",
        render: (v) => (
          <div className="font-mono text-xs font-medium" style={{ color: "#111827" }}>
            {v}
          </div>
        ),
      },
      {
        title: "Contact",
        dataIndex: "contact",
        key: "contact",
        render: (v) => (
          <div className="text-xs text-gray-600 whitespace-nowrap">{v}</div>
        ),
      },
      {
        title: "Date",
        key: "date",
        render: (_, application) => (
          <div className="text-xs text-gray-600 whitespace-nowrap">
            {formatDate(application.dateSubmitted)}
          </div>
        ),
      },
      {
        title: "Type",
        key: "type",
        align: "center",
        render: (_, application) => (
          <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-semibold">
            {loanTypeToTableShort(application.loanType)}
          </span>
        ),
      },
      {
        title: "Loan Amt",
        key: "loan",
        align: "right",
        render: (_, application) => (
          <div
            className="text-xs font-medium whitespace-nowrap"
            style={{ color: "#111827" }}
          >
            {application.loanAmount}
          </div>
        ),
      },
      {
        title: "Approved",
        key: "appr",
        align: "right",
        render: (_, application) => (
          <div
            className="text-xs font-medium whitespace-nowrap"
            style={{ color: "#111827" }}
          >
            {application.approvalAmount}
          </div>
        ),
      },
      {
        title: "Disbursed",
        key: "disb",
        align: "right",
        render: (_, application) => (
          <div
            className="text-xs font-medium whitespace-nowrap"
            style={{
              color: application.disbursedAmount > 0 ? "#10B981" : "#9CA3AF",
            }}
          >
            {application.disbursedAmount > 0
              ? `₹${application.disbursedAmount.toLocaleString("en-IN")}`
              : "—"}
          </div>
        ),
      },
      {
        title: "Payout",
        key: "payout",
        align: "right",
        render: (_, application) => (
          <div className="text-xs font-semibold whitespace-nowrap" style={{ color: "#7C3AED" }}>
            ₹{" "}
            {application.payoutAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        title: "Status",
        key: "status",
        align: "center",
        render: (_, application) => (
          <LoanStatusBadge status={application.status} className="whitespace-nowrap" />
        ),
      },
      {
        title: "Remarks",
        key: "remarks",
        align: "center",
        render: (_, application) => (
          <button
            type="button"
            className="px-2 py-1 rounded text-white hover:opacity-90 transition-opacity text-xs"
            style={{ backgroundColor: "orange" }}
            title="View Remarks"
            onClick={() => {
              const lastRemark = application.stageHistory?.length
                ? application.stageHistory[application.stageHistory.length - 1].note
                : "No remarks available";
              setSelectedRemark(lastRemark);
              setOpen(true);
            }}
          >
            View
          </button>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        align: "center",
        render: (_, application) => (
          <div className="flex items-center justify-center gap-1">
            {application.applicationId && application.customerId && (
              <button
                type="button"
                className="px-2 py-1 rounded text-white hover:opacity-90 transition-opacity text-xs flex items-center gap-1"
                style={{ backgroundColor: "var(--color-brand-primary)" }}
                title="Upload Documents"
                onClick={() => {
                  navigate(
                    `/partner/complete-application?applicationId=${application.applicationId}&customerId=${application.customerId}`
                  );
                }}
              >
                <Eye size={12} />
                Docs
              </button>
            )}
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/25 bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Remark</h2>
            <p className="text-gray-600 mb-6 break-words">{selectedRemark}</p>

            <div className="flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-list-page min-h-screen">
        <div className="mx-auto max-w-7xl py-3 sm:py-4 md:py-5">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "#1E3A8A" }}>
                Applications
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Monitor and manage loan applications
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90 text-sm sm:text-base w-full sm:w-auto justify-center"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
              onClick={() => {
                navigate("/partner/get-loan");
              }}
            >
              <Plus size={18} /> New Application
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-xl sm:text-2xl font-bold mb-1"
                    style={{ color: "#111827" }}
                  >
                    {summaryStats.total}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Total Applications
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-blue-100 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-xl sm:text-2xl font-bold mb-1"
                    style={{ color: "#F59E0B" }}
                  >
                    {applications.filter((a) => 
                      !["DISBURSED", "REJECTED", "APPROVED"].includes(a.status)
                    ).length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">In Process</div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-100 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl sm:text-2xl font-bold mb-1 text-green-600">
                    {getStatusCount(applications, "DISBURSED")}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Disbursed</div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-100 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl sm:text-2xl font-bold mb-1 text-red-600">
                    {getStatusCount(applications, "REJECTED")}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Rejected</div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <XCircle size={20} className="text-red-100 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search applications by ID, customer name, or loan type..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm sm:text-base"
                  style={{ focusRingColor: "var(--color-brand-primary)" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative w-full lg:w-auto">
                <Filter
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <select
                  className="w-full lg:w-auto pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white text-sm sm:text-base"
                  style={{ focusRingColor: "var(--color-brand-primary)" }}
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
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 lg:w-auto"
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          <div className="app-list-page__table-wrap hidden lg:block">
            <AppAntTable
              rowKey={(row) => String(row.applicationId || row.id)}
              columns={desktopColumns}
              dataSource={sortedFilteredApplications}
              loading={loading}
              size="small"
            />
          </div>

          {/* Applications Cards - Mobile & Tablet */}
          <div className="lg:hidden space-y-4">
            {sortedFilteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-xl shadow-sm p-4">
                {/* Header with avatar and name */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {application.customerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {application.customerName}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {application.id}
                      </div>
                    </div>
                  </div>
                  <LoanStatusBadge status={application.status} />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Contact</div>
                    <div className="font-medium text-gray-900">{application.contact}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Date</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(application.dateSubmitted)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Loan Type</div>
                    <div className="font-medium">
                      <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {loanTypeToTableShort(application.loanType)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Loan Amount</div>
                    <div className="font-medium text-gray-900">{application.loanAmount}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Approval Amount</div>
                    <div className="font-medium text-gray-900">{application.approvalAmount}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Disbursed</div>
                    <div className={`font-medium ${application.disbursedAmount > 0 ? "text-green-700" : "text-gray-400"}`}>
                      {application.disbursedAmount > 0
                        ? `₹${application.disbursedAmount.toLocaleString("en-IN")}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Payout</div>
                    <div className="font-medium text-purple-700">₹ {application.payoutAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity text-sm"
                    style={{ backgroundColor: "orange" }}
                    onClick={() => {
                      const lastRemark = application.stageHistory
                        ?.length
                        ? application.stageHistory[
                            application.stageHistory.length - 1
                          ].note
                        : "No remarks available";

                      setSelectedRemark(lastRemark);
                      setOpen(true);
                    }}
                  >
                    View Remarks
                  </button>
                  {application.applicationId && application.customerId && (
                    <button
                      className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity text-sm flex items-center gap-1"
                      style={{ backgroundColor: "var(--color-brand-primary)" }}
                      onClick={() => {
                        navigate(
                          `/partner/complete-application?applicationId=${application.applicationId}&customerId=${application.customerId}`
                        );
                      }}
                    >
                      <Eye size={14} />
                      Documents
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {sortedFilteredApplications.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm text-center py-12 text-gray-500">
              <div className="mb-4">
                <Search size={48} className="mx-auto text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications found
              </h3>
              <p className="text-sm sm:text-base">No applications match your search criteria.</p>
            </div>
          )}

          {/* Results Summary */}
          {sortedFilteredApplications.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {sortedFilteredApplications.length} of {applications.length}{" "}
              applications
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Application;