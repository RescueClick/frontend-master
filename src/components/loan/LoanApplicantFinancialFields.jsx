import React from "react";
import { CreditCard, IndianRupee, Target, Wallet, BadgeCheck } from "lucide-react";
import { LOAN_PURPOSE_OPTIONS } from "../../utils/captureLeadStep1";
import {
  CIBIL_SCORE_OPTIONS,
  SALARY_RECEIPT_OPTIONS,
} from "../../utils/personFinancial";

/**
 * Mandatory person-information fields on every loan form:
 * running loan, monthly EMI, salary in hand (online / cash), CIBIL band, loan purpose.
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
    <>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900">
          Do you have any existing / running loans? *
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
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

      {hasRunning && (
        <div className="animate-in fade-in duration-200">
          <label className="block text-sm font-medium mb-2 text-gray-900">
            Monthly EMI currently paying (₹) *
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600" />
            <input
              type="number"
              name="monthlyEmiPaying"
              value={formData.monthlyEmiPaying ?? ""}
              onChange={handleInputChange}
              min="0"
              className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors bg-slate-50 border-teal-500"
              placeholder="e.g. 15000"
              required
            />
          </div>
          {renderError?.("monthlyEmiPaying")}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900">
          Salary in hand (₹) *
        </label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600" />
          <input
            type="number"
            name="salaryInHand"
            value={formData.salaryInHand ?? ""}
            onChange={handleInputChange}
            min="1"
            className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors bg-slate-50 border-teal-500"
            placeholder="Monthly salary in hand"
            required
          />
        </div>
        {renderError?.("salaryInHand")}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900">
          Salary received as *
        </label>
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
          <select
            name="salaryReceiptMode"
            value={formData.salaryReceiptMode || ""}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors bg-slate-50 border-teal-500"
            required
          >
            <option value="">Select Online or Cash</option>
            {SALARY_RECEIPT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {renderError?.("salaryReceiptMode")}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900">
          CIBIL score *
        </label>
        <div className="relative">
          <BadgeCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
          <select
            name="cibilScoreBand"
            value={formData.cibilScoreBand || ""}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors bg-slate-50 border-teal-500"
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
          <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
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
