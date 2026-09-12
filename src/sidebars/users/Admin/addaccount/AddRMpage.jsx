import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Mail,
  Save,
  ArrowLeft,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Users,
  Check,
  Search,
  Calendar,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData } from "../../../../utils/localStorage";
import { createRm, fetchRSMs, fetchAsms } from "../../../../feature/thunks/adminThunks";
import { resetCreateRmState } from "../../../../feature/slices/adminSlice";
import { INDIAN_STATES } from "../../../../utils/indianStates";

const AddRMPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.admin.createRmAdmin || {});
  const rsmList = useSelector((state) => state.admin.rsm?.data || []);
  const asmList = useSelector((state) => state.admin.asm?.data || []);
  const rsmLoading = useSelector((state) => state.admin.rsm?.loading || false);
  const asmLoading = useSelector((state) => state.admin.asm?.loading || false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dob: "",
    region: "",
    email: "",
    password: "",
    confirmPassword: "",
    rsmId: "", // Selected Reporting RSM (sync anchor)
    personalAsm: null, // Personal Loan ASM
    businessAsm: null, // Business Loan ASM
    homeLapAsm: null, // Home & LAP Loan ASM
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modals for picking ASMs
  const [showPersonalAsmModal, setShowPersonalAsmModal] = useState(false);
  const [showBusinessAsmModal, setShowBusinessAsmModal] = useState(false);
  const [showHomeLapAsmModal, setShowHomeLapAsmModal] = useState(false);
  const [asmSearchTerm, setAsmSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const colors = {
    primary: "var(--color-brand-primary)",
    background: "#F8FAFC",
    text: "#111827",
  };

  const VALIDATION_PATTERNS = {
    name: /^[A-Za-z][A-Za-z\s'-]{1,49}$/,
    phone: /^\d{10}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
  };

  const getPasswordChecks = (password = "") => ({
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z\d]/.test(password),
  });

  // Load managers list when component mounts
  useEffect(() => {
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchRSMs(adminToken));
      dispatch(fetchAsms(adminToken));
    }
  }, [dispatch]);

  // Clean active RSM list
  const activeRsms = useMemo(() => {
    return (Array.isArray(rsmList) ? rsmList : []).filter(
      (r) => r && r._id && (!r.status || r.status === "ACTIVE")
    );
  }, [rsmList]);

  // Clean active ASM list
  const activeAsms = useMemo(() => {
    return (Array.isArray(asmList) ? asmList : []).filter(
      (a) => a && a._id && (!a.status || a.status === "ACTIVE")
    );
  }, [asmList]);

  // Find currently selected RSM object
  const selectedRsm = useMemo(() => {
    if (!formData.rsmId) return null;
    return activeRsms.find((r) => r._id === formData.rsmId) || null;
  }, [activeRsms, formData.rsmId]);

  // Filter ASMs reporting to selected RSM (if any) or all active ASMs
  const filterAsmsByRoleAndRsm = (targetRole, targetRsmId) => {
    return activeAsms.filter((asm) => {
      // Check specialty type
      const normType = (asm.asmType || asm.rsmType || "").toUpperCase();
      let matchesType = false;
      if (targetRole === "PERSONAL") {
        matchesType = normType === "PERSONAL";
      } else if (targetRole === "BUSINESS") {
        matchesType = normType === "BUSINESS" || normType === "BUSINESS_HOME";
      } else if (targetRole === "HOME_LAP") {
        matchesType = normType === "HOME_LAP" || normType === "BUSINESS_HOME";
      }

      if (!matchesType) return false;

      // If RSM is locked/selected, ensure ASM reports to this RSM
      if (targetRsmId) {
        const parentId =
          typeof asm.rsmId === "object" && asm.rsmId?._id
            ? asm.rsmId._id
            : asm.rsmId ||
              (typeof asm.asmId === "object" && asm.asmId?._id ? asm.asmId._id : asm.asmId);
        if (parentId && String(parentId) !== String(targetRsmId)) {
          return false;
        }
      }

      // Filter by search term
      if (asmSearchTerm.trim()) {
        const s = asmSearchTerm.toLowerCase();
        const fullName = `${asm.firstName || ""} ${asm.lastName || ""}`.toLowerCase();
        const empId = (asm.employeeId || "").toLowerCase();
        const email = (asm.email || "").toLowerCase();
        const phone = (asm.phone || "").toLowerCase();
        return (
          fullName.includes(s) ||
          empId.includes(s) ||
          email.includes(s) ||
          phone.includes(s)
        );
      }

      return true;
    });
  };

  // Filtered lists for modals
  const filteredPersonalAsms = useMemo(
    () => filterAsmsByRoleAndRsm("PERSONAL", formData.rsmId),
    [activeAsms, formData.rsmId, asmSearchTerm]
  );

  const filteredBusinessAsms = useMemo(
    () => filterAsmsByRoleAndRsm("BUSINESS", formData.rsmId),
    [activeAsms, formData.rsmId, asmSearchTerm]
  );

  const filteredHomeLapAsms = useMemo(
    () => filterAsmsByRoleAndRsm("HOME_LAP", formData.rsmId),
    [activeAsms, formData.rsmId, asmSearchTerm]
  );

  // Dynamic Sync: When user selects Reporting RSM from dropdown
  const handleRsmSelectChange = (newRsmId) => {
    const chosenRsm = activeRsms.find((r) => r._id === newRsmId);

    setFormData((prev) => {
      // Check if previously selected ASMs belong to the new RSM
      const checkAsmBelongs = (asm) => {
        if (!asm) return null;
        if (!newRsmId) return asm;
        const pId =
          typeof asm.rsmId === "object" && asm.rsmId?._id
            ? asm.rsmId._id
            : asm.rsmId ||
              (typeof asm.asmId === "object" && asm.asmId?._id ? asm.asmId._id : asm.asmId);
        return pId && String(pId) === String(newRsmId) ? asm : null;
      };

      const syncedPersonal = checkAsmBelongs(prev.personalAsm);
      const syncedBusiness = checkAsmBelongs(prev.businessAsm);
      const syncedHomeLap = checkAsmBelongs(prev.homeLapAsm);

      // Dynamic Auto-select if exactly 1 ASM exists under this RSM for that type
      const availablePersonal = filterAsmsByRoleAndRsm("PERSONAL", newRsmId);
      const availableBiz = filterAsmsByRoleAndRsm("BUSINESS", newRsmId);
      const availableHL = filterAsmsByRoleAndRsm("HOME_LAP", newRsmId);

      const nextPersonal =
        syncedPersonal || (availablePersonal.length === 1 ? availablePersonal[0] : null);
      const nextBiz =
        syncedBusiness || (availableBiz.length === 1 ? availableBiz[0] : null);
      const nextHL =
        syncedHomeLap || (availableHL.length === 1 ? availableHL[0] : null);

      return {
        ...prev,
        rsmId: newRsmId,
        region: chosenRsm?.region && (!prev.region || prev.region === "N/A") ? chosenRsm.region : prev.region,
        personalAsm: nextPersonal,
        businessAsm: nextBiz,
        homeLapAsm: nextHL,
      };
    });

    setErrors((prev) => ({
      ...prev,
      rsmId: "",
      personalAsm: "",
      businessAsm: "",
      homeLapAsm: "",
    }));
  };

  // Helper to extract parent RSM ID from ASM
  const getAsmParentRsmId = (asm) => {
    if (!asm) return null;
    return typeof asm.rsmId === "object" && asm.rsmId?._id
      ? asm.rsmId._id
      : asm.rsmId ||
          (typeof asm.asmId === "object" && asm.asmId?._id ? asm.asmId._id : asm.asmId) ||
          null;
  };

  // Dynamic Sync: Selecting Personal Loan ASM dynamically syncs RSM and other ASM filters
  const handlePersonalAsmSelection = (asm) => {
    const parentRsmId = getAsmParentRsmId(asm);
    const parentRsm = parentRsmId ? activeRsms.find((r) => String(r._id) === String(parentRsmId)) : null;

    setFormData((prev) => {
      const targetRsmId = prev.rsmId || parentRsmId || "";
      const syncedRsmId = prev.rsmId ? prev.rsmId : (parentRsmId || "");

      // Auto-suggest matching Business and Home & LAP ASMs under this same RSM
      const availableBiz = filterAsmsByRoleAndRsm("BUSINESS", syncedRsmId);
      const availableHL = filterAsmsByRoleAndRsm("HOME_LAP", syncedRsmId);

      return {
        ...prev,
        personalAsm: asm,
        rsmId: syncedRsmId,
        region: parentRsm?.region && (!prev.region || prev.region === "N/A") ? parentRsm.region : prev.region,
        businessAsm: prev.businessAsm || (availableBiz.length === 1 ? availableBiz[0] : null),
        homeLapAsm: prev.homeLapAsm || (availableHL.length === 1 ? availableHL[0] : null),
      };
    });

    setErrors((prev) => ({ ...prev, personalAsm: "", rsmId: "" }));
    setShowPersonalAsmModal(false);
    setAsmSearchTerm("");
  };

  // Dynamic Sync: Selecting Business Loan ASM dynamically syncs RSM
  const handleBusinessAsmSelection = (asm) => {
    const parentRsmId = getAsmParentRsmId(asm);
    const parentRsm = parentRsmId ? activeRsms.find((r) => String(r._id) === String(parentRsmId)) : null;

    setFormData((prev) => {
      const syncedRsmId = prev.rsmId ? prev.rsmId : (parentRsmId || "");
      const availablePersonal = filterAsmsByRoleAndRsm("PERSONAL", syncedRsmId);
      const availableHL = filterAsmsByRoleAndRsm("HOME_LAP", syncedRsmId);

      return {
        ...prev,
        businessAsm: asm,
        rsmId: syncedRsmId,
        region: parentRsm?.region && (!prev.region || prev.region === "N/A") ? parentRsm.region : prev.region,
        personalAsm: prev.personalAsm || (availablePersonal.length === 1 ? availablePersonal[0] : null),
        homeLapAsm: prev.homeLapAsm || (availableHL.length === 1 ? availableHL[0] : null),
      };
    });

    setErrors((prev) => ({ ...prev, businessAsm: "", rsmId: "" }));
    setShowBusinessAsmModal(false);
    setAsmSearchTerm("");
  };

  // Dynamic Sync: Selecting Home & LAP Loan ASM dynamically syncs RSM
  const handleHomeLapAsmSelection = (asm) => {
    const parentRsmId = getAsmParentRsmId(asm);
    const parentRsm = parentRsmId ? activeRsms.find((r) => String(r._id) === String(parentRsmId)) : null;

    setFormData((prev) => {
      const syncedRsmId = prev.rsmId ? prev.rsmId : (parentRsmId || "");
      const availablePersonal = filterAsmsByRoleAndRsm("PERSONAL", syncedRsmId);
      const availableBiz = filterAsmsByRoleAndRsm("BUSINESS", syncedRsmId);

      return {
        ...prev,
        homeLapAsm: asm,
        rsmId: syncedRsmId,
        region: parentRsm?.region && (!prev.region || prev.region === "N/A") ? parentRsm.region : prev.region,
        personalAsm: prev.personalAsm || (availablePersonal.length === 1 ? availablePersonal[0] : null),
        businessAsm: prev.businessAsm || (availableBiz.length === 1 ? availableBiz[0] : null),
      };
    });

    setErrors((prev) => ({ ...prev, homeLapAsm: "", rsmId: "" }));
    setShowHomeLapAsmModal(false);
    setAsmSearchTerm("");
  };

  // Clear / Reset RSM and ASMs
  const handleResetHierarchy = () => {
    setFormData((prev) => ({
      ...prev,
      rsmId: "",
      personalAsm: null,
      businessAsm: null,
      homeLapAsm: null,
    }));
    setErrors((prev) => ({
      ...prev,
      rsmId: "",
      personalAsm: "",
      businessAsm: "",
      homeLapAsm: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!VALIDATION_PATTERNS.name.test(formData.firstName.trim())) {
      newErrors.firstName = "Enter a valid first name";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!VALIDATION_PATTERNS.name.test(formData.lastName.trim())) {
      newErrors.lastName = "Enter a valid last name";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!VALIDATION_PATTERNS.phone.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!VALIDATION_PATTERNS.email.test(formData.email.trim().toLowerCase())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    }
    if (!formData.region.trim()) {
      newErrors.region = "State is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (!VALIDATION_PATTERNS.password.test(formData.password)) {
      newErrors.password =
        "Password must be 8+ chars with uppercase, lowercase, number, and special character";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Hierarchy validation
    if (!formData.rsmId) {
      newErrors.rsmId = "Please select a Reporting RSM";
    }
    if (!formData.personalAsm) {
      newErrors.personalAsm = "Please assign a Personal Loan ASM";
    }
    if (!formData.businessAsm) {
      newErrors.businessAsm = "Please assign a Business Loan ASM";
    }
    if (!formData.homeLapAsm) {
      newErrors.homeLapAsm = "Please assign a Home & LAP Loan ASM";
    }

    // Uniqueness validation (distinct individuals)
    if (
      formData.personalAsm &&
      formData.businessAsm &&
      formData.personalAsm._id === formData.businessAsm._id
    ) {
      newErrors.businessAsm = "Personal and Business ASM must be different individuals";
    }
    if (
      formData.personalAsm &&
      formData.homeLapAsm &&
      formData.personalAsm._id === formData.homeLapAsm._id
    ) {
      newErrors.homeLapAsm = "Personal and Home & LAP ASM must be different individuals";
    }
    if (
      formData.businessAsm &&
      formData.homeLapAsm &&
      formData.businessAsm._id === formData.homeLapAsm._id
    ) {
      newErrors.homeLapAsm = "Business and Home & LAP ASM must be different individuals";
    }

    // Verify all 3 report to the same parent RSM
    const parentRsms = [
      getAsmParentRsmId(formData.personalAsm),
      getAsmParentRsmId(formData.businessAsm),
      getAsmParentRsmId(formData.homeLapAsm),
    ].filter(Boolean);

    const uniqueRsms = new Set(parentRsms.map(String));
    if (uniqueRsms.size > 1) {
      newErrors.homeLapAsm = "All 3 ASMs must report to the same Regional Sales Manager (RSM)";
    }

    if (formData?.dob && getAgeFromDOB(formData?.dob) < 18) {
      newErrors.dob = "Must be at least 18 years old to proceed.";
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
    let nextValue = value;
    if (name === "phone") {
      const d = value.replace(/\D/g, "");
      nextValue = d.length > 10 ? d.slice(-10) : d.slice(0, 10);
    }
    if (name === "email") {
      nextValue = value.trim().toLowerCase();
    }
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) dispatch(resetCreateRmState());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      setIsSuccess(false);
      setMessage("Unauthorized. Please log in again.");
      setShowModal(true);
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    const phoneTen = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;

    const effRsmId =
      formData.rsmId ||
      getAsmParentRsmId(formData.personalAsm) ||
      getAsmParentRsmId(formData.businessAsm);

    const requestData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: phoneTen,
      region: formData.region.trim(),
      dob: formData.dob,
      email: formData.email.trim(),
      password: formData.password,
      rsmId: typeof effRsmId === "object" ? effRsmId?._id : effRsmId,
      personalAsmId: formData.personalAsm?._id,
      businessAsmId: formData.businessAsm?._id,
      homeLapAsmId: formData.homeLapAsm?._id,
      // Legacy aliases for backward compatibility with backend routes
      personalRsmId: formData.personalAsm?._id,
      businessRsmId: formData.businessAsm?._id,
      homeLapRsmId: formData.homeLapAsm?._id,
      businessHomeRsmId: formData.businessAsm?._id,
      token: adminToken,
    };

    try {
      await dispatch(createRm(requestData)).unwrap();

      setIsSuccess(true);
      setMessage("Relationship Manager has been added successfully to your team.");
      setShowModal(true);

      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        dob: "",
        region: "",
        email: "",
        password: "",
        confirmPassword: "",
        rsmId: "",
        personalAsm: null,
        businessAsm: null,
        homeLapAsm: null,
      });
    } catch (err) {
      console.error("Failed to create RM:", err);
      setIsSuccess(false);
      setMessage(typeof err === "string" ? err : err?.message || "Failed to create RM. Please try again.");
      setShowModal(true);
    }
  };

  const inputClassName = (fieldName) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
      errors[fieldName]
        ? "border-red-300 focus:ring-red-200 focus:border-red-500"
        : "border-gray-300 focus:ring-primary/30 focus:border-primary/50"
    }`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
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
            Add New Relationship Manager (RM)
          </h1>
          <p className="text-gray-600 mt-2">
            Configure the RM hierarchy by linking to a Regional Sales Manager and 3 specialized Area Sales Managers
          </p>
        </div>

        {/* Success / Error Popup Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
              <div className="relative p-6 pb-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    if (isSuccess) navigate("/admin/rm");
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 pb-8 text-center">
                <div
                  className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    isSuccess ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle size={32} className="text-green-500" />
                  ) : (
                    <XCircle size={32} className="text-red-500" />
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isSuccess ? "Success!" : "Failed to Add RM"}
                </h2>
                <p className="text-gray-600 mb-6">
                  {message || "We couldn't process your request. Please try again."}
                </p>

                <div className="flex justify-end gap-3">
                  {isSuccess && (
                    <button
                      type="button"
                      onClick={() => navigate("/admin/rm")}
                      className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all"
                    >
                      View RM List
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      if (isSuccess) navigate("/admin/rm");
                    }}
                    className="px-6 py-2.5 rounded-lg text-white font-medium transition-all duration-200"
                    style={{ backgroundColor: colors.primary }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Hierarchy Sync Banner */}
        <div className="bg-white border border-blue-100 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Hierarchy Sync (Admin → RSM → ASMs → RM)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select a Reporting RSM to dynamically filter ASMs, or select any ASM to auto-sync the parent RSM.
                </p>
                {selectedRsm ? (
                  <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Synchronized to RSM: <strong>{selectedRsm.firstName} {selectedRsm.lastName}</strong> ({selectedRsm.employeeId || "RSM"})
                    {selectedRsm.region && ` • ${selectedRsm.region}`}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded inline-block">
                    No RSM locked yet — choose below or pick an ASM to lock the reporting line.
                  </div>
                )}
              </div>
            </div>

            {formData.rsmId && (
              <button
                type="button"
                onClick={handleResetHierarchy}
                className="inline-flex items-center text-xs text-gray-500 hover:text-red-600 transition-colors self-start sm:self-center px-3 py-1.5 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50"
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Reset Hierarchy
              </button>
            )}
          </div>
        </div>

        {/* Main Form */}
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
                    placeholder="Enter 10-digit phone number"
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

              {/* State / Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State / Region *
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className={inputClassName("region")}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.region}
                  </p>
                )}
              </div>

              {/* --- Hierarchy Selection Section (Full Width) --- */}
              <div className="md:col-span-2 pt-4 border-t border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Manager Reporting Structure
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Select the senior Regional Sales Manager (RSM) and 3 specialized Area Sales Managers (ASMs)
                </p>

                {/* Reporting RSM Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reporting Regional Sales Manager (RSM) *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.rsmId}
                      onChange={(e) => handleRsmSelectChange(e.target.value)}
                      className={`${inputClassName("rsmId")} pl-10`}
                    >
                      <option value="">-- Choose Reporting RSM --</option>
                      {activeRsms.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.firstName} {r.lastName} ({r.employeeId || r.rsmCode || "RSM"}) {r.region ? `• ${r.region}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.rsmId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> {errors.rsmId}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Choosing an RSM dynamically syncs the 3 specialized ASM pickers below
                  </p>
                </div>

                {/* 3 Specialized ASMs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {/* Slot 1: Personal Loan ASM */}
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                        Personal Loans
                      </span>
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Personal Loan ASM *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAsmSearchTerm("");
                        setShowPersonalAsmModal(true);
                      }}
                      className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                        formData.personalAsm
                          ? "bg-white border-blue-300 shadow-sm"
                          : "bg-white/80 border-dashed border-gray-300 hover:border-blue-400 text-gray-500"
                      }`}
                    >
                      {formData.personalAsm ? (
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formData.personalAsm.firstName} {formData.personalAsm.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {formData.personalAsm.employeeId || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-blue-600 font-medium">
                          + Select Personal ASM
                        </span>
                      )}
                    </button>
                    {errors.personalAsm && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> {errors.personalAsm}
                      </p>
                    )}
                  </div>

                  {/* Slot 2: Business Loan ASM */}
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                        Business Loans
                      </span>
                      <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Business Loan ASM *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAsmSearchTerm("");
                        setShowBusinessAsmModal(true);
                      }}
                      className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                        formData.businessAsm
                          ? "bg-white border-purple-300 shadow-sm"
                          : "bg-white/80 border-dashed border-gray-300 hover:border-purple-400 text-gray-500"
                      }`}
                    >
                      {formData.businessAsm ? (
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formData.businessAsm.firstName} {formData.businessAsm.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {formData.businessAsm.employeeId || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-purple-600 font-medium">
                          + Select Business ASM
                        </span>
                      )}
                    </button>
                    {errors.businessAsm && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> {errors.businessAsm}
                      </p>
                    )}
                  </div>

                  {/* Slot 3: Home & LAP Loan ASM */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        Home &amp; LAP Loans
                      </span>
                      <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Home &amp; LAP Loan ASM *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAsmSearchTerm("");
                        setShowHomeLapAsmModal(true);
                      }}
                      className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                        formData.homeLapAsm
                          ? "bg-white border-emerald-300 shadow-sm"
                          : "bg-white/80 border-dashed border-gray-300 hover:border-emerald-400 text-gray-500"
                      }`}
                    >
                      {formData.homeLapAsm ? (
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formData.homeLapAsm.firstName} {formData.homeLapAsm.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {formData.homeLapAsm.employeeId || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">
                          + Select Home &amp; LAP ASM
                        </span>
                      )}
                    </button>
                    {errors.homeLapAsm && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> {errors.homeLapAsm}
                      </p>
                    )}
                  </div>
                </div>
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
                <div className="mt-2 space-y-1 text-xs">
                  {(() => {
                    const checks = getPasswordChecks(formData.password);
                    const rules = [
                      { ok: checks.minLength, label: "At least 8 characters" },
                      { ok: checks.hasUpper, label: "At least 1 uppercase letter" },
                      { ok: checks.hasLower, label: "At least 1 lowercase letter" },
                      { ok: checks.hasNumber, label: "At least 1 number" },
                      { ok: checks.hasSpecial, label: "At least 1 special character" },
                    ];
                    return rules.map((rule) => (
                      <p
                        key={rule.label}
                        className={`flex items-center ${
                          rule.ok ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {rule.ok ? (
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {rule.label}
                      </p>
                    ));
                  })()}
                </div>
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

            {/* Error from API */}
            {!showModal && error && (
              <p className="mt-4 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" /> {error}
              </p>
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
                    Adding RM...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add RM
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modal: Select Personal Loan ASM */}
        {showPersonalAsmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-brand-primary p-4 text-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Select Personal Loan ASM</h3>
                    <p className="text-white/80 text-xs mt-0.5">
                      {selectedRsm
                        ? `Filtered to ASMs under RSM: ${selectedRsm.firstName} ${selectedRsm.lastName}`
                        : "Choosing an ASM will dynamically sync the reporting RSM"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPersonalAsmModal(false);
                      setAsmSearchTerm("");
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, employee ID, phone or email..."
                    value={asmSearchTerm}
                    onChange={(e) => setAsmSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3">
                {asmLoading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Loading ASMs...
                  </div>
                ) : filteredPersonalAsms.length > 0 ? (
                  filteredPersonalAsms.map((asm) => {
                    const isSelected = formData.personalAsm?._id === asm._id;
                    return (
                      <div
                        key={asm._id}
                        onClick={() => handlePersonalAsmSelection(asm)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {asm.firstName} {asm.lastName}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                PERSONAL
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {asm.employeeId || "N/A"} • {asm.email} • {asm.phone}
                            </p>
                            <p className="text-xs text-slate-600 font-medium mt-1">
                              Reporting RSM: {asm.rsmName || asm.asmName || "Direct / Unassigned"}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No Personal Loan ASMs found
                    {selectedRsm ? ` under ${selectedRsm.firstName} ${selectedRsm.lastName}` : ""}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Select Business Loan ASM */}
        {showBusinessAsmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-brand-primary p-4 text-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Select Business Loan ASM</h3>
                    <p className="text-white/80 text-xs mt-0.5">
                      {selectedRsm
                        ? `Filtered to ASMs under RSM: ${selectedRsm.firstName} ${selectedRsm.lastName}`
                        : "Choosing an ASM will dynamically sync the reporting RSM"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowBusinessAsmModal(false);
                      setAsmSearchTerm("");
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, employee ID, phone or email..."
                    value={asmSearchTerm}
                    onChange={(e) => setAsmSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3">
                {asmLoading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Loading ASMs...
                  </div>
                ) : filteredBusinessAsms.length > 0 ? (
                  filteredBusinessAsms.map((asm) => {
                    const isSelected = formData.businessAsm?._id === asm._id;
                    return (
                      <div
                        key={asm._id}
                        onClick={() => handleBusinessAsmSelection(asm)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                          isSelected
                            ? "border-purple-500 bg-purple-50/50 ring-1 ring-purple-500"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {asm.firstName} {asm.lastName}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                {asm.asmType || asm.rsmType || "BUSINESS"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {asm.employeeId || "N/A"} • {asm.email} • {asm.phone}
                            </p>
                            <p className="text-xs text-slate-600 font-medium mt-1">
                              Reporting RSM: {asm.rsmName || asm.asmName || "Direct / Unassigned"}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No Business Loan ASMs found
                    {selectedRsm ? ` under ${selectedRsm.firstName} ${selectedRsm.lastName}` : ""}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Select Home & LAP Loan ASM */}
        {showHomeLapAsmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-brand-primary p-4 text-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Select Home &amp; LAP Loan ASM</h3>
                    <p className="text-white/80 text-xs mt-0.5">
                      {selectedRsm
                        ? `Filtered to ASMs under RSM: ${selectedRsm.firstName} ${selectedRsm.lastName}`
                        : "Choosing an ASM will dynamically sync the reporting RSM"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowHomeLapAsmModal(false);
                      setAsmSearchTerm("");
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, employee ID, phone or email..."
                    value={asmSearchTerm}
                    onChange={(e) => setAsmSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3">
                {asmLoading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Loading ASMs...
                  </div>
                ) : filteredHomeLapAsms.length > 0 ? (
                  filteredHomeLapAsms.map((asm) => {
                    const isSelected = formData.homeLapAsm?._id === asm._id;
                    return (
                      <div
                        key={asm._id}
                        onClick={() => handleHomeLapAsmSelection(asm)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {asm.firstName} {asm.lastName}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {asm.asmType || asm.rsmType || "HOME_LAP"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {asm.employeeId || "N/A"} • {asm.email} • {asm.phone}
                            </p>
                            <p className="text-xs text-slate-600 font-medium mt-1">
                              Reporting RSM: {asm.rsmName || asm.asmName || "Direct / Unassigned"}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No Home &amp; LAP Loan ASMs found
                    {selectedRsm ? ` under ${selectedRsm.firstName} ${selectedRsm.lastName}` : ""}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddRMPage;
