/**
 * Loan form file validation + human-readable hints.
 * Align with fin_backend middleware/upload allowed types: PDF, JPG, PNG.
 */

import {
  getMaxUploadBytesForDocType,
  maxUploadMbForDocType,
  normalizeDocTypeForLimits,
} from "./docUploadLimits";

const DOC_LABEL = {
  AADHAR_FRONT: "Aadhaar (front)",
  AADHAR_BACK: "Aadhaar (back)",
  PAN: "PAN card",
  PHOTO: "Passport-size photo",
  SELFIE: "Selfie / live photo",
  OTHER_DOCS: "Supporting document",
  ADDRESS_PROOF: "Address proof",
  LIGHT_BILL: "Utility bill (e.g. electricity)",
  UTILITY_BILL: "Utility bill",
  RENT_AGREEMENT: "Rent agreement",
  COMPANY_ID_CARD: "Company ID card",
  SALARY_SLIP_1: "Salary slip 1",
  SALARY_SLIP_2: "Salary slip 2",
  SALARY_SLIP_3: "Salary slip 3",
  FORM_16_26AS: "Form 16 / 26AS",
  BANK_STATEMENT_1: "Bank statement 1",
  BANK_STATEMENT_2: "Bank statement 2",
  BANK_STATEMENT_3: "Bank statement 3",
  ALLOTMENT_LETTER: "Allotment letter",
  NEW_PROPERTY_PAYMENT_RECEIPTS: "New property payment receipts",
  TITLE_DEEDS: "Title deeds",
  RESALE_PAYMENT_RECEIPTS: "Resale payment receipts",
  AGREEMENT_COPY: "Agreement copy",
  SHOP_ACT: "Shop Act / trade license",
  UDHYAM_AADHAR: "Udyam / UAM",
  ITR: "ITR",
  GST_DOCUMENT: "GST certificate",
  SHOP_PHOTO: "Shop / business photo",
  BUSINESS_OTHER_DOCS: "Other business document",
  CO_APPLICANT_AADHAR_FRONT: "Co-applicant Aadhaar (front)",
  CO_APPLICANT_AADHAR_BACK: "Co-applicant Aadhaar (back)",
  CO_APPLICANT_PAN: "Co-applicant PAN",
  CO_APPLICANT_SELFIE: "Co-applicant selfie",
};

const NEW_ADDRESS_SUB_MAP = {
  lightBill: "LIGHT_BILL",
  utilityBill: "UTILITY_BILL",
  waterBill: "UTILITY_BILL",
  rentAgreement: "RENT_AGREEMENT",
  addressProof: "ADDRESS_PROOF",
};

/** Maps form field `name` to API/normalized doc type used for size limits. */
export function loanFieldToApiDocType(fieldName) {
  if (!fieldName) return "OTHER_DOCS";
  if (fieldName.startsWith("newAddressProofs.")) {
    const sub = fieldName.split(".")[1];
    return NEW_ADDRESS_SUB_MAP[sub] || "ADDRESS_PROOF";
  }
  if (fieldName === "newAddressProofs") return "ADDRESS_PROOF";

  const map = {
    aadharFront: "AADHAR_FRONT",
    aadharBack: "AADHAR_BACK",
    panCard: "PAN",
    passportPhoto: "PHOTO",
    selfie: "SELFIE",
    otherDocument: "OTHER_DOCS",
    otherDocs: "OTHER_DOCS",
    otherDoc: "OTHER_DOCS",
    companyIdCard: "COMPANY_ID_CARD",
    salarySlip1: "SALARY_SLIP_1",
    salarySlip2: "SALARY_SLIP_2",
    salarySlip3: "SALARY_SLIP_3",
    form16_26as: "FORM_16_26AS",
    bankStatement1: "BANK_STATEMENT_1",
    bankStatement2: "BANK_STATEMENT_2",
    bankStatement3: "BANK_STATEMENT_3",
    allotmentLetter: "ALLOTMENT_LETTER",
    newPropertyPaymentReceipts: "NEW_PROPERTY_PAYMENT_RECEIPTS",
    titleDeeds: "TITLE_DEEDS",
    resalePaymentReceipts: "RESALE_PAYMENT_RECEIPTS",
    agreementCopy: "AGREEMENT_COPY",
    addressProof: "ADDRESS_PROOF",
    utilityBill: "UTILITY_BILL",
    rentAgreement: "RENT_AGREEMENT",
    waterBill: "UTILITY_BILL",
    lightBill: "LIGHT_BILL",
    lightBillFile: "LIGHT_BILL",
    waterBillFile: "UTILITY_BILL",
    rentAgreementFile: "RENT_AGREEMENT",
    shopAct: "SHOP_ACT",
    gumastaLicense: "SHOP_ACT",
    udyamAadhar: "UDHYAM_AADHAR",
    udyamAadhar: "UDHYAM_AADHAR",
    itr: "ITR",
    itrDocument: "ITR",
    gstDoc: "GST_DOCUMENT",
    gstDocument: "GST",
    shopPhoto: "SHOP_PHOTO",
    otherBusinessDoc: "BUSINESS_OTHER_DOCS",
    coApplicantAadharFront: "CO_APPLICANT_AADHAR_FRONT",
    coApplicantAadharBack: "CO_APPLICANT_AADHAR_BACK",
    coApplicantPan: "CO_APPLICANT_PAN",
    coApplicantSelfie: "CO_APPLICANT_SELFIE",
    coAadharFront: "CO_APPLICANT_AADHAR_FRONT",
    coAadharBack: "CO_APPLICANT_AADHAR_BACK",
    coPanCard: "CO_APPLICANT_PAN",
    coSelfie: "CO_APPLICANT_SELFIE",
    form16: "FORM_16_26AS",
    statement1: "BANK_STATEMENT_1",
    statement2: "BANK_STATEMENT_2",
  };
  return map[fieldName] || "OTHER_DOCS";
}

export function isImagesOnlyLoanField(fieldName) {
  return ["passportPhoto", "selfie", "coApplicantSelfie", "coSelfie"].includes(
    fieldName
  );
}

export function fileMatchesLoanPdfJpegPng(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  const n = (file.name || "").toLowerCase();
  if (t === "application/pdf") return true;
  if (t === "image/jpeg" || t === "image/jpg" || t === "image/png") return true;
  if (n.endsWith(".pdf")) return true;
  if (/\.(jpe?g|png)$/i.test(n)) return true;
  return false;
}

export function fileMatchesLoanJpegPngOnly(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  const n = (file.name || "").toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg" || t === "image/png") return true;
  if (/\.(jpe?g|png)$/i.test(n)) return true;
  return false;
}

/**
 * @param {File} file
 * @param {string} fieldName input name attribute
 * @returns {string|null} error message or null
 */
export function validateLoanDocumentUpload(file, fieldName) {
  if (!file) return null;

  if (isImagesOnlyLoanField(fieldName)) {
    if (!fileMatchesLoanJpegPngOnly(file)) {
      return "This field only accepts JPG or PNG images (no PDF).";
    }
  } else if (!fileMatchesLoanPdfJpegPng(file)) {
    return "Invalid file type. Use PDF, JPG, or PNG.";
  }

  const rawType = loanFieldToApiDocType(fieldName);
  const docType = normalizeDocTypeForLimits(rawType);
  const max = getMaxUploadBytesForDocType(docType);
  if (typeof file.size === "number" && file.size > max) {
    const mb = maxUploadMbForDocType(docType);
    return `File is too large. Maximum for this document is ${mb}MB.`;
  }
  return null;
}

/** One-line hint under upload controls: stored doc type, formats, max size. */
export function loanDocumentFieldHint(fieldName) {
  const rawType = loanFieldToApiDocType(fieldName);
  const docType = normalizeDocTypeForLimits(rawType);
  const label = DOC_LABEL[docType] || docType.replace(/_/g, " ");
  const mb = maxUploadMbForDocType(docType);
  const formats = isImagesOnlyLoanField(fieldName) ? "JPG, PNG only" : "PDF, JPG, PNG";
  return `Stored as “${label}” (${docType}) · ${formats} · max ${mb}MB`;
}
