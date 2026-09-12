import React, { useRef } from "react";
import { X, MapPin, ShieldCheck, Printer, Download, CreditCard, Building2, Phone, Mail } from "lucide-react";
import { COMPANY_NAME, COMPANY_NAME_LEGAL } from "../../config/branding";

export default function PartnerIdCardModal({
  isOpen,
  onClose,
  partner,
}) {
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const partnerName =
    partner?.fullName ||
    [partner?.firstName, partner?.middleName, partner?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Authorized Channel Partner";

  const partnerCode = partner?.partnerCode || partner?.employeeId || "PT-PARTNER";
  const location = partner?.region || "Kharadi, Pune, Maharashtra";
  const photo = partner?.selfie || partner?.photo || null;
  const initials = partnerName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CP";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Digital Partner ID Card
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              title="Print ID Card"
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

        {/* Digital ID Card Container */}
        <div className="flex justify-center my-2">
          <div
            ref={cardRef}
            className="relative w-full max-w-[320px] bg-white rounded-3xl shadow-xl border-2 border-teal-500/20 overflow-hidden text-center pb-20"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 text-white p-5 text-center relative">
              <div className="text-[10px] font-bold tracking-widest uppercase mt-3 text-teal-200 leading-tight">
                Our Great Collaborations
              </div>
              <div className="text-sm font-black tracking-wide text-white mt-0.5">
                {COMPANY_NAME}
              </div>

              {/* ID Badge */}
              <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border border-white/30">
                ID: {partnerCode}
              </div>
            </div>

            {/* Avatar & Photo */}
            <div className="px-5 pt-5 pb-3">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-full h-full rounded-2xl flex items-center justify-center overflow-hidden border-3 border-teal-500 shadow-md bg-teal-50">
                  {photo ? (
                    <img
                      src={photo}
                      alt={partnerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-teal-700 text-2xl font-black">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Verified Shield Badge on Avatar */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="text-slate-900 text-lg font-extrabold leading-snug">
                {partnerName}
              </div>

              <div className="inline-block mt-2 bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-teal-200 shadow-sm">
                Certified Channel Partner
              </div>
            </div>

            {/* Location & Details */}
            <div className="px-5 py-2 flex flex-col items-center gap-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span>Authorized DhanSource Loan Facilitator</span>
              </div>
            </div>

            {/* Head Office Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-3 text-center">
              <h4 className="text-[9px] font-bold uppercase tracking-wider mb-0.5 text-amber-400">
                Head Office
              </h4>
              <div className="text-[8.5px] leading-tight text-slate-300">
                Office No - 31, C Wing, Ashoka Nagar, Kharadi, Pune, MH 411014<br />
                <span className="text-amber-200 font-semibold">Phone:</span> +91 7057772026 • <span className="text-amber-200 font-semibold">Email:</span> support@dhansourcecapital.com
              </div>
            </div>
          </div>
        </div>

        {/* Verification Footer Text */}
        <p className="text-center text-[11px] text-slate-500 mt-3">
          Scan or verify partner details anytime with DhanSource Capital Pvt Ltd.
        </p>
      </div>
    </div>
  );
}
