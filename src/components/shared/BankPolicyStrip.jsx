import { employmentLabel, formatInr } from "../../utils/lenderPolicies";

const chipClass = "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight";

const statusStyle = {
  pass: "bg-emerald-600 text-white border-emerald-600",
  review: "bg-amber-500 text-white border-amber-500",
  fail: "bg-rose-600 text-white border-rose-600",
  unconfigured: "bg-slate-200 text-slate-700 border-slate-200",
};

const checkStyle = {
  pass: "text-emerald-800",
  review: "text-amber-800",
  fail: "text-rose-700",
};

function chipsFor(policy) {
  if (!policy) return [];
  const items = [];
  if (policy.minNetSalaryMetro && policy.minNetSalary) {
    items.push(`In-hand ${formatInr(policy.minNetSalary)} · metro ${formatInr(policy.minNetSalaryMetro)}`);
  } else if (policy.minNetSalarySmallTicket && policy.minNetSalary) {
    items.push(
      `In-hand ${formatInr(policy.minNetSalary)} · ${formatInr(policy.minNetSalarySmallTicket)} under ${formatInr(policy.smallTicketMaxAmount)}`
    );
  } else if (policy.minNetSalary) {
    items.push(`In-hand ${formatInr(policy.minNetSalary)}+`);
  }
  if (policy.maxLoanAmount) items.push(`Up to ${formatInr(policy.maxLoanAmount)}`);
  if (policy.maxTenureMonths) items.push(`${policy.maxTenureMonths} months`);
  if (policy.minAge || policy.maxAge) items.push(`Age ${policy.minAge || "—"}–${policy.maxAge || "—"}`);
  if (policy.maxFoirPercent) items.push(`FOIR ≤ ${policy.maxFoirPercent}%`);
  const who = employmentLabel(policy.employmentSegments);
  if (who) items.push(who);
  if (policy.foreclosureNote) items.push(`Foreclose ${policy.foreclosureNote}`);
  return items;
}

export default function BankPolicyStrip({ policy, match }) {
  if (!policy) {
    if (!match) return null;
    return (
      <p className="text-[10px] font-medium text-slate-400">
        No underwriting policy — pincode match only
      </p>
    );
  }

  const chips = chipsFor(policy);
  const docs = [
    policy.salaryChannel ? ["Salary credit", policy.salaryChannel] : null,
    policy.vintageNote ? ["Work vintage", policy.vintageNote] : null,
    policy.creditScoreNote ? ["Credit", policy.creditScoreNote] : null,
    policy.verification?.kyc ? ["KYC", policy.verification.kyc] : null,
    policy.verification?.banking ? ["Banking", policy.verification.banking] : null,
    policy.verification?.salary ? ["Salary docs", policy.verification.salary] : null,
    policy.verification?.workCheck ? ["Verification", policy.verification.workCheck] : null,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Policy</p>
        {match?.label ? (
          <span className={`${chipClass} ${statusStyle[match.status] || statusStyle.unconfigured}`}>
            {match.label}
          </span>
        ) : null}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((chip) => (
            <span key={chip} className={`${chipClass} border-emerald-100 bg-white text-slate-700`}>
              {chip}
            </span>
          ))}
        </div>
      )}
      {match?.checks?.length > 0 && (
        <ul className="space-y-0.5">
          {match.checks.map((check) => (
            <li key={check.key} className={`text-[10px] font-medium leading-snug ${checkStyle[check.status] || "text-slate-600"}`}>
              {check.label}
            </li>
          ))}
        </ul>
      )}
      {docs.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[10px] font-semibold text-slate-600 list-none">
            Documents and notes
          </summary>
          <ul className="mt-1 space-y-0.5">
            {docs.map(([label, value]) => (
              <li key={label} className="text-[10px] leading-snug text-slate-600">
                <span className="font-semibold text-slate-700">{label}: </span>
                {value}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
