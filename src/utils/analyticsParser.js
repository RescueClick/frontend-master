/**
 * Universal Analytics Parser
 * Handles all backend analytics response formats and normalizes them to a consistent structure
 */

/**
 * Parse analytics data from any backend response format
 * @param {Object} rawData - Raw data from backend (can be nested or flat)
 * @param {String} role - User role (ASM, RSM, RM, PARTNER)
 * @returns {Object} Normalized analytics data
 */
export const parseAnalyticsData = (rawData, role = "ASM") => {
  // Default empty structure
  const defaultData = {
    profile: {
      userId: null,
      name: role,
      email: "N/A",
      phone: "N/A",
      employeeId: "N/A",
      status: "UNKNOWN",
    },
    totals: {
      rms: 0,
      totalRMs: 0,
      rsms: 0,
      totalRSMs: 0,
      partners: 0,
      customers: 0,
      totalApplications: 0,
      disbursedApplications: 0,
      inProcessApplications: 0,
    },
    assignedTarget: {
      targetValue: 0,
      achievedValue: 0,
      month: null,
      year: null,
    },
    totalDisbursed: 0,
    performance: "0.00%",
    performancePercentage: 0,
    monthlyPerformance: [],
  };

  if (!rawData) {
    return defaultData;
  }

  // Handle nested structure: { data: { profile, analytics } }
  let responseData = rawData;
  if (rawData.data) {
    responseData = rawData.data;
  }

  // Extract profile - can be in multiple locations
  let profile = {};
  if (responseData.profile) {
    profile = responseData.profile;
  } else if (responseData.rm) {
    // RSM analytics format
    profile = {
      userId: responseData.rm.id || responseData.rm._id,
      name: responseData.rm.name,
      email: responseData.rm.email || "N/A",
      phone: responseData.rm.phone || "N/A",
      employeeId: responseData.rm.employeeId || "N/A",
      status: responseData.rm.status || "ACTIVE",
    };
  } else if (responseData.rsm) {
    // ASM analytics format
    profile = {
      userId: responseData.rsm.id || responseData.rsm._id,
      name: responseData.rsm.name,
      email: responseData.rsm.email || "N/A",
      phone: responseData.rsm.phone || "N/A",
      employeeId: responseData.rsm.employeeId || "N/A",
      status: responseData.rsm.status || "ACTIVE",
    };
  }

  // Extract analytics - can be in multiple locations
  let analytics = {};
  if (responseData.analytics) {
    analytics = responseData.analytics;
  } else {
    // Old format - analytics data is at root level
    analytics = responseData;
  }

  // Extract totals
  const totals = analytics.totals || {};
  
  // Extract assignedTarget - handle both object and number formats
  let assignedTarget = { targetValue: 0, achievedValue: 0, month: null, year: null };
  if (analytics.assignedTarget) {
    if (typeof analytics.assignedTarget === 'object' && analytics.assignedTarget !== null) {
      assignedTarget = {
        targetValue: Number(analytics.assignedTarget.targetValue || analytics.assignedTarget.target || 0),
        achievedValue: Number(analytics.assignedTarget.achievedValue || analytics.assignedTarget.achieved || 0),
        month: analytics.assignedTarget.month || null,
        year: analytics.assignedTarget.year || null,
      };
    } else if (typeof analytics.assignedTarget === 'number') {
      assignedTarget.targetValue = Number(analytics.assignedTarget);
    }
  }

  // Extract totalDisbursed - check multiple locations with priority order
  // Priority: analytics.totalDisbursed > analytics.totals.totalDisbursed > totals.totalDisbursed > totals.totalRevenue > assignedTarget.achievedValue
  let totalDisbursed = 0;
  
  if (analytics.totalDisbursed !== undefined && analytics.totalDisbursed !== null) {
    totalDisbursed = Number(analytics.totalDisbursed);
  } else if (analytics.totals?.totalDisbursed !== undefined && analytics.totals.totalDisbursed !== null) {
    totalDisbursed = Number(analytics.totals.totalDisbursed);
  } else if (totals.totalDisbursed !== undefined && totals.totalDisbursed !== null) {
    totalDisbursed = Number(totals.totalDisbursed);
  } else if (analytics.totals?.totalRevenue !== undefined && analytics.totals.totalRevenue !== null) {
    totalDisbursed = Number(analytics.totals.totalRevenue);
  } else if (totals.totalRevenue !== undefined && totals.totalRevenue !== null) {
    totalDisbursed = Number(totals.totalRevenue);
  } else if (assignedTarget.achievedValue !== undefined && assignedTarget.achievedValue !== null && assignedTarget.achievedValue > 0) {
    // Only use achievedValue as fallback if it's greater than 0
    totalDisbursed = Number(assignedTarget.achievedValue);
  }
  
  // Ensure it's a valid number
  totalDisbursed = Number.isFinite(totalDisbursed) && totalDisbursed >= 0 ? totalDisbursed : 0;

  // Use totalDisbursed as achievedValue if not set
  if (assignedTarget.achievedValue === 0 && totalDisbursed > 0) {
    assignedTarget.achievedValue = totalDisbursed;
  }

  // Calculate performance percentage
  const targetValue = assignedTarget.targetValue || 0;
  const achievedValue = assignedTarget.achievedValue || totalDisbursed;
  const performancePercentage = targetValue > 0 
    ? Math.min((achievedValue / targetValue) * 100, 100) 
    : 0;
  
  const performance = analytics.performance || `${performancePercentage.toFixed(2)}%`;

  // Extract monthly performance
  const monthlyPerformance = analytics.monthlyPerformance || responseData.monthlyPerformance || [];

  return {
    profile: {
      userId: profile.userId || profile.id || null,
      name: profile.name || role,
      email: profile.email || "N/A",
      phone: profile.phone || "N/A",
      employeeId: profile.employeeId || "N/A",
      status: profile.status || "UNKNOWN",
    },
    totals: {
      rms: totals.rms || totals.totalRMs || 0,
      totalRMs: totals.totalRMs || totals.rms || 0,
      rsms: totals.rsms || totals.totalRSMs || 0,
      totalRSMs: totals.totalRSMs || totals.rsms || 0,
      partners: totals.partners || 0,
      customers: totals.customers || 0,
      totalApplications: totals.totalApplications || 0,
      disbursedApplications: totals.disbursedApplications || 0,
      inProcessApplications: totals.inProcessApplications || 0,
    },
    assignedTarget: {
      targetValue: Number.isFinite(targetValue) ? targetValue : 0,
      achievedValue: Number.isFinite(achievedValue) ? achievedValue : 0,
      month: assignedTarget.month || null,
      year: assignedTarget.year || null,
    },
    totalDisbursed: Number.isFinite(totalDisbursed) ? totalDisbursed : 0,
    performance,
    performancePercentage: Number.isFinite(performancePercentage) ? performancePercentage : 0,
    monthlyPerformance,
  };
};

/**
 * Get role-specific metrics configuration
 * @param {String} role - User role
 * @returns {Array} Array of metric configurations
 */
export const getRoleMetrics = (role) => {
  const baseMetrics = [
    {
      title: "Total Customers",
      key: "customers",
      icon: "Users",
      colorIndex: 3,
      subtitle: "Customer base",
    },
    {
      title: "Target",
      key: "targetValue",
      icon: "TrendingUp",
      colorIndex: 4,
      subtitle: "Monthly target",
      format: "currency",
    },
    {
      title: "Total Disbursed",
      key: "totalDisbursed",
      icon: "IndianRupee",
      colorIndex: 5,
      subtitle: "Disbursed amount",
      format: "currency",
    },
  ];

  if (role === "ASM") {
    return [
      {
        title: "Total RSMs",
        key: "totalRSMs",
        icon: "UserCheck",
        colorIndex: 0,
        subtitle: "Regional Sales Managers",
      },
      {
        title: "Total RMs",
        key: "totalRMs",
        icon: "UserCheck",
        colorIndex: 1,
        subtitle: "Relationship Managers",
      },
      {
        title: "Total Partners",
        key: "partners",
        icon: "Users",
        colorIndex: 2,
        subtitle: "Active partners",
      },
      ...baseMetrics,
    ];
  }

  if (role === "RSM") {
    return [
      {
        title: "Total RMs",
        key: "totalRMs",
        icon: "UserCheck",
        colorIndex: 0,
        subtitle: "Relationship Managers",
      },
      {
        title: "Total Partners",
        key: "partners",
        icon: "Users",
        colorIndex: 1,
        subtitle: "Active partners",
      },
      ...baseMetrics,
    ];
  }

  if (role === "RM") {
    return [
      {
        title: "Total Partners",
        key: "partners",
        icon: "Users",
        colorIndex: 0,
        subtitle: "Active partners",
      },
      ...baseMetrics,
    ];
  }

  // Partner role
  return baseMetrics;
};

