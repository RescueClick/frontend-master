import { suggestedPolicy } from "../../utils/lenderPolicies";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export default function BankPolicyFields({ policy, onChange, bankName, loanType }) {
  const suggestion = suggestedPolicy(bankName, loanType);
  const set = (key, value) => onChange({ ...policy, [key]: value });
  const setDoc = (key, value) =>
    onChange({ ...policy, verification: { ...(policy.verification || {}), [key]: value } });
  const toggleSegment = (segment) => {
    const current = Array.isArray(policy.employmentSegments) ? policy.employmentSegments : [];
    const next = current.includes(segment) ? current.filter((s) => s !== segment) : [...current, segment];
    onChange({ ...policy, employmentSegments: next });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 shadow-inner sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Underwriting policy</h3>
          <p className="text-[11px] leading-snug text-gray-600">
            Shown on the bank card. The loan matcher hides a bank when salary, amount, age, FOIR, vintage, or employment fails these rules.
          </p>
        </div>
        {suggestion ? (
          <button
            type="button"
            onClick={() => onChange(suggestion)}
            className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Load {suggestion.lenderKey === "FIBE" ? "Fibe" : suggestion.lenderKey === "FINNABLE" ? "Finnable" : "InCred"} sheet
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Field label="Min in-hand salary">
          <input className={inputClass} inputMode="numeric" value={policy.minNetSalary ?? ""} onChange={(e) => set("minNetSalary", e.target.value)} placeholder="15000" />
        </Field>
        <Field label="Metro in-hand">
          <input className={inputClass} inputMode="numeric" value={policy.minNetSalaryMetro ?? ""} onChange={(e) => set("minNetSalaryMetro", e.target.value)} placeholder="20000" />
        </Field>
        <Field label="Small-ticket salary">
          <input className={inputClass} inputMode="numeric" value={policy.minNetSalarySmallTicket ?? ""} onChange={(e) => set("minNetSalarySmallTicket", e.target.value)} placeholder="20000" />
        </Field>
        <Field label="Small ticket up to">
          <input className={inputClass} inputMode="numeric" value={policy.smallTicketMaxAmount ?? ""} onChange={(e) => set("smallTicketMaxAmount", e.target.value)} placeholder="600000" />
        </Field>
        <Field label="Max loan amount">
          <input className={inputClass} inputMode="numeric" value={policy.maxLoanAmount ?? ""} onChange={(e) => set("maxLoanAmount", e.target.value)} placeholder="1000000" />
        </Field>
        <Field label="Max tenure (months)">
          <input className={inputClass} inputMode="numeric" value={policy.maxTenureMonths ?? ""} onChange={(e) => set("maxTenureMonths", e.target.value)} placeholder="60" />
        </Field>
        <Field label="Min age">
          <input className={inputClass} inputMode="numeric" value={policy.minAge ?? ""} onChange={(e) => set("minAge", e.target.value)} placeholder="21" />
        </Field>
        <Field label="Max age">
          <input className={inputClass} inputMode="numeric" value={policy.maxAge ?? ""} onChange={(e) => set("maxAge", e.target.value)} placeholder="60" />
        </Field>
        <Field label="Confirm age from">
          <input className={inputClass} inputMode="numeric" value={policy.ageReviewFrom ?? ""} onChange={(e) => set("ageReviewFrom", e.target.value)} placeholder="56" />
        </Field>
        <Field label="Min total experience (months)">
          <input className={inputClass} inputMode="numeric" value={policy.minTotalExperienceMonths ?? ""} onChange={(e) => set("minTotalExperienceMonths", e.target.value)} placeholder="12" />
        </Field>
        <Field label="Min current company (months)">
          <input className={inputClass} inputMode="numeric" value={policy.minCurrentExperienceMonths ?? ""} onChange={(e) => set("minCurrentExperienceMonths", e.target.value)} placeholder="3" />
        </Field>
        <Field label="Max FOIR %">
          <input className={inputClass} inputMode="numeric" value={policy.maxFoirPercent ?? ""} onChange={(e) => set("maxFoirPercent", e.target.value)} placeholder="70" />
        </Field>
        <Field label="Credit rule">
          <select className={inputClass} value={policy.creditScoreMode || "NONE"} onChange={(e) => set("creditScoreMode", e.target.value)}>
            <option value="NONE">No hard cutoff</option>
            <option value="PREFERRED">Preferred score</option>
            <option value="HARD">Hard minimum</option>
          </select>
        </Field>
        <Field label="Min credit score">
          <input className={inputClass} inputMode="numeric" value={policy.minCreditScore ?? ""} onChange={(e) => set("minCreditScore", e.target.value)} placeholder="650" />
        </Field>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-gray-700">
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={(policy.employmentSegments || []).includes("SALARIED")} onChange={() => toggleSegment("SALARIED")} />
          Salaried
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={(policy.employmentSegments || []).includes("SELF_EMPLOYED")} onChange={() => toggleSegment("SELF_EMPLOYED")} />
          Self-employed
        </label>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Foreclosure">
          <input className={inputClass} value={policy.foreclosureNote || ""} onChange={(e) => set("foreclosureNote", e.target.value)} />
        </Field>
        <Field label="Work vintage note">
          <input className={inputClass} value={policy.vintageNote || ""} onChange={(e) => set("vintageNote", e.target.value)} />
        </Field>
        <Field label="Credit note">
          <input className={inputClass} value={policy.creditScoreNote || ""} onChange={(e) => set("creditScoreNote", e.target.value)} />
        </Field>
        <Field label="FOIR note">
          <input className={inputClass} value={policy.foirNote || ""} onChange={(e) => set("foirNote", e.target.value)} />
        </Field>
        <Field label="Salary credit channel">
          <input className={inputClass} value={policy.salaryChannel || ""} onChange={(e) => set("salaryChannel", e.target.value)} />
        </Field>
        <Field label="KYC">
          <input className={inputClass} value={policy.verification?.kyc || ""} onChange={(e) => setDoc("kyc", e.target.value)} />
        </Field>
        <Field label="Banking">
          <input className={inputClass} value={policy.verification?.banking || ""} onChange={(e) => setDoc("banking", e.target.value)} />
        </Field>
        <Field label="Salary documents">
          <input className={inputClass} value={policy.verification?.salary || ""} onChange={(e) => setDoc("salary", e.target.value)} />
        </Field>
        <Field label="Work verification">
          <input className={inputClass} value={policy.verification?.workCheck || ""} onChange={(e) => setDoc("workCheck", e.target.value)} />
        </Field>
      </div>
    </section>
  );
}
