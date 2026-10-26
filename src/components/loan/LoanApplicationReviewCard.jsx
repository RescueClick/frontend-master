import React from "react";
import {
  FileText,
  User,
  CreditCard,
  MapPin,
  Briefcase,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function LoanApplicationReviewCard({
  formData = {},
  loanTitle = "Personal Loan",
}) {
  const safeString = (val) =>
    typeof val === "string" ? val.trim() : typeof val === "number" ? String(val) : "";

  const fullName =
    [formData.firstName, formData.middleName, formData.lastName]
      .filter((part) => typeof part === "string" && part.trim())
      .join(" ") || "Applicant";

  const rawLoanAmount = formData.loanAmount || formData.requestedLoanAmount;
  const numLoanAmount = Number(String(rawLoanAmount || "").replace(/,/g, ""));
  const formattedLoanAmount =
    !isNaN(numLoanAmount) && numLoanAmount > 0
      ? `₹${numLoanAmount.toLocaleString("en-IN")}`
      : safeString(rawLoanAmount) || "—";

  const contactText =
    safeString(formData.contactNo) ||
    safeString(formData.contactNumber) ||
    safeString(formData.phone) ||
    "—";

  const emailText = safeString(formData.email) || "—";
  const panText = safeString(formData.pan) || safeString(formData.panNumber) || "—";
  const dobText = safeString(formData.dob) || safeString(formData.dateOfBirth) || "—";
  const purposeText = safeString(formData.loanPurpose);
  const companyOrBusiness =
    safeString(formData.companyName) || safeString(formData.businessName);

  const rawSalary = formData.monthlySalary || formData.salaryInHand;
  const numSalary = Number(String(rawSalary || "").replace(/,/g, ""));
  const salaryOrTurnover =
    !isNaN(numSalary) && numSalary > 0
      ? `₹${numSalary.toLocaleString("en-IN")}/mo`
      : safeString(formData.annualTurnover) || safeString(rawSalary);

  const currentAddressText = safeString(formData.currentAddress) || "—";
  const currentPinText =
    safeString(formData.currentAddressPinCode) ||
    safeString(formData.currentAddressPincode) ||
    safeString(formData.currentPincode);

  const permanentAddressText = safeString(formData.permanentAddress);
  const permanentPinText =
    safeString(formData.permanentAddressPinCode) ||
    safeString(formData.permanentAddressPincode) ||
    safeString(formData.permanentPincode);

  const ref1Name = safeString(formData.reference1Name);
  const ref1Contact =
    safeString(formData.reference1Contact) || safeString(formData.reference1Phone);
  const ref2Name = safeString(formData.reference2Name);
  const ref2Contact =
    safeString(formData.reference2Contact) || safeString(formData.reference2Phone);

  // Check which documents are attached
  const docFields = [
    { key: "aadharFront", label: "Aadhaar (Front)" },
    { key: "aadharBack", label: "Aadhaar (Back)" },
    { key: "panCard", label: "PAN Card" },
    { key: "passportPhoto", label: "Applicant Photo" },
    { key: "selfie", label: "Applicant Photo" },
    { key: "addressProof", label: "Address Proof" },
    { key: "companyIdCard", label: "Company ID" },
    { key: "salarySlip1", label: "Salary Slip 1" },
    { key: "bankStatement1", label: "Bank Statement 1" },
  ];

  const seenLabels = new Set();
  const attachedDocs = docFields.filter((d) => {
    const isPresent = Boolean(formData[d.key]) || Boolean(formData[`${d.key}_uploaded`]);
    if (isPresent && !seenLabels.has(d.label)) {
      seenLabels.add(d.label);
      return true;
    }
    return false;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Application Summary
            </h3>
            <p className="text-xs text-slate-500">
              Please verify all details before submitting your application
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
          {loanTitle}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applicant Details */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider mb-2">
            <User className="w-4 h-4" /> Applicant Details
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Full Name:</span>
            <span className="font-semibold text-slate-800">{fullName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Contact:</span>
            <span className="font-semibold text-slate-800">{contactText}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Email:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[180px]">
              {emailText}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">PAN / DOB:</span>
            <span className="font-semibold text-slate-800">
              {panText} • {dobText}
            </span>
          </div>
        </div>

        {/* Loan & Financials */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider mb-2">
            <CreditCard className="w-4 h-4" /> Loan & Financials
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Requested Amount:</span>
            <span className="font-bold text-slate-900 text-sm">
              {formattedLoanAmount}
            </span>
          </div>
          {purposeText && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Purpose:</span>
              <span className="font-semibold text-slate-800">{purposeText}</span>
            </div>
          )}
          {companyOrBusiness && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Company / Business:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                {companyOrBusiness}
              </span>
            </div>
          )}
          {salaryOrTurnover && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Salary / Turnover:</span>
              <span className="font-semibold text-slate-800">
                {salaryOrTurnover}
              </span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" /> Address
          </div>
          <div className="text-xs">
            <span className="text-slate-500 block mb-1">Current Address:</span>
            <span className="font-medium text-slate-800">
              {currentAddressText} {currentPinText ? `(${currentPinText})` : ""}
            </span>
          </div>
          {permanentAddressText && (
            <div className="text-xs pt-1">
              <span className="text-slate-500 block mb-1">Permanent Address:</span>
              <span className="font-medium text-slate-800">
                {permanentAddressText}{" "}
                {permanentPinText ? `(${permanentPinText})` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Attached Documents */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-teal-700 font-semibold text-xs uppercase tracking-wider mb-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Attached Documents
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {attachedDocs.length} Ready
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {attachedDocs.length > 0 ? (
              attachedDocs.map((doc) => (
                <span
                  key={doc.key}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {doc.label}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No documents attached yet</span>
            )}
          </div>
        </div>
      </div>

      {/* References */}
      {(ref1Name || ref2Name) && (
        <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" /> References
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {ref1Name && (
              <div>
                <span className="text-slate-500">Ref 1: </span>
                <span className="font-semibold text-slate-800">
                  {ref1Name} ({ref1Contact || "—"})
                </span>
              </div>
            )}
            {ref2Name && (
              <div>
                <span className="text-slate-500">Ref 2: </span>
                <span className="font-semibold text-slate-800">
                  {ref2Name} ({ref2Contact || "—"})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
