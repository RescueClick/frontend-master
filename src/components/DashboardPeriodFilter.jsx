import React, { useMemo } from "react";

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Admin-style month/year filter bar for ASM / RSM / RM dashboards.
 */
export default function DashboardPeriodFilter({ year, month, onYearChange, onMonthChange }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= currentYear - 4; y--) list.push(y);
    return list;
  }, [currentYear]);

  const periodLabel = useMemo(() => {
    if (year === "all" && month === "all") return "All Time";
    if (month === "all") return `Year ${year}`;
    const mIdx = typeof month === "number" ? month - 1 : parseInt(month, 10) - 1;
    const mStr = SHORT_MONTH_NAMES[mIdx] || `Month ${month}`;
    if (year === "all") return mStr;
    return `${mStr} ${year}`;
  }, [year, month]);

  const setThisMonth = () => {
    onYearChange(currentYear);
    onMonthChange(currentMonth);
  };

  const setLastMonth = () => {
    if (currentMonth === 1) {
      onYearChange(currentYear - 1);
      onMonthChange(12);
    } else {
      onYearChange(currentYear);
      onMonthChange(currentMonth - 1);
    }
  };

  const setAllTime = () => {
    onYearChange("all");
    onMonthChange("all");
  };

  const isThisMonth = year === currentYear && month === currentMonth;
  const isLastMonth =
    month === (currentMonth === 1 ? 12 : currentMonth - 1) &&
    year === (currentMonth === 1 ? currentYear - 1 : currentYear);
  const isAllTime = year === "all" && month === "all";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">
        Period: {periodLabel}
      </span>
      <button
        type="button"
        onClick={setThisMonth}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
          isThisMonth ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        This Month
      </button>
      <button
        type="button"
        onClick={setLastMonth}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
          isLastMonth ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        Last Month
      </button>
      <button
        type="button"
        onClick={setAllTime}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
          isAllTime ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        All Time
      </button>
      <select
        value={year}
        onChange={(e) => {
          const v = e.target.value;
          onYearChange(v === "all" ? "all" : Number(v));
        }}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium"
      >
        <option value="all">All Years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => {
          const v = e.target.value;
          onMonthChange(v === "all" ? "all" : Number(v));
        }}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium"
      >
        <option value="all">All Months</option>
        {SHORT_MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
