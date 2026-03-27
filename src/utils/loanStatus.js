export const LOAN_STATUS_DISPLAY = {
  DRAFT: "SUBMITTED",
  SUBMITTED: "SUBMITTED",
  DOC_INCOMPLETE: "DOC_INCOMPLETE",
  DOC_COMPLETE: "DOC_COMPLETE",
  DOC_SUBMITTED: "DOC_SUBMITTED",
  LOGIN: "LOGIN",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  AGREEMENT: "AGREEMENT",
  REJECTED: "REJECTED",
  DISBURSED: "DISBURSED",
};

export const LOAN_STATUS_LABELS = {
  SUBMITTED: "Submitted",
  DOC_INCOMPLETE: "Document Incomplete",
  DOC_COMPLETE: "Document Complete",
  DOC_SUBMITTED: "Document Submitted",
  LOGIN: "Login",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  AGREEMENT: "Agreement",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed",
};

export function normalizeLoanStatus(status) {
  if (!status) return "";
  const normalized = String(status).trim().toUpperCase();
  return LOAN_STATUS_DISPLAY[normalized] || normalized;
}

export function getLoanStatusLabel(status) {
  const normalized = normalizeLoanStatus(status);
  return LOAN_STATUS_LABELS[normalized] || normalized;
}

export function getLoanStatusBadgeClass(status) {
  switch (normalizeLoanStatus(status)) {
    case "DISBURSED":
      return "bg-purple-100 text-purple-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "UNDER_REVIEW":
      return "bg-indigo-100 text-indigo-800";
    case "DOC_INCOMPLETE":
      return "bg-rose-100 text-rose-700";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800";
    case "AGREEMENT":
      return "bg-cyan-100 text-cyan-800";
    case "DOC_COMPLETE":
      return "bg-emerald-100 text-emerald-800";
    case "DOC_SUBMITTED":
      return "bg-violet-100 text-violet-800";
    case "LOGIN":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

