import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { FaHandshake, FaLaptop, FaBolt, FaHeadset } from "react-icons/fa";
import { Users, Building, MapPin, Shield, Phone, Mail, Wallet, BriefcaseBusiness, Home as HomeIcon, Store, ArrowRight, Target } from "lucide-react";

import { COMPANY_NAME, COMPANY_TAGLINE, CONTACT_EMAIL } from "../config/branding";
import { useNavigate } from 'react-router-dom';
import sbiLogo from "../assets/SBI_bank.png";
import iciciLogo from "../assets/icici_bank.jpeg";
import bankOfBarodaLogo from "../assets/bankofbaroda_bank.png";
import axisLogo from "../assets/axis_bank.png";
import hdfcLogo from "../assets/hdfc_bank.png";
import bankOfIndiaLogo from "../assets/bankofindia_bank.png";
import faircentLogo from "../assets/Faircent_bank.png";
import heroFincorpLogo from "../assets/hero_fincorp_bank.jpeg";
import kotakLogo from "../assets/kotak_mahindra_bank.jpeg";
import muthootLogo from "../assets/muthoot_finance_bank.webp";
import tataCapitalLogo from "../assets/TataCapital_bank.png";
import adityaBirlaLogo from "../assets/AdityaBirlaCapital_bank.png";
import becomePartner from "../assets/logo_list/become_partner.png";


gsap.registerPlugin(useGSAP);

const Home = () => {

  const navigate = useNavigate();

  const container = useRef(null);

  useGSAP(() => {
    const root = container.current;
    if (!root) return;

    const lines = root.querySelectorAll(".line");
    if (!lines.length) return;

    const mm = gsap.matchMedia();
    mm.add("(max-width: 639px)", () => {
      gsap.from(lines, {
        x: 32,
        opacity: 0,
        stagger: 0.2,
        duration: 0.75,
        ease: "power3.out",
      });
    });
    mm.add("(min-width: 640px)", () => {
      gsap.from(lines, {
        x: 120,
        opacity: 0,
        stagger: 0.28,
        duration: 1,
        ease: "power3.out",
      });
    });

    return () => mm.revert();
  }, []);



  const services = [
    {
      title: "Personal Loan",
      description: "Get Personal Loan Upto 40 Lac. Min. Salary 12k.",
      icon: Wallet,
      accentBar: "from-teal-600 via-brand-primary to-emerald-600",
      iconBg: "from-teal-50 to-emerald-50/90 ring-teal-200/60",
      iconColor: "text-teal-700",
    },
    {
      title: "Business Loan",
      description:
        "Working capital and expansion loans with structured documentation support for MSMEs and enterprises.",
      icon: BriefcaseBusiness,
      accentBar: "from-slate-700 via-teal-800 to-brand-primary",
      iconBg: "from-slate-50 to-teal-50/80 ring-slate-200/70",
      iconColor: "text-slate-800",
    },
    {
      title: "Home Loan (Salaried)",
      description:
        "Easy home loans tailored for salaried customers with quick approvals.",
      icon: HomeIcon,
      accentBar: "from-cyan-700 via-teal-600 to-emerald-700",
      iconBg: "from-cyan-50/90 to-teal-50 ring-cyan-200/50",
      iconColor: "text-cyan-800",
    },
    {
      title: "Home Loan (Self Employed)",
      description:
        "Flexible home loans designed for self-employed professionals & business owners.",
      icon: Store,
      accentBar: "from-emerald-700 via-teal-700 to-teal-600",
      iconBg: "from-emerald-50 to-teal-50/90 ring-emerald-200/55",
      iconColor: "text-emerald-800",
    },
  ];


  const cardData = [
    {
      icon: <FaHandshake size={32} className="text-brand-primary" />,
      title: "Tie-up with Leading Lenders",
      desc: "Our top-grade collaborations ensure an extended range of financial services for our customers.",
    },
    {
      icon: <FaLaptop size={32} className="text-brand-primary" />,
      title: "Online Financial Process",
      desc: "With a few clicks, your consultation process gets started without time wastage or splurging.",
    },
    {
      icon: <FaBolt size={32} className="text-brand-primary" />,
      title: "Fast turnaround",
      desc: "Streamlined processes and responsive support so customers and partners move forward without delays.",
    },
    {
      icon: <FaHeadset size={32} className="text-brand-primary" />,
      title: "Free Loan Consultancy",
      desc: "Our experts are always ready to help & guide you in streamlining and scaling your finances.",
    },
  ];


  const partners = [
    { name: "SBI", logo: sbiLogo, description: "India’s largest public sector bank." },
    { name: "ICICI Bank", logo: iciciLogo, description: "Leading private sector bank." },
    { name: "Bank of Baroda", logo: bankOfBarodaLogo, description: "Trusted nationalized bank." },
    { name: "Axis Bank", logo: axisLogo, description: "Innovative financial services provider." },
    { name: "HDFC Bank", logo: hdfcLogo, description: "Top private bank with wide services." },
    { name: "Bank of India", logo: bankOfIndiaLogo, description: "Reliable government bank." },
    { name: "Faircent", logo: faircentLogo, description: "India’s leading P2P lending platform." },
    { name: "Hero Fincorp", logo: heroFincorpLogo, description: "Trusted non-banking finance firm." },
    { name: "Kotak Mahindra", logo: kotakLogo, description: "Progressive financial services." },
    { name: "Muthoot Finance", logo: muthootLogo, description: "Leading gold loan institution." },
    { name: "Tata Capital", logo: tataCapitalLogo, description: "Trusted TATA financial arm." },
    { name: "Aditya Birla Capital", logo: adityaBirlaLogo, description: "Diverse financial solutions." },
  ];

  return (
    <>
      {/* Hero — landing (inside MainLayout) */}
      <section className="relative flex min-h-0 items-center overflow-x-hidden overflow-y-visible bg-slate-950 py-10 min-[480px]:min-h-[85vh] min-[480px]:py-0 lg:min-h-[88vh]">
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

        <div className="relative z-10 mx-auto w-full max-w-7xl px-3 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8 lg:py-24">
          <div className="grid min-w-0 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 min-w-0 mx-auto max-w-xl text-center lg:order-1 lg:mx-0 lg:max-w-[32rem] lg:text-left">
              <p className="mb-3 sm:mb-4 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-primary-light min-[400px]:text-[10px] min-[400px]:tracking-[0.28em] sm:px-4 sm:text-[11px]">
                {COMPANY_TAGLINE}
              </p>

              <h1
                ref={container}
                className="mb-5 sm:mb-6 text-[clamp(1.45rem,4.2vw+0.65rem,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-4xl md:text-5xl lg:text-[3.15rem] xl:text-[3.5rem]"
              >
                <span className="line block text-slate-100">Credit solutions for</span>
                <span className="line block text-slate-100">salaried &amp; business</span>
                <span className="line mt-2 block bg-gradient-to-r from-brand-primary via-emerald-300 to-brand-gold-light bg-clip-text text-transparent">
                  {COMPANY_NAME}
                </span>
              </h1>

              <p className="mx-auto mb-6 sm:mb-8 max-w-lg text-sm leading-[1.7] text-slate-400 min-[400px]:text-[15px] sm:text-lg lg:mx-0">
                Compare loan options across leading banks and lenders with a guided digital journey, expert assistance, and a partner program designed for growth.
              </p>

              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <button
                  type="button"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary-hover hover:shadow-xl hover:shadow-brand-primary/30 sm:text-[15px]"
                  onClick={() => navigate("/PartnerRegistrationForm")}
                >
                  Become a partner
                </button>
                <a
                  href="/Trustline_v2.apk"
                  download
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-8 py-3 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/[0.07] sm:text-[15px]"
                >
                  Download app
                </a>
              </div>

              <div className="mt-8 sm:mt-10 flex flex-col flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 min-[400px]:flex-row min-[400px]:gap-x-6 min-[400px]:gap-y-2 min-[400px]:pt-8 min-[400px]:text-sm sm:gap-x-8 lg:justify-start">
                <span className="inline-flex items-center justify-center gap-2 text-center">
                  <Shield className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                  Bank-grade security
                </span>
                <span className="hidden h-4 w-px bg-white/15 min-[400px]:block" aria-hidden />
                <span className="inline-flex items-center justify-center gap-2 text-center">
                  <Building className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                  100+ lender partnerships
                </span>
              </div>
            </div>

            <div className="relative order-1 flex min-w-0 justify-center lg:order-2">
              <div className="relative w-full max-w-[min(100%,28rem)] sm:max-w-md">
                <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-brand-primary/30 via-teal-600/10 to-transparent blur-2xl" aria-hidden />
                <div className="relative overflow-hidden rounded-[1.65rem] border border-white/10 shadow-2xl shadow-black/50">
                  <img
                    src="https://images.pexels.com/photos/8441813/pexels-photo-8441813.jpeg"
                    alt="Advisor reviewing financial options with a client"
                    className="aspect-[4/5] w-full object-cover sm:aspect-[5/6]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute right-2 top-2 max-w-[calc(100%-1rem)] rounded-lg border border-white/15 bg-slate-950/55 px-2.5 py-1.5 text-left text-[10px] text-white shadow-lg backdrop-blur-md hero-float min-[400px]:right-4 min-[400px]:top-4 min-[400px]:rounded-xl min-[400px]:px-3 min-[400px]:py-2 min-[400px]:text-xs sm:right-5 sm:px-4 sm:py-2.5 sm:text-sm">
                    <p className="font-semibold text-brand-primary-light">Trusted guidance</p>
                    <p className="mt-0.5 text-slate-200">End-to-end loan support</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/40 p-3.5 backdrop-blur-sm sm:p-5 md:p-6">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-primary-light min-[400px]:text-[10px] min-[400px]:tracking-[0.2em] sm:text-xs">Why {COMPANY_NAME}</p>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-200 min-[400px]:mt-1.5 min-[400px]:text-sm sm:text-[15px]">
                      One platform for discovery, application tracking, and partner growth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Products — loan catalogue */}
      <section className="relative overflow-x-hidden border-t border-slate-200/70 bg-gradient-to-b from-slate-100/90 via-white to-slate-50/95 py-14 px-3 sm:py-20 sm:px-4 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(13,148,136,0.09),transparent_58%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(15,23,42,0.03)_0%,transparent_42%,rgba(13,148,136,0.045)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto mb-12 max-w-7xl px-1 text-center sm:mb-16 sm:px-0">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-primary shadow-sm shadow-slate-900/5 backdrop-blur-sm sm:text-xs">
            Loan products
          </span>
          <h2 className="mb-4 text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            Solutions for{" "}
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-primary bg-clip-text text-transparent">
              every customer profile
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Structured offerings for salaried, self‑employed, and business borrowers—supported end-to-end on one platform.
          </p>
        </div>

        <div className="relative z-10 mx-auto grid min-w-0 max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:gap-7 lg:grid-cols-4 lg:gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <article
                key={index}
                className="service-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/85 bg-white text-center shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/25 hover:shadow-[0_12px_40px_-8px_rgba(13,148,136,0.18)]"
              >
                <div
                  className={`h-1 w-full shrink-0 bg-gradient-to-r ${service.accentBar}`}
                  aria-hidden
                />
                <div className="flex flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 sm:pb-7 sm:pt-8 md:px-7">
                  <div
                    className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner ring-1 ${service.iconBg}`}
                  >
                    <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${service.iconColor}`} strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2.5 text-lg font-semibold leading-snug text-slate-900">
                    {service.title}
                  </h3>
                  <p className="mb-7 flex-1 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                    {service.description}
                  </p>
                  <button
                    type="button"
                    className="group/btn mt-auto inline-flex cursor-pointer items-center justify-center gap-2 self-center rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-hover px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition hover:from-brand-primary-hover hover:to-[#0d5c56] hover:shadow-lg hover:shadow-brand-primary/25"
                    onClick={() => {
                      switch (service.title) {
                        case "Personal Loan":
                          navigate("/partner/application/personal-loan");
                          break;
                        case "Business Loan":
                          navigate("/partner/application/business-loan");
                          break;
                        case "Home Loan (Salaried)":
                          navigate("/partner/application/home-loan-salaried");
                          break;
                        case "Home Loan (Self Employed)":
                          navigate("/partner/application/home-loan-self-employed");
                          break;
                        default:
                          navigate("/partner/application/personal-loan");
                      }
                    }}
                  >
                    Apply now
                    <ArrowRight className="h-4 w-4 transition group-hover/btn:translate-x-0.5" aria-hidden />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-x-hidden overflow-y-visible bg-gradient-to-br from-amber-600 via-amber-700 to-amber-950 py-12 sm:py-16 md:py-20 lg:flex lg:min-h-[min(90vh,920px)] lg:items-center">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_30%,rgba(255,255,255,0.12),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(120,53,15,0.45),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]"
          aria-hidden
        />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid min-w-0 grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
            {/* Visual — professional with mobile (hero focal) */}
            <div className="order-1 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[min(100%,520px)]">
                <div
                  className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-200/20 to-amber-950/30 blur-2xl"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-2xl border border-amber-200/25 shadow-2xl shadow-black/35 ring-1 ring-black/10">
                  <div className="relative aspect-[3/4] w-full max-h-[min(380px,52svh)] sm:max-h-[min(480px,65svh)] md:max-h-[min(580px,78vh)] sm:aspect-[4/5]">
                    <img
                      src={becomePartner}
                      alt="Channel partner using the DhanSource partner platform"
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-amber-900/20" />
                  <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-black/45 px-3 py-2.5 backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:px-5 sm:py-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200 sm:text-xs">
                      Partner app
                    </p>
                    <p className="mt-1 text-xs font-medium leading-snug text-white sm:text-sm">
                      Track leads, payouts, and applications—right from your phone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="order-2 text-center lg:text-left">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/90 sm:text-xs">
                Channel partner program
              </p>

              <h2 className="text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.35rem] xl:text-5xl">
                <span className="md:hidden">
                  <span className="text-white drop-shadow-sm">DhanSource</span> Partner
                </span>
                <span className="hidden md:block">
                  Become a{" "}
                  <span className="text-white drop-shadow-sm">{COMPANY_NAME}</span>
                  <br />
                  <span className="text-amber-100">Partner</span>
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-amber-50/95 lg:mx-0 lg:text-lg">
                Represent a trusted lending marketplace with training, marketing support, and transparent commissions.
                Help clients find the right loan while you grow a scalable partner business.
              </p>

              <ul className="mx-auto mt-6 max-w-xl space-y-3 text-left text-sm text-amber-50/90 lg:mx-0 sm:text-base">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" aria-hidden />
                  Dedicated onboarding and product training for partners
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" aria-hidden />
                  Earn competitive payouts with clear reporting
                </li>
              </ul>

              <p className="mx-auto mt-8 max-w-xl text-lg font-semibold text-white lg:mx-0 sm:text-xl">
                Earn up to{" "}
                <span className="text-amber-100">₹1,00,000</span>{" "}
                <span className="font-normal text-amber-200/80">/ month</span> at peak performance.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={() => navigate("/PartnerRegistrationForm")}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-black hover:shadow-xl sm:px-10 sm:text-base"
                >
                  Apply as partner
                </button>
                <a
                  href="tel:+918766681450"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/35 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20 sm:text-base"
                >
                  Talk to us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-x-hidden border-t border-amber-900/30 bg-white py-14 px-3 sm:py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Platform</p>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl text-balance">
              Built for speed, trust, and scale
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              One ecosystem connecting customers, channel partners, and lenders—with clear processes and accountable governance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {cardData.map((card, index) => (
              <div
                key={index}
                className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 text-center transition hover:border-brand-primary/15 hover:bg-white hover:shadow-md sm:p-6 md:p-7"
              >
                <div className="mb-4 flex justify-center">{card.icon}</div>
                <h3 className="mb-2 text-base font-semibold text-slate-900">{card.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us + metrics — same atmosphere as hero (slate-950 + teal + grid) */}
      <section className="relative overflow-hidden border-t border-white/10 bg-slate-950 py-20 text-white sm:py-24">
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
        <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary-light">
              Why {COMPANY_NAME}
            </p>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl text-balance">
              A partner you can rely on for credit access
            </h2>
            <p className="text-base leading-relaxed text-slate-400 sm:text-lg">
              We combine lender reach, digital tooling, and partner support so borrowers and associates get clarity at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Users className="h-7 w-7 text-white" />,
                value: "1000+",
                title: "Customers served",
                desc: "Growing base of individuals and businesses seeking structured credit solutions.",
              },
              {
                icon: <Building className="h-7 w-7 text-white" />,
                value: "100+",
                title: "Partners",
                desc: "Channel partners across regions helping clients access the right products.",
              },
              {
                icon: <Shield className="h-7 w-7 text-white" />,
                value: "100+",
                title: "Lender tie-ups",
                desc: "Collaborations with banks and lenders to widen product choice and eligibility.",
              },
              {
                icon: <MapPin className="h-7 w-7 text-white" />,
                value: "Pan-India",
                title: "Coverage",
                desc: "Nationwide reach with digital-first journeys and local partner presence.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-md transition hover:border-brand-primary/25 hover:bg-white/[0.08]"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover shadow-lg shadow-brand-primary/20">
                  {item.icon}
                </div>
                <div className="mb-1 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                  {item.value}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About + contact */}
      {/* <section className="relative border-t border-slate-200 bg-white py-20 text-slate-900 sm:py-24">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">About us</p>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl text-balance">
              Empowering India with accessible credit
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              We focus on individuals and small businesses—often underserved—in urban, semi-urban, and rural markets.
            </p>
          </div>

          <div className="mb-14 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8 shadow-sm">
              <p className="mb-5 text-[15px] leading-relaxed text-slate-700 sm:text-lg">
                <span className="font-semibold text-slate-900">{COMPANY_NAME}</span>{" "}
                connects borrowers with suitable lenders through transparent processes and digital-first workflows.
              </p>
              <p className="text-[15px] leading-relaxed text-slate-600 sm:text-lg">
                Our goal is straightforward:{" "}
                <span className="font-medium text-slate-800">simple, transparent financial products</span> aligned with how India borrows today.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-primary/[0.06] to-brand-primary-muted/40 p-8 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover shadow-lg shadow-brand-primary/20">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">Our mission</h3>
                <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                  Bridge the gap between credit need and credit access—with responsible guidance, technology, and partner-led distribution.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 shadow-sm sm:p-10">
            <h3 className="mb-8 text-center text-xl font-semibold text-slate-900 sm:text-2xl">Get in touch</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <a
                href="tel:+918766681450"
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-primary/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Phone</p>
                  <p className="text-lg font-semibold text-slate-900 transition group-hover:text-brand-primary">+91 8766681450</p>
                </div>
              </a>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-primary/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</p>
                  <p className="break-all text-sm font-semibold text-slate-900 transition group-hover:text-brand-primary sm:text-base">
                    {CONTACT_EMAIL}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section> */}

      <section className="relative overflow-hidden border-t border-slate-200/90 bg-gradient-to-b from-slate-100/40 via-white to-slate-50/50 py-14 px-3 sm:py-20 sm:px-6 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-5%,rgba(13,148,136,0.07),transparent_65%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-10 lg:mb-14 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-primary sm:text-xs">
                Lenders &amp; partners
              </p>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Institutional network you can rely on
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Curated relationships with leading banks and institutions so every recommendation is backed by credible, regulated lenders.
              </p>
            </div>
            <div className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3.5 shadow-sm shadow-slate-900/5 backdrop-blur-sm sm:gap-4 sm:rounded-r-none sm:border-r-0 sm:px-6 sm:py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Building className="h-5 w-5 shrink-0" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-slate-900 sm:text-3xl">
                    {partners.length}+
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    lender partners
                  </p>
                </div>
              </div>
              <div className="hidden h-px w-full bg-slate-200 sm:block sm:h-auto sm:w-px sm:self-stretch" aria-hidden />
              <div className="rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3.5 text-sm leading-snug text-slate-600 shadow-sm shadow-slate-900/5 backdrop-blur-sm sm:rounded-l-none sm:border-l-0 sm:px-6 sm:py-5 sm:pl-5 lg:max-w-[220px]">
                <span className="font-medium text-slate-800">Pan-India coverage</span>
                <span className="mt-1 block text-xs text-slate-500">
                  Consistent product access across major banks &amp; lenders
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-12px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04]">
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6 sm:py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                Featured lending institutions
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-px bg-slate-200/90 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {partners.map((partner) => (
                <div
                  key={partner.name}
                  className="partner-card group relative flex min-h-[118px] flex-col items-center justify-center bg-white px-2 py-5 transition-colors hover:bg-slate-50/90 min-[400px]:min-h-[132px] min-[400px]:px-4 min-[400px]:py-7 sm:min-h-[148px] sm:py-8"
                >
                  <div className="mb-4 flex h-[52px] w-full max-w-[128px] items-center justify-center sm:h-14">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-full w-auto max-w-full object-contain opacity-[0.92] transition duration-300 group-hover:opacity-100"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p className="text-center text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 sm:text-[11px] sm:tracking-[0.14em]">
                    {partner.name}
                  </p>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-gradient-to-r from-brand-primary to-teal-600 transition duration-300 group-hover:scale-x-100" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



    </>
  );
};

export default Home;



