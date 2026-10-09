import React from "react";
import { BadgeCheck, CreditCard, IndianRupee, Target } from "lucide-react";
import { LOAN_PURPOSE_OPTIONS } from "../../utils/captureLeadStep1";
import { CIBIL_SCORE_OPTIONS } from "../../utils/personFinancial";

/**
 * Short check shown above Personal Information.
 * Salary stays on the employment step, where it already was.
 */
export default function LoanApplicantFinancialFields({
  formData = {},
  handleInputChange,
  renderError,
}) {
  const hasRunning =
    formData.hasRunningLoan === "YES" ||
    formData.hasRunningLoan === "Yes" ||
    formData.hasRunningLoan === true;

  return (
    <div className="mb-8 rounded-2xl border border-teal-200 bg-teal-50/70 p-5 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900">Before personal details</h2>
      <p className="text-sm text-gray-600 mt-1 mb-5">
        Existing loan, monthly EMI, and CIBIL score.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            Do you have any existing / running loans? *
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
            <select
              name="hasRunningLoan"
              value={formData.hasRunningLoan || "NO"}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none bg-white border-teal-500"
              required
            >
              <option value="NO">No (0 Active Loans)</option>
              <option value="YES">Yes (Currently Paying EMI)</option>
            </select>
          </div>
          {renderError?.("hasRunningLoan")}
        </div>

        {hasRunning ? (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Monthly EMI currently paying (₹) *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
              <input
                type="number"
                name="monthlyEmiPaying"
                value={formData.monthlyEmiPaying ?? ""}
                onChange={handleInputChange}
                min="0"
                className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none bg-white border-teal-500"
                placeholder="e.g. 15000"
                required
              />
            </div>
            {renderError?.("monthlyEmiPaying")}
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            CIBIL score *
          </label>
          <div className="relative">
            <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
            <select
              name="cibilScoreBand"
              value={formData.cibilScoreBand || ""}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none bg-white border-teal-500"
              required
            >
              <option value="">Select CIBIL score range</option>
              {CIBIL_SCORE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {renderError?.("cibilScoreBand")}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            Purpose of Taking Loan *
          </label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
            <select
              name="loanPurpose"
              value={formData.loanPurpose || ""}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none bg-white border-teal-500"
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
      </div>
    </div>
  );
}
