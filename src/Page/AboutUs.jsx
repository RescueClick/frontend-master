import React from "react";
import { CheckCircle, Smartphone } from "lucide-react";
import { COMPANY_NAME } from "../config/branding";

const AboutUs = () => {
  const stats = [
    { number: "80k+", label: "Happy customers" },
    { number: "1000+", label: "Partners" },
    { number: "45+", label: "Bank partnerships" },
    { number: "Pan-India", label: "Coverage" },
  ];

  const features = [
    "Expert financial consultation",
    "100% digital process",
    "No physical visits required",
    "Transparent partner commissions",
    "Smartphone accessible",
    "All-India service",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — matches Home hero atmosphere */}
      <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.92)_40%,rgba(13,148,136,0.12)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(13,148,136,0.2),transparent_60%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-primary-light sm:text-xs">About us</p>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            We are{" "}
            <span className="bg-gradient-to-r from-brand-primary-light via-emerald-300 to-brand-primary bg-clip-text text-transparent">
              {COMPANY_NAME}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Serving financial services for your goals—with a digital-first journey and human support when you need it.
          </p>
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md sm:p-8">
            <p className="text-[15px] leading-relaxed text-slate-200 sm:text-lg">
              <strong className="text-white">{COMPANY_NAME}</strong> is an online platform where individuals and businesses can access
              expert financial consultation and structured credit options from the comfort of home.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:gap-8 sm:px-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-sm transition hover:border-brand-primary/20 hover:shadow-md"
            >
              <div className="text-2xl font-semibold tabular-nums text-brand-primary sm:text-3xl md:text-4xl">{stat.number}</div>
              <div className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Why us</p>
              <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                Credit access, simplified
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-600 sm:text-lg">
                <p>
                  When it comes to fulfilling life goals, clarity and speed matter—and {COMPANY_NAME} is built around both.
                </p>
                <p>
                  Skip endless paperwork and opaque processes. Get guidance and applications moving from your smartphone, with support
                  from our partner network.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-8 shadow-sm ring-1 ring-slate-900/5">
              <h3 className="mb-6 flex items-center gap-3 text-xl font-semibold text-slate-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Smartphone className="h-6 w-6" aria-hidden />
                </span>
                Why choose us
              </h3>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm font-medium text-slate-700 sm:text-base">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Company */}
      <section className="border-t border-slate-200 bg-gradient-to-b from-slate-100/40 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 text-white shadow-xl ring-1 ring-slate-900/10">
            <div className="h-1 w-full bg-gradient-to-r from-brand-primary via-teal-400 to-emerald-500" aria-hidden />
            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">About {COMPANY_NAME}</h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                <p>
                  <strong className="text-white">Legal name:</strong> {COMPANY_NAME}
                </p>
                <p>
                  We have grown from partnerships to becoming an independent financial services provider—evolving with our customers and
                  the market.
                </p>
                <p>
                  Today we serve customers across India through our digital platform, collaborating with leading banks
                  and lending partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
