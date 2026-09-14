import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Headphones,
  PhoneCall,
  Mail,
  MessageSquare,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Info,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const DEFAULT_SUPPORT = {
  phone: "+917057772026",
  email: "support@dhansourcecapital.com",
  whatsapp: "+917057772026",
  hours: "Mon - Sat: 9:30 AM - 6:30 PM",
};

export default function CustomerSupportSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState(DEFAULT_SUPPORT.phone);
  const [email, setEmail] = useState(DEFAULT_SUPPORT.email);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SUPPORT.whatsapp);
  const [hours, setHours] = useState(DEFAULT_SUPPORT.hours);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { adminToken } = getAuthData();
      const res = await axios.get(`${backendurl}/admin/support-settings`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data?.settings) {
        const s = res.data.settings;
        setPhone(s.phone || DEFAULT_SUPPORT.phone);
        setEmail(s.email || DEFAULT_SUPPORT.email);
        setWhatsapp(s.whatsapp || s.phone || DEFAULT_SUPPORT.whatsapp);
        setHours(s.hours || DEFAULT_SUPPORT.hours);
        setLastUpdated(s.updatedAt || null);
      }
    } catch (err) {
      console.error("Failed to load customer support settings:", err);
      toast.error(err.response?.data?.message || "Could not load support settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      toast.error("Support phone number is required");
      return;
    }

    const digits = trimmedPhone.replace(/\D/g, "");
    if (digits.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)");
      return;
    }

    try {
      setSaving(true);
      const { adminToken } = getAuthData();
      const res = await axios.put(
        `${backendurl}/admin/support-settings`,
        {
          phone: trimmedPhone,
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp.trim() || trimmedPhone,
          hours: hours.trim(),
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      toast.success(res.data?.message || "Support settings updated successfully!");
      if (res.data?.settings) {
        setPhone(res.data.settings.phone);
        setEmail(res.data.settings.email);
        setWhatsapp(res.data.settings.whatsapp);
        setHours(res.data.settings.hours);
        setLastUpdated(res.data.settings.updatedAt);
      }
    } catch (err) {
      console.error("Failed to update support settings:", err);
      toast.error(err.response?.data?.message || "Failed to update support settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setPhone(DEFAULT_SUPPORT.phone);
    setEmail(DEFAULT_SUPPORT.email);
    setWhatsapp(DEFAULT_SUPPORT.whatsapp);
    setHours(DEFAULT_SUPPORT.hours);
  };

  const cleanDialPhone = phone.replace(/[^\d+]/g, "");
  const cleanWaNumber = whatsapp.replace(/\D/g, "");

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 via-emerald-50/40 to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20">
              <Headphones className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Customer App Support Settings
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Live in Mobile App
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Configure the call, email & WhatsApp contact options shown to borrowers in the DhanSource Customer mobile app.
              </p>
            </div>
          </div>

          {lastUpdated && (
            <span className="text-xs text-slate-400 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-xl font-mono">
              Last saved: {new Date(lastUpdated).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Form */}
      <div className="p-6 sm:p-7">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading support settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form Fields */}
              <div className="space-y-5">
                {/* 1. Support Phone Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Call Support Number <span className="text-rose-500">*</span>
                    </label>
                    {cleanDialPhone && (
                      <a
                        href={`tel:${cleanDialPhone}`}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1 hover:underline"
                        title="Test dialer"
                      >
                        <PhoneCall className="w-3 h-3" /> Test Call
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <PhoneCall className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+917057772026 or 020-XXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm font-medium text-slate-900 transition"
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    When a customer taps <strong>"Call support"</strong> in their profile or loan overview, their phone dials this number.
                  </p>
                </div>

                {/* 2. Support Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Support Email Address
                    </label>
                    {email && (
                      <a
                        href={`mailto:${email}?subject=Customer%20Support%20Test`}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <Mail className="w-3 h-3" /> Test Email
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="support@dhansourcecapital.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm font-medium text-slate-900 transition"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Opened automatically when customers tap <strong>"Email support"</strong>.
                  </p>
                </div>

                {/* 3. WhatsApp Support Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      WhatsApp Support Number
                    </label>
                    {cleanWaNumber && (
                      <a
                        href={`https://wa.me/${cleanWaNumber.length === 10 ? `91${cleanWaNumber}` : cleanWaNumber}?text=Support%20Test`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <MessageSquare className="w-3 h-3" /> Test WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+917057772026"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm font-medium text-slate-900 transition"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Used for one-touch chat assistance on WhatsApp.
                  </p>
                </div>

                {/* 4. Help Desk Hours */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Support Working Hours
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="Mon - Sat: 9:30 AM - 6:30 PM"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm font-medium text-slate-900 transition"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Displayed alongside the support buttons in the mobile app.
                  </p>
                </div>
              </div>

              {/* Right Column: Live Mobile App Preview */}
              <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-semibold tracking-wider uppercase text-teal-300">
                        Customer App Live Preview
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                      Profile Tab
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4">
                    Here is how customers experience these contact channels inside their DhanSource mobile app:
                  </p>

                  {/* Mock mobile menu items */}
                  <div className="space-y-2.5">
                    {/* Call Support Mock */}
                    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between hover:border-teal-500/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Call support</p>
                          <p className="text-[11px] font-mono text-teal-300">
                            {phone || "Not set"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-teal-900/60 text-teal-300 font-semibold px-2 py-1 rounded-md border border-teal-700/50">
                        Tap to Dial
                      </span>
                    </div>

                    {/* Email Support Mock */}
                    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between hover:border-teal-500/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Email support</p>
                          <p className="text-[11px] text-slate-300 truncate max-w-[170px]">
                            {email || "Not set"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-md">
                        Email Client
                      </span>
                    </div>

                    {/* WhatsApp Support Mock */}
                    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between hover:border-emerald-500/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">WhatsApp Chat</p>
                          <p className="text-[11px] font-mono text-emerald-300">
                            {whatsapp || phone || "Not set"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-semibold px-2 py-1 rounded-md border border-emerald-700/50">
                        Chat Now
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{hours || "Mon - Sat: 9:30 AM - 6:30 PM"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Standard Defaults
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-60 transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Support Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
