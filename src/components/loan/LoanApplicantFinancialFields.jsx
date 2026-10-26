import React from "react";
import { BadgeCheck, CreditCard, Hash, IndianRupee, Target } from "lucide-react";
import { LOAN_PURPOSE_OPTIONS } from "../../utils/captureLeadStep1";
import { CIBIL_SCORE_OPTIONS } from "../../utils/personFinancial";
import { LOAN_FIELD_LABEL, LOAN_SECTION, LOAN_SECTION_HINT } from "./loanFormSpec";

/**
 * Existing loans & credit block (running loan, EMI, CIBIL, bounces) for the Work & Income step.
 * Set `showLoanPurpose={false}` when the form renders `LoanRequirementFields` in step 1.
 */
export default function LoanApplicantFinancialFields({
  formData = {},
  handleInputChange,
  renderError,
  showLoanPurpose = true,
}) {
  const hasRunning =
    formData.hasRunningLoan === "YES" ||
    formData.hasRunningLoan === "Yes" ||
    formData.hasRunningLoan === true;

  return (
    <div className="mb-8 rounded-2xl border border-teal-200 bg-teal-50/70 p-5 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{LOAN_SECTION.CREDIT}</h2>
      <p className="text-sm text-gray-600 mt-1 mb-5">{LOAN_SECTION_HINT.CREDIT}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            {LOAN_FIELD_LABEL.hasRunningLoan} *
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
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
          {renderError?.("hasRunningLoan")}
        </div>

        {hasRunning ? (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              {LOAN_FIELD_LABEL.monthlyEmiPaying} *
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
            {LOAN_FIELD_LABEL.cibilScoreBand} *
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
            {LOAN_FIELD_LABEL.hasBounce} *
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 pointer-events-none" />
            <select
              name="hasBounce"
              value={formData.hasBounce || "NO"}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none bg-white border-teal-500"
              required
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
          {renderError?.("hasBounce")}
        </div>

        {formData.hasBounce === "YES" ? (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              {LOAN_FIELD_LABEL.bounceCount} *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
              <input
                type="number"
                name="bounceCount"
                value={formData.bounceCount ?? ""}
                onChange={handleInputChange}
                min="1"
                max="999"
                step="1"
                className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none bg-white border-teal-500"
                placeholder="e.g. 2"
                required
              />
            </div>
            {renderError?.("bounceCount")}
          </div>
        ) : null}

        {showLoanPurpose ? (
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            {LOAN_FIELD_LABEL.loanPurpose} *
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
        ) : null}
      </div>
    </div>
  );
}
