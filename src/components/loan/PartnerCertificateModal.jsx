import React, { useRef } from "react";
import { X, CheckCircle2, ShieldCheck, Printer, Download, Award } from "lucide-react";
import { COMPANY_NAME, COMPANY_NAME_LEGAL } from "../../config/branding";

export default function PartnerCertificateModal({
  isOpen,
  onClose,
  partner,
}) {
  const certificateRef = useRef(null);

  if (!isOpen) return null;

  // Keep only first name and last name, omitting middle name
  const partnerName = (() => {
    if (partner?.firstName && partner?.lastName) {
      return `${partner.firstName.trim()} ${partner.lastName.trim()}`;
    }
    const raw = (partner?.fullName || partner?.name || "").trim();
    if (!raw) {
      if (partner?.firstName) return partner.firstName.trim();
      return "Authorized Channel Partner";
    }
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length > 2) {
      // First name and last name only, omitting middle name(s)
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts.join(" ");
  })();

  const partnerCode = partner?.partnerCode || partner?.employeeId || "—";
  const currentYear = new Date().getFullYear();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              Official Partner Authorization Certificate
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Render View */}
        <div className="overflow-x-auto pb-2">
          <div
            ref={certificateRef}
            className="relative mx-auto w-full min-w-[340px] max-w-[700px] bg-white border-[10px] border-teal-600 p-6 sm:p-10 rounded-lg shadow-inner overflow-hidden select-none"
            style={{ minHeight: "440px" }}
          >
            {/* Corner Decorative Triangles */}
            <div className="absolute top-2 left-2 w-0 h-0 border-l-[30px] border-l-teal-600 border-b-[30px] border-b-transparent"></div>
            <div className="absolute top-2 right-2 w-0 h-0 border-r-[30px] border-r-teal-600 border-b-[30px] border-b-transparent"></div>
            <div className="absolute bottom-2 left-2 w-0 h-0 border-l-[30px] border-l-teal-600 border-t-[30px] border-t-transparent"></div>
            <div className="absolute bottom-2 right-2 w-0 h-0 border-r-[30px] border-r-teal-600 border-t-[30px] border-t-transparent"></div>

            {/* Inner Gold Thin Border */}
            <div className="border border-amber-300 p-4 sm:p-6 rounded">
              {/* Header / Logo */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-600">
                    Dhan<span className="text-amber-500">Source</span> Capital
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide uppercase">
                  {COMPANY_NAME_LEGAL}
                </p>
              </div>

              {/* Certificate Title */}
              <div className="text-center my-3">
                <span className="inline-block px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs sm:text-sm font-extrabold tracking-[2px] uppercase rounded">
                  CERTIFIED CHANNEL PARTNER
                </span>
              </div>

              {/* Recipient Name */}
              <div className="text-center my-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                  This Certificate is Proudly Awarded To
                </p>
                <h2 className="text-xl sm:text-3xl font-extrabold text-teal-700 italic tracking-wide mt-1 break-words px-2">
                  {partnerName}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Partner ID: <span className="font-mono font-bold text-teal-700">{partnerCode}</span>
                </div>
              </div>

              {/* Authorization Text */}
              <p className="text-center text-xs sm:text-sm italic leading-relaxed text-slate-700 max-w-lg mx-auto my-4">
                You are hereby authorized as an official Channel Partner to promote, process,
                and assist applicants for all Financial Products and Services offered by{" "}
                <span className="font-semibold text-slate-900">{COMPANY_NAME_LEGAL}</span> across India.
              </p>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-3 items-end pt-6 sm:pt-8 mt-4 border-t border-slate-200 gap-2">
                {/* Left Signature: Anil Bagad */}
                <div className="text-center">
                  <div className="h-12 flex items-center justify-center mb-1">
                    <img
                      src="/authorized_signatory.png"
                      alt="Signatory"
                      className="h-10 object-contain mix-blend-multiply mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="w-24 sm:w-32 border-b-2 border-slate-700 mx-auto mb-1"></div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-full px-1">Anil Bagad</div>
                  <div className="text-[10px] sm:text-xs text-teal-700 font-semibold">
                    CEO & Director
                  </div>
                </div>

                {/* Middle Seal */}
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 shadow flex flex-col items-center justify-center text-white p-1">
                    <CheckCircle2 className="w-4 h-4 text-white mb-0.5" />
                    <span className="text-[8px] sm:text-[9px] font-extrabold uppercase leading-tight text-center">
                      Verified<br />{currentYear}
                    </span>
                  </div>
                </div>

                {/* Right Signature: Partner Digital Sign */}
                <div className="text-center">
                  <div className="h-12 flex flex-col items-center justify-center mb-1">
                    <span className="italic font-serif text-slate-800 text-xs sm:text-sm font-bold truncate max-w-[130px] block mx-auto px-1">
                      {partnerName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                      ✓ Digitally Signed
                    </span>
                  </div>
                  <div className="w-24 sm:w-32 border-b-2 border-slate-700 mx-auto mb-1"></div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[140px] mx-auto px-1">
                    {partnerName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-teal-700 font-semibold">
                    Partner Digital Sign
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Note */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Official DhanSource verification record • Digital authenticity guaranteed
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
