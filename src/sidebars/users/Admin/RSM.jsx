import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, Download, Plus, X, User, Mail, Phone, Lock, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { fetchRSMs, createRSM, fetchAsms, activateRSM, adminDeactivateRsm } from "../../../feature/thunks/adminThunks";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";

import toast from "react-hot-toast";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
const [selectedNewRsmId, setSelectedNewRsmId] = useState(null);
const [searchRsm, setSearchRsm] = useState("");
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
  const { loading: createLoading, error: createError } = useSelector((state) => state.admin.createRSMAdmin);

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

  const rsmDeactivateCandidates = useMemo(() => {
    if (!rsmToDeactivate || !Array.isArray(rsms)) return [];
    const term = (searchRsm || "").trim().toLowerCase();
    return rsms
      .filter(
        (r) =>
          r._id !== rsmToDeactivate._id &&
          r.status === "ACTIVE" &&
          (r.rsmType || "").toUpperCase() ===
            (rsmToDeactivate.rsmType || "").toUpperCase()
      )
      .filter((r) =>
        term
          ? `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) ||
            `${r.employeeId || ""}`.toLowerCase().includes(term)
          : true
      )
      .map((r) => ({
        id: r._id,
        name: `${r.firstName} ${r.lastName}`,
        meta: r.employeeId || r.rsmType,
        statusBadge: r.status,
      }));
  }, [rsms, rsmToDeactivate, searchRsm]);

  const handleRSMactive = async () => {
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      toast.error("Missing admin token");
      return;
    }

    try {
      await dispatch(activateRSM(RSMactiveModel)).unwrap();
      dispatch(fetchRSMs(adminToken));
    } catch (err) {
      // toast is handled in thunk
    } finally {
      setTimeout(() => {
        setRSMactiveModel(null);
      }, 100);
    }
  };

  const confirmDeactivate = async () => {
    if (!rsmToDeactivate || !selectedNewRsmId) {
      toast.error("Please select a replacement RSM");
      return;
    }
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      toast.error("Not authenticated");
      return;
    }

    try {
      await dispatch(
        adminDeactivateRsm({
          rsmId: rsmToDeactivate._id,
          newRsmId: selectedNewRsmId,
        })
      ).unwrap();
      dispatch(fetchRSMs(adminToken));
      setShowDeactivateModal(false);
      setRsmToDeactivate(null);
      setSelectedNewRsmId(null);
      setSearchRsm("");
    } catch (err) {
      // toast is handled in thunk
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
      setCreateNotice("Not authenticated. Please log in again.");
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
    } catch (err) {
      // createError from redux is shown in the modal UI
    }
  };

  const rsmColumns = [
    {
      title: "User Name",
      key: "name",
      render: (_, rsm) => (
        <span className="text-sm font-medium text-gray-900">
          {rsm.firstName} {rsm.lastName}
        </span>
      ),
    },
    { title: "User ID", dataIndex: "employeeId", key: "eid" },
    {
      title: "RSM Type",
      dataIndex: "rsmType",
      key: "type",
      render: (v) => (
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
          {v || "N/A"}
        </span>
      ),
    },
    {
      title: "Contact",
      dataIndex: "phone",
      key: "phone",
      render: (v) => (
        <span className="text-sm font-medium">{v || "N/A"}</span>
      ),
    },
    {
      title: "ASM",
      dataIndex: "asmName",
      key: "asm",
      render: (v) => <span className="text-sm">{v || "N/A"}</span>,
    },
    {
      title: "Created On",
      dataIndex: "createdAt",
      key: "created",
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      title: "Login as",
      key: "login",
      render: (_, rsm) => (
        <button
          type="button"
          className="px-2 py-1 border rounded text-xs"
          style={{
            borderColor: colors.secondary,
            color: colors.secondary,
          }}
          onClick={() => handleLoginAs(rsm._id)}
        >
          Login
        </button>
      ),
    },
    {
      title: "Activation",
      key: "act",
      render: (_, rsm) => (
        <div
          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${rsm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"}`}
          onClick={() => {
            if (rsm.status === "ACTIVE") {
              setRsmToDeactivate(rsm);
              setShowDeactivateModal(true);
              setSelectedNewRsmId(null);
              setSearchRsm("");
            } else {
              setRSMactiveModel(rsm._id);
            }
          }}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${rsm.status === "ACTIVE" ? "translate-x-6" : "translate-x-0"}`}
          />
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, rsm) => (
        <div className="flex h-full flex-wrap items-center gap-3">
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
            onClick={() =>
              navigate("/admin/analytics", {
                state: {
                  id: rsm._id,
                  role: "RSM",
                  name: `${rsm.firstName || ""} ${rsm.lastName || ""}`.trim(),
                  detail: rsm.rsmType || "Regional Sales Manager",
                },
              })
            }
          >
            Analytics
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DashboardTablePage
        title="Regional Sales Managers"
        subtitle={`Total ${filteredRsms?.length || 0} records found`}
        headerRight={
          <>
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
              type="button"
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                handleExport();
              }}
            >
              <Download size={16} className="inline mr-2" />
              Export
            </button>
          </>
        }
        error={!showCreateModal && error ? error : null}
      >
        <AppAntTable
          rowKey="_id"
          columns={rsmColumns}
          dataSource={sortedFilteredRsms}
          loading={loading}
          size="small"
          locale={{ emptyText: "No RSMs found" }}
        />
      </DashboardTablePage>

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

      <ActivationConfirmModal
        isOpen={!!RSMactiveModel}
        title="Activate RSM"
        message="Are you sure you want to activate"
        confirmLabel="Activate"
        onCancel={() => setRSMactiveModel(null)}
        onConfirm={handleRSMactive}
      />

      <ReassignmentDeactivateModal
        isOpen={showDeactivateModal && !!rsmToDeactivate}
        title="Deactivate RSM"
        subjectName={`${rsmToDeactivate?.firstName || ""} ${rsmToDeactivate?.lastName || ""}`.trim()}
        subjectMeta={
          rsmToDeactivate?.rsmType
            ? `RSM type: ${rsmToDeactivate.rsmType}`
            : ""
        }
        warningText="All RMs under this RSM must be reassigned to another active RSM of the same type before deactivation. Select the replacement below."
        searchValue={searchRsm}
        onSearchChange={setSearchRsm}
        searchPlaceholder="Search by name or employee ID"
        candidates={rsmDeactivateCandidates}
        selectedId={selectedNewRsmId}
        onSelect={setSelectedNewRsmId}
        onCancel={() => {
          setShowDeactivateModal(false);
          setRsmToDeactivate(null);
          setSelectedNewRsmId(null);
          setSearchRsm("");
        }}
        onConfirm={confirmDeactivate}
        confirmLabel="Confirm & Deactivate"
        confirmDisabled={!selectedNewRsmId}
      />

    </>
  );
}

