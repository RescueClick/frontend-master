import { Tooltip } from "antd";
import { cibilLabel } from "./LoanQuickFacts";
import { loanTypeToTableShort } from "../../utils/loanTypeShort";
import { getLoanStatusLabel } from "../../utils/loanStatus";

function formatInr(value) {
  const amount = Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function displayName(row) {
  const named = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  return named || row.userName || row.customerName || "—";
}

export default function ApplicationHoverCard({ row = {}, children }) {
  const existing = row.hasRunningLoan === "YES" ? "Yes" : "No";
  const review = row.fileReview?.text
    ? `${row.fileReview.text}${row.fileReview.updatedByName ? ` — ${row.fileReview.updatedByName}` : ""}`
    : "No review";
  const facts = [
    ["Name", displayName(row)],
    ["Phone", row.phone || row.contact || "—"],
    ["Email", row.email || "—"],
    ["Loan type", loanTypeToTableShort(row.loanType) || "—"],
    ["Status", getLoanStatusLabel(row.status) || "—"],
    ["CIBIL", cibilLabel(row.cibilScoreBand)],
    ["Existing loan", existing],
    ["EMI", existing === "Yes" ? formatInr(row.monthlyEmiPaying) : "—"],
    ["Loan amount", formatInr(row.loanAmount ?? row.requestedAmount)],
    ["Salary", formatInr(row.salaryInHand)],
    ["Review", review],
  ];

  return (
    <Tooltip
      placement="left"
      color="#ffffff"
      title={
        <div className="min-w-[220px] max-w-[280px] space-y-1.5 py-0.5 text-xs text-gray-800">
          {facts.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-gray-500">{label}</span>
              <span className="text-right font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}
