import React, { useEffect, useMemo, useState } from "react";
import { X, Calendar, IndianRupee, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import {
  fetchAsms,
  fetchRMs,
  adminDeactivateAsm,
  activateAsm,
  assignAsmBulkTarget,
  deleteAsm,
} from "../../../feature/thunks/adminThunks";
import toast from "react-hot-toast";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import axios from "axios";
import { loginAsUserThunk } from "../../../feature/thunks/adminThunks";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";


const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function ASM() {
  const dispatch = useDispatch();
  const [regionQuery, setRegionQuery] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [searchReplacement, setSearchReplacement] = useState("");
  const [selectedReplacementId, setSelectedReplacementId] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [userToActivate, setUserToActivate] = useState(null);
  const [asmToDelete, setAsmToDelete] = useState(null);
  const [deleteAsmSubmitting, setDeleteAsmSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingState, setLoading] = useState(false);
  

  useEffect(() => {
    // Get token from local storage
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchAsms(adminToken));
      dispatch(fetchRMs(adminToken));
    }
  }, [dispatch]);

  // 🔹 Fix: Access the correct state structure from adminSlice
  const { data: asm, loading, error } = useSelector((state) => state.admin.asm);
  const sortedAsm = sortNewestFirst(Array.isArray(asm) ? asm : [], { dateKeys: ["createdAt"] });

  const displayAsm = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    if (!q) return sortedAsm;
    return sortedAsm.filter((c) => {
      const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const id = (c.employeeId || "").toLowerCase();
      const code = (c.asmCode || "").toLowerCase();
      return name.includes(q) || id.includes(q) || code.includes(q);
    });
  }, [sortedAsm, regionQuery]);

  const asmDeactivateCandidates = useMemo(() => {
    if (!userToDeactivate || !asm) return [];
    const term = searchReplacement.trim().toLowerCase();
    const list = Array.isArray(asm) ? asm : [];
    return list
      .filter((u) => u?._id !== userToDeactivate._id && u.status === "ACTIVE")
      .filter((u) => {
        const hay = `${u.firstName || ""} ${u.lastName || ""} ${u.phone || ""} ${
          u.asmCode || ""
        } ${u.employeeId || ""}`.toLowerCase();
        return hay.includes(term);
      })
      .map((u) => ({
        id: u._id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        meta: [u.asmCode || u.phone, u.employeeId].filter(Boolean).join(" • ") || undefined,
        statusBadge: u.status,
      }));
  }, [asm, userToDeactivate, searchReplacement]);

  const navigate = useNavigate();

  const toggleActivation = (user) => {
    if (user?.status === "ACTIVE") {
      setUserToDeactivate(user);
      setShowDeactivateModal(true);
      setSelectedReplacementId(null);
      setSearchReplacement("");
      setConfirmError("");
      return;
    }
    if (user?.status !== "ACTIVE") {
      setUserToActivate(user);
      setShowActivateModal(true);
      return;
    }
  };

  
  const handleExport = () => {
    // Optional: Format data before exporting
    const formattedData = asm.map((user) => ({
      "First Name": user.firstName,
      "Last Name": user.lastName,
      "Date of Birth": new Date(user.dob).toLocaleDateString(),
      Email: user.email,
      Phone: user.phone,
      Region: user.region,
      Role: user.role,
      Status: user.status,
      "Employee ID": user.employeeId,
      "ASM Code": user.asmCode,
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "ASM.xlsx");
  };

 
    const months = [
      { name: "January", value: 1 },
      { name: "February", value: 2 },
      { name: "March", value: 3 },
      { name: "April", value: 4 },
      { name: "May", value: 5 },
      { name: "June", value: 6 },
      { name: "July", value: 7 },
      { name: "August", value: 8 },
      { name: "September", value: 9 },
      { name: "October", value: 10 },
      { name: "November", value: 11 },
      { name: "December", value: 12 },
    ];
  
    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i);
  
    const [formData, setFormData] = useState({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      target: 0,
    });

  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      try {
        await dispatch(
          assignAsmBulkTarget({
            month: Number(formData.month),
            year: formData.year,
            totalTarget: Number(formData.target),
          })
        ).unwrap();
  
        toast.success("Target assigned successfully!");
        setFormData((prev) => ({ ...prev, target: 0 })); // reset target field
      } catch (err) {
        console.error("Error assigning target:", err);
        toast.error("Failed to assign target. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  

     const loginAsUser = async (userId, navigate) => {
      try {
        const { adminToken, asmToken, rmToken, partnerToken } = getAuthData();
        
        // Determine which token to use (prioritize current role token)
        let currentToken = adminToken || asmToken || rmToken || partnerToken;
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
        let currentUser = currentAuth.adminUser || currentAuth.asmUser || currentAuth.rmUser || currentAuth.partnerUser;
        let currentUserToken = currentAuth.adminToken || currentAuth.asmToken || currentAuth.rmToken || currentAuth.partnerToken;
        
        // If parent info is provided from backend, use it; otherwise use current user
        const parentInfo = parent || (currentUser ? { ...currentUser, token: currentUserToken } : null);
    
        // Save impersonated token - this will automatically clear parent token
        saveAuthData(token, user, true, parentInfo);
    
        // Navigate to role
        switch (user.role) {
          case "ASM": navigate("/asm"); break;
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

  const handleConfirmDeleteAsm = async () => {
    if (!asmToDelete) return;
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      toast.error("Missing admin token");
      return;
    }
    setDeleteAsmSubmitting(true);
    try {
      await dispatch(deleteAsm(asmToDelete._id)).unwrap();
      dispatch(fetchAsms(adminToken));
      
      toast.success( "ASM deleted successfully");
      setAsmToDelete(null);
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : err?.message || "Failed to delete ASM",
      );
    } finally {
      setDeleteAsmSubmitting(false);
    }
  };

  const asmColumns = [
    {
      title: "User Name",
      key: "name",
      render: (_, c) => (
        <span className="text-sm font-medium text-gray-900">
          {c.firstName} {c.lastName}
        </span>
      ),
    },
    { title: "User ID", dataIndex: "employeeId", key: "eid" },
    {
      title: "Contact",
      dataIndex: "phone",
      key: "phone",
      render: (v) => <span className="text-sm font-medium">{v || "N/A"}</span>,
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
      render: (_, c) => (
        <button
          type="button"
          className="px-2 py-1 border rounded text-xs"
          style={{
            borderColor: colors.secondary,
            color: colors.secondary,
          }}
          onClick={() => handleLoginAs(c._id)}
        >
          Login
        </button>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, c) => (
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="button"
            tabIndex={0}
            aria-label={
              c.status === "ACTIVE"
                ? "Active — click to deactivate"
                : "Inactive — click to activate"
            }
            onClick={() => toggleActivation(c)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleActivation(c);
              }
            }}
            className={`shrink-0 flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
              c.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                c.status === "ACTIVE" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
          {c.status !== "ACTIVE" ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-red-200 bg-white p-1.5 text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-1"
              aria-label={`Delete ASM ${c.firstName || ""} ${c.lastName || ""}`.trim()}
              onClick={(e) => {
                e.stopPropagation();
                setAsmToDelete(c);
              }}
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
      render: (_, c) => (
        <div className="flex h-full flex-wrap items-center gap-3">
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
            onClick={() =>
              navigate("/admin/analytics", {
                state: {
                  id: c._id,
                  role: "ASM",
                  name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
                  detail: "Area Sales Manager",
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
  {isModalOpen && (
        <div className="fixed inset-0 bg-black/25 flex justify-center items-center z-50 transition-opacity duration-300 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 animate-slide-up">
            {/* Close Button */}
            <button
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Set Monthly Target
            </h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Track your goals with precision.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Month Input - Now a dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Month
                </label>
                <div className="relative">
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors appearance-none pr-10"
                    required
                  >
                    <option value="" disabled>
                      Select a month
                    </option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.name}
                      </option>
                    ))}
                  </select>
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                </div>
              </div>

              {/* Year Input - Now a dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Year
                </label>
                <div className="relative">
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors appearance-none pr-10"
                    required
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                </div>
              </div>

              {/* Target Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Target Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <IndianRupee className="w-5 h-5" />
                  </span>
                  <input
                    type="number"
                    name="target"
                    placeholder="Enter target amount"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-brand-primary text-white py-3 rounded-xl hover:bg-brand-primary-hover transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Save Target
              </button>
            </form>
          </div>
        </div>
      )}

      <DashboardTablePage
        title="Area Sales Manager"
        subtitle={`Total ${displayAsm?.length || 0} records found`}
        headerRight={
          <>
            <input
              type="text"
              value={regionQuery}
              onChange={(e) => setRegionQuery(e.target.value)}
              placeholder="Search by name "
              className="w-48 sm:w-64 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
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
        error={error}
      >
        <AppAntTable
          rowKey="_id"
          columns={asmColumns}
          dataSource={displayAsm}
          loading={loading || loadingState}
          size="small"
          locale={{ emptyText: "No ASM records found" }}
        />
      </DashboardTablePage>

      <ReassignmentDeactivateModal
        isOpen={showDeactivateModal && !!userToDeactivate}
        title="Deactivate ASM"
        warningText="When you deactivate an ASM, their responsibilities are reassigned to the replacement ASM you select. RMs and related ownership move to the new ASM."
        subjectName={`${userToDeactivate?.firstName || ""} ${userToDeactivate?.lastName || ""}`.trim()}
        subjectMeta={
          userToDeactivate ? `Current status: ${userToDeactivate.status}` : ""
        }
        searchValue={searchReplacement}
        onSearchChange={setSearchReplacement}
        searchPlaceholder="Search ASM by name, phone, or code"
        candidates={asmDeactivateCandidates}
        selectedId={selectedReplacementId}
        onSelect={setSelectedReplacementId}
        errorMessage={confirmError}
        confirmLoading={confirmBusy}
        confirmLoadingLabel="Reassigning..."
        confirmLabel="Confirm & Deactivate"
        confirmDisabled={!selectedReplacementId || confirmBusy}
        onCancel={() => {
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
          setSelectedReplacementId(null);
          setSearchReplacement("");
          setConfirmError("");
        }}
        onConfirm={async () => {
          setConfirmError("");
          if (!selectedReplacementId || !userToDeactivate?._id) return;
          const { adminToken } = getAuthData() || {};
          const token = adminToken;
          if (!token) {
            setConfirmError("Missing auth token");
            return;
          }
          try {
            setConfirmBusy(true);
            await dispatch(
              adminDeactivateAsm({
                oldAsmId: userToDeactivate._id,
                newAsmId: selectedReplacementId,
                token,
              })
            ).unwrap();
            dispatch(fetchRMs(token));
            dispatch(fetchAsms(token));
            setShowDeactivateModal(false);
            setUserToDeactivate(null);
            setSelectedReplacementId(null);
            setSearchReplacement("");
          } catch (err) {
            const msg =
              typeof err === "string"
                ? err
                : err?.message || "Failed to reassign";
            setConfirmError(msg);
          } finally {
            setConfirmBusy(false);
          }
        }}
      />

      <ActivationConfirmModal
        isOpen={showActivateModal && !!userToActivate}
        title="Activate ASM"
        message="Are you sure you want to activate"
        subjectName={`${userToActivate?.firstName || ""} ${userToActivate?.lastName || ""}`.trim()}
        confirmLabel={confirmBusy ? "Activating..." : "Activate"}
        confirmLoading={confirmBusy}
        onCancel={() => {
          setShowActivateModal(false);
          setUserToActivate(null);
        }}
        onConfirm={async () => {
          const { adminToken } = getAuthData() || {};
          const token = adminToken;
          if (!token || !userToActivate?._id) return;
          try {
            setConfirmBusy(true);
            await dispatch(activateAsm({ asmId: userToActivate._id, token })).unwrap();
            dispatch(fetchAsms(token));
            setShowActivateModal(false);
            setUserToActivate(null);
          } catch (err) {
            const msg =
              typeof err === "string"
                ? err
                : err?.message || "Failed to activate ASM";
          } finally {
            setConfirmBusy(false);
          }
        }}
      />

      <ActivationConfirmModal
        isOpen={!!asmToDelete}
        title="Delete ASM"
        message="Permanently delete this ASM account?"
        confirmLabel="Delete"
        confirmLoading={deleteAsmSubmitting}
        onCancel={() => {
          if (!deleteAsmSubmitting) setAsmToDelete(null);
        }}
        onConfirm={handleConfirmDeleteAsm}
      />
    </>
  );
}
