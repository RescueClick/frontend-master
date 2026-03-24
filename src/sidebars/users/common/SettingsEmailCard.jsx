import React, { useEffect, useState } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const ROLE_CONFIG = {
  partner: {
    getProfile: async () => {
      const { partnerToken } = getAuthData() || {};
      const res = await axios.get(`${backendurl}/partner/profile`, {
        headers: { Authorization: `Bearer ${partnerToken}` },
      });
      return res.data?.partner || res.data;
    },
    patchEmail: async ({ currentEmail, newEmail, currentPassword }) => {
      const { partnerToken } = getAuthData() || {};
      const res = await axios.patch(
        `${backendurl}/partner/profile/update`,
        { currentEmail, currentPassword, email: newEmail },
        { headers: { Authorization: `Bearer ${partnerToken}`, "Content-Type": "application/json" } }
      );
      return res.data;
    },
  },
  admin: {
    getProfile: async () => {
      const { adminToken } = getAuthData() || {};
      const res = await axios.get(`${backendurl}/admin/profile`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return res.data?.profile || res.data;
    },
    patchEmail: async ({ currentEmail, newEmail, currentPassword }) => {
      const { adminToken } = getAuthData() || {};
      const res = await axios.patch(
        `${backendurl}/admin/profile/update`,
        { currentEmail, currentPassword, email: newEmail },
        { headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" } }
      );
      return res.data;
    },
  },
  asm: {
    getProfile: async () => {
      const { asmToken } = getAuthData() || {};
      const res = await axios.get(`${backendurl}/asm/profile`, {
        headers: { Authorization: `Bearer ${asmToken}` },
      });
      const p = res.data?.profile || res.data;
      return p;
    },
    patchEmail: async ({ currentEmail, newEmail, currentPassword }) => {
      const { asmToken } = getAuthData() || {};
      const res = await axios.patch(
        `${backendurl}/asm/profile/update`,
        { currentEmail, currentPassword, email: newEmail },
        { headers: { Authorization: `Bearer ${asmToken}`, "Content-Type": "application/json" } }
      );
      return res.data;
    },
  },
  rm: {
    getProfile: async () => {
      const { rmToken } = getAuthData() || {};
      const res = await axios.get(`${backendurl}/rm/profile`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });
      return res.data?.profile || res.data;
    },
    patchEmail: async ({ currentEmail, newEmail, currentPassword }) => {
      const { rmToken } = getAuthData() || {};
      const res = await axios.patch(
        `${backendurl}/rm/profile/update`,
        { currentEmail, currentPassword, email: newEmail },
        { headers: { Authorization: `Bearer ${rmToken}`, "Content-Type": "application/json" } }
      );
      return res.data;
    },
  },
  rsm: {
    getProfile: async () => {
      const { rsmToken } = getAuthData() || {};
      const res = await axios.get(`${backendurl}/rsm/profile`, {
        headers: { Authorization: `Bearer ${rsmToken}` },
      });
      return res.data;
    },
    patchEmail: async ({ currentEmail, newEmail, currentPassword }) => {
      const { rsmToken } = getAuthData() || {};
      const res = await axios.patch(
        `${backendurl}/rsm/profile/update`,
        { currentEmail, currentPassword, email: newEmail },
        { headers: { Authorization: `Bearer ${rsmToken}`, "Content-Type": "application/json" } }
      );
      return res.data;
    },
  },
};

/**
 * Login email editor for roles with PATCH support; RSM shows read-only + note.
 */
const SettingsEmailCard = ({ roleKey }) => {
  const cfg = ROLE_CONFIG[roleKey];
  if (!cfg) return null;
  const [activeEmail, setActiveEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: null });

  useEffect(() => {
    const config = ROLE_CONFIG[roleKey];
    if (!config) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await config.getProfile();
        if (!cancelled) {
          const active = data?.email || "";
          setActiveEmail(active);
          setCurrentEmail(active);
          setNewEmail("");
          setCurrentPassword("");
        }
      } catch {
        if (!cancelled) {
          setActiveEmail("");
          setCurrentEmail("");
          setNewEmail("");
          setCurrentPassword("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleKey]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg({ text: "", ok: null });
    if (!cfg.patchEmail) {
      setMsg({ text: "Email changes for this role are handled by your administrator.", ok: false });
      return;
    }
    const current = String(currentEmail || "").trim().toLowerCase();
    const next = String(newEmail || "").trim().toLowerCase();
    if (!current || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current)) {
      setMsg({ text: "Current email is invalid.", ok: false });
      return;
    }
    if (!next || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setMsg({ text: "Please enter a valid new email address.", ok: false });
      return;
    }
    if (current !== String(activeEmail || "").toLowerCase()) {
      setMsg({ text: "Current email must match your active email.", ok: false });
      return;
    }
    if (!currentPassword || String(currentPassword).length < 6) {
      setMsg({ text: "Please enter your current password to continue.", ok: false });
      return;
    }
    if (current === next) {
      setMsg({ text: "New email must be different from current email.", ok: false });
      return;
    }
    try {
      setSaving(true);
      const response = await cfg.patchEmail({
        currentEmail: current,
        newEmail: next,
        currentPassword,
      });
      const changePending = !!response?.emailChangePending;
      setMsg({
        text: changePending
          ? response?.message ||
            "Verification links sent to your current and new email. Approve both to complete change."
          : response?.message || "Email updated successfully.",
        ok: true,
      });
    } catch (err) {
      const m =
        err?.response?.data?.message ||
        err?.message ||
        "Could not update email.";
      setMsg({ text: m, ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
          <Mail className="h-6 w-6" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Login email</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {cfg.patchEmail
              ? "Used for sign-in and system notifications. Changes require verification."
              : "Your registered email on file."}
          </p>
          {cfg.patchEmail ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2 text-xs text-sky-900">
              Industry-grade flow: enter current + new email. Verification is required on both emails.
            </div>
          ) : null}

        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          Loading…
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-lg space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Current email (active)
            </label>
            <input
              type="email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
              placeholder="current@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              New email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              readOnly={!cfg.patchEmail}
              className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20 ${
                !cfg.patchEmail ? "cursor-not-allowed opacity-90" : ""
              }`}
              placeholder="new-email@company.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              readOnly={!cfg.patchEmail}
              className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20 ${
                !cfg.patchEmail ? "cursor-not-allowed opacity-90" : ""
              }`}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
          </div>

          {msg.text && (
            <div
              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                msg.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {msg.ok ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {cfg.patchEmail ? (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:from-sky-700 hover:to-blue-700 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Request email change"
              )}
            </button>
          ) : (
            <p className="text-xs text-slate-500">
              To change this email, contact your ASM or platform administrator.
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default SettingsEmailCard;
