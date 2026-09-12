import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  Home,
  Briefcase,
  MapPin,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { getAuthData } from "../utils/localStorage";
import { backendurl } from "../feature/urldata";
import {
  fetchPartnerProfile,
  updatePartnerProfile,
  uploadPartnerAvatar,
} from "../feature/thunks/partnerThunks";
import { statesWithLegacy } from "../utils/indianStates";

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
  const [avatarUploading, setAvatarUploading] = useState(false);

  const authData = useMemo(() => getAuthData() || {}, []);
  const adminToken =
    authData.adminToken ||
    authData.mainParentToken ||
    (authData.parentUser?.role === "SUPER_ADMIN" ? authData.parentToken : null);
  const isAdmin = Boolean(adminToken);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!";
    let pwd = "";
    pwd += "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
    pwd += "abcdefghijkmnpqrstuvwxyz"[Math.floor(Math.random() * 24)];
    pwd += "23456789"[Math.floor(Math.random() * 8)];
    pwd += "@#$!"[Math.floor(Math.random() * 4)];
    for (let i = 0; i < 6; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    setPasswordForm((p) => ({ ...p, newPassword: pwd, confirmPassword: pwd }));
    setShowPassword({ current: false, new: true, confirm: true });
    setPasswordStatus(null);
  };

  const handleCopyPassword = () => {
    if (!passwordForm.newPassword) return;
    navigator.clipboard.writeText(passwordForm.newPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
    toast.success("Password copied to clipboard!");
  };

  const handlePasswordUpdate = async () => {
    setPasswordStatus(null);

    if (!isAdmin && !passwordForm.currentPassword) {
      setPasswordStatus({ type: "err", text: "Current password is required." });
      return false;
    }

    if (!passwordForm.newPassword) {
      setPasswordStatus({ type: "err", text: "New password is required." });
      return false;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({
        type: "err",
        text: "New password must be at least 6 characters.",
      });
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: "err", text: "Passwords do not match." });
      return false;
    }

    setPasswordUpdating(true);
    try {
      if (isAdmin) {
        const targetId = data?._id || data?.id;
        const res = await axios.post(
          `${backendurl}/admin/change-user-password`,
          {
            userId: targetId,
            id: targetId,
            email: form.email || data?.email,
            newPassword: passwordForm.newPassword,
            confirmPassword: passwordForm.confirmPassword,
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );
        const msg = res.data?.message || "Password updated successfully by Admin!";
        toast.success(msg);
        setPasswordStatus({ type: "ok", text: msg });
      } else {
        const userToken = authData.partnerToken;
        const res = await axios.post(
          `${backendurl}/auth/change-password`,
          {
            oldPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
            confirmPassword: passwordForm.confirmPassword,
          },
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
        const msg = res.data?.message || "Password changed successfully!";
        toast.success(msg);
        setPasswordStatus({ type: "ok", text: msg });
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      return true;
    } catch (err) {
      console.error("Password update error:", err);
      const errMsg =
        err.response?.data?.message || err.message || "Failed to update password.";
      setPasswordStatus({ type: "err", text: errMsg });
      return false;
    } finally {
      setPasswordUpdating(false);
    }
  };

  const getErrMsg = (err, fallback) => {
    const data = err?.response?.data;

    if (typeof err === "string") return err;
    if (typeof data === "string" && data) return data;

    return (
      data?.message ||
      data?.msg ||
      err?.message ||
      fallback ||
      "Update failed. Please try again."
    );
  };

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
    if (!form.email?.trim()) e.email = "Email address is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (!form.phone?.trim()) e.phone = "Phone is required";
    else if (form.phone.replace(/\D/g, "").length !== 10) e.phone = "Enter 10-digit mobile";
    if (!form.dob) e.dob = "Date of birth is required";
    if (!form.address?.trim() || form.address.trim().length < 10)
      e.address = "Enter full address (min 10 characters)";
    if (!form.experience?.trim()) e.experience = "Select experience";
    if (!form.region?.trim()) e.region = "State is required";
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
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      dob: form.dob,
      address: form.address.trim(),
      experience: form.experience,
      region: form.region.trim(),
    };

    try {
      await dispatch(updatePartnerProfile(payload)).unwrap();
      let extraMsg = "";
      if (passwordForm.newPassword) {
        const pwOk = await handlePasswordUpdate();
        if (pwOk) extraMsg = " and password";
      }
      setSaveMsg({ type: "ok", text: `Profile${extraMsg} updated successfully.` });
      await dispatch(fetchPartnerProfile());
      setTimeout(() => {
        if (location.state?.from) {
          navigate(location.state.from);
        } else {
          navigate(-1);
        }
      }, 900);
    } catch (err) {
      setSaveMsg({ type: "err", text: getErrMsg(err, "Could not update profile.") });
    }
  };

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    navigate(-1);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setSaveMsg({ type: "err", text: "Please select a valid image file." });
      return;
    }

    setSaveMsg(null);
    setAvatarUploading(true);
    try {
      await dispatch(uploadPartnerAvatar(file)).unwrap();
      setSaveMsg({ type: "ok", text: "Profile photo updated successfully." });
      await dispatch(fetchPartnerProfile());
    } catch (err) {
      setSaveMsg({
        type: "err",
        text: getErrMsg(err, "Could not upload profile photo."),
      });
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
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

          <div className="px-6 pt-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src={data?.profilePic || "https://ui-avatars.com/api/?name=Partner&background=0ea5a5&color=fff"}
                  alt="Profile avatar"
                  className="h-16 w-16 rounded-full object-cover border border-slate-200 bg-white"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">Profile photo</p>
                  <p className="text-xs text-slate-500">
                    Upload a clear square image (JPG, PNG). Used across profile and ID views.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  {avatarUploading ? "Uploading..." : "Upload avatar"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                </label>
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
                  <Phone className="w-5 h-5 text-brand-primary" />
                  Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Mail className="w-4 h-4 text-brand-primary" />
                      Email Address *
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl ${
                        errors.email ? "border-red-400" : "border-slate-200"
                      }`}
                      placeholder="name@example.com"
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
                        State *
                      </label>
                      <select
                        name="region"
                        value={form.region}
                        onChange={(e) => handleChange("region", e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-xl ${
                          errors.region ? "border-red-400" : "border-slate-200"
                        }`}
                      >
                        <option value="">Select state</option>
                        {statesWithLegacy(form.region).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.region && (
                        <p className="text-red-500 text-xs mt-1">{errors.region}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Security & Password */}
              <section className="pt-6 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-brand-primary" />
                    Security & Password
                  </h3>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <KeyRound size={13} className="text-emerald-600" />
                      Admin Override Active
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  <div className="mb-5 p-3.5 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-900">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p>
                        🔑 <strong>Admin Privilege:</strong> You can set a new password directly for this Partner. Current password is not required.
                      </p>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 font-semibold text-teal-800 bg-white hover:bg-teal-100/60 border border-teal-300 rounded-lg shadow-sm transition text-xs"
                      >
                        <Sparkles size={13} className="text-teal-600" />
                        Generate strong password
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mb-4">
                    To change your account password, enter your current password followed by your new password.
                  </p>
                )}

                {passwordStatus && (
                  <div
                    className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-medium ${
                      passwordStatus.type === "ok"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {passwordStatus.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {!isAdmin && (
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        Current Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                          }
                          placeholder="Enter your current password"
                          className="w-full pl-3 pr-10 py-2.5 border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((p) => ({ ...p, current: !p.current }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1.5">
                      <span>New Password {isAdmin ? "(optional)" : "*"}</span>
                      {passwordForm.newPassword && (
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                        >
                          {copiedPassword ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy
                            </>
                          )}
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                        }
                        placeholder={isAdmin ? "Enter new password (min. 6 chars)" : "Choose a strong password"}
                        className="w-full pl-3 pr-10 py-2.5 border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((p) => ({ ...p, new: !p.new }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                        }
                        placeholder="Repeat new password"
                        className="w-full pl-3 pr-10 py-2.5 border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((p) => ({ ...p, confirm: !p.confirm }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordForm.newPassword && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-600">
                      Ready to change password? You can update it right now:
                    </span>
                    <button
                      type="button"
                      disabled={passwordUpdating}
                      onClick={handlePasswordUpdate}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      {passwordUpdating ? "Updating password..." : "Update Password Now"}
                    </button>
                  </div>
                )}
              </section>

              <p className="text-xs text-slate-500">
                Bank account and KYC documents are not edited here — use{" "}
                <span className="font-medium">KYC / documents</span> or contact support for payout details.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={handleBack}
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
