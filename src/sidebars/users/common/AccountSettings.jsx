import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  Shield,
  UserCircle,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";

/**
 * Account center — profile shortcuts, email (via children), password, security tips.
 * No delete-account or role-specific danger actions (kept out of settings by design).
 */
const AccountSettings = ({
  pageTitle = "Settings",
  pageSubtitle = "Manage your profile, login email, and password in one place.",
  getAuthToken,
  profileLinks = [],
  children = null,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("All fields are required.");
      setIsError(true);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters.");
      setIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      setIsError(true);
      return;
    }

    const token = typeof getAuthToken === "function" ? getAuthToken() : null;
    if (!token) {
      setMessage("Session expired. Please log in again.");
      setIsError(true);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${backendurl}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || "Failed to change password.");
        setIsError(true);
      } else {
        setMessage(data?.message || "Password changed successfully.");
        setIsError(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage("Network error. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 text-sm transition";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-[#111827]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-8 shadow-2xl shadow-slate-900/25 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-64 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300/90">Account center</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{pageTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{pageSubtitle}</p>
          </div>
        </div>

        {/* Edit profile shortcuts */}
        {Array.isArray(profileLinks) && profileLinks.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {profileLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  state={link.state}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:border-teal-200 hover:shadow-md hover:ring-teal-100"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 ring-1 ring-teal-100">
                      <UserCircle className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{link.label}</p>
                      <p className="text-xs text-slate-500">{link.hint || "Update name, phone, address & documents"}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Login email (injected per role) */}
        {children ? <div className="mt-8 space-y-6">{children}</div> : null}

        {/* Password + tips */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25">
                <KeyRound className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Password</h2>
                <p className="text-sm text-slate-500">Use a strong password you don’t use elsewhere.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Current password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type={showOld ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputClass}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowOld(!showOld)}
                    tabIndex={-1}
                  >
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  New password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputClass}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Confirm new password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputClass}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                    isError
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  }`}
                >
                  {!isError && <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:from-teal-700 hover:to-emerald-700 disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Security tips</h2>
                <p className="text-sm text-slate-500">Keep your account safe</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                "Use a unique password for this platform.",
                "Never share OTPs, passwords, or session links.",
                "Sign out when using shared devices.",
                "Report suspicious activity to support immediately.",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
