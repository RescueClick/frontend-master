import React, { useMemo } from "react";
import { Calendar } from "lucide-react";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "mtd", label: "MTD" },
  { id: "qtd", label: "QTD" },
  { id: "ytd", label: "YTD" },
  { id: "custom", label: "Custom" },
];

function toInputDate(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Shared filters bar (date presets + optional custom range).
 *
 * value shape:
 * { preset: "today"|"7d"|"30d"|"mtd"|"qtd"|"ytd"|"custom", start?: Date|string, end?: Date|string }
 */
const FiltersBar = ({ value, onChange, className = "" }) => {
  const preset = value?.preset || "30d";

  const showCustom = preset === "custom";
  const startValue = toInputDate(value?.start);
  const endValue = toInputDate(value?.end);

  const activePreset = useMemo(() => PRESETS.find((p) => p.id === preset) || PRESETS[2], [preset]);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-3 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">Filters</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{activePreset.label}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange?.({ ...value, preset: p.id })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                preset === p.id
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {showCustom ? (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-gray-600">
            Start date
            <input
              type="date"
              value={startValue}
              onChange={(e) => onChange?.({ ...value, preset: "custom", start: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </label>
          <label className="text-xs text-gray-600">
            End date
            <input
              type="date"
              value={endValue}
              onChange={(e) => onChange?.({ ...value, preset: "custom", end: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
};

export default FiltersBar;

