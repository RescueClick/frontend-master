import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  Briefcase,
  MapPin,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { fetchAsmProfile, updateAsmProfile } from "../../../feature/thunks/asmThunks";
import { fetchRsmProfile, updateRsmProfile } from "../../../feature/thunks/rsmThunks";
import { fetchRmProfile, updateRmProfile } from "../../../feature/thunks/rmThunks";

function roleFromPath(pathname) {
  if (pathname.startsWith("/rsm")) return "rsm";
  if (pathname.startsWith("/rm")) return "rm";
  return "asm";
}

/** RTK unwrap() rejects with string (from thunks) or legacy object */
function messageFromThunkError(e) {
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && typeof e.message === "string") return e.message;
  return "Could not save profile. Try again.";
}

export default function EditProfile({ setEditProfileOpen, onClose }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const role = useMemo(() => roleFromPath(location.pathname), [location.pathname]);

  const asmProfile = useSelector((s) => s.asm.profile);
  const rsmProfile = useSelector((s) => s.rsm.profile);
  const rmProfile = useSelector((s) => s.rm.profile);

  const { loading, error, data } =
    role === "asm" ? asmProfile : role === "rsm" ? rsmProfile : rmProfile;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    experience: "0-1 Years",
    region: "",
  });

  const [errors, setErrors] = useState({});
  const [saveMsg, setSaveMsg] = useState(null);
  const [emailChangePending, setEmailChangePending] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    const { asmToken, rsmToken, rmToken } = getAuthData();
    if (role === "asm" && asmToken) dispatch(fetchAsmProfile(asmToken));
    else if (role === "rsm" && rsmToken) dispatch(fetchRsmProfile(rsmToken));
    else if (role === "rm" && rmToken) dispatch(fetchRmProfile(rmToken));
  }, [dispatch, role]);

  useEffect(() => {
    if (!data) return;
    const fullName =
      role === "asm"
        ? data.fullName || ""
        : `${data.firstName || ""} ${data.lastName || ""}`.trim();
    setFormData({
      fullName,
      email: data.email || "",
      phone: data.phone || "",
      dob: data.dob ? String(data.dob).slice(0, 10) : "",
      address: data.address || "",
      experience: data.experience || "0-1 Years",
      region: data.region || "",
    });
  }, [data, role]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = "Full name should only contain letters and spaces";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        newErrors.phone = "Please enter a valid 10-digit phone number";
      }
    }

    if (!formData.dob?.trim()) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 18) newErrors.dob = "You must be at least 18 years old";
      else if (age > 100) newErrors.dob = "Please enter a valid date of birth";
    }

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Please enter a complete address (minimum 10 characters)";
    }

    if (!formData.experience?.trim()) {
      newErrors.experience = "Experience is required";
    }

    if (!formData.region?.trim()) {
      newErrors.region = "Region is required";
    } else if (formData.region.trim().length < 2) {
      newErrors.region = "Region must be at least 2 characters";
    }

    setErrors(newErrors);
    const firstKey = Object.keys(newErrors)[0];
    return { ok: Object.keys(newErrors).length === 0, firstKey };
  };

  const dashboardPath = `/${role}/dashboard`;

  const handleSave = async () => {
    setSaveMsg(null);
    const { ok, firstKey } = validateForm();
    if (!ok) {
      if (firstKey) {
        const el = document.querySelector(`[name="${firstKey}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }
      return;
    }

    const fullName = formData.fullName?.trim() || "";
    const parts = fullName.split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

    const payload = {
      firstName,
      lastName,
      email: formData.email?.trim() || "",
      phone: formData.phone?.trim() || "",
      dob: formData.dob || "",
      address: formData.address?.trim() || "",
      experience: formData.experience || "",
      region: formData.region?.trim() || "",
    };

    try {
      let result;
      if (role === "asm") result = await dispatch(updateAsmProfile(payload)).unwrap();
      else if (role === "rsm") result = await dispatch(updateRsmProfile(payload)).unwrap();
      else result = await dispatch(updateRmProfile(payload)).unwrap();

      if (result?.emailChangePending) {
        setEmailChangePending(true);
        setSaveMsg({
          type: "ok",
          text:
            result.emailChangeMessage ||
            "Email change requested. Please confirm via the link sent to your inbox.",
        });
        return;
      }

      setEmailChangePending(false);
      setSaveMsg({ type: "ok", text: "Profile saved successfully." });
      setTimeout(() => navigate(dashboardPath), 800);
    } catch (e) {
      setSaveMsg({ type: "err", text: messageFromThunkError(e) });
    }
  };

  const handleResendEmailChange = async () => {
    setResendingEmail(true);
    setSaveMsg(null);

    try {
      const { asmToken, rsmToken, rmToken } = getAuthData();
      const token = role === "asm" ? asmToken : role === "rsm" ? rsmToken : rmToken;

      if (!token) {
        setSaveMsg({
          type: "err",
          text: "Session expired. Please login again to resend the email.",
        });
        return;
      }

      const res = await fetch(`${backendurl}/auth/email-change/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveMsg({ type: "err", text: data?.message || "Resend failed." });
        return;
      }

      setSaveMsg({
        type: "ok",
        text:
          data?.message ||
          "Email change link resent. Please confirm via the link in your inbox.",
      });
    } catch (err) {
      setSaveMsg({ type: "err", text: "Something went wrong. Try again." });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  const handleClose = () => {
    if (typeof setEditProfileOpen === "function") setEditProfileOpen(false);
    if (typeof onClose === "function") onClose();
    setOpen(false);
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  const roleLabel = role === "asm" ? "ASM" : role === "rsm" ? "RSM" : "RM";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-brand-primary to-[#0d9d84] text-white">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="p-2 hover:bg-white/15 rounded-full transition-colors shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <User className="w-6 h-6 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">Edit profile</h1>
                <p className="text-sm text-white/90 truncate">{roleLabel} · Personal & contact details</p>
              </div>
            </div>
          </div>

          {saveMsg && (
            <div
              className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${
                saveMsg.type === "ok"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {saveMsg.text}
            </div>
          )}

          {emailChangePending && (
            <div className="mx-6 mt-3">
              <button
                type="button"
                onClick={handleResendEmailChange}
                disabled={resendingEmail}
                className="w-full py-2.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendingEmail
                  ? "Resending verification..."
                  : "Resend verification email"}
              </button>
            </div>
          )}

          {error && !loading && (
            <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm bg-amber-50 text-amber-900 border border-amber-200">
              {typeof error === "string" ? error : error?.message || "Could not load profile."}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-primary" />
                  Personal information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      Full name *
                    </label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition ${
                        errors.fullName ? "border-red-400" : "border-slate-200"
                      }`}
                      placeholder="As per official records"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Mail className="w-4 h-4 text-brand-primary" />
                      Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
                        errors.email ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Phone className="w-4 h-4 text-brand-primary" />
                      Mobile *
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
                        errors.phone ? "border-red-400" : "border-slate-200"
                      }`}
                      placeholder="10-digit number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      Date of birth *
                    </label>
                    <input
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
                        errors.dob ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-brand-primary" />
                  Address & work
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Address *</label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 resize-y ${
                        errors.address ? "border-red-400" : "border-slate-200"
                      }`}
                      placeholder="House no., street, city, PIN"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        <Briefcase className="w-4 h-4 text-brand-primary" />
                        Experience *
                      </label>
                      <select
                        name="experience"
                        value={formData.experience}
                        onChange={(e) => handleInputChange("experience", e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
                          errors.experience ? "border-red-400" : "border-slate-200"
                        }`}
                      >
                        <option value="">Select experience</option>
                        <option value="0-1 Years">0-1 Years</option>
                        <option value="1-2 Years">1-2 Years</option>
                        <option value="2-3 Years">2-3 Years</option>
                        <option value="3-5 Years">3-5 Years</option>
                        <option value="5+ Years">5+ Years</option>
                      </select>
                      {errors.experience && (
                        <p className="text-red-500 text-xs mt-1">{errors.experience}</p>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        <MapPin className="w-4 h-4 text-brand-primary" />
                        Region *
                      </label>
                      <input
                        name="region"
                        value={formData.region}
                        onChange={(e) => handleInputChange("region", e.target.value)}
                        placeholder="Your region / territory"
                        className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
                          errors.region ? "border-red-400" : "border-slate-200"
                        }`}
                      />
                      {errors.region && (
                        <p className="text-red-500 text-xs mt-1">{errors.region}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <p className="text-xs text-slate-500">
                Bank and payout account details are managed separately by admin / compliance. Update only your
                personal and contact information here.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="px-5 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
