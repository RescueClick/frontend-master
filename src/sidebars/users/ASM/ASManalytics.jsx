import React, { useCallback, useEffect, useMemo } from 'react'
import { Users, DollarSign, UserCheck, Banknote, TrendingUp, IndianRupee, FileText } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchRsmAnalytics } from '../../../feature/thunks/asmThunks';
import { designSystem, formatCurrency, formatNumber } from '../../../utils/designSystem';
import { parseAnalyticsData } from '../../../utils/analyticsParser';
import MetricCard from '../../../components/shared/MetricCard';


const ASManalytics = () => {

  const navigate = useNavigate();


  const dispatch = useDispatch();

  // Access state from Redux
  const { loading, error, data } = useSelector(
    (state) => state.asm.rsmAnalytics || { loading: false, error: null, data: null }
  );

  const location = useLocation();
  const { id, role } = location.state || {};

  // Call API when component mounts
  useEffect(() => {
    if (!id) {
      console.error("No RSM ID provided in navigation state");
      return;
    }
    dispatch(fetchRsmAnalytics(id)); // Fetch RSM analytics
  }, [dispatch, id]);

  // Process analytics data using universal parser
  const parsedData = useMemo(() => parseAnalyticsData(data, "RSM"), [data]);
  
  const analyticsData = useMemo(() => {
    return {
      rsm: {
        id: parsedData.profile.userId,
        name: parsedData.profile.name,
        email: parsedData.profile.email,
        phone: parsedData.profile.phone,
        employeeId: parsedData.profile.employeeId,
        rsmType: "N/A",
      },
      totals: {
        totalRMs: parsedData.totals.totalRMs || parsedData.totals.rms || 0,
        totalPartners: parsedData.totals.partners || 0,
        totalApplications: parsedData.totals.totalApplications || 0,
        disbursedApplications: parsedData.totals.disbursedApplications || 0,
        inProcessApplications: parsedData.totals.inProcessApplications || 0,
        totalDisbursed: parsedData.totalDisbursed,
        totalRevenue: parsedData.totalDisbursed,
      },
      monthlyPerformance: parsedData.monthlyPerformance || [],
      targetValue: parsedData.assignedTarget.targetValue,
      achievedValue: parsedData.assignedTarget.achievedValue || parsedData.totalDisbursed,
      performancePercentage: parsedData.performancePercentage,
      performance: parsedData.performance
    };
  }, [parsedData]);


  // Format currency helper
  const formatCurrencyHelper = useCallback((value) => {
    return formatCurrency(value);
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#12B99C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading RSM analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: designSystem.colors.background }}>
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
          <div className="bg-red-100 text-red-600 w-16 h-16 flex items-center justify-center rounded-full text-4xl shadow-sm mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#12B99C] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0EA688] transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* RSM Info Card */}
        <div className={`${designSystem.card.base} ${designSystem.card.padding} mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 - Basic Info */}
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: designSystem.colors.text.primary }}>
                {analyticsData?.rsm?.name || "RSM"}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={designSystem.badge.active}>
                  {analyticsData?.rsm?.rsmType || "RSM"}
                </span>
              </div>
            </div>

            {/* Column 2 - Contact Information */}
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: designSystem.colors.secondary }}>
                Contact Information
              </h4>
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>
                    {analyticsData?.rsm?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>
                    {analyticsData?.rsm?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 3 - System Information */}
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: designSystem.colors.secondary }}>
                System Information
              </h4>
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-500">Employee ID</p>
                  <p className="text-sm" style={{ color: designSystem.colors.text.primary }}>
                    {analyticsData?.rsm?.employeeId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards - Linear Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total RMs"
            value={formatNumber(analyticsData?.totals?.totalRMs || 0)}
            icon={UserCheck}
            colorIndex={0}
            subtitle="Relationship Managers"
          />

          <MetricCard
            title="Total Partners"
            value={formatNumber(analyticsData?.totals?.totalPartners || 0)}
            icon={Users}
            colorIndex={1}
            subtitle="Active partners"
          />

          <MetricCard
            title="Target"
            value={formatCurrencyHelper(analyticsData?.targetValue ?? 0)}
            icon={TrendingUp}
            colorIndex={2}
            subtitle="Monthly target"
            isLoading={loading}
          />

          <MetricCard
            title="Total Disbursed"
            value={formatCurrencyHelper(parsedData.totalDisbursed || 0)}
            icon={IndianRupee}
            colorIndex={3}
            subtitle="Disbursed amount"
          />
        </div>

        {/* Performance Section */}
        <div className={`${designSystem.card.base} ${designSystem.card.padding}`}>
          <h2 className="text-xl font-bold mb-6" style={{ color: designSystem.colors.text.primary }}>
            Performance
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{ color: designSystem.colors.text.primary }}>
                {new Date().getFullYear()} Performance
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                analyticsData?.performancePercentage >= 100
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}>
                {Math.min(analyticsData?.performancePercentage || 0, 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-sm mb-2" style={{ color: designSystem.colors.text.secondary }}>
              <span>Disbursed: {formatCurrencyHelper(parsedData.totalDisbursed || 0)}</span>
              <span>Target: {formatCurrencyHelper(parsedData.assignedTarget.targetValue || 0)}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
              {(() => {
                const percentage = Math.min(Math.max(analyticsData?.performancePercentage || 0, 0), 100);
                const displayWidth = percentage > 0 ? Math.max(percentage, 0.5) : 0; // At least 0.5% if > 0 to be visible
                
                return (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage >= 100
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : percentage > 0
                        ? "bg-gradient-to-r from-orange-500 to-orange-600"
                        : "bg-gray-300"
                    }`}
                    style={{
                      width: `${displayWidth}%`,
                      minWidth: percentage > 0 ? '2px' : '0px'
                    }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`Performance: ${percentage.toFixed(2)}%`}
                  />
                );
              })()}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );


}

export default ASManalytics
