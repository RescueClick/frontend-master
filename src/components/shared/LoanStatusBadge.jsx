import { getLoanStatusBadgeClass, getLoanStatusLabel } from "../../utils/loanStatus";

const baseClass =
  "inline-flex items-center justify-center max-w-[220px] truncate px-2.5 py-1 text-xs font-semibold rounded-md border border-black/[0.06] shadow-sm";

/**
 * Loan / application workflow status — use everywhere a table shows APPROVED, DISBURSED, etc.
 */
export default function LoanStatusBadge({ status, className = "" }) {
  if (status === undefined || status === null || String(status).trim() === "") {
    return (
      <span
        className={`${baseClass} bg-slate-50 text-slate-500 border-slate-200/80 ${className}`}
        title="No status"
      >
        —
      </span>
    );
  }

  return (
    <span
      className={`${baseClass} ${getLoanStatusBadgeClass(status)} ${className}`}
      title={String(status)}
    >
      {getLoanStatusLabel(status)}
    </span>
  );
}
