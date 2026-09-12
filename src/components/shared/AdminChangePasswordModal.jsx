import React, { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, Lock, Copy, Check, Sparkles, X, ShieldAlert } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { getAuthData } from "../../utils/localStorage";
import { backendurl } from "../../feature/urldata";

/**
 * Generate a secure, readable random password
 */
function generateRandomPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "@#$!";
  
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += special[Math.floor(Math.random() * special.length)];

  const all = upper + lower + numbers + special;
  for (let i = 0; i < 6; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd;
}

export default function AdminChangePasswordModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError("");
      setCopied(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const displayName =
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.name ||
    user.email ||
    "User";

  const userRole = user.role || user.userType || "USER";
  const userIdentifier = user.employeeId || user.asmCode || user.rmCode || user.partnerCode || user.phone || "";

  const handleGeneratePassword = () => {
    const generated = generateRandomPassword();
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setError("");
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Password copied to clipboard!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const authData = getAuthData() || {};
    const adminToken =
      authData.adminToken ||
      authData.mainParentToken ||
      (authData.parentUser?.role === "SUPER_ADMIN" ? authData.parentToken : null);

    if (!adminToken) {
      setError("Admin session not found. Please log in as Admin.");
      return;
    }

    setLoading(true);

    try {
      const targetId = user._id || user.id || user.userId || user.customerId?._id || user.customerId;
      const res = await axios.post(
        `${backendurl}/admin/change-user-password`,
        {
          userId: targetId,
          id: targetId,
          email: user.email,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const msg = res.data?.message || "Password updated successfully!";
      toast.success(msg);
      if (typeof onSuccess === "function") {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-slate-800 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <KeyRound className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Change User Password</h3>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Admin password override for account
              </p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{displayName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{user.email || "No email"}</p>
              {userIdentifier && (
                <p className="text-[11px] text-slate-400 mt-0.5">ID: {userIdentifier}</p>
              )}
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 uppercase tracking-wide">
              {userRole}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Generator Button */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">Set new password:</span>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            >
              <Sparkles size={13} className="text-teal-600" />
              Auto-generate strong password
            </button>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full pl-9 pr-20 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copy password"
                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-[11px] text-amber-600 mt-1">Must be at least 6 characters</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            As Admin, updating this will immediately change the user's password. A confirmation email will be sent to the user.
          </p>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
