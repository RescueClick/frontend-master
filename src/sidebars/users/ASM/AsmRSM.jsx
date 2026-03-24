import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, Download } from "lucide-react";
import { fetchRsmList, activateRSM, deactivateRSM } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { designSystem, formatNumber } from "../../../utils/designSystem";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import toast from "react-hot-toast";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";

const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function AsmRSM() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [rsmToView, setRsmToView] = useState(null);
  const [rsmToDeactivate, setRsmToDeactivate] = useState(null);
  const [rsmToActivate, setRsmToActivate] = useState(null);

  const { data: rsmsData, loading, error } = useSelector((state) => state.asm.rsmList || { data: [], loading: false, error: null });
  
  // Extract RSMs from response (backend may return array directly or wrapped)
  const rsms = useMemo(() => {
    if (!rsmsData) return [];
    return Array.isArray(rsmsData) ? rsmsData : (rsmsData.rsms || rsmsData.data || []);
  }, [rsmsData]);

  // Fetch RSMs on mount
  useEffect(() => {
    dispatch(fetchRsmList());
  }, [dispatch]);

  // Filtered list (search by name, employee ID, or RSM type)
  const filteredRsms = useMemo(() => {
    if (!rsms || rsms.length === 0) return [];

    const term = searchQuery.trim().toLowerCase();
    if (!term) return rsms;

    return rsms.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase();
      const rsmType = (r.rsmType || "").toLowerCase();

      return (
        fullName.includes(term) ||
        employeeId.includes(term) ||
        rsmType.includes(term)
      );
    });
  }, [rsms, searchQuery]);

  // Handle view RSM analytics
  const handleViewAnalytics = (rsm) => {
    navigate("/asm/ASManalytics", {
      state: { id: rsm._id, role: "RSM" },
    });
  };

  // Handle view RSM details
  const handleViewRSM = (rsm) => {
    setRsmToView(rsm);
    setShowViewModal(true);
  };

  // Toggle activation
  const toggleActivation = (rsm) => {
    if (rsm.status === "ACTIVE") {
      setRsmToDeactivate(rsm);
    } else {
      setRsmToActivate(rsm);
    }
  };

  // Confirm activation
  const confirmActivate = async () => {
    if (!rsmToActivate) return;
    try {
      await dispatch(activateRSM(rsmToActivate._id)).unwrap();
      toast.success("RSM activated successfully");
      dispatch(fetchRsmList());
      setRsmToActivate(null);
    } catch (err) {
      toast.error(err || "Failed to activate RSM");
    }
  };

  // Confirm deactivation
  const confirmDeactivate = async () => {
    if (!rsmToDeactivate) return;
    try {
      await dispatch(deactivateRSM(rsmToDeactivate._id)).unwrap();
      toast.success("RSM deactivated successfully");
      dispatch(fetchRsmList());
      setRsmToDeactivate(null);
    } catch (err) {
      toast.error(err || "Failed to deactivate RSM");
    }
  };

  // Login as RSM
  const loginAsUser = async (userId) => {
    try {
      const { asmToken, adminToken } = getAuthData();
      
      // Determine which token to use (prioritize current role token)
      let currentToken = asmToken || adminToken;
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
      let currentUser = currentAuth.asmUser || currentAuth.adminUser;
      let currentUserToken = currentAuth.asmToken || currentAuth.adminToken;
      
      // If parent info is provided from backend, use it; otherwise use current user
      const parentInfo = parent || (currentUser ? { ...currentUser, token: currentUserToken } : null);

      // Save impersonated token - this will automatically clear parent token
      saveAuthData(token, user, true, parentInfo);

      // Navigate to role
      switch (user.role) {
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

  const handleLoginAs = (userId) => {
    loginAsUser(userId);
  };

  // Format data for table
  const tableData = useMemo(() => {
    const rows = filteredRsms.map((rsm) => ({
      ...rsm,
      name: `${rsm.firstName || ""} ${rsm.lastName || ""}`,
    }));
    return sortNewestFirst(rows, { dateKeys: ["createdAt", "updatedAt"] });
  }, [filteredRsms]);

  return (
    <div
      className="p-6"
      style={{
        background: designSystem.colors.background,
        color: designSystem.colors.text.primary,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: designSystem.colors.text.primary }}>
            Regional Sales Managers
          </h2>
          <p className="text-sm mt-1" style={{ color: designSystem.colors.text.secondary }}>
            Total {formatNumber(filteredRsms?.length || 0)} RSMs found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Search by name, employee ID, or RSM type"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
              <th className="px-2 py-4 text-left">RSM Name</th>
              <th className="px-2 py-4 text-left">User ID</th>
              <th className="px-2 py-4 text-left">RSM Type</th>
              <th className="px-2 py-4 text-left">Contact</th>
              <th className="px-2 py-4 text-left">Created On</th>
              <th className="px-2 py-4 text-left">Status</th>
              <th className="px-2 py-4 text-left">Login as</th>
              <th className="px-2 py-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : tableData && tableData.length > 0 ? (
              tableData.map((rsm) => (
                <tr key={rsm._id} className="border-b hover:bg-gray-50">
                  <td
                    className="px-2 py-3 align-top cursor-pointer"
                    onClick={() => handleViewAnalytics(rsm)}
                  >
                    {rsm.name}
                  </td>
                  <td className="px-2 py-3 align-middle">{rsm.employeeId || "N/A"}</td>
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
                    {rsm.createdAt
                      ? new Date(rsm.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-2 py-3 align-middle">
                    <div
                      onClick={() => toggleActivation(rsm)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                        rsm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          rsm.status === "ACTIVE"
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      ></div>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-middle">
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
                        title="Open RSM analytics"
                        onClick={() => handleViewAnalytics(rsm)}
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
                <td colSpan="8" className="text-center py-4">
                  No RSMs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View RSM Details Modal */}
      {showViewModal && rsmToView && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-brand-primary p-6 text-white relative">
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                ✕
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {rsmToView.firstName?.charAt(0)}
                    {rsmToView.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">RSM Details</h3>
                  <p className="text-white/90 text-sm">
                    {rsmToView.employeeId || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-[#F8FAFC] space-y-4">
              {/* Name + Role */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#111827] text-lg">
                      {rsmToView.name}
                    </h4>
                    <p className="text-gray-600 text-sm capitalize">
                      {rsmToView.role || "RSM"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rsmToView.status === "ACTIVE"
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {rsmToView.status}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h5 className="font-semibold text-[#111827] mb-3 flex items-center">
                  <div className="w-2 h-2 bg-[#F59E0B] rounded-full mr-2"></div>
                  Contact Information
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-[#111827] font-medium">
                      {rsmToView.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-[#111827] font-medium text-sm">
                      {rsmToView.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h5 className="font-semibold text-[#111827] mb-3 flex items-center">
                  <div className="w-2 h-2 bg-brand-primary rounded-full mr-2"></div>
                  System Information
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Employee Id.</p>
                    <p className="text-[#111827] font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                      {rsmToView.employeeId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">RSM Type</p>
                    <p className="text-[#111827] font-semibold">
                      {rsmToView.rsmType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Created</p>
                    <p className="text-[#111827]">
                      {rsmToView.createdAt
                        ? new Date(rsmToView.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activation Confirmation Modal */}
      {rsmToActivate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-primary p-6 text-white relative">
              <button
                onClick={() => setRsmToActivate(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold">Activate RSM</h3>
            </div>
            <div className="p-6 bg-[#F8FAFC] space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-[#111827]">Are you sure?</p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setRsmToActivate(null)}
                  className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmActivate}
                  className="px-4 py-2 text-sm rounded-md text-white bg-brand-primary hover:opacity-90"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {rsmToDeactivate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-primary p-6 text-white relative">
              <button
                onClick={() => setRsmToDeactivate(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold">Deactivate RSM?</h3>
            </div>
            <div className="p-6 bg-[#F8FAFC] space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-[#111827]">
                  Are you sure you want to deactivate {rsmToDeactivate.name}?
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setRsmToDeactivate(null)}
                  className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeactivate}
                  className="px-4 py-2 text-sm rounded-md text-white bg-red-500 hover:bg-red-600"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

