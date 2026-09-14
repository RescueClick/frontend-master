import React from "react";
import { CreditCard, IndianRupee, Target } from "lucide-react";
import { LOAN_PURPOSE_OPTIONS } from "../../utils/captureLeadStep1";

/**
 * Reusable component for the 3 financial fields added to Step 1:
 * 1. Running current loan (Yes / No)
 * 2. Monthly EMI paying (₹)
 * 3. Purpose of loan
 */
export default function LoanApplicantFinancialFields({
  formData = {},
  handleInputChange,
  renderError,
  fieldErrors = {},
}) {
  const hasRunning =
    formData.hasRunningLoan === "YES" ||
    formData.hasRunningLoan === "Yes" ||
    formData.hasRunningLoan === true;

  return (
    <>
      {/* 1. Running Current Loan */}
      <div>
        <label
          className="block text-sm font-medium mb-2 text-gray-900"
        >
          Do you have any Running Loans? *
        </label>
        <div className="relative">
          <CreditCard
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none"
          />
          <select
            name="hasRunningLoan"
            value={formData.hasRunningLoan || "NO"}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors bg-slate-50 border-teal-500"
            required
          >
            <option value="NO">No (0 Active Loans)</option>
            <option value="YES">Yes (Currently Paying EMI)</option>
          </select>
        </div>
        {renderError?.("hasRunningLoan")}
      </div>

      {/* 2. Monthly EMI Paying (shown if hasRunningLoan is YES) */}
      {hasRunning && (
        <div className="animate-in fade-in duration-200">
          <label
            className="block text-sm font-medium mb-2 text-gray-900"
          >
            Monthly EMI Currently Paying (₹) *
          </label>
          <div className="relative">
            <IndianRupee
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600"
            />
            <input
              type="number"
              name="monthlyEmiPaying"
              value={formData.monthlyEmiPaying ?? ""}
              onChange={handleInputChange}
              min="0"
              className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors bg-slate-50 border-teal-500"
              placeholder="e.g. 15000"
              required={hasRunning}
            />
          </div>
          {renderError?.("monthlyEmiPaying")}
        </div>
      )}

      {/* 3. Purpose of Loan */}
      <div>
        <label
          className="block text-sm font-medium mb-2 text-gray-900"
        >
          Purpose of Taking Loan *
        </label>
        <div className="relative">
          <Target
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none"
          />
          <select
            name="loanPurpose"
            value={formData.loanPurpose || ""}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors bg-slate-50 border-teal-500"
            required
          >
            <option value="">Select Purpose of Loan</option>
            {LOAN_PURPOSE_OPTIONS.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </div>
        {renderError?.("loanPurpose")}
      </div>
    </>
  );
}
