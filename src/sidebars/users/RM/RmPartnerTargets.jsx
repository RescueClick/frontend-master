import React, { useState, useEffect } from "react";
import { Target, FileText, IndianRupee, Search, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRmPartnerTargets } from "../../../feature/thunks/rmThunks";

const RmPartnerTargets = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data: partnerTargets = [], loading } = useSelector(
    (state) => state.rm?.partnerTargets || { data: [], loading: false }
  );

  useEffect(() => {
    dispatch(fetchRmPartnerTargets({ year, month }));
  }, [dispatch, year, month]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTargets = partnerTargets.filter((partner) => {
    const term = searchTerm.toLowerCase();
    return (
      partner.partnerName?.toLowerCase().includes(term) ||
      partner.partnerEmployeeId?.toLowerCase().includes(term) ||
      partner.partnerEmail?.toLowerCase().includes(term)
    );
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Targets</h1>
          <p className="text-gray-600">Monitor partner targets and achievements</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
                />
              </div>
            </div>

            {/* Month */}
            <div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#12B99C] focus:border-transparent appearance-none"
                >
                  {months.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year */}
            <div>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
                min="2020"
                max="2100"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#12B99C] text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Partner</th>
                  <th className="px-6 py-4 text-left font-semibold">File Target</th>
                  <th className="px-6 py-4 text-left font-semibold">Files Achieved</th>
                  <th className="px-6 py-4 text-left font-semibold">Disbursement Target</th>
                  <th className="px-6 py-4 text-left font-semibold">Disbursement Achieved</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-[#12B99C] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-gray-600">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTargets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No partners found
                    </td>
                  </tr>
                ) : (
                  filteredTargets.map((partner) => (
                    <tr key={partner.partnerId} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* Partner Info */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{partner.partnerName}</p>
                          <p className="text-xs text-gray-500">{partner.partnerEmployeeId}</p>
                          <p className="text-xs text-gray-400">{partner.partnerEmail}</p>
                        </div>
                      </td>

                      {/* File Target */}
                      <td className="px-6 py-4">
                        <span className="font-semibold">{partner.fileCountTarget} files</span>
                      </td>

                      {/* Files Achieved */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            partner.achievedFileCount >= partner.fileCountTarget
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}>
                            {partner.achievedFileCount}
                          </span>
                          {partner.fileTargetMet ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                      </td>

                      {/* Disbursement Target */}
                      <td className="px-6 py-4">
                        <span className="font-semibold">{formatCurrency(partner.disbursementTarget)}</span>
                      </td>

                      {/* Disbursement Achieved */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            partner.achievedDisbursement >= partner.disbursementTarget
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}>
                            {formatCurrency(partner.achievedDisbursement)}
                          </span>
                          {partner.disbursementTargetMet ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {partner.targetAchieved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Achieved
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RmPartnerTargets;

