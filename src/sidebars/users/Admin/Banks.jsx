import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Copy, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const Banks = () => {

  const [activeTab, setActiveTab] = useState("add"); // add | list

  const [bank, setBank] = useState({
    bankName: "",
    bankLogo: null,
    loanType: "",
    rsmType: "",
    loginId: "",
    password: "",
    link: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [banks, setBanks] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const fileInputRef = useRef(null);

  const loanTypeOptions = useMemo(
    () => [
      { value: "PERSONAL", label: "Personal Loan" },
      { value: "BUSINESS", label: "Business Loan" },
      { value: "HOME_LOAN_SALARIED", label: "Home Loan (Salaried)" },
      { value: "HOME_LOAN_SELF_EMPLOYED", label: "Home Loan (Self Employed)" },
    ],
    []
  );

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true);
      const { adminToken } = getAuthData() || {};
      if (!adminToken) return;
      const res = await axios.get(`${backendurl}/admin/banks`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const list = Array.isArray(res.data?.banks) ? res.data.banks : Array.isArray(res.data) ? res.data : [];
      setBanks(list);
    } catch (error) {
      setToast({
        visible: true,
        message: error?.response?.data?.message || "Failed to fetch banks.",
        type: "error",
      });
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleChange = (e) => {
    setBank({
      ...bank,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const { adminToken } = getAuthData() || {};

      if (!adminToken) {
        setToast({
          visible: true,
          message: "Admin not authenticated. Please login again.",
          type: "error",
        });
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("bankName", bank.name);
      if (bank.logo) {
        formData.append("bankLogo", bank.logo);
      }
      formData.append("loanType", bank.loanType);
      formData.append("portalLoginId", bank.loginId);
      formData.append("portalPassword", bank.password);
      formData.append("portalLink", bank.link);
      // backend expects rsmTypes (array or string)
      if (bank.rsmType) {
        formData.append("rsmTypes", bank.rsmType);
      }

      await axios.post(`${backendurl}/admin/banks`, formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setToast({
        visible: true,
        message: "Bank added successfully.",
        type: "success",
      });

      setBank({
        name: "",
        logo: null,
        loanType: "",
        rsmType: "",
        loginId: "",
        password: "",
        link: "",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchBanks();
      setActiveTab("list");
    } catch (error) {
      setToast({
        visible: true,
        message:
          error?.response?.data?.message ||
          "Failed to add bank. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [showPassword, setShowPassword] = useState({});
  const [showId, setShowId] = useState({});

  const togglePw = (id) => setShowPassword((p) => ({ ...p, [id]: !p[id] }));
  const toggleId = (id) => setShowId((p) => ({ ...p, [id]: !p[id] }));

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setToast({ visible: true, message: "Copied to clipboard", type: "success" });
  };

  const maskText = (text) => {
    if (!text || typeof text !== "string") return "";
    return "*".repeat(text.length);
  };

  const handleDelete = async (bankId) => {
    try {
      const ok = window.confirm("Delete this bank? RSMs will no longer see it.");
      if (!ok) return;
      const { adminToken } = getAuthData() || {};
      if (!adminToken) return;
      await axios.delete(`${backendurl}/admin/banks/${bankId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setToast({ visible: true, message: "Bank deleted.", type: "success" });
      await fetchBanks();
    } catch (error) {
      setToast({
        visible: true,
        message: error?.response?.data?.message || "Failed to delete bank.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    dispatch(fetchAdminBanks());
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Add Lending Partner
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Add bank or NBFC partner credentials for RSM access.
          </p>
        </div> */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Top Header + Horizontal Tabs */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Bank Master</p>
                <p className="text-xs text-gray-500 mt-1">Add and manage banks</p>
              </div>

              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("add")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "add"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  Add Bank
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "list"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  Banks List
                  <span className={`ml-2 text-xs font-bold ${activeTab === "list" ? "text-emerald-50" : "text-gray-500"}`}>
                    ({banks.filter((b) => b?.isActive !== false).length})
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            {activeTab === "add" ? (
              <>
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-md font-bold text-gray-800">
                    Add Bank Details
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Bank name + loan type in two columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={bank.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm  outline-none placeholder:text-gray-400"
                  placeholder="Enter bank or NBFC name"
                />
              </div>
            )}

              {/* Loan Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Loan Type
                </label>
                <select
                  name="loanType"
                  value={bank.loanType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white  outline-none"
                  required
                >
                  <option value="">Select loan type</option>
                  {loanTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RSM Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  RSM Type
                </label>
                <select
                  name="rsmType"
                  value={bank.rsmType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white outline-none"
                  required
                >
                  <option value="">Select RSM Type</option>
                  <option value="PERSONAL">Personal Loan RSM</option>
                  <option value="BUSINESS_HOME">
                    Business &amp; Home Loan RSM
                  </option>
                </select>
              </div>

              {/* Logo URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Bank Logo
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    name="bankLogo"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setBank({
                          ...bank,
                          bankLogo: file
                        });
                      }
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-500 file:text-white hover:file:bg-teal-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    RSM Types
                  </label>
                  <select
                    name="rsmTypes"
                    value={bank.rsmTypes}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white  outline-none"
                  >
                    <option value="">Select RSM types</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="BUSINESS_HOME">Business & Home</option>

                  </select>
                </div>
              </div>


              {/* Credentials section title */}
              <div className="pt-2 border-t border-dashed border-gray-100">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Portal Credentials
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  These details will be shared with RSMs for partner portal access.
                </p>
              </div>

              {/* Login & password side by side on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Login ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Login ID
                  </label>
                  <input
                    type="text"
                    name="portalLoginId"
                    value={bank.portalLoginId}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
                    placeholder="Enter portal login ID"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="text"
                    name="portalPassword"
                    value={bank.portalPassword}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
                    placeholder="Enter portal password"
                  />
                </div>
              </div>

              {/* Portal link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Portal Link
                </label>
                <input
                  type="text"
                  name="portalLink"
                  value={bank.portalLink}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
                  placeholder="https://bankportal.com"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBank({
                      bankName: "",
                      bankLogo: null,
                      loanType: "",
                      portalLoginId: "",
                      portalPassword: "",
                      portalLink: "",
                      rsmTypes: "",
                    });

                    // ✅ THIS IS THE KEY FIX
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-teal-500 hover:bg-teal-600 shadow-sm transition"
                >
                  Add Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {activeTab === "list" && (
        <div className="max-w-6xl mx-auto mt-25">
          {/* Page header */}


          {/* Loan type search */}
          <div className="mb-6 flex justify-end">
            <div className="w-full max-w-lg">

              <div className="flex items-center gap-2">

                {/* Input with icon */}
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={loanTypeSearch}
                    onChange={(e) => setLoanTypeSearch(e.target.value)}
                    placeholder="Search by loan type..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => {
                    // you already filter live, so this is optional
                    console.log("Searching:", loanTypeSearch);
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition"
                >
                  Search
                </button>

              </div>

            </div>
          </div>

          {banksLoading ? (
            <p className="text-gray-500 text-sm">Loading banks...</p>
          ) : banksError ? (
            <p className="text-red-600 text-sm">{String(banksError)}</p>
          ) : !filteredBanks.length ? (
            <p className="text-gray-500 text-sm">No banks available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBanks.map((bank) => (
                <div
                  key={bank?._id}
                  className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-200 flex flex-col gap-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setBank({
                    name: "",
                    logo: null,
                    loanType: "",
                    rsmType: "",
                    loginId: "",
                    password: "",
                    link: "",
                  });
                
                  // ✅ THIS IS THE KEY FIX
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm transition ${
                  submitting
                    ? "bg-teal-400 cursor-not-allowed opacity-80"
                    : "bg-teal-500 hover:bg-teal-600"
                }`}
              >
                {submitting ? "Adding Bank..." : "Add Bank"}
              </button>
            </div>
                  </form>
                </>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Added Banks</h3>
                      <p className="text-xs text-gray-500 mt-1">Visible banks for RSM based on type</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchBanks}
                      className="text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingBanks ? (
                    <div className="text-center text-gray-600 text-sm">Loading banks...</div>
                  ) : banks.filter((b) => b?.isActive !== false).length === 0 ? (
                    <div className="text-center text-gray-600 text-sm">No banks added yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {banks
                        .filter((b) => b?.isActive !== false)
                        .map((b, index) => {
                          const id = b._id || b.id || index;
                          return (
                            <div
                              key={id}
                              className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col gap-4"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-14 h-14 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={b.bankLogoUrl || ""}
                                      alt={b.bankName || "Bank"}
                                      className="w-11 h-11 object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h2 className="text-base font-semibold text-gray-900 truncate">
                                      {b.bankName || "Unnamed Bank"}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500 truncate">
                                      {Array.isArray(b.rsmTypes) && b.rsmTypes.length ? b.rsmTypes.join(", ") : "No RSM type"}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100"
                                  title="Delete bank"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>

                              <div className="h-px bg-gray-100" />

                              <div className="space-y-3">
                                {/* Login ID */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      Login ID
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl">
                                    <span className="font-medium text-gray-800 text-xs md:text-sm break-all max-w-[70%]">
                                      {showId[id] ? b.portalLoginId : maskText(b.portalLoginId)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => toggleId(id)}
                                        className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                      >
                                        {showId[id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyText(b.portalLoginId)}
                                        className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                      >
                                        <Copy size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      Password
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl">
                                    <span className="font-medium text-gray-800 text-xs md:text-sm break-all max-w-[70%]">
                                      {showPassword[id] ? b.portalPassword : maskText(b.portalPassword)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => togglePw(id)}
                                        className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                      >
                                        {showPassword[id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyText(b.portalPassword)}
                                        className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                                      >
                                        <Copy size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                                <span className="px-3 py-2 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700">
                                  {b.loanType || "N/A"}
                                </span>
                                <a
                                  href={b.portalLink || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition"
                                >
                                  Visit
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span className="font-medium">
              {toast.type === "success" ? "Success" : "Error"}
            </span>
            <span className="text-xs">{toast.message}</span>
            <button
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