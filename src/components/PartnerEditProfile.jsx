import React, { useState, useEffect, useCallback } from "react";
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
import { fetchPartnerProfile, updatePartnerProfile } from "../feature/thunks/partnerThunks";
import { backendurl } from "../feature/urldata";
import { getAuthData } from "../utils/localStorage";

export default function PartnerEditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, data } = useSelector((s) => s.partner.profile);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
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
    dispatch(fetchPartnerProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!data) return;
    setForm({
      firstName: data.firstName || "",
      middleName: data.middleName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      phone: data.phone || "",
      dob: data.dob ? String(data.dob).slice(0, 10) : "",
      address: data.address || "",
      experience: data.experience || "0-1 Years",
      region: data.region || "",
    });
  }, [data]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.firstName?.trim()) e.firstName = "First name is required";
    if (!form.lastName?.trim()) e.lastName = "Last name is required";
    if (!form.email?.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Invalid email";
    if (!form.phone?.trim()) e.phone = "Phone is required";
    else if (form.phone.replace(/\D/g, "").length !== 10) e.phone = "Enter 10-digit mobile";
    if (!form.dob) e.dob = "Date of birth is required";
    if (!form.address?.trim() || form.address.trim().length < 10)
      e.address = "Enter full address (min 10 characters)";
    if (!form.experience?.trim()) e.experience = "Select experience";
    if (!form.region?.trim()) e.region = "Region is required";
    setErrors(e);
    return { ok: Object.keys(e).length === 0, first: Object.keys(e)[0] };
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setSaveMsg(null);
    const { ok, first } = validate();
    if (!ok && first) {
      document.querySelector(`[name="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!ok) return;

    const payload = {
      firstName: form.firstName.trim(),
      middleName: form.middleName?.trim() || "",
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      dob: form.dob,
      address: form.address.trim(),
      experience: form.experience,
      region: form.region.trim(),
    };

    try {
      const result = await dispatch(updatePartnerProfile(payload)).unwrap();

      if (result?.emailChangePending) {
        setEmailChangePending(true);
        setResendingEmail(false);
        setSaveMsg({
          type: "ok",
          text:
            result.emailChangeMessage ||
            "Email change requested. Please confirm via the link sent to your inbox.",
        });
        await dispatch(fetchPartnerProfile());
        return;
      }

      setEmailChangePending(false);
      setSaveMsg({ type: "ok", text: "Profile updated successfully." });
      await dispatch(fetchPartnerProfile());
      setTimeout(() => {
        if (location.state?.from) {
          navigate(location.state.from);
        } else {
          navigate(-1);
        }
      }, 900);
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err && typeof err === "object" && typeof err.message === "string"
            ? err.message
            : "Update failed. Try again.";
      setSaveMsg({ type: "err", text: msg });
    }
  };

  const handleResendEmailChange = async () => {
    setResendingEmail(true);
    setSaveMsg(null);

    try {
      const { partnerToken } = getAuthData();
      if (!partnerToken) {
        setSaveMsg({
          type: "err",
          text: "Session expired. Please login again to resend the email.",
        });
        return;
      }

      const res = await fetch(`${backendurl}/auth/email-change/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${partnerToken}`,
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

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-brand-primary to-[#0d9d84] text-white">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                className="p-2 hover:bg-white/15 rounded-full transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <User className="w-6 h-6 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">Edit profile</h1>
                <p className="text-sm text-white/90">Partner · Name, contact & region</p>
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
                {resendingEmail ? "Resending verification..." : "Resend verification email"}
              </button>
            </div>
          )}

          {error && !loading && (
            <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm bg-amber-50 text-amber-900 border border-amber-200">
              {typeof error === "string" ? error : error?.message || "Could not load profile."}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-primary" />
                  Name
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">First name *</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl ${
                        errors.firstName ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Middle name</label>
                    <input
                      name="middleName"
                      value={form.middleName}
                      onChange={(e) => handleChange("middleName", e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Last name *</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl ${
                        errors.lastName ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-brand-primary" />
                  Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Mail className="w-4 h-4 text-brand-primary" />
                      Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl ${
                        errors.email ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Phone className="w-4 h-4 text-brand-primary" />
                      Mobile *
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl ${
                        errors.phone ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      Date of birth *
                    </label>
                    <input
                      name="dob"
                      type="date"
                      value={form.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl ${
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
                  Address & region
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Address *</label>
                    <textarea
                      name="address"
                      rows={3}
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl resize-y ${
                        errors.address ? "border-red-400" : "border-slate-200"
                      }`}
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
                        value={form.experience}
                        onChange={(e) => handleChange("experience", e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-xl ${
                          errors.experience ? "border-red-400" : "border-slate-200"
                        }`}
                      >
                        <option value="">Select</option>
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
                        value={form.region}
                        onChange={(e) => handleChange("region", e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-xl ${
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
                Bank account and KYC documents are not edited here — use{" "}
                <span className="font-medium">KYC / documents</span> or contact support for payout details.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => navigate("/partner/profile")}
                className="px-5 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl font-medium"
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
