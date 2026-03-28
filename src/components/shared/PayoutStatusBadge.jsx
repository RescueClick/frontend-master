const baseClass =
  "inline-flex items-center justify-center max-w-[200px] truncate px-2.5 py-1 text-xs font-semibold rounded-md border border-black/[0.06] shadow-sm";

function normalizePayoutStatus(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase();
}

const STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
  DONE: "bg-green-100 text-green-800",
};

const LABELS = {
  PENDING: "Pending",
  REJECTED: "Rejected",
  DONE: "Done",
};

/**
 * Commission payout workflow (PENDING / REJECTED / DONE) — admin, ASM, RM lists.
 */
export default function PayoutStatusBadge({ status, className = "" }) {
  const key = normalizePayoutStatus(status);
  if (!key) {
    return (
      <span className={`${baseClass} bg-slate-50 text-slate-500 border-slate-200/80 ${className}`} title="">
        —
      </span>
    );
  }
  const chipClass = STYLES[key] || "bg-slate-100 text-slate-800";
  const label = LABELS[key] || String(status);

  return (
    <span className={`${baseClass} ${chipClass} ${className}`} title={String(status ?? "")}>
      {label}
    </span>
  );
}
