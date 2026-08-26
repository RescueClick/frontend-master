import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, Trash2, FileText, Award, CreditCard, Edit3, X } from "lucide-react";
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
import { INDIAN_STATE_FILTER_OPTIONS } from "../../../utils/indianStates";


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
  AADHAAR_FRONT: "Aadhaar Front",
  AADHAR_BACK: "Aadhaar Back",
  AADHAAR_BACK: "Aadhaar Back",
  PHOTO: "Photo",
  SELFIE: "Selfie",
  PHOTO_OR_SELFIE: "Photo or Selfie",
  PASSPORT_PHOTO: "Photo",
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
  CO_APPLICANT_AADHAR_FRONT: "Co-applicant Aadhaar Front",
  CO_APPLICANT_AADHAR_BACK: "Co-applicant Aadhaar Back",
  CO_APPLICANT_PAN: "Co-applicant PAN",
  CO_APPLICANT_SELFIE: "Co-applicant Selfie",
  CO_APPLICANT_SELFIE_OR_PHOTO: "Co-applicant Selfie or Photo",
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

  // Edit Partner Details (CRUD) State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    aadharNumber: "",
    panNumber: "",
    region: "",
    officeAddress: "",
    residenceAddress: "",
  });
  const [isSavingPartner, setIsSavingPartner] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  /** null | { mode: 'single', partner } | { mode: 'all', partners: [] } */
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    const { adminToken } = getAuthData();
    if (adminToken) {
      dispatch(fetchPartners(adminToken));
    }
  }, [dispatch]);

  const handleOpenAgreement = (p) => {
    navigate("/Agreement", {
      state: {
        employeeData: {
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
          IDNo: p.employeeId || p.partnerCode || p._id,
          Aadhar_Number: p.aadharNumber || "",
          PAN_Number: p.panNumber || "",
          address: p.address || p.region || "office No -31 C Wing Ashoka Nagar, Kharadi, Pune, Maharashtra 411014",
          partnerOffice: p.officeAddress || p.address || p.region || "",
          partnerResidence: p.residenceAddress || p.address || p.region || "",
        },
      },
    });
  };

  const handleOpenAuthLetter = (p) => {
    navigate("/AuthLetter", {
      state: {
        name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      },
    });
  };

  const handleOpenIdCard = (p) => {
    navigate("/IdCard", {
      state: {
        employeeData: {
          id: p.employeeId || p.partnerCode || p._id,
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
          designation: "Authorized Partner",
          location: p.region || p.city || "Pune, Maharashtra",
          photo: p.profilePic,
          initials: `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`.toUpperCase() || "P",
        },
      },
    });
  };

  const handleEditPartner = (p) => {
    setPartnerToEdit(p);
    setEditFormData({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      phone: p.phone || "",
      email: p.email || "",
      aadharNumber: p.aadharNumber || "",
      panNumber: p.panNumber || "",
      region: p.region || "",
      officeAddress: p.officeAddress || p.address || "",
      residenceAddress: p.residenceAddress || p.address || "",
    });
    setEditModalOpen(true);
  };

  const handleSavePartnerDetails = async (e) => {
    e.preventDefault();
    if (!partnerToEdit?._id) return;
    try {
      setIsSavingPartner(true);
      const { adminToken } = getAuthData();
      
      const res = await axios.put(
        `${backendurl}/admin/partner/${partnerToEdit._id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(res.data?.message || "Partner details updated successfully!");
      setEditModalOpen(false);
      setPartnerToEdit(null);
      dispatch(fetchPartners(adminToken));
    } catch (err) {
      console.error("Failed to update partner:", err);
      toast.error(err.response?.data?.message || "Failed to update partner details");
    } finally {
      setIsSavingPartner(false);
    }
  };

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

  const stateOptions = INDIAN_STATE_FILTER_OPTIONS;

  const { activeCount, inactiveCount, pendingCount } = useMemo(() => {
    let act = 0;
    let inact = 0;
    let pend = 0;
    (data || []).forEach((p) => {
      if (p.status === "ACTIVE") act++;
      else if (p.status === "PENDING") pend++;
      else inact++;
    });
    return { activeCount: act, inactiveCount: inact, pendingCount: pend };
  }, [data]);

  const filteredPartners = useMemo(() => {
    if (!data || data.length === 0) return [];

    const norm = (v) =>
      String(v ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const term = norm(searchQuery);
    const selectedState =
      stateFilter === "All" ? "" : norm(stateFilter);

    return data.filter((partner) => {
      const partnerRegion = norm(partner.region);
      const matchesState = !selectedState || partnerRegion === selectedState;
      if (!matchesState) return false;

      if (statusFilter === "ACTIVE" && partner.status !== "ACTIVE") return false;
      if (statusFilter === "INACTIVE" && (partner.status === "ACTIVE" || partner.status === "PENDING")) return false;
      if (statusFilter === "PENDING" && partner.status !== "PENDING") return false;

      if (!term) return true;

      const fullName = norm(
        [partner.firstName, partner.middleName, partner.lastName]
          .filter(Boolean)
          .join(" ")
      );
      const haystack = [
        fullName,
        partner.email,
        partner.phone,
        partner._id,
        partner.partnerCode,
        partner.employeeId,
        partner.rmName,
        partner.rmEmployeeId,
        partner.asmName,
        partner.asmEmployeeId,
        partner.rmId,
        partner.asmId,
        partner.region,
      ]
        .map(norm)
        .join(" ");

      return haystack.includes(term);
    });
  }, [data, searchQuery, stateFilter, statusFilter]);

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
      title: "State / Region",
      key: "region",
      render: (_, p) => <span className="text-sm">{p.region || "—"}</span>,
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
      title: "Documents & Actions",
      key: "actions",
      render: (_, p) => (
        <div className="flex h-full flex-wrap items-center gap-1.5">
          <button
            type="button"
            title="Partner Agreement"
            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleOpenAgreement(p)}
          >
            <FileText size={13} className="text-emerald-600" />
            Agreement
          </button>
          <button
            type="button"
            title="Authorization Letter"
            className="inline-flex items-center gap-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleOpenAuthLetter(p)}
          >
            <Award size={13} className="text-amber-600" />
            Auth Letter
          </button>
          <button
            type="button"
            title="Partner ID Card"
            className="inline-flex items-center gap-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleOpenIdCard(p)}
          >
            <CreditCard size={13} className="text-teal-600" />
            ID Card
          </button>
          <button
            type="button"
            title="Edit Partner Details (CRUD)"
            className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleEditPartner(p)}
          >
            <Edit3 size={13} />
            Edit
          </button>
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline ml-1"
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
            loading
              ? "Loading..."
              : searchQuery.trim() || stateFilter !== "All" || statusFilter !== "All"
                ? `Showing ${sortedFilteredPartners.length} of ${data?.length || 0} partners (${activeCount} Active, ${inactiveCount + pendingCount} Inactive/Pending)`
                : `Total ${data?.length || 0} partners (${activeCount} Active, ${inactiveCount + pendingCount} Inactive/Pending)`
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
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All Statuses ({data?.length || 0})</option>
                <option value="ACTIVE">Active ({activeCount})</option>
                <option value="INACTIVE">Inactive / Suspended ({inactiveCount})</option>
                <option value="PENDING">Pending ({pendingCount})</option>
              </select>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                aria-label="Filter by state"
              >
                {stateOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "All" ? "All states" : opt}
                  </option>
                ))}
              </select>
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
        {/* Edit Partner Details Modal (CRUD) */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/80 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Partner Details</h3>
                  <p className="text-xs text-gray-500">Update profile & legal agreement details for {partnerToEdit?.firstName} {partnerToEdit?.lastName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePartnerDetails} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Aadhar Number</label>
                    <input
                      type="text"
                      placeholder="12 digit Aadhar"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.aadharNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, aadharNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="10 digit PAN"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.panNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Maharashtra"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.region}
                      onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Partner Office Address</label>
                    <textarea
                      rows={2}
                      placeholder="Office / Business address"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.officeAddress}
                      onChange={(e) => setEditFormData({ ...editFormData, officeAddress: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Partner Residential Address</label>
                    <textarea
                      rows={2}
                      placeholder="Residential address"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      value={editFormData.residenceAddress}
                      onChange={(e) => setEditFormData({ ...editFormData, residenceAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    disabled={isSavingPartner}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPartner}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isSavingPartner ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
