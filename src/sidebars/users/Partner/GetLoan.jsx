import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Building,
  Building2,
  Briefcase,
  User,
  X,
  ArrowRight,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";
import { canonicalPartnerReferralCode } from "../../../config/branding";
import ShareLoanModal from "../../../components/loan/ShareLoanModal";

const GetLoan = () => {
  const [selectedLoan, setSelectedLoan] = useState("");
  const [subTypeModal, setSubTypeModal] = useState(null); // 'home' | 'lap' | null
  const [shareModalLoan, setShareModalLoan] = useState(null); // loan object to share
  const navigate = useNavigate();

  // Get current partner profile data
  const profileState = useSelector((state) => state?.partner?.profile?.data);
  const { partnerUser } = getAuthData();

  const partnerCode =
    canonicalPartnerReferralCode(
      profileState?.partnerCode,
      profileState?.referralCode
    ) ||
    canonicalPartnerReferralCode(
      partnerUser?.partnerCode,
      partnerUser?.referralCode
    ) ||
    "";

  const partnerName =
    profileState?.fullName ||
    [profileState?.firstName, profileState?.middleName, profileState?.lastName]
      .filter(Boolean)
      .join(" ") ||
    [partnerUser?.firstName, partnerUser?.lastName].filter(Boolean).join(" ") ||
    "Authorized Partner";

  const loanTypes = [
    {
      id: "personal",
      title: "Personal Loan",
      subtitle: "For Salaried Individuals",
      description: "Quick personal loans with competitive rates for salaried professionals",
      icon: "👤",
      badge: "Upto ₹25L",
      route: "/partner/personal-loan",
      hasSubTypes: false,
    },
    {
      id: "business",
      title: "Business Loan",
      subtitle: "For Entrepreneurs",
      description: "Flexible business financing solutions for growing enterprises",
      icon: "💼",
      badge: "Upto ₹2Cr",
      route: "/partner/bussiness-loan",
      hasSubTypes: false,
    },
    {
      id: "home",
      title: "Home Loan",
      subtitle: "Salaried & Self-Employed",
      description: "Affordable home loans with attractive rates for buying or constructing homes",
      icon: "🏠",
      badge: "Upto ₹5Cr",
      hasSubTypes: true,
      subTypes: [
        {
          title: "Home Loan (Salaried)",
          desc: "For individuals with fixed monthly salary and salary slips",
          route: "/partner/home-loan-salaried",
          tag: "Salaried",
        },
        {
          title: "Home Loan (Self-Employed)",
          desc: "For business owners, traders, proprietors, and professionals",
          route: "/partner/home-loan-self-employee",
          tag: "Self-Employed",
        },
      ],
    },
    {
      id: "lap",
      title: "LAP Loan",
      subtitle: "Loan Against Property",
      description: "Unlock high-value funding against your residential, commercial, or industrial property",
      icon: "🏢",
      badge: "Upto ₹5Cr",
      hasSubTypes: true,
      subTypes: [
        {
          title: "LAP (Salaried)",
          desc: "For salaried applicants pledging owned residential or commercial property",
          route: "/partner/lap-loan-salaried",
          tag: "Salaried",
        },
        {
          title: "LAP (Self-Employed)",
          desc: "For business owners & entrepreneurs pledging property for funding",
          route: "/partner/lap-loan-self-employee",
          tag: "Self-Employed",
        },
      ],
    },
  ];

  const handleLoanSelection = (loan) => {
    if (loan.isComingSoon) return;
    if (loan.hasSubTypes) {
      setSubTypeModal(loan);
      return;
    }
    setSelectedLoan(loan.id);
    navigate(loan.route);
  };

  const handleOpenShare = (e, loan) => {
    e.stopPropagation();
    setShareModalLoan(loan);
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100/70">
      <div className="w-full max-w-6xl py-8">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-3 border border-teal-200/60">
            Loan Products
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            Choose Your Loan Product
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Select a product to start an application, or share your customized partner link with your customers directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loanTypes.map((loan) => (
            <div
              key={loan.id}
              onClick={() => handleLoanSelection(loan)}
              className={`
                relative group transition-all duration-300 transform bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-slate-200/80 hover:border-teal-500/50 flex flex-col justify-between
                ${loan.isComingSoon ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:-translate-y-1.5"}
                ${selectedLoan === loan.id ? "ring-2 ring-teal-500 -translate-y-1.5" : ""}
              `}
            >
              {/* Top Row: Icon + Badge on left, Share Link on top above right */}
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{loan.icon}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/50">
                    {loan.badge}
                  </span>
                </div>

                {/* Share Link Button (Top Above Right) */}
                <button
                  type="button"
                  onClick={(e) => handleOpenShare(e, loan)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all duration-200 transform hover:scale-105 active:scale-95"
                  title={`Share ${loan.title} link with your customer`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link</span>
                </button>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition">
                  {loan.title}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-2">
                  {loan.subtitle}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {loan.description}
                </p>
              </div>

              {/* Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-teal-700 group-hover:text-teal-800">
                <span>{loan.hasSubTypes ? "Choose Variant" : "Apply Now"}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>

              {/* Coming Soon Flag */}
              {loan.isComingSoon && (
                <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                  SOON
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal for Sub-types (Home / LAP) */}
        {subTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
              <button
                type="button"
                onClick={() => setSubTypeModal(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-3xl mb-3 border border-teal-200/50">
                  {subTypeModal.icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {subTypeModal.title}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Select the applicant's employment profile to proceed, or share a specific variant link:
                </p>
              </div>

              <div className="space-y-3">
                {subTypeModal.subTypes.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border-2 border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/30 transition flex items-center justify-between group"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        setSubTypeModal(null);
                        navigate(sub.route);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-teal-800 text-base">
                          {sub.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {sub.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {sub.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalLoan({
                            id: subTypeModal.id,
                            title: sub.title,
                            badge: subTypeModal.badge,
                            route: sub.route,
                            hasSubTypes: false,
                          });
                        }}
                        className="p-2 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200 transition"
                        title={`Share ${sub.title} Link`}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSubTypeModal(null);
                          navigate(sub.route);
                        }}
                        className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition"
                        title="Open Form"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setSubTypeModal(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Loan Modal */}
        <ShareLoanModal
          isOpen={Boolean(shareModalLoan)}
          onClose={() => setShareModalLoan(null)}
          loan={shareModalLoan}
          partnerCode={partnerCode}
          partnerName={partnerName}
        />

        {/* Footer info */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            100% digital onboarding with guided documentation & instant tracking
          </p>
        </div>
      </div>
    </section>
  );
};

export default GetLoan;
