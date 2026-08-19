import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, Download, Plus, X, User, Mail, Phone, Lock, Calendar, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { fetchRSMs, createRSM, fetchAsms, activateRSM, adminDeactivateRsm, deleteRsm } from "../../../feature/thunks/adminThunks";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";

import toast from "react-hot-toast";
import { INDIAN_STATES } from "../../../utils/indianStates";

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
  const [rsmForTransfer, setRsmForTransfer] = useState(null);
  const [availableRms, setAvailableRms] = useState([]);
  const [loadingRms, setLoadingRms] = useState(false);
  const [selectedRmIdsForTransfer, setSelectedRmIdsForTransfer] = useState([]);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [selectedRmIdsForCreate, setSelectedRmIdsForCreate] = useState([]);
  const [rsmWorkloadSource, setRsmWorkloadSource] = useState(null);
  const [targetRsmWorkloadId, setTargetRsmWorkloadId] = useState("");
  const [workloadSearch, setWorkloadSearch] = useState("");
  const [workloadSubmitting, setWorkloadSubmitting] = useState(false);
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

  // const { data: deleteRsmData} = useSelector((state) => state.admin.deleteRsm);

  // console.log("deleteRsmData", deleteRsmData);

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
  const [rsmToDelete, setRsmToDelete] = useState(null);
  const [deleteRsmSubmitting, setDeleteRsmSubmitting] = useState(false);

  console.log("rsmToDelete", rsmToDelete);
  // console.log("deleteRsmSubmitting", deleteRsmSubmitting);
  

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

  const rsmWorkloadCandidates = useMemo(() => {
    if (!rsmWorkloadSource || !Array.isArray(rsms)) return [];
    const term = (workloadSearch || "").trim().toLowerCase();
    return rsms
      .filter(
        (r) =>
          r._id !== rsmWorkloadSource._id &&
          r.status === "ACTIVE" &&
          (r.rsmType || "").toUpperCase() ===
            (rsmWorkloadSource.rsmType || "").toUpperCase()
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
        meta: `${r.employeeId || "RSM"} • ASM: ${r.asmName || "N/A"}`,
        statusBadge: r.status,
      }));
  }, [rsms, rsmWorkloadSource, workloadSearch]);

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

  const handleConfirmDeleteRsm = async () => {
    if (!rsmToDelete) return;
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      toast.error("Missing admin token");
      return;
    }
    setDeleteRsmSubmitting(true);
    try {
      await dispatch(deleteRsm(rsmToDelete._id)).unwrap();
      dispatch(fetchRSMs(adminToken));
      toast.success("RSM deleted successfully",);
      setRsmToDelete(null);
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : err?.message || "Failed to delete RSM",
      );
    } finally {
      setDeleteRsmSubmitting(false);
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

  const fetchRmsForTransfer = async () => {
    setLoadingRms(true);
    try {
      const { adminToken } = getAuthData() || {};
      const res = await axios.get(`${backendurl}/admin/get-rms-for-transfer`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setAvailableRms(res.data || []);
    } catch (err) {
      console.error("Failed to load RMs:", err);
      toast.error("Failed to load RMs");
    } finally {
      setLoadingRms(false);
    }
  };

  const openTransferModal = (rsm) => {
    setRsmForTransfer(rsm);
    setSelectedRmIdsForTransfer([]);
    setTransferSearch("");
    fetchRmsForTransfer();
  };

  const handleConfirmTransfer = async () => {
    if (!rsmForTransfer || !selectedRmIdsForTransfer.length) {
      toast.error("Please select at least one RM to transfer");
      return;
    }
    setTransferSubmitting(true);
    try {
      const { adminToken } = getAuthData() || {};
      const res = await axios.post(
        `${backendurl}/admin/transfer-rm-to-rsm`,
        {
          rmIds: selectedRmIdsForTransfer,
          toRsmId: rsmForTransfer._id,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(res.data.message || "RMs transferred successfully");
      setRsmForTransfer(null);
      setSelectedRmIdsForTransfer([]);
      dispatch(fetchRSMs(adminToken));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to transfer RMs");
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleConfirmWorkloadTransfer = async () => {
    if (!rsmWorkloadSource || !targetRsmWorkloadId) {
      toast.error("Please select a target replacement RSM");
      return;
    }
    setWorkloadSubmitting(true);
    try {
      const { adminToken } = getAuthData() || {};
      const res = await axios.post(
        `${backendurl}/admin/transfer-rsm-workload`,
        {
          fromRsmId: rsmWorkloadSource._id,
          toRsmId: targetRsmWorkloadId,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(res.data.message || "RSM workload transferred successfully");
      setRsmWorkloadSource(null);
      setTargetRsmWorkloadId("");
      dispatch(fetchRSMs(adminToken));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to transfer RSM workload");
    } finally {
      setWorkloadSubmitting(false);
    }
  };

  const handleCreateRSM = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { adminToken } = getAuthData();
    if (!adminToken) {
      toast.error("Not authenticated. Please log in again.");
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
        rmIds: selectedRmIdsForCreate,
        token: adminToken,
      })).unwrap();

      toast.success("RSM created successfully");
      // Refresh RSM list
      dispatch(fetchRSMs(adminToken));
      setShowCreateModal(false);
      setSelectedRmIdsForCreate([]);
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
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="button"
            tabIndex={0}
            aria-label={
              rsm.status === "ACTIVE"
                ? "Active — click to deactivate"
                : "Inactive — click to activate"
            }
            className={`shrink-0 flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${rsm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"}`}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (rsm.status === "ACTIVE") {
                  setRsmToDeactivate(rsm);
                  setShowDeactivateModal(true);
                  setSelectedNewRsmId(null);
                  setSearchRsm("");
                } else {
                  setRSMactiveModel(rsm._id);
                }
              }
            }}
          >
            <div
              className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${rsm.status === "ACTIVE" ? "translate-x-6" : "translate-x-0"}`}
            />
          </div>
          {rsm.status !== "ACTIVE" ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-red-200 bg-white p-1.5 text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-1"
              aria-label={`Delete RSM ${rsm.firstName || ""} ${rsm.lastName || ""}`.trim()}
              onClick={() => setRsmToDelete(rsm)}
            >
              <Trash2 size={15} strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, rsm) => (
        <div className="flex h-full flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            onClick={() => openTransferModal(rsm)}
          >
            Assign / Transfer RMs
          </button>
          <button
            type="button"
            className="rounded px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
            onClick={() => {
              setRsmWorkloadSource(rsm);
              setTargetRsmWorkloadId("");
              setWorkloadSearch("");
            }}
          >
            Transfer to RSM
          </button>
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

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
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

      <ActivationConfirmModal
        isOpen={!!rsmToDelete}
        title="Delete RSM"
        message="Permanently delete this RSM account?"
        confirmLabel="Delete"
        confirmLoading={deleteRsmSubmitting}
        onCancel={() => {
          if (!deleteRsmSubmitting) setRsmToDelete(null);
        }}
        onConfirm={handleConfirmDeleteRsm}
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

      {/* Assign / Transfer RMs Modal */}
      {rsmForTransfer && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setRsmForTransfer(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-brand-primary text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Assign / Transfer RMs</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Target RSM: {rsmForTransfer.firstName} {rsmForTransfer.lastName} ({rsmForTransfer.employeeId || "N/A"}) • {rsmForTransfer.rsmType || "ALL"}
                </p>
              </div>
              <button
                className="text-white/80 hover:text-white rounded-full p-1.5"
                onClick={() => setRsmForTransfer(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search RM by name, ID, or phone..."
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {loadingRms ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading RMs...</div>
              ) : availableRms.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">No RMs available in system</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {availableRms
                    .filter((rm) => {
                      const term = transferSearch.trim().toLowerCase();
                      if (!term) return true;
                      const name = `${rm.firstName || ""} ${rm.lastName || ""}`.toLowerCase();
                      const eid = (rm.employeeId || "").toLowerCase();
                      const phone = (rm.phone || "").toLowerCase();
                      return name.includes(term) || eid.includes(term) || phone.includes(term);
                    })
                    .map((rm) => {
                      const isSelected = selectedRmIdsForTransfer.includes(rm._id);
                      const currentPersonal = rm.personalRsmId?.firstName ? `${rm.personalRsmId.firstName} ${rm.personalRsmId.lastName}` : "None";
                      const currentBiz = rm.businessHomeRsmId?.firstName ? `${rm.businessHomeRsmId.firstName} ${rm.businessHomeRsmId.lastName}` : "None";

                      return (
                        <div
                          key={rm._id}
                          onClick={() => {
                            setSelectedRmIdsForTransfer((prev) =>
                              prev.includes(rm._id)
                                ? prev.filter((id) => id !== rm._id)
                                : [...prev, rm._id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand-primary bg-blue-50/60 shadow-sm"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary pointer-events-none"
                            />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {rm.firstName} {rm.lastName}{" "}
                                <span className="text-xs font-normal text-gray-500">
                                  ({rm.employeeId || "RM"})
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Current Personal RSM: <span className="font-medium text-gray-700">{currentPersonal}</span> • Biz/Home RSM: <span className="font-medium text-gray-700">{currentBiz}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500 shrink-0">
                            <div><span className="font-semibold text-gray-800">{rm.partnerCount || 0}</span> Partners</div>
                            <div><span className="font-semibold text-gray-800">{rm.appCount || 0}</span> Apps</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="text-xs text-gray-600">
                Selected: <span className="font-bold text-gray-900">{selectedRmIdsForTransfer.length}</span> RM(s)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRsmForTransfer(null)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={transferSubmitting || !selectedRmIdsForTransfer.length}
                  onClick={handleConfirmTransfer}
                  className="px-5 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: colors.primary }}
                >
                  {transferSubmitting ? "Transferring..." : `Transfer ${selectedRmIdsForTransfer.length} RM(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer RSM Workload Modal */}
      <ReassignmentDeactivateModal
        isOpen={!!rsmWorkloadSource}
        title="Transfer RSM Workload"
        subjectName={`${rsmWorkloadSource?.firstName || ""} ${rsmWorkloadSource?.lastName || ""}`.trim()}
        subjectMeta={
          rsmWorkloadSource?.rsmType
            ? `RSM type: ${rsmWorkloadSource.rsmType}`
            : ""
        }
        warningText="All RMs and open application files under this RSM will be safely transferred to the selected active replacement RSM."
        searchValue={workloadSearch}
        onSearchChange={setWorkloadSearch}
        searchPlaceholder="Search target RSM by name or ID..."
        candidates={rsmWorkloadCandidates}
        selectedId={targetRsmWorkloadId}
        onSelect={setTargetRsmWorkloadId}
        onCancel={() => {
          setRsmWorkloadSource(null);
          setTargetRsmWorkloadId("");
          setWorkloadSearch("");
        }}
        onConfirm={handleConfirmWorkloadTransfer}
        confirmLabel={workloadSubmitting ? "Transferring..." : "Confirm & Transfer Workload"}
        confirmDisabled={!targetRsmWorkloadId || workloadSubmitting}
      />

    </>
  );
}

