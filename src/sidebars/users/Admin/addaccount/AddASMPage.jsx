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
  CheckCircle, 
  X, 
  User ,
  Calendar,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData } from "../../../../utils/localStorage";
import { createAsm } from "../../../../feature/thunks/adminThunks";

const AddASMPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, success } = useSelector((state) => state.admin.createAsmAdmin);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: ``,
    phone: ``,
    email: ``,
    dob:"",
    region:"",
    password: "",
    confirmPassword: "",
  });
  
  // ✅ Re-generate formData when count changes

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [message, setMessage] = useState("")

  const handleAddASM = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const colors = {
    primary: "#12B99C",
    secondary: "#1E3A8A",
    background: "#F8FAFC",
    text: "#111827",
  };

  // ✅ Validation
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

    if (formData?.dob && getAgeFromDOB(formData?.dob) < 18) {
      alert("You must be at least 18 years old to proceed.");
      return;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  function getAgeFromDOB(dobString) {
    if (!dobString) return null; // handle empty or invalid input
  
    const dob = new Date(dobString);
    if (isNaN(dob)) return null; // handle invalid date format
  
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
  
    // If birthday hasn't occurred yet this year, subtract one
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
  
    return age;
  }

  // ✅ Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

// ✅ Handle form submit
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const { adminToken } = getAuthData();
  const {
    firstName,
    lastName,
    phone,
    email,
    dob,
    region,
    password,
  } = formData;

  try {
    // ✅ Await dispatch to ensure success
    await dispatch(
      createAsm({
        firstName,
        lastName,
        phone,
        email,
        dob,
        region,
        password,
        token: adminToken,
      })
    ).unwrap();

    // ✅ Show success message only if ASM creation succeeds
    setMessage("Area Sales Manager has been added successfully to your team.");

    handleAddASM(); // Call after success
    resetFields();  // Reset form fields
  } catch (error) {
    console.error("Failed to create ASM:", error);

    // ✅ Show error message
    setMessage(error?.message || "Failed to create ASM. Please try again.");
  }
};


  // ✅ Input styling
  const inputClassName = (fieldName) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
      errors[fieldName]
        ? "border-red-300 focus:ring-red-200 focus:border-red-500"
        : "border-gray-300 focus:ring-opacity-50 focus:border-opacity-50"
    }`;



    
  const resetFields =()=>{

    setFormData({
        firstName: "",
        lastName: ``,
        phone: ``,
        email: ``,
        dob:"",
        region:"",
        password: "",
        confirmPassword: "",
      })

  }


  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* Modal Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">

              { message === "Area Sales Manager has been added successfully to your team."
              ?   <CheckCircle size={32} className="text-green-500" />: <XCircle size={32} className="text-red-500" />
              }
              
              </div>

              {/* Success Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">

              { message === "Area Sales Manager has been added successfully to your team."
              ?  'Success!' : "Something went wrong"
              }
              
              </h2>
              <p className="text-gray-600 mb-6">
               {message || "We couldn't process your request. Please try again or contact support."}
              </p>

   
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
              Add New Area Sales Manager
            </h1>
            <p className="text-gray-600 mt-2">
              Fill in the details to add a new ASM to your team
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
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={inputClassName("firstName")}
                    placeholder="Enter first name"
                  />
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
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={inputClassName("lastName")}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> {errors.lastName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
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
                      value={formData.dob || ""}
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
                  <div className="relative">
                    <input
                      type="text"
                      name="region"
                      value={formData.region || ""}
                      onChange={handleInputChange}
                      className={`${inputClassName("region")} pl-3`}
                      placeholder="Enter region"
                    />
                  </div>
                  {errors.region && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> {errors.region}
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />{" "}
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Error from API */}
              {error && (
                <p className="mt-4 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
                      Adding ASM...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add ASM
                    </>
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

export default AddASMPage;
