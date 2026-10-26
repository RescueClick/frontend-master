import React from "react";
import { AlertCircle, CheckCircle2, FileText, Pencil } from "lucide-react";
import { LOAN_SECTION, LOAN_SECTION_HINT, LOAN_STEP } from "./loanFormSpec";

/** "2 of 3 documents attached on this step" note; pass `docChecklistForStep(checklist, step)`. */
export function LoanDocsProgress({ checklist }) {
  if (!checklist || !checklist.requiredTotal) return null;
  const { requiredDone, requiredTotal } = checklist;
  const pct = Math.round((requiredDone / requiredTotal) * 100);
  const complete = requiredDone >= requiredTotal;
  return (
    <div className="mb-6 rounded-xl border border-teal-100 bg-teal-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-teal-800">
          {requiredDone} of {requiredTotal} required documents attached on this step
        </p>
        {complete ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : null}
      </div>
      <div className="h-1.5 w-full rounded-full bg-teal-100 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${complete ? "bg-emerald-600" : "bg-teal-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-600">{LOAN_SECTION_HINT.DOCUMENTS}</p>
    </div>
  );
}

/**
 * Full review screen used as the last step of every loan form.
 * `sections` comes from `buildLoanReviewSections`, `docChecklist` from `buildLoanDocChecklist`.
 */
export default function LoanReviewSummary({ sections = [], docChecklist, onEdit, editable = true }) {
  const renderEdit = (step) =>
    editable && typeof onEdit === "function" ? (
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="inline-flex items-center gap-1 rounded-md border border-teal-100 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 hover:bg-teal-100"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
    ) : null;

  const docsSection = docChecklist ? (
    <section key="documents" className="py-4 border-b border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="flex-1 text-xs font-bold uppercase tracking-wider text-teal-700">Documents</h4>
        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
          {docChecklist.requiredDone}/{docChecklist.requiredTotal} required
        </span>
        {renderEdit(docChecklist.firstMissingStep ?? LOAN_STEP.PERSONAL)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {docChecklist.items
          .filter((d) => d.uploaded || d.required)
          .map((d) => (
            <span
              key={d.key}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium ${
                d.uploaded
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {d.uploaded ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-600" />
              )}
              {d.label}
            </span>
          ))}
      </div>
    </section>
  ) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">{LOAN_SECTION.REVIEW}</h3>
          <p className="text-xs text-slate-500">{LOAN_SECTION_HINT.REVIEW}</p>
        </div>
      </div>

      {sections.map((section) => {
        const block = (
          <section key={section.key} className="py-4 border-b border-slate-100 last:border-b-0">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="flex-1 text-xs font-bold uppercase tracking-wider text-teal-700">
                {section.title}
              </h4>
              {renderEdit(section.step)}
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {section.rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 text-xs">
                  <dt className="text-slate-500">{row.label}</dt>
                  <dd
                    className={`text-right ${
                      row.value ? "font-semibold text-slate-800" : "italic text-slate-400"
                    }`}
                  >
                    {row.value || "Not provided"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
        // Documents come between Work/Income and References, matching the step order.
        return section.key === "references" ? [docsSection, block] : block;
      })}
    </div>
  );
}
