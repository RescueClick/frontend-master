import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";

import {
  activateRM,
  fetchRmList,
  asmDeactivateRM,
  deleteRmAsm,
} from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import axios from "axios"
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";



const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function AsmRM() {
  const navigate = useNavigate();


  const [rmToActivate, setRmToActivate] = useState(null);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [rmToDeactivate, setRmToDeactivate] = useState(null);
  const [selectedReplacementRmId, setSelectedReplacementRmId] = useState(null);
  const [replacementSearch, setReplacementSearch] = useState("");
  
  

  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [rmToView, setRmToView] = useState(null);

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.asm.rmList);

  

  useEffect(() => {
    dispatch(fetchRmList());
  }, [dispatch]);

  const rmList = data;

  // Filtered list
  const filteredRms = useMemo(() => {
    if (!rmList || rmList.length === 0) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rmList;

    return rmList.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const rmCode = (r.rmCode || "").toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase();
      const rmMongoId = (r._id || "").toLowerCase();
      const asmMongoId = (r.asmId || "").toLowerCase();

      return (
        fullName.includes(term) ||
        rmCode.includes(term) ||
        employeeId.includes(term) ||
        rmMongoId.includes(term) ||
        asmMongoId.includes(term)
      );
    });
  }, [rmList, searchQuery]);

  const sortedFilteredRms = sortNewestFirst(filteredRms, { dateKeys: ["createdAt"] });

  const rmDeactivateCandidates = useMemo(() => {
    if (!rmToDeactivate || !data) return [];
    const term = replacementSearch.trim().toLowerCase();
    return (data || [])
      .filter((r) => r._id !== rmToDeactivate._id && r.status === "ACTIVE")
      .filter((r) => {
        if (!term) return true;
        const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
        const code = `${r.rmCode || ""}`.toLowerCase();
        return name.includes(term) || code.includes(term);
      })
      .map((r) => ({
        id: r._id,
        name: `${r.firstName} ${r.lastName}`,
        meta: r.rmCode ? `RM ${r.rmCode}` : undefined,
        statusBadge: r.status,
      }));
  }, [data, rmToDeactivate, replacementSearch]);

  // Handle view RM details
  const handleViewRM = (rm) => {
    setRmToView(rm);
    setShowViewModal(true);
  };



  const deactivateRm = async (rmToDeactivateId, selectedReplacementId) => {
    try {
      await dispatch(
        asmDeactivateRM({ oldRmId: rmToDeactivateId, newRmId: selectedReplacementId })
      ).unwrap();
      dispatch(fetchRmList());
    } catch (err) {
      // toast is handled in thunk
    } finally {
      setShowDeactivateModal(false);
      setRmToDeactivate(null);
      setSelectedReplacementRmId(null);
      setReplacementSearch("");
    }
  };

  const confirmActivateRm = async () => {
    if (!rmToActivate?._id) return;
    try {
      await dispatch(activateRM(rmToActivate._id)).unwrap();
      await dispatch(fetchRmList());
    } catch (err) {
      // Keep existing page behavior: silent fail in toggle path.
    } finally {
      setRmToActivate(null);
    }
  };

    
  const loginAsUser = async (userId, navigate) => {
    try {
      const { asmToken } = getAuthData();
      if (!asmToken) throw new Error("Admin not authenticated");
  
      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${asmToken}` } }
      );
  
      const { token, user } = res.data;
  
      // Save impersonated token without removing admin token
      saveAuthData(token, user, true);
  
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

  const handleDeleteRm = async (rmId) => {
    const confirmed = window.confirm(
      "Delete this RM account permanently? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteRmAsm(rmId)).unwrap();
      dispatch(fetchRmList());
      alert("RM deleted successfully");
    } catch (err) {
      alert(
        typeof err === "string" ? err : err?.message || "Failed to delete RM"
      );
    }
  };

  return (
    <>

      <div
        className="p-6"
        style={{
          background: colors.background,
          color: colors.text,
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Relationship Managers
            </h2>
            <p className="text-gray-600 mt-1">
              Total {filteredRms?.length || 0} records found
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
                placeholder="Search by name, RM code, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />



            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead style={{ background: colors.primary, color: "white" }}>
              <tr>
                <th className="px-2 py-4 text-left">User Name</th>
                <th className="px-2 py-4 text-left">User ID</th>
                <th className="px-2 py-4 text-left">Contact</th>
                <th className="px-2 py-4 text-left">Created On</th>
                <th className="px-2 py-4 text-left">Login as</th>
                <th className="px-2 py-4 text-left">Activation</th>
                <th className="px-2 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : sortedFilteredRms.length > 0 ? (
                sortedFilteredRms.map((rm) => (
                  <tr key={rm._id} className="border-b hover:bg-gray-50">
                    <td
                      className="px-2 py-3 align-top cursor-pointer"
                      onClick={() => {
                        navigate("/asm/analytics", {
                          state: { id: rm._id },
                        });
                      }}
                    >
                      {rm.firstName} {rm.lastName}
                    </td>
                    <td className="px-2 py-3 align-middle">{rm.employeeId}</td>
                    <td className="px-2 py-3 align-middle">
                      <span className="text-sm font-medium">
                        {rm.phone}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {new Date(rm.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                        onClick={() => handleLoginAs(rm._id)}
                      >
                        Login
                      </button>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                          rm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                        }`}
                        onClick={() => {
                          if (rm.status === "ACTIVE") {
                            setRmToDeactivate(rm);
                            setSelectedReplacementRmId(null);
                            setReplacementSearch("");
                            setShowDeactivateModal(true);
                          } else {
                            setRmToActivate(rm);
                          }
                        }}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            rm.status === "ACTIVE"
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-2 h-full flex-wrap">
                        <button
                          type="button"
                          className="cursor-pointer p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          title="Open RM analytics"
                          onClick={() =>
                            navigate("/asm/analytics", {
                              state: { id: rm._id },
                            })
                          }
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
                          onClick={() => handleViewRM(rm)}
                        >
                          Details
                        </button>
                        {rm.status !== "ACTIVE" && (
                          <button
                            className="cursor-pointer p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold"
                            onClick={() => handleDeleteRm(rm._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View RM Details Modal */}
      {showViewModal && rmToView && (
        <div
          className="fixed inset-0 bg-black/25  flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-brand-primary text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold">RM Details</h3>
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
            <div className="p-6 bg-[#F8FAFC] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-4 text-base">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <p>
                      <strong className="text-gray-700">Name:</strong>{" "}
                      <span className="text-gray-900">
                        {rmToView.firstName} {rmToView.lastName}
                      </span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Email:</strong>{" "}
                      <span className="text-gray-900">{rmToView.email}</span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Phone:</strong>{" "}
                      <span className="text-gray-900">{rmToView.phone}</span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Joined:</strong>{" "}
                      <span className="text-gray-900">
                        {new Date(rmToView.createdAt).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-4 text-base">
                    Work Information
                  </h4>
                  <div className="space-y-3">
                    <p>
                      <strong className="text-gray-700">Employee ID:</strong>{" "}
                      <span className="text-gray-900 font-mono">
                        {rmToView.employeeId}
                      </span>
                    </p>
                    <p>
                      <strong className="text-gray-700">RM Code:</strong>{" "}
                      <span className="text-gray-900 font-mono">
                        {rmToView.rmCode}
                      </span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Status:</strong>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rmToView.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rmToView.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2">
                  <h4 className="font-semibold text-[#111827] mb-4 text-base">
                    ASM Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p>
                      <strong className="text-gray-700">ASM Name:</strong>{" "}
                      <span className="text-gray-900">{rmToView.asmName || "N/A"}</span>
                    </p>
                    <p>
                      <strong className="text-gray-700">
                        ASM Employee ID:
                      </strong>{" "}
                      <span className="text-gray-900 font-mono">
                        {rmToView.asmEmployeeId || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Personal Loan RSM Information */}
                {rmToView.personalRsmName && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2">
                    <h4 className="font-semibold text-[#111827] mb-4 text-base">
                      Personal Loan RSM Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p>
                        <strong className="text-gray-700">RSM Name:</strong>{" "}
                        <span className="text-gray-900">{rmToView.personalRsmName}</span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Employee ID:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.personalRsmEmployeeId || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Phone:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.personalRsmPhone || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Email:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.personalRsmEmail || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Business & Home Loan RSM Information */}
                {rmToView.businessHomeRsmName && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2">
                    <h4 className="font-semibold text-[#111827] mb-4 text-base">
                      Business & Home Loan RSM Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p>
                        <strong className="text-gray-700">RSM Name:</strong>{" "}
                        <span className="text-gray-900">{rmToView.businessHomeRsmName}</span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Employee ID:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.businessHomeRsmEmployeeId || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Phone:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.businessHomeRsmPhone || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Email:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.businessHomeRsmEmail || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  className="px-6 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <ReassignmentDeactivateModal
        isOpen={showDeactivateModal && !!rmToDeactivate}
        title="Deactivate RM"
        subjectName={`${rmToDeactivate?.firstName || ""} ${rmToDeactivate?.lastName || ""}`.trim()}
        subjectMeta={
          rmToDeactivate?.rmCode
            ? `RM Code: ${rmToDeactivate.rmCode}`
            : rmToDeactivate?.status
              ? `Status: ${rmToDeactivate.status}`
              : ""
        }
        warningText="Partners and linked records must be reassigned to another active RM under your ASM before deactivation. Choose the replacement below."
        searchValue={replacementSearch}
        onSearchChange={setReplacementSearch}
        searchPlaceholder="Search by name or RM code"
        candidates={rmDeactivateCandidates}
        selectedId={selectedReplacementRmId}
        onSelect={setSelectedReplacementRmId}
        onCancel={() => {
          setShowDeactivateModal(false);
          setRmToDeactivate(null);
          setSelectedReplacementRmId(null);
          setReplacementSearch("");
        }}
        onConfirm={() =>
          deactivateRm(rmToDeactivate._id, selectedReplacementRmId)
        }
        confirmLabel="Confirm Deactivate & Assign"
        confirmDisabled={!selectedReplacementRmId}
      />

      <ActivationConfirmModal
        isOpen={!!rmToActivate}
        title="Activate RM"
        message="Are you sure you want to activate"
        subjectName={`${rmToActivate?.firstName || ""} ${rmToActivate?.lastName || ""}`.trim()}
        confirmLabel="Activate"
        onCancel={() => setRmToActivate(null)}
        onConfirm={confirmActivateRm}
      />





            
    </>
  );
}
