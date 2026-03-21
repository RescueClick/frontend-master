import { User, Zap, Building2, Home, Check } from "lucide-react";
import React from "react";

const Documents = () => {
  const loanTypes = [
    {
      title: "Personal Loan",
      icon: User,
      accentBar: "from-teal-600 via-brand-primary to-emerald-600",
      iconWrap: "bg-teal-50 text-teal-700 ring-teal-200/60",
      documents: [
        "Aadhaar Card",
        "PAN Card",
        "Mobile Number",
        "Email ID",
        "Salary Slip (Last 3 months)",
        "Bank Account Statement (Last 6 months)",
        "Form 16 AS",
        "Office I-card",
        "CIBIL 680+",
        "Current Residential Proof",
      ],
    },
    {
      title: "Instant Loan",
      icon: Zap,
      accentBar: "from-cyan-600 via-teal-600 to-brand-primary",
      iconWrap: "bg-cyan-50 text-cyan-800 ring-cyan-200/50",
      documents: ["Aadhaar Card", "PAN Card", "Mobile Number", "Email ID", "CIBIL 680+"],
    },
    {
      title: "Business Loan",
      icon: Building2,
      accentBar: "from-slate-700 via-teal-800 to-brand-primary",
      iconWrap: "bg-slate-50 text-slate-800 ring-slate-200/70",
      documents: [
        "PAN Card (Individual & Business)",
        "Aadhaar Card",
        "Registration Proof",
        "Bank Account Statement (Last 6 months)",
        "CIBIL 680+",
      ],
    },
    {
      title: "Home Loan",
      icon: Home,
      accentBar: "from-emerald-700 via-teal-700 to-teal-600",
      iconWrap: "bg-emerald-50 text-emerald-800 ring-emerald-200/55",
      documents: [
        "Aadhaar Card",
        "PAN Card",
        "Property Documents",
        "Income Proof (Salary Slips)",
        "Bank Statement (Last 6 months)",
        "CIBIL 680+",
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
