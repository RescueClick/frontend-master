import React, { useEffect, useState } from "react";
import { ArrowLeft, Search, Calendar, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { matchesSearchTerm } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";

const PayoutHistory = () => {
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { partnerToken } = getAuthData();

        const params = { year };
        if (month) params.month = month;

        const res = await axios.get(
          `${backendurl}/partner/payouts/history`,
          {
            params,
            headers: {
              ...(partnerToken ? { Authorization: `Bearer ${partnerToken}` } : {}),
            },
          }
        );

        setRows(Array.isArray(res.data?.payouts) ? res.data.payouts : []);
      } catch (err) {
        console.error("Error fetching payout history:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [year, month]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filtered = rows.filter((row) => {
    const date = row.createdAt ? new Date(row.createdAt) : null;
    const rowYear = date ? date.getFullYear() : null;
    const rowMonth = date ? date.getMonth() + 1 : null;

    const sameYear = !year || rowYear === Number(year);
    const sameMonth = !month || rowMonth === Number(month);

    const matchesText = matchesSearchTerm(searchTerm, [
      row?.application?.appNo,
      row?.application?.loanType,
      row?.amount,
    ]);

    return sameYear && sameMonth && matchesText;
  });

  const sortedFiltered = sortNewestFirst(filtered, { dateKeys: ["createdAt"] });

  const totalPaid = sortedFiltered.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate("/partner/dashboard")}
              className="flex items-center text-lg text-gray-600 hover:text-gray-800 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Payout History</h1>
          <p className="text-gray-600 mt-1">
            See how much payout you received each month.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative w-full md:w-auto">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by month or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
            >
              <option value="">All months</option>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
              min="2020"
              max="2100"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Payout (Filtered Months)
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-2">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <IndianRupee size={24} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-sm bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Application No</th>
                <th className="px-3 py-3 text-left">Loan Type</th>
                <th className="px-3 py-3 text-left">Approved Amount</th>
                <th className="px-3 py-3 text-left">Payout Amount</th>
                <th className="px-3 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    Loading payouts...
                  </td>
                </tr>
              ) : sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No payout data found for this filter.
                  </td>
                </tr>
              ) : (
                sortedFiltered.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-3 align-middle text-xs">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      {row.application?.appNo || "-"}
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      {row.application?.loanType || "-"}
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      {formatCurrency(
                        row.application?.approvedLoanAmount || 0
                      )}
                    </td>
                    <td className="px-3 py-3 align-middle font-semibold">
                      {formatCurrency(row.amount || 0)}
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {row.status || "DONE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayoutHistory;


