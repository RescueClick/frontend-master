import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from './feature/thunks/adminThunks';
import { getAuthData } from './utils/localStorage';
import {
  brandLogo,
  loginBanner,
  COMPANY_NAME,
  COMPANY_TAGLINE,
} from "./config/branding";


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

  const dispatch = useDispatch();

  const { error: reduxLoginError } = useSelector((state) => state.admin.login);

  


  const [formData, setFormData] = useState({ username: '', password: '' });

  const [showPassword, setShowPassword] = useState(false);


  const [errors, setErrors] = useState({});


  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(false);

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
      ASM: '/asm',
      RSM: '/rsm',
      RM: '/rm',
      PARTNER: '/partner',
      CUSTOMER: '/customer',
    };
    return map[r] || null;
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //     console.log(getAuthData())
  //   if (!validateForm()) return;

  //   try {


  //     const result = await dispatch(
  //       loginUser({ email: formData.username, password: formData.password })
  //     ).unwrap();

     
  //     if (result.user.role == "SUPER_ADMIN") {
  //       navigate('/admin');
  //     }
  //     else if (result.user.role == "ASM") {
  //       navigate('/asm');

  //     }
  //     else if (result.user.role == "RM") {
  //       navigate('/rm');

  //     }
  //     else if (result.user.role == "PARTNER") {
  //       navigate('/partner');

  //     }
  //     else if (result.user.role == "CUSTOMER") {
  //       navigate('/customer');

  //     }
  //   } catch (err) {
  //     console.error("Login failed:", err);

  //     // Set error for modal display
  //     let errorMessage = 'Login failed. Please check your credentials and try again.';

  //     if (err?.message) {
  //       errorMessage = err.message;
  //     } else if (typeof err === 'string') {
  //       errorMessage = err;
  //     } else if (err?.response?.data?.message) {
  //       errorMessage = err.response.data.message;
  //     }

  //     setModalError(errorMessage);
  //     setShowErrorModal(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    try {
      setLoading(true);
  
      // Dispatch login
      const result = await dispatch(
        loginUser({ email: formData.username.trim(), password: formData.password })
      ).unwrap();

      const { impersonationStack = [] } = getAuthData();
      const impersonated =
        impersonationStack.length > 0
          ? impersonationStack[impersonationStack.length - 1]?.user?.role
          : null;
      const role = impersonated || result?.user?.role;
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

      let message = "Login failed. Please try again.";

      // Show clearer text when a partner account is pending activation
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
                  <p className="text-xs text-teal-100/75">{COMPANY_TAGLINE}</p>
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
            <div className="m-auto flex w-full max-w-md flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:py-6">
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
                {reduxLoginError && !showErrorModal && (
                  <p className="mt-2 text-sm text-red-600 text-center">{reduxLoginError}</p>
                )}
              </div>
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
    </>

  );
};

export default LoginPage;
