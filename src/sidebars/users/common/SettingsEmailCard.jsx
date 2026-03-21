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
    patchEmail: async (email) => {
      const { partnerToken } = getAuthData() || {};
      await axios.patch(
        `${backendurl}/partner/profile/update`,
        { email },
        { headers: { Authorization: `Bearer ${partnerToken}`, "Content-Type": "application/json" } }
      );
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
    patchEmail: async (email) => {
      const { adminToken } = getAuthData() || {};
      await axios.patch(
        `${backendurl}/admin/profile/update`,
        { email },
        { headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" } }
      );
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
    patchEmail: async (email) => {
      const { asmToken } = getAuthData() || {};
      await axios.patch(
        `${backendurl}/asm/profile/update`,
        { email },
        { headers: { Authorization: `Bearer ${asmToken}`, "Content-Type": "application/json" } }
      );
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
    patchEmail: async (email) => {
      const { rmToken } = getAuthData() || {};
      await axios.patch(
        `${backendurl}/rm/profile/update`,
        { email },
        { headers: { Authorization: `Bearer ${rmToken}`, "Content-Type": "application/json" } }
      );
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
    patchEmail: null,
  },
};

/**
 * Login email editor for roles with PATCH support; RSM shows read-only + note.
 */
const SettingsEmailCard = ({ roleKey }) => {
  const cfg = ROLE_CONFIG[roleKey];
  if (!cfg) return null;
  const [email, setEmail] = useState("");
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
        if (!cancelled) setEmail(data?.email || "");
      } catch {
        if (!cancelled) setEmail("");
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
    const trimmed = String(email || "").trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMsg({ text: "Please enter a valid email address.", ok: false });
      return;
    }
    try {
      setSaving(true);
      await cfg.patchEmail(trimmed);
      setMsg({ text: "Email updated. Use the new email next time you sign in.", ok: true });
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
              ? "Used for sign-in and system notifications."
              : "Your registered email on file."}
          </p>
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
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!cfg.patchEmail}
              className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20 ${
                !cfg.patchEmail ? "cursor-not-allowed opacity-90" : ""
              }`}
              placeholder="you@company.com"
              autoComplete="email"
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
                "Save email"
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
