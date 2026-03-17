import React, { useState, useEffect } from "react";
import { Search, Award, TrendingUp, Target, CheckCircle, ArrowLeft, IndianRupee } from "lucide-react";
import { fetchAdminIncentives } from "../../../feature/thunks/adminThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

const AdminDoneIncentive = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get year and month from location state or use current
  const [year, setYear] = useState(
    location.state?.year || new Date().getFullYear()
  );
  const [month, setMonth] = useState(
    location.state?.month || new Date().getMonth() + 1
  );

  const { data, loading } = useSelector(
    (state) => state.admin.incentives || { data: [], loading: false }
  );

  useEffect(() => {
    // For admin, use status filter "PAID" (done incentives)
    dispatch(fetchAdminIncentives({ status: "PAID", year, month }));
  }, [dispatch, year, month]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const incentives = Array.isArray(data) ? data : [];

  const filteredIncentives = incentives.filter((incentive) => {
    const term = searchTerm.toLowerCase();
    return (
      incentive.partnerName?.toLowerCase().includes(term) ||
      incentive.partnerEmployeeId?.toLowerCase().includes(term)
    );
  });

  // Admin cannot change status here; this screen is view-only for done incentives

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/admin/incentives")}
            className="flex items-center text-lg text-gray-600 hover:text-gray-800 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Incentives
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Done Incentives</h1>
        <p className="text-gray-600 mt-1">
          Partners whose incentives have been paid for the selected period.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative w-full md:w-auto">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by partner name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 text-sm">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "short" })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Done Incentives</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{filteredIncentives.length}</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Incentives Table */}
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full border-collapse bg-white text-sm">
          <thead style={{ background: colors.primary, color: "white" }}>
            <tr>
              <th className="px-2 py-4 text-left">Partner</th>
              <th className="px-2 py-4 text-left">File Target</th>
              <th className="px-2 py-4 text-left">Files Achieved</th>
              <th className="px-2 py-4 text-left">Disbursement Target</th>
              <th className="px-2 py-4 text-left">Disbursement Achieved</th>
              <th className="px-2 py-4 text-left">Incentive</th>
              <th className="px-2 py-4 text-left">Status</th>
              <th className="px-2 py-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  Loading incentives...
                </td>
              </tr>
            ) : filteredIncentives.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  No done incentives found
                </td>
              </tr>
            ) : (
              filteredIncentives.map((incentive) => {
                const fileTarget = incentive.fileCountTarget ?? 4;
                const disbursementTarget = incentive.disbursementTarget ?? 2000000;
                const filesAchieved =
                  incentive.achievedFileCount ?? incentive.disbursedCount ?? 0;
                const disbursementAchieved =
                  incentive.achievedDisbursement ?? incentive.totalAchieved ?? 0;
                const incentiveAmount = incentive.incentiveAmount ?? 0;
                const incentiveLevel = incentive.incentiveLevel ?? "BASIC";
                
                return (
                  <tr key={incentive.partnerId} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-3 align-top">
                      <div>
                        <p className="font-medium">{incentive.partnerName}</p>
                        <p className="text-xs text-gray-500">{incentive.partnerEmployeeId}</p>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="font-semibold">{fileTarget} files</span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="font-semibold text-green-600">
                        {filesAchieved} / {fileTarget} ✓
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle font-semibold">{formatCurrency(disbursementTarget)}</td>
                    <td className="px-2 py-3 align-middle">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(disbursementAchieved)} ✓
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {incentiveAmount > 0 ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          ₹{incentiveAmount.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Target Met</span>
                      )}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Done
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle text-xs text-gray-500">
                      View Only
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminDoneIncentive;

