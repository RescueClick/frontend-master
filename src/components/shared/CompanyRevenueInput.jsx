import { Lock, Percent } from "lucide-react";

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

/**
 * Admin-only input for the commission % DhanSource receives from the bank on a loan.
 * Never render this on partner-facing screens.
 */
const CompanyRevenueInput = ({ approvalAmount, value, onChange, partnerGross }) => {
  const approved = Number(approvalAmount) || 0;
  const hasPct = value !== "" && value != null && !isNaN(Number(value));
  const revenue = hasPct ? (approved * Number(value)) / 100 : 0;
  const partnerCost = Number(partnerGross) || 0;
  const net = revenue - partnerCost;

  return (
    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-900">DhanSource Commission from Bank</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
          <Lock className="w-3 h-3" />
          Internal — not shown to partner
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            DhanSource Rate (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. 3.5"
              className="w-full pl-3 pr-7 py-1.5 bg-white border border-indigo-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-600 mb-1">DhanSource Revenue</p>
          <p className="text-sm font-black text-indigo-900 py-1.5">{formatInr(revenue)}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-600 mb-1">Net after Partner</p>
          <p className={`text-sm font-black py-1.5 ${net < 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {hasPct ? formatInr(net) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyRevenueInput;
