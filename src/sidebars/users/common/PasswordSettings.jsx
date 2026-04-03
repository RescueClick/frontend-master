import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Shield, Trash2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import AccountSettings from "./AccountSettings";
import SettingsEmailCard from "./SettingsEmailCard";

function getActiveToken() {
  const auth = getAuthData();
  return (
    auth.adminToken ||
    auth.asmToken ||
    auth.rsmToken ||
    auth.rmToken ||
    auth.partnerToken ||
    auth.customerToken ||
    null
  );
}

function pageTitleForPath(pathname) {
  if (pathname.startsWith("/asm")) return "ASM Settings";
  if (pathname.startsWith("/rsm")) return "RSM Settings";
  if (pathname.startsWith("/rm")) return "RM Settings";
  if (pathname.startsWith("/partner")) return "Partner Settings";
  return "Settings";
}

function emailRoleForPath(pathname) {
  if (pathname.startsWith("/partner")) return "partner";
  if (pathname.startsWith("/asm")) return "asm";
  if (pathname.startsWith("/rm")) return "rm";
  if (pathname.startsWith("/rsm")) return "rsm";
  return null;
}

/**
 * Account center: edit profile (where available), login email, password.
 */
const PasswordSettings = () => {
  const { pathname } = useLocation();
  const isPartner = pathname.startsWith("/partner");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ text: "", ok: null });
  const [deleteRequestStatus, setDeleteRequestStatus] = useState(null);
  const [deleteStatusLoading, setDeleteStatusLoading] = useState(false);
  const pageTitle = useMemo(() => pageTitleForPath(pathname), [pathname]);
  const emailRole = useMemo(() => emailRoleForPath(pathname), [pathname]);

  const profileLinks = useMemo(() => {
    if (pathname.startsWith("/asm")) {
      return [
        {
          to: "/asm/EditProfile",
          label: "Edit profile",
          hint: "Personal details, address & region",
        },
      ];
    }
    if (pathname.startsWith("/rsm")) {
      return [
        {
          to: "/rsm/EditProfile",
          label: "Edit profile",
          hint: "Name, contact & region",
        },
      ];
    }
    if (pathname.startsWith("/rm")) {
      return [
        {
          to: "/rm/EditProfile",
          label: "Edit profile",
          hint: "Name, contact & experience",
        },
      ];
    }
    if (pathname.startsWith("/partner")) {
      return [
        {
          to: "/partner/edit-profile",
          label: "Edit profile",
          hint: "Name, contact & region (not in sidebar — open from here)",
          state: { from: pathname },
        },
        {
          to: "/partner/profile",
          label: "Referrals & invites",
          hint: "Your PT code — one Share invite for web + app",
        },
      ];
    }
    return [];
  }, [pathname]);

  const pageSubtitle = useMemo(() => {
    if (pathname.startsWith("/partner")) {
      return "Edit profile, referrals & invites (one PT code), email change with verification, password, and account actions.";
    }
    return "Update your profile, login email, and password — all in one place.";
  }, [pathname]);

  const loadDeleteRequestStatus = useCallback(async () => {
    if (!isPartner) return;
    const { partnerToken } = getAuthData() || {};
    if (!partnerToken) {
      setDeleteRequestStatus(null);
      return;
    }
    setDeleteStatusLoading(true);
    try {
      const res = await axios.get(`${backendurl}/partner/delete-account-request/status`, {
        headers: { Authorization: `Bearer ${partnerToken}` },
      });
      setDeleteRequestStatus(res.data ?? null);
    } catch {
      setDeleteRequestStatus(null);
    } finally {
      setDeleteStatusLoading(false);
    }
  }, [isPartner]);

  useEffect(() => {
    loadDeleteRequestStatus();
  }, [loadDeleteRequestStatus]);

  const deleteStatusBlocksSubmit =
    deleteRequestStatus?.hasRequest &&
    (deleteRequestStatus.status === "PENDING" || deleteRequestStatus.status === "COMPLETED");

  const requestDeleteAccount = async () => {
    setDeleteMsg({ text: "", ok: null });
    const { partnerToken } = getAuthData() || {};
    if (!partnerToken) {
      setDeleteMsg({ text: "Session expired. Please login again.", ok: false });
      return;
    }
    try {
      setDeleting(true);
      const res = await axios.post(
        `${backendurl}/partner/delete-account-request`,
        { reason: deleteReason.trim() },
        { headers: { Authorization: `Bearer ${partnerToken}` } }
      );
      setDeleteMsg({
        text:
          res?.data?.message ||
          "Delete account request submitted. Our team will verify and process it.",
        ok: true,
      });
      setDeleteReason("");
      await loadDeleteRequestStatus();
    } catch (err) {
      setDeleteMsg({
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Unable to submit delete account request.",
        ok: false,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AccountSettings
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      getAuthToken={getActiveToken}
      profileLinks={profileLinks}
      children={emailRole ? <SettingsEmailCard roleKey={emailRole} /> : null}
      afterSections={
        isPartner ? (
          <>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Legal & policies</h2>
                  <p className="text-sm text-slate-500">
                    Review privacy and terms documents.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  to="/PrivacyPolicy"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Shield className="h-4 w-4 text-indigo-600" />
                  Privacy Policy
                </Link>
                <Link
                  to="/TermsConditions"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Terms & Conditions
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm ring-1 ring-rose-100">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Delete account</h2>
                  <p className="text-sm text-slate-500">
                    Submit a verified request. Deletion is reviewed by compliance.
                  </p>
                </div>
              </div>

              {deleteStatusLoading ? (
                <p className="mb-3 text-sm text-slate-500">Loading request status…</p>
              ) : deleteRequestStatus?.hasRequest ? (
                <div
                  className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                    deleteRequestStatus.status === "REJECTED"
                      ? "border-rose-200 bg-rose-50 text-rose-900"
                      : deleteRequestStatus.status === "PENDING"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  }`}
                >
                  <p className="font-semibold">
                    {deleteRequestStatus.status === "PENDING" && "Status: Under review"}
                    {deleteRequestStatus.status === "REJECTED" &&
                      "Status: Rejected — your account stays active"}
                    {deleteRequestStatus.status === "COMPLETED" && "Status: Processed"}
                  </p>
                  <p className="mt-1 text-slate-700">
                    {deleteRequestStatus.status === "PENDING" &&
                      "We will email you and notify you in the app when the request is updated."}
                    {deleteRequestStatus.status === "REJECTED" &&
                      "Your deletion request was not approved. You can submit a new request below if needed."}
                    {deleteRequestStatus.status === "COMPLETED" &&
                      "This delete request was completed. Contact support if you need help with access."}
                  </p>
                </div>
              ) : null}

              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Reason (optional)
              </label>
              <textarea
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Why do you want to delete your account?"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
              />

              {deleteMsg.text ? (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                    deleteMsg.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  {deleteMsg.ok ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{deleteMsg.text}</span>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={requestDeleteAccount}
                  disabled={deleting || deleteStatusBlocksSubmit}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Request account deletion"
                  )}
                </button>
                <Link to="/delete-account" className="text-sm font-medium text-rose-700 underline">
                  Open full delete account page
                </Link>
              </div>
            </div>
          </>
        ) : null
      }
    />
  );
};

export default PasswordSettings;
