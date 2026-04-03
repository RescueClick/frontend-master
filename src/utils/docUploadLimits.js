/**
 * Client-side limits for loan/application docs — keep tiers in sync with
 * fin_backend/src/utils/docUploadLimits.js
 */

export const DOC_UPLOAD_LIMIT_BYTES = {
  ID_KYC: 5 * 1024 * 1024,
  SELFIE: 5 * 1024 * 1024,
  PAYSLIP_SMALL: 10 * 1024 * 1024,
  BANK_STATEMENT: 15 * 1024 * 1024,
  PROPERTY_LEGAL: 20 * 1024 * 1024,
  OTHER: 20 * 1024 * 1024,
};

export function normalizeDocTypeForLimits(docType) {
  const key = String(docType || "").trim().toUpperCase();
  const aliases = {
    AADHAAR_FRONT: "AADHAR_FRONT",
    AADHAAR_BACK: "AADHAR_BACK",
    PASSPORT_PHOTO: "PHOTO",
    OTHER_DOC: "OTHER_DOCS",
    FORM16: "FORM_16_26AS",
    FORM_16: "FORM_16_26AS",
    FORM16_26AS: "FORM_16_26AS",
    "26AS": "FORM_16_26AS",
    COMPANY_ID: "COMPANY_ID_CARD",
    COMPANY_IDCARD: "COMPANY_ID_CARD",
    GST: "GST_DOCUMENT",
    GST_DOC: "GST_DOCUMENT",
    GST_CERTIFICATE: "GST_DOCUMENT",
    BANK_STATEMENT: "BANK_STATEMENT_1",
    CO_APPLICANT_PASSPORT_PHOTO: "CO_APPLICANT_SELFIE",
  };
  return aliases[key] || key;
}

function limitCategoryForNormalizedDocType(normalized) {
  const key = String(normalized || "").trim().toUpperCase();
  if (!key) return "OTHER";

  if (key === "SELFIE" || key === "CO_APPLICANT_SELFIE") return "SELFIE";
  if (key.startsWith("BANK_STATEMENT")) return "BANK_STATEMENT";

  if (
    key === "TITLE_DEEDS" ||
    key === "AGREEMENT_COPY" ||
    key === "ALLOTMENT_LETTER" ||
    key === "NEW_PROPERTY_PAYMENT_RECEIPTS" ||
    key === "RESALE_PAYMENT_RECEIPTS"
  ) {
    return "PROPERTY_LEGAL";
  }

  if (
    key === "SALARY_SLIP_1" ||
    key === "SALARY_SLIP_2" ||
    key === "SALARY_SLIP_3" ||
    key === "FORM_16_26AS" ||
    key === "ITR" ||
    key === "SHOP_ACT" ||
    key === "GST_DOCUMENT" ||
    key === "SHOP_PHOTO"
  ) {
    return "PAYSLIP_SMALL";
  }

  if (key === "OTHER_DOCS" || key === "BUSINESS_OTHER_DOCS" || key === "UNKNOWN") {
    return "OTHER";
  }

  const idKyc = new Set([
    "PAN",
    "AADHAR_FRONT",
    "AADHAR_BACK",
    "ADDRESS_PROOF",
    "LIGHT_BILL",
    "UTILITY_BILL",
    "RENT_AGREEMENT",
    "PHOTO",
    "COMPANY_ID_CARD",
    "CO_APPLICANT_AADHAR_FRONT",
    "CO_APPLICANT_AADHAR_BACK",
    "CO_APPLICANT_PAN",
    "UDHYAM_AADHAR",
  ]);
  if (idKyc.has(key)) return "ID_KYC";

  return "OTHER";
}

export function getMaxUploadBytesForDocType(docType) {
  const normalized = normalizeDocTypeForLimits(docType);
  const cat = limitCategoryForNormalizedDocType(normalized);
  return DOC_UPLOAD_LIMIT_BYTES[cat];
}

export function maxUploadMbForDocType(docType) {
  return getMaxUploadBytesForDocType(docType) / (1024 * 1024);
}

/** @param {{ file?: File, type: string }[]} docsQueue */
export function findOversizeInLoanDocsQueue(docsQueue) {
  if (!docsQueue?.length) return null;
  for (const item of docsQueue) {
    const { file, type } = item;
    if (!file || typeof file.size !== "number") continue;
    const max = getMaxUploadBytesForDocType(type);
    if (file.size > max) {
      return {
        type,
        normalized: normalizeDocTypeForLimits(type),
        maxBytes: max,
      };
    }
  }
  return null;
}

export function formatLoanDocOversizeError(violation) {
  const label = String(violation.normalized || violation.type || "DOCUMENT").replace(
    /_/g,
    " "
  );
  const mb = maxUploadMbForDocType(violation.type);
  return `${label}: file is too large. Maximum for this document type is ${mb}MB.`;
}
