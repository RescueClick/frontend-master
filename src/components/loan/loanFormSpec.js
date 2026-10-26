/**
 * Single loan-application flow shared by the Partner app, Customer app and Website.
 * The same file lives in all three projects — keep them identical:
 *   dhansource/src/components/loan/loanFormSpec.js
 *   dhansource_customer/src/constants/loanFormSpec.js
 *   frontend-master/src/components/loan/loanFormSpec.js
 *
 * Step 1 must keep name, mobile, email and loan amount: the backend creates the
 * LEAD (/leads/capture-step1) when the user leaves step 1 and rejects it without them.
 */

/**
 * Every upload sits directly under the field it belongs to (PAN card under PAN number,
 * address proof under the address, salary slips under salary...). There is no separate
 * documents step; each doc in a checklist carries the `step` it is shown on.
 */
export const LOAN_STEP = {
  PERSONAL: 0,
  ADDRESS: 1,
  INCOME: 2,
  REFERENCES: 3,
  REVIEW: 4,
};

/** Stamped on saved drafts; drafts from an older step layout keep their data but restart at step 1. */
export const LOAN_STEP_LAYOUT_VERSION = 3;

export const LOAN_PROFILE = {
  SALARIED: "SALARIED",
  BUSINESS: "BUSINESS",
  VEHICLE: "VEHICLE",
};

const INCOME_STEP_LABEL = {
  SALARIED: "Work & Income",
  BUSINESS: "Business & Income",
  VEHICLE: "Vehicle Details",
};

const PROPERTY_STEP_LABEL = {
  SALARIED: "Work & Property",
  BUSINESS: "Business & Property",
};

export function getLoanSteps({ profile = LOAN_PROFILE.SALARIED, hasProperty = false } = {}) {
  const incomeLabel = hasProperty
    ? PROPERTY_STEP_LABEL[profile] || PROPERTY_STEP_LABEL.SALARIED
    : INCOME_STEP_LABEL[profile] || INCOME_STEP_LABEL.SALARIED;
  return ["Loan & Personal", "Address", incomeLabel, "References", "Review & Submit"];
}

/** Primary button while the user is fixing a section they opened from Review. */
export const LOAN_BACK_TO_REVIEW_LABEL = "Back to review";

export const LOAN_REVIEW_EDIT_HINT =
  "You opened this from Review. Fix this step, then tap Back to review.";

/**
 * Next step index. Opened-from-review jumps straight back to Review after this step checks out.
 * `currentStep` and `reviewStep` must use the same base (0 in Partner and Website, 1 in the customer wizard).
 */
export function resolveLoanNextStep(currentStep, { editingFromReview = false, reviewStep = LOAN_STEP.REVIEW } = {}) {
  if (editingFromReview && currentStep !== reviewStep) return reviewStep;
  return currentStep + 1;
}

export const LOAN_SECTION = {
  LOAN_REQUIREMENT: "Loan Requirement",
  PERSONAL: "Personal Information",
  CO_APPLICANT: "Co-Applicant",
  CURRENT_ADDRESS: "Current Address",
  PERMANENT_ADDRESS: "Permanent Address",
  EMPLOYMENT: "Employment Details",
  BUSINESS: "Business Details",
  VEHICLE: "Vehicle Details",
  PROPERTY: "Property Details",
  CREDIT: "Existing Loans & Credit",
  DOCS_KYC: "Identity & KYC",
  DOCS_ADDRESS: "Address Proof",
  DOCS_INCOME: "Income & Bank Statements",
  DOCS_BUSINESS: "Business & Bank Statements",
  DOCS_VEHICLE: "Vehicle & Bank Statements",
  DOCS_PROPERTY: "Property Documents",
  DOCS_CO_APPLICANT: "Co-Applicant Documents",
  REFERENCES: "References",
  REVIEW: "Review Application",
  ACCOUNT: "Customer Login (Optional)",
};

/** Field labels used on every platform. Required fields add " *" after the label. */
export const LOAN_FIELD_LABEL = {
  loanAmount: "Required Loan Amount (₹)",
  loanPurpose: "Loan Purpose",
  firstName: "First Name",
  middleName: "Middle Name (Optional)",
  lastName: "Last Name",
  mobile: "Mobile Number",
  alternateMobile: "Alternate Mobile (Optional)",
  email: "Email",
  pan: "PAN Number",
  dob: "Date of Birth",
  gender: "Gender",
  maritalStatus: "Marital Status",
  spouseName: "Spouse Name",
  motherName: "Mother's Name",
  coApplicantMobile: "Co-Applicant Mobile",
  hasRunningLoan: "Any Running Loan?",
  monthlyEmiPaying: "Monthly EMI Paying (₹)",
  cibilScoreBand: "CIBIL Score",
  hasBounce: "Any EMI / Cheque Bounce?",
  bounceCount: "Number of Bounces",
  address: "Address (House / Flat / Area)",
  landmark: "Landmark",
  pincode: "PIN Code",
  houseStatus: "House Status",
  stability: "Years at this Address",
  sameAddress: "Permanent address is same as current address",
  companyName: "Company Name",
  designation: "Designation",
  companyAddress: "Company Address",
  monthlySalary: "Monthly Salary (₹)",
  salaryInHand: "Salary in Hand (₹)",
  totalExperience: "Total Experience (Years)",
  currentExperience: "Current Company Experience (Years)",
  salaryReceiptMode: "Salary Receipt Mode (Optional)",
  officialEmail: "Official Email (Optional)",
  businessName: "Business Name",
  businessAddress: "Business Address",
  businessLandmark: "Business Landmark (Optional)",
  businessVintage: "Years in Business",
  annualTurnover: "Annual Turnover (₹)",
  gstNumber: "GST Number (Optional)",
  propertyType: "Property Type",
  propertyValue: "Property Value (₹)",
  propertyAddress: "Property Address",
  referenceName: "Name",
  referenceMobile: "Mobile Number",
  bankStatementPassword: "Bank Statement Password (Optional)",
};

/** Upload slot labels (shown directly under the related field). Required slots add " *". */
export const LOAN_DOC_LABEL = {
  panCard: "Upload PAN Card",
  aadharFront: "Aadhaar Card (Front)",
  aadharBack: "Aadhaar Card (Back)",
  photo: "Applicant Photo",
  otherDoc: "Other Document (Optional)",
  addressProof: "Upload Address Proof",
  companyIdCard: "Company ID Card",
  salarySlip1: "Salary Slip (Month 1)",
  salarySlip2: "Salary Slip (Month 2)",
  salarySlip3: "Salary Slip (Month 3)",
  form16: "Form 16 / 26AS (Optional)",
  bankStatement1: "Bank Statement 1",
  bankStatement2: "Bank Statement 2 (Optional)",
  shopAct: "Shop Act / Gumasta Licence",
  udyam: "Udyam Aadhaar",
  shopPhoto: "Shop / Office Photo",
  gstCertificate: "GST Certificate (Optional)",
  itr: "ITR (Last 3 Years, one file)",
  otherBusinessDoc: "Other Business Document (Optional)",
  coPanCard: "Co-Applicant PAN Card",
  coAadharFront: "Co-Applicant Aadhaar (Front)",
  coAadharBack: "Co-Applicant Aadhaar (Back)",
  coPhoto: "Co-Applicant Photo",
};

/** Small sub-headings that group related uploads under their fields. */
export const LOAN_DOC_GROUP = {
  AADHAAR: "Aadhaar Card",
  PHOTO: "Applicant Photo",
  BANK: "Bank Statements",
  SALARY: "Salary Slips",
  BUSINESS_PROOF: "Business Proof",
  PROPERTY: "Property Papers",
  VEHICLE: "Vehicle Documents",
  CO_APPLICANT: "Co-Applicant KYC",
};

/** "Years at this Address" choices — same values the Partner app has always stored. */
export const LOAN_STABILITY_OPTIONS = [
  { label: "Less than 1 year", value: "Less than 1 year" },
  { label: "1-3 years", value: "1-3 years" },
  { label: "More than 3 years", value: "More than 3 years" },
];

export const LOAN_SECTION_HINT = {
  LOAN_REQUIREMENT: "How much do you need and why?",
  PERSONAL: "Enter details exactly as on the PAN card.",
  CREDIT: "Running loans, EMI, CIBIL score and bounces.",
  DOCUMENTS: "Upload each document right below its field. Clear photo or PDF; bank statements and salary slips must be PDF.",
  REFERENCES: "Two people we can call to verify the applicant.",
  REVIEW: "Check everything once. Tap Edit, fix that step, then Back to review.",
};

const CIBIL_LABEL = {
  BELOW_600: "Below 600",
  RANGE_600_700: "600 - 700",
  RANGE_700_750: "700 - 750",
  RANGE_750_850: "750 - 850",
};

const SALARY_MODE_LABEL = { ONLINE: "Online (bank transfer)", CASH: "Cash" };

const pick = (form, keys) => {
  for (const k of keys) {
    const v = form?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
};

const text = (v) => (v === undefined || v === null ? "" : String(v).trim());

export const formatLoanInr = (raw) => {
  const n = Number(String(raw ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? `₹${n.toLocaleString("en-IN")}` : text(raw);
};

const humanize = (v) =>
  text(v)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const yesNo = (v) => {
  const s = text(v).toUpperCase();
  return s === "YES" || s === "TRUE" ? "Yes" : "No";
};

const isYes = (v) => yesNo(v) === "Yes";

const truthy = (v) => v === true || ["true", "yes", "1"].includes(text(v).toLowerCase());

/**
 * Review-screen sections in step order. Accepts the field names used by any of the
 * three apps (e.g. contactNo / contactNumber / phone). Each section carries the step
 * index its Edit button should jump to.
 */
export function buildLoanReviewSections(form = {}, options = {}) {
  const {
    profile = LOAN_PROFILE.SALARIED,
    hasProperty = false,
    hasCoApplicant = false,
    sameAddress,
    loanTitle = "",
  } = options;

  const fullName = [form.firstName, form.middleName, form.lastName].map(text).filter(Boolean).join(" ");
  const married = text(form.maritalStatus).toLowerCase() === "married";
  const isSame =
    sameAddress !== undefined
      ? Boolean(sameAddress)
      : truthy(pick(form, ["sameAddress", "isSameAddress", "sameAsCurrent"]));

  const personal = [
    { label: "Loan Type", value: loanTitle },
    { label: "Loan Amount", value: formatLoanInr(pick(form, ["requestedLoanAmount", "loanAmount"])) },
    { label: "Loan Purpose", value: text(form.loanPurpose) },
    {
      label: "Running Loan",
      value: isYes(form.hasRunningLoan)
        ? `Yes · EMI ${formatLoanInr(form.monthlyEmiPaying) || "—"}`
        : "No",
    },
    { label: "CIBIL Score", value: CIBIL_LABEL[text(form.cibilScoreBand)] || text(form.cibilScoreBand) },
    {
      label: "EMI / Cheque Bounce",
      value: isYes(form.hasBounce) ? `Yes · ${text(form.bounceCount) || "—"} time(s)` : "No",
    },
    { label: "Full Name", value: fullName },
    { label: "Mobile", value: text(pick(form, ["contactNo", "contactNumber", "phone"])) },
    { label: "Alternate Mobile", value: text(pick(form, ["alternateContact", "alternatePhone"])), optional: true },
    { label: "Email", value: text(form.email) },
    { label: "PAN", value: text(pick(form, ["pan", "panNumber"])).toUpperCase() },
    { label: "Date of Birth", value: text(pick(form, ["dob", "dateOfBirth"])) },
    { label: "Gender", value: humanize(form.gender) },
    { label: "Marital Status", value: humanize(form.maritalStatus) },
    married
      ? { label: "Spouse Name", value: text(pick(form, ["SpouseName", "spouseName", "wifeName"])) }
      : null,
    { label: "Mother's Name", value: text(pick(form, ["motherName", "mothersName"])) },
    hasCoApplicant
      ? {
          label: "Co-Applicant Mobile",
          value: text(pick(form, ["coMobileNumber", "coApplicantMobile", "coApplicantPhone"])),
        }
      : null,
  ];

  const currentLine = [
    text(form.currentAddress),
    text(pick(form, ["landmarkCurrent", "currentLandmark", "currentAddressLandmark"])),
    text(pick(form, ["pincodeCurrent", "currentpinCode", "currentAddressPinCode", "currentAddressPincode", "currentPincode"])),
  ]
    .filter(Boolean)
    .join(", ");
  const permanentLine = [
    text(form.permanentAddress),
    text(pick(form, ["landmarkPermanent", "permanentLandmark", "permanentAddressLandmark"])),
    text(pick(form, ["pincodePermanent", "permanentPinCode", "permanentAddressPinCode", "permanentAddressPincode", "permanentPincode"])),
  ]
    .filter(Boolean)
    .join(", ");

  const address = [
    { label: "Current Address", value: currentLine },
    {
      label: "House Status",
      value: humanize(pick(form, ["houseStatusCurrent", "currentHouseStatus", "currentAddressHouseStatus", "currentAddressOwnRented"])),
    },
    {
      label: "Years at Address",
      value: text(pick(form, ["stabilityCurrent", "addressStability", "stabilityOfResidency", "currentAddressStability"])),
    },
    { label: "Permanent Address", value: isSame ? "Same as current" : permanentLine },
    isSame
      ? null
      : {
          label: "Permanent House Status",
          value: humanize(pick(form, ["houseStatusPermanent", "permanentHouseStatus", "permanentAddressHouseStatus", "permanentAddressOwnRented"])),
        },
    isSame
      ? null
      : {
          label: "Years at Permanent Address",
          value: text(pick(form, ["stabilityPermanent", "permanentAddressStability", "permanentStability"])),
        },
  ];

  let income;
  if (profile === LOAN_PROFILE.VEHICLE) {
    income = [
      { label: "Vehicle Category", value: humanize(form.vehicleType) },
      { label: "Make / Model", value: [text(form.vehicleMake), text(form.vehicleModel)].filter(Boolean).join(" ") },
      { label: "On-Road Price", value: formatLoanInr(form.onRoadPrice) },
      { label: "Down Payment", value: formatLoanInr(form.downPayment), optional: true },
      { label: "Dealer", value: text(form.dealerName), optional: true },
    ];
  } else if (profile === LOAN_PROFILE.BUSINESS) {
    income = [
      { label: "Business Name", value: text(form.businessName) },
      { label: "Business Address", value: text(form.businessAddress) },
      { label: "Business Landmark", value: text(form.businessLandmark), optional: true },
      { label: "Years in Business", value: text(pick(form, ["businessVintage", "yearsInBusiness"])) },
      { label: "Annual Turnover", value: formatLoanInr(pick(form, ["annualTurnover", "annualTurnoverInINR"])) },
      { label: "GST Number", value: text(form.gstNumber).toUpperCase(), optional: true },
    ];
  } else {
    const totalExp = text(form.totalExperience);
    const currentExp = text(form.currentExperience);
    income = [
      { label: "Company", value: text(form.companyName) },
      { label: "Designation", value: text(form.designation) },
      { label: "Company Address", value: text(form.companyAddress) },
      { label: "Monthly Salary", value: formatLoanInr(form.monthlySalary) },
      { label: "Salary in Hand", value: formatLoanInr(form.salaryInHand) },
      {
        label: "Experience (Total / Current)",
        value: totalExp || currentExp ? `${totalExp || "—"} / ${currentExp || "—"} yrs` : "",
      },
      { label: "Salary Mode", value: SALARY_MODE_LABEL[text(form.salaryReceiptMode).toUpperCase()] || "", optional: true },
      { label: "Official Email", value: text(form.officialEmail), optional: true },
    ];
  }

  if (hasProperty) {
    income.push(
      { label: "Property Type", value: humanize(form.propertyType) },
      { label: "Property Value", value: formatLoanInr(form.propertyValue) },
      { label: "Property Address", value: text(form.propertyAddress) }
    );
  }

  const ref = (n) => {
    const name = text(pick(form, [`ref${n}Name`, `reference${n}Name`]));
    const phone = text(pick(form, [`ref${n}Contact`, `ref${n}Phone`, `reference${n}Contact`, `reference${n}Phone`]));
    return [name, phone].filter(Boolean).join(" · ");
  };

  const stepLabels = getLoanSteps({ profile, hasProperty });
  const clean = (rows) => rows.filter(Boolean).filter((r) => !(r.optional && !text(r.value)));

  return [
    { key: "personal", title: stepLabels[LOAN_STEP.PERSONAL], step: LOAN_STEP.PERSONAL, rows: clean(personal) },
    { key: "address", title: stepLabels[LOAN_STEP.ADDRESS], step: LOAN_STEP.ADDRESS, rows: clean(address) },
    { key: "income", title: stepLabels[LOAN_STEP.INCOME], step: LOAN_STEP.INCOME, rows: clean(income) },
    {
      key: "references",
      title: LOAN_SECTION.REFERENCES,
      step: LOAN_STEP.REFERENCES,
      rows: [
        { label: "Reference 1", value: ref(1) },
        { label: "Reference 2", value: ref(2) },
      ],
    },
  ];
}

const summarizeDocs = (items) => {
  const required = items.filter((d) => d.required);
  const missing = required.find((d) => !d.uploaded);
  return {
    items,
    requiredTotal: required.length,
    requiredDone: required.filter((d) => d.uploaded).length,
    attachedTotal: items.filter((d) => d.uploaded).length,
    firstMissingStep: missing ? missing.step ?? LOAN_STEP.PERSONAL : null,
  };
};

/**
 * Document checklist for the per-step upload counter and the Review screen.
 * `docs`: [{ key, label, required, step, altKeys? }] where `step` is the LOAN_STEP the
 * upload is shown on; `source`: form state or files map.
 */
export function buildLoanDocChecklist(docs = [], source = {}) {
  const has = (k) => {
    const v = source?.[k];
    return Boolean(v) || Boolean(source?.[`${k}_uploaded`]);
  };
  return summarizeDocs(
    docs.map((d) => ({
      ...d,
      uploaded: has(d.key) || (d.altKeys || []).some(has),
    }))
  );
}

/** Same checklist narrowed to the uploads shown on one step. */
export function docChecklistForStep(checklist, step) {
  return summarizeDocs((checklist?.items || []).filter((d) => d.step === step));
}
