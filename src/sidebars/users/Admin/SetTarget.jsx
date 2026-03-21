import React, { useState, useEffect } from "react";
import { Target, FileText, IndianRupee, Info, Save, TrendingUp, Users, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { useDispatch } from "react-redux";
import { distributeHierarchicalTargets } from "../../../feature/thunks/adminThunks";

const SetTarget = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalCompanyTarget: 24000000, // ₹24,00,000 default
    partnerFileCountTarget: 4,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchTargetPolicy();
  }, []);

  const fetchTargetPolicy = async () => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/target-policy`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      setFormData((prev) => ({
        ...prev,
        partnerFileCountTarget: response.data.fileCountTarget || 4,
        // Note: totalCompanyTarget is set per distribution, not from policy
      }));
    } catch (err) {
      console.error("Error fetching target policy:", err);
      // Use defaults if fetch fails
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.partnerFileCountTarget || formData.partnerFileCountTarget < 1) {
      toast.error("Partner File Count Target must be at least 1");
      return;
    }

    if (!formData.totalCompanyTarget || formData.totalCompanyTarget <= 0) {
      toast.error("Total Company Target must be greater than 0");
      return;
    }

    // Minimum realistic company target (₹10,00,000 = ₹10 Lakhs)
    const MIN_COMPANY_TARGET = 1000000;
    if (formData.totalCompanyTarget < MIN_COMPANY_TARGET) {
      toast.error(`Total Company Target must be at least ${formatCurrency(MIN_COMPANY_TARGET)} (₹10 Lakhs)`);
      return;
    }

    setLoading(true);

    try {
      const { adminToken } = getAuthData();
      
      if (!adminToken) {
        toast.error("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      // Step 1: Save global target policy (file count only - disbursement is top-down distributed)
      await axios.post(
        `${backendurl}/admin/target-policy`,
        {
          fileCountTarget: Number(formData.partnerFileCountTarget),
          // disbursementTarget is optional in top-down model
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Step 2: Distribute hierarchical targets (top-down)
      const distributionResult = await dispatch(
        distributeHierarchicalTargets({
          month: Number(formData.month),
          year: Number(formData.year),
          totalCompanyTarget: Number(formData.totalCompanyTarget),
          partnerFileCountTarget: Number(formData.partnerFileCountTarget),
        })
      ).unwrap();

      const summary = distributionResult.distributionSummary || {};
      toast.success(
        `Targets distributed successfully! Total: ${formatCurrency(formData.totalCompanyTarget)} → ${summary.asmCount || 0} ASMs → ${summary.rsmCount || 0} RSMs → ${summary.rmCount || 0} RMs → ${summary.partnerCount || 0} Partners. ${distributionResult.totalAssignments || 0} targets assigned for ${new Date(0, formData.month - 1).toLocaleString('en-US', { month: 'long' })} ${formData.year}.`
      );
    } catch (err) {
      console.error("Error setting targets:", err);
      const errorMessage = err?.message || err.response?.data?.message || "Failed to set targets. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading target policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Target Management</h1>
          <p className="text-gray-600">Set total company target and distribute it top-down across the hierarchy</p>
        </div>

        {/* Info Card - Target Hierarchy */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Target Assignment Hierarchy</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Admin:</span>
                  <span>Sets total company target, system divides it equally down the hierarchy (Top-Down Model)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">ASM:</span>
                  <span>Assigns targets to Partners (both file count & disbursement)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">RSM:</span>
                  <span>Monitors RM performance (disbursement targets only)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">RM:</span>
                  <span>Monitors partner progress (can view partner file counts for monitoring)</span>
                </div>
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <p className="font-semibold text-blue-900">Industry Best Practice:</p>
                  <p className="text-xs text-blue-800 mt-1">
                    <strong>File Count</strong> = Operational metric (Partners only) | 
                    <strong> Disbursement</strong> = Business metric (All roles, rolls up hierarchically)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Target Management Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-brand-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Set & Distribute Targets</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Month and Year Selection */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
                <label className="text-lg font-semibold text-gray-700">
                  Target Period
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="month" className="block text-sm font-medium text-gray-600 mb-2">
                    Month
                  </label>
                  <select
                    id="month"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  >
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map((m, i) => (
                      <option key={i + 1} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-600 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                    min="2020"
                    max="2100"
                  />
                </div>
              </div>
            </div>

            {/* Total Company Target */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-lg font-semibold text-gray-700 block">
                    Total Company Target
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Top-Down Distribution Model</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Set the total monthly disbursement target for the entire company. The system will automatically divide it equally among <strong>ASMs → RSMs → RMs → Partners</strong>.
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-xl z-10">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="totalCompanyTarget"
                    value={formData.totalCompanyTarget}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold bg-white transition-all"
                    required
                    min="1000000"
                    step="100000"
                    placeholder="24000000"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Minimum:</span>
                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(1000000)}</span>
                  </div>
                  {formData.totalCompanyTarget > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Current:</span>
                      <span className="text-xs font-bold text-blue-600">{formatCurrency(formData.totalCompanyTarget)}</span>
                    </div>
                  )}
                </div>
                {formData.totalCompanyTarget > 0 && formData.totalCompanyTarget < 1000000 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-red-600 text-sm">⚠️</span>
                    <p className="text-xs text-red-600 font-medium">
                      Minimum target is ₹10,00,000 (₹10 Lakhs)
                    </p>
                  </div>
                )}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Example:</strong> If you set ₹24,00,000, it will be divided equally among all ASMs, then each ASM's portion divided among their RSMs, and so on down to Partners.
                  </p>
                </div>
              </div>
            </div>

            {/* Partner File Count Target */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-brand-primary flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-lg font-semibold text-gray-700 block">
                    Partner File Count Target
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Operational Metric (Partners Only)</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Minimum number of loan files each partner must submit per month to qualify for incentives.
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="number"
                    name="partnerFileCountTarget"
                    value={formData.partnerFileCountTarget}
                    onChange={handleChange}
                    className="w-full px-4 py-4 pr-20 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-lg font-semibold bg-white transition-all"
                    required
                    min="1"
                    step="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                    files/month
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Partners must achieve both file count and disbursement targets to qualify for incentives.
                </p>
              </div>
            </div>

            {/* Distribution Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-1">Top-Down Distribution Flow</p>
                  <p className="text-xs text-green-800">
                    <strong>Total Company Target:</strong> {formatCurrency(formData.totalCompanyTarget)}
                    <br />
                    ↓ Divides equally among ASMs
                    <br />
                    ↓ Each ASM target divides equally among their RSMs
                    <br />
                    ↓ Each RSM target divides equally among their RMs
                    <br />
                    ↓ Each RM target divides equally among their Partners
                    <br />
                    <br />
                    <strong>Partners receive:</strong> {formData.partnerFileCountTarget} files + calculated disbursement amount
                    <br />
                    <strong>RM/RSM/ASM receive:</strong> Disbursement only (calculated from below)
                  </p>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This uses a <strong>Top-Down Distribution Model</strong>. The total company target is divided equally at each level. 
                Partners must achieve <strong>both</strong> file count ({formData.partnerFileCountTarget} files) and their calculated disbursement target to qualify for incentives. 
                Higher roles (RM/RSM/ASM) focus on disbursement targets only.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-brand-primary to-brand-primary-hover hover:from-brand-primary-hover hover:to-brand-primary hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Setting & Distributing Targets...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Set & Distribute Targets
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default SetTarget;
