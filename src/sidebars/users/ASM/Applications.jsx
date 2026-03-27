import React, { useMemo, useState, useEffect } from "react";
import { Search, Filter, Eye, Users, Phone } from "lucide-react";
import { fetchAsmApplications } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { matchesSearchTerm, matchesStatusFilter, normalizeStatus } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import { getLoanStatusBadgeClass, getLoanStatusLabel } from "../../../utils/loanStatus";

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


  const colors = {
    primary: "var(--color-brand-primary)",
    secondary: "#1E3A8A",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">applications</h1>
        {/* <p className="text-gray-600 mt-1">Manage your customer database</p> */}
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
              placeholder="Search by name, ID, or phone..."
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
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold" style={{ color: colors.secondary }}>
            Customer Directory
          </h2>
        </div> */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr style={{backgroundColor: "rgb(18, 185, 156)"}} className="text-white">
                <th className="px-3 py-3 text-left ">User Name</th>
                <th className="px-3 py-3 text-left">User ID</th>
                <th className="px-3 py-3 text-left">Contact</th>
                <th className="px-3 py-3 text-left">Application Date</th>
                <th className="px-3 py-3 text-left">Loan Type</th>
                <th className="px-3 py-3 text-left">Loan Amount</th>
                <th className="px-3 py-3 text-left">Disburse Amount</th>
                <th className="px-3 py-3 text-left">Payout</th>
                <th className="px-3 py-3 text-left">Status</th>
                {/* <th className="px-3 py-3 text-left">Action</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-4 font-medium">{customer.name}</td>
                  <td className="px-3 py-4 text-gray-600">
                    {customer.id ? customer.id : "N/A"}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} /> {customer.phone}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-gray-600">
                    {customer.applicationDate}
                  </td>
                  <td className="px-3 py-4">{customer.loanType}</td>
                  <td className="px-3 py-4 font-semibold">
                    {customer.loanAmount}
                  </td>
                  <td className="px-3 py-4 font-semibold">
                    {customer.disburseAmount}
                  </td>
                  <td className="px-3 py-4 font-semibold">
                    {customer.payoutAmount
                      ? `₹${Number(customer.payoutAmount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getLoanStatusBadgeClass(
                        getLoanStatusLabel(customer.status)
                      )}`}
                    >
                      {getLoanStatusLabel(customer.status)}
                    </span>
                  </td>
                  {/* <td className="px-3 py-4">
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Eye size={16} />
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              No applications found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Application;
