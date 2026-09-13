import React from "react";
import { ExternalLink, FileText } from "lucide-react";

const STATUS_STYLE = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  DISBURSED: "bg-emerald-100 text-emerald-700",
  AGREEMENT: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DOC_COMPLETE: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-orange-100 text-orange-700",
  LOGIN: "bg-sky-100 text-sky-700",
};

/**
 * Build navigate target for a loan file based on staff role.
 * Note: in this app /asm uses RSM screens and /rsm uses ASM screens.
 */
export function getLoanNavigation(currentRole, loanRef) {
  if (!loanRef) return null;
  const applicationId = loanRef.applicationId?._id || loanRef.applicationId;
  const customerId = loanRef.customerId?._id || loanRef.customerId;
  const appNo = loanRef.applicationNumber;

  if (!applicationId && !appNo) return null;

  const role = String(currentRole || "").toUpperCase();

  if (role === "ASM") {
    return {
      path: "/asm/applications/view",
      state: { applicationId, customerId },
    };
  }
  if (role === "RSM") {
    return {
      path: "/rsm/applications",
      state: { highlightAppId: applicationId, appNo, search: appNo },
    };
  }
  if (role === "RM") {
    return {
      path: "/rm/CustomerAppliction",
      state: { applicationId, customerId },
    };
  }
  // SUPER_ADMIN / ADMIN
  return {
    path: "/admin/customer",
    state: { search: appNo || String(applicationId || "") },
  };
}

/** Rich loan file card inside chat bubbles */
export default function ChatLoanCard({ loanRef, onOpen, compact = false }) {
  if (!loanRef) return null;

  const appNo = loanRef.applicationNumber;
  const hasIdentity = Boolean(
    (appNo && appNo !== "N/A") || loanRef.applicationId || loanRef.applicantName
  );
  if (!hasIdentity) return null;

  const statusClass = STATUS_STYLE[loanRef.status] || "bg-slate-100 text-slate-700";

  return (
    <div
      className={`rounded-xl border border-teal-200/70 bg-gradient-to-br from-teal-50 to-white text-slate-800 shadow-sm ${
        compact ? "p-2 mb-1.5" : "p-2.5 mb-2"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded">
              {appNo && appNo !== "N/A" ? appNo : "Loan file"}
            </span>
            {loanRef.status ? (
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusClass}`}>
                {loanRef.status}
              </span>
            ) : null}
            {loanRef.loanType ? (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {String(loanRef.loanType).replace(/_/g, " ")}
              </span>
            ) : null}
          </div>

          <p className={`font-semibold text-slate-900 truncate ${compact ? "text-xs mt-1" : "text-sm mt-1"}`}>
            {loanRef.applicantName && loanRef.applicantName !== "Applicant"
              ? loanRef.applicantName
              : "Loan applicant"}
          </p>

          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
            {loanRef.phone ? <span>📱 {loanRef.phone}</span> : null}
            {loanRef.amount ? (
              <span className="font-medium text-slate-700">
                ₹{Number(loanRef.amount).toLocaleString("en-IN")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {typeof onOpen === "function" && (loanRef.applicationId || (appNo && appNo !== "N/A")) ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpen(loanRef);
          }}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open loan file
        </button>
      ) : null}
    </div>
  );
}
