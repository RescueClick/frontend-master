import { useEffect, useState } from "react";
import axios from "axios";
import { Building2, Lock, Percent } from "lucide-react";
import { backendurl } from "../../feature/urldata";
import { getAuthData } from "../../utils/localStorage";

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

/**
 * Admin-only input for the commission % DhanSource receives from the bank on a loan.
 * Never render this on partner-facing screens.
 */
const CompanyRevenueInput = ({
  approvalAmount,
  value,
  onChange,
  partnerGross,
  bankId = "",
  bankName = "",
  onBankChange,
}) => {
  const [banks, setBanks] = useState([]);
  const approved = Number(approvalAmount) || 0;
  const hasPct = value !== "" && value != null && !isNaN(Number(value));
  const revenue = hasPct ? (approved * Number(value)) / 100 : 0;
  const partnerCost = Number(partnerGross) || 0;
  const net = revenue - partnerCost;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { adminToken } = getAuthData();
        const res = await axios.get(`${backendurl}/admin/banks?list=1`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!cancelled) setBanks(Array.isArray(res.data?.banks) ? res.data.banks : []);
      } catch {
        if (!cancelled) setBanks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyBank = (id, name, rate) => {
    if (onBankChange) onBankChange({ bankId: id || "", bankName: name || "" });
    if (rate !== "" && rate != null && !isNaN(Number(rate))) onChange(String(rate));
  };

  const handleSelect = (id) => {
    if (!id) {
      applyBank("", bankName, "");
      return;
    }
    const bank = banks.find((item) => String(item._id) === String(id));
    applyBank(id, bank?.bankName || bankName, bank?.commissionPercentage);
  };

  const handleTypedName = (typed) => {
    const match = banks.find(
      (item) => String(item.bankName || "").trim().toLowerCase() === typed.trim().toLowerCase()
    );
    if (match) {
      applyBank(String(match._id), match.bankName, match.commissionPercentage);
      return;
    }
    applyBank("", typed, "");
  };

  return (
    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-900">DhanSource Commission from Bank</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
          <Lock className="w-3 h-3" />
          Internal — not shown to partner
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Which bank disbursed
          </label>
          <div className="relative">
            <select
              value={bankId || ""}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-full appearance-none pl-8 pr-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select from bank list</option>
              {banks.map((bank) => (
                <option key={bank._id} value={bank._id}>
                  {bank.bankName}
                  {bank.loanType ? ` (${bank.loanType})` : ""}
                  {bank.commissionPercentage != null ? ` — gives ${bank.commissionPercentage}%` : ""}
                </option>
              ))}
            </select>
            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Bank name (type if not in the list)
          </label>
          <input
            type="text"
            value={bankName || ""}
            onChange={(e) => handleTypedName(e.target.value)}
            placeholder="Type a bank name"
            className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
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
