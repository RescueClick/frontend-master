import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, Download, Plus, X, User, Mail, Phone, Lock, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { fetchRSMs, createRSM, fetchAsms, activateRSM, deactivateRSM } from "../../../feature/thunks/adminThunks";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function RSM() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [rsmToView, setRsmToView] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch RSMs and ASMs on mount
  useEffect(() => {
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchRSMs(adminToken));
      dispatch(fetchAsms(adminToken));
    }
  }, [dispatch]);

  // Get ASMs for dropdown
  const { data: asms } = useSelector((state) => state.admin.asm);
  const { loading: createLoading, error: createError, success: createSuccess } = useSelector((state) => state.admin.createRSMAdmin);

  // Prefill search from navigation state
  useEffect(() => {
    if (location?.state) {
      const incoming = location.state;

      if (typeof incoming === "string") {
        setSearchQuery(incoming);
      } else if (typeof incoming === "object" && incoming !== null) {
        const possible =
          incoming.employeeId || incoming.asmEmployeeId || incoming.query;
        if (possible) setSearchQuery(String(possible));
      }
    }
  }, [location]);

  // Get RSMs from Redux
  const { data: rsms, loading, error } = useSelector((state) => state.admin.rsm);

  // Filtered list (search by name, RSM code, or _id)
  const filteredRsms = useMemo(() => {
    if (!rsms || rsms.length === 0) return [];

    const term = searchQuery.trim().toLowerCase();
    if (!term) return rsms;

    return rsms.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase();
      const rsmMongoId = (r._id || "").toLowerCase();
      const asmMongoId = (r.asmId || "").toLowerCase();
      const rsmType = (r.rsmType || "").toLowerCase();

      return (
        fullName.includes(term) ||
        employeeId.includes(term) ||
        rsmMongoId.includes(term) ||
        asmMongoId.includes(term) ||
        rsmType.includes(term)
      );
    });
  }, [rsms, searchQuery]);

  const sortedFilteredRsms = sortNewestFirst(filteredRsms, { dateKeys: ["createdAt"] });

  // Handle view RSM details
  const handleViewRSM = (rsm) => {
    setRsmToView(rsm);
    setShowViewModal(true);
  };

  const handleExport = () => {
    // Format data before exporting
    const formattedData = rsms.map((user) => ({
      "First Name": user.firstName || "",
      "Last Name": user.lastName || "",
      "Date of Birth": user.dob ? new Date(user.dob).toLocaleDateString() : "",
      Email: user.email || "",
      Phone: user.phone || "",
      Role: user.role || "",
      Status: user.status || "",
      "Employee ID": user.employeeId || "",
      "RSM Type": user.rsmType || "",
      "ASM Name": user.asmName || "",
      "ASM Employee ID": user.asmEmployeeId || "",
      Region: user.region || "",
      "Created At": user.createdAt ? new Date(user.createdAt).toLocaleString() : "",
      "Updated At": user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "",
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RSMs");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blobData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blobData, "RSMs.xlsx");
  };

  const loginAsUser = async (userId, navigate) => {
    try {
      const { adminToken, asmToken, rsmToken, rmToken, partnerToken } = getAuthData();
      
      // Determine which token to use (prioritize current role token)
      let currentToken = adminToken || asmToken || rsmToken || rmToken || partnerToken;
      if (!currentToken) {
        alert("Not authenticated");
        return;
      }
  
      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
  
      const { token, user, parent } = res.data;
  
      // Get current user info to store as parent
      const currentAuth = getAuthData();
      let currentUser = currentAuth.adminUser || currentAuth.asmUser || currentAuth.rsmUser || currentAuth.rmUser || currentAuth.partnerUser;
      let currentUserToken = currentAuth.adminToken || currentAuth.asmToken || currentAuth.rsmToken || currentAuth.rmToken || currentAuth.partnerToken;
      
      // If parent info is provided from backend, use it; otherwise use current user
      const parentInfo = parent || (currentUser ? { ...currentUser, token: currentUserToken } : null);
  
      // Save impersonated token - this will automatically clear parent token
      saveAuthData(token, user, true, parentInfo);
  
      // Navigate to role
      switch (user.role) {
        case "ASM": navigate("/asm"); break;
        case "RSM": navigate("/rsm"); break;
        case "RM": navigate("/rm"); break;
        case "PARTNER": navigate("/partner"); break;
        case "CUSTOMER": navigate("/customer"); break;
        default: navigate("/"); break;
      }
    } catch (err) {
      console.error("Login as user failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || err.message || "Login as user failed");
    }
  };
  
  // Usage in component
  const handleLoginAs = (userId) => {
    loginAsUser(userId, navigate);
  };

  const [RSMactiveModel, setRSMactiveModel] = useState(null);
  const [rsmToDeactivate, setRsmToDeactivate] = useState(null);

  const handleRSMactive = () => {
    dispatch(activateRSM(RSMactiveModel));
    setTimeout(() => {
      setRSMactiveModel(null);
    }, 100);
  };

  const toggleActivation = (rsm) => {
    if (rsm.status === "ACTIVE") {
      // For deactivation, we don't need replacement (simple toggle)
      setRsmToDeactivate(rsm);
    } else {
      // For activation, show confirmation modal
      setRSMactiveModel(rsm._id);
    }
  };

  const confirmDeactivate = async () => {
    if (!rsmToDeactivate) return;
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      alert("Not authenticated");
      return;
    }

    try {
      await dispatch(deactivateRSM(rsmToDeactivate._id)).unwrap();
      dispatch(fetchRSMs(adminToken));
      setRsmToDeactivate(null);
    } catch (err) {
      alert(
        typeof err === "string"
          ? err
          : err?.message || "Failed to deactivate RSM"
      );
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.asmId) newErrors.asmId = "ASM is required";
    if (!formData.rsmType) newErrors.rsmType = "RSM Type is required";
    if (formData.dob && getAgeFromDOB(formData.dob) < 18) {
      newErrors.dob = "Must be at least 18 years old";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function getAgeFromDOB(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob)) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCreateRSM = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { adminToken } = getAuthData();
    if (!adminToken) {
      alert("Not authenticated");
      return;
    }

    try {
      await dispatch(createRSM({
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
      })).unwrap();

      // Refresh RSM list
      dispatch(fetchRSMs(adminToken));
      setShowCreateModal(false);
      setFormData({
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
      alert("RSM created successfully!");
    } catch (err) {
      alert(err || "Failed to create RSM");
    }
  };

  return (
    <>
      <div
        className="p-2"
        style={{ background: colors.background, color: colors.text }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-medium">Regional Sales Managers</h2>
            <p className="text-xs">
              Total {filteredRsms?.length || 0} records found
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Note: Creation of RSM is done from Admin Dashboard Quick Actions */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="border border-gray-300 rounded-md pl-7 pr-2 py-2 text-sm w-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Search by name, RSM type, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                handleExport();
              }}
            >
              <Download size={16} className="inline mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead style={{ background: colors.primary, color: "white" }}>
              <tr>
                <th className="px-2 py-4 text-left">User Name</th>
                <th className="px-2 py-4 text-left">User ID</th>
                <th className="px-2 py-4 text-left">RSM Type</th>
                <th className="px-2 py-4 text-left">Contact</th>
                <th className="px-2 py-4 text-left">ASM</th>
                <th className="px-2 py-4 text-left">Created On</th>
                <th className="px-2 py-4 text-left">Activation</th>
                <th className="px-2 py-4 text-left">Login as</th>
                <th className="px-2 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : sortedFilteredRsms.length > 0 ? (
                sortedFilteredRsms.map((rsm) => (
                  <tr key={rsm._id} className="border-b hover:bg-gray-50">
                    <td
                      className="px-2 py-3 align-top cursor-pointer"
                      onClick={() =>
                        navigate("/admin/Analytics", {
                          state: { id: rsm._id, role: "RSM" },
                        })
                      }
                    >
                      <div>
                        {rsm.firstName} {rsm.lastName}
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">{rsm.employeeId}</td>
                    <td className="px-2 py-3 align-middle">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {rsm.rsmType || "N/A"}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="text-sm font-medium">
                        {rsm.phone || "N/A"}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="text-sm">{rsm.asmName || "N/A"}</span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {new Date(rsm.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${rsm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        onClick={() => {
                          if (rsm.status === "ACTIVE") {
                            setRsmToDeactivate(rsm);
                          } else {
                            setRSMactiveModel(rsm._id);
                          }
                        }}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${rsm.status === "ACTIVE"
                              ? "translate-x-6"
                              : "translate-x-0"
                            }`}
                        />
                      </div>
                    </td>
                    <td>
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                        onClick={() => handleLoginAs(rsm._id)}
                      >
                        Login
                      </button>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-2 h-full">
                        <button
                          type="button"
                          className="cursor-pointer p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          title="Open analytics"
                          onClick={() =>
                            navigate("/admin/Analytics", {
                              state: { id: rsm._id, role: "RSM" },
                            })
                          }
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
                          onClick={() => handleViewRSM(rsm)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    No RSMs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View RSM Details Modal */}
      {showViewModal && rsmToView && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-brand-primary text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">RSM Details</h3>
                </div>
                <button
                  className="text-white/80 hover:text-white rounded-full p-2"
                  onClick={() => setShowViewModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 bg-[#F8FAFC] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-3 text-sm">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="font-medium text-sm">
                        {rsmToView.firstName} {rsmToView.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-mono">{rsmToView.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-mono">{rsmToView.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Joining date</p>
                      <p className="text-sm">
                        {new Date(rsmToView.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-3 text-sm">
                    Work Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Role</p>
                      <p className="text-sm">{rsmToView.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                      <p className="text-sm font-mono">{rsmToView.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">RSM Type</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {rsmToView.rsmType || "N/A"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          rsmToView.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rsmToView.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Region</p>
                      <p className="text-sm">{rsmToView.region || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* ASM Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-3 text-sm">
                    ASM Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ASM Name</p>
                      <p className="text-sm">{rsmToView.asmName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        ASM Employee ID
                      </p>
                      <p className="text-sm font-mono">
                        {rsmToView.asmEmployeeId || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create RSM Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-brand-primary text-white rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Create New RSM</h3>
                </div>
                <button
                  className="text-white/80 hover:text-white rounded-full p-2"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRSM} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg ${formErrors.firstName ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg ${formErrors.lastName ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {formErrors.lastName && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg ${formErrors.email ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg ${formErrors.phone ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg ${formErrors.dob ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  {formErrors.dob && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.dob}</p>
                  )}
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* ASM Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to ASM *
                  </label>
                  <select
                    name="asmId"
                    value={formData.asmId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.asmId ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select ASM</option>
                    {asms && asms.map((asm) => (
                      <option key={asm._id} value={asm._id}>
                        {asm.firstName} {asm.lastName} ({asm.employeeId})
                      </option>
                    ))}
                  </select>
                  {formErrors.asmId && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.asmId}</p>
                  )}
                </div>

                {/* RSM Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RSM Type *
                  </label>
                  <select
                    name="rsmType"
                    value={formData.rsmType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.rsmType ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select Type</option>
                    <option value="PERSONAL">Personal Loan RSM</option>
                    <option value="BUSINESS_HOME">Business & Home Loan RSM</option>
                  </select>
                  {formErrors.rsmType && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.rsmType}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg ${formErrors.password ? "border-red-500" : "border-gray-300"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword ? <Eye size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg ${formErrors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showConfirmPassword ? <Eye size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {createError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {createError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  {createLoading ? "Creating..." : "Create RSM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activation Confirmation Modal */}
      {RSMactiveModel && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Are you sure?</h3>
            <p className="text-gray-600 mb-5">Do you really want to proceed?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setRSMactiveModel(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                No
              </button>
              <button
                onClick={() => {
                  handleRSMactive();
                }}
                className="px-4 py-2 rounded-lg bg-brand-primary text-white"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {rsmToDeactivate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Deactivate RSM?</h3>
            <p className="text-gray-600 mb-5">
              Are you sure you want to deactivate {rsmToDeactivate.firstName} {rsmToDeactivate.lastName}?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setRsmToDeactivate(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDeactivate();
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

