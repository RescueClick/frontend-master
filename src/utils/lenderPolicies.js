/** Display + form defaults. Filtering uses the same rules on the server. */

export const SALARIED_POLICIES = {
  INCRED: {
    lenderKey: "INCRED",
    source: "SALARIED_MATRIX",
    productLabel: "Salaried & self-employed personal loan",
    minNetSalary: 15000,
    minNetSalaryMetro: "",
    minNetSalarySmallTicket: "",
    smallTicketMaxAmount: "",
    maxLoanAmount: 1500000,
    maxTenureMonths: 60,
    foreclosureNote: "~4%–5% after 6 months",
    employmentSegments: ["SALARIED", "SELF_EMPLOYED"],
    minAge: 21,
    maxAge: 60,
    ageReviewFrom: "",
    ageNote: "21 to 60 years",
    salaryChannel: "Direct bank credit (NEFT/ACH)",
    minTotalExperienceMonths: 12,
    minCurrentExperienceMonths: 3,
    vintageNote: "Total ≥ 1 year; current company ≥ 3–6 months",
    creditScoreMode: "PREFERRED",
    minCreditScore: 650,
    creditScoreNote: "650+ preferred; thin-file is flexible",
    maxFoirPercent: 70,
    foirNote: "Up to 65%–70%",
    verification: {
      kyc: "Real-time PAN (NSDL) + Aadhaar via DigiLocker",
      banking: "3–6 months statement via net banking or account aggregator",
      salary: "Latest 3 months salary slips with deductions",
      workCheck: "Corporate work email OTP or employee ID",
    },
  },
  FINNABLE: {
    lenderKey: "FINNABLE",
    source: "SALARIED_MATRIX",
    productLabel: "Strictly salaried personal loan",
    minNetSalary: 15000,
    minNetSalaryMetro: 20000,
    minNetSalarySmallTicket: "",
    smallTicketMaxAmount: "",
    maxLoanAmount: 1000000,
    maxTenureMonths: 60,
    foreclosureNote: "3%–6% tiered",
    employmentSegments: ["SALARIED"],
    minAge: 21,
    maxAge: 60,
    ageReviewFrom: 56,
    ageNote: "21 to 55–60 years (confirm the upper band)",
    salaryChannel: "Direct bank credit (NEFT/ACH)",
    minTotalExperienceMonths: 6,
    minCurrentExperienceMonths: 3,
    vintageNote: "Total ≥ 6 months; current company ≥ 3 months",
    creditScoreMode: "HARD",
    minCreditScore: 650,
    creditScoreNote: "650–675+; NTC (C-1) if no score on file",
    maxFoirPercent: 65,
    foirNote: "Up to 50%–65%",
    verification: {
      kyc: "Mobile-linked Aadhaar OTP + PAN verification",
      banking: "3 to 6 months operative salary credits via account aggregator",
      salary: "1 to 3 months digital payslips",
      workCheck: "Work email OTP authentication",
    },
  },
  FIBE: {
    lenderKey: "FIBE",
    source: "SALARIED_MATRIX",
    productLabel: "Strictly salaried personal loan",
    minNetSalary: 25000,
    minNetSalaryMetro: "",
    minNetSalarySmallTicket: 20000,
    smallTicketMaxAmount: 600000,
    maxLoanAmount: 1000000,
    maxTenureMonths: 36,
    foreclosureNote: "0% / NIL (no lock-in)",
    employmentSegments: ["SALARIED"],
    minAge: 19,
    maxAge: 55,
    ageReviewFrom: "",
    ageNote: "19 to 55 years",
    salaryChannel: "Direct bank credit (NEFT/ACH)",
    minTotalExperienceMonths: 3,
    minCurrentExperienceMonths: "",
    vintageNote: "Total active employment ≥ 3–6 months",
    creditScoreMode: "NONE",
    minCreditScore: "",
    creditScoreNote: "No hard cutoff; proprietary SLQ engine",
    maxFoirPercent: 55,
    foirNote: "Up to 45%–55%",
    verification: {
      kyc: "Paperless e-KYC via DigiLocker + live selfie",
      banking: "Automated account aggregator",
      salary: "Recent 1–3 months salary slips",
      workCheck: "Instant corporate domain email OTP",
    },
  },
};

export function lenderKeyFromName(name) {
  const n = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (n.includes("incred")) return "INCRED";
  if (n.includes("finnable") || n.includes("finnabale")) return "FINNABLE";
  return n.includes("fibe") || n.includes("earlysalary") ? "FIBE" : null;
}

export function emptyPolicy() {
  return {
    lenderKey: "",
    source: "CUSTOM",
    productLabel: "",
    minNetSalary: "",
    minNetSalaryMetro: "",
    minNetSalarySmallTicket: "",
    smallTicketMaxAmount: "",
    maxLoanAmount: "",
    maxTenureMonths: "",
    foreclosureNote: "",
    employmentSegments: [],
    minAge: "",
    maxAge: "",
    ageReviewFrom: "",
    ageNote: "",
    salaryChannel: "Direct bank credit (NEFT/ACH)",
    minTotalExperienceMonths: "",
    minCurrentExperienceMonths: "",
    vintageNote: "",
    creditScoreMode: "NONE",
    minCreditScore: "",
    creditScoreNote: "",
    maxFoirPercent: "",
    foirNote: "",
    verification: { kyc: "", banking: "", salary: "", workCheck: "" },
    disabled: false,
  };
}

export function policyFromBank(bank) {
  const stored = bank?.underwritingPolicy;
  if (stored && typeof stored === "object" && !stored.disabled) {
    return {
      ...emptyPolicy(),
      ...stored,
      employmentSegments: Array.isArray(stored.employmentSegments) ? stored.employmentSegments : [],
      verification: { ...emptyPolicy().verification, ...(stored.verification || {}) },
    };
  }
  const key = lenderKeyFromName(bank?.bankName || bank?.name);
  const loanType = String(bank?.loanType || "").toUpperCase();
  if (key && SALARIED_POLICIES[key] && (!loanType || loanType === "PERSONAL")) {
    return {
      ...emptyPolicy(),
      ...SALARIED_POLICIES[key],
      verification: { ...SALARIED_POLICIES[key].verification },
    };
  }
  return emptyPolicy();
}

export function suggestedPolicy(bankName, loanType) {
  const key = lenderKeyFromName(bankName);
  const type = String(loanType || "").toUpperCase();
  if (!key || (type && type !== "PERSONAL")) return null;
  return {
    ...emptyPolicy(),
    ...SALARIED_POLICIES[key],
    verification: { ...SALARIED_POLICIES[key].verification },
  };
}

export function formatInr(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 10000000) {
    const cr = n / 10000000;
    return `₹${Number.isInteger(cr) ? cr : cr.toFixed(1)} Cr`;
  }
  if (n >= 100000) {
    const lakh = n / 100000;
    return `₹${Number.isInteger(lakh) ? lakh : lakh.toFixed(1)} L`;
  }
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function employmentLabel(segments = []) {
  const list = Array.isArray(segments) ? segments : [];
  const salaried = list.includes("SALARIED");
  const self = list.includes("SELF_EMPLOYED");
  if (salaried && self) return "Salaried + self-employed";
  if (salaried) return "Salaried only";
  if (self) return "Self-employed only";
  return "";
}
