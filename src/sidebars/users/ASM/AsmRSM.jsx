import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, X } from "lucide-react";
import { fetchRsmList, activateRSM, asmDeactivateRsm } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatNumber } from "../../../utils/designSystem";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import toast from "react-hot-toast";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import { downloadXlsx } from "../../../utils/downloadXlsx";

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
  const [rsmToDeactivate, setRsmToDeactivate] = useState(null);
  const [rsmToActivate, setRsmToActivate] = useState(null);
  const [replacementRsmId, setReplacementRsmId] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");
  const [rsmForTransfer, setRsmForTransfer] = useState(null);
  const [availableRms, setAvailableRms] = useState([]);
  const [loadingRms, setLoadingRms] = useState(false);
  const [selectedRmIdsForTransfer, setSelectedRmIdsForTransfer] = useState([]);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [rsmWorkloadSource, setRsmWorkloadSource] = useState(null);
  const [targetRsmWorkloadId, setTargetRsmWorkloadId] = useState("");
  const [workloadSearch, setWorkloadSearch] = useState("");
  const [workloadSubmitting, setWorkloadSubmitting] = useState(false);

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

  const handleExport = useCallback(() => {
    const rows = filteredRsms.map((r) => ({
      "First Name": r.firstName || "",
      "Last Name": r.lastName || "",
      "Employee ID": r.employeeId || "",
      "RSM Type": r.rsmType || "",
      Status: r.status || "",
      Email: r.email || "",
      Phone: r.phone || "",
      Region: r.region || "",
    }));
    if (!downloadXlsx(rows, "asm-rsms.xlsx", "RSMs")) {
      toast.error("No rows to export");
    }
  }, [filteredRsms]);

  // Handle view RSM analytics
  const handleViewAnalytics = (rsm) => {
    const name = `${rsm.firstName || ""} ${rsm.lastName || ""}`.trim();
    navigate("/asm/analytics", {
      state: {
        id: rsm._id,
        role: "RSM",
        name,
        detail: rsm.rsmType || "Regional Sales Manager",
      },
    });
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
      dispatch(fetchRsmList());
      setRsmToActivate(null);
    } catch (err) {
      // toast is handled in thunk
    }
  };

  // Confirm deactivation
  const confirmDeactivate = async () => {
    if (!rsmToDeactivate) return;
    if (!replacementRsmId) {
      toast.error("Please select replacement RSM");
      return;
    }
    try {
      await dispatch(
        asmDeactivateRsm({ rsmId: rsmToDeactivate._id, newRsmId: replacementRsmId })
      ).unwrap();
      dispatch(fetchRsmList());
      setRsmToDeactivate(null);
      setReplacementRsmId("");
      setReplacementSearch("");
    } catch (err) {
      // toast is handled in thunk
    }
  };

  const fetchRmsForTransfer = async () => {
    setLoadingRms(true);
    try {
      const { asmToken, adminToken } = getAuthData() || {};
      const token = asmToken || adminToken;
      const res = await axios.get(`${backendurl}/asm/get-rms-for-transfer`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const { asmToken, adminToken } = getAuthData() || {};
      const token = asmToken || adminToken;
      const res = await axios.post(
        `${backendurl}/asm/transfer-rm-to-rsm`,
        {
          rmIds: selectedRmIdsForTransfer,
          toRsmId: rsmForTransfer._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "RMs transferred successfully");
      setRsmForTransfer(null);
      setSelectedRmIdsForTransfer([]);
      dispatch(fetchRsmList());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to transfer RMs");
    } finally {
      setTransferSubmitting(false);
    }
  };

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
          ? `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase().includes(term) ||
            `${r.employeeId || ""}`.toLowerCase().includes(term)
          : true
      )
      .map((r) => ({
        id: r._id,
        name: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
        meta: `${r.employeeId || "RSM"} • ${r.rsmType || ""}`,
        statusBadge: r.status,
      }));
  }, [rsms, rsmWorkloadSource, workloadSearch]);

  const handleConfirmWorkloadTransfer = async () => {
    if (!rsmWorkloadSource || !targetRsmWorkloadId) {
      toast.error("Please select a target replacement RSM");
      return;
    }
    setWorkloadSubmitting(true);
    try {
      const { asmToken, adminToken } = getAuthData() || {};
      const token = asmToken || adminToken;
      const res = await axios.post(
        `${backendurl}/asm/transfer-rsm-workload`,
        {
          fromRsmId: rsmWorkloadSource._id,
          toRsmId: targetRsmWorkloadId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "RSM workload transferred successfully");
      setRsmWorkloadSource(null);
      setTargetRsmWorkloadId("");
      dispatch(fetchRsmList());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to transfer RSM workload");
    } finally {
      setWorkloadSubmitting(false);
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

  const asmRsmColumns = [
    {
      title: "RSM name",
      key: "name",
      render: (_, rsm) => (
        <span className="align-top text-sm font-medium text-gray-900">
          {rsm.name}
        </span>
      ),
    },
    {
      title: "User ID",
      key: "employeeId",
      render: (_, rsm) => rsm.employeeId || "N/A",
    },
    {
      title: "RSM type",
      key: "rsmType",
      render: (_, rsm) => (
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
          {rsm.rsmType || "N/A"}
        </span>
      ),
    },
    {
      title: "Contact",
      key: "phone",
      render: (_, rsm) => (
        <span className="text-sm font-medium">{rsm.phone || "N/A"}</span>
      ),
    },
    {
      title: "Created on",
      key: "createdAt",
      render: (_, rsm) =>
        rsm.createdAt
          ? new Date(rsm.createdAt).toLocaleDateString()
          : "N/A",
    },
    {
      title: "Status",
      key: "status",
      render: (_, rsm) => (
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleActivation(rsm)}
          className={`flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
            rsm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleActivation(rsm);
            }
          }}
        >
          <div
            className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              rsm.status === "ACTIVE" ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </div>
      ),
    },
    {
      title: "Login as",
      key: "login",
      render: (_, rsm) => (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          style={{ borderColor: colors.secondary, color: colors.secondary }}
          onClick={() => handleLoginAs(rsm._id)}
        >
          Login
        </button>
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
            onClick={() => handleViewAnalytics(rsm)}
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
        subtitle={`Total ${formatNumber(filteredRsms?.length || 0)} RSMs found`}
        headerRight={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="w-72 max-w-[80vw] rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary sm:w-80 sm:py-2.5"
                placeholder="Search by name, employee ID, or RSM type"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        }
        error={error}
      >
        <AppAntTable
          columns={asmRsmColumns}
          dataSource={tableData}
          rowKey="_id"
          loading={loading}
          locale={{ emptyText: "No RSMs found" }}
        />
      </DashboardTablePage>

      <ActivationConfirmModal
        isOpen={!!rsmToActivate}
        title="Activate RSM"
        message="Are you sure you want to activate"
        subjectName={`${rsmToActivate?.firstName || ""} ${rsmToActivate?.lastName || ""}`.trim()}
        confirmLabel="Activate"
        onCancel={() => setRsmToActivate(null)}
        onConfirm={confirmActivate}
      />

      <ReassignmentDeactivateModal
        isOpen={!!rsmToDeactivate}
        title="Deactivate RSM"
        subjectName={`${rsmToDeactivate?.firstName || ""} ${rsmToDeactivate?.lastName || ""}`.trim()}
        subjectMeta={
          rsmToDeactivate?.rsmType
            ? `RSM type: ${rsmToDeactivate.rsmType}`
            : ""
        }
        warningText="RMs reporting to this RSM must be reassigned to another active RSM of the same loan type before deactivation. Select the replacement below."
        searchValue={replacementSearch}
        onSearchChange={setReplacementSearch}
        searchPlaceholder="Search replacement RSM..."
        candidates={(rsms || [])
          .filter(
            (r) =>
              rsmToDeactivate &&
              r._id !== rsmToDeactivate._id &&
              r.status === "ACTIVE" &&
              String(r.rsmType || "").toUpperCase() ===
                String(rsmToDeactivate.rsmType || "").toUpperCase()
          )
          .filter((r) =>
            `${r.firstName || ""} ${r.lastName || ""} ${r.employeeId || ""}`
              .toLowerCase()
              .includes((replacementSearch || "").toLowerCase())
          )
          .map((r) => ({
            id: r._id,
            name: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
            meta: r.employeeId || r._id,
            statusBadge: r.status,
          }))}
        selectedId={replacementRsmId}
        onSelect={setReplacementRsmId}
        onCancel={() => {
          setRsmToDeactivate(null);
          setReplacementRsmId("");
          setReplacementSearch("");
        }}
        onConfirm={confirmDeactivate}
        confirmLabel="Confirm & Deactivate"
        confirmDisabled={!replacementRsmId}
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
                <div className="py-8 text-center text-sm text-gray-500">No RMs available under your management</div>
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

