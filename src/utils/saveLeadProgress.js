import axios from "axios";
import { backendurl } from "../feature/urldata";
import { captureLeadOnStep1Next } from "./captureLeadStep1";

function stepLabelOf(steps, index) {
  const s = steps?.[index];
  if (!s) return `Step ${index + 1}`;
  if (typeof s === "string") return s;
  return s.label || s.id || `Step ${index + 1}`;
}

function isDocumentsStep(label) {
  return String(label || "").toLowerCase().includes("document");
}

/** Build address + identity customer fields from partner form state */
function buildCustomerPatch(formData = {}) {
  return {
    firstName: formData.firstName,
    middleName: formData.middleName,
    lastName: formData.lastName || formData.surname,
    email: formData.email,
    officialEmail: formData.officialEmail,
    phone: formData.contactNo || formData.phone,
    mothersName: formData.motherName || formData.mothersName,
    panNumber: formData.pan || formData.panNumber,
    dateOfBirth: formData.dob || formData.dateOfBirth,
    gender: formData.gender,
    maritalStatus: formData.maritalStatus,
    spouseName: formData.wifeName || formData.spouseName,
    currentAddress: formData.currentAddress,
    currentAddressLandmark: formData.currentLandmark || formData.currentAddressLandmark,
    currentAddressPinCode: formData.currentAddressPinCode,
    currentAddressHouseStatus: formData.currentHouseStatus || formData.currentAddressHouseStatus,
    permanentAddress: formData.permanentAddress,
    permanentAddressLandmark: formData.permanentLandmark || formData.permanentAddressLandmark,
    permanentAddressPinCode: formData.permanentAddressPinCode,
    permanentAddressHouseStatus: formData.permanentHouseStatus || formData.permanentAddressHouseStatus,
    stabilityOfResidency: formData.stabilityOfResidency,
    permanentAddressStability: formData.permanentStability || formData.permanentAddressStability,
    loanAmount: Number(formData.loanAmount) || 0,
    hasRunningLoan: formData.hasRunningLoan || "NO",
    monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
    loanPurpose: formData.loanPurpose || "",
    salaryInHand: formData.salaryInHand ?? "",
    salaryReceiptMode: formData.salaryReceiptMode || "",
    cibilScoreBand: formData.cibilScoreBand || "",
  };
}

function buildEmploymentInfo(formData = {}) {
  if (!formData.companyName && !formData.designation && !formData.monthlySalary) return null;
  return {
    companyName: formData.companyName || "",
    designation: formData.designation || "",
    companyAddress: formData.companyAddress || "",
    monthlySalary: formData.monthlySalary || "",
    totalExperience: formData.totalExperience || "",
    currentExperience: formData.currentExperience || "",
    salaryInHand: formData.salaryInHand || "",
  };
}

function buildBusinessInfo(formData = {}) {
  if (!formData.businessName && !formData.gstNumber && !formData.annualTurnoverInINR) return null;
  return {
    businessName: formData.businessName || "",
    businessAddress: formData.businessAddress || "",
    businessLandmark: formData.businessLandmark || "",
    businessVintage: formData.businessVintage || "",
    gstNumber: formData.gstNumber || "",
    annualTurnoverInINR: formData.annualTurnoverInINR || "",
    yearsInBusiness: formData.yearsInBusiness || "",
  };
}

function buildPropertyInfo(formData = {}) {
  if (!formData.propertyType && !formData.propertyAddress && !formData.propertyValue) return null;
  return {
    propertyType: formData.propertyType || "",
    propertyValue: Number(formData.propertyValue) || 0,
    propertyAddress: formData.propertyAddress || "",
  };
}

/**
 * After each wizard "Next", sync filled fields to the LEAD application
 * so RM can see progress through Address → Employment/Business → Documents.
 * Non-blocking / non-fatal.
 */
export async function persistLeadWizardProgress({
  applicationId = null,
  setApplicationId,
  leavingStepIndex = 0,
  nextStepIndex = 0,
  steps = [],
  loanType = "PERSONAL",
  formData = {},
  isPartnerLoggedIn = false,
  partnerToken = null,
  partnerReferralCode = "",
  isRmMode = false,
}) {
  if (isRmMode) return { success: false, skipped: true };

  try {
    let appId = applicationId;

    // Ensure LEAD exists once partner leaves Personal (or if id missing)
    if ((!appId || leavingStepIndex === 0) && leavingStepIndex <= 0) {
      const res = await captureLeadOnStep1Next({
        loanType,
        formData,
        isPartnerLoggedIn,
        partnerToken,
        partnerReferralCode,
        applicationId: appId,
      });
      if (res?.blocked) return res;
      if (res?.applicationId) {
        appId = res.applicationId;
        if (typeof setApplicationId === "function") setApplicationId(appId);
      }
    } else if (!appId) {
      const res = await captureLeadOnStep1Next({
        loanType,
        formData,
        isPartnerLoggedIn,
        partnerToken,
        partnerReferralCode,
        applicationId: null,
      });
      if (res?.blocked) return res;
      if (res?.applicationId) {
        appId = res.applicationId;
        if (typeof setApplicationId === "function") setApplicationId(appId);
      }
    }

    if (!appId) return { success: false, error: "No applicationId" };

    // After Personal, push fuller snapshot so RM sees address / job / business
    if (leavingStepIndex < 1 && nextStepIndex < 1) {
      return { success: true, applicationId: appId };
    }

    const leavingLabel = stepLabelOf(steps, leavingStepIndex);
    const nextLabel = stepLabelOf(steps, nextStepIndex);
    const reachedDocuments =
      isDocumentsStep(nextLabel) || isDocumentsStep(leavingLabel);

    const employmentInfo = buildEmploymentInfo(formData);
    const businessInfo = buildBusinessInfo(formData);
    const propertyInfo = buildPropertyInfo(formData);

    const payload = {
      stepIndex: nextStepIndex,
      stepLabel: nextLabel,
      maxStepIndex: Math.max(leavingStepIndex, nextStepIndex),
      reachedDocuments,
      customer: buildCustomerPatch(formData),
      hasRunningLoan: formData.hasRunningLoan || "NO",
      monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
      loanPurpose: formData.loanPurpose || "",
      requestedAmount: Number(formData.loanAmount) || 0,
    };
    if (employmentInfo) payload.employmentInfo = employmentInfo;
    if (businessInfo) payload.businessInfo = businessInfo;
    if (propertyInfo) payload.propertyInfo = propertyInfo;

    const headers = {};
    if (isPartnerLoggedIn && partnerToken) {
      headers.Authorization = `Bearer ${partnerToken}`;
    }

    const res = await axios.post(
      `${backendurl}/leads/${appId}/progress`,
      payload,
      { headers, timeout: 10000 }
    );

    return {
      success: true,
      applicationId: appId,
      formProgress: res.data?.formProgress || null,
    };
  } catch (err) {
    console.warn(
      "persistLeadWizardProgress warning (non-fatal):",
      err?.response?.data?.message || err.message
    );
    return { success: false, error: err };
  }
}
