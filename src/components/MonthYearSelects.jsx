import React, { useMemo } from "react";

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Read year/month passed from a dashboard card. Defaults to all time. */
export function readPeriodState(location, fallbackYear = "all", fallbackMonth = "all") {
  const state = location?.state;
  if (!state || typeof state !== "object") {
    return { year: fallbackYear, month: fallbackMonth };
  }
  const year = state.year;
  const month = state.month;
  return {
    year: year === undefined || year === null || year === "" ? fallbackYear : year,
    month: month === undefined || month === null || month === "" ? fallbackMonth : month,
  };
}

export default function MonthYearSelects({
  year,
  month,
  onYearChange,
  onMonthChange,
  className = "border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary",
}) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= currentYear - 4; y -= 1) list.push(y);
    return list;
  }, [currentYear]);

  return (
    <>
      <select
        aria-label="Filter by year"
        className={className}
        value={year === "all" || year == null ? "all" : String(year)}
        onChange={(e) => onYearChange(e.target.value === "all" ? "all" : Number(e.target.value))}
      >
        <option value="all">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by month"
        className={className}
        value={month === "all" || month == null ? "all" : String(month)}
        onChange={(e) => onMonthChange(e.target.value === "all" ? "all" : Number(e.target.value))}
      >
        <option value="all">All months</option>
        {SHORT_MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
    </>
  );
}
