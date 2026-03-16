import React, { useState, useEffect } from "react";
import { Target, FileText, IndianRupee, Search, Edit, Save, X, Calendar, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminPartnerTargets, assignAdminPartnerTarget } from "../../../feature/thunks/adminThunks";
import toast from "react-hot-toast";

const PartnerTargets = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editForm, setEditForm] = useState({ fileCountTarget: 4, disbursementTarget: 2000000 });

  const { data: partnerTargets = [], loading } = useSelector(
    (state) => state.admin?.partnerTargets || { data: [], loading: false }
  );

  useEffect(() => {
    dispatch(fetchAdminPartnerTargets({ year, month }));
  }, [dispatch, year, month]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner.partnerId);
    setEditForm({
      fileCountTarget: partner.fileCountTarget || 4,
      disbursementTarget: partner.disbursementTarget || 2000000,
    });
  };

  const handleCancelEdit = () => {
    setEditingPartner(null);
    setEditForm({ fileCountTarget: 4, disbursementTarget: 2000000 });
  };

  const handleSaveTarget = async (partnerId) => {
    try {
      await dispatch(
        assignAdminPartnerTarget({
          partnerId,
          month,
          year,
          fileCountTarget: editForm.fileCountTarget,
          disbursementTarget: editForm.disbursementTarget,
        })
      ).unwrap();
      toast.success("Target assigned successfully!");
      setEditingPartner(null);
      dispatch(fetchAdminPartnerTargets({ year, month }));
    } catch (err) {
      toast.error(err || "Failed to assign target");
    }
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
          <p className="text-gray-600">Manage and assign targets for all partners</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
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
                  <th className="px-6 py-4 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-[#12B99C] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-gray-600">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTargets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
                        {editingPartner === partner.partnerId ? (
                          <input
                            type="number"
                            value={editForm.fileCountTarget}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                fileCountTarget: Number(e.target.value),
                              }))
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#12B99C]"
                            min="1"
                          />
                        ) : (
                          <span className="font-semibold">{partner.fileCountTarget} files</span>
                        )}
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
                        {editingPartner === partner.partnerId ? (
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={editForm.disbursementTarget}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  disbursementTarget: Number(e.target.value),
                                }))
                              }
                              className="w-32 pl-8 pr-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#12B99C]"
                              min="0"
                              step="10000"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold">{formatCurrency(partner.disbursementTarget)}</span>
                        )}
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

                      {/* Action */}
                      <td className="px-6 py-4">
                        {editingPartner === partner.partnerId ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveTarget(partner.partnerId)}
                              className="p-2 bg-[#12B99C] text-white rounded-lg hover:bg-[#0d8a73] transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(partner)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
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

export default PartnerTargets;

