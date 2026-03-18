import React, { useMemo, useState, useEffect } from "react";
import { Search, Filter, Eye, Users, Phone, FileText } from "lucide-react";
import { fetchRsmApplications } from "../../../feature/thunks/rsmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { matchesSearchTerm, matchesStatusFilter, normalizeStatus } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";

const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
};

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

  // Helpers for status color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "DISBURSED":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "UNDER_REVIEW":
      case "AGREEMENT":
        return "bg-amber-100 text-amber-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "DOC_COMPLETE":
      case "DOC_SUBMITTED":
        return "bg-purple-100 text-purple-800";
      case "DOC_INCOMPLETE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Manage loan applications assigned to you
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by customer name, ID, phone, email, app number, or RM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100"
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
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white min-w-[160px]"
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
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr style={{ backgroundColor: "rgb(18, 185, 156)" }} className="text-white">
                <th className="px-3 py-3 text-left">App No</th>
                <th className="px-3 py-3 text-left">Customer</th>
                <th className="px-3 py-3 text-left">RM</th>
                <th className="px-3 py-3 text-left">Partner</th>
                <th className="px-3 py-3 text-left">Application Date</th>
                <th className="px-3 py-3 text-left">Loan Type</th>
                <th className="px-3 py-3 text-left">Loan Amount</th>
                <th className="px-3 py-3 text-left">Approved Amount</th>
                <th className="px-3 py-3 text-left">Payout</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#12B99C]"></div>
                      Loading applications...
                    </div>
                  </td>
                </tr>
              ) : filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-4 font-mono text-xs">
                      {app.appNo || "N/A"}
                    </td>
                    <td className="px-3 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{app.customerName}</p>
                        <p className="text-xs text-gray-500">{app.customerId}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {app.customerPhone}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{app.rmName}</p>
                        <p className="text-xs text-gray-500">{app.rmEmployeeId}</p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm text-gray-600">
                        {app.partnerName || "Direct"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {app.applicationDate}
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm">{app.loanType}</span>
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {formatCurrency(app.loanAmount)}
                    </td>
                    <td className="px-3 py-4 font-semibold text-green-600">
                      {app.approvedLoanAmount > 0
                        ? formatCurrency(app.approvedLoanAmount)
                        : "-"}
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {app.payoutAmount
                        ? formatCurrency(app.payoutAmount)
                        : "—"}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {app.status === "DRAFT" ? "SUBMITTED" : app.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <button
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-12">
                    <div className="text-gray-500">
                      <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        No applications found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

