// Shared Metric Card Component - Linear Design System
import { designSystem, formatCurrency, formatNumber } from "../../utils/designSystem";

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  colorIndex = 0, 
  onClick, 
  subtitle,
  isLoading = false 
}) => {
  const colorScheme = designSystem.metricColors[colorIndex % designSystem.metricColors.length];
  const isInteractive = typeof onClick === "function";
  const onKeyDown = (e) => {
    if (!isInteractive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
  };
  
  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={`${designSystem.card.base} ${designSystem.card.hover} ${designSystem.card.padding} ${
        isInteractive ? "cursor-pointer transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" : ""
      } relative overflow-hidden`}
    >
      {/* Gradient Background Accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${colorScheme.bg} opacity-10 rounded-bl-full`}></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`${colorScheme.bg} rounded-xl p-3 shadow-lg ${onClick ? "group-hover:scale-110 transition-transform duration-300" : ""}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;

