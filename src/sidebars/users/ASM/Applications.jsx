import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Search, Filter, Users, Phone, Download } from "lucide-react";
import { fetchAsmApplications } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { matchesSearchTerm, matchesStatusFilter, normalizeStatus } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import toast from "react-hot-toast";
import { getLoanStatusLabel } from "../../../utils/loanStatus";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";

const Application = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const dispatch = useDispatch();

  const { data, loading, success, error } = useSelector(
    (state) => state.asm.applications
  );

 

  useEffect(() => {
    dispatch(fetchAsmApplications());
  }, [dispatch]);

  // Normalize applications data (including payout amount if present)
  const applications = Array.isArray(data)
    ? data.map((c) => {
        // Derive latest payout amount from payouts array if available
        let latestPayoutAmount = 0;
        if (Array.isArray(c.payouts) && c.payouts.length > 0) {
          const latestPayout = c.payouts[c.payouts.length - 1];
          latestPayoutAmount = Number(latestPayout.amount) || 0;
        }

        return {
          name: c.username || c.customerName,
          id: c.userId || c.appNo || c._id,
          phone: c.phone || c.customer?.phone || "-",
          applicationDateRaw: c.applicationDate || c.createdAt,
          applicationDate: c.applicationDate
            ? new Date(c.applicationDate).toLocaleDateString()
            : c.createdAt
            ? new Date(c.createdAt).toLocaleDateString()
            : "-", // formatted
          loanType: c.loanType,
          loanAmount: c.loanAmount || c.requestedAmount || 0,
          disburseAmount: c.approvalAmount || c.approvedLoanAmount || 0,
          payoutAmount:
            typeof c.payoutAmount === "number" && c.payoutAmount > 0
              ? c.payoutAmount
              : latestPayoutAmount,
          status: c.status, // comes as backend status enum
        };
      })
    : [];

  const filteredCustomers = useMemo(() => {
    const filtered = applications.filter((customer) => {
      const matchesSearch = matchesSearchTerm(searchTerm, [
        customer.name,
        customer.id,
        customer.phone,
      ]);

      const status = normalizeStatus(customer.status);
      const matchesFilter = matchesStatusFilter(status, filterStatus);

      return matchesSearch && matchesFilter;
    });
    return sortNewestFirst(filtered, { dateKeys: ["applicationDateRaw"] });
  }, [applications, searchTerm, filterStatus]);

  const handleExport = useCallback(() => {
    const rows = filteredCustomers.map((c) => ({
      "User Name": c.name || "",
      "User ID": c.id || "",
      Phone: c.phone || "",
      "Application Date": c.applicationDate || "",
      "Loan Type": loanTypeToTableShort(c.loanType),
      "Loan Amount": c.loanAmount ?? "",
      "Disburse Amount": c.disburseAmount ?? "",
      Payout: c.payoutAmount ?? "",
      Status: getLoanStatusLabel(c.status) || String(c.status || ""),
    }));
    if (!downloadXlsx(rows, "asm-applications.xlsx", "Applications")) {
      toast.error("No rows to export");
    }
  }, [filteredCustomers]);

  const columns = useMemo(
    () => [
      { title: "User Name", dataIndex: "name", key: "name" },
      {
        title: "User ID",
        dataIndex: "id",
        key: "id",
        render: (v) => (v ? v : "N/A"),
      },
      {
        title: "Contact",
        key: "phone",
        render: (_, row) => (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} /> {row.phone}
          </div>
        ),
      },
      {
        title: "Application Date",
        dataIndex: "applicationDate",
        key: "applicationDate",
        className: "text-gray-600",
      },
      {
        title: "Loan Type",
        dataIndex: "loanType",
        key: "loanType",
        render: (v) => loanTypeToTableShort(v),
      },
      {
        title: "Loan Amount",
        dataIndex: "loanAmount",
        key: "loanAmount",
        render: (v) => <span className="font-semibold">{v}</span>,
      },
      {
        title: "Disburse Amount",
        dataIndex: "disburseAmount",
        key: "disburseAmount",
        render: (v) => <span className="font-semibold">{v}</span>,
      },
      {
        title: "Payout",
        key: "payout",
        render: (_, row) => (
          <span className="font-semibold">
            {row.payoutAmount
              ? `₹${Number(row.payoutAmount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "—"}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (s) => <LoanStatusBadge status={s} />,
      },
    ],
    []
  );

  return (
    <DashboardTablePage
      title="Applications"
      subtitle={`${filteredCustomers.length} record${filteredCustomers.length !== 1 ? "s" : ""} found`}
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
                placeholder="Search by name, ID, or phone..."
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
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 md:py-3"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      }
    >
      <AppAntTable
        rowKey={(row) => String(row.id)}
        columns={columns}
        dataSource={filteredCustomers}
        locale={{
          emptyText: (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
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
};

export default Application;
