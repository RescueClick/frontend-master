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
    gender: c.gender || "",
    officialEmail: c.officialEmail || "",
    stabilityOfResidency: c.stabilityOfResidency || "",
    currentHouseStatus: c.currentAddressHouseStatus || "",
    currentLandmark: c.currentAddressLandmark || "",
    permanentHouseStatus: c.permanentAddressHouseStatus || "",
    permanentLandmark: c.permanentAddressLandmark || "",
    permanentStability: c.permanentAddressStability || "",
    currentAddressPinCode: c.currentAddressPinCode || "",
    permanentAddressPinCode: c.permanentAddressPinCode || "",
    maritalStatus: c.maritalStatus || "",
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
    salaryInHand: emp.salaryInHand ?? "",
    businessName: biz.businessName || "",
    businessAddress: biz.businessAddress || "",
    businessLandmark: biz.businessLandmark || "",
    businessVintage: biz.businessVintage ?? "",
    gstNumber: biz.gstNumber || "",
    annualTurnoverInINR: biz.annualTurnoverInINR ?? "",
    yearsInBusiness: biz.yearsInBusiness ?? "",
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
    coApplicantName: co.name || co.firstName || "",
    coApplicantPhone: co.phone || "",
    coApplicantRelation: co.relation || "",
  };
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
        const { rmToken } = getAuthData();
        const { data } = await axios.get(
          `${backendurl}/rm/applications/${applicationIdParam}/form-data`,
          { headers: { Authorization: `Bearer ${rmToken}` } }
        );
        if (cancelled) return;
        setApplicationId?.(data.id || applicationIdParam);
        setFormData?.((prev) => ({
          ...prev,
          ...mapRmFormDataToLoanFields(data),
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
            "Failed to load application for RM form completion"
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
