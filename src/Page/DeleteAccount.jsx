import React, { useState, useEffect, useCallback } from "react";
import { backendurl } from "../feature/urldata";
import { COMPANY_NAME, SUPPORT_EMAIL } from "../config/branding";
import { getAuthData } from "../utils/localStorage";
import { normalizeMobileDigits } from "../utils/phoneNormalize";

const DeleteAccount = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    partnerId: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [isPartnerSession, setIsPartnerSession] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const loadPartnerDeleteStatus = useCallback(async () => {
    const { partnerToken } = getAuthData() || {};
    setIsPartnerSession(!!partnerToken);
    if (!partnerToken) {
      setStatusLoading(false);
      setDeleteStatus(null);
      return;
    }
    setStatusLoading(true);
    try {
      const res = await fetch(`${backendurl}/partner/delete-account-request/status`, {
        headers: { Authorization: `Bearer ${partnerToken}` },
      });
      const data = await res.json().catch(() => null);
      setDeleteStatus(res.ok ? data : null);
    } catch {
      setDeleteStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartnerDeleteStatus();
  }, [loadPartnerDeleteStatus]);

  const partnerStatusBlocksSubmit =
    isPartnerSession &&
    deleteStatus?.hasRequest &&
    (deleteStatus.status === "PENDING" || deleteStatus.status === "COMPLETED");

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = name === "phone" ? normalizeMobileDigits(value) : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccess(null);

    try {
      const { partnerToken } = getAuthData() || {};
      if (partnerToken) {
        const response = await fetch(`${backendurl}/partner/delete-account-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${partnerToken}`,
          },
          body: JSON.stringify({ reason: formData.reason || "" }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to send delete account request.");
        }
        setIsSuccess(true);
        setMessage(
          data?.message ||
            "Your delete account request has been sent. Our team will contact you and process the deletion."
        );
        setFormData({
          name: "",
          email: "",
          phone: "",
          partnerId: "",
          reason: "",
        });
        await loadPartnerDeleteStatus();
      } else {
        const response = await fetch(`${backendurl}/contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: normalizeMobileDigits(formData.phone),
            subject: "Delete Account Request",
            message: [
              `User has requested to permanently delete their ${COMPANY_NAME} account.`,
              "",
              `Partner / Employee ID: ${formData.partnerId || "-"}`,
              `Registered Email: ${formData.email}`,
              `Registered Mobile: ${normalizeMobileDigits(formData.phone)}`,
              "",
              "Reason for deletion:",
              formData.reason || "-",
            ].join("\n"),
          }),
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(
            data?.message || "Failed to send delete account request. Please try again later."
          );
        }
        setIsSuccess(true);
        setMessage(
          "Your delete account request has been sent. Our team will contact you and process the deletion."
        );
        setFormData({
          name: "",
          email: "",
          phone: "",
          partnerId: "",
          reason: "",
        });
      }
    } catch (err) {
      console.error("Delete account contact error:", err);
      setIsSuccess(false);
      setMessage(
        "Something went wrong. Please try again later or contact support directly."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-5">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Delete Partner Account
          </h1>
          <p className="text-sm text-teal-100 mt-1">
            Send a request to permanently delete your {COMPANY_NAME} partner
            account.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {isPartnerSession && statusLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Checking your delete request status…
            </div>
          ) : null}
          {isPartnerSession && !statusLoading && deleteStatus?.hasRequest ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                deleteStatus.status === "REJECTED"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : deleteStatus.status === "PENDING"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              <p className="font-semibold">
                {deleteStatus.status === "PENDING" && "Request status: Under review"}
                {deleteStatus.status === "REJECTED" &&
                  "Request status: Rejected — your account remains active"}
                {deleteStatus.status === "COMPLETED" && "Request status: Processed"}
              </p>
              <p className="mt-1 text-slate-700">
                {deleteStatus.status === "PENDING" &&
                  "You will receive an email and an in-app notification when admin acts on your request."}
                {deleteStatus.status === "REJECTED" &&
                  "Admin did not approve account deletion this time. You may submit a new request below."}
                {deleteStatus.status === "COMPLETED" &&
                  "This request was completed. Contact support if you have questions about your access."}
              </p>
            </div>
          ) : null}

          {/* Info box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-sm text-slate-700">
              Deleting your account is a{" "}
              <span className="font-semibold">permanent</span> action. Your
              login will be disabled and you will no longer be able to access
              the Partner Dashboard or mobile app.
            </p>
            <p className="text-xs text-slate-500">
              Note: As per regulatory and compliance requirements, certain
              transactional and financial records may be retained even after
              account deletion.
            </p>
          </div>

          {/* Delete request form (email-based) */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Request deletion via email
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              {isPartnerSession
                ? "You are logged in as a partner. Submit an optional reason — your identity is taken from your session."
                : "Fill the form below and we will send your request to our support team. They will verify your details and complete the deletion process."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isPartnerSession}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Partner / Employee ID
                  </label>
                  <input
                    type="text"
                    name="partnerId"
                    value={formData.partnerId}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Optional but recommended"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required={!isPartnerSession}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Registered Mobile
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required={!isPartnerSession}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="10-digit mobile or +91…"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason for deletion
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required={!isPartnerSession}
                  className="w-full min-h-[90px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                  placeholder="Example: I am no longer using the platform, created an account by mistake, etc."
                />
              </div>

              {message && (
                <div
                  className={`text-sm rounded-md px-3 py-2 ${
                    isSuccess === true
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : isSuccess === false
                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                      : "bg-slate-50 text-slate-700 border border-slate-200"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || partnerStatusBlocksSubmit}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold shadow-md hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send Delete Request"}
              </button>
            </form>

            <p className="text-xs text-slate-500 mt-3">
              You can also email us directly at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20Account%20Request`}
                className="font-semibold underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;


