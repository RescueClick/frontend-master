import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  CreditCard,
  Lock,
  Upload,
  Calendar,
  Eye,
  EyeOff,
  X,
  Shield,
  Check,
} from "lucide-react";
import { signupPartner } from "../feature/thunks/partnerThunks";
import { useDispatch } from "react-redux";
import {
  brandLogo,
  COMPANY_NAME,
  COMPANY_TAGLINE,
} from "../config/branding";

const PASSWORD_MIN_LEN = 8;

const passwordRuleChecks = (pw) => ({
  len: (pw || "").length >= PASSWORD_MIN_LEN,
  upper: /[A-Z]/.test(pw || ""),
  lower: /[a-z]/.test(pw || ""),
  num: /\d/.test(pw || ""),
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw || ""),
});

const passwordMeetsRules = (pw) =>
  Object.values(passwordRuleChecks(pw)).every(Boolean);

const fieldClass = (fieldName, fieldErrors) =>
  [
    "w-full rounded-xl border-2 bg-white/80 px-4 py-3.5 transition focus:outline-none focus:ring-2",
    fieldErrors[fieldName]
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/25"
      : "border-stone-200 focus:border-[#0d9488] focus:ring-[#0d9488]/25",
  ].join(" ");

const PartnerRegistrationForm = () => {
  const [successMessage, setSuccessMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState(""); // "success" or "error"
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [docPreview, setDocPreview] = useState({
    open: false,
    name: "",
    url: "",
    type: "",
  });
  const adharInputRef = useRef(null);
  const panInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    dob: "",
    aadharNumber: "",
    panNumber: "",
    region: "",
    rmCode: "",
    pincode: "",
    employmentType: "",
    address: "",
    homeType: "",
    addressStability: "",
    landmark: "",
    adharCard: null, // assign file via input later
    panCard: null, // assign file via input later
    selfie: null, // assign file via input later
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    password: "",
    confirmPassword: "",
  });

  const showError = (message) => {
    setSuccessMessageType("error");
    setSuccessMessage(message);
    setShowPopup(true);
    return false;
  };

  const pwdChecks = useMemo(
    () => passwordRuleChecks(formData.password),
    [formData.password]
  );

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  }, []);

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    let nextValue;

    if (type === "file") {
      nextValue = files?.[0] ?? null;
    } else if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "aadharNumber") {
      nextValue = value.replace(/\D/g, "").slice(0, 12);
    } else if (name === "pincode") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    } else if (name === "accountNumber") {
      nextValue = value.replace(/\D/g, "").slice(0, 18);
    } else if (name === "panNumber") {
      nextValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
    } else if (name === "ifscCode") {
      nextValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);
    } else if (name === "firstName" || name === "lastName") {
      nextValue = value.replace(/[^A-Za-z\s.'-]/g, "").slice(0, 50);
    } else if (name === "middleName") {
      nextValue = value.replace(/[^A-Za-z\s.'-]/g, "").slice(0, 50);
    } else if (name === "bankName" || name === "region") {
      nextValue = value.slice(0, 120);
    } else {
      nextValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    clearFieldError(name);
  };

  const handleRemoveFile = (name) => {
    setFormData((prev) => ({ ...prev, [name]: null }));
    clearFieldError(name);

    if (name === "adharCard" && adharInputRef.current) {
      adharInputRef.current.value = "";
    }
    if (name === "panCard" && panInputRef.current) {
      panInputRef.current.value = "";
    }
    if (name === "selfie" && selfieInputRef.current) {
      selfieInputRef.current.value = "";
    }
  };

  const validateFormFields = () => {
    const err = {};

    if (!formData.firstName.trim()) err.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2)
      err.firstName = "Enter at least 2 characters";

    if (!formData.lastName.trim()) err.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2)
      err.lastName = "Enter at least 2 characters";

    if (!formData.phone) err.phone = "Mobile number is required";
    else if (!/^[6-9]\d{9}$/.test(formData.phone))
      err.phone = "Enter a valid 10-digit Indian mobile number";

    if (!formData.email.trim()) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      err.email = "Enter a valid email address";

    if (!formData.dob) err.dob = "Date of birth is required";
    else {
      const birth = new Date(`${formData.dob}T12:00:00`);
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      if (birth > cutoff) err.dob = "You must be at least 18 years old";
    }

    if (!formData.employmentType)
      err.employmentType = "Select employment type";

    if (!formData.aadharNumber) err.aadharNumber = "Aadhaar number is required";
    else if (!/^\d{12}$/.test(formData.aadharNumber))
      err.aadharNumber = "Enter 12 digits (no spaces)";

    if (!formData.panNumber) err.panNumber = "PAN is required";
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber))
      err.panNumber = "Invalid PAN (format ABCDE1234F)";

    if (!formData.region.trim()) err.region = "Region is required";

    if (!formData.address.trim()) err.address = "Complete address is required";
    else if (formData.address.trim().length < 10)
      err.address = "Please enter a fuller address (min 10 characters)";

    if (!formData.pincode) err.pincode = "PIN code is required";
    else if (!/^\d{6}$/.test(formData.pincode))
      err.pincode = "Enter a valid 6-digit PIN code";

    if (!formData.homeType) err.homeType = "Select Own or Rented";

    if (!formData.addressStability.trim())
      err.addressStability = "Enter how long you’ve stayed at this address";
    if (!formData.bankName.trim()) err.bankName = "Bank name is required";
    if (!formData.accountNumber.trim())
      err.accountNumber = "Account number is required";
    else if (!/^\d{9,18}$/.test(formData.accountNumber))
      err.accountNumber = "Enter 9–18 digits only";

    if (!formData.ifscCode.trim()) err.ifscCode = "IFSC is required";
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode))
      err.ifscCode = "Invalid IFSC (e.g. SBIN0001234)";

    if (!formData.password) err.password = "Password is required";
    else if (!passwordMeetsRules(formData.password))
      err.password = "Password must meet all rules below";

    if (!formData.confirmPassword)
      err.confirmPassword = "Confirm your password";
    else if (formData.password !== formData.confirmPassword)
      err.confirmPassword = "Passwords do not match";

    const docMimeOk = (file, allowPdf) => {
      if (!file) return false;
      const t = (file.type || "").toLowerCase();
      if (t === "application/pdf" && allowPdf) return true;
      if (t === "image/jpeg" || t === "image/png" || t === "image/jpg")
        return true;
      const n = (file.name || "").toLowerCase();
      if (allowPdf && n.endsWith(".pdf")) return true;
      if (/\.(jpe?g|png)$/i.test(n)) return true;
      return false;
    };

    if (!formData.adharCard) err.adharCard = "Upload Aadhaar (PDF, JPG or PNG)";
    else if (!docMimeOk(formData.adharCard, true))
      err.adharCard = "Use PDF, JPG or PNG (max 5MB)";

    if (!formData.panCard) err.panCard = "Upload PAN (PDF, JPG or PNG)";
    else if (!docMimeOk(formData.panCard, true))
      err.panCard = "Use PDF, JPG or PNG (max 5MB)";

    if (!formData.selfie) err.selfie = "Upload a selfie (JPG or PNG)";
    else if (!docMimeOk(formData.selfie, false))
      err.selfie = "Use JPG or PNG for selfie (max 5MB)";

    const maxFileSize = 5 * 1024 * 1024;
    if (formData.adharCard?.size > maxFileSize)
      err.adharCard = "Aadhaar file must be 5MB or less";
    if (formData.panCard?.size > maxFileSize)
      err.panCard = "PAN file must be 5MB or less";
    if (formData.selfie?.size > maxFileSize)
      err.selfie = "Selfie must be 5MB or less";

    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFormFields()) {
      return;
    }

    const newFormData = {
      firstName: formData.firstName,
      middleName: formData.middleName || null,
      lastName: formData.lastName || null,
      phone: formData.phone,
      email: formData.email,
      dob: formData.dob || null,
      aadharNumber: formData.aadharNumber,
      panNumber: formData.panNumber,
      region: formData.region || null,
      rmcode: formData.rmCode || null,
      pincode: formData.pincode || null,
      employmentType: formData.employmentType || null,
      address: formData.address || null,
      homeType: formData.homeType || null,
      addressStability: formData.addressStability || null,
      landmark: formData.landmark || null,
      bankName: formData.bankName || null,
      accountNumber: formData.accountNumber || null,
      ifscCode: formData.ifscCode || null,
      password: formData.password,
    };

    // ✅ Build FormData
    const formDataToSend = new FormData();

    // Append JSON as a string
    formDataToSend.append("newFormData", JSON.stringify(newFormData));

    // Append files if present
    if (formData.adharCard) {
      formDataToSend.append("adharCard", formData.adharCard);
    }
    if (formData.panCard) {
      formDataToSend.append("panCard", formData.panCard);
    }
    if (formData.selfie) {
      formDataToSend.append("selfie", formData.selfie);
    }

    setIsLoading(true); // start spinner

    try {
      const response = await dispatch(signupPartner(formDataToSend)).unwrap();

      setSuccessMessageType("success");
      setSuccessMessage(
        response?.message || "Registration successful!"
      );
      setShowPopup(true);
      resetFields();
      setTimeout(() => navigate("/LoginPage"), 800);
    } catch (err) {
      const backendMsg =
        err?.message ||
        err?.error ||
        err?.payload?.message ||
        "Registration failed. Please try again.";
      showError(backendMsg);
    } finally {
      setIsLoading(false); // stop spinner
    }
  };

  const resetFields = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      email: "",
      dob: "",
      aadharNumber: "",
      panNumber: "",
      region: "",
      rmCode: "",
      pincode: "",
      employmentType: "",
      address: "",
      homeType: "",
      addressStability: "",
      landmark: "",
      adharCard: null, // assign file via input later
      panCard: null, // assign file via input later
      selfie: null, // assign file via input later
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      password: "",
    confirmPassword: "",
    });
  };

  useEffect(() => {
    return () => {
      if (docPreview.url) {
        URL.revokeObjectURL(docPreview.url);
      }
    };
  }, [docPreview.url]);

  const openDocPreview = (file) => {
    if (!file) return;
    if (docPreview.url) {
      URL.revokeObjectURL(docPreview.url);
    }
    const nextUrl = URL.createObjectURL(file);
    const nextType = (file.type || "").toLowerCase();
    setDocPreview({
      open: true,
      name: file.name || "Document preview",
      url: nextUrl,
      type: nextType,
    });
  };

  const closeDocPreview = () => {
    if (docPreview.url) {
      URL.revokeObjectURL(docPreview.url);
    }
    setDocPreview({
      open: false,
      name: "",
      url: "",
      type: "",
    });
  };

  const isPdfPreview = docPreview.type === "application/pdf";

  return (
    <>
      {docPreview.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={closeDocPreview}
          role="presentation"
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <p className="truncate pr-4 text-sm font-semibold text-stone-700">
                {docPreview.name}
              </p>
              <button
                type="button"
                onClick={closeDocPreview}
                className="rounded-md p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-red-600"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-auto bg-stone-50 p-4">
              {isPdfPreview ? (
                <iframe
                  title="Document preview"
                  src={docPreview.url}
                  className="h-[72vh] w-full rounded-lg border border-stone-200 bg-white"
                />
              ) : (
                <img
                  src={docPreview.url}
                  alt={docPreview.name}
                  className="mx-auto max-h-[72vh] w-auto rounded-lg border border-stone-200 bg-white object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
          onClick={() => setShowPopup(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white p-6 text-center shadow-2xl shadow-teal-900/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                successMessageType === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {successMessageType === "success" ? (
                <Shield className="h-6 w-6" strokeWidth={2} />
              ) : (
                <X className="h-6 w-6" />
              )}
            </div>
            <h2
              className={`text-lg font-semibold ${
                successMessageType === "success"
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {successMessageType === "success" ? "Application submitted" : "Something went wrong"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-6 w-full rounded-xl bg-[#0d9488] py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-stone-100 via-teal-50/40 to-amber-50/35">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(13,148,136,0.12),transparent)]" />
        <div className="relative px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-14 max-w-[260px] items-center justify-center rounded-2xl border border-white/40 bg-white/95 px-4 shadow-lg shadow-teal-900/10 backdrop-blur-sm">
              <img
                src={brandLogo}
                alt={COMPANY_NAME}
                className="max-h-10 w-full object-contain"
              />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0d9488]">
              Partner onboarding
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Become a {COMPANY_NAME} partner
            </h1>
            <p className="mt-2 text-stone-600">{COMPANY_TAGLINE}</p>
            <p className="mx-auto mt-4 max-w-lg text-sm text-stone-500">
              Trusted lending marketplace: complete all sections. Fields marked * are required.
            </p>
            <Link
              to="/LoginPage"
              className="mt-4 inline-block text-sm font-medium text-[#0d9488] underline-offset-4 hover:underline"
            >
              Already registered? Sign in
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-2xl shadow-teal-900/10 backdrop-blur-md"
            noValidate
          >
            {/* Personal Information Section */}
            <div className="p-8 space-y-8 bg-gray-50 rounded-2xl shadow-md">
              {/* Personal Information */}

              <section className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 space-y-8">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] shadow-md shadow-teal-900/15">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-stone-800">
                    Personal Information
                  </h2>
                </div>

                <div className="grid gap-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative">
                      <label className="mb-2 block font-semibold text-stone-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ""}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        className={fieldClass("firstName", fieldErrors)}
                        autoComplete="given-name"
                      />
                      {fieldErrors.firstName && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="mb-2 block font-semibold text-stone-700">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName || ""}
                        onChange={handleChange}
                        placeholder="Enter middle name (optional)"
                        className={fieldClass("middleName", fieldErrors)}
                        autoComplete="additional-name"
                      />
                      {fieldErrors.middleName && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.middleName}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="mb-2 block font-semibold text-stone-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ""}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        className={fieldClass("lastName", fieldErrors)}
                        autoComplete="family-name"
                      />
                      {fieldErrors.lastName && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                        <Phone className="h-4 w-4 text-[#0d9488]" /> Mobile
                        Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        inputMode="numeric"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        className={fieldClass("phone", fieldErrors)}
                        autoComplete="tel"
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                        <Mail className="h-4 w-4 text-[#0d9488]" /> Email
                        Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        className={fieldClass("email", fieldErrors)}
                        autoComplete="email"
                      />
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Employment Type & DOB */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                        <Building2 className="h-4 w-4 text-[#0d9488]" />{" "}
                        Employment Type *
                      </label>
                      <select
                        name="employmentType"
                        value={formData.employmentType}
                        onChange={handleChange}
                        className={fieldClass("employmentType", fieldErrors)}
                      >
                        <option value="">Select employment type</option>
                        <option value="Fulltime">Fulltime</option>
                        <option value="Parttime">Parttime</option>
                      </select>
                      {fieldErrors.employmentType && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.employmentType}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                        <Calendar className="h-4 w-4 text-[#0d9488]" /> Date
                        of Birth *
                      </label>
                      <input
                        type="date"
                        name="dob"
                        max={maxDob}
                        value={formData.dob}
                        onChange={handleChange}
                        className={fieldClass("dob", fieldErrors)}
                      />
                      {fieldErrors.dob && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.dob}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                        Aadhaar Number *
                      </label>
                      <input
                        type="text"
                        name="aadharNumber"
                        inputMode="numeric"
                        value={formData.aadharNumber || ""}
                        onChange={handleChange}
                        placeholder="12-digit Aadhaar"
                        className={fieldClass("aadharNumber", fieldErrors)}
                        maxLength={12}
                      />
                      {fieldErrors.aadharNumber && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.aadharNumber}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                        PAN Number *
                      </label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber || ""}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        className={fieldClass("panNumber", fieldErrors)}
                        maxLength={10}
                      />
                      {fieldErrors.panNumber && (
                        <p className="mt-1.5 text-sm text-red-600">
                          {fieldErrors.panNumber}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                        <Lock className="h-4 w-4 text-[#0d9488]" /> RM Code{" "}
                        <span className="ml-1 text-xs font-normal text-stone-400">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="rmCode"
                        value={formData.rmCode || ""}
                        onChange={handleChange}
                        placeholder="Enter RM code (if any)"
                        className="w-full rounded-xl border-2 border-stone-200 bg-white/80 px-4 py-3.5 transition focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/25"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        RM code is optional. If you have been referred by a
                        Relationship Manager, please enter their code here.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Address Details */}
              <section className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 space-y-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Address Details
                </h2>

                {/* Region */}
                <div className="relative">
                  <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                    <MapPin className="h-4 w-4 text-[#0d9488]" /> Region *
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region || ""}
                    onChange={handleChange}
                    placeholder="Enter your region"
                    className={fieldClass("region", fieldErrors)}
                  />
                  {fieldErrors.region && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.region}
                    </p>
                  )}
                </div>

                {/* Complete Address */}
                <div className="relative">
                  <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                    <MapPin className="h-4 w-4 text-[#0d9488]" /> Complete
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your complete address"
                    rows="4"
                    className={`${fieldClass("address", fieldErrors)} resize-none`}
                  />
                  {fieldErrors.address && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.address}
                    </p>
                  )}
                </div>

                {/* Pincode & Own/Rented */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="relative">
                    <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                      <MapPin className="h-4 w-4 text-[#0d9488]" /> Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      inputMode="numeric"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="6-digit PIN"
                      className={fieldClass("pincode", fieldErrors)}
                      maxLength={6}
                    />
                    {fieldErrors.pincode && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {fieldErrors.pincode}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                      <Building2 className="h-4 w-4 text-[#0d9488]" /> Own /
                      Rented *
                    </label>
                    <select
                      name="homeType"
                      value={formData.homeType}
                      onChange={handleChange}
                      className={fieldClass("homeType", fieldErrors)}
                    >
                      <option value="">Select</option>
                      <option value="Own">Own</option>
                      <option value="Rented">Rented</option>
                    </select>
                    {fieldErrors.homeType && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {fieldErrors.homeType}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address Stability & Landmark */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="relative">
                    <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                      <Building2 className="h-4 w-4 text-[#0d9488]" /> Address
                      Stability *
                    </label>
                    <input
                      type="text"
                      name="addressStability"
                      value={formData.addressStability}
                      onChange={handleChange}
                      placeholder="e.g., 2 years"
                      className={fieldClass("addressStability", fieldErrors)}
                    />
                    {fieldErrors.addressStability && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {fieldErrors.addressStability}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                      <MapPin className="h-4 w-4 text-[#0d9488]" /> Landmark
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder="Enter nearby landmark (optional)"
                      className="w-full rounded-xl border-2 border-stone-200 bg-white/80 px-4 py-3.5 transition focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/25"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Document Upload Section */}
            <div className="border-b border-stone-100 p-8">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e]">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">
                  Document Upload
                </h2>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative group">
                  <label className=" text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    Aadhaar Card <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="adharCard"
                      ref={adharInputRef}
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleChange}
                      className={`w-full cursor-pointer rounded-xl border-2 bg-white/80 p-4 pr-24 text-transparent caret-transparent transition file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-[#0d9488] file:to-[#0f766e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 ${
                        fieldErrors.adharCard
                          ? "border-red-400"
                          : "border-stone-200"
                      }`}
                    />
                    {formData.adharCard && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("adharCard")}
                        className="absolute inset-y-0 right-12 flex items-center text-slate-500 hover:text-red-600"
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="mt-2 text-sm text-slate-600 flex items-center justify-between">
                    <span className="truncate max-w-[80%]">
                      {formData.adharCard
                        ? formData.adharCard.name
                        : "No file selected"}
                    </span>
                    <span className="text-xs text-slate-500">Max 5MB</span>
                  </div>
                  {formData.adharCard && (
                    <button
                      type="button"
                      onClick={() => openDocPreview(formData.adharCard)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e]"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                  )}
                  {fieldErrors.adharCard && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.adharCard}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <label className=" text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    PAN Card <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="panCard"
                      ref={panInputRef}
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleChange}
                      className={`w-full cursor-pointer rounded-xl border-2 bg-white/80 p-4 pr-24 text-transparent caret-transparent transition file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-[#0d9488] file:to-[#0f766e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 ${
                        fieldErrors.panCard
                          ? "border-red-400"
                          : "border-stone-200"
                      }`}
                    />
                    {formData.panCard && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("panCard")}
                        className="absolute inset-y-0 right-12 flex items-center text-slate-500 hover:text-red-600"
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="mt-2 text-sm text-slate-600 flex items-center justify-between">
                    <span className="truncate max-w-[80%]">
                      {formData.panCard
                        ? formData.panCard.name
                        : "No file selected"}
                    </span>
                    <span className="text-xs text-slate-500">Max 5MB</span>
                  </div>
                  {formData.panCard && (
                    <button
                      type="button"
                      onClick={() => openDocPreview(formData.panCard)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e]"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                  )}
                  {fieldErrors.panCard && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.panCard}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <label className=" text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500" />
                    Selfie Photo <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="selfie"
                      ref={selfieInputRef}
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleChange}
                      className={`w-full cursor-pointer rounded-xl border-2 bg-white/80 p-4 pr-24 text-transparent caret-transparent transition file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-[#0d9488] file:to-[#0f766e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 ${
                        fieldErrors.selfie
                          ? "border-red-400"
                          : "border-stone-200"
                      }`}
                    />
                    {formData.selfie && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("selfie")}
                        className="absolute inset-y-0 right-12 flex items-center text-slate-500 hover:text-red-600"
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="mt-2 text-sm text-slate-600 flex items-center justify-between">
                    <span className="truncate max-w-[80%]">
                      {formData.selfie
                        ? formData.selfie.name
                        : "No file selected"}
                    </span>
                    <span className="text-xs text-slate-500">Max 5MB</span>
                  </div>
                  {formData.selfie && (
                    <button
                      type="button"
                      onClick={() => openDocPreview(formData.selfie)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e]"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                  )}
                  {fieldErrors.selfie && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.selfie}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank KYC Section */}
            <div className="border-b border-stone-100 p-8">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e]">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">
                  Bank KYC Details
                </h2>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="relative">
                  <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                    <Building2 className="h-4 w-4 text-[#0d9488]" />
                    Bank Name <span className="text-[#0d9488]">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={fieldClass("bankName", fieldErrors)}
                    placeholder="Enter bank name"
                  />
                  {fieldErrors.bankName && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.bankName}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                    <CreditCard className="h-4 w-4 text-[#0d9488]" />
                    Account Number <span className="text-[#0d9488]">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    inputMode="numeric"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className={fieldClass("accountNumber", fieldErrors)}
                    placeholder="9–18 digits"
                  />
                  {fieldErrors.accountNumber && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.accountNumber}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="mb-2 flex items-center gap-2 font-semibold text-stone-700">
                    <Building2 className="h-4 w-4 text-[#0d9488]" />
                    IFSC Code <span className="text-[#0d9488]">*</span>
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    className={fieldClass("ifscCode", fieldErrors)}
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                  />
                  {fieldErrors.ifscCode && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.ifscCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e]">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">Security</h2>
              </div>

            <div className="grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-stone-600">
                  Password must meet every rule below ({PASSWORD_MIN_LEN}+ characters):
                </p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { key: "len", label: `At least ${PASSWORD_MIN_LEN} characters` },
                    { key: "upper", label: "One uppercase letter (A–Z)" },
                    { key: "lower", label: "One lowercase letter (a–z)" },
                    { key: "num", label: "One number (0–9)" },
                    { key: "special", label: "One special character (!@#…)" },
                  ].map(({ key, label }) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-sm text-stone-600"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          pwdChecks[key]
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {pwdChecks[key] ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : null}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-stone-700">
                  <Lock className="h-4 w-4 text-[#0d9488]" />
                  Create password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.password ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className={`${fieldClass("password", fieldErrors)} pr-12`}
                    placeholder="Strong password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        password: !prev.password,
                      }))
                    }
                    className="absolute inset-y-0 right-4 flex items-center text-stone-500 hover:text-stone-700"
                  >
                    {showPassword.password ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-stone-700">
                  <Lock className="h-4 w-4 text-[#0d9488]" />
                  Confirm password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className={`${fieldClass("confirmPassword", fieldErrors)} pr-12`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        confirmPassword: !prev.confirmPassword,
                      }))
                    }
                    className="absolute inset-y-0 right-4 flex items-center text-stone-500 hover:text-stone-700"
                  >
                    {showPassword.confirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            </div>

            <div className="border-t border-stone-100 bg-stone-50/80 px-8 py-8">
              <button
                disabled={isLoading}
                type="submit"
                className={`flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold text-white shadow-lg transition md:w-auto ${
                  isLoading
                    ? "cursor-not-allowed bg-[#0f766e]/70"
                    : "bg-[#0d9488] hover:bg-[#0f766e] hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  "Submit application"
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </>
  );
};

export default PartnerRegistrationForm;
