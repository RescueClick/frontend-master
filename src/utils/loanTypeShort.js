/**
 * Compact loan type labels for table cells and dense list UIs.
 * Maps API enums and common display strings to short codes.
 */
export function loanTypeToTableShort(loanType) {
  if (loanType == null) return "—";
  const raw = String(loanType).trim();
  if (!raw) return "—";

  const norm = raw
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");

  const exact = {
    PERSONAL: "PL",
    PERSONAL_LOAN: "PL",
    HOME_LOAN: "HL",
    HOME: "HL",
    HOME_LOAN_SALARIED: "HLSalaried",
    HOME_LOAN_SELF_EMPLOYED: "HLself",
    BUSINESS: "BL",
    BUSINESS_LOAN: "BL",
    CAR_LOAN: "CL",
    EDUCATION_LOAN: "EL",
    GOLD_LOAN: "GL",
  };

  if (exact[norm]) return exact[norm];

  const lower = raw.toLowerCase();
  if (lower.includes("personal")) return "PL";
  if (
    lower.includes("home") &&
    (lower.includes("self") || lower.includes("employ"))
  ) {
    return "HLself";
  }
  if (lower.includes("salaried") && lower.includes("home")) return "HLSalaried";
  if (lower.includes("business")) return "BL";
  if (lower.includes("education")) return "EL";
  if (lower.includes("car") && lower.includes("loan")) return "CL";
  if (lower.includes("gold")) return "GL";
  if (lower.includes("home")) return "HL";

  if (raw.length <= 10) return raw.toUpperCase();
  return `${raw.slice(0, 8)}…`;
}

/** Tailwind classes for loan-type pill in payout tables (API enums + demo labels). */
export function payoutLoanTypePillClass(loanType) {
  switch (loanType) {
    case "HOME_LOAN_SALARIED":
    case "HOME_LOAN_SELF_EMPLOYED":
    case "Home Loan":
      return "bg-blue-100 text-blue-700";
    case "BUSINESS":
    case "Business Loan":
      return "bg-green-100 text-green-700";
    case "PERSONAL":
    case "Personal Loan":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
