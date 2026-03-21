import React, { useState, useEffect } from "react";
import { Target, FileText, IndianRupee, Calendar, TrendingUp, CheckCircle, XCircle, Award } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyTarget } from "../../../feature/thunks/partnerThunks";

const MyTarget = () => {
  const dispatch = useDispatch();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data: targetData, loading } = useSelector(
    (state) => state.partner?.myTarget || { data: null, loading: false }
  );

  useEffect(() => {
    dispatch(fetchMyTarget({ year, month }));
  }, [dispatch, year, month]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const months = [
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
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading target information...</p>
        </div>
      </div>
    );
  }

  if (!targetData) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Target Assigned</h2>
            <p className="text-gray-600">Your target for this month has not been assigned yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const fileProgress =
    targetData.fileCountTarget > 0
      ? (targetData.achievedFileCount / targetData.fileCountTarget) * 100
      : 0;
  const disbursementProgress =
    targetData.disbursementTarget > 0
      ? (targetData.achievedDisbursement / targetData.disbursementTarget) * 100
      : 0;
  const overallProgress = Math.min(fileProgress, disbursementProgress);

  const isIncentiveEligible =
    targetData.targetExceeded && targetData.targetAchieved;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">My Target</h1>
            <p className="text-gray-600">
              View your monthly targets and achievements
            </p>
          </div>
          {isIncentiveEligible && (
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-purple-50 border border-purple-200 px-3 py-1">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800">
                Congratulations! You&apos;re eligible for incentives this month.
              </span>
            </div>
          )}
        </div>

        {/* Month/Year Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent appearance-none"
                >
                  {months.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                min="2020"
                max="2100"
              />
            </div>
          </div>
        </div>

        {/* Target Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* File Count Target */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">File Count Target</h3>
                <p className="text-sm text-gray-600">Minimum files to submit</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {targetData.achievedFileCount} / {targetData.fileCountTarget}
                </span>
                <span className={`text-sm font-medium ${
                  targetData.fileTargetMet ? "text-green-600" : "text-orange-600"
                }`}>
                  {targetData.fileAchievementPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    targetData.fileTargetMet ? "bg-green-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(fileProgress, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {targetData.fileTargetMet ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Target Met</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Target Pending</span>
                </>
              )}
            </div>
          </div>

          {/* Disbursement Target */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Disbursement Target</h3>
                <p className="text-sm text-gray-600">Minimum disbursement amount</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(targetData.achievedDisbursement)} / {formatCurrency(targetData.disbursementTarget)}
                </span>
                <span className={`text-sm font-medium ${
                  targetData.disbursementTargetMet ? "text-green-600" : "text-orange-600"
                }`}>
                  {targetData.disbursementAchievementPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    targetData.disbursementTargetMet ? "bg-green-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(disbursementProgress, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {targetData.disbursementTargetMet ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Target Met</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Target Pending</span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-brand-primary bg-opacity-10 rounded-lg">
              <Target className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Target Status</h3>
              <p className="text-sm text-gray-600">Combined progress</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {overallProgress.toFixed(1)}%
              </span>
              {targetData.targetAchieved ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Target Achieved
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Target Pending
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  targetData.targetAchieved ? "bg-green-500" : "bg-orange-500"
                }`}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Incentive Eligibility */}
          {targetData.targetExceeded && targetData.targetAchieved && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Eligible for Incentives!</span>
              </div>
              <p className="text-sm text-purple-700">
                You have exceeded your targets! You are eligible for incentive bonuses based on your performance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTarget;

