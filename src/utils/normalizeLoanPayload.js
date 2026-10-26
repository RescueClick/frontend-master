import { personFinancialCustomerFields } from "./personFinancial";
import { normalizeMobileDigits } from "./phoneNormalize";

/**
 * Normalizes phone numbers to clean 10 digits
 */
export function normalizePhone(value) {
  if (typeof normalizeMobileDigits === "function") {
    return normalizeMobileDigits(value);
  }
  const d = String(value ?? "").replace(/\D/g, "");
  if (!d) return "";
  return d.length > 10 ? d.slice(-10) : d.slice(0, 10);
}

export const PAN_FORMAT_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function isValidPanFormat(value) {
  return PAN_FORMAT_REGEX.test(String(value || "").trim().toUpperCase());
}

/** Whole years since `dob` (YYYY-MM-DD), or null when empty / invalid. */
export function ageFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** Shared DOB rule: required, valid date, applicant at least 18. Returns an error message or "". */
export function dobError(dob) {
  if (!dob) return "Date of Birth is required.";
  const age = ageFromDob(dob);
  if (age === null) return "Enter a valid date of birth.";
  if (age < 18) return "You must be at least 18 years old to proceed.";
  return "";
}

export function isMarriedStatus(value) {
  return String(value || "").trim().toLowerCase() === "married";
}

const GENDER_API_VALUES = { male: "Male", female: "Female", other: "Other" };

const MARITAL_STATUS_API_VALUES = {
  single: "Single",
  married: "Married",
  divorced: "Divorced",
  widow: "Widowed",
  widowed: "Widowed",
};

/** Backend enum: Male / Female / Other. */
export function normalizeGenderForApi(value) {
  const key = String(value || "").trim().toLowerCase();
  return GENDER_API_VALUES[key] || "";
}

/** Backend enum: Single / Married / Divorced / Widowed. */
export function normalizeMaritalStatusForApi(value) {
  const key = String(value || "").trim().toLowerCase();
  return MARITAL_STATUS_API_VALUES[key] || "";
}

function houseStatusKey(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v.startsWith("own")) return "own";
  if (v.startsWith("rent")) return "rented";
  if (v.startsWith("parent")) return "parental";
  return v;
}

/** Pick the select option matching a (possibly differently cased / worded) stored house status. */
export function houseStatusOptionValue(value, optionValues = []) {
  const key = houseStatusKey(value);
  if (!key) return "";
  return optionValues.find((opt) => houseStatusKey(opt) === key) || "";
}

/** Customer login password is optional (backend auto-generates); validate only when entered. */
export function customerPasswordErrors(data = {}) {
  const errors = {};
  const password = String(data.password || "");
  const confirmPassword = String(data.confirmPassword || "");
  if (!password && !confirmPassword) return errors;
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

/**
 * Standardize any Web loan form state into the canonical backend contract.
 * Automatically maps legacy UI field names (contactNo, dob, wifeName, pan, motherName, etc.)
 * to backend schema fields.
 */
export function buildCanonicalLoanPayload(formData = {}, loanType = "PERSONAL", options = {}) {
  const { isPartnerLoggedIn = false } = options;

  const phone = normalizePhone(formData.contactNo || formData.phone || formData.mobileNumber);
  const alternatePhone = normalizePhone(formData.alternateContact || formData.alternatePhone);
  const email = String(formData.email || "").trim().toLowerCase();
  const officialEmail = String(formData.officialEmail || "").trim().toLowerCase();
  const panNumber = String(formData.pan || formData.panNumber || "").trim().toUpperCase();
  const dateOfBirth = formData.dob || formData.dateOfBirth || "";

  const spouseName = String(
    formData.wifeName || formData.SpouseName || formData.spouseName || formData.husbandName || ""
  ).trim();

  const currentAddress = String(formData.currentAddress || "").trim();
  const currentAddressLandmark = String(formData.currentLandmark || formData.currentAddressLandmark || "").trim();
  const currentAddressPinCode = String(
    formData.currentAddressPinCode || formData.currentAddressPincode || formData.currentPincode || ""
  ).trim();
  const currentAddressHouseStatus = String(
    formData.currentHouseStatus || formData.currentAddressOwnRented || formData.currentAddressHouseStatus || ""
  ).trim();
  const stabilityOfResidency = String(
    formData.stabilityOfResidency || formData.currentAddressStability || ""
  ).trim();

  const permanentAddress = String(formData.permanentAddress || currentAddress).trim();
  const permanentAddressLandmark = String(formData.permanentLandmark || formData.permanentAddressLandmark || "").trim();
  const permanentAddressPinCode = String(
    formData.permanentAddressPinCode || formData.permanentAddressPincode || formData.permanentPincode || ""
  ).trim();
  const permanentAddressHouseStatus = String(
    formData.permanentHouseStatus || formData.permanentAddressOwnRented || formData.permanentAddressHouseStatus || ""
  ).trim();
  const permanentAddressStability = String(
    formData.permanentStability || formData.permanentAddressStability || ""
  ).trim();

  const loanAmount = Number(String(formData.loanAmount || 0).replace(/,/g, "")) || 0;

  const customer = {
    firstName: String(formData.firstName || "").trim(),
    middleName: String(formData.middleName || "").trim(),
    lastName: String(formData.lastName || formData.surname || "").trim(),
    email,
    officialEmail: officialEmail || undefined,
    phone,
    alternatePhone: alternatePhone || undefined,
    mothersName: String(formData.motherName || formData.mothersName || "").trim(),
    panNumber,
    dateOfBirth,
    gender: normalizeGenderForApi(formData.gender) || "Male",
    maritalStatus: normalizeMaritalStatusForApi(formData.maritalStatus) || "Single",
    spouseName: isMarriedStatus(formData.maritalStatus) ? spouseName : "",
    currentAddress,
    currentAddressLandmark,
    currentAddressPinCode,
    currentAddressHouseStatus,
    currentAddressOwnRented: formData.currentAddressOwnRented || currentAddressHouseStatus,
    currentAddressStability: stabilityOfResidency,
    stabilityOfResidency,
    permanentAddress,
    permanentAddressLandmark,
    permanentAddressPinCode,
    permanentAddressHouseStatus,
    permanentAddressOwnRented: formData.permanentAddressOwnRented || permanentAddressHouseStatus,
    permanentAddressStability,
    loanAmount,
    password: formData.password || undefined,
    bankStatementPassword: formData.bankStatementPassword || "",
    hasRunningLoan: formData.hasRunningLoan || "NO",
    monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
    loanPurpose: formData.loanPurpose || "",
    ...personFinancialCustomerFields(formData),
  };

  const product = {
    // Salaried employment fields
    companyName: String(formData.companyName || "").trim(),
    designation: String(formData.designation || "").trim(),
    companyAddress: String(formData.companyAddress || currentAddress).trim(),
    monthlySalary: String(formData.monthlySalary || "").trim(),
    totalExperience: String(formData.totalExperience || "").trim(),
    currentExperience: String(formData.currentExperience || "").trim(),
    salaryInHand: String(formData.salaryInHand || "").trim(),
    // Business fields
    businessName: String(formData.businessName || formData.shopName || "").trim(),
    businessAddress: String(formData.businessAddress || formData.shopAddress || "").trim(),
    businessLandmark: String(formData.businessLandmark || "").trim(),
    businessVintage: String(formData.businessVintage || formData.yearsInBusiness || "").trim(),
    yearsInBusiness: String(formData.yearsInBusiness || formData.businessVintage || "").trim(),
    annualTurnover: String(formData.annualTurnover || "").trim(),
    annualTurnoverInINR: String(formData.annualTurnover || formData.annualTurnoverInINR || "").trim(),
    gstNumber: String(formData.gstNumber || "").trim().toUpperCase(),
    // Property fields
    propertyType: formData.propertyType || undefined,
    propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
    propertyAddress: String(formData.propertyAddress || "").trim(),
  };

  const references = [];
  const ref1Phone = normalizePhone(formData.reference1Contact || formData.ref1Phone || formData.reference1Phone);
  const ref2Phone = normalizePhone(formData.reference2Contact || formData.ref2Phone || formData.reference2Phone);

  if (formData.reference1Name || ref1Phone) {
    references.push({ name: String(formData.reference1Name || "").trim(), phone: ref1Phone });
  }
  if (formData.reference2Name || ref2Phone) {
    references.push({ name: String(formData.reference2Name || "").trim(), phone: ref2Phone });
  }

  const coApplicantPhone = normalizePhone(
    formData.coApplicantMobile ||
    formData.coApplicantPhone ||
    formData.coApplicantContact ||
    formData.coApplicant?.phone ||
    formData.coApplicant?.mobile
  );
  const coApplicantName = String(
    formData.coApplicantName || formData.coApplicant?.name || ""
  ).trim();
  const coApplicantRelation = String(
    formData.coApplicantRelation || formData.coApplicant?.relation || ""
  ).trim();

  const coApplicantObj = coApplicantPhone
    ? {
        phone: coApplicantPhone,
        ...(coApplicantName ? { name: coApplicantName } : {}),
        ...(coApplicantRelation ? { relation: coApplicantRelation } : {}),
      }
    : undefined;

  return {
    loanType,
    partnerReferralCode: isPartnerLoggedIn
      ? undefined
      : formData.partnerReferralCode?.trim() || undefined,
    customer,
    product,
    references,
    coApplicant: coApplicantObj,
    propertyType: formData.propertyType,
    propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
    propertyAddress: formData.propertyAddress,
  };
}

/**
 * Standard document queues per loan type aligned with backend rules
 */
export const MANDATORY_DOC_KEYS = {
  PERSONAL: [
    "AADHAR_FRONT", "AADHAR_BACK", "PAN", "PHOTO",
    "ADDRESS_PROOF", "COMPANY_ID_CARD",
    "SALARY_SLIP_1", "SALARY_SLIP_2", "SALARY_SLIP_3",
    "BANK_STATEMENT_1"
  ],
  BUSINESS: [
    "AADHAR_FRONT", "AADHAR_BACK", "PAN", "PHOTO",
    "ADDRESS_PROOF", "SHOP_ACT", "UDHYAM_AADHAR",
    "ITR", "SHOP_PHOTO", "BANK_STATEMENT_1"
  ],
};
