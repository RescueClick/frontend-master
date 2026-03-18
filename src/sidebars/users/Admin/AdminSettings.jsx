import React, { useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const AdminSettings = () => {
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

    const { adminToken } = getAuthData();
    if (!adminToken) {
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
          Authorization: `Bearer ${adminToken}`,
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
    "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B99C] focus:border-[#12B99C] text-slate-900 placeholder:text-slate-400 text-sm";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] p-6">
      <header className="bg-white text-slate-900 p-4 rounded-2xl mb-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Admin Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your account security and password.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Change password
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Enter your current password and choose a new one. A confirmation email will be sent.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {/* Old Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Current password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type={showOld ? "text" : "password"}
                  placeholder="Enter current password"
                  className={inputClass}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowOld(!showOld)}
                  tabIndex={-1}
                >
                  {showOld ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  className={inputClass}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  isError
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-green-50 border border-green-200 text-green-700"
                }`}
              >
                {!isError && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#12B99C] hover:bg-[#0f9e82] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Changing password..." : "Change password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
