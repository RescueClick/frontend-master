import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
} from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  ChevronRight,
  ChevronLeft,
  Banknote,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { signupPartner } from "../feature/thunks/partnerThunks";
import { normalizeMobileDigits } from "../utils/phoneNormalize";
import { useDispatch } from "react-redux";
import {
  brandLogo,
  COMPANY_NAME,
  COMPANY_TAGLINE,
} from "../config/branding";
import { INDIAN_STATES } from "../utils/indianStates";

const PASSWORD_MIN_LEN = 8;
const MAX_PARTNER_DOC_BYTES = 5 * 1024 * 1024;
const PARTNER_FILE_TOO_LARGE_MSG =
  "This file is larger than 5MB. Please upload a smaller JPG, PNG, or PDF.";

const passwordRuleChecks = (pw) => ({
  len: (pw || "").length >= PASSWORD_MIN_LEN,
  upper: /[A-Z]/.test(pw || ""),
  lower: /[a-z]/.test(pw || ""),
  num: /\d/.test(pw || ""),
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw || ""),
});

const passwordMeetsRules = (pw) =>
  Object.values(passwordRuleChecks(pw)).every(Boolean);

function shouldEmbedPdfInIframe() {
  if (typeof window === "undefined") return true;
  try {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const mobileUa = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
    return !coarse && !mobileUa;
  } catch {
    return true;
  }
}

function partnerRefFromSearchParams(searchParams) {
  if (!searchParams) return "";
  const keys = ["ref", "partnerCode", "partnerReferralCode", "code"];
  for (const key of keys) {
    const raw = searchParams.get(key);
    const trimmed = (raw || "").trim();
    if (!trimmed) continue;
    const upper = trimmed.toUpperCase();
    if (upper.startsWith("PT-") || upper.startsWith("RM-")) return upper;
  }
  return "";
}

const STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "KYC & Identity", icon: CreditCard },
  { id: 3, label: "Address & Bank", icon: MapPin },
  { id: 4, label: "Documents", icon: FileText },
];

const inputBase =
  "w-full min-w-0 rounded-xl border-2 bg-white/90 px-4 py-3 text-sm text-stone-800 placeholder-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 sm:py-3.5 sm:text-base";
const inputOk = "border-stone-200 focus:border-[#0d9488] focus:ring-[#0d9488]/20";
const inputErr = "border-red-400 focus:border-red-500 focus:ring-red-400/20";

const fieldClass = (name, errors) =>
  `${inputBase} ${errors[name] ? inputErr : inputOk}`;

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1.5 text-xs font-medium text-red-600">{msg}</p> : null;

const Label = ({ children, required }) => (
  <label className="mb-1.5 block text-sm font-semibold text-stone-700">
    {children}
    {required && <span className="ml-1 text-[#0d9488]">*</span>}
  </label>
);

const PartnerRegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState("forward"); // forward | back
  const [animating, setAnimating] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [docPreview, setDocPreview] = useState({ open: false, name: "", url: "", type: "" });

  const adharInputRef = useRef(null);
  const panInputRef = useRef(null);
  const selfieCameraInputRef = useRef(null);
  const selfieGalleryInputRef = useRef(null);
  const formCardRef = useRef(null);

  const [embedPdfInIframe, setEmbedPdfInIframe] = useState(shouldEmbedPdfInIframe);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "",
    phone: "", email: "", dob: "",
    employmentType: "",
    aadharNumber: "", panNumber: "", partnerReferralCode: "",
    region: "", address: "", pincode: "",
    homeType: "", addressStability: "", landmark: "",
    bankName: "", accountNumber: "", ifscCode: "",
    adharCard: null, panCard: null, selfie: null,
    password: "", confirmPassword: "",
  });

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const filled = Object.values(formData).some((val) => {
        if (typeof val === "string") return val.trim().length > 0;
        return val !== null && val !== undefined;
      });
      if (filled && !isLoading && !successMessage) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, isLoading, successMessage]);

  const pwdChecks = useMemo(() => passwordRuleChecks(formData.password), [formData.password]);

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
      const f = files?.[0] ?? null;
      if (f && f.size > MAX_PARTNER_DOC_BYTES) {
        e.target.value = "";
        setFieldErrors((prev) => ({ ...prev, [name]: PARTNER_FILE_TOO_LARGE_MSG }));
        setFormData((prev) => ({ ...prev, [name]: null }));
        return;
      }
      nextValue = f;
      setFormData((prev) => ({ ...prev, [name]: nextValue }));
      clearFieldError(name);
      if (f) toast.success(`${f.name} selected`, { duration: 2500 });
      return;
    } else if (name === "phone") {
      nextValue = normalizeMobileDigits(value);
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
    } else if (name === "partnerReferralCode") {
      nextValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
    } else if (name === "firstName" || name === "lastName" || name === "middleName") {
      nextValue = value.replace(/[^A-Za-z\s.'-]/g, "").slice(0, 50);
    } else if (name === "bankName") {
      nextValue = value.slice(0, 120);
    } else if (name === "region") {
      nextValue = value;
    } else if (name === "addressStability") {
      nextValue = value.replace(/\D/g, "").slice(0, 3);
    } else if (name === "dob") {
      // Clean non-digits
      const d = value.replace(/\D/g, "");
      let formatted = d;
      if (d.length > 4) {
        formatted = d.slice(0, 4) + "-" + d.slice(4);
      }
      if (d.length > 6) {
        formatted = formatted.slice(0, 7) + "-" + d.slice(6, 8);
      }
      nextValue = formatted.slice(0, 10);
    } else {
      nextValue = value;
    }
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    clearFieldError(name);
  };

  const handleRemoveFile = (name) => {
    setFormData((prev) => ({ ...prev, [name]: null }));
    clearFieldError(name);
    if (name === "adharCard" && adharInputRef.current) adharInputRef.current.value = "";
    if (name === "panCard" && panInputRef.current) panInputRef.current.value = "";
    if (name === "selfie") {
      if (selfieCameraInputRef.current) selfieCameraInputRef.current.value = "";
      if (selfieGalleryInputRef.current) selfieGalleryInputRef.current.value = "";
    }
  };

  // Per-step validation
  const validateStep = (step) => {
    const err = {};
    if (step === 1) {
      if (!formData.firstName.trim()) err.firstName = "First name is required";
      else if (formData.firstName.trim().length < 2) err.firstName = "Min 2 characters";
      if (!formData.lastName.trim()) err.lastName = "Last name is required";
      else if (formData.lastName.trim().length < 2) err.lastName = "Min 2 characters";
      if (!formData.phone) err.phone = "Mobile number is required";
      else if (!/^\d{10}$/.test(formData.phone)) err.phone = "Enter exactly 10 digits";
      if (!formData.email.trim()) err.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) err.email = "Enter a valid email";
      if (!formData.dob) err.dob = "Date of birth is required";
      else {
        const birth = new Date(`${formData.dob}T12:00:00`);
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 18);
        if (birth > cutoff) err.dob = "Must be at least 18 years old";
      }
      if (!formData.employmentType) err.employmentType = "Select employment type";
    }
    if (step === 2) {
      if (!formData.aadharNumber) err.aadharNumber = "Aadhaar number is required";
      else if (!/^\d{12}$/.test(formData.aadharNumber)) err.aadharNumber = "Enter 12 digits";
      if (!formData.panNumber) err.panNumber = "PAN is required";
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) err.panNumber = "Invalid PAN (e.g. ABCDE1234F)";
      if (formData.partnerReferralCode?.trim()) {
        const code = formData.partnerReferralCode.trim();
        if (!/^(PT-|RM-)[A-Z0-9]+$/.test(code)) err.partnerReferralCode = "Must start with PT- or RM-";
      }
    }
    if (step === 3) {
      if (!formData.region.trim()) err.region = "State is required";
      if (!formData.address.trim()) err.address = "Address is required";
      else if (formData.address.trim().length < 10) err.address = "Enter a fuller address (min 10 chars)";
      if (!formData.pincode) err.pincode = "PIN code is required";
      else if (!/^\d{6}$/.test(formData.pincode)) err.pincode = "Enter a valid 6-digit PIN";
      if (!formData.homeType) err.homeType = "Select Own or Rented";
      if (!formData.addressStability?.trim()) err.addressStability = "Enter months stayed at this address";
      else if (!/^\d+$/.test(formData.addressStability)) err.addressStability = "Numbers only (e.g. 24)";
      if (!formData.bankName.trim()) err.bankName = "Bank name is required";
      if (!formData.accountNumber.trim()) err.accountNumber = "Account number is required";
      else if (!/^\d{9,18}$/.test(formData.accountNumber)) err.accountNumber = "Enter 9–18 digits";
      if (!formData.ifscCode.trim()) err.ifscCode = "IFSC is required";
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) err.ifscCode = "Invalid IFSC (e.g. SBIN0001234)";
    }
    if (step === 4) {
      const docMimeOk = (file, allowPdf) => {
        if (!file) return false;
        const t = (file.type || "").toLowerCase();
        if (t === "application/pdf" && allowPdf) return true;
        if (t === "image/jpeg" || t === "image/png" || t === "image/jpg") return true;
        const n = (file.name || "").toLowerCase();
        if (allowPdf && n.endsWith(".pdf")) return true;
        if (/\.(jpe?g|png)$/i.test(n)) return true;
        return false;
      };
      if (!formData.adharCard) err.adharCard = "Upload Aadhaar (PDF, JPG or PNG)";
      else if (!docMimeOk(formData.adharCard, true)) err.adharCard = "Use PDF, JPG or PNG (max 5MB)";
      else if (formData.adharCard.size > MAX_PARTNER_DOC_BYTES) err.adharCard = PARTNER_FILE_TOO_LARGE_MSG;
      if (!formData.panCard) err.panCard = "Upload PAN (PDF, JPG or PNG)";
      else if (!docMimeOk(formData.panCard, true)) err.panCard = "Use PDF, JPG or PNG (max 5MB)";
      else if (formData.panCard.size > MAX_PARTNER_DOC_BYTES) err.panCard = PARTNER_FILE_TOO_LARGE_MSG;
      if (!formData.selfie) err.selfie = "Upload a selfie (JPG or PNG)";
      else if (!docMimeOk(formData.selfie, false)) err.selfie = "Use JPG or PNG for selfie (max 5MB)";
      else if (formData.selfie.size > MAX_PARTNER_DOC_BYTES) err.selfie = PARTNER_FILE_TOO_LARGE_MSG;
      if (!formData.password) err.password = "Password is required";
      else if (!passwordMeetsRules(formData.password)) err.password = "Password must meet all rules";
      if (!formData.confirmPassword) err.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword) err.confirmPassword = "Passwords do not match";
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const goToStep = (next) => {
    if (animating) return;
    setDirection(next > currentStep ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(next);
      setAnimating(false);
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) goToStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const phoneTen = normalizeMobileDigits(formData.phone);
    const newFormData = {
      firstName: formData.firstName, middleName: formData.middleName || null,
      lastName: formData.lastName || null, phone: phoneTen, email: formData.email,
      dob: formData.dob || null, aadharNumber: formData.aadharNumber,
      panNumber: formData.panNumber, region: formData.region || null,
      partnerReferralCode: formData.partnerReferralCode?.trim() || null,
      referralCode: formData.partnerReferralCode?.trim() || null,
      pincode: formData.pincode || null, employmentType: formData.employmentType || null,
      address: formData.address || null, homeType: formData.homeType || null,
      addressStability: formData.addressStability || null,
      landmark: formData.landmark || null, bankName: formData.bankName || null,
      accountNumber: formData.accountNumber || null, ifscCode: formData.ifscCode || null,
      password: formData.password,
    };

    const formDataToSend = new FormData();
    formDataToSend.append("newFormData", JSON.stringify(newFormData));
    if (formData.adharCard) formDataToSend.append("adharCard", formData.adharCard);
    if (formData.panCard) formDataToSend.append("panCard", formData.panCard);
    if (formData.selfie) formDataToSend.append("selfie", formData.selfie);

    setIsLoading(true);
    try {
      const response = await dispatch(signupPartner(formDataToSend)).unwrap();
      setSuccessMessageType("success");
      setSuccessMessage(response?.message || "Registration successful!");
      setShowPopup(true);
      resetFields();
    } catch (err) {
      const payload = err?.payload;
      const backendMsg =
        (typeof payload === "string" && payload.trim()) ||
        payload?.message || err?.message ||
        "Registration failed. Please try again.";
      setSuccessMessageType("error");
      setSuccessMessage(backendMsg);
      setShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFields = () => {
    setFormData({
      firstName: "", middleName: "", lastName: "", phone: "", email: "",
      dob: "", employmentType: "", aadharNumber: "", panNumber: "",
      partnerReferralCode: "", region: "", address: "", pincode: "",
      homeType: "", addressStability: "", landmark: "", bankName: "",
      accountNumber: "", ifscCode: "", adharCard: null, panCard: null,
      selfie: null, password: "", confirmPassword: "",
    });
    if (adharInputRef.current) adharInputRef.current.value = "";
    if (panInputRef.current) panInputRef.current.value = "";
    if (selfieCameraInputRef.current) selfieCameraInputRef.current.value = "";
    if (selfieGalleryInputRef.current) selfieGalleryInputRef.current.value = "";
  };

  const searchKey = searchParams.toString();
  useLayoutEffect(() => {
    const code = partnerRefFromSearchParams(searchParams);
    if (!code) return;
    setFormData((prev) => ({ ...prev, partnerReferralCode: code }));
  }, [searchKey]);

  useEffect(() => {
    return () => { if (docPreview.url) URL.revokeObjectURL(docPreview.url); };
  }, [docPreview.url]);

  useEffect(() => {
    const sync = () => setEmbedPdfInIframe(shouldEmbedPdfInIframe());
    sync();
    window.addEventListener("resize", sync);
    const mq = window.matchMedia("(pointer: coarse)");
    mq.addEventListener("change", sync);
    return () => { window.removeEventListener("resize", sync); mq.removeEventListener("change", sync); };
  }, []);

  const openDocPreview = (file) => {
    if (!file) return;
    if (docPreview.url) URL.revokeObjectURL(docPreview.url);
    setDocPreview({ open: true, name: file.name || "Document", url: URL.createObjectURL(file), type: (file.type || "").toLowerCase() });
  };

  const closeDocPreview = () => {
    if (docPreview.url) URL.revokeObjectURL(docPreview.url);
    setDocPreview({ open: false, name: "", url: "", type: "" });
  };

  const isPdfPreview = docPreview.type === "application/pdf";

  // --- File upload card component ---
  const FileUploadCard = ({ name, label, icon: Icon, accept, inputRef, allowPdf = true }) => (
    <div className="flex flex-col gap-2">
      <Label required>{label}</Label>
      <div
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer hover:border-[#0d9488]/60 hover:bg-teal-50/40 ${
          fieldErrors[name] ? "border-red-400 bg-red-50/30" : formData[name] ? "border-emerald-400 bg-emerald-50/30" : "border-stone-200 bg-white/70"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          name={name}
          ref={inputRef}
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />
        {formData[name] ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="max-w-full truncate text-sm font-semibold text-emerald-700">{formData[name].name}</p>
            <div className="flex gap-3">
              <button type="button" onClick={(e) => { e.stopPropagation(); openDocPreview(formData[name]); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0d9488]/30 bg-white px-3 py-1 text-xs font-semibold text-[#0d9488] transition hover:bg-teal-50">
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveFile(name); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
              <Icon className="h-6 w-6 text-[#0d9488]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700">Click to upload</p>
              <p className="mt-0.5 text-xs text-stone-400">{allowPdf ? "PDF, JPG or PNG" : "JPG or PNG"} · max 5MB</p>
            </div>
          </>
        )}
      </div>
      <FieldError msg={fieldErrors[name]} />
    </div>
  );

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <>
      {/* Doc Preview Modal */}
      {docPreview.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6" onClick={closeDocPreview} role="presentation">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
              <p className="truncate pr-4 text-sm font-semibold text-stone-700">{docPreview.name}</p>
              <button type="button" onClick={closeDocPreview} className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-red-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-stone-50 p-4">
              {isPdfPreview && !embedPdfInIframe ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <FileText className="h-14 w-14 text-stone-400" />
                  <p className="max-w-md text-sm text-stone-600">Your file is attached. Download to review it on mobile.</p>
                  <a href={docPreview.url} download={docPreview.name}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f766e]">
                    Download PDF
                  </a>
                </div>
              ) : isPdfPreview ? (
                <iframe title="Document preview" src={docPreview.url} className="h-[72vh] w-full rounded-lg border border-stone-200" />
              ) : (
                <img src={docPreview.url} alt={docPreview.name} className="mx-auto max-h-[72vh] rounded-lg border border-stone-200 object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          onClick={() => {
            setShowPopup(false);
            if (successMessageType === "success") navigate("/LoginPage");
          }}
          role="presentation"
        >
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${successMessageType === "success" ? "bg-emerald-100" : "bg-red-100"}`}>
              {successMessageType === "success" ? <Shield className="h-8 w-8 text-emerald-600" strokeWidth={2} /> : <X className="h-8 w-8 text-red-600" />}
            </div>
            <h2 className={`text-xl font-bold ${successMessageType === "success" ? "text-emerald-700" : "text-red-700"}`}>
              {successMessageType === "success" ? "Application Submitted!" : "Something Went Wrong"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setShowPopup(false);
                if (successMessageType === "success") navigate("/LoginPage");
              }}
              className="mt-6 w-full rounded-xl bg-[#0d9488] py-3 text-sm font-bold text-white transition hover:bg-[#0f766e]"
            >
              {successMessageType === "success" ? "Go to Login" : "Close"}
            </button>
          </div>
        </div>
      )}

      {/* Main Page */}
      <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-stone-50">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(13,148,136,0.1),transparent)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 inline-flex items-center justify-center rounded-2xl border border-white/60 bg-white/95 px-5 py-2.5 shadow-lg shadow-teal-900/10 backdrop-blur-sm">
              <img src={brandLogo} alt={COMPANY_NAME} className="h-9 w-auto object-contain sm:h-10" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0d9488] sm:text-[11px]">Partner Onboarding</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Become a <span className="text-[#0d9488]">{COMPANY_NAME}</span> Partner
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">{COMPANY_TAGLINE}</p>
            <Link to="/LoginPage" className="mt-3 inline-block text-sm font-semibold text-[#0d9488] underline-offset-4 hover:underline">
              Already registered? Sign in →
            </Link>
          </div>

          {/* Stepper Header */}
          <div ref={formCardRef} className="mb-6 rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg shadow-teal-900/8 backdrop-blur-sm sm:p-6">
            {/* Step circles */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done = currentStep > step.id;
                const active = currentStep === step.id;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-11 sm:w-11 ${
                        done ? "border-[#0d9488] bg-[#0d9488]" : active ? "border-[#0d9488] bg-[#0d9488]/10" : "border-stone-200 bg-stone-50"
                      }`}>
                        {done ? (
                          <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
                        ) : (
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${active ? "text-[#0d9488]" : "text-stone-400"}`} />
                        )}
                      </div>
                      <span className={`hidden text-[10px] font-semibold sm:block ${active ? "text-[#0d9488]" : done ? "text-stone-500" : "text-stone-400"}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-stone-200 sm:mx-2">
                        <div className={`absolute inset-y-0 left-0 rounded-full bg-[#0d9488] transition-all duration-500 ${currentStep > step.id ? "w-full" : "w-0"}`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Progress text */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-bold text-stone-800">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}
              </p>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-[#0d9488]">{Math.round(progress)}% done</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-gradient-to-r from-[#0d9488] to-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} noValidate>
            <div className={`rounded-2xl border border-white/60 bg-white/90 shadow-xl shadow-teal-900/8 backdrop-blur-sm transition-all duration-200 ${animating ? (direction === "forward" ? "opacity-0 translate-x-4" : "opacity-0 -translate-x-4") : "opacity-100 translate-x-0"}`}>

              {/* ── STEP 1: Personal Info ── */}
              {currentStep === 1 && (
                <div className="space-y-5 p-6 sm:p-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] shadow">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-stone-900">Personal Information</h2>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <Label required>First Name</Label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                        placeholder="First name" className={fieldClass("firstName", fieldErrors)} autoComplete="given-name" />
                      <FieldError msg={fieldErrors.firstName} />
                    </div>
                    <div>
                      <Label>Middle Name</Label>
                      <input type="text" name="middleName" value={formData.middleName} onChange={handleChange}
                        placeholder="Middle name (optional)" className={`${inputBase} ${inputOk}`} autoComplete="additional-name" />
                    </div>
                    <div>
                      <Label required>Last Name</Label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                        placeholder="Last name" className={fieldClass("lastName", fieldErrors)} autoComplete="family-name" />
                      <FieldError msg={fieldErrors.lastName} />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label required>Mobile Number</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input type="tel" name="phone" inputMode="numeric" value={formData.phone} onChange={handleChange}
                          placeholder="10-digit mobile" className={`${fieldClass("phone", fieldErrors)} pl-10`} autoComplete="tel" />
                      </div>
                      <FieldError msg={fieldErrors.phone} />
                    </div>
                    <div>
                      <Label required>Email Address</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                          placeholder="example@gmail.com" className={`${fieldClass("email", fieldErrors)} pl-10`} autoComplete="email" />
                      </div>
                      <FieldError msg={fieldErrors.email} />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label required>Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input type="text" name="dob" placeholder="YYYY-MM-DD" maxLength={10} value={formData.dob} onChange={handleChange}
                           className={`${fieldClass("dob", fieldErrors)} pl-10`} />
                      </div>
                      <FieldError msg={fieldErrors.dob} />
                    </div>
                    <div>
                      <Label required>Employment Type</Label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <select name="employmentType" value={formData.employmentType} onChange={handleChange}
                          className={`${fieldClass("employmentType", fieldErrors)} pl-10 appearance-none`}>
                          <option value="">Select type</option>
                          <option value="Fulltime">Full-time</option>
                          <option value="Parttime">Part-time</option>
                        </select>
                      </div>
                      <FieldError msg={fieldErrors.employmentType} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: KYC & Identity ── */}
              {currentStep === 2 && (
                <div className="space-y-5 p-6 sm:p-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] shadow">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-stone-900">KYC & Identity</h2>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label required>Aadhaar Number</Label>
                      <input type="text" name="aadharNumber" inputMode="numeric" value={formData.aadharNumber} onChange={handleChange}
                        placeholder="12-digit Aadhaar" className={fieldClass("aadharNumber", fieldErrors)} maxLength={12} />
                      <FieldError msg={fieldErrors.aadharNumber} />
                    </div>
                    <div>
                      <Label required>PAN Number</Label>
                      <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange}
                        placeholder="ABCDE1234F" className={fieldClass("panNumber", fieldErrors)} maxLength={10} />
                      <FieldError msg={fieldErrors.panNumber} />
                    </div>
                  </div>

                  <div>
                    <Label>Partner Referral Code <span className="ml-1 text-xs font-normal text-stone-400">(optional)</span></Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input type="text" name="partnerReferralCode" value={formData.partnerReferralCode} onChange={handleChange}
                        placeholder="e.g. PT-XXXXXXXX" className={`${fieldClass("partnerReferralCode", fieldErrors)} pl-10`} />
                    </div>
                    <p className="mt-1.5 text-xs text-stone-400">
                      If a partner referred you, enter their <span className="font-mono font-semibold">PT-</span> or <span className="font-mono font-semibold">RM-</span> code.
                    </p>
                    <FieldError msg={fieldErrors.partnerReferralCode} />
                  </div>

                  <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                    <div className="flex gap-3">
                      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#0d9488]" />
                      <div>
                        <p className="text-sm font-semibold text-stone-800">Your data is secure</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-stone-500">KYC details are encrypted and used only for partner verification. We never share your data with third parties.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Address & Bank ── */}
              {currentStep === 3 && (
                <div className="space-y-5 p-6 sm:p-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] shadow">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-stone-900">Address & Bank Details</h2>
                  </div>

                  <div>
                    <Label required>State</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className={`${fieldClass("region", fieldErrors)} appearance-none pl-10`}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <FieldError msg={fieldErrors.region} />
                  </div>

                  <div>
                    <Label required>Complete Address</Label>
                    <textarea name="address" value={formData.address} onChange={handleChange}
                      placeholder="House/Flat No., Street, Area, City"
                      rows={3}
                      className={`${fieldClass("address", fieldErrors)} resize-none`} />
                    <FieldError msg={fieldErrors.address} />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <Label required>Pincode</Label>
                      <input type="text" name="pincode" inputMode="numeric" value={formData.pincode} onChange={handleChange}
                        placeholder="6-digit PIN" className={fieldClass("pincode", fieldErrors)} maxLength={6} />
                      <FieldError msg={fieldErrors.pincode} />
                    </div>
                    <div>
                      <Label required>Home Type</Label>
                      <select name="homeType" value={formData.homeType} onChange={handleChange}
                        className={`${fieldClass("homeType", fieldErrors)} appearance-none`}>
                        <option value="">Select</option>
                        <option value="Own">Own</option>
                        <option value="Rented">Rented</option>
                      </select>
                      <FieldError msg={fieldErrors.homeType} />
                    </div>
                    <div>
                      <Label required>Stability (months)</Label>
                      <input type="text" inputMode="numeric" name="addressStability" value={formData.addressStability} onChange={handleChange}
                        placeholder="e.g. 24" className={fieldClass("addressStability", fieldErrors)} />
                      <FieldError msg={fieldErrors.addressStability} />
                    </div>
                  </div>

                  <div>
                    <Label>Landmark <span className="ml-1 text-xs font-normal text-stone-400">(optional)</span></Label>
                    <input type="text" name="landmark" value={formData.landmark} onChange={handleChange}
                      placeholder="Nearby landmark" className={`${inputBase} ${inputOk}`} />
                  </div>

                  <div className="border-t border-stone-100 pt-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-[#0d9488]" />
                      <p className="font-bold text-stone-800">Bank Details</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <div>
                        <Label required>Bank Name</Label>
                        <input type="text" name="bankName" value={formData.bankName} onChange={handleChange}
                          placeholder="e.g. State Bank of India" className={fieldClass("bankName", fieldErrors)} />
                        <FieldError msg={fieldErrors.bankName} />
                      </div>
                      <div>
                        <Label required>Account Number</Label>
                        <input type="text" name="accountNumber" inputMode="numeric" value={formData.accountNumber} onChange={handleChange}
                          placeholder="9–18 digits" className={fieldClass("accountNumber", fieldErrors)} />
                        <FieldError msg={fieldErrors.accountNumber} />
                      </div>
                      <div>
                        <Label required>IFSC Code</Label>
                        <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange}
                          placeholder="e.g. SBIN0001234" className={fieldClass("ifscCode", fieldErrors)} />
                        <FieldError msg={fieldErrors.ifscCode} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Documents & Password ── */}
              {currentStep === 4 && (
                <div className="space-y-6 p-6 sm:p-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] shadow">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-stone-900">Documents & Password</h2>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <FileUploadCard name="adharCard" label="Aadhaar Card" icon={FileText} accept="image/jpeg,image/png,image/jpg,application/pdf" inputRef={adharInputRef} allowPdf />
                    <FileUploadCard name="panCard" label="PAN Card" icon={CreditCard} accept="image/jpeg,image/png,image/jpg,application/pdf" inputRef={panInputRef} allowPdf />
                    <FileUploadCard name="selfie" label="Selfie Photo" icon={Camera} accept="image/jpeg,image/png,image/jpg" inputRef={selfieCameraInputRef} allowPdf={false} />
                  </div>

                  <div className="border-t border-stone-100 pt-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-[#0d9488]" />
                      <p className="font-bold text-stone-800">Set Your Password</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label required>Password</Label>
                        <div className="relative">
                          <input
                            type={showPassword.password ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
                            className={`${fieldClass("password", fieldErrors)} pr-12`}
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowPassword((p) => ({ ...p, password: !p.password }))}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            {showPassword.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FieldError msg={fieldErrors.password} />
                        {/* Password strength checklist */}
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {[
                            { key: "len", label: "8+ characters" },
                            { key: "upper", label: "Uppercase letter" },
                            { key: "lower", label: "Lowercase letter" },
                            { key: "num", label: "Number" },
                            { key: "special", label: "Special character" },
                          ].map(({ key, label }) => (
                            <div key={key} className={`flex items-center gap-1.5 text-xs font-medium ${pwdChecks[key] ? "text-emerald-600" : "text-stone-400"}`}>
                              <div className={`h-3 w-3 rounded-full ${pwdChecks[key] ? "bg-emerald-500" : "bg-stone-200"}`} />
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label required>Confirm Password</Label>
                        <div className="relative">
                          <input
                            type={showPassword.confirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat your password"
                            className={`${fieldClass("confirmPassword", fieldErrors)} pr-12`}
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowPassword((p) => ({ ...p, confirmPassword: !p.confirmPassword }))}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            {showPassword.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FieldError msg={fieldErrors.confirmPassword} />
                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <Check className="h-3.5 w-3.5" /> Passwords match
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-6 py-5 sm:px-8">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>

                <div className="flex items-center gap-2">
                  {STEPS.map((s) => (
                    <div key={s.id} className={`h-2 rounded-full transition-all duration-300 ${currentStep === s.id ? "w-6 bg-[#0d9488]" : currentStep > s.id ? "w-2 bg-emerald-400" : "w-2 bg-stone-200"}`} />
                  ))}
                </div>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0d9488] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-900/20 transition hover:bg-[#0f766e] hover:shadow-lg active:scale-[0.98]"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#0d9488] to-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-900/20 transition hover:from-[#0f766e] hover:to-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      <>Submit Application <Check className="h-4 w-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Bottom trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-[#0d9488]" /> Secure & encrypted</span>
            <span className="h-3.5 w-px bg-stone-200" />
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0d9488]" /> Free to join</span>
            <span className="h-3.5 w-px bg-stone-200" />
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#0d9488]" /> 100+ active partners</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default PartnerRegistrationForm;
