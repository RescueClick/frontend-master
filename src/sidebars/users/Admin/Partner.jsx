import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  activatePartner,
  fetchPartners,
  adminDeactivatePartner,
  rejectPartner,
} from "../../../feature/thunks/adminThunks";
import { getAuthData,saveAuthData } from "../../../utils/localStorage";
import axios from "axios";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import toast from "react-hot-toast";


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


export default function PartnerTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, data } = useSelector((state) => state.admin.partners);

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newPartnerId, setNewPartnerId] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");

  const [PartneractiveModel, setPartneractiveModel] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  /** null | { mode: 'single', partner } | { mode: 'all', partners: [] } */
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  console.log(" partners : ", data);



  useEffect(() => {
    const { adminToken } = getAuthData();
    if (adminToken) {
      dispatch(fetchPartners(adminToken));
    }
  }, [dispatch]);

  const toggleActivation = (partner) => {
    if (partner.status === "ACTIVE") {
      setSelectedPartner(partner);
      setModalOpen(true);
    } else {
      // Optionally handle re-activation here
    }
  };

  const otherPartners = data.filter((p) => p._id !== selectedPartner?._id);

  const handleConfirmDeactivation = () => {
    if (!newPartnerId) return;
    dispatch(
      adminDeactivatePartner({
        oldPartnerId: selectedPartner._id,
        newPartnerId,
      })
    );

    setModalOpen(false);
    setSelectedPartner(null);
    setNewPartnerId("");
    setReplacementSearch("");
  };

  const handleCancelDeactivation = () => {
    setModalOpen(false);
    setSelectedPartner(null);
    setNewPartnerId("");
    setReplacementSearch("");
  };

  const handleExport = () => {
    // Format data before exporting
    const formattedData = data.map((user) => ({
      "First Name": user.firstName,
      "Middle Name": user.middleName || "",
      "Last Name": user.lastName,
      "Date of Birth": new Date(user.dob).toLocaleDateString(),
      Email: user.email,
      Phone: user.phone,
      Address: user.address,
      Region: user.region,
      Pincode: user.pincode,
      "Home Type": user.homeType || "",
      "Address Stability": user.addressStability || "",
      Landmark: user.landmark || "",
      "Employment Type": user.employmentType || "",
      "Bank Name": user.bankName || "",
      "Account Number": user.accountNumber || "",
      IFSC: user.ifscCode || "",
      Role: user.role,
      Status: user.status,
      "Employee ID": user.employeeId,
      "Partner Code": user.partnerCode,
      "Aadhar Number": user.aadharNumber || "",
      "PAN Number": user.panNumber || "",
      "ASM Name": user.asmName,
      "ASM Employee ID": user.asmEmployeeId,
      "RM Name": user.rmName,
      "RM Employee ID": user.rmEmployeeId,
      Documents: user.docs.map((doc) => toDocLabel(doc.docType)).join(", "), // list all doc types
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blobData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blobData, "partners.xlsx");
  };

  const handlePartneractive = () => {
    dispatch(activatePartner(PartneractiveModel));
    setTimeout(() => {
      setPartneractiveModel(null);
    }, 100);
  };

  const filteredPartners = useMemo(() => {
    if (!data || data.length === 0) return [];

    console.log(JSON.stringify(data));

    const term = searchQuery.trim().toLowerCase();
    if (!term) return data;

    return data.filter((partner) => {
      const fullName = `${partner.firstName || ""} ${
        partner.middleName || ""
      } ${partner.lastName || ""}`.toLowerCase();
      const email = (partner.email || "").toLowerCase();
      const phone = (partner.phone || "").toLowerCase();
      const partnerId = (partner._id || "").toLowerCase();
      const partnerCode = (partner.partnerCode || "").toLowerCase();
      const employeeId = (partner.employeeId || "").toLowerCase();
      const rmName = (partner.rmName || "").toLowerCase();
      const rmEmployeeId = (partner.rmEmployeeId || "").toLowerCase();
      const asmName = (partner.asmName || "").toLowerCase();
      const asmEmployeeId = (partner.asmEmployeeId || "").toLowerCase();
      const rmId = (partner.rmId || "").toLowerCase();
      const asmId = (partner.asmId || "").toLowerCase();

      return (
        fullName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        partnerId.includes(term) ||
        partnerCode.includes(term) ||
        employeeId.includes(term) ||
        rmName.includes(term) ||
        rmEmployeeId.includes(term) ||
        asmName.includes(term) ||
        asmEmployeeId.includes(term) ||
        rmId.includes(term) ||
        asmId.includes(term)
      );
    });
  }, [data, searchQuery]);

  const sortedFilteredPartners = sortNewestFirst(filteredPartners, { dateKeys: ["createdAt"] });

  const deactivatedPartners = useMemo(
    () => (data || []).filter((p) => p.status !== "ACTIVE"),
    [data]
  );

  const closeDeleteConfirm = () => {
    if (!deleteSubmitting) setDeleteConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { adminToken } = getAuthData();
    setDeleteSubmitting(true);
    try {
      if (deleteConfirm.mode === "single") {
        await dispatch(rejectPartner(deleteConfirm.partner._id)).unwrap();
        
        toast.success("Partner deleted successfully");
      } else {
        const count = deleteConfirm.partners.length;
        for (const p of deleteConfirm.partners) {
          await dispatch(rejectPartner(p._id)).unwrap();
        }
        toast.success(
          count === 1
            ? "1 partner deleted successfully"
            : `${count} partners deleted successfully`
        );
      }
      if (adminToken) dispatch(fetchPartners(adminToken));
      setDeleteConfirm(null);
    } catch (e) {
      toast.error(typeof e === "string" ? e : e?.message || "Delete failed");
      if (adminToken) dispatch(fetchPartners(adminToken));
    } finally {
      setDeleteSubmitting(false);
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

  const openPartnerAnalytics = (p) => {
    navigate("/admin/analytics", {
      state: {
        id: p._id,
        role: "PARTNER",
        name: `${p.firstName || ""} ${p.middleName || ""} ${p.lastName || ""}`.replace(/\s+/g, " ").trim(),
        detail: "Partner",
      },
    });
  };

  const partnerColumns = [
    {
      title: "User name",
      key: "name",
      render: (_, p) => (
        <span className="align-top text-sm font-semibold text-gray-900">
          {p.firstName} {p.lastName}
        </span>
      ),
    },
    {
      title: "User ID",
      key: "employeeId",
      render: (_, p) => (
        <span className="font-medium">{p.employeeId || p._id}</span>
      ),
    },
    {
      title: "Contact",
      key: "phone",
      render: (_, p) => <div className="text-sm">{p.phone}</div>,
    },
    {
      title: "Created on",
      key: "createdAt",
      render: (_, p) =>
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—",
    },
    {
      title: "RM name",
      key: "rmName",
      render: (_, p) => p.rmName || "—",
    },
    {
      title: "Login as",
      key: "login",
      render: (_, p) => (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          style={{ borderColor: colors.secondary, color: colors.secondary }}
          onClick={() => handleLoginAs(p._id)}
        >
          Login
        </button>
      ),
    },
    {
      title: "Activation",
      key: "activation",
      render: (_, p) => (
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="button"
            tabIndex={0}
            aria-label={
              p.status === "ACTIVE" ? "Active — click to suspend" : "Inactive — click to activate"
            }
            className={`shrink-0 flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
              p.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
            }`}
            onClick={() => {
              if (p.status === "ACTIVE") {
                toggleActivation(p);
              } else {
                setPartneractiveModel(p._id);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (p.status === "ACTIVE") toggleActivation(p);
                else setPartneractiveModel(p._id);
              }
            }}
          >
            <div
              className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                p.status === "ACTIVE" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
          {p.status !== "ACTIVE" ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-1"
              onClick={() => setDeleteConfirm({ mode: "single", partner: p })}
              aria-label={`Delete partner ${p.firstName || ""} ${p.lastName || ""}`.trim()}
            >
              <Trash2 size={18} strokeWidth={2.25} className="opacity-90" aria-hidden />
            </button>
          ) : null}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, p) => (
        <div className="flex h-full flex-wrap items-center gap-3">
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
            onClick={() => openPartnerAnalytics(p)}
          >
            Analytics
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ background: colors.background, color: colors.text }}>
      <ReassignmentDeactivateModal
        isOpen={modalOpen}
        title="Suspend Partner"
        summaryBadgeText="Will be suspended"
        subjectName={`${selectedPartner?.firstName || ""} ${selectedPartner?.lastName || ""}`.trim()}
        subjectMeta={
          selectedPartner?.employeeId
            ? `Employee ID: ${selectedPartner.employeeId}`
            : ""
        }
        warningText="Linked customers and applications will be reassigned to the active partner you select. This action deactivates the current partner."
        searchValue={replacementSearch}
        onSearchChange={setReplacementSearch}
        searchPlaceholder="Search replacement partner..."
        candidates={otherPartners
          .filter((p) => p.status === "ACTIVE")
          .filter((p) =>
            `${p.firstName || ""} ${p.lastName || ""} ${p.employeeId || ""}`
              .toLowerCase()
              .includes((replacementSearch || "").toLowerCase())
          )
          .map((p) => ({
            id: p._id,
            name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
            meta: p.employeeId || p._id,
            statusBadge: p.status,
          }))}
        selectedId={newPartnerId}
        onSelect={setNewPartnerId}
        onCancel={handleCancelDeactivation}
        onConfirm={handleConfirmDeactivation}
        confirmLabel="Yes, Suspend"
        confirmDisabled={!newPartnerId}
      />

        <ActivationConfirmModal
          isOpen={!!PartneractiveModel}
          title="Activate Partner"
          message="Are you sure you want to activate"
          confirmLabel="Activate"
          onCancel={() => setPartneractiveModel(null)}
          onConfirm={handlePartneractive}
        />

        <ActivationConfirmModal
          isOpen={!!deleteConfirm}
          title={
            deleteConfirm?.mode === "all"
              ? "Delete all deactivated partners"
              : "Delete partner"
          }
          message={
            deleteConfirm?.mode === "all"
              ? `Permanently delete ${deleteConfirm?.partners?.length ?? 0} deactivated partner(s)? This cannot be undone.`
              : "Permanently delete"
          }
          subjectName={
            deleteConfirm?.mode === "single"
              ? `${deleteConfirm.partner.firstName || ""} ${deleteConfirm.partner.lastName || ""}`.trim()
              : ""
          }
          confirmLabel="Delete"
          confirmLoading={deleteSubmitting}
          onCancel={closeDeleteConfirm}
          onConfirm={handleDeleteConfirm}
        />

        <DashboardTablePage
          title="Partner"
          subtitle={
            loading ? "Loading..." : `Total ${data.length} records found`
          }
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
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                onClick={() => {
                  handleExport();
                }}
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
            </>
          }
        >
          <AppAntTable
            columns={partnerColumns}
            dataSource={sortedFilteredPartners}
            rowKey="_id"
            loading={loading}
            locale={{ emptyText: "No partners found." }}
          />
        </DashboardTablePage>
      </div>
    </>
  );
}
