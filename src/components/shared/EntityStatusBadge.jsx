const baseClass =
  "inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-md border border-black/[0.06] shadow-sm";

const VARIANTS = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  INACTIVE: "bg-slate-100 text-slate-700 border-slate-200/80",
  PENDING: "bg-amber-50 text-amber-900 border-amber-200/80",
  UNDER_REVIEW: "bg-yellow-50 text-yellow-900 border-yellow-200/80",
  SUSPENDED: "bg-red-50 text-red-800 border-red-200/80",
};

const LABELS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  SUSPENDED: "Suspended",
};

/**
 * User / partner / RM account lifecycle (ACTIVE, INACTIVE, …) — not loan workflow.
 */
export default function EntityStatusBadge({ status, className = "" }) {
  const key = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const style = VARIANTS[key] || "bg-slate-50 text-slate-700 border-slate-200/80";
  const label = LABELS[key] || (status ? String(status) : "—");

  return (
    <span className={`${baseClass} ${style} ${className}`} title={String(status ?? "")}>
      {label}
    </span>
  );
}
