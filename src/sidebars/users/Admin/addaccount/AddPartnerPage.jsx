import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  Upload,
  CreditCard,
} from "lucide-react";


import { createPartner } from "../../../../feature/thunks/rmThunks";

import { getAuthData } from "../../../../utils/localStorage";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const AddPartnerPage = () => {
  // const navigate = useNavigate(); // This line was removed to fix the error

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    aadharNumber :"",
    panNumber :"",
    region: "",
    pincode: "",
    employmentType: "",
    address: "",
    homeType: "",
    addressStability: "",
    landmark: "",
    adharCard: "",
    panCard: "",
    selfie: null, // You can replace with a File object if uploading
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files[0],
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone must be 10 digits";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.region.trim()) newErrors.region = "Region is required";
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(formData.pincode))
      newErrors.pincode = "Pincode must be 6 digits";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.homeType.trim()) newErrors.homeType = "Home type is required";
    if (!formData.addressStability.trim())
      newErrors.addressStability = "Address stability is required";
    if (!formData.adharCard) newErrors.adharCard = "Aadhar Card is required";
    if (!formData.panCard) newErrors.panCard = "PAN Card is required";
    if (!formData.selfie) newErrors.selfie = "Selfie is required";
    if (!formData.bankName.trim()) newErrors.bankName = "Bank Name is required";
    if (!formData.accountNumber.trim())
      newErrors.accountNumber = "Account Number is required";
    if (!formData.ifscCode.trim()) newErrors.ifscCode = "IFSC Code is required";

    return newErrors;
  };




  const handleSubmit = async (e) => {
    e.preventDefault();

    
  
    if (validateForm()) {
      const newFormData = {
        firstName: formData.firstName,
        middleName: formData.middleName || null,
        lastName: formData.lastName || null,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dateOfBirth || null,
        aadharNumber: formData.aadharNumber,
        panNumber: formData.panNumber,
        region: formData.region || null,
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
        rmCode: formData.rmCode || null,
      };
  
      // ✅ Build FormData
      const formDataToSend = new FormData();
      formDataToSend.append("newFormData", JSON.stringify(newFormData));
  
      if (formData.adharCard) formDataToSend.append("adharCard", formData.adharCard);
      if (formData.panCard) formDataToSend.append("panCard", formData.panCard);
      if (formData.selfie) formDataToSend.append("selfie", formData.selfie);
  
     
      for (let [key, value] of formDataToSend.entries()) {
        
      }
  
      try {
        setIsSubmitting(true); // 🔥 start spinner
      
        const response = dispatch(createPartner(formDataToSend));
      
       
        if (response?.type.endsWith("partner/createPartner/fulfilled")) {
          // ✅ Success
          setShowSuccessModal(true);
          setModalMessage("Partner has been added successfully to your team.");
          resetFields()
        } else {
          // ❌ Failure
          setShowSuccessModal(true);
          setModalMessage(response?.payload || "Failed to add partner");
        }
      } catch (error) {
        // Only runs if something *really unexpected* happens
        setShowSuccessModal(true);
        setModalMessage(error.message || "Something went wrong");
      } finally {
        setIsSubmitting(false); // 🔥 stop spinner
      }
      
    }
  };
  
  const sectionStyle = "bg-white rounded-xl shadow-sm p-6";
  const iconWrapperStyle = "p-2 rounded-lg";
  const iconStyle = "w-5 h-5";
  const labelStyle = "block text-sm font-medium mb-2";
  const inputStyle = (hasError) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
      hasError ? "border-red-500" : "border-gray-300 focus:border-transparent"
    }`;

  const inputRingColor = { "--tw-ring-color": "var(--color-brand-primary)" };


  const resetFields=()=>{
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      aadharNumber :"",
      panNumber :"",
      region: "",
      pincode: "",
      employmentType: "",
      address: "",
      homeType: "",
      addressStability: "",
      landmark: "",
      adharCard: "",
      panCard: "",
      selfie: null, // You can replace with a File object if uploading
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      password: "",
    })
  }

  return (
    <div
      className="min-h-screen font-inter"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      {/* Header */}
      <div className="shadow-sm" style={{ backgroundColor: "white" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => navigate("/rm/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back </span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>
                Add New Partner
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Partner Information */}
          <div className={sectionStyle}>
            <div className="flex items-center space-x-3 mb-6">
              <div
                className={iconWrapperStyle}
                style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 12.5%, transparent)" }}
              >
                <User className={iconStyle} style={{ color: "var(--color-brand-primary)" }} />
              </div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "#111827" }}
              >
                Personal Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={inputStyle(errors.firstName)}
                  style={inputRingColor}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName || ""}
                  onChange={handleInputChange}
                  className={inputStyle(errors.middleName)}
                  style={inputRingColor}
                  placeholder="Enter middle name (optional)"
                />
                {errors.middleName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.middleName}
                  </p>
                )}
              </div>

              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={inputStyle(errors.lastName)}
                  style={inputRingColor}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`pl-11 ${inputStyle(errors.phone)}`}
                    style={inputRingColor}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-11 ${inputStyle(errors.email)}`}
                    style={inputRingColor}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Employment Type *
                </label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className={inputStyle(errors.employmentType)}
                  style={inputRingColor}
                >
                  <option value="Fulltime">Full Time</option>
                  <option value="Parttime">Part Time</option>
                </select>
                {errors.employmentType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.employmentType}
                  </p>
                )}
              </div>

              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth || ""}
                  onChange={handleInputChange}
                  className={inputStyle(errors.dateOfBirth)}
                  style={inputRingColor}
                  placeholder="Select date of birth"
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>


              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Aadhar Number *
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber || ""}
                  onChange={handleInputChange}
                  className={inputStyle(errors.aadharNumber)}
                  style={inputRingColor}
                  placeholder="Enter your Aadhar number"
                  maxLength={12}
                  pattern="\d{12}"
                />
                {errors.aadharNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.aadharNumber}
                  </p>
                )}
              </div>

              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  PAN Number *
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber || ""}
                  onChange={handleInputChange}
                  className={inputStyle(errors.panNumber)}
                  style={inputRingColor}
                  placeholder="Enter your PAN number"
                  maxLength={10}
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                />
                {errors.panNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.panNumber}
                  </p>
                )}
              </div>

              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-11 ${inputStyle(errors.password)}`}
                    style={inputRingColor}
                    placeholder="Enter password"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className={sectionStyle}>
            <div className="flex items-center space-x-3 mb-6">
              <div
                className={iconWrapperStyle}
                style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 12.5%, transparent)" }}
              >
                <MapPin className={iconStyle} style={{ color: "var(--color-brand-primary)" }} />
              </div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "#111827" }}
              >
                Address Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Region *
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className={inputStyle(errors.region)}
                  style={inputRingColor}
                  placeholder="Enter region"
                />
                {errors.region && (
                  <p className="text-red-500 text-sm mt-1">{errors.region}</p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={inputStyle(errors.pincode)}
                  style={inputRingColor}
                  placeholder="Enter pincode (6 digits)"
                />
                {errors.pincode && (
                  <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Home Type *
                </label>
                <select
                  name="homeType"
                  value={formData.homeType}
                  onChange={handleInputChange}
                  className={inputStyle(errors.homeType)}
                  style={inputRingColor}
                >
                  <option value="">Select Home Type</option>
                  <option value="rented">Rented</option>
                  <option value="owned">Owned</option>
                </select>
                {errors.homeType && (
                  <p className="text-red-500 text-sm mt-1">{errors.homeType}</p>
                )}
              </div>

              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Address Stability (Years) *
                </label>
                <input
                  type="number"
                  name="addressStability"
                  value={formData.addressStability}
                  onChange={handleInputChange}
                  placeholder="Enter number of years"
                  min={0}
                  className={inputStyle(errors.addressStability)}
                  style={inputRingColor}
                />
                {errors.addressStability && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.addressStability}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={inputStyle(errors.address)}
                  style={inputRingColor}
                  placeholder="Enter full address"
                  rows="3"
                ></textarea>
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Landmark
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  className={inputStyle(errors.landmark)}
                  style={inputRingColor}
                  placeholder="Enter landmark (optional)"
                />
                {errors.landmark && (
                  <p className="text-red-500 text-sm mt-1">{errors.landmark}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className={sectionStyle}>
            <div className="flex items-center space-x-3 mb-6">
              <div
                className={iconWrapperStyle}
                style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 12.5%, transparent)" }}
              >
                <CreditCard
                  className={iconStyle}
                  style={{ color: "var(--color-brand-primary)" }}
                />
              </div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "#111827" }}
              >
                Bank Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className={inputStyle(errors.bankName)}
                  style={inputRingColor}
                  placeholder="Enter bank name"
                />
                {errors.bankName && (
                  <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className={inputStyle(errors.accountNumber)}
                  style={inputRingColor}
                  placeholder="Enter account number"
                />
                {errors.accountNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.accountNumber}
                  </p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  IFSC Code *
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  className={inputStyle(errors.ifscCode)}
                  style={inputRingColor}
                  placeholder="Enter IFSC code"
                />
                {errors.ifscCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className={sectionStyle}>
            <div className="flex items-center space-x-3 mb-6">
              <div
                className={iconWrapperStyle}
                style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 12.5%, transparent)" }}
              >
                <Upload className={iconStyle} style={{ color: "var(--color-brand-primary)" }} />
              </div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "#111827" }}
              >
                Document Uploads
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Aadhar Card *
                </label>
                <input
                  type="file"
                  name="adharCard"
                  onChange={handleFileChange}
                  className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 ${
                    errors.adharCard ? "border-red-500" : ""
                  }`}
                />
                {errors.adharCard && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.adharCard}
                  </p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  PAN Card *
                </label>
                <input
                  type="file"
                  name="panCard"
                  onChange={handleFileChange}
                  className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 ${
                    errors.panCard ? "border-red-500" : ""
                  }`}
                />
                {errors.panCard && (
                  <p className="text-red-500 text-sm mt-1">{errors.panCard}</p>
                )}
              </div>
              <div>
                <label className={labelStyle} style={{ color: "#111827" }}>
                  Selfie *
                </label>
                <input
                  type="file"
                  name="selfie"
                  onChange={handleFileChange}
                  className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 ${
                    errors.selfie ? "border-red-500" : ""
                  }`}
                />
                {errors.selfie && (
                  <p className="text-red-500 text-sm mt-1">{errors.selfie}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            {/* <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-lg text-white font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 hover:shadow-lg"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Adding Partner..." : "Add Partner"}</span>
            </button> */}

<button
  type="submit"
  disabled={isSubmitting}
  className="px-8 py-3 rounded-lg text-white font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 hover:shadow-lg"
  style={{ backgroundColor: "var(--color-brand-primary)" }}
>
  {isSubmitting ? (
    <>
      <svg
        className="w-4 h-4 animate-spin text-white"
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
      <span>Adding Partner...</span>
    </>
  ) : (
    <>
      <Save className="w-4 h-4" />
      <span>Add Partner</span>
    </>
  )}
</button>

          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
    className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50"
    aria-modal="true"
    role="dialog"
    aria-labelledby="success-modal-title"
    aria-describedby="success-modal-desc"
  >
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
  
      <p
        id="success-modal-desc"
        className="text-gray-600 mb-4"
      >
        {modalMessage}
      </p>
      <button
        onClick={() => setShowSuccessModal(false)}
        className="px-4 py-2 text-black rounded-md  border-2 border-black "
      >
        Close
      </button>
    </div>
  </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h3 className="text-lg font-bold text-red-500 mb-4">Error!</h3>
            <p className="text-gray-600">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default AddPartnerPage;
