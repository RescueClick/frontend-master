// Linear Design System - Consistent colors and styles across all dashboards and tables

export const designSystem = {
  // Primary Colors (Linear Gradient)
  colors: {
    primary: "#12B99C",      // Teal - Main brand color
    primaryDark: "#0EA688",  // Darker teal
    secondary: "#1E3A8A",    // Blue
    accent: "#F59E0B",       // Amber/Orange
    success: "#10B981",      // Green
    warning: "#F59E0B",      // Amber
    error: "#EF4444",        // Red
    info: "#3B82F6",         // Blue
    
    // Neutral Colors
    background: "#F8FAFC",   // Light gray background
    surface: "#FFFFFF",      // White cards
    border: "#E5E7EB",       // Light gray border
    text: {
      primary: "#111827",    // Dark gray text
      secondary: "#6B7280",  // Medium gray text
      tertiary: "#9CA3AF",   // Light gray text
    },
  },

  // Card Styles
  card: {
    base: "bg-white rounded-xl shadow-md border border-gray-200",
    hover: "hover:shadow-xl transition-all duration-300",
    padding: "p-6",
  },

  // Metric Card Colors (Linear progression)
  metricColors: [
    { bg: "bg-gradient-to-br from-blue-500 to-blue-600", icon: "text-white", text: "text-blue-600" },
    { bg: "bg-gradient-to-br from-teal-500 to-teal-600", icon: "text-white", text: "text-teal-600" },
    { bg: "bg-gradient-to-br from-purple-500 to-purple-600", icon: "text-white", text: "text-purple-600" },
    { bg: "bg-gradient-to-br from-amber-500 to-amber-600", icon: "text-white", text: "text-amber-600" },
    { bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", icon: "text-white", text: "text-emerald-600" },
    { bg: "bg-gradient-to-br from-indigo-500 to-indigo-600", icon: "text-white", text: "text-indigo-600" },
  ],

  // Table Styles
  table: {
    container: "bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden",
    header: "bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200",
    headerCell: "px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider",
    row: "border-b border-gray-200 hover:bg-gray-50 transition-colors",
    cell: "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
    cellSecondary: "px-6 py-4 whitespace-nowrap text-sm text-gray-600",
  },

  // Button Styles
  button: {
    primary: "bg-gradient-to-r from-[#12B99C] to-[#0EA688] hover:from-[#0EA688] hover:to-[#12B99C] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg",
  },

  // Badge Styles
  badge: {
    active: "px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200",
    inactive: "px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200",
    pending: "px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200",
    rejected: "px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200",
  },

  // Typography System - Consistent font sizes across the app
  typography: {
    // Headings
    h1: "text-3xl font-bold",           // 30px - Main page titles
    h2: "text-2xl font-bold",           // 24px - Section titles
    h3: "text-xl font-semibold",        // 20px - Subsection titles
    h4: "text-lg font-semibold",        // 18px - Card titles, small sections
    h5: "text-base font-semibold",      // 16px - Minor headings
    h6: "text-sm font-semibold",        // 14px - Small headings
    
    // Subheadings
    subheading: "text-lg font-medium",  // 18px - Subheadings
    subheadingSmall: "text-base font-medium", // 16px - Small subheadings
    
    // Body Text
    body: "text-base",                   // 16px - Regular paragraph text
    bodyLarge: "text-lg",                // 18px - Large body text
    bodySmall: "text-sm",                // 14px - Small body text
    
    // Labels and Captions
    label: "text-sm font-medium",        // 14px - Form labels
    caption: "text-xs",                  // 12px - Captions, helper text
    captionSmall: "text-xs font-medium", // 12px - Small captions with emphasis
    
    // Special Text
    lead: "text-lg font-normal",         // 18px - Lead paragraph
    small: "text-sm text-gray-600",      // 14px - Secondary text
    tiny: "text-xs text-gray-500",       // 12px - Tiny text, metadata
  },
};

// Format currency helper
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  const num = Number(amount);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)}L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(2)}K`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

// Format number helper
export const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  return Number(num).toLocaleString('en-IN');
};

// Typography Helper Functions - Use these for consistent font sizes
export const typography = {
  // Headings
  h1: (color = "text-gray-900") => `${designSystem.typography.h1} ${color}`,
  h2: (color = "text-gray-900") => `${designSystem.typography.h2} ${color}`,
  h3: (color = "text-gray-900") => `${designSystem.typography.h3} ${color}`,
  h4: (color = "text-gray-900") => `${designSystem.typography.h4} ${color}`,
  h5: (color = "text-gray-900") => `${designSystem.typography.h5} ${color}`,
  h6: (color = "text-gray-900") => `${designSystem.typography.h6} ${color}`,
  
  // Subheadings
  subheading: (color = "text-gray-700") => `${designSystem.typography.subheading} ${color}`,
  subheadingSmall: (color = "text-gray-700") => `${designSystem.typography.subheadingSmall} ${color}`,
  
  // Body Text
  body: (color = "text-gray-900") => `${designSystem.typography.body} ${color}`,
  bodyLarge: (color = "text-gray-900") => `${designSystem.typography.bodyLarge} ${color}`,
  bodySmall: (color = "text-gray-600") => `${designSystem.typography.bodySmall} ${color}`,
  
  // Labels and Captions
  label: (color = "text-gray-700") => `${designSystem.typography.label} ${color}`,
  caption: (color = "text-gray-500") => `${designSystem.typography.caption} ${color}`,
  captionSmall: (color = "text-gray-500") => `${designSystem.typography.captionSmall} ${color}`,
  
  // Special Text
  lead: (color = "text-gray-700") => `${designSystem.typography.lead} ${color}`,
  small: () => designSystem.typography.small,
  tiny: () => designSystem.typography.tiny,
};

