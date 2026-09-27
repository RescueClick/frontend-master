import React, { useMemo } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatNumber, typography } from "../../utils/designSystem";

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Full class strings so Tailwind keeps them in the build
const COLORS = {
  blue: { glow: "from-blue-100 to-blue-50", icon: "from-blue-500 to-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  teal: { glow: "from-teal-100 to-teal-50", icon: "from-teal-500 to-teal-600", badge: "bg-teal-50 text-teal-700 border-teal-200" },
  amber: { glow: "from-amber-100 to-amber-50", icon: "from-amber-500 to-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  emerald: { glow: "from-emerald-100 to-emerald-50", icon: "from-emerald-500 to-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  purple: { glow: "from-purple-100 to-purple-50", icon: "from-purple-500 to-purple-600", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  orange: { glow: "from-orange-100 to-orange-50", icon: "from-orange-500 to-orange-600", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  rose: { glow: "from-rose-100 to-rose-50", icon: "from-rose-500 to-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function usePeriodLabel(year, month) {
  return useMemo(() => {
    if (year === "all" && month === "all") return "All Time";
    if (month === "all") return `Year ${year}`;
    const mIdx = typeof month === "number" ? month - 1 : parseInt(month, 10) - 1;
    const mStr = SHORT_MONTH_NAMES[mIdx] || `Month ${month}`;
    if (year === "all") return `All Years • ${mStr}`;
    return `${mStr} ${year}`;
  }, [year, month]);
}

/**
 * Admin-style counting card: shows the selected-period value with an
 * "All-Time" line underneath, or the all-time value when no period is picked.
 */
export function PeriodStatCard({
  label,
  allTimeLabel,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  isFiltered,
  periodLabel,
  onClick,
  loading,
  currency = false,
}) {
  const c = COLORS[color] || COLORS.blue;
  const shown = currency ? formatCurrency(value || 0) : formatNumber(value || 0);

  return (
    <div
      className={`group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 transition-all duration-300 relative overflow-hidden ${
        onClick ? "cursor-pointer transform hover:-translate-y-1" : ""
      }`}
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${c.glow} rounded-bl-full opacity-50`}></div>
      <div className="relative flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <p className={`${typography.captionSmall()} uppercase tracking-wider`}>
              {isFiltered ? `${label} (${periodLabel})` : allTimeLabel || label}
            </p>
            {isFiltered && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${c.badge}`}>
                Monthly
              </span>
            )}
          </div>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mb-1" />
          ) : (
            <p className={`${typography.h2()} mb-1 truncate`}>{shown}</p>
          )}
          {subtitle && <p className={typography.tiny()}>{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`bg-gradient-to-br ${c.icon} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

const pct = (part, total) => (total ? Math.round(((part || 0) / total) * 100) : 0);

/** Admin-style "Application Pipeline" row for the selected period (or all time). */
export function PipelineFunnel({ fileStats, periodLabel, onViewAll, loading }) {
  const isFiltered = Boolean(fileStats?.isFiltered);
  const s = (isFiltered ? fileStats?.period : fileStats?.allTime) || {};
  const total = s.files || 0;

  const tiles = [
    {
      key: "files",
      label: "Total Files",
      value: total,
      note: isFiltered
        ? `Created in ${periodLabel}${s.leads ? ` • ${formatNumber(s.leads)} leads` : ""}`
        : `All files${s.leads ? ` • ${formatNumber(s.leads)} leads` : ""}`,
      icon: FileText,
      box: "bg-slate-50 border-slate-200/80",
      title: "text-slate-500",
      num: "text-slate-900",
      sub: "text-slate-500",
      ico: "text-slate-400",
    },
    {
      key: "inProcess",
      label: "In Process",
      value: s.inProcess,
      note: total ? `${pct(s.inProcess, total)}% of total` : "Under active review",
      icon: Clock,
      box: "bg-blue-50/70 border-blue-200/70",
      title: "text-blue-700",
      num: "text-blue-900",
      sub: "text-blue-600",
      ico: "text-blue-500",
    },
    {
      key: "approved",
      label: "Approved",
      value: s.approved,
      note: total ? `${pct(s.approved, total)}% approval rate` : "Sanctioned files",
      icon: CheckCircle2,
      box: "bg-teal-50/70 border-teal-200/70",
      title: "text-teal-700",
      num: "text-teal-900",
      sub: "text-teal-600",
      ico: "text-teal-500",
    },
    {
      key: "disbursed",
      label: "Disbursed",
      value: s.disbursed,
      note: total ? `${pct(s.disbursed, total)}% conversion` : "Successfully paid out",
      icon: Banknote,
      box: "bg-emerald-50/70 border-emerald-200/70",
      title: "text-emerald-700",
      num: "text-emerald-900",
      sub: "text-emerald-600",
      ico: "text-emerald-600",
    },
    {
      key: "rejected",
      label: "Rejected",
      value: s.rejected,
      note: total ? `${pct(s.rejected, total)}% rejected` : "Declined files",
      icon: XCircle,
      box: "bg-rose-50/70 border-rose-200/70 col-span-2 sm:col-span-1",
      title: "text-rose-700",
      num: "text-rose-900",
      sub: "text-rose-600",
      ico: "text-rose-500",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className={typography.h3()}>
              Application Pipeline — <span className="text-emerald-700">{periodLabel}</span>
            </h2>
            <p className={`${typography.caption()} text-gray-500`}>
              Loan files registered and processed {isFiltered ? "in this period" : "so far"}
            </p>
          </div>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1"
          >
            <span>View All Files</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.key} className={`p-3.5 rounded-xl border ${t.box}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold uppercase ${t.title}`}>{t.label}</span>
                <Icon className={`w-3.5 h-3.5 ${t.ico}`} />
              </div>
              {loading && !fileStats ? (
                <div className="h-7 w-12 bg-white/70 rounded animate-pulse" />
              ) : (
                <p className={`text-xl font-extrabold ${t.num}`}>{formatNumber(t.value || 0)}</p>
              )}
              <p className={`text-[11px] mt-1 ${t.sub}`}>{t.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
