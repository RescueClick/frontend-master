export const CIBIL_SCORE_OPTIONS = [
  { value: "BELOW_650", label: "Below 650" },
  { value: "BELOW_750", label: "650 – 749 (Below 750)" },
  { value: "ABOVE_750", label: "750 and above" },
  { value: "NO_SCORE", label: "No CIBIL score" },
];

export const SALARY_RECEIPT_OPTIONS = [
  { value: "ONLINE", label: "Online (bank transfer)" },
  { value: "CASH", label: "Cash" },
];

export const CIBIL_SCORE_LABELS = Object.fromEntries(
  CIBIL_SCORE_OPTIONS.map((option) => [option.value, option.label])
);

export const SALARY_RECEIPT_LABELS = {
  ONLINE: "Online",
  CASH: "Cash",
};

export function validatePersonFinancialFields(data = {}) {
  const errors = {};
  if (!CIBIL_SCORE_OPTIONS.some((option) => option.value === data.cibilScoreBand)) {
    errors.cibilScoreBand = "CIBIL score range is required.";
  }
  return errors;
}

export function personFinancialCustomerFields(formData = {}) {
  return {
    salaryInHand: formData.salaryInHand === "" || formData.salaryInHand == null
      ? ""
      : String(formData.salaryInHand),
    salaryReceiptMode: formData.salaryReceiptMode || "",
    cibilScoreBand: formData.cibilScoreBand || "",
  };
}
