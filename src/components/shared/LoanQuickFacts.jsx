import { Info } from "lucide-react";
import { Tooltip } from "antd";
import { CIBIL_SCORE_LABELS } from "../../utils/personFinancial";

function formatInr(value) {
  const amount = Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function cibilLabel(band) {
  return CIBIL_SCORE_LABELS[band] || "—";
}

export default function LoanQuickFacts({ row = {} }) {
  const existing = row.hasRunningLoan === "YES" ? "Yes" : "No";
  const bounced = row.hasBounce === "YES";
  const loanAmount = row.loanAmount ?? row.requestedAmount;
  const facts = [
    ["CIBIL", cibilLabel(row.cibilScoreBand)],
    ["Existing loan", existing],
    ["EMI", existing === "Yes" ? formatInr(row.monthlyEmiPaying) : "—"],
    ["Bounce", bounced ? String(row.bounceCount || 0) : "No"],
    ["Loan amount", formatInr(loanAmount)],
    ["Salary", formatInr(row.salaryInHand)],
  ];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-sm font-semibold text-gray-900">{cibilLabel(row.cibilScoreBand)}</span>
      <Tooltip
        placement="topLeft"
        color="#ffffff"
        title={
          <div className="min-w-[190px] space-y-1.5 py-0.5 text-xs text-gray-800">
            {facts.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        }
      >
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700"
          aria-label="Loan details"
        >
          <Info size={12} />
        </button>
      </Tooltip>
    </div>
  );
}
