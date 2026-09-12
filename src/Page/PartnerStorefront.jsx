import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Award,
  Building2,
  Banknote,
  Sparkles,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Lock,
  MapPin,
  Briefcase,
  Home,
  Store,
  Clock,
  BadgeCheck,
  PhoneCall,
  Mail,
  CheckCircle2,
  HelpCircle,
  FileText,
  AlertCircle,
  Percent,
  MessageCircle,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Phone,
  ArrowRight,
  Printer,
  Info,
} from "lucide-react";
import { backendurl } from "../feature/urldata";
import {
  fetchPublicPartnerInfo,
  setPartnerReferralSession,
  getPartnerReferralFromUrlOrSession,
} from "../feature/publicLoanReferral";
import {
  brandLogo,
  COMPANY_NAME,
  COMPANY_NAME_LEGAL,
  SUPPORT_EMAIL,
  CONTACT_EMAIL,
  whatsAppShareUrl,
} from "../config/branding";

export const STORE_LOAN_PRODUCTS = [
  {
    id: "personal-loan",
    slug: "personal-loan",
    title: "Personal Loan",
    category: "personal",
    employment: "Salaried Employees (Govt / MNC / Pvt Ltd)",
    path: "/partner/application/personal-loan",
    badge: "Upto ₹25 Lakhs",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
    pillColor: "emerald",
    interest: "From 10.5% p.a.",
    tenure: "12 to 60 Months",
    minIncome: "₹15,000 / month",
    minAge: "21 – 58 Years",
    minCibil: "700+ Preferred",
    processingTime: "24 to 72 Hours",
    icon: UserCheck,
    tagline: "Instant collateral-free funds for salaried professionals",
    summary:
      "Instant funds with minimal documentation and fast bank disbursement. Perfect for medical emergencies, travel, weddings, or debt consolidation.",
    highlights: [
      "Zero collateral or asset mortgage required",
      "Direct disbursement to your salary bank account",
      "Minimal documentation & quick evaluation in 24 to 72 hours",
    ],
    eligibility: [
      { label: "Age Limit", value: "21 to 58 Years" },
      { label: "Minimum Monthly Salary", value: "₹15,000 in bank account" },
      { label: "Employment Type", value: "Salaried (Min 6 months experience)" },
      { label: "Credit Score (CIBIL)", value: "700 and above preferred" },
    ],
    documents: [
      "PAN Card & Aadhaar Card (Linked with Mobile)",
      "Last 3 Months Salary Slips",
      "Last 6 Months Bank Statement (Salary Account PDF)",
      "Current Residence Proof (Electricity Bill / Rent Agreement)",
    ],
  },
  {
    id: "business-loan",
    slug: "business-loan",
    title: "Business Loan",
    category: "business",
    employment: "Self-Employed / MSME / Retailers / Traders",
    path: "/partner/application/business-loan",
    badge: "Upto ₹2 Crores",
    badgeBg: "bg-blue-50 text-blue-800 border-blue-300",
    pillColor: "blue",
    interest: "From 13.5% p.a.",
    tenure: "12 to 84 Months",
    minIncome: "₹30 Lakhs+ Annual Turnover",
    minAge: "21 – 65 Years",
    minCibil: "700+ Preferred",
    processingTime: "24 to 72 Hours",
    icon: Briefcase,
    tagline: "Unsecured business growth capital for MSMEs & Retailers",
    summary:
      "Collateral-free business capital for growth, inventory purchase, equipment financing & working capital for retailers, traders, and manufacturers.",
    highlights: [
      "100% unsecured business loan — no property pledge",
      "High sanction limit evaluated on business banking volume",
      "Comfortable repayment terms with customized business EMIs",
    ],
    eligibility: [
      { label: "Age Limit", value: "21 to 65 Years" },
      { label: "Minimum Annual Turnover", value: "₹30 Lakhs+ in Bank" },
      { label: "Business Vintage", value: "Minimum 1 to 2 Years in operations" },
      { label: "Credit Score (CIBIL)", value: "700 and above preferred" },
    ],
    documents: [
      "PAN Card & Aadhaar Card of Proprietor / Partners / Directors",
      "Business Proof (GST Certificate / Udyam / Gumasta / Trade License)",
      "Last 12 Months Current Account Bank Statement",
      "Last 2 Years ITR with Computation, Balance Sheet & P&L (if applicable)",
    ],
  },
  {
    id: "home-loan-salaried",
    slug: "home-loan-salaried",
    title: "Home Loan (Salaried)",
    category: "home",
    employment: "Confirmed Salaried Professionals",
    path: "/partner/application/home-loan-salaried",
    badge: "Upto ₹5 Crores",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
    pillColor: "amber",
    interest: "From 8.35% p.a.",
    tenure: "Upto 30 Years",
    minIncome: "₹25,000 / month",
    minAge: "21 – 60 Years",
    minCibil: "700+ Preferred",
    processingTime: "3 to 5 Days",
    icon: Home,
    tagline: "Lowest interest home financing for ready flats & construction",
    summary:
      "Lowest interest home financing for ready flats, apartments, under-construction projects, home construction & plot purchase.",
    highlights: [
      "Up to 90% of property cost funded by leading banks",
      "Longest 30-year tenure to ensure lowest monthly EMIs",
      "Substantial tax deductions under Section 80C & Section 24(b)",
    ],
    eligibility: [
      { label: "Age Limit", value: "21 to 60 Years" },
      { label: "Minimum Monthly Salary", value: "₹25,000 net monthly salary" },
      { label: "Work Experience", value: "Total 2+ years, min 1 yr in current co." },
      { label: "Credit Score (CIBIL)", value: "700+ for best interest rate" },
    ],
    documents: [
      "PAN Card & Aadhaar Card",
      "Last 3 Months Salary Slips & Latest Form 16",
      "Last 6 Months Salary Bank Account Statement",
      "Property Papers (Allotment Letter / Agreement to Sale / Title Deeds)",
    ],
  },
  {
    id: "home-loan-self-employed",
    slug: "home-loan-self-employed",
    title: "Home Loan (Self-Employed)",
    category: "home",
    employment: "Business Owners, Traders & Professionals",
    path: "/partner/application/home-loan-self-employed",
    badge: "Upto ₹5 Crores",
    badgeBg: "bg-orange-50 text-orange-800 border-orange-300",
    pillColor: "orange",
    interest: "From 8.60% p.a.",
    tenure: "Upto 25 Years",
    minIncome: "₹3 Lakhs+ Annual Net Income",
    minAge: "23 – 65 Years",
    minCibil: "700+ Preferred",
    processingTime: "4 to 7 Days",
    icon: Store,
    tagline: "Customized housing loan for business owners & contractors",
    summary:
      "Customized housing loan solutions for business owners, professionals (CA/Doctors), traders, and contractors with flexible income assessment.",
    highlights: [
      "Surrogate & banking gross-turnover assessment programs",
      "Financing for self-construction, plot purchase & renovation",
      "Co-applicant income pooling to maximize sanction eligibility",
    ],
    eligibility: [
      { label: "Age Limit", value: "23 to 65 Years" },
      { label: "Minimum Net Profit / ITR", value: "₹3 Lakhs+ per annum" },
      { label: "Business Continuity", value: "Minimum 3 years active business" },
      { label: "Credit Score (CIBIL)", value: "700 and above preferred" },
    ],
    documents: [
      "PAN & Aadhaar Card of Applicant & Co-Applicants",
      "Last 2–3 Years ITR with Computation, Balance Sheet & P&L",
      "Last 12 Months Current & Savings Bank Account Statements",
      "Property Documents, Approved Sanction Plan & Chain Title Deeds",
    ],
  },
  {
    id: "lap-loan-salaried",
    slug: "lap-loan-salaried",
    title: "Loan Against Property (Salaried)",
    category: "lap",
    employment: "Salaried Property Owners",
    path: "/partner/application/lap-loan-salaried",
    badge: "Upto ₹10 Crores",
    badgeBg: "bg-purple-50 text-purple-800 border-purple-300",
    pillColor: "purple",
    interest: "From 9.25% p.a.",
    tenure: "Upto 20 Years",
    minIncome: "₹35,000 / month",
    minAge: "23 – 60 Years",
    minCibil: "700+ Preferred",
    processingTime: "5 to 7 Days",
    icon: Building2,
    tagline: "High-value funding pledging owned residential or commercial asset",
    summary:
      "Unlock the high equity value of your residential or commercial property at substantially lower interest rates than unsecured personal loans.",
    highlights: [
      "High LTV: Unlock up to 70–75% of current market value",
      "Lower EMI burden with extended repayment up to 20 years",
      "Property remains in your complete custody, possession & use",
    ],
    eligibility: [
      { label: "Age Limit", value: "23 to 60 Years" },
      { label: "Minimum Monthly Salary", value: "₹35,000 net monthly credit" },
      { label: "Property Type", value: "Clear title Residential / Commercial / Industrial" },
      { label: "Credit Score (CIBIL)", value: "700 and above preferred" },
    ],
    documents: [
      "PAN Card & Aadhaar Card",
      "Last 3 Months Salary Slips & Form 16",
      "Last 6 Months Salary Bank Account Statement",
      "Registered Property Sale Deed, Sanction Plan, Tax Receipts & OC",
    ],
  },
  {
    id: "lap-loan-self-employed",
    slug: "lap-loan-self-employed",
    title: "Loan Against Property (Self-Employed)",
    category: "lap",
    employment: "Entrepreneurs, Directors & Firm Owners",
    path: "/partner/application/lap-loan-self-employed",
    badge: "Upto ₹10 Crores",
    badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-300",
    pillColor: "indigo",
    interest: "From 9.50% p.a.",
    tenure: "Upto 20 Years",
    minIncome: "₹5 Lakhs+ Annual Net Profit",
    minAge: "23 – 65 Years",
    minCibil: "700+ Preferred",
    processingTime: "5 to 7 Days",
    icon: Building2,
    tagline: "Large capital injection for business scaling & debt reduction",
    summary:
      "Large-ticket business liquidity against residential, commercial, or industrial property to fund business expansion or lower existing high-cost debts.",
    highlights: [
      "Large capital sanction up to ₹10 Crores with flexible tenure",
      "Tax benefits on interest paid when utilized for business growth",
      "Simple legal & valuation verification with maximum loan-to-value",
    ],
    eligibility: [
      { label: "Age Limit", value: "23 to 65 Years" },
      { label: "Minimum Net Profit", value: "₹5 Lakhs+ per annum" },
      { label: "Business Continuity", value: "Minimum 3 years active business" },
      { label: "Credit Score (CIBIL)", value: "700 and above preferred" },
    ],
    documents: [
      "PAN & Aadhaar Card of Entity and Key Directors/Partners",
      "Last 3 Years ITR, Audited Financials, Balance Sheet & P&L",
      "Last 12 Months Current Bank Statements for all active accounts",
      "Original Title Deeds of Collateral Property, Non-Encumbrance Certificate & Tax Receipts",
    ],
  },
];

export default function PartnerStorefront() {
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Extract partner code from URL path params (e.g. /advisor/:partnerCode, or WeRize slug from pathname)
  const rawParam = params.partnerCode || params.slug || location?.pathname || "";
  const queryRef =
    searchParams.get("ref") ||
    searchParams.get("partner") ||
    searchParams.get("partnerCode") ||
    searchParams.get("code") ||
    "";

  // Parse partner code (e.g. from "loan-saving-agent-pune-Salman-Attar-PT-KPMEL42Z" or "PT-KPMEL42Z")
  const partnerCodeCandidate = useMemo(() => {
    if (queryRef) return queryRef.trim();
    if (rawParam) {
      const ptMatch = rawParam.match(/(?:PT|TLP)-[\w-]+/i) || rawParam.match(/TLP\d+/i);
      if (ptMatch) return ptMatch[0];
      const clean = rawParam.replace(/^\//, "").trim();
      if (clean && !clean.includes("/")) return clean;
    }
    return getPartnerReferralFromUrlOrSession() || "PT-PARTNER";
  }, [rawParam, queryRef]);

  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  // Keep track of which loan card has its eligibility details expanded
  const [expandedCardId, setExpandedCardId] = useState("personal-loan");

  useEffect(() => {
    let isCancelled = false;

    async function loadPartner() {
      try {
        setLoading(true);
        if (partnerCodeCandidate) {
          setPartnerReferralSession(partnerCodeCandidate);

          const info = await fetchPublicPartnerInfo(partnerCodeCandidate);
          if (!isCancelled && info) {
            setPartner(info);
            return;
          }
        }

        if (!isCancelled) {
          setPartner({
            fullName: "Authorized Financial Advisor",
            partnerCode: partnerCodeCandidate || "PT-PARTNER",
            region: "Maharashtra, India",
            partnerLevel: "BRONZE",
            isCertified: true,
          });
        }
      } catch (err) {
        console.warn("Error loading storefront partner:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadPartner();

    return () => {
      isCancelled = true;
    };
  }, [partnerCodeCandidate]);

  // Keep only first name and last name, omitting middle name
  const partnerName = (() => {
    if (partner?.firstName && partner?.lastName) {
      return `${partner.firstName.trim()} ${partner.lastName.trim()}`;
    }
    const raw = (
      partner?.fullName ||
      partner?.name ||
      [partner?.firstName, partner?.lastName].filter(Boolean).join(" ") ||
      ""
    ).trim();
    if (!raw) {
      if (partner?.firstName) return partner.firstName.trim();
      return "Authorized Financial Advisor";
    }
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length > 2) {
      // First name and last name only, omitting middle name(s)
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts.join(" ");
  })();

  const partnerCode = partner?.partnerCode || partnerCodeCandidate || "PT-PARTNER";
  const employeeId = partner?.employeeId || null;
  const locationText = partner?.region || "Maharashtra, India";
  const pincodeText = partner?.pincode ? ` - ${partner?.pincode}` : "";
  const partnerLevel = (partner?.partnerLevel || "BRONZE").toUpperCase();
  const rawPhone = partner?.rawPhone || "";
  const currentYear = new Date().getFullYear();

  const photo = useMemo(() => {
    const raw = partner?.selfie || partner?.photo || null;
    if (!raw) return null;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanPath = raw.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${backendurl.replace(/\/$/, "")}/${cleanPath}`;
  }, [partner]);

  const initials = useMemo(() => {
    if (!partnerName) return "CP";
    const parts = partnerName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [partnerName]);

  useEffect(() => {
    if (partnerName) {
      document.title = `${partnerName} — Certified Financial Advisor | ${COMPANY_NAME}`;
    }
  }, [partnerName]);

  const currentStoreUrl = window.location.href;

  // Opens the application in a new tab/page with the referral code attached
  const handleApplyNow = (productPath) => {
    const targetUrl = `${productPath}?ref=${encodeURIComponent(partnerCode)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyStoreLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentStoreUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Direct Customer WhatsApp Chat with the Advisor
  const handleChatWithAdvisor = () => {
    const message = [
      `Hello *${partnerName}*,`,
      ``,
      `I am viewing your verified DhanSource Loan Advisor profile (*Partner ID: ${partnerCode}*).`,
      `I would like a free financial consultation for a loan application.`,
      `Please let me know how we can proceed.`,
    ].join("\n");

    if (rawPhone && rawPhone.length >= 10) {
      const cleanPhone = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone.slice(-10)}`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(whatsAppShareUrl(message), "_blank", "noopener,noreferrer");
    }
  };

  const handleCallAdvisor = () => {
    if (rawPhone) {
      window.location.href = `tel:${rawPhone}`;
    }
  };

  const handleShareStorefront = () => {
    const shareText = [
      `Hello! View my verified DhanSource Financial Advisor profile:`,
      `*${partnerName}* (Partner ID: ${partnerCode})`,
      `${locationText}`,
      ``,
      `Explore Instant Personal Loans, Business Loans, Home Loans & LAP with Zero Advance Fees:`,
      `${currentStoreUrl}`,
    ].join("\n");

    if (navigator.share) {
      navigator
        .share({
          title: `${partnerName} — Certified Financial Advisor`,
          text: shareText,
          url: currentStoreUrl,
        })
        .catch(() => {});
    } else {
      handleCopyStoreLink();
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const toggleCardEligibility = (cardId) => {
    setExpandedCardId((prev) => (prev === cardId ? null : cardId));
  };

  // Filtered loan products list
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return STORE_LOAN_PRODUCTS;
    return STORE_LOAN_PRODUCTS.filter((prod) => prod.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* 1. TOP ANNOUNCEMENT RIBBON */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white py-2 px-4 shadow-sm border-b border-teal-900/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 animate-pulse" />
            <span className="text-xs sm:text-sm font-black tracking-tight text-white">
              Get free financial consultation for Loans &amp; Financial Products with {partnerName}.
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-semibold text-teal-100 bg-white/10 px-3 py-0.5 rounded-full border border-white/20">
              Personal • Business • Home • LAP
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 sm:pt-7 space-y-6">
        {/* 2. OFFICIAL BRAND & PORTAL HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={COMPANY_NAME}
                className="h-8 sm:h-9 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-black text-teal-800">{COMPANY_NAME}</span>
            )}
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                Certified Financial Advisor Digital Store
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Authorized by {COMPANY_NAME_LEGAL}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Direct File Assignment
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              256-Bit SSL Encrypted
            </span>
          </div>
        </div>

        {/* 3. PARTNER HERO SHOWCASE CARD (AUTHENTIC DATA, NO FAKE STATS) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-slate-950 text-white p-5 sm:p-8 shadow-2xl border border-teal-700/60">
          {/* Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Partner Profile Details (Photo removed per instructions) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-400/20 text-teal-200 border border-teal-300/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  Verified Channel Partner
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                  ID: {partnerCode}
                </span>
                {employeeId && (
                  <span className="text-xs font-mono text-teal-200 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                    Emp: {employeeId}
                  </span>
                )}
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  {partnerLevel} Tier
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {partnerName}
              </h1>

              <p className="text-xs sm:text-sm font-bold text-teal-300">
                Certified {COMPANY_NAME} Digital Loan Advisor
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-teal-100/80 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  {locationText}{pincodeText}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-300" />
                  {COMPANY_NAME_LEGAL}
                </span>
              </div>
            </div>

            {/* Right: Actions (Call, Scroll to Certificate, Share) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-shrink-0">
              {rawPhone && (
                <button
                  type="button"
                  onClick={handleCallAdvisor}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600/60 hover:bg-teal-600 text-white text-xs font-bold border border-teal-400/40 transition hover:scale-[1.02] active:scale-95"
                >
                  <Phone className="w-4 h-4 text-amber-300" />
                  <span>Call Advisor</span>
                </button>
              )}

              <a
                href="#official-certificate"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md transition hover:scale-[1.02] active:scale-95"
              >
                <Award className="w-4 h-4 text-amber-950" />
                <span>View Certificate ↓</span>
              </a>

              <button
                type="button"
                onClick={handleShareStorefront}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 border border-white/20 text-xs font-bold transition"
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Genuine Partner Guarantees (No fake stats) */}
          <div className="relative z-10 pt-5 mt-6 border-t border-teal-800/80">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-teal-300">
                Official DhanSource Channel Partner Guarantees
              </p>
              <button
                type="button"
                onClick={handleCopyStoreLink}
                className="text-[11px] font-bold text-teal-200 hover:text-white flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Advisor Link"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-sm sm:text-base font-black text-white block">Direct Assignment</span>
                <span className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">
                  Mapped to {partnerName.split(" ")[0]}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-sm sm:text-base font-black text-amber-300 block">Zero Advance Fees</span>
                <span className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">
                  No Upfront Charges Ever
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-sm sm:text-base font-black text-white block">Direct Disbursal</span>
                <span className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">
                  Credited Directly to Your Bank
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-sm sm:text-base font-black text-emerald-300 block">100% Digital</span>
                <span className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">
                  Bank-Grade Encryption
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OPEN DIRECTOR-SIGNED AUTHORIZATION CERTIFICATE (SHOWN DIRECTLY ON PAGE) */}
        <div id="official-certificate" className="bg-white rounded-3xl p-4 sm:p-7 shadow-sm border border-slate-200 scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                <Award className="w-4 h-4 text-amber-600" />
                Director-Signed Authorization Certificate
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Official Partner Verification Record
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Officially authorized and recorded in the {COMPANY_NAME} partner registry. Verification is public and open for all applicants.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrintCertificate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition border border-slate-200 self-start sm:self-auto shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Official Certificate</span>
            </button>
          </div>

          {/* Certificate Body Container */}
          <div className="overflow-x-auto pb-2">
            <div
              className="relative mx-auto w-full min-w-[320px] max-w-[760px] bg-white border-[10px] border-teal-700 p-5 sm:p-8 rounded-xl shadow-lg overflow-hidden select-none"
              style={{ minHeight: "460px" }}
            >
              {/* Corner Decorative Triangles */}
              <div className="absolute top-2 left-2 w-0 h-0 border-l-[28px] border-l-teal-700 border-b-[28px] border-b-transparent"></div>
              <div className="absolute top-2 right-2 w-0 h-0 border-r-[28px] border-r-teal-700 border-b-[28px] border-b-transparent"></div>
              <div className="absolute bottom-2 left-2 w-0 h-0 border-l-[28px] border-l-teal-700 border-t-[28px] border-t-transparent"></div>
              <div className="absolute bottom-2 right-2 w-0 h-0 border-r-[28px] border-r-teal-700 border-t-[28px] border-t-transparent"></div>

              {/* Inner Gold Thin Border */}
              <div className="border-2 border-amber-300/80 p-4 sm:p-6 rounded-lg bg-gradient-to-b from-amber-50/20 via-white to-teal-50/20">
                {/* Header / Logo */}
                <div className="text-center mb-3">
                  <div className="inline-flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-800">
                      Dhan<span className="text-amber-500">Source</span> Capital
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wider uppercase">
                    {COMPANY_NAME_LEGAL}
                  </p>
                </div>

                {/* Certificate Title */}
                <div className="text-center my-3">
                  <span className="inline-block px-4 py-1 bg-teal-50 border border-teal-300 text-teal-900 text-xs sm:text-sm font-black tracking-[2px] uppercase rounded-full shadow-sm">
                    CERTIFIED CHANNEL PARTNER
                  </span>
                </div>

                {/* Recipient Name */}
                <div className="text-center my-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                    This Official Certificate is Proudly Awarded To
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-teal-800 font-serif italic tracking-wide mt-1 break-words px-2">
                    {partnerName}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    Partner ID: <span className="font-mono font-bold text-teal-700">{partnerCode}</span>
                    {partner?.region && <span className="text-slate-400">• {partner.region}</span>}
                  </div>
                </div>

                {/* Authorization Text */}
                <p className="text-center text-xs sm:text-sm italic leading-relaxed text-slate-700 max-w-lg mx-auto my-3">
                  You are hereby authorized as an official Channel Partner to promote, process,
                  and assist applicants for all Financial Products and Services offered by{" "}
                  <span className="font-bold text-slate-900">{COMPANY_NAME_LEGAL}</span> across India.
                </p>

                {/* Signatures & Seal */}
                <div className="grid grid-cols-3 items-end pt-6 sm:pt-8 mt-5 border-t border-slate-200 gap-2">
                  {/* Left Signature: Anil Bagad (CEO & Director) */}
                  <div className="text-center">
                    <div className="h-12 flex items-center justify-center mb-1">
                      <span className="font-serif italic font-bold text-slate-800 text-base sm:text-lg tracking-wider">
                        Anil Bagad
                      </span>
                    </div>
                    <div className="w-24 sm:w-32 border-b-2 border-slate-700 mx-auto mb-1"></div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-full px-1">Anil Bagad</div>
                    <div className="text-[10px] sm:text-xs text-teal-700 font-semibold">
                      CEO &amp; Director
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
        </div>

        {/* 5. INTERACTIVE LOAN PRODUCTS CATALOG */}
        <div id="loan-products" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Select Any Loan Product to View Eligibility &amp; Apply
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Loan Products &amp; Eligibility
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Click on any card to view detailed <strong>Age, Income, CIBIL &amp; Required Documents</strong>. Click <strong>Apply Now</strong> to open the digital application in a new tab.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Products (6)" },
                { id: "personal", label: "Personal Loan" },
                { id: "business", label: "Business Loan" },
                { id: "home", label: "Home Loan" },
                { id: "lap", label: "LAP" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedCategory === tab.id
                      ? "bg-teal-800 text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Interactive Loan Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => {
              const Icon = prod.icon;
              const isExpanded = expandedCardId === prod.id;

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border ${
                    isExpanded ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200 hover:border-teal-300"
                  }`}
                >
                  <div>
                    {/* Header: Icon + Category + Badge */}
                    <div
                      className="flex items-start justify-between gap-2 mb-3 cursor-pointer"
                      onClick={() => toggleCardEligibility(prod.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 hover:text-teal-700 transition-colors">
                            {prod.title}
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {prod.employment}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded border ${prod.badgeBg}`}>
                        {prod.badge}
                      </span>
                    </div>

                    <p
                      className="text-xs text-slate-600 mb-3 leading-relaxed cursor-pointer"
                      onClick={() => toggleCardEligibility(prod.id)}
                    >
                      {prod.summary}
                    </p>

                    {/* Quick Specs Grid */}
                    <div
                      className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 mb-3 text-[11px] cursor-pointer"
                      onClick={() => toggleCardEligibility(prod.id)}
                    >
                      <div>
                        <span className="text-slate-500 block text-[10px]">Interest Rate:</span>
                        <span className="font-extrabold text-teal-800">{prod.interest}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Tenure:</span>
                        <span className="font-extrabold text-slate-800">{prod.tenure}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Min Income:</span>
                        <span className="font-semibold text-slate-700">{prod.minIncome}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Turnaround:</span>
                        <span className="font-bold text-emerald-700">{prod.processingTime}</span>
                      </div>
                    </div>

                    {/* Interactive Toggle for Eligibility & Documents */}
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => toggleCardEligibility(prod.id)}
                        className="w-full flex items-center justify-between py-1.5 px-2.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-teal-600" />
                          <span>{isExpanded ? "Hide Eligibility & Documents" : "View Eligibility & Required Documents"}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-teal-700 rotate-180 transition-transform" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-teal-700 transition-transform" />
                        )}
                      </button>

                      {/* Expanded Eligibility Breakdown Drawer */}
                      {isExpanded && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-fadeIn">
                          {/* Eligibility Criteria */}
                          <div>
                            <p className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Key Eligibility Criteria:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {prod.eligibility.map((item, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/80">
                                  <span className="text-[10px] text-slate-500 block">{item.label}</span>
                                  <span className="font-bold text-slate-900">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Required Documents */}
                          <div>
                            <p className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-teal-600" />
                              Required Documents:
                            </p>
                            <ul className="space-y-1">
                              {prod.documents.map((doc, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-slate-700 text-[11px] leading-tight">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                  <span>{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Highlights */}
                          <div className="border-t border-slate-200/70 pt-2">
                            <ul className="space-y-1">
                              {prod.highlights.map((h, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                  <span className="text-teal-600 font-bold">•</span>
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply Now Button (Opens designated loan form in a NEW TAB with partnerCode) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleApplyNow(prod.path)}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 group transform active:scale-95"
                    >
                      <span>Apply for {prod.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Opens in new tab • Ref: <span className="font-mono font-bold text-slate-600">{partnerCode}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. INSTANT FINANCIAL ASSISTANCE BANNER */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-bold border border-teal-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Need Help Choosing the Right Product?
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
              Connect Directly with {partnerName}
            </h3>
            <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl">
              Get Personal Loan up to ₹25 Lakhs, Business Loan up to ₹2 Crores, or Home Loans up to ₹5 Crores with zero upfront fees and complete guidance.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-teal-200 pt-1">
              <span>✓ Direct bank disbursement</span>
              <span>✓ Zero advance fee policy</span>
              <span>✓ Salaried &amp; Self-Employed</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => handleApplyNow("/partner/application/personal-loan")}
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition transform hover:scale-[1.02] active:scale-95 text-center"
            >
              Apply Personal Loan →
            </button>
            <button
              type="button"
              onClick={() => handleApplyNow("/partner/application/business-loan")}
              className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm shadow-md transition transform hover:scale-[1.02] active:scale-95 text-center"
            >
              Apply Business Loan →
            </button>
          </div>
        </div>

        {/* 7. ABOUT PARTNER – CERTIFIED FINANCIAL ADVISOR (BIO & LOCAL PRESENCE) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Certified Financial Advisor Profile
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                About {partnerName} – Certified {COMPANY_NAME} Advisor
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 self-start sm:self-auto">
              Partner ID: {partnerCode}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <strong>{partnerName}</strong> is an Authorized and Certified {COMPANY_NAME} Loan Advisor based in <strong>{locationText}</strong>, helping salaried employees, business owners, and families navigate credit options safely. As an official channel partner, {partnerName} facilitates Instant Personal Loans, Easy Business Loans, Home Loans, and Loan Against Property (LAP) through India's premier scheduled commercial banks and RBI-registered NBFCs.
          </p>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Whether you need emergency personal funds, business working capital, or lowest interest home loan financing, {partnerName} provides end-to-end guidance tailored to your income profile, ensuring maximum loan sanction with zero confusion and zero upfront fees.
          </p>

          {/* Why Choose a Certified Partner Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-3.5">
              Why Work with a Certified {COMPANY_NAME} Partner?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Certified &amp; Background Verified</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Certified by {COMPANY_NAME_LEGAL} for honest, transparent loan facilitation with zero advance fees.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Local Presence &amp; Fast Follow-up</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Local presence in {locationText} with dedicated bank coordination for faster processing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Step-by-Step Dedicated Support</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {partnerName} tracks your file from digital submission to final bank disbursement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Frequently Asked Questions (FAQs)
            </h4>
            <div className="space-y-2.5">
              <details className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 group cursor-pointer">
                <summary className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Why should I apply through {partnerName} instead of directly at a bank?</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <p className="mt-2 text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                  When you apply directly to a single bank, you are limited to their specific policy. {partnerName} evaluates your profile against multiple partner banks to secure the lowest interest rate, highest loan amount, and fastest approval with complete digital convenience.
                </p>
              </details>

              <details className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 group cursor-pointer">
                <summary className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Are there any advance fees or registration charges?</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <p className="mt-2 text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                  <strong>NO.</strong> {COMPANY_NAME} and its authorized partners operate on a strict Zero Advance Fees policy. You should never pay cash or advance file charges to anyone. Official bank processing fees are deducted directly by the lender upon disbursement.
                </p>
              </details>

              <details className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 group cursor-pointer">
                <summary className="font-bold text-slate-900 flex items-center justify-between">
                  <span>How long does the digital loan sanction process take?</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <p className="mt-2 text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                  Personal Loans and Business Loans are evaluated within 24 to 72 hours. Home Loans and LAP typically take 3 to 7 working days depending on property legal and technical verifications.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* 8. 5-STEP PROCESS FLOW */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Hassle-Free Experience
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                5-Step Digital Loan Evaluation &amp; Disbursal
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              100% Digital &amp; Encrypted
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {[
              {
                step: "1",
                title: "Choose Loan",
                desc: "Select product & submit online details",
                icon: UserCheck,
              },
              {
                step: "2",
                title: "Upload KYC",
                desc: "Aadhaar, PAN & bank statement",
                icon: FileText,
              },
              {
                step: "3",
                title: "Bank Match",
                desc: "Best rate matched across partner lenders",
                icon: Building2,
              },
              {
                step: "4",
                title: "Sanction",
                desc: "Official digital loan sanction letter",
                icon: Award,
              },
              {
                step: "5",
                title: "Disbursal",
                desc: "Direct credit into your bank account",
                icon: Banknote,
              },
            ].map((item, idx) => {
              const StepIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <StepIcon className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 9. FOOTER WITH HEAD OFFICE & SUPPORT */}
        <div className="text-center text-xs text-slate-500 space-y-2 pt-4 border-t border-slate-200">
          <p className="font-semibold text-slate-700">
            {COMPANY_NAME_LEGAL} • Authorized Financial Channel Partner Portal
          </p>
          <p>
            Office No - 31, C Wing, Ashoka Nagar, Kharadi, Pune, Maharashtra 411014
          </p>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} {COMPANY_NAME}. All loans subject to underwriting by partner banks and NBFCs.
          </p>
        </div>
      </div>
    </div>
  );
}
