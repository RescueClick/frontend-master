import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  ImagePlus,
  KeyRound,
  Lock,
  Trash2,
} from "lucide-react";

import { getAuthData } from "../../../utils/localStorage";
import {
  createBank,
  deleteBank,
  fetchAdminBanks,
} from "../../../feature/thunks/adminThunks";


const loanTypeOptions = [
  { value: "PERSONAL", label: "Personal Loan" },
  { value: "BUSINESS", label: "Business Loan" },
  { value: "HOME_LOAN_SALARIED", label: "Home Loan (Salaried)" },
  { value: "HOME_LOAN_SELF_EMPLOYED", label: "Home Loan (Self Employed)" },
];

const rsmTypeOptions = [
  { value: "PERSONAL", label: "Personal Loan RSM" },
  { value: "BUSINESS_HOME", label: "Business & Home Loan RSM" },
];

const maskText = (text) => {
  if (!text || typeof text !== "string") return "";
  return "*".repeat(text.length);
};

const Banks = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("add");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const [bank, setBank] = useState({
    name: "",
    logo: null,
    loanType: "",
    rsmType: "",
    loginId: "",
    password: "",
    link: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loanTypeSearch, setLoanTypeSearch] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [showPassword, setShowPassword] = useState({});
  const [showId, setShowId] = useState({});

  const { data: banks = [], loading: banksLoading, error: banksError } = useSelector(
    (state) => state.admin?.fetchBanksData || { data: [], loading: false, error: null }
  );

  const adminToken = getAuthData()?.adminToken;

  useEffect(() => {
    dispatch(fetchAdminBanks());
  }, [dispatch]);

  const filteredBanks = useMemo(() => {
    const q = String(loanTypeSearch || "").trim().toUpperCase();
    const list = Array.isArray(banks) ? banks : [];
    const active = list.filter((b) => b?.isActive !== false);
    if (!q) return active;
    return active.filter((b) => String(b?.loanType || "").toUpperCase().includes(q));
  }, [banks, loanTypeSearch]);

  const copyText = (text) => {
    navigator.clipboard.writeText(text || "");
    setToast({ visible: true, message: "Copied to clipboard", type: "success" });
  };

  const togglePw = (id) => setShowPassword((p) => ({ ...p, [id]: !p[id] }));
  const toggleId = (id) => setShowId((p) => ({ ...p, [id]: !p[id] }));

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "bankLogo") {
      setBank((prev) => ({ ...prev, logo: files?.[0] || null }));
      return;
    }
    setBank((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setBank({
      name: "",
      logo: null,
      loanType: "",
      rsmType: "",
      loginId: "",
      password: "",
      link: "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowAddPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!bank.name || !bank.loanType || !bank.rsmType || !bank.loginId || !bank.password || !bank.link) {
      setToast({ visible: true, message: "Please fill all required fields.", type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("bankName", bank.name);
      if (bank.logo) formData.append("bankLogo", bank.logo);
      formData.append("loanType", bank.loanType);
      formData.append("rsmTypes", bank.rsmType);
      formData.append("portalLoginId", bank.loginId);
      formData.append("portalPassword", bank.password);
      formData.append("portalLink", bank.link);

      await dispatch(createBank(formData)).unwrap();
      setToast({ visible: true, message: "Bank added successfully.", type: "success" });
      resetForm();
      setActiveTab("list");
      dispatch(fetchAdminBanks());
    } catch (err) {
      setToast({ visible: true, message: err?.toString?.() || "Failed to add bank.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b) => {
    const bankId = b?._id || b?.id;
    if (!bankId) return;

    const ok = window.confirm("Delete this bank? RSMs will no longer see it.");
    if (!ok) return;

    try {
      await dispatch(deleteBank(bankId)).unwrap();
      setToast({ visible: true, message: "Bank deleted.", type: "success" });
      dispatch(fetchAdminBanks());
    } catch (err) {
      setToast({ visible: true, message: err?.toString?.() || "Failed to delete bank.", type: "error" });
    }
  };

  return (
    <div className="-mx-6 -mt-6 flex h-[calc(100dvh-6.25rem)] max-h-[calc(100dvh-6.25rem)] min-h-0 flex-col gap-3 px-6 pb-6 pt-0">
      <div className="mx-auto flex min-h-0 w-full max-w-[100rem] flex-1 flex-col gap-3">
        {/* Top bar: fixed height, does not scroll with list */}
        <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Bank Master</p>
            <p className="text-xs text-gray-500 mt-0.5">Add and manage banks</p>
          </div>

          <div className="inline-flex w-full shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "add" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
              }`}
            >
              Add Bank
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "list" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
              }`}
            >
              Banks List
              <span className={`ml-2 text-xs font-bold ${activeTab === "list" ? "text-emerald-50" : "text-gray-500"}`}>
                ({filteredBanks.length})
              </span>
            </button>
          </div>
        </div>

        {/* Content card: list scrolls inside; add form fits without page scroll */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {activeTab === "add" ? (
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* Scrollable body — keeps form inside the card; footer stays visible */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
                <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-gray-900">Add new bank</h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Required fields are marked with <span className="font-semibold text-red-500">*</span>
                  </p>
                </div>

                {/* Bank information */}
                <section className="overflow-hidden rounded-xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white to-white p-3 shadow-sm ring-1 ring-emerald-100/50 sm:p-4">
                  <div className="mb-3 flex items-start gap-2.5 sm:mb-3.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/25 sm:h-10 sm:w-10 sm:rounded-xl">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900">Bank information</h3>
                      <p className="text-[11px] leading-snug text-gray-600 sm:text-xs">Name, loan type, RSM type, and optional logo.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                    <label className="group block lg:col-span-3">
                      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-700">
                        Bank name <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        name="name"
                        value={bank.name}
                        onChange={handleChange}
                        required
                        autoComplete="organization"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="e.g. HDFC Bank, Axis NBFC"
                      />
                    </label>

                    <label className="block lg:col-span-1">
                      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-700">
                        Loan type <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <select
                          name="loanType"
                          value={bank.loanType}
                          onChange={handleChange}
                          required
                          className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="">Choose loan type</option>
                          {loanTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-700">
                        RSM type <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <select
                          name="rsmType"
                          value={bank.rsmType}
                          onChange={handleChange}
                          required
                          className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="">Choose RSM type</option>
                          {rsmTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </label>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <ImagePlus className="h-3.5 w-3.5 text-emerald-600" />
                        Bank logo <span className="font-normal text-gray-400">(optional)</span>
                      </span>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white/80 px-3 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/30 sm:flex-row sm:justify-between sm:py-2.5">
                        <div className="mb-2 text-center sm:mb-0 sm:text-left">
                          <p className="text-xs font-medium text-gray-700">PNG, JPG or WEBP</p>
                          <p className="text-[11px] text-gray-500">Square image works best</p>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          name="bankLogo"
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                          Choose file
                        </span>
                      </label>
                      {bank.logo && (
                        <p className="mt-2 truncate text-xs text-emerald-700">
                          Selected: <span className="font-medium">{bank.logo.name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Portal access */}
                <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 shadow-inner sm:p-4">
                  <div className="mb-3 flex items-start gap-2.5 sm:mb-3.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white shadow-md sm:h-10 sm:w-10 sm:rounded-xl">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900">Portal access</h3>
                      <p className="text-[11px] leading-snug text-gray-600 sm:text-xs">Login, password, and portal URL for RSMs.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    <label className="block sm:col-span-2 lg:col-span-1">
                      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                        Login ID <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        name="loginId"
                        value={bank.loginId}
                        onChange={handleChange}
                        required
                        autoComplete="username"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Portal username or ID"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                        Password <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <input
                          type={showAddPassword ? "text" : "password"}
                          name="password"
                          value={bank.password}
                          onChange={handleChange}
                          required
                          autoComplete="new-password"
                          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-11 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowAddPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                          aria-label={showAddPassword ? "Hide password" : "Show password"}
                        >
                          {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>

                    <label className="block sm:col-span-2 lg:col-span-1">
                      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <Globe className="h-3.5 w-3.5 text-slate-500" />
                        Portal URL <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        name="link"
                        value={bank.link}
                        onChange={handleChange}
                        required
                        inputMode="url"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="https://portal.bank.com/login"
                      />
                    </label>
                  </div>
                </section>
                </div>
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/90 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Reset form
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition sm:min-w-[8rem] ${
                      submitting
                        ? "cursor-not-allowed bg-emerald-400 shadow-none"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700"
                    }`}
                  >
                    {submitting ? "Saving…" : "Add bank"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-b border-gray-100 px-4 py-3">
                <input
                  type="text"
                  value={loanTypeSearch}
                  onChange={(e) => setLoanTypeSearch(e.target.value)}
                  placeholder="Search by loan type..."
                  className="min-w-[12rem] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 sm:max-w-md"
                />
                <button
                  type="button"
                  onClick={() => dispatch(fetchAdminBanks())}
                  className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Refresh
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {!adminToken ? (
                <p className="text-red-600 text-sm">Admin token not found. Please login again.</p>
              ) : banksLoading ? (
                <p className="text-gray-500 text-sm">Loading banks...</p>
              ) : banksError ? (
                <p className="text-red-600 text-sm">{String(banksError)}</p>
              ) : filteredBanks.length === 0 ? (
                <p className="text-gray-500 text-sm">No banks available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {filteredBanks.map((b, index) => {
                    const id = b?._id || b?.id || index;
                    const isShowId = !!showId[id];
                    const isShowPw = !!showPassword[id];

                    return (
                      <div
                        key={id}
                        className="group bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 flex flex-col gap-2.5 min-w-0"
                      >
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-10 h-10 shrink-0 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                              <img
                                src={b.bankLogoUrl || b.logoUrl || b.bankLogo || ""}
                                alt={b.bankName || b.name || "Bank"}
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h2 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                                {b.bankName || b.name || "Unnamed Bank"}
                              </h2>
                              <p className="mt-0.5 text-[10px] text-gray-500 truncate">
                                {Array.isArray(b.rsmTypes)
                                  ? b.rsmTypes.join(", ")
                                  : b.rsmTypes || b.rsmType || "No RSM type"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(b)}
                            className="shrink-0 inline-flex items-center justify-center p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            title="Delete bank"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="h-px bg-gray-100" />

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Login ID</span>
                            <div className="flex items-center justify-between gap-1 bg-gray-50 px-2 py-1.5 rounded-lg">
                              <span className="font-medium text-gray-800 text-[11px] break-all min-w-0 flex-1 line-clamp-2">
                                {isShowId ? b.portalLoginId : maskText(b.portalLoginId)}
                              </span>
                              <div className="flex items-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleId(id)}
                                  className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                >
                                  {isShowId ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyText(b.portalLoginId)}
                                  className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Password</span>
                            <div className="flex items-center justify-between gap-1 bg-gray-50 px-2 py-1.5 rounded-lg">
                              <span className="font-medium text-gray-800 text-[11px] break-all min-w-0 flex-1 line-clamp-2">
                                {isShowPw ? b.portalPassword : maskText(b.portalPassword)}
                              </span>
                              <div className="flex items-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => togglePw(id)}
                                  className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                >
                                  {isShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyText(b.portalPassword)}
                                  className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-2 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                          <span className="px-2 py-1 text-[10px] font-semibold rounded-md bg-emerald-100 text-emerald-700 truncate max-w-[55%]">
                            {b.loanType || "N/A"}
                          </span>
                          <a
                            href={b.portalLink || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 bg-emerald-500 text-white text-[11px] px-2 py-1 rounded-md hover:bg-emerald-600 transition shrink-0"
                          >
                            Visit
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span className="font-medium">{toast.type === "success" ? "Success" : "Error"}</span>
            <span className="text-xs">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="ml-2 text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banks;

