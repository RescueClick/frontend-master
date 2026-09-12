import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { COMPANY_NAME } from "../../config/branding";

export default function PublicLoanPartnerTrustBanner({ partner, loanTitle }) {
  const navigate = useNavigate();

  const partnerName =
    partner?.fullName ||
    [partner?.firstName, partner?.middleName, partner?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Authorized Financial Advisor";

  const partnerCode = partner?.partnerCode || partner?.employeeId || null;

  return (
    <div className="mb-4 bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-md border border-teal-700/60 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-white">
              Application Assisted by {partnerName}
            </span>
            {partnerCode && (
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Partner ID: {partnerCode}
              </span>
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/20">
              Zero Advance Fees
            </span>
          </div>
          <p className="text-[11px] text-teal-200/80 mt-0.5">
            Your {loanTitle || "Loan"} application is directly mapped to this authorized {COMPANY_NAME} advisor for fast bank evaluation.
          </p>
        </div>
      </div>

      {partnerCode && (
        <button
          type="button"
          onClick={() => navigate(`/advisor/${encodeURIComponent(partnerCode)}`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 border border-white/20 text-xs font-bold transition shadow-sm hover:scale-[1.02] active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
          <span>← Back to Advisor Store</span>
        </button>
      )}
    </div>
  );
}
