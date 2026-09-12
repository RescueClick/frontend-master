import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const LOAN_TYPE_FILTERS = [
  { id: "ALL", label: "All Banks" },
  { id: "PERSONAL", label: "Personal Loan" },
  { id: "BUSINESS", label: "Business Loan" },
  { id: "HOME", label: "Home Loan" },
  { id: "LAP", label: "LAP Loan" },
];

const getLoanTypeBadgeInfo = (loanType) => {
  const norm = String(loanType || "").trim().toUpperCase();
  if (norm.includes("PERSONAL")) {
    return {
      label: "Personal Loan",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      dotClass: "bg-blue-500",
    };
  }
  if (norm.includes("BUSINESS")) {
    return {
      label: "Business Loan",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500",
    };
  }
  if (norm.includes("HOME")) {
    const isSalaried = norm.includes("SALARIED");
    const isSelf = norm.includes("SELF");
    const suffix = isSalaried ? " (Salaried)" : isSelf ? " (Self-Employed)" : "";
    return {
      label: `Home Loan${suffix}`,
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      dotClass: "bg-purple-500",
    };
  }
  if (norm.includes("LAP")) {
    const isSalaried = norm.includes("SALARIED");
    const isSelf = norm.includes("SELF");
    const suffix = isSalaried ? " (Salaried)" : isSelf ? " (Self-Employed)" : "";
    return {
      label: `LAP${suffix}`,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      dotClass: "bg-amber-500",
    };
  }
  return {
    label: loanType || "General Loan",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    dotClass: "bg-slate-500",
  };
};

const Banks = () => {
  const [showPassword, setShowPassword] = useState({});
  const [showId, setShowId] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [logoErrors, setLogoErrors] = useState({});

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const fetchBanks = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError("");

      const { rsmToken } = getAuthData() || {};
      if (!rsmToken) {
        setError("Not authenticated as RSM");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${backendurl}/rsm/banks`, {
        headers: {
          Authorization: `Bearer ${rsmToken}`,
        },
      });

      const { rsmUser } = getAuthData() || {};
      const rsmType = String(rsmUser?.rsmType || "").trim().toUpperCase();

      const normalizeLoanType = (lt) => {
        const raw = String(lt || "").trim().toUpperCase();
        if (raw === "PERSONAL_LOAN") return "PERSONAL";
        if (raw === "BUSINESS_LOAN") return "BUSINESS";
        return raw;
      };

      const data = Array.isArray(response.data?.banks)
        ? response.data.banks
        : Array.isArray(response.data)
        ? response.data
        : [];

      const mapped = data.map((b, index) => ({
        _id: b._id || b.id || index,
        bankName: b.bankName || b.name || "Unnamed Bank",
        bankLogoUrl: b.bankLogoUrl || b.logoUrl || b.logo || "",
        portalLoginId: b.portalLoginId || b.loginId || "",
        portalPassword: b.portalPassword || b.password || "",
        loanType: b.loanType || "",
        portalLink: b.portalLink || b.link || "#",
        serviceablePincodes: Array.isArray(b.serviceablePincodes) ? b.serviceablePincodes : [],
        rsmTypes: Array.isArray(b.rsmTypes)
          ? b.rsmTypes
          : b.rsmTypes
          ? [b.rsmTypes]
          : [],
      }));

      // Fallback client filter if needed, matching backend rules
      const filtered = mapped.filter((bank) => {
        const lt = normalizeLoanType(bank.loanType);
        if (rsmType === "PERSONAL") return lt === "PERSONAL";
        if (rsmType === "BUSINESS_HOME") {
          return (
            lt === "BUSINESS" ||
            lt.startsWith("HOME_LOAN_") ||
            lt.startsWith("LAP_") ||
            lt === "LAP"
          );
        }
        return true;
      });

      setBanks(filtered);
      if (isRefresh) {
        toast.success("Bank details refreshed successfully!");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load banks for RSM";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const filteredBanks = useMemo(() => {
    const q = String(nameSearch || "").trim().toLowerCase();
    return banks.filter((b) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        const norm = String(b.loanType || "").toUpperCase();
        if (selectedCategory === "PERSONAL" && !norm.includes("PERSONAL")) return false;
        if (selectedCategory === "BUSINESS" && !norm.includes("BUSINESS")) return false;
        if (selectedCategory === "HOME" && !norm.includes("HOME")) return false;
        if (selectedCategory === "LAP" && !norm.includes("LAP")) return false;
      }
      // Text search filter
      if (!q) return true;
      const nameMatch = String(b.bankName || "").toLowerCase().includes(q);
      const loanTypeMatch = String(b.loanType || "").toLowerCase().includes(q);
      const loginIdMatch = String(b.portalLoginId || "").toLowerCase().includes(q);
      return nameMatch || loanTypeMatch || loginIdMatch;
    });
  }, [banks, nameSearch, selectedCategory]);

  const togglePassword = (id) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleId = (id) => {
    setShowId((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = async (text, label, key) => {
    if (!text || String(text).trim() === "") {
      toast.error(`No ${label} configured for this bank`);
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedKey(key);
      toast.success(`${label} copied to clipboard!`, { duration: 1800 });

      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
      toast.error(`Failed to copy ${label}`);
    }
  };

  const copyBothCredentials = (bank) => {
    const loginId = bank.portalLoginId || "N/A";
    const password = bank.portalPassword || "N/A";
    const portalLink = bank.portalLink || "N/A";

    const formatted = `Bank: ${bank.bankName}\nLoan Type: ${bank.loanType}\nPortal URL: ${portalLink}\nLogin ID: ${loginId}\nPassword: ${password}`;
    copyToClipboard(formatted, "Bank Credentials (ID & Password)", `${bank._id}-both`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-[100rem] mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    Lending Partner Access
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Direct Portal Logins
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    View official bank portals, secure Login IDs, and passwords for loan file submissions.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action & Total Counter */}
            <div className="flex items-center gap-3 self-start lg:self-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-right">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block">
                  Available Portals
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {banks.length} <span className="text-xs font-normal text-gray-500">Banks</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => fetchBanks(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-gray-700 border border-gray-200 shadow-sm transition active:scale-95 disabled:opacity-50"
                title="Refresh banks"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Search by bank name, loan type, or ID..."
                className="w-full rounded-xl border border-gray-200 bg-slate-50/60 py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
              {nameSearch && (
                <button
                  type="button"
                  onClick={() => setNameSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {LOAN_TYPE_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchBanks(true)}
              className="text-xs font-bold underline text-red-800 hover:text-red-950"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-24 bg-gray-100 rounded-xl" />
                <div className="h-9 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : banks.length === 0 ? (
          /* Empty State - No Banks Available */
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">No Banks Available</h2>
            <p className="text-sm text-gray-600 mt-1">
              No lending partner banks have been configured for your RSM profile yet.
            </p>
          </div>
        ) : filteredBanks.length === 0 ? (
          /* Empty State - No Search Results */
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center max-w-lg mx-auto">
            <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No matching banks found</h3>
            <p className="text-xs text-gray-500 mt-1">
              No banks match your current filters: &quot;{nameSearch}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setNameSearch("");
                setSelectedCategory("ALL");
              }}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Banks Grid */
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-medium text-gray-500">
                Showing <span className="font-semibold text-gray-800">{filteredBanks.length}</span> of{" "}
                <span className="font-semibold text-gray-800">{banks.length}</span> bank portals
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
              {filteredBanks.map((bank) => {
                const badge = getLoanTypeBadgeInfo(bank.loanType);
                const hasLogoError = logoErrors[bank._id];
                const isIdMasked = showId[bank._id] === true; // ID visible by default, true = masked
                const isPwVisible = showPassword[bank._id] === true; // Password hidden by default

                const idCopied = copiedKey === `${bank._id}-id`;
                const pwCopied = copiedKey === `${bank._id}-pw`;
                const bothCopied = copiedKey === `${bank._id}-both`;

                return (
                  <div
                    key={bank._id}
                    className="bg-white border border-gray-200/90 hover:border-emerald-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Bank Header: Logo + Name + Loan Type */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 shrink-0 rounded-xl border border-gray-200/80 bg-slate-50 flex items-center justify-center overflow-hidden p-1.5 shadow-2xs">
                          {bank.bankLogoUrl && !hasLogoError ? (
                            <img
                              src={bank.bankLogoUrl}
                              alt={bank.bankName}
                              onError={() =>
                                setLogoErrors((prev) => ({ ...prev, [bank._id]: true }))
                              }
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase">
                              {bank.bankName?.slice(0, 2) || <Building2 className="w-5 h-5 text-emerald-600" />}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                            {bank.bankName}
                          </h2>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="my-3.5 h-px bg-slate-100" />

                      {/* Credentials Container */}
                      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2.5">
                        {/* 1. Bank Login ID */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <User className="w-3 h-3 text-slate-400" />
                              Bank Login ID
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Username</span>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 transition shadow-2xs hover:border-slate-300">
                            <span className="font-mono text-xs font-bold text-slate-800 tracking-wide break-all select-all flex-1 min-w-0">
                              {isIdMasked
                                ? "••••••••"
                                : bank.portalLoginId || (
                                    <span className="text-slate-400 font-normal italic">
                                      Not Set
                                    </span>
                                  )}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              {bank.portalLoginId && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleId(bank._id)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                    title={isIdMasked ? "Show Login ID" : "Hide Login ID"}
                                  >
                                    {isIdMasked ? (
                                      <Eye className="w-3.5 h-3.5" />
                                    ) : (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyToClipboard(
                                        bank.portalLoginId,
                                        "Login ID",
                                        `${bank._id}-id`
                                      )
                                    }
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition ${
                                      idCopied
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    }`}
                                    title="Copy Login ID"
                                  >
                                    {idCopied ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Bank Password */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Bank Password
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Protected</span>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 transition shadow-2xs hover:border-slate-300">
                            <span
                              className={`font-mono text-xs font-bold tracking-wide break-all select-all flex-1 min-w-0 ${
                                isPwVisible
                                  ? "text-emerald-700"
                                  : "text-slate-500 tracking-widest"
                              }`}
                            >
                              {isPwVisible
                                ? bank.portalPassword || (
                                    <span className="text-slate-400 font-normal italic tracking-normal">
                                      Not Set
                                    </span>
                                  )
                                : bank.portalPassword
                                ? "••••••••••••"
                                : (
                                    <span className="text-slate-400 font-normal italic tracking-normal">
                                      Not Set
                                    </span>
                                  )}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              {bank.portalPassword && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => togglePassword(bank._id)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                    title={isPwVisible ? "Hide Password" : "Show Password"}
                                  >
                                    {isPwVisible ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyToClipboard(
                                        bank.portalPassword,
                                        "Password",
                                        `${bank._id}-pw`
                                      )
                                    }
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition ${
                                      pwCopied
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    }`}
                                    title="Copy Password"
                                  >
                                    {pwCopied ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick 1-Click Copy Both */}
                        {(bank.portalLoginId || bank.portalPassword) && (
                          <div className="pt-0.5 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => copyBothCredentials(bank)}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition ${
                                bothCopied
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                              }`}
                              title="Copy both Bank ID and Password together"
                            >
                              {bothCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Both Copied!</span>
                                </>
                              ) : (
                                <>
                                  <KeyRound className="w-3 h-3 text-slate-400" />
                                  <span>Copy Both Credentials</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Portal Link Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-500 font-medium truncate">
                        {bank.serviceablePincodes?.length > 0 ? (
                          <span>{bank.serviceablePincodes.length} Pincodes covered</span>
                        ) : (
                          <span>All India Coverage</span>
                        )}
                      </span>

                      {bank.portalLink && bank.portalLink !== "#" ? (
                        <a
                          href={bank.portalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 shrink-0"
                          title="Open official bank portal"
                        >
                          <span>Open Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No Portal Link</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Banks;
