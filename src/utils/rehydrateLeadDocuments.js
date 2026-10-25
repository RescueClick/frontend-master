import axios from "axios";
import { backendurl } from "../feature/urldata";

/**
 * Mapping between backend docType and frontend loan form field keys.
 */
export const DOC_TYPE_TO_FIELD = {
  AADHAR_FRONT: "aadharFront",
  AADHAR_BACK: "aadharBack",
  PAN: "panCard",
  PHOTO: "passportPhoto",
  SELFIE: "selfie",
  COMPANY_ID_CARD: "companyIdCard",
  SALARY_SLIP_1: "salarySlip1",
  SALARY_SLIP_2: "salarySlip2",
  SALARY_SLIP_3: "salarySlip3",
  FORM_16_26AS: "form16_26as",
  BANK_STATEMENT_1: "bankStatement1",
  BANK_STATEMENT_2: "bankStatement2",
  BANK_STATEMENT_3: "bankStatement3",
  ALLOTMENT_LETTER: "allotmentLetter",
  NEW_PROPERTY_PAYMENT_RECEIPTS: "newPropertyPaymentReceipts",
  TITLE_DEEDS: "titleDeeds",
  RESALE_PAYMENT_RECEIPTS: "resalePaymentReceipts",
  AGREEMENT_COPY: "agreementCopy",
  SHOP_ACT: "shopAct",
  UDHYAM_AADHAR: "udyamAadhar",
  ITR: "itr",
  GST_DOCUMENT: "gstDoc",
  GST: "gstDoc",
  SHOP_PHOTO: "shopPhoto",
  BUSINESS_OTHER_DOCS: "otherBusinessDoc",
  OTHER_DOCS: "otherDocument",
  ADDRESS_PROOF: "addressProof",
  LIGHT_BILL: "lightBill",
  UTILITY_BILL: "utilityBill",
  RENT_AGREEMENT: "rentAgreement",
  CO_APPLICANT_AADHAR_FRONT: "coApplicantAadharFront",
  CO_APPLICANT_AADHAR_BACK: "coApplicantAadharBack",
  CO_APPLICANT_PAN: "coApplicantPan",
  CO_APPLICANT_SELFIE: "coApplicantSelfie",
};

/**
 * Fetch documents stored on the server for an application/lead.
 */
export async function fetchLeadDocuments(applicationId, { partnerToken, isPartnerLoggedIn } = {}) {
  if (!applicationId) return { ok: false, docs: [] };

  try {
    const headers = {};
    if (isPartnerLoggedIn && partnerToken) {
      headers.Authorization = `Bearer ${partnerToken}`;
    }

    const res = await axios.get(`${backendurl}/leads/${applicationId}/docs`, {
      headers,
      timeout: 10000,
    });

    return {
      ok: true,
      docs: res.data?.docs || [],
      applicationId,
    };
  } catch (err) {
    console.warn("fetchLeadDocuments warning:", err?.message);
    return { ok: false, docs: [], error: err };
  }
}

/**
 * Convert backend docs array into formData fields and status mapping.
 */
export function buildHydratedDocFields(docs = []) {
  const fields = {};
  const statuses = {};

  for (const doc of docs) {
    const url = doc?.url;
    if (!url) continue;

    const typeKey = (doc?.docType || "").toUpperCase();
    const fieldName = DOC_TYPE_TO_FIELD[typeKey] || doc?.docType?.toLowerCase();
    if (!fieldName) continue;

    const isPdf = /\.pdf($|\?)/i.test(url);
    const docObj = {
      name: doc?.fileName || `${fieldName}.${isPdf ? "pdf" : "jpg"}`,
      url,
      preview: url,
      type: isPdf ? "application/pdf" : "image/jpeg",
      isExistingDoc: true,
      uploaded: true,
    };

    fields[fieldName] = docObj;
    fields[`${fieldName}_uploaded`] = true;
    fields[`${fieldName}_url`] = url;
    fields[`${fieldName}_name`] = docObj.name;
    statuses[fieldName] = "uploaded";
  }

  return { fields, statuses };
}

/**
 * Serialize form data for localStorage while preserving uploaded documents info
 * so that upon browser refresh, documents remain previewable and marked as saved.
 */
export function serializeDraftWithDocs(formData = {}) {
  const serialized = {};

  for (const [key, value] of Object.entries(formData || {})) {
    // Never store passwords
    if (key === "password" || key === "confirmPassword") {
      serialized[key] = "";
      continue;
    }

    // Check if field is a File or an uploaded document descriptor
    const isFile = value instanceof File || (value && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && !value.url);
    const hasRemoteUrl = value?.url || formData[`${key}_url`];
    const isMarkedUploaded = Boolean(formData[`${key}_uploaded`] || hasRemoteUrl);

    if (isFile || (value && typeof value === "object" && (value.url || value.preview))) {
      if (isMarkedUploaded && hasRemoteUrl) {
        const url = hasRemoteUrl;
        const isPdf = /\.pdf($|\?)/i.test(url);
        serialized[key] = {
          name: value?.name || formData[`${key}_name`] || `${key}.${isPdf ? "pdf" : "jpg"}`,
          size: value?.size || 0,
          type: value?.type || (isPdf ? "application/pdf" : "image/jpeg"),
          url,
          preview: url,
          isExistingDoc: true,
        };
        serialized[`${key}_uploaded`] = true;
        serialized[`${key}_url`] = url;
        serialized[`${key}_name`] = serialized[key].name;
      } else {
        // Raw file that hasn't finished background upload yet cannot be saved in localStorage
        serialized[key] = null;
      }
      continue;
    }

    serialized[key] = value;
  }

  return serialized;
}
