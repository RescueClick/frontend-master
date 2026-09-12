import React, { useState, useMemo } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Award,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  buildPartnerLoanShareUrl,
  buildPartnerStoreUrl,
  buildPartnerLoanShareMessage,
} from "../../feature/publicLoanReferral";
import { whatsAppShareUrl, COMPANY_NAME } from "../../config/branding";
import PartnerCertificateModal from "./PartnerCertificateModal";
import PartnerIdCardModal from "./PartnerIdCardModal";

export default function ShareLoanModal({
  isOpen,
  onClose,
  loan,
  partnerCode,
  partnerName,
}) {
  const [copied, setCopied] = useState(false);
  const [selectedVariantRoute, setSelectedVariantRoute] = useState(null);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [showIdCardPreview, setShowIdCardPreview] = useState(false);
  const [shareDestination, setShareDestination] = useState("store"); // "store" (Advisor Page with All Products) | "direct" (Single Product Form)

  // If the loan has subTypes, pick the first or currently selected
  const activeRoute = useMemo(() => {
    if (!loan) return "";
    if (loan.hasSubTypes && loan.subTypes?.length > 0) {
      return selectedVariantRoute || loan.subTypes[0].route;
    }
    return loan.route || `/partner/application/${loan.id}-loan`;
  }, [loan, selectedVariantRoute]);

  const activeTitle = useMemo(() => {
    if (!loan) return "Loan";
    if (loan.hasSubTypes && loan.subTypes?.length > 0) {
      const match = loan.subTypes.find((s) => s.route === activeRoute);
      if (match) return match.title;
    }
    return loan.title;
  }, [loan, activeRoute]);

  const directFormUrl = useMemo(() => {
    return buildPartnerLoanShareUrl(activeRoute, partnerCode);
  }, [activeRoute, partnerCode]);

  const storeProfileUrl = useMemo(() => {
    return buildPartnerStoreUrl(partnerCode);
  }, [partnerCode]);

  const shareUrl = shareDestination === "store" ? storeProfileUrl : directFormUrl;

  const shareText = useMemo(() => {
    return buildPartnerLoanShareMessage({
      loanTitle: activeTitle,
      loanBadge: loan?.badge || "Fast processing",
      loanUrl: shareUrl,
      partnerName: partnerName || "Certified Loan Advisor",
      partnerCode: partnerCode || "",
    });
  }, [activeTitle, loan?.badge, shareUrl, partnerName, partnerCode]);

  if (!isOpen || !loan) return null;

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success("Shareable loan link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link. Please manually copy it.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `Apply for ${activeTitle} - ${COMPANY_NAME}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const waUrl = whatsAppShareUrl(shareText);
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-3xl mb-3 border border-teal-200/50 shadow-sm">
              <Share2 className="w-7 h-7 text-teal-600" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60 uppercase tracking-wider mb-1">
              Customer Application Link
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Share {loan.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
              Share this customized link with your customer. When they submit the form, it will be automatically linked to your partner code.
            </p>
          </div>

          {/* Partner attribution badge */}
          <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500">Attributed to: </span>
                <span className="font-bold text-slate-900">{partnerName || "You"}</span>
                {partnerCode && (
                  <span className="ml-1.5 font-mono font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                    {partnerCode}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCertPreview(true)}
              className="text-[11px] font-bold text-teal-700 hover:text-teal-800 underline flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              Certificate
            </button>
          </div>

          {/* Link Destination Toggle */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Where will customer land?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShareDestination("store")}
                className={`py-2 px-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between ${
                  shareDestination === "store"
                    ? "bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/30"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    🌐 Advisor Storefront
                  </span>
                  {shareDestination === "store" && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <span className="text-[10px] text-teal-700 font-semibold mt-0.5">
                  All 6 Loans & Partner Profile (Recommended)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShareDestination("direct")}
                className={`py-2 px-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between ${
                  shareDestination === "direct"
                    ? "bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/30"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>📄 Direct Form</span>
                  {shareDestination === "direct" && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  Only this {activeTitle} form
                </span>
              </button>
            </div>
          </div>

          {/* Variant selection (for Home Loan / LAP) */}
          {shareDestination === "direct" && loan.hasSubTypes && loan.subTypes?.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Select Applicant Variant:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {loan.subTypes.map((sub, idx) => {
                  const isSelected = activeRoute === sub.route;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariantRoute(sub.route)}
                      className={`py-2 px-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/30"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{sub.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 font-normal">
                        {sub.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Link box */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Shareable URL:
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-teal-500">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs font-mono text-slate-700 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition transform hover:scale-[1.01] active:scale-95"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Share on WhatsApp</span>
            </button>

            {/* Native / Device Share */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via App</span>
              </button>

              {/* Preview Link */}
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview Customer View</span>
              </a>
            </div>
          </div>

          {/* Trust hint & Previews */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowIdCardPreview(true)}
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-bold transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
              <span>Preview My ID Card</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCertPreview(true)}
              className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-900 font-bold transition"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Preview My Certificate</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Customers see your verified ID Card, Certificate & rapid Apply button
          </p>
        </div>
      </div>

      {/* Partner ID Card Preview Modal */}
      <PartnerIdCardModal
        isOpen={showIdCardPreview}
        onClose={() => setShowIdCardPreview(false)}
        partner={{
          fullName: partnerName,
          partnerCode: partnerCode,
        }}
      />

      {/* Partner Certificate Preview Modal */}
      <PartnerCertificateModal
        isOpen={showCertPreview}
        onClose={() => setShowCertPreview(false)}
        partner={{
          fullName: partnerName,
          partnerCode: partnerCode,
        }}
      />
    </>
  );
}
