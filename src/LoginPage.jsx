import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from './feature/thunks/adminThunks';
import { getAuthData } from './utils/localStorage';
import { brandLogo, COMPANY_NAME, COMPANY_TAGLINE } from "./config/branding";


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

  // const { loading, error, isAuthenticated } = useSelector(state => state.loginUser);
  const { error, isAuthenticated, user, token, login } = useSelector(
    (state) => state.admin
  );

  


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
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        loginUser({ email: formData.username, password: formData.password })
      ).unwrap();
  
      // Get auth data including impersonation stack
      const { impersonationStack } = getAuthData();
  
      // Determine the current role (impersonated role if exists)
      const lastRole = impersonationStack.length > 0
        ? impersonationStack[impersonationStack.length - 1].user.role
        : result.user.role;
  
      // Redirect based on current role
      if (lastRole === "SUPER_ADMIN") navigate("/admin");
      else if (lastRole === "ASM") navigate("/asm");
      else if (lastRole === "RSM") navigate("/rsm");
      else if (lastRole === "RM") navigate("/rm");
      else if (lastRole === "PARTNER") navigate("/partner");
      else if (lastRole === "CUSTOMER") navigate("/customer");
  
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
      {/* Background */}
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Full-screen split layout */}
        <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Brand / Marketing panel */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_55%),radial-gradient(circle_at_bottom,_#0f172a,_transparent_55%)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/40 flex items-center justify-center shadow-lg">
                  <img
                    src={brandLogo}
                    alt={COMPANY_NAME}
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <div>
                  <p className="text-white text-lg font-semibold leading-tight">
                    {COMPANY_NAME}
                  </p>
                  <p className="text-emerald-50 text-xs font-medium">
                    {COMPANY_TAGLINE}
                  </p>
                </div>
              </div>

              <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-4 leading-tight">
                One login for your entire financial ecosystem.
              </h2>
              <p className="text-sm xl:text-base text-emerald-50/90 leading-relaxed max-w-sm">
                Securely manage applications, customers, partners, payouts and incentives in a single, real‑time dashboard built for scale.
              </p>
            </div>

            <div className="relative z-10 mt-10 space-y-4">
              <div className="flex items-center gap-3 text-sm text-emerald-50">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/30">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <p>Bank‑grade security with role‑based access for Admin, ASM, RSM, RM, Partner & Customer.</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-emerald-50">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/30">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <p>All activity is tracked for compliance, audit and performance analytics.</p>
              </div>
            </div>
          </div>

          {/* Right: Login form */}
          <div className="relative bg-white/95 lg:bg-white px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 mx-auto">
              {/* Header */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white border border-gray-100">
                    <img
                      src={brandLogo}
                      alt={COMPANY_NAME}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Sign in to your account
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Enter your registered email and password to continue.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
                <div className="space-y-6">
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
                    type="text"
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
                {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
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
