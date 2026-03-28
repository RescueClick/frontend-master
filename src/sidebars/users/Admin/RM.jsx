import React, { useEffect, useMemo, useState } from "react";
import { Edit, Trash, Search, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { activateRM, adminDeactivateRM, deleteRm, fetchRMs } from "../../../feature/thunks/adminThunks";
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

const docTypeDisplayNames = {
  PAN: "PAN Card",
  AADHAR_FRONT: "Aadhaar Front",
  AADHAR_BACK: "Aadhaar Back",
  PHOTO: "Photo",
  SELFIE: "Selfie",
  ADDRESS_PROOF: "Address Proof",
  OTHER_DOCS: "Other Documents",
  BUSINESS_OTHER_DOCS: "Business Other Documents",
  COMPANY_ID_CARD: "Company ID Card",
  SALARY_SLIP_1: "Salary Slip 1",
  SALARY_SLIP_2: "Salary Slip 2",
  SALARY_SLIP_3: "Salary Slip 3",
  FORM_16_26AS: "Form 16 / 26AS",
  BANK_STATEMENT_1: "Bank Statement 1",
  BANK_STATEMENT_2: "Bank Statement 2",
  BANK_STATEMENT: "Bank Statement",
  SHOP_ACT: "Shop Act / Gumasta",
  UDHYAM_AADHAR: "Udyam Aadhaar",
  ITR: "ITR",
  GST_DOCUMENT: "GST Document",
  GST_CERTIFICATE: "GST Certificate",
  SHOP_PHOTO: "Shop Photo",
};

const toDocLabel = (docType) => {
  const key = String(docType || "").trim().toUpperCase();
  return docTypeDisplayNames[key] || key || "Document";
};

function RM() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [rmToDeactivate, setRmToDeactivate] = useState(null);
  const [replacementSearch, setReplacementSearch] = useState("");
  const [selectedReplacementRmId, setSelectedReplacementRmId] = useState(null);


  const [RMactiveModel, setRMactiveModel] = useState(null)

  // Fetch RMs on mount
  useEffect(() => {
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchRMs(adminToken));
    }
  }, [dispatch]);

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

  // Get RMs from Redux
  const { data: rms, loading, error } = useSelector((state) => state.admin.rm);




  // Filtered list (search by name, RM code, or _id)
  // Filtered list (search by RM name, RM code, RM _id/employeeId, or ASM _id)
  const filteredRms = useMemo(() => {
    if (!rms || rms.length === 0) return [];



    const term = searchQuery.trim().toLowerCase();
    if (!term) return rms;

    return rms.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const rmCode = (r.rmCode || "").toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase(); // RM employeeId
      const rmMongoId = (r._id || "").toLowerCase(); // RM MongoDB _id
      const asmMongoId = (r.asmId || "").toLowerCase(); // ASM MongoDB _id

      return (
        fullName.includes(term) ||
        rmCode.includes(term) ||
        employeeId.includes(term) ||
        rmMongoId.includes(term) ||
        asmMongoId.includes(term)
      );
    });
  }, [rms, searchQuery]);

  const sortedFilteredRms = sortNewestFirst(filteredRms, { dateKeys: ["createdAt"] });

  const rmDeactivateCandidates = useMemo(() => {
    if (!rmToDeactivate || !rms) return [];
    const term = replacementSearch.trim().toLowerCase();
    return (rms || [])
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
  }, [rms, rmToDeactivate, replacementSearch]);

  const handleDeactivateRM = async (rmToDeactivate, selectedReplacement) => {
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      toast.error("Missing admin token");
      return;
    }

    try {
      await dispatch(
        adminDeactivateRM({
          oldRmId: rmToDeactivate,
          newRmId: selectedReplacement,
        })
      ).unwrap();

      dispatch(fetchRMs(adminToken));

      setShowDeactivateModal(false);
      setRmToDeactivate(null);
      setSelectedReplacementRmId(null);
      setReplacementSearch("");
    } catch (err) {
      // toast is handled in thunk
    }
  };


  const handleExport = () => {
    // Format data before exporting
    const formattedData = rms.map((user) => ({
      "First Name": user.firstName || "",
      "Last Name": user.lastName || "",
      "Date of Birth": user.dob ? new Date(user.dob).toLocaleDateString() : "",
      Email: user.email || "",
      Phone: user.phone || "",
      Role: user.role || "",
      Status: user.status || "",
      "Employee ID": user.employeeId || "",
      "RM Code": user.rmCode || "",
      "ASM Name": user.asmName || "",
      "ASM Employee ID": user.asmEmployeeId || "",
      "Documents": user.docs ? user.docs.map((doc) => toDocLabel(doc.docType)).join(", ") : "",
      "Created At": user.createdAt ? new Date(user.createdAt).toLocaleString() : "",
      "Updated At": user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "",
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RMs");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blobData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blobData, "RMs.xlsx");
  };


  const handleRMactive = async () => {
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      toast.error("Missing admin token");
      return;
    }

    try {
      await dispatch(activateRM(RMactiveModel)).unwrap();
      dispatch(fetchRMs(adminToken));
    } catch (err) {
      // toast is handled in thunk
    } finally {
      setTimeout(() => {
        setRMactiveModel(null);
      }, 100);
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

  const handleDeleteRm = async (rmId) => {
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      alert("Missing admin token");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this RM account?"
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteRm(rmId)).unwrap();
      dispatch(fetchRMs(adminToken));
      alert("RM deleted");
    } catch (err) {
      alert(
        typeof err === "string" ? err : err?.message || "Failed to delete RM"
      );
    }
  };

  const rmColumns = [
    {
      title: "User Name",
      key: "name",
      render: (_, rm) => (
        <span className="text-sm font-medium text-gray-900">
          {rm.firstName} {rm.lastName}
        </span>
      ),
    },
    { title: "User ID", dataIndex: "employeeId", key: "eid" },
    {
      title: "Contact",
      dataIndex: "phone",
      key: "phone",
      render: (v) => (
        <span className="text-sm font-medium">{v || "N/A"}</span>
      ),
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
      render: (_, rm) => (
        <button
          type="button"
          className="px-2 py-1 border rounded text-xs"
          style={{
            borderColor: colors.secondary,
            color: colors.secondary,
          }}
          onClick={() => handleLoginAs(rm._id)}
        >
          Login
        </button>
      ),
    },
    {
      title: "Activation",
      key: "act",
      render: (_, rm) => (
        <div
          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${rm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"}`}
          onClick={() => {
            if (rm.status === "ACTIVE") {
              setRmToDeactivate(rm);
              setSelectedReplacementRmId(null);
              setReplacementSearch("");
              setShowDeactivateModal(true);
            } else {
              setRMactiveModel(rm._id);
            }
          }}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${rm.status === "ACTIVE" ? "translate-x-6" : "translate-x-0"}`}
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
            onClick={() =>
              navigate("/admin/analytics", {
                state: {
                  id: rm._id,
                  role: "RM",
                  name: `${rm.firstName || ""} ${rm.lastName || ""}`.trim(),
                  detail: "Relationship Manager",
                },
              })
            }
          >
            Analytics
          </button>
          {rm.status !== "ACTIVE" && (
            <button
              type="button"
              className="cursor-pointer p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold"
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
          <>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="border border-gray-300 rounded-md pl-7 pr-2 py-2 text-sm w-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Search by name, RM code, or ID"
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
        error={error}
      >
        <AppAntTable
          rowKey="_id"
          columns={rmColumns}
          dataSource={sortedFilteredRms}
          loading={loading}
          size="small"
          locale={{ emptyText: "No RMs found" }}
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
        warningText="Partners and linked records must be reassigned to another active RM before deactivation. Choose the replacement RM below."
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
          handleDeactivateRM(rmToDeactivate._id, selectedReplacementRmId)
        }
        confirmLabel="Confirm Deactivate & Assign"
        confirmDisabled={!selectedReplacementRmId}
      />


      <ActivationConfirmModal
        isOpen={!!RMactiveModel}
        title="Activate RM"
        message="Are you sure you want to activate"
        confirmLabel="Activate"
        onCancel={() => setRMactiveModel(null)}
        onConfirm={handleRMactive}
      />

    </>
  );
}

export { RM };
export default RM;
