import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Search, Calendar, Award, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchPartnerDashboard } from "../../../feature/thunks/partnerThunks";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";

const IncentiveHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading } = useSelector(
    (state) => state.partner.dashboard || { data: null, loading: false }
  );

  useEffect(() => {
    // dashboard already includes incentives array
    dispatch(fetchPartnerDashboard());
  }, [dispatch]);

  const incentives = Array.isArray(data?.incentives) ? data.incentives : [];

  const filtered = incentives.filter((inv) => {
    const date = new Date(inv.createdAt || inv.updatedAt || Date.now());
    const sameYear = date.getFullYear() === Number(year);
    const sameMonth = date.getMonth() + 1 === Number(month);
    const term = searchTerm.toLowerCase();
    const matchesText =
      !term ||
      inv.status?.toLowerCase().includes(term) ||
      String(inv.amount || 0).includes(term);

    return sameYear && sameMonth && matchesText;
  });

  const sortedFiltered = sortNewestFirst(filtered, { dateKeys: ["createdAt", "updatedAt"] });

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
          <h1 className="text-3xl font-bold text-gray-900">Incentive History</h1>
          <p className="text-gray-600 mt-1">
            View all incentives you have earned, by month and year.
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
              placeholder="Search by amount or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
              min="2020"
              max="2100"
            />

            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "short" })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Incentives (Paid)
              </p>
              <p className="text-2xl font-bold text-purple-700 mt-2">
                {formatCurrency(
                  sortedFiltered
                    .filter((i) => i.status === "PAID")
                    .reduce((sum, i) => sum + (i.amount || 0), 0)
                )}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Award size={24} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-sm bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Month / Year</th>
                <th className="px-3 py-3 text-left">Basis</th>
                <th className="px-3 py-3 text-left">Amount</th>
                <th className="px-3 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    Loading incentives...
                  </td>
                </tr>
              ) : sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No incentives found for this month/year.
                  </td>
                </tr>
              ) : (
                sortedFiltered.map((inv) => {
                  const dateObj = new Date(inv.createdAt || inv.updatedAt || Date.now());
                  const monthName = dateObj.toLocaleString("default", {
                    month: "short",
                  });
                  const y = dateObj.getFullYear();

                  return (
                    <tr key={inv._id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-3 align-middle text-xs">
                        {dateObj.toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-3 py-3 align-middle text-xs">
                        {monthName} / {y}
                      </td>
                      <td className="px-3 py-3 align-middle text-xs">
                        {inv.basis === "PERCENT"
                          ? `Percent (${inv.percentValue || 0}%)`
                          : inv.basis === "FIXED"
                          ? "Fixed"
                          : "-"}
                      </td>
                      <td className="px-3 py-3 align-middle font-semibold">
                        {formatCurrency(inv.amount || 0)}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            inv.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncentiveHistory;


