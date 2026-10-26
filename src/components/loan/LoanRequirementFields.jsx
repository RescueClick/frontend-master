import React from "react";
import { IndianRupee, Target } from "lucide-react";
import { LOAN_PURPOSE_OPTIONS } from "../../utils/captureLeadStep1";
import { LOAN_FIELD_LABEL, LOAN_SECTION, LOAN_SECTION_HINT, formatLoanInr } from "./loanFormSpec";

const inputClass =
  "w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors";
const inputStyle = { borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" };

/**
 * First block of step 1 in every web loan form: loan amount + purpose.
 * `onAmountChange(digits)` lets each form keep its own amount storage rules.
 */
export default function LoanRequirementFields({
  formData = {},
  handleInputChange,
  onAmountChange,
  renderError,
  amountKey = "loanAmount",
}) {
  const amount = formData[amountKey];
  const preview = formatLoanInr(amount);

  const changeAmount = (e) => {
    const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 9);
    if (onAmountChange) onAmountChange(digits);
    else handleInputChange?.({ target: { name: amountKey, value: digits } });
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-1 flex items-center gap-3 text-gray-900">
        <IndianRupee className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
        {LOAN_SECTION.LOAN_REQUIREMENT}
      </h2>
      <p className="text-sm text-slate-500 mb-5">{LOAN_SECTION_HINT.LOAN_REQUIREMENT}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">{LOAN_FIELD_LABEL.loanAmount} *</label>
          <div className="relative">
            <IndianRupee
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: "var(--color-brand-primary)" }}
            />
            <input
              type="text"
              inputMode="numeric"
              name={amountKey}
              value={amount ?? ""}
              onChange={changeAmount}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. 500000"
              required
            />
          </div>
          {preview && /^₹/.test(preview) ? (
            <p className="mt-1 text-xs font-bold text-teal-700">{preview}</p>
          ) : null}
          {renderError?.(amountKey)}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">{LOAN_FIELD_LABEL.loanPurpose} *</label>
          <div className="relative">
            <Target
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: "var(--color-brand-primary)" }}
            />
            <select
              name="loanPurpose"
              value={formData.loanPurpose || ""}
              onChange={handleInputChange}
              className={inputClass}
              style={inputStyle}
              required
            >
              <option value="">Select loan purpose</option>
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
