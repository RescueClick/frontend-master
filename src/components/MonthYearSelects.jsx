import React, { useMemo } from "react";

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Read year/month/day passed from a dashboard card. Defaults to all time. */
export function readPeriodState(location, fallbackYear = "all", fallbackMonth = "all", fallbackDay = "all") {
  const state = location?.state;
  if (!state || typeof state !== "object") {
    return { year: fallbackYear, month: fallbackMonth, day: fallbackDay };
  }
  const year = state.year;
  const month = state.month;
  const day = state.day;
  return {
    year: year === undefined || year === null || year === "" ? fallbackYear : year,
    month: month === undefined || month === null || month === "" ? fallbackMonth : month,
    day: day === undefined || day === null || day === "" ? fallbackDay : day,
  };
}

export function toDateInputValue(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return "";
  if (m < 1 || m > 12 || d < 1 || d > 31) return "";
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** One calendar day. Picking a date also sets that year and month. Clearing it keeps the month. */
export function FilterDateInput({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
  className = "border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary",
}) {
  return (
    <input
      type="date"
      aria-label="Filter by date"
      className={className}
      value={toDateInputValue(year, month, day)}
      onChange={(e) => {
        const value = e.target.value;
        if (!value) {
          onDayChange?.("all");
          return;
        }
        const [ys, ms, ds] = value.split("-").map((n) => Number(n));
        if (!ys || !ms || !ds) return;
        onYearChange?.(ys);
        onMonthChange?.(ms);
        onDayChange?.(ds);
      }}
    />
  );
}

export default function MonthYearSelects({
  year,
  month,
  day = "all",
  onYearChange,
  onMonthChange,
  onDayChange,
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
        onChange={(e) => {
          onYearChange(e.target.value === "all" ? "all" : Number(e.target.value));
          onDayChange?.("all");
        }}
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
        onChange={(e) => {
          onMonthChange(e.target.value === "all" ? "all" : Number(e.target.value));
          onDayChange?.("all");
        }}
      >
        <option value="all">All months</option>
        {SHORT_MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <FilterDateInput
        year={year}
        month={month}
        day={day}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        onDayChange={onDayChange}
        className={className}
      />
    </>
  );
}
