import { User, Briefcase, Building2, Home, Check } from "lucide-react";
import React from "react";

const Documents = () => {
  const loanTypes = [
    {
      title: "Personal Loan (Salaried)",
      icon: User,
      accentBar: "from-teal-600 via-brand-primary to-emerald-600",
      iconWrap: "bg-teal-50 text-teal-700 ring-teal-200/60",
      documents: [
        "Aadhaar Card (Front & Back)",
        "PAN Card",
        "Passport Size Photograph / Selfie",
        "Current Residence Proof (Electricity Bill / Rent Agreement)",
        "Company ID Card",
        "Last 3 Months Salary Slips",
        "Last 6 Months Salary Bank Account Statement",
        "Latest Form 16 / ITR",
        "CIBIL Score 700+ Preferred",
      ],
    },
    {
      title: "Business Loan (MSME / Self-Employed)",
      icon: Briefcase,
      accentBar: "from-slate-700 via-teal-800 to-brand-primary",
      iconWrap: "bg-slate-50 text-slate-800 ring-slate-200/70",
      documents: [
        "PAN Card (Applicant & Business Entity)",
        "Aadhaar Card of Applicant / Partners / Directors",
        "Business Proof (GST / Udyam / Shop Act / Trade License)",
        "Last 12 Months Current Account Bank Statement",
        "Last 2-3 Years ITR with Computation, Balance Sheet & P&L",
        "Business Premises / Shop Photographs",
        "Current Residence Proof",
        "CIBIL Score 700+ Preferred",
      ],
    },
    {
      title: "Home Loan (Salaried & Self-Employed)",
      icon: Home,
      accentBar: "from-cyan-700 via-teal-600 to-emerald-700",
      iconWrap: "bg-cyan-50 text-cyan-800 ring-cyan-200/50",
      documents: [
        "Aadhaar Card & PAN Card",
        "Income Proof: 3 Months Salary Slips & Form 16 OR 3 Years ITR with Audit",
        "Bank Account Statement (6 to 12 months)",
        "Property Title Deeds / Agreement to Sale / Allotment Letter",
        "Approved Sanction Map / Building Plan",
        "Property Tax Receipts & NOC",
        "CIBIL Score 700+ Preferred",
      ],
    },
    {
      title: "Loan Against Property (LAP)",
      icon: Building2,
      accentBar: "from-purple-700 via-indigo-600 to-teal-600",
      iconWrap: "bg-purple-50 text-purple-800 ring-purple-200/60",
      documents: [
        "Aadhaar Card & PAN Card of Applicant & Co-Applicants",
        "Income Proof: Salary Slips (Salaried) OR 3 Years ITR & Audit (Self-Employed)",
        "Last 6 to 12 Months Bank Account Statement",
        "Complete Chain of Title Deeds for Collateral Property",
        "Approved Sanction Plan, Municipal Tax Receipts & OC",
        "Non-Encumbrance Certificate (NEC)",
        "CIBIL Score 700+ Preferred",
      ],
    },
  ];

  return (
    <section className="relative overflow-x-hidden border-t border-slate-200/80 bg-gradient-to-b from-slate-100/90 via-white to-slate-50/95 py-16 px-4 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(13,148,136,0.09),transparent_58%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-primary shadow-sm shadow-slate-900/5 backdrop-blur-sm sm:text-xs">
            Documents
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Checklist by{" "}
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-primary bg-clip-text text-transparent">
              product
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Required documents vary by lender and profile—use this as a ready reference before you apply.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-12px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6 sm:py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
              Document requirements by loan type
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px bg-slate-200/90 lg:grid-cols-2">
            {loanTypes.map((loan) => {
              const Icon = loan.icon;
              return (
                <div
                  key={loan.title}
                  className="group flex flex-col bg-white p-6 transition-colors hover:bg-slate-50/90 sm:p-8"
                >
                  <div className={`mb-4 h-1 w-16 rounded-full bg-gradient-to-r ${loan.accentBar}`} aria-hidden />
                  <div className="mb-6 flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${loan.iconWrap}`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">{loan.title}</h2>
                  </div>
                  <ul className="space-y-2.5">
                    {loan.documents.map((document) => (
                      <li key={document} className="flex items-start gap-3 text-sm text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                        <span>{document}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Documents;
