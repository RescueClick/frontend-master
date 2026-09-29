export const MIN_LOAN_AMOUNT = 100000;
export const MAX_LOAN_AMOUNT = 50000000;
export const LOAN_AMOUNT_RANGE_MESSAGE =
  "Loan amount must be between ₹1,00,000 and ₹5,00,00,000.";

/** Empty string when the amount is allowed. */
export function loanAmountRangeError(value) {
  if (value === "" || value === null || value === undefined) {
    return "Loan amount is required.";
  }
  const n = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < MIN_LOAN_AMOUNT || n > MAX_LOAN_AMOUNT) {
    return LOAN_AMOUNT_RANGE_MESSAGE;
  }
  return "";
}
