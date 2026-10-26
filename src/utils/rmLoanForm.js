import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { backendurl } from "../feature/urldata";
import { getAuthData } from "./localStorage";
import { buildHydratedDocFields } from "./rehydrateLeadDocuments";

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

function textValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function capitalizeWord(value) {
  const s = textValue(value).trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

/**
 * Map GET /rm/applications/:id/form-data into loan form field keys.
 * Returns both key schemes: salaried forms (contactNo, pan, currentHouseStatus…)
 * and self-employed forms (phone, panNumber, currentAddressOwnRented…).
 */
export function mapRmFormDataToLoanFields(payload = {}) {
  const c = payload.customer || {};
  const emp = payload.employmentInfo || {};
  const biz = payload.businessInfo || {};
  const prop = payload.propertyInfo || {};
  const refs = Array.isArray(payload.references) ? payload.references : [];
  const co = payload.coApplicant || {};
  const fin = payload.financialDetails || {};

  const phone = textValue(c.phone);
  const panNumber = textValue(c.panNumber);
  const spouseName = textValue(c.spouseName);
  const currentPin = textValue(c.currentAddressPinCode || c.currentAddressPincode);
  const permanentPin = textValue(c.permanentAddressPinCode || c.permanentAddressPincode);
  const currentLandmark = textValue(c.currentAddressLandmark);
  const permanentLandmark = textValue(c.permanentAddressLandmark);

  return {
    firstName: c.firstName || "",
    middleName: c.middleName || "",
    lastName: c.lastName || "",
    gender: capitalizeWord(c.gender),
    officialEmail: c.officialEmail || "",
    stabilityOfResidency: textValue(c.stabilityOfResidency || c.currentAddressStability),
    currentHouseStatus: textValue(c.currentAddressHouseStatus || c.currentAddressOwnRented),
    currentLandmark,
    permanentHouseStatus: textValue(c.permanentAddressHouseStatus || c.permanentAddressOwnRented),
    permanentLandmark,
    permanentStability: textValue(c.permanentAddressStability),
    currentAddressPinCode: currentPin,
    permanentAddressPinCode: permanentPin,
    maritalStatus: capitalizeWord(c.maritalStatus),
    wifeName: spouseName,
    SpouseName: spouseName,
    motherName: c.mothersName || c.motherName || "",
    contactNo: phone,
    phone,
    alternateContact: textValue(c.alternatePhone),
    email: c.email || "",
    dob: toDateInputValue(c.dateOfBirth),
    pan: panNumber,
    panNumber,
    currentAddress: c.currentAddress || "",
    permanentAddress: c.permanentAddress || "",
    currentAddressPincode: currentPin,
    currentAddressOwnRented: textValue(c.currentAddressOwnRented || c.currentAddressHouseStatus),
    currentAddressStability: textValue(c.currentAddressStability || c.stabilityOfResidency),
    currentAddressLandmark: currentLandmark,
    permanentAddressPincode: permanentPin,
    permanentAddressOwnRented: textValue(c.permanentAddressOwnRented || c.permanentAddressHouseStatus),
    permanentAddressStability: textValue(c.permanentAddressStability),
    permanentAddressLandmark: permanentLandmark,
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
    ...(prop.propertyType ? { propertyType: prop.propertyType } : {}),
    propertyValue: prop.propertyValue ?? "",
    propertyAddress: prop.propertyAddress || "",
    reference1Name: refs[0]?.name || "",
    reference1Contact: refs[0]?.phone || "",
    reference2Name: refs[1]?.name || "",
    reference2Contact: refs[1]?.phone || "",
    loanAmount: c.loanAmount || payload.requestedAmount || "",
    bankStatementPassword: c.bankStatementPassword || "",
    hasRunningLoan: c.hasRunningLoan || payload.hasRunningLoan || fin.hasRunningLoan || "NO",
    monthlyEmiPaying: c.monthlyEmiPaying ?? payload.monthlyEmiPaying ?? "",
    loanPurpose: c.loanPurpose || payload.loanPurpose || fin.loanPurpose || "",
    salaryReceiptMode: c.salaryReceiptMode || payload.salaryReceiptMode || fin.salaryReceiptMode || "",
    cibilScoreBand: c.cibilScoreBand || payload.cibilScoreBand || fin.cibilScoreBand || "",
    hasBounce: c.hasBounce || payload.hasBounce || fin.hasBounce || "NO",
    bounceCount: c.bounceCount ?? payload.bounceCount ?? "",
    salaryInHand: c.salaryInHand || emp.salaryInHand || "",
    coApplicantName: co.name || co.firstName || "",
    coApplicantPhone: co.phone || "",
    coApplicantMobile: co.phone || "",
    coApplicantRelation: co.relation || "",
    ...(co.phone ? { hasCoApplicant: true } : {}),
  };
}

export function partnerCompleteLoanFormUrl(applicationId) {
  return `${backendurl}/partner/applications/${applicationId}/complete-form`;
}

export function useRmLoanFormResume({ enabled, setFormData, setApplicationId, preferPartner = false }) {
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
        const usePartner = Boolean(partnerToken) && (preferPartner || !rmToken);
        const token = usePartner ? partnerToken : rmToken;
        const endpoint = usePartner
          ? `${backendurl}/partner/applications/${applicationIdParam}/form-data`
          : `${backendurl}/rm/applications/${applicationIdParam}/form-data`;

        const { data } = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        setApplicationId?.(data.id || applicationIdParam);

        // Hydrate existing uploaded documents into form fields and upload flags
        const docFields = Array.isArray(data.docs)
          ? buildHydratedDocFields(data.docs).fields
          : {};

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
  }, [enabled, applicationIdParam, setFormData, setApplicationId, preferPartner]);

  return {
    resumeApplicationId: applicationIdParam,
    resumeMeta,
    loadingResume,
    resumeError,
  };
}
