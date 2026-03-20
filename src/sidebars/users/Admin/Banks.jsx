import React, { useState, useRef, useEffect } from "react";
import { Copy, ExternalLink, Eye, EyeOff, Search } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { createBank, deleteBank, fetchAdminBanks } from "../../../feature/thunks/adminThunks";

const Banks = () => {

  const dispatch = useDispatch();

  const { error: addBankError } = useSelector((state) => state.admin.addBank);


  const { data: banks, loading: banksLoading, error: banksError } = useSelector((state) => state.admin.fetchBanksData);

  // console.log("Banks Data:", banks);


  const [activeTab, setActiveTab] = useState("add");

  const [showPassword, setShowPassword] = useState({});
  const [showId, setShowId] = useState({});
  const [loanTypeSearch, setLoanTypeSearch] = useState("");

  const loanTypeLabels = {
    PERSONAL_LOAN: "Personal Loan",
    PERSONAL: "Personal Loan",
    BUSINESS_LOAN: "Business Loan",
    BUSINESS: "Business Loan",
    HOME_LOAN_SALARIED: "Home Loan Salaried",
    HOME_LOAN_SELF_EMPLOYED: "Home Loan Self Employed",
  };

  const getLoanTypeLabel = (type) => {
    if (!type) return "";
    return loanTypeLabels[type] || type;
  };

  const maskText = (text) => {
    if (!text) return "";
    return "*".repeat(String(text).length);
  };

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

  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  const handleDelete = (bankId) => {
    if (!bankId) return;

    const ok = window.confirm("Delete this bank?");
    if (!ok) return;

    dispatch(deleteBank(bankId)).then(() => {
      dispatch(fetchAdminBanks());
    });
  };

  const banksList = Array.isArray(banks)
    ? banks.filter((b) => b?.isActive !== false)
    : [];
  const loanTypeQuery = loanTypeSearch.trim().toLowerCase();
  const filteredBanks = loanTypeQuery
    ? banksList.filter((b) => {
      const normalize = (s) =>
        String(s || "")
          .toLowerCase()
          .replace(/[\s_-]+/g, "")
          .replace(/[^a-z0-9]/g, "");

      const raw = normalize(b?.loanType);
      const label = normalize(getLoanTypeLabel(b?.loanType));
      const q = normalize(loanTypeSearch);

      return raw.includes(q) || label.includes(q);
    })
    : banksList;

  const [bank, setBank] = useState({
    bankName: "",
    bankLogo: null,
    loanType: "",
    portalLoginId: "",
    portalPassword: "",
    portalLink: "",
    rsmTypes: "",
  });

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setBank({
      ...bank,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("bankName", bank.bankName);
    formData.append("bankLogo", bank.bankLogo);
    formData.append("loanType", bank.loanType);
    formData.append("portalLoginId", bank.portalLoginId);
    formData.append("portalPassword", bank.portalPassword);
    formData.append("portalLink", bank.portalLink);
    formData.append("rsmTypes", bank.rsmTypes);

    dispatch(createBank(formData));

    setBank({
      bankName: "",
      bankLogo: null,
      loanType: "",
      portalLoginId: "",
      portalPassword: "",
      portalLink: "",
      rsmTypes: ""
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

  };

  useEffect(() => {
    dispatch(fetchAdminBanks());
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">

      <div className="fixed top-22 left-1/2 -translate-x-1/2 w-[100%] max-w-5xl z-50 bg-slate-50 py-4 pb-6 flex justify-center px-6">
        <div className="flex justify-center">

          <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 shadow-sm">

            {/* Add Bank Tab */}
            <button
              onClick={() => setActiveTab("add")}
              className={`px-6.5 py-3 text-md font-semibold rounded-xl transition-all duration-200 ${activeTab === "add"
                ? "bg-teal-500 text-white shadow"
                : "text-gray-600 hover:text-gray-800"
                }`}
            >
              Add Bank
            </button>

            {/* Show Banks Tab */}
            <button
              onClick={() => setActiveTab("list")}
              className={`px-6.5 py-3 text-md font-semibold rounded-xl transition-all duration-200 ${activeTab === "list"
                ? "bg-teal-500 text-white shadow"
                : "text-gray-600 hover:text-gray-800"
                }`}
            >
              Show Banks
            </button>

          </div>

        </div>
      </div>


      {activeTab === "add" && (
        <div className="max-w-4xl mx-auto mt-25">
          {/* Header */}
          {/* Form card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-md font-bold text-gray-800">
                Add Bank Details
              </h2>
            </div>

            {addBankError && (
              <div className="px-6 py-3">
                <p className="text-red-600 text-sm">{String(addBankError)}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="px-6 py-6 space-y-6"
            >
              {/* Bank name + loan type in two columns on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={bank.bankName}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm  outline-none placeholder:text-gray-400"
                    placeholder="Enter bank or NBFC name"
                  />
                </div>

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
                  >
                    <option value="">Select loan type</option>
                    <option value="PERSONAL_LOAN">Personal Loan</option>
                    <option value="BUSINESS_LOAN">Business Loan</option>
                    <option value="HOME_LOAN_SALARIED">Home Loan Salaried</option>
                    <option value="HOME_LOAN_SELF_EMPLOYED">Home Loan Self Employed</option>
                  </select>
                </div>
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

                    {/* LEFT SIDE (Logo + Name) */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                        <img
                          src={bank.bankLogoUrl}
                          alt={bank.bankName}
                          className="w-11 h-11 object-contain"
                        />
                      </div>

                      <h2 className="text-base font-semibold text-gray-900 truncate">
                        {bank.bankName}
                      </h2>
                    </div>

                    {/* RIGHT SIDE (Delete Button) */}
                    <a
                      href={bank.portalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 bg-purple-500 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg hover:bg-purple-600 transition"
                    >
                      Visit
                      <ExternalLink size={14} />
                    </a>

                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Login ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Login ID
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl">
                      <span className="font-medium text-gray-800 text-xs md:text-sm break-all max-w-[70%]">
                        {showId[bank?._id]
                          ? bank.portalLoginId
                          : maskText(bank.portalLoginId)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleId(bank?._id)}
                          className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                          type="button"
                        >
                          {showId[bank?._id] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => copyText(bank.portalLoginId)}
                          className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                          type="button"
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
                        {showPassword[bank?._id]
                          ? bank.portalPassword
                          : maskText(bank.portalPassword)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => togglePassword(bank?._id)}
                          className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                          type="button"
                        >
                          {showPassword[bank?._id] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => copyText(bank.portalPassword)}
                          className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                          type="button"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RSM Type */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      RSM Type
                    </span>
                    <span className="text-xs text-gray-700 text-right">
                      {Array.isArray(bank.rsmTypes) ? bank.rsmTypes.join(", ") : ""}
                    </span>
                  </div>

                  {/* Loan Type + Portal Link */}
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                    <span className="px-3 py-2 text-xs font-semibold rounded-md bg-teal-100 text-teal-700">
                      {getLoanTypeLabel(bank.loanType)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(bank?._id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-600 hover:text-white rounded-md transition"
                    >
                      Delete
                    </button>

                  </div>

                  {/* Actions */}

                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Banks;