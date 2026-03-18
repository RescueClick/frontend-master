import React, { useState, useRef } from "react";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const Banks = () => {

  const [bank, setBank] = useState({
    name: "",
    logo: null,
    loanType: "",
    rsmType: "",
    loginId: "",
    password: "",
    link: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const fileInputRef = useRef(null);

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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Add Lending Partner
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Add bank or NBFC partner credentials for RSM access.
          </p>
        </div> */}

        {/* Form card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-md font-bold text-gray-800">
              Add Bank Details
            </h2>
          </div>

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
                  name="name"
                  value={bank.name}
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
                  <option value="HOME_LOAN_SALARIED">Home Loan (Salaried)</option>
                  <option value="HOME_LOAN_SELF_EMPLOYED">Home Loan (Self Employed)</option>
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
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Bank Logo
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                name="logo"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setBank({
                      ...bank,
                      logo: file
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-500 file:text-white hover:file:bg-teal-600"
              />
              {/* Preview */}
              {/* {bank.preview && (
                <div className="mt-3 inline-flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Preview</span>

                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={bank.preview}
                      alt="Logo preview"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
              )} */}
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
                  name="loginId"
                  value={bank.loginId}
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
                  name="password"
                  value={bank.password}
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
                name="link"
                value={bank.link}
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