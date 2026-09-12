import React from "react";
import { User, Home, Building2, Briefcase, ArrowRight, Check, Building, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      title: "Personal Loan",
      description:
        "Fast digital approval & quick bank disbursement for salaried professionals.",
      amount: "Upto ₹25 Lakhs",
      icon: User,
      features: [
        "Salary requirement: ₹15,000+ per month",
        "Quick approval process (24 - 72 hrs)",
        "Zero collateral or mortgage needed",
        "Competitive interest rates from 10.5%",
      ],
      link: "/apply/personal-loan",
      accentBar: "from-teal-600 via-brand-primary to-emerald-600",
      iconBg: "from-teal-50 to-emerald-50/90 ring-teal-200/60",
      iconColor: "text-teal-700",
    },
    {
      id: 2,
      title: "Business Loan",
      description:
        "Working capital and expansion capital for MSMEs, retailers, and enterprises.",
      amount: "Upto ₹2 Crores",
      icon: Briefcase,
      features: [
        "100% unsecured business capital",
        "High sanction based on banking volume",
        "Flexible repayment terms up to 84 months",
        "Fast digital underwriting",
      ],
      link: "/apply/business-loan",
      accentBar: "from-slate-700 via-teal-800 to-brand-primary",
      iconBg: "from-slate-50 to-teal-50/80 ring-slate-200/70",
      iconColor: "text-slate-800",
    },
    {
      id: 3,
      title: "Home Loan (Salaried)",
      description:
        "Home loans tailored for salaried customers with a streamlined digital journey.",
      amount: "Upto ₹5 Crores",
      icon: Home,
      features: [
        "For MNC, Private & Govt employees",
        "Up to 90% of property cost funded",
        "Tenure up to 30 years for lowest EMI",
        "Max tax deductions under 80C & 24(b)",
      ],
      link: "/apply/home-loan-salaried",
      accentBar: "from-cyan-700 via-teal-600 to-emerald-700",
      iconBg: "from-cyan-50/90 to-teal-50 ring-cyan-200/50",
      iconColor: "text-cyan-800",
    },
    {
      id: 4,
      title: "Home Loan (Self Employed)",
      description:
        "Flexible home loans for self-employed professionals, traders & business owners.",
      amount: "Upto ₹5 Crores",
      icon: Building2,
      features: [
        "Gross turnover & banking evaluation",
        "Purchase, plot, renovation & self-construction",
        "Structured documentation support",
        "Co-applicant pooling to boost limit",
      ],
      link: "/apply/home-loan-self-employed",
      accentBar: "from-emerald-700 via-teal-700 to-teal-600",
      iconBg: "from-emerald-50 to-teal-50/90 ring-emerald-200/55",
      iconColor: "text-emerald-800",
    },
    {
      id: 5,
      title: "Loan Against Property (Salaried)",
      description:
        "High-value funding pledging owned residential or commercial property at low interest rates.",
      amount: "Upto ₹10 Crores",
      icon: Building,
      features: [
        "For salaried property owners",
        "Lower EMI burden with tenure up to 20 yrs",
        "High LTV: Unlock 70-75% property value",
        "Property remains in your complete use",
      ],
      link: "/apply/lap-loan-salaried",
      accentBar: "from-purple-700 via-indigo-600 to-teal-600",
      iconBg: "from-purple-50 to-indigo-50/90 ring-purple-200/60",
      iconColor: "text-purple-700",
    },
    {
      id: 6,
      title: "Loan Against Property (Self Employed)",
      description:
        "Large-ticket capital injection against property to fuel business scaling or restructure liabilities.",
      amount: "Upto ₹10 Crores",
      icon: Landmark,
      features: [
        "For business owners, partners & directors",
        "Large capital injection up to ₹10 Crores",
        "Tax benefits on business interest paid",
        "Fast legal & valuation verification",
      ],
      link: "/apply/lap-loan-self-employed",
      accentBar: "from-indigo-700 via-purple-700 to-brand-primary",
      iconBg: "from-indigo-50 to-purple-50/90 ring-indigo-200/60",
      iconColor: "text-indigo-800",
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
            Services
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Loan solutions{" "}
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-primary bg-clip-text text-transparent">
              for every need
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Compare and apply across trusted lenders—with clear eligibility, documentation support, and expert guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/85 bg-white text-center shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/25 hover:shadow-[0_12px_40px_-8px_rgba(13,148,136,0.18)]"
              >
                <div className={`h-1 w-full shrink-0 bg-gradient-to-r ${service.accentBar}`} aria-hidden />
                <div className="flex flex-1 flex-col px-6 pb-7 pt-8 sm:px-7">
                  <div
                    className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner ring-1 ${service.iconBg}`}
                  >
                    <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${service.iconColor}`} strokeWidth={1.75} />
                  </div>
                  <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold leading-snug text-slate-900">{service.title}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {service.amount}
                    </span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{service.description}</p>
                  <ul className="mb-7 flex-1 space-y-2.5 text-left text-sm text-slate-600">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => navigate(service.link)}
                    className="group/btn mt-auto inline-flex items-center justify-center gap-2 self-center rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-hover px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition hover:from-brand-primary-hover hover:to-[#0d5c56] hover:shadow-lg hover:shadow-brand-primary/25"
                  >
                    Apply now
                    <ArrowRight className="h-4 w-4 transition group-hover/btn:translate-x-0.5" aria-hidden />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
