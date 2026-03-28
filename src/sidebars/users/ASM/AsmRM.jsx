import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";

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
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import toast from "react-hot-toast";
import { downloadXlsx } from "../../../utils/downloadXlsx";



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

  const handleExport = useCallback(() => {
    const rows = sortedFilteredRms.map((r) => ({
      "First Name": r.firstName || "",
      "Last Name": r.lastName || "",
      "Employee ID": r.employeeId || "",
      "RM Code": r.rmCode || "",
      Status: r.status || "",
      Email: r.email || "",
      Phone: r.phone || "",
    }));
    if (!downloadXlsx(rows, "asm-rms.xlsx", "RMs")) {
      toast.error("No rows to export");
    }
  }, [sortedFilteredRms]);

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

  const openRmAnalytics = (rm) => {
    const name = `${rm.firstName || ""} ${rm.lastName || ""}`.trim();
    navigate("/asm/analytics", {
      state: {
        id: rm._id,
        role: "RM",
        name,
        detail: "Relationship Manager",
      },
    });
  };

  const asmRmColumns = [
    {
      title: "User name",
      key: "name",
      render: (_, rm) => (
        <span className="align-top text-sm font-medium text-gray-900">
          {rm.firstName} {rm.lastName}
        </span>
      ),
    },
    { title: "User ID", dataIndex: "employeeId", key: "employeeId" },
    {
      title: "Contact",
      key: "phone",
      render: (_, rm) => (
        <span className="text-sm font-medium">{rm.phone}</span>
      ),
    },
    {
      title: "Created on",
      key: "createdAt",
      render: (_, rm) =>
        new Date(rm.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      title: "Login as",
      key: "login",
      render: (_, rm) => (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          style={{ borderColor: colors.secondary, color: colors.secondary }}
          onClick={() => handleLoginAs(rm._id)}
        >
          Login
        </button>
      ),
    },
    {
      title: "Activation",
      key: "activation",
      render: (_, rm) => (
        <div
          role="button"
          tabIndex={0}
          className={`flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
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
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (rm.status === "ACTIVE") {
                setRmToDeactivate(rm);
                setSelectedReplacementRmId(null);
                setReplacementSearch("");
                setShowDeactivateModal(true);
              } else setRmToActivate(rm);
            }
          }}
        >
          <div
            className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              rm.status === "ACTIVE" ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, rm) => (
        <div className="flex h-full flex-wrap items-center gap-3">
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
            onClick={() => openRmAnalytics(rm)}
          >
            Analytics
          </button>
          {rm.status !== "ACTIVE" && (
            <button
              type="button"
              className="cursor-pointer rounded-full bg-red-100 p-1 text-xs font-semibold text-red-700 hover:bg-red-200"
              onClick={() => handleDeleteRm(rm._id)}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>

      <DashboardTablePage
        title="Relationship Managers"
        subtitle={`Total ${filteredRms?.length || 0} records found`}
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
                placeholder="Search by name, RM code, or ID"
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
      >
        <AppAntTable
          columns={asmRmColumns}
          dataSource={sortedFilteredRms}
          rowKey="_id"
          loading={loading}
          locale={{ emptyText: "No data found" }}
        />
      </DashboardTablePage>


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
