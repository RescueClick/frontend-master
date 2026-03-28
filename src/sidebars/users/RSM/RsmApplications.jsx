import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Search, Filter, Eye, Phone, FileText, Download } from "lucide-react";
import { fetchRsmApplications } from "../../../feature/thunks/rsmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { matchesSearchTerm, matchesStatusFilter, normalizeStatus } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import toast from "react-hot-toast";
import { getLoanStatusLabel } from "../../../utils/loanStatus";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";

export default function RsmApplications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data, loading, success, error } = useSelector(
    (state) => state.rsm.applications
  );

  useEffect(() => {
    dispatch(fetchRsmApplications({ status: filterStatus !== "All" ? filterStatus : null }));
  }, [dispatch, filterStatus]);

  // Format applications data
  const applications = Array.isArray(data)
    ? data.map((app) => {
        // Derive latest payout amount from payouts array if present
        let latestPayoutAmount = 0;
        if (Array.isArray(app.payouts) && app.payouts.length > 0) {
          const latestPayout = app.payouts[app.payouts.length - 1];
          latestPayoutAmount = Number(latestPayout.amount) || 0;
        }

        return {
          id: app._id,
          appNo: app.appNo,
          customerName: app.customerId
            ? `${app.customerId.firstName || ""} ${app.customerId.lastName || ""}`.trim()
            : "N/A",
          customerId: app.customerId?.employeeId || app.customerId?._id || "N/A",
          customerPhone: app.customerId?.phone || "-",
          customerEmail: app.customerId?.email || "-",
          rmName: app.rmId
            ? `${app.rmId.firstName || ""} ${app.rmId.lastName || ""}`.trim()
            : "N/A",
          rmEmployeeId: app.rmId?.employeeId || "N/A",
          partnerName: app.partnerId
            ? `${app.partnerId.firstName || ""} ${app.partnerId.lastName || ""}`.trim()
            : null,
          applicationDateRaw: app.createdAt,
          applicationDate: app.createdAt
            ? new Date(app.createdAt).toLocaleDateString()
            : "-",
          loanType: app.loanType || "-",
          loanAmount:
            app.customer?.loanAmount ||
            app.customerId?.loanAmount ||
            app.requestedAmount ||
            0,
          approvedLoanAmount: app.approvedLoanAmount || 0,
          payoutAmount:
            typeof app.payoutAmount === "number" && app.payoutAmount > 0
              ? app.payoutAmount
              : latestPayoutAmount,
          status: app.status || "DRAFT",
        };
      })
    : [];

  const filteredApplications = useMemo(() => {
    const filtered = applications.filter((app) => {
      const matchesSearch = matchesSearchTerm(searchTerm, [
        app.customerName,
        app.customerId,
        app.customerPhone,
        app.customerEmail,
        app.appNo,
        app.rmName,
        app.rmEmployeeId,
      ]);

      const status = normalizeStatus(app.status);
      const matchesFilter = matchesStatusFilter(status, filterStatus);

      return matchesSearch && matchesFilter;
    });
    return sortNewestFirst(filtered, { dateKeys: ["applicationDateRaw"] });
  }, [applications, searchTerm, filterStatus]);

  const handleExport = useCallback(() => {
    const rows = filteredApplications.map((app) => ({
      "App No": app.appNo || "",
      Customer: app.customerName || "",
      "Customer ID": app.customerId || "",
      Phone: app.customerPhone || "",
      Email: app.customerEmail || "",
      "RM Name": app.rmName || "",
      "RM Employee ID": app.rmEmployeeId || "",
      Partner: app.partnerName || "",
      "Application Date": app.applicationDate || "",
      "Loan Type": app.loanType || "",
      "Loan Amount": app.loanAmount ?? "",
      "Approved Amount": app.approvedLoanAmount ?? "",
      Payout: app.payoutAmount ?? "",
      Status: getLoanStatusLabel(app.status) || String(app.status || ""),
    }));
    if (!downloadXlsx(rows, "rsm-applications.xlsx", "Applications")) {
      toast.error("No rows to export");
    }
  }, [filteredApplications]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      {
        title: "App No",
        dataIndex: "appNo",
        key: "appNo",
        render: (v) => v || "N/A",
      },
      {
        title: "Customer",
        key: "customer",
        render: (_, app) => (
          <div>
            <p className="font-medium text-gray-900">{app.customerName}</p>
            <p className="text-xs text-gray-500">{app.customerId}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Phone size={12} /> {app.customerPhone}
            </p>
          </div>
        ),
      },
      {
        title: "RM",
        key: "rm",
        render: (_, app) => (
          <div>
            <p className="text-sm font-medium text-gray-900">{app.rmName}</p>
            <p className="text-xs text-gray-500">{app.rmEmployeeId}</p>
          </div>
        ),
      },
      {
        title: "Partner",
        dataIndex: "partnerName",
        key: "partner",
        render: (v) => (
          <span className="text-sm text-gray-600">{v || "Direct"}</span>
        ),
      },
      {
        title: "Application Date",
        dataIndex: "applicationDate",
        key: "applicationDate",
      },
      {
        title: "Loan Type",
        dataIndex: "loanType",
        key: "loanType",
        render: (v) => (
          <span className="text-sm">{loanTypeToTableShort(v)}</span>
        ),
      },
      {
        title: "Loan Amount",
        key: "loanAmount",
        render: (_, app) => (
          <span className="font-semibold">{formatCurrency(app.loanAmount)}</span>
        ),
      },
      {
        title: "Approved Amount",
        key: "approved",
        render: (_, app) => (
          <span className="font-semibold text-green-600">
            {app.approvedLoanAmount > 0
              ? formatCurrency(app.approvedLoanAmount)
              : "-"}
          </span>
        ),
      },
      {
        title: "Payout",
        key: "payout",
        render: (_, app) => (
          <span className="font-semibold">
            {app.payoutAmount ? formatCurrency(app.payoutAmount) : "—"}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (s) => <LoanStatusBadge status={s} />,
      },
      {
        title: "Action",
        key: "action",
        width: 80,
        render: (_, app) => (
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => {
              navigate("/rsm/applications/view", {
                state: {
                  applicationId: app.id,
                  customerId: app.customerId,
                },
              });
            }}
            title="View Details"
          >
            <Eye size={16} className="text-gray-600" />
          </button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <DashboardTablePage
      title="Applications"
      subtitle="Manage loan applications assigned to you"
      toolbar={
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by customer name, ID, phone, email, app number, or RM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-100 md:py-3"
              />
            </div>
            <div className="relative">
              <Filter
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-w-[160px] rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm md:py-3"
              >
                <option value="All">All Status</option>
                <option value="DOC_COMPLETE">Document Complete</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="DISBURSED">Disbursed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 md:py-3"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      }
    >
      <AppAntTable
        rowKey="id"
        columns={columns}
        dataSource={filteredApplications}
        loading={loading}
        locale={{
          emptyText: (
            <div className="py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                No applications found
              </h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </div>
          ),
        }}
      />
    </DashboardTablePage>
  );
}

