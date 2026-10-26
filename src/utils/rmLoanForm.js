import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { backendurl } from "../feature/urldata";
import { getAuthData } from "./localStorage";

export const RM_LOAN_FORM_PATH = {
  PERSONAL: "/rm/personal-loan",
  BUSINESS: "/rm/bussiness-loan",
  HOME_LOAN_SALARIED: "/rm/home-loan-salaried",
  HOME_LOAN_SELF_EMPLOYED: "/rm/home-loan-self-employee",
  LAP_SALARIED: "/rm/lap-loan-salaried",
  LAP_SELF_EMPLOYED: "/rm/lap-loan-self-employee",
  LAP: "/rm/lap-loan-salaried",
};

export function rmLoanFormPath(loanType) {
  const key = String(loanType || "").toUpperCase();
  return RM_LOAN_FORM_PATH[key] || "/rm/leads";
}

export function rmCompleteLoanFormUrl(applicationId) {
  return `${backendurl}/rm/applications/${applicationId}/complete-form`;
}

function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const raw = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Map GET /rm/applications/:id/form-data into loan form field keys.
 */
export function mapRmFormDataToLoanFields(payload = {}) {
  const c = payload.customer || {};
  const emp = payload.employmentInfo || {};
  const biz = payload.businessInfo || {};
  const prop = payload.propertyInfo || {};
  const refs = Array.isArray(payload.references) ? payload.references : [];
  const co = payload.coApplicant || {};

  return {
    firstName: c.firstName || "",
    middleName: c.middleName || "",
    lastName: c.lastName || "",
    gender: c.gender ? (c.gender.charAt(0).toUpperCase() + c.gender.slice(1).toLowerCase()) : "",
    officialEmail: c.officialEmail || "",
    stabilityOfResidency: c.stabilityOfResidency || "",
    currentHouseStatus: c.currentAddressHouseStatus || "",
    currentLandmark: c.currentAddressLandmark || "",
    permanentHouseStatus: c.permanentAddressHouseStatus || "",
    permanentLandmark: c.permanentAddressLandmark || "",
    permanentStability: c.permanentAddressStability || "",
    currentAddressPinCode: c.currentAddressPinCode || "",
    permanentAddressPinCode: c.permanentAddressPinCode || "",
    maritalStatus: c.maritalStatus ? (c.maritalStatus.charAt(0).toUpperCase() + c.maritalStatus.slice(1).toLowerCase()) : "",
    wifeName: c.spouseName || "",
    motherName: c.mothersName || "",
    contactNo: c.phone || "",
    email: c.email || "",
    dob: toDateInputValue(c.dateOfBirth),
    pan: c.panNumber || "",
    currentAddress: c.currentAddress || "",
    permanentAddress: c.permanentAddress || "",
    companyName: emp.companyName || "",
    designation: emp.designation || "",
    companyAddress: emp.companyAddress || "",
    monthlySalary: emp.monthlySalary ?? "",
    totalExperience: emp.totalExperience ?? "",
    currentExperience: emp.currentExperience ?? "",
    businessName: biz.businessName || "",
    businessAddress: biz.businessAddress || "",
    businessLandmark: biz.businessLandmark || "",
    businessVintage: biz.businessVintage || biz.yearsInBusiness || "",
    gstNumber: biz.gstNumber || "",
    annualTurnover: biz.annualTurnoverInINR || biz.annualTurnover || "",
    annualTurnoverInINR: biz.annualTurnoverInINR || biz.annualTurnover || "",
    yearsInBusiness: biz.yearsInBusiness || biz.businessVintage || "",
    propertyType: prop.propertyType || "",
    propertyValue: prop.propertyValue ?? "",
    propertyAddress: prop.propertyAddress || "",
    reference1Name: refs[0]?.name || "",
    reference1Contact: refs[0]?.phone || "",
    reference2Name: refs[1]?.name || "",
    reference2Contact: refs[1]?.phone || "",
    loanAmount: c.loanAmount ?? "",
    bankStatementPassword: c.bankStatementPassword || "",
    hasRunningLoan: c.hasRunningLoan || "NO",
    monthlyEmiPaying: c.monthlyEmiPaying ?? "",
    loanPurpose: c.loanPurpose || "",
    salaryReceiptMode: c.salaryReceiptMode || "",
    cibilScoreBand: c.cibilScoreBand || "",
    hasBounce: c.hasBounce || "NO",
    bounceCount: c.bounceCount ?? "",
    salaryInHand: c.salaryInHand || emp.salaryInHand || "",
    coApplicantName: co.name || co.firstName || "",
    coApplicantPhone: co.phone || "",
    coApplicantMobile: co.phone || "",
    coApplicantRelation: co.relation || "",
  };
}

export function partnerCompleteLoanFormUrl(applicationId) {
  return `${backendurl}/partner/applications/${applicationId}/complete-form`;
}

export function useRmLoanFormResume({ enabled, setFormData, setApplicationId }) {
  const [searchParams] = useSearchParams();
  const applicationIdParam = searchParams.get("applicationId");
  const [resumeMeta, setResumeMeta] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    if (!enabled || !applicationIdParam) return undefined;
    let cancelled = false;

    const load = async () => {
      setLoadingResume(true);
      setResumeError("");
      try {
        const { rmToken, partnerToken } = getAuthData();
        const token = rmToken || partnerToken;
        const endpoint = rmToken
          ? `${backendurl}/rm/applications/${applicationIdParam}/form-data`
          : `${backendurl}/partner/applications/${applicationIdParam}/form-data`;

        const { data } = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        setApplicationId?.(data.id || applicationIdParam);

        // Hydrate existing uploaded documents into form fields and upload flags
        const docFields = {};
        if (Array.isArray(data.docs) && data.docs.length > 0) {
          const DOC_TYPE_TO_FIELD = {
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
            UDHYAM_AADHAR: "udhyamAadhar",
            ITR: "itr",
            GST_DOCUMENT: "gstDoc",
            GST: "gstDoc",
            SHOP_PHOTO: "shopPhoto",
            BUSINESS_OTHER_DOCS: "businessOtherDocs",
            OTHER_DOCS: "otherDocs",
            ADDRESS_PROOF: "addressProof",
            CO_APPLICANT_AADHAR_FRONT: "coApplicantAadharFront",
            CO_APPLICANT_AADHAR_BACK: "coApplicantAadharBack",
            CO_APPLICANT_PAN: "coApplicantPan",
            CO_APPLICANT_SELFIE: "coApplicantSelfie",
            CO_APPLICANT_SELFIE_OR_PHOTO: "coApplicantSelfie",
            CO_APPLICANT_PASSPORT_PHOTO: "coApplicantSelfie",
          };

          for (const doc of data.docs) {
            const fieldName = DOC_TYPE_TO_FIELD[doc.docType];
            if (fieldName && doc.url) {
              const docObj = {
                name: `${fieldName}.jpg`,
                url: doc.url,
                preview: doc.url,
                isExistingDoc: true,
                uploaded: true,
                size: 1024,
                type: "image/jpeg",
              };
              docFields[fieldName] = docObj;
              docFields[`${fieldName}_uploaded`] = true;
              docFields[`${fieldName}_url`] = doc.url;
            }
          }
        }

        setFormData?.((prev) => ({
          ...prev,
          ...mapRmFormDataToLoanFields(data),
          ...docFields,
          customFieldResponses: data.customFieldResponses || prev.customFieldResponses || {},
        }));
        setResumeMeta({
          id: data.id,
          appNo: data.appNo,
          status: data.status,
          loanType: data.loanType,
          existingDocs: data.docs || [],
        });
      } catch (err) {
        if (cancelled) return;
        setResumeError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load application details for editing"
        );
      } finally {
        if (!cancelled) setLoadingResume(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, applicationIdParam, setFormData, setApplicationId]);

  return {
    resumeApplicationId: applicationIdParam,
    resumeMeta,
    loadingResume,
    resumeError,
  };
}
