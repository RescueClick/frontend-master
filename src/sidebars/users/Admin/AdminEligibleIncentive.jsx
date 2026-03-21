import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Search, CheckCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchAdminIncentives,
  payAdminIncentive,
} from "../../../feature/thunks/adminThunks";
import toast from "react-hot-toast";

const AdminEligibleIncentive = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncentive, setSelectedIncentive] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [year, setYear] = useState(location.state?.year || new Date().getFullYear());
  const [month, setMonth] = useState(location.state?.month || new Date().getMonth() + 1);

  const { data = [], loading, error } = useSelector(
    (state) =>
      state.admin?.incentives || { data: [], loading: false, error: null }
  );

  useEffect(() => {
    dispatch(fetchAdminIncentives({ status: "PENDING", year, month }));
  }, [dispatch, year, month]);

  const incentives = Array.isArray(data) ? data : [];

  const filtered = incentives.filter((row) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      row.partnerName?.toLowerCase().includes(term) ||
      row.partnerEmployeeId?.toLowerCase().includes(term)
    );
  });

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePay = async (id) => {
    try {
      setIsPaying(true);
      await dispatch(payAdminIncentive(id)).unwrap();
      toast.success("Incentive marked as paid");
      dispatch(fetchAdminIncentives({ status: "PENDING", year, month }));
      setSelectedIncentive(null);
    } catch (err) {
      toast.error(err || "Failed to pay incentive");
    } finally {
      setIsPaying(false);
    }
  };

  const eligibleCount = filtered.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Eligible Incentives</h1>
          <p className="text-gray-600 mt-1">
            Partners who exceeded their targets and are ready for incentive payment.
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
              placeholder="Search by partner name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 text-sm">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", {
                    month: "short",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Eligible Incentives
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {eligibleCount}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {selectedIncentive && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
                onClick={() => !isPaying && setSelectedIncentive(null)}
                disabled={isPaying}
              >
                ×
              </button>

              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Create Incentive Payment
              </h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Partner</p>
                  <p className="font-semibold">
                    {selectedIncentive.partnerName}{" "}
                    <span className="text-xs text-gray-500">
                      ({selectedIncentive.partnerEmployeeId})
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 mb-1">Month / Year</p>
                    <p className="font-semibold">
                      {selectedIncentive.month}/{selectedIncentive.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">ASM</p>
                    <p className="font-semibold">
                      {selectedIncentive.asmName || "-"}{" "}
                      <span className="text-xs text-gray-500">
                        {selectedIncentive.asmEmployeeId}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 mb-1">Files (Target / Achieved)</p>
                    <p className="font-semibold">
                      {selectedIncentive.achievedFileCount} /{" "}
                      {selectedIncentive.fileCountTarget}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">
                      Disbursement (Target / Achieved)
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(selectedIncentive.achievedDisbursement)} /{" "}
                      {formatCurrency(selectedIncentive.disbursementTarget)}
                    </p>
                  </div>
                </div>

                {/* Two conceptual ways of payment (basis) */}
                <div className="border rounded-xl p-3 bg-gray-50">
                  <p className="text-gray-700 font-semibold mb-2">
                    Payment Basis
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        disabled
                        checked={selectedIncentive.basis === "PERCENT"}
                        readOnly
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold">
                          Percentage of disbursement
                        </p>
                        <p className="text-gray-500">
                          {selectedIncentive.basis === "PERCENT"
                            ? `Percent value: ${selectedIncentive.percentValue || 0}%`
                            : "Not used for this incentive"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        disabled
                        checked={selectedIncentive.basis === "FIXED"}
                        readOnly
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold">Fixed amount</p>
                        <p className="text-gray-500">
                          {selectedIncentive.basis === "FIXED"
                            ? `Fixed incentive amount decided by ASM`
                            : "Not used for this incentive"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">Final Incentive Amount</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedIncentive.amount)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => !isPaying && setSelectedIncentive(null)}
                  disabled={isPaying}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePay(selectedIncentive.id)}
                  disabled={isPaying}
                  className={`px-4 py-2 text-sm rounded-lg text-white flex items-center gap-2 ${
                    isPaying
                      ? "bg-emerald-700/70 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isPaying ? "Processing..." : "Confirm & Mark Paid"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg shadow-sm bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="px-2 py-3 text-left">Partner</th>
                <th className="px-2 py-3 text-left">ASM</th>
                <th className="px-2 py-3 text-left">Month</th>
                <th className="px-2 py-3 text-left">Target / Achieved</th>
                <th className="px-2 py-3 text-left">Basis</th>
                <th className="px-2 py-3 text-left">Incentive Amount</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    Loading incentives...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No incentives found
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-3 align-top">
                      <div>
                        <p className="font-medium">{row.partnerName}</p>
                        <p className="text-xs text-gray-500">
                          {row.partnerEmployeeId}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top text-xs text-gray-500">
                      —
                    </td>
                    <td className="px-2 py-3 align-middle text-xs">
                      {month}/{year}
                    </td>
                    <td className="px-2 py-3 align-middle text-xs">
                      <div>
                        <p>
                          Files:{" "}
                          <span className="font-semibold">
                            {row.achievedFileCount} / {row.fileCountTarget}
                          </span>
                        </p>
                        <p>
                          Disb:{" "}
                          <span className="font-semibold">
                            {formatCurrency(row.achievedDisbursement)} /{" "}
                            {formatCurrency(row.disbursementTarget)}
                          </span>
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle text-xs">
                      {row.basis === "PERCENT"
                        ? `Percent (${row.percentValue || 0}%)`
                        : row.basis === "FIXED"
                        ? "Fixed"
                        : "-"}
                    </td>
                    <td className="px-2 py-3 align-middle font-semibold">
                      {formatCurrency(row.proposedAmount || row.incentiveAmount)}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        {row.incentiveStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
                        onClick={() => setSelectedIncentive(row)}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Create Payment
                      </button>
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

export default AdminEligibleIncentive;


