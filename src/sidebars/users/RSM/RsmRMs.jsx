import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, User, Mail, Phone, Calendar, Users, Download } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { fetchRsmRms, activateRM, rsmDeactivateRM } from "../../../feature/thunks/rsmThunks";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
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

export default function RsmRMs() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [rmToDeactivate, setRmToDeactivate] = useState(null);
  const [rmToActivate, setRmToActivate] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [replacementSearch, setReplacementSearch] = useState("");

  const { data: rmList, loading, error } = useSelector((state) => state.rsm.rms);

  useEffect(() => {
    dispatch(fetchRsmRms());
  }, [dispatch]);

  // Filtered list
  const filteredRms = useMemo(() => {
    if (!rmList || rmList.length === 0) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rmList;

    return rmList.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const rmCode = (r.rmCode || "").toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const phone = (r.phone || "").toLowerCase();

      return (
        fullName.includes(term) ||
        rmCode.includes(term) ||
        employeeId.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
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
    if (!downloadXlsx(rows, "rsm-rms.xlsx", "RMs")) {
      toast.error("No rows to export");
    }
  }, [sortedFilteredRms]);

  const rmDeactivateCandidates = useMemo(() => {
    if (!rmToDeactivate || !rmList) return [];
    const term = replacementSearch.trim().toLowerCase();
    return (rmList || [])
      .filter(
        (r) =>
          r._id !== rmToDeactivate._id &&
          r.status === "ACTIVE" &&
          `${r.firstName} ${r.lastName} ${r.rmCode || ""} ${r.phone || ""}`
            .toLowerCase()
            .includes(term)
      )
      .map((r) => ({
        id: r._id,
        name: `${r.firstName} ${r.lastName}`,
        meta: [r.rmCode, r.phone].filter(Boolean).join(" • ") || undefined,
        statusBadge: r.status,
      }));
  }, [rmList, rmToDeactivate, replacementSearch]);

  const handleToggleActivation = async (rm) => {
    if (rm.status === "ACTIVE") {
      setRmToDeactivate(rm);
      setReplacementSearch("");
      setSelectedReplacement(null);
      setShowDeactivateModal(true);
    } else {
      setRmToActivate(rm);
    }
  };

  const handleActivate = async () => {
    if (!rmToActivate?._id) return;
    try {
      await dispatch(activateRM(rmToActivate._id)).unwrap();
      dispatch(fetchRsmRms());
      setRmToActivate(null);
    } catch (err) {
      // toast is handled in thunk
    }
  };

  const handleDeactivate = async () => {
    if (!rmToDeactivate || !selectedReplacement) return;
    try {
      await dispatch(rsmDeactivateRM({ rmId: rmToDeactivate._id, newRmId: selectedReplacement })).unwrap();
      dispatch(fetchRsmRms());
      setShowDeactivateModal(false);
      setRmToDeactivate(null);
      setSelectedReplacement(null);
      setReplacementSearch("");
    } catch (err) {
      // toast is handled in thunk
    }
  };

  const loginAsUser = async (userId) => {
    try {
      const { rsmToken } = getAuthData();
      if (!rsmToken) throw new Error("RSM not authenticated");

      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${rsmToken}` } }
      );

      const { token, user } = res.data;
      saveAuthData(token, user, true);

      switch (user.role) {
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

  const openRmAnalytics = (rm) => {
    const name = `${rm.firstName || ""} ${rm.lastName || ""}`.trim();
    navigate("/rsm/analytics", {
      state: {
        id: rm._id,
        role: "RM",
        name,
        detail: "Relationship Manager",
      },
    });
  };

  const rsmRmColumns = [
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
          onClick={() => loginAsUser(rm._id)}
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
          onClick={() => handleToggleActivation(rm)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggleActivation(rm);
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
        </div>
      ),
    },
  ];

  return (
    <>
      <DashboardTablePage
        title="My Relationship Managers"
        subtitle={`Total ${filteredRms?.length || 0} RMs found`}
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
        error={error}
      >
        <AppAntTable
          columns={rsmRmColumns}
          dataSource={sortedFilteredRms}
          rowKey="_id"
          loading={loading}
          locale={{ emptyText: "No RMs found" }}
        />
      </DashboardTablePage>

      <ActivationConfirmModal
        isOpen={!!rmToActivate}
        title="Activate RM"
        message="Are you sure you want to activate"
        subjectName={`${rmToActivate?.firstName || ""} ${rmToActivate?.lastName || ""}`.trim()}
        confirmLabel="Activate"
        onCancel={() => setRmToActivate(null)}
        onConfirm={handleActivate}
      />

      <ReassignmentDeactivateModal
        isOpen={showDeactivateModal && !!rmToDeactivate}
        title="Deactivate RM"
        subjectName={
          rmToDeactivate
            ? `${rmToDeactivate.firstName} ${rmToDeactivate.lastName}`
            : ""
        }
        subjectMeta={
          rmToDeactivate?.rmCode
            ? `RM Code: ${rmToDeactivate.rmCode}`
            : rmToDeactivate?.status
              ? `Status: ${rmToDeactivate.status}`
              : ""
        }
        warningText={`Partners and customers under this RM will be reassigned to the active RM you select below.`}
        searchValue={replacementSearch}
        onSearchChange={setReplacementSearch}
        searchPlaceholder="Search replacement RM by name, code, or phone"
        candidates={rmDeactivateCandidates}
        selectedId={selectedReplacement}
        onSelect={setSelectedReplacement}
        onCancel={() => {
          setShowDeactivateModal(false);
          setRmToDeactivate(null);
          setSelectedReplacement(null);
          setReplacementSearch("");
        }}
        onConfirm={handleDeactivate}
        confirmLabel="Confirm Deactivate & Assign"
        confirmDisabled={!selectedReplacement}
      />
    </>
  );
}

