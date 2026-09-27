import axios from "axios";
import { backendurl } from "../feature/urldata";

export const LOAN_PURPOSE_OPTIONS = [
  "Business Expansion",
  "Working Capital",
  "Home Renovation / Construction",
  "Wedding / Family Function",
  "Education",
  "Medical Emergency",
  "Debt Consolidation (Close existing loans)",
  "Purchase of Assets / Vehicle",
  "Travel / Vacation",
  "Personal Expenses",
  "Other",
];

/**
 * Capture Step 1 fields as a LEAD immediately upon clicking 'Next'.
 * Non-blocking on network errors; returns { blocked, message } when the customer already has a loan file.
 */
export async function captureLeadOnStep1Next({
  loanType = "PERSONAL",
  formData = {},
  isPartnerLoggedIn = false,
  partnerToken = null,
  partnerReferralCode = "",
  applicationId = null,
}) {
  try {
    const rawRunning = formData.hasRunningLoan ?? "NO";
    const hasRunning =
      rawRunning === "YES" || rawRunning === "Yes" || rawRunning === true
        ? "YES"
        : "NO";

    const payload = {
      loanType,
      applicationId: applicationId || undefined,
      partnerReferralCode: !isPartnerLoggedIn ? (formData.partnerReferralCode || partnerReferralCode) : undefined,
      customer: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        mothersName: formData.motherName,
        panNumber: formData.pan,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        spouseName: formData.wifeName,
        phone: formData.contactNo,
        email: formData.email,
        dateOfBirth: formData.dob,
        officialEmail: formData.officialEmail,
        loanAmount: Number(formData.loanAmount) || 0,
        hasRunningLoan: hasRunning,
        monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
        loanPurpose: formData.loanPurpose || "",
      },
      financialDetails: {
        hasRunningLoan: hasRunning,
        monthlyEmiPaying: Number(formData.monthlyEmiPaying) || 0,
        loanPurpose: formData.loanPurpose || "",
      },
    };

    const headers = {};
    if (isPartnerLoggedIn && partnerToken) {
      headers.Authorization = `Bearer ${partnerToken}`;
    }

    const res = await axios.post(`${backendurl}/leads/capture-step1`, payload, {
      headers,
      timeout: 8000,
    });

    return {
      success: true,
      applicationId: res.data?.applicationId || null,
      appNo: res.data?.appNo || null,
    };
  } catch (err) {
    const data = err?.response?.data;
    // Customer already has a loan file (or is in reject cooldown): the only case that stops the wizard
    if (err?.response?.status === 400 && data?.reason) {
      return {
        success: false,
        blocked: true,
        message: data.message,
        existingAppNo: data.existingAppNo || null,
      };
    }
    console.warn("captureLeadOnStep1Next warning (non-fatal):", data?.message || err.message);
    return { success: false, error: err };
  }
}
