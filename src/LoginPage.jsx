import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  FileText,
  X,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { loginUser, reuploadPartnerKyc } from './feature/thunks/adminThunks';
import { clearAuthData, getAuthData, saveAuthData } from './utils/localStorage';
import { getSessionDashboardBasePath } from './utils/sessionDashboardPath';
import {
  isGoogleLoginConfigured,
  loginWithGoogleIdToken,
} from './utils/googleAuth';
import {
  brandLogo,
  loginBanner,
  COMPANY_NAME,
  COMPANY_TAGLINE,
} from "./config/branding";
import { PARTNER_REGISTRATION_ROUTE } from "./config/publicReferral";
import { PARTNER_REF_SESSION_KEY } from "./feature/publicLoanReferral";

/** Google's button needs a pixel width — % / forcing all nested divs to 100% stretches the G logo. */
const GoogleSignInButton = ({ onSuccess, onError, disabled }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => {
      const next = Math.floor(el.getBoundingClientRect().width);
      if (next > 0) setWidth(Math.min(400, Math.max(240, next)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      {/* Stretch only the direct GIS wrapper — never nested logo/text nodes */}
      <div className="flex w-full justify-center overflow-hidden rounded-lg [&>div]:w-full [&>div]:flex [&>div]:justify-center">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap={false}
          theme="outline"
          size="large"
          shape="rectangular"
          text="continue_with"
          width={String(width)}
          logo_alignment="left"
        />
      </div>
    </div>
  );
};

const ErrorModal = ({ isOpen, onClose, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="ml-3 text-lg font-medium text-gray-900">
              Login Failed
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="mt-2">
            <p className="text-sm text-gray-700">
              {typeof error === 'string'
                ? error
                : error?.message || 'An unexpected error occurred during login. Please try again.'
              }
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full inline-flex justify-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--color-brand-primary)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};


const LoginPage = () => {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const dispatch = useDispatch();

  const { error: reduxLoginError } = useSelector((state) => state.admin.login);

  


  const [formData, setFormData] = useState({ username: '', password: '' });

  const [showPassword, setShowPassword] = useState(false);


  const [errors, setErrors] = useState({});


  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(false);

  // Partner Verification & Document Re-upload State
  const [partnerInactiveData, setPartnerInactiveData] = useState(null);
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [reuploadFiles, setReuploadFiles] = useState({});
  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);

  const getRequiredDocFields = (rejectedTypes = []) => {
    const defaultList = [
      { key: "AADHAR", fieldName: "adharCard", label: "Aadhaar Card", hint: "Upload clear front and back copy (JPG, PNG, or PDF)" },
      { key: "PAN", fieldName: "panCard", label: "PAN Card", hint: "Upload clear front copy (JPG, PNG, or PDF)" },
      { key: "CHEQUE", fieldName: "cheque", label: "Cancelled Cheque / Passbook", hint: "Upload bank passbook or cancelled cheque" },
      { key: "SELFIE", fieldName: "selfie", label: "Selfie / Photo", hint: "Upload clear portrait photo" },
    ];
    if (!rejectedTypes || rejectedTypes.length === 0) return defaultList;

    const matched = [];
    const upperTypes = rejectedTypes.map((t) => String(t).toUpperCase());

    if (upperTypes.some((t) => t.includes("ADHAR") || t.includes("AADHAR"))) {
      matched.push({ key: "AADHAR", fieldName: "adharCard", label: "Aadhaar Card", hint: "Upload clear front and back copy (JPG, PNG, or PDF)" });
    }
    if (upperTypes.some((t) => t.includes("PAN"))) {
      matched.push({ key: "PAN", fieldName: "panCard", label: "PAN Card", hint: "Upload clear front copy (JPG, PNG, or PDF)" });
    }
    if (upperTypes.some((t) => t.includes("CHEQUE") || t.includes("BANK") || t.includes("PASSBOOK"))) {
      matched.push({ key: "CHEQUE", fieldName: "cheque", label: "Cancelled Cheque / Bank Passbook", hint: "Upload bank proof copy" });
    }
    if (upperTypes.some((t) => t.includes("SELFIE") || t.includes("PHOTO"))) {
      matched.push({ key: "SELFIE", fieldName: "selfie", label: "Selfie / Photo", hint: "Upload clear portrait photo" });
    }

    for (const rt of rejectedTypes) {
      const up = String(rt).toUpperCase();
      if (!matched.some((m) => m.key === up || up.includes(m.key))) {
        matched.push({
          key: up,
          fieldName: up.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          label: up.replace(/_/g, " "),
          hint: "Upload updated copy of this document",
        });
      }
    }

    return matched.length > 0 ? matched : defaultList;
  };

  const handleReuploadSubmit = async (e) => {
    e.preventDefault();
    if (!partnerInactiveData?.partnerId) {
      toast.error("Partner ID missing. Please try signing in again.");
      return;
    }

    const fileKeys = Object.keys(reuploadFiles);
    if (fileKeys.length === 0) {
      toast.error("Please select at least one document to upload.");
      return;
    }

    setIsSubmittingDocs(true);
    try {
      const fd = new FormData();
      fd.append("partnerId", partnerInactiveData.partnerId);
      fileKeys.forEach((k) => {
        if (reuploadFiles[k]) {
          fd.append(k, reuploadFiles[k]);
        }
      });

      await dispatch(reuploadPartnerKyc(fd)).unwrap();
      toast.success("Documents submitted successfully! Admin has been notified.");
      setShowReuploadModal(false);
      setReuploadFiles({});
      setPartnerInactiveData((prev) =>
        prev
          ? {
              ...prev,
              canReuploadDocs: false,
              inactiveReason:
                "Updated documents submitted successfully. Awaiting Admin verification.",
            }
          : null
      );
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "Failed to re-upload documents");
    } finally {
      setIsSubmittingDocs(false);
    }
  };

  /**
   * Non–partner-invite `ref` for public loan forms (PT/RM invites redirect in AppRoutes before this mounts).
   */
  useEffect(() => {
    const ref = (searchParams.get("ref") || "").trim();
    if (!ref) return;
    const upper = ref.toUpperCase();
    if (upper.startsWith("PT-") || upper.startsWith("RM-")) return;
    try {
      sessionStorage.setItem(PARTNER_REF_SESSION_KEY, ref);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const email = formData.username.trim();
    if (!email) newErrors.username = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.username = 'Enter a valid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
 };

  const routeForRole = (role) => {
    const r = String(role || '').toUpperCase();
    const map = {
      SUPER_ADMIN: '/admin',
      ADMIN: '/admin',
      ASM: '/asm',
      RSM: '/rsm',
      RM: '/rm',
      PARTNER: '/partner',
      CUSTOMER: '/customer',
    };
    return map[r] || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    try {
      setLoading(true);
      setPartnerInactiveData(null);
  
      // Dispatch login
      const result = await dispatch(
        loginUser({ email: formData.username.trim(), password: formData.password })
      ).unwrap();

      const role = result?.user?.role;
      const path = routeForRole(role);

      if (path) {
        navigate(path, { replace: true });
      } else {
        setModalError(
          `Your account role (${role || 'unknown'}) is not supported for web login. Please contact support.`
        );
        setShowErrorModal(true);
      }
  
    } catch (err) {
      console.error("Login failed:", err);

      if (
        err &&
        typeof err === "object" &&
        (err.code === "AUTH_INACTIVE" ||
          err.code === "AUTH_SUSPENDED" ||
          err.inactiveReason ||
          err.canReuploadDocs ||
          err.status === "PENDING" ||
          err.status === "SUSPENDED")
      ) {
        setPartnerInactiveData(err);
        setShowErrorModal(false);
        return;
      }

      let message = "Login failed. Please try again.";

      if (
        err === "Account is not active (status: PENDING)." ||
        err?.message === "Account is not active (status: PENDING)."
      ) {
        message = "Account is not active (status: PENDING).";
      } else if (typeof err === "string") {
        message = err;
      } else if (err?.message) {
        message = err.message;
      }

      setModalError(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setModalError('');
    // Clear form errors when closing modal
    setErrors({});
  };

  const completeLogin = (token, user) => {
    clearAuthData();
    saveAuthData(token, user);
    const path = routeForRole(user?.role);
    if (path) {
      navigate(path, { replace: true });
      return;
    }
    setModalError(
      `Your account role (${user?.role || "unknown"}) is not supported for web login. Please contact support.`
    );
    setShowErrorModal(true);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setModalError("Google did not return a credential. Please try again.");
      setShowErrorModal(true);
      return;
    }
    try {
      setLoading(true);
      const { token, user } = await loginWithGoogleIdToken(idToken);
      completeLogin(token, user);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Google sign-in failed. Please try again.";
      setModalError(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setModalError("Google sign-in was cancelled or failed. Please try again.");
    setShowErrorModal(true);
  };


  return (
    <>
      {/* Locked to one viewport height — columns scroll internally if needed */}
      <div className="relative h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-hidden bg-gradient-to-br from-stone-100 via-teal-50/35 to-amber-50/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(13,148,136,0.1),transparent)]" />

        <div className="relative flex h-full min-h-0 flex-col lg:grid lg:grid-cols-2">
          {/* Mobile: single logo strip (matches “both sides” branding on desktop) */}
          <div className="shrink-0 border-b border-stone-200/80 bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-4 py-2.5 lg:hidden">
            <div className="mx-auto flex h-11 max-w-[280px] items-center justify-center rounded-lg bg-white/95 px-3 shadow-sm">
              <img
                src={brandLogo}
                alt={COMPANY_NAME}
                className="max-h-9 w-full object-contain object-center"
              />
            </div>
          </div>

          {/* Left: brand panel — logo + banner + copy (desktop only), fits within viewport */}
          <div className="relative hidden min-h-0 flex-col justify-center overflow-y-auto overscroll-contain bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#134e4a] px-8 py-6 xl:px-10 xl:py-8 lg:flex">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(251,191,36,0.2),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgba(255,255,255,0.06),transparent_40%)]" />
            <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-5">
              {/* Professional header — no duplicate logo; banner below carries the mark */}
              <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
                <div className="min-w-0 space-y-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-teal-100/80">
                    Trusted financial platform
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="h-px w-10 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-400/20" aria-hidden />
                    <span className="text-sm font-medium text-white/95">{COMPANY_NAME}</span>
                  </div>
                  {COMPANY_TAGLINE ? <p className="text-xs text-teal-100/75">{COMPANY_TAGLINE}</p> : null}
                </div>
                <div
                  className="hidden shrink-0 rounded-lg border border-white/15 bg-white/[0.07] px-2.5 py-2 text-center sm:block"
                  aria-hidden
                >
                  <Shield className="mx-auto h-5 w-5 text-amber-200/90" strokeWidth={1.5} />
                  <span className="mt-1 block text-[0.55rem] font-semibold uppercase tracking-wider text-white/50">
                    Secure
                  </span>
                </div>
              </div>

              {/* Primary brand mark — horizontal logo */}
              <div className="rounded-2xl border border-white/25 bg-white/10 p-1 shadow-xl ring-1 ring-white/10 backdrop-blur-sm">
                <div className="rounded-[0.875rem] bg-white p-4 shadow-inner">
                  <img
                    src={loginBanner}
                    alt={`${COMPANY_NAME} banner`}
                    className="mx-auto max-h-[min(22vh,200px)] w-full object-contain object-center"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold leading-snug tracking-tight text-white xl:text-[1.65rem]">
                  One login for your entire financial ecosystem.
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-teal-50/90 xl:text-sm">
                  Applications, partners, payouts and incentives — one secure dashboard.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-white/15 pt-4">
                <div className="flex gap-3 text-xs leading-snug text-teal-50/95 xl:text-[0.8125rem]">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/35 bg-amber-400/15">
                    <Shield className="h-3.5 w-3.5 text-amber-100" />
                  </div>
                  <p>Role‑based access for Admin, ASM, RSM, RM, Partner & Customer.</p>
                </div>
                <div className="flex gap-3 text-xs leading-snug text-teal-50/95 xl:text-[0.8125rem]">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/35 bg-amber-400/15">
                    <Lock className="h-3.5 w-3.5 text-amber-100" />
                  </div>
                  <p>Compliance-ready activity tracking and analytics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form + logo — scrolls inside column only */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-white/90 lg:bg-white">
            <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:py-6">
              <div className="text-center lg:text-left">
                {/* Desktop: logo on form side (mobile uses top strip only to stay within viewport) */}
                <div className="mb-4 hidden justify-center lg:flex lg:justify-start">
                  <div className="flex h-14 w-48 items-center justify-center rounded-xl border border-stone-200 bg-white px-3 shadow-sm">
                    <img
                      src={brandLogo}
                      alt={COMPANY_NAME}
                      className="max-h-11 w-full object-contain object-center"
                    />
                  </div>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                  Sign in to your account
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Enter your registered email and password to continue.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-stone-100 bg-white p-5 shadow-lg shadow-stone-900/5 sm:p-6"
              >
                <div
                  className="mb-5 h-0.5 w-full rounded-full bg-gradient-to-r from-[#0d9488]/25 via-[#0d9488]/50 to-amber-400/55"
                  aria-hidden
                />
                <div className="space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5" style={{ color: '#6B7280' }} />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="email"
                    autoComplete="email"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-brand-primary'
                      }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5" style={{ color: '#6B7280' }} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-brand-primary'
                      }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" style={{ color: '#6B7280' }} /> : <Eye className="h-5 w-5" style={{ color: '#6B7280' }} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-gray-300 focus:ring-2" style={{ accentColor: 'var(--color-brand-primary)' }} />
                  <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: '#6B7280' }}>Remember me</label>
                </div>
                <div className="text-sm">


                  <button
                    type="button"
                    onClick={() => navigate("/reset-password/request")}
                    className="cursor-pointer font-medium hover:underline transition-colors"
                    style={{ color: 'var(--color-brand-primary)' }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`cursor-pointer group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  style={{ backgroundColor: 'var(--color-brand-primary)' }}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
                {reduxLoginError && !showErrorModal && !partnerInactiveData && (
                  <p className="mt-2 text-sm text-red-600 text-center">{reduxLoginError}</p>
                )}

                {/* Partner Inactive / Verification Warning Box */}
                {partnerInactiveData && (
                  <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/95 p-3.5 shadow-sm text-stone-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-amber-950 text-xs">
                            {partnerInactiveData.status === "SUSPENDED"
                              ? "Account Suspended"
                              : "Verification Pending / Inactive"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                            {partnerInactiveData.status || "PENDING"}
                          </span>
                        </div>

                        <div className="mt-2 rounded-lg bg-white p-2.5 border border-amber-200 shadow-inner">
                          <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                            Admin Remark / Reason:
                          </p>
                          <p className="text-xs text-stone-700 mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {partnerInactiveData.inactiveReason ||
                              partnerInactiveData.docRejectionRemarks ||
                              "Your account is pending verification by the Admin team."}
                          </p>
                        </div>

                        {partnerInactiveData.canReuploadDocs && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => setShowReuploadModal(true)}
                              className="inline-flex w-full justify-center items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold shadow transition transform active:scale-95 cursor-pointer"
                            >
                              <UploadCloud className="h-4 w-4" />
                              Upload Requested Documents
                            </button>
                            <p className="text-[11px] text-stone-500 mt-1 text-center">
                              Click above to upload replacement KYC documents requested by Admin.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isGoogleLoginConfigured() && (
                <div className="pt-1">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                      <div className="w-full border-t border-stone-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 font-medium uppercase tracking-wide text-stone-400">
                        or continue with
                      </span>
                    </div>
                  </div>
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    disabled={loading}
                  />
                  <p className="mt-2 text-center text-[11px] text-stone-500">
                    Use the same Google email as your registered account.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate(PARTNER_REGISTRATION_ROUTE)}
                className="mt-4 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-teal-50/80"
                style={{
                  borderColor: "rgba(13, 122, 95, 0.18)",
                  backgroundColor: "rgba(13, 148, 136, 0.08)",
                }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: "var(--color-brand-primary)" }}
                  >
                    <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="truncate text-sm font-semibold text-stone-800">
                    New Partner?
                  </span>
                </span>
                <span
                  className="flex shrink-0 items-center gap-0.5 text-sm font-bold"
                  style={{ color: "var(--color-brand-primary)" }}
                >
                  Register Now
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={handleCloseErrorModal}
        error={modalError}
      />

      {/* Re-upload Documents Modal Popup */}
      {showReuploadModal && partnerInactiveData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !isSubmittingDocs && setShowReuploadModal(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-teal-600" />
                  Re-upload KYC Documents
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Submit replacement documents for admin verification.
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmittingDocs}
                onClick={() => setShowReuploadModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs">
              <span className="font-bold text-red-900 block mb-1">Admin Remark / Reason:</span>
              <p className="text-red-800 leading-relaxed font-medium">
                {partnerInactiveData.inactiveReason || partnerInactiveData.docRejectionRemarks}
              </p>
            </div>

            <form onSubmit={handleReuploadSubmit} className="space-y-4">
              {getRequiredDocFields(partnerInactiveData.rejectedDocTypes).map((doc) => (
                <div
                  key={doc.key}
                  className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5"
                >
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {doc.label} <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-stone-500 mb-2">{doc.hint}</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setReuploadFiles((prev) => ({ ...prev, [doc.fieldName]: file }));
                      }
                    }}
                    className="block w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {reuploadFiles[doc.fieldName] && (
                    <p className="mt-1.5 text-[11px] text-teal-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Selected: {reuploadFiles[doc.fieldName].name} (
                      {(reuploadFiles[doc.fieldName].size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              ))}

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  disabled={isSubmittingDocs}
                  onClick={() => setShowReuploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDocs}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingDocs ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Submit Documents
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>

  );
};

export default LoginPage;
