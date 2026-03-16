import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Save,
  ArrowLeft,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  User,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData } from "../../../../utils/localStorage";
import { createRSM, fetchAsms } from "../../../../feature/thunks/adminThunks";

const AddRSMPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: asms } = useSelector((state) => state.admin.asm);
  const { loading, error } = useSelector((state) => state.admin.createRSMAdmin || { loading: false, error: null });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dob: "",
    region: "",
    password: "",
    confirmPassword: "",
    asmId: "",
    rsmType: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const colors = {
    primary: "#12B99C",
    secondary: "#1E3A8A",
    background: "#F8FAFC",
    text: "#111827",
  };

  // Load available ASMs when page opens
  useEffect(() => {
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchAsms(adminToken));
    }
  }, [dispatch]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.asmId) newErrors.asmId = "ASM is required";
    if (!formData.rsmType) newErrors.rsmType = "RSM type is required";
    if (formData?.dob && getAgeFromDOB(formData?.dob) < 18) {
      newErrors.dob = "Must be at least 18 years old";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function getAgeFromDOB(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob)) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    return age;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { adminToken } = getAuthData();
    if (!adminToken) {
      alert("Missing admin token");
      return;
    }

    try {
      await dispatch(
        createRSM({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          dob: formData.dob,
          region: formData.region,
          password: formData.password,
          asmId: formData.asmId,
          rsmType: formData.rsmType,
          token: adminToken,
        })
      ).unwrap();

      alert("RSM created successfully");
      navigate("/admin/RSM");
    } catch (err) {
      alert(typeof err === "string" ? err : err?.message || "Failed to create RSM");
    }
  };

  const inputClassName = (fieldName) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
      errors[fieldName]
        ? "border-red-300 focus:ring-red-200 focus:border-red-500"
        : "border-gray-300 focus:ring-primary/30 focus:border-primary/50"
    }`;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
            Add New RSM
          </h1>
          <p className="text-gray-600 mt-2">
            Fill in the details to add a new Regional Sales Manager
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`${inputClassName("firstName")} pl-10`}
                    placeholder="Enter first name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`${inputClassName("lastName")} pl-10`}
                    placeholder="Enter last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.lastName}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`${inputClassName("phone")} pl-10`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${inputClassName("email")} pl-10`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.email}
                  </p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className={`${inputClassName("dob")} pl-10`}
                  />
                </div>
                {errors.dob && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.dob}
                  </p>
                )}
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region *
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className={inputClassName("region")}
                  placeholder="Enter region"
                />
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.region}
                  </p>
                )}
              </div>

              {/* ASM Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to ASM *
                </label>
                <select
                  name="asmId"
                  value={formData.asmId}
                  onChange={handleInputChange}
                  className={inputClassName("asmId")}
                >
                  <option value="">Select ASM</option>
                  {(asms || []).map((asm) => (
                    <option key={asm._id} value={asm._id}>
                      {asm.firstName} {asm.lastName} ({asm.employeeId})
                    </option>
                  ))}
                </select>
                {errors.asmId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.asmId}
                  </p>
                )}
              </div>

              {/* RSM Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RSM Type *
                </label>
                <select
                  name="rsmType"
                  value={formData.rsmType}
                  onChange={handleInputChange}
                  className={inputClassName("rsmType")}
                >
                  <option value="">Select RSM Type</option>
                  <option value="PERSONAL">Personal Loan RSM</option>
                  <option value="BUSINESS_HOME">Business & Home Loan RSM</option>
                </select>
                {errors.rsmType && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.rsmType}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${inputClassName("password")} pl-10 pr-10`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`${inputClassName("confirmPassword")} pl-10 pr-10`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => navigate("/admin/dashboard")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 flex items-center disabled:opacity-70 hover:shadow-lg"
                style={{ backgroundColor: colors.primary }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding RSM...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add RSM
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRSMPage;


