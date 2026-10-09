export const CIBIL_SCORE_OPTIONS = [
  { value: "BELOW_600", label: "Below 600" },
  { value: "RANGE_600_700", label: "600-700" },
  { value: "RANGE_700_750", label: "700-750" },
  { value: "RANGE_750_850", label: "750-850" },
];

export const SALARY_RECEIPT_OPTIONS = [
  { value: "ONLINE", label: "Online (bank transfer)" },
  { value: "CASH", label: "Cash" },
];

const LEGACY_CIBIL_SCORE_LABELS = {
  BELOW_650: "Below 650",
  BELOW_750: "650 – 749 (Below 750)",
  ABOVE_750: "750 and above",
  NO_SCORE: "No CIBIL score",
};

export const CIBIL_SCORE_LABELS = {
  ...LEGACY_CIBIL_SCORE_LABELS,
  ...Object.fromEntries(CIBIL_SCORE_OPTIONS.map((option) => [option.value, option.label])),
};

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
