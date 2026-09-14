import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, Trash2, FileText, Award, CreditCard, Edit3, X, KeyRound, UserCheck, ChevronRight, AlertTriangle, FileWarning, RotateCcw, CheckCircle2, ExternalLink } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  activatePartner,
  fetchPartners,
  adminDeactivatePartner,
  rejectPartner,
  getUnassignedPartners,
  requestPartnerDocReupload,
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
import AdminChangePasswordModal from "../../../components/shared/AdminChangePasswordModal";
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
  const [passwordUser, setPasswordUser] = useState(null);
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
  const [activeTab, setActiveTab] = useState("ACTIVE"); // "ACTIVE" | "SUSPENDED"

  /** null | { mode: 'single', partner } | { mode: 'all', partners: [] } */
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // KYC Review & Re-upload Request Modal State
  const [kycModalPartner, setKycModalPartner] = useState(null);
  const [selectedDocsToReject, setSelectedDocsToReject] = useState([]);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [isSendingReupload, setIsSendingReupload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // { url, name }

  const handleOpenKycDocsModal = (p) => {
    setKycModalPartner(p);
    setSelectedDocsToReject([]);
    setRejectionRemark(p.inactiveReason || p.docRejectionRemarks || "");
  };

  const handleToggleDocToReject = (docType) => {
    setSelectedDocsToReject((prev) =>
      prev.includes(docType) ? prev.filter((t) => t !== docType) : [...prev, docType]
    );
  };

  const handleSendDocReupload = async () => {
    if (!kycModalPartner?._id) return;
    if (selectedDocsToReject.length === 0) {
      toast.error("Please select at least one document to request re-upload for.");
      return;
    }
    if (!rejectionRemark.trim()) {
      toast.error("Please provide a remark explaining what is wrong with the document.");
      return;
    }

    setIsSendingReupload(true);
    try {
      await dispatch(
        requestPartnerDocReupload({
          partnerId: kycModalPartner._id,
          remarks: rejectionRemark.trim(),
          rejectedDocTypes: selectedDocsToReject,
        })
      ).unwrap();

      toast.success("Document re-upload request sent to partner!");
      const { adminToken } = getAuthData();
      if (adminToken) {
        dispatch(fetchPartners(adminToken));
      }
      setKycModalPartner(null);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to send re-upload request.");
    } finally {
      setIsSendingReupload(false);
    }
  };

  useEffect(() => {
    const { adminToken } = getAuthData();
    if (adminToken) {
      dispatch(fetchPartners(adminToken));
      dispatch(getUnassignedPartners());
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
    const firstName = (p.firstName || "").trim();
    const lastName = (p.lastName || "").trim();
    const partnerName = `${firstName} ${lastName}`.trim() || p.name || "Partner";
    navigate("/AuthLetter", {
      state: {
        name: partnerName,
        firstName: firstName,
        lastName: lastName,
      },
    });
  };

  const handleOpenIdCard = (p) => {
    const firstName = (p.firstName || "").trim();
    const lastName = (p.lastName || "").trim();
    const partnerName = `${firstName} ${lastName}`.trim() || p.name || "Partner";
    navigate("/IdCard", {
      state: {
        employeeData: {
          id: p.employeeId || p.partnerCode || p._id,
          name: partnerName,
          firstName: firstName,
          lastName: lastName,
          designation: "Authorized Partner",
          location: p.region || p.city || "Pune, Maharashtra",
          photo: p.profilePic,
          initials: `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "P",
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

  const unassignedPartnersData = useSelector(
    (state) => state.admin.unassignedPartners?.data || []
  );
  const pendingVerificationCount = unassignedPartnersData.length;

  const { activeCount, suspendedCount } = useMemo(() => {
    let act = 0;
    let susp = 0;
    (data || []).forEach((p) => {
      if (p.status === "ACTIVE") act++;
      else susp++;
    });
    return { activeCount: act, suspendedCount: susp };
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

      if (activeTab === "ACTIVE" && partner.status !== "ACTIVE") return false;
      if (activeTab === "SUSPENDED" && partner.status === "ACTIVE") return false;

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
        partner.inactiveReason,
      ]
        .map(norm)
        .join(" ");

      return haystack.includes(term);
    });
  }, [data, searchQuery, stateFilter, activeTab]);

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
      const { adminToken, rsmToken, asmToken, rmToken, partnerToken } = getAuthData();
      
      // Determine which token to use (prioritize current role token)
      let currentToken = adminToken || rsmToken || asmToken || rmToken || partnerToken;
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
      let currentUser = currentAuth.adminUser || currentAuth.rsmUser || currentAuth.asmUser || currentAuth.rmUser || currentAuth.partnerUser;
      let currentUserToken = currentAuth.adminToken || currentAuth.rsmToken || currentAuth.asmToken || currentAuth.rmToken || currentAuth.partnerToken;
      
      // If parent info is provided from backend, use it; otherwise use current user
      const parentInfo = parent || (currentUser ? { ...currentUser, token: currentUserToken } : null);
  
      // Save impersonated token - this will automatically clear parent token
      saveAuthData(token, user, true, parentInfo);
  
      // Navigate to role
      switch (user.role) {
        case "SUPER_ADMIN":
        case "ADMIN":
          navigate("/admin");
          break;
        case "RSM":
          navigate("/rsm");
          break;
        case "ASM":
          navigate("/asm");
          break;
        case "RM":
          navigate("/rm");
          break;
        case "PARTNER":
          navigate("/partner");
          break;
        case "CUSTOMER":
          navigate("/customer");
          break;
        default:
          navigate("/partner");
          break;
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
    ...(activeTab === "SUSPENDED"
      ? [
          {
            title: "Suspension Reason / Remark",
            key: "inactiveReason",
            render: (_, p) => (
              <span className="text-xs text-red-700 font-medium whitespace-pre-wrap max-w-xs block">
                {p.inactiveReason || p.docRejectionRemarks || "Suspended by Admin"}
              </span>
            ),
          },
        ]
      : []),
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
            <>
              <button
                type="button"
                className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer"
                onClick={() => setPartneractiveModel(p._id)}
              >
                Activate
              </button>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-1"
                onClick={() => setDeleteConfirm({ mode: "single", partner: p })}
                aria-label={`Delete partner ${p.firstName || ""} ${p.lastName || ""}`.trim()}
              >
                <Trash2 size={18} strokeWidth={2.25} className="opacity-90" aria-hidden />
              </button>
            </>
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
            title="Review Partner KYC Documents & Request Re-upload"
            className="inline-flex items-center gap-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200"
            onClick={() => handleOpenKycDocsModal(p)}
          >
            <FileWarning size={13} className="text-indigo-600" />
            KYC Docs
          </button>
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
            title="Change Partner Password"
            className="inline-flex items-center gap-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => setPasswordUser({ ...p, role: "PARTNER" })}
          >
            <KeyRound size={13} />
            Password
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
          title="Partner Directory"
          subtitle={
            loading
              ? "Loading..."
              : activeTab === "ACTIVE"
              ? `Total ${activeCount} active verified partners (showing ${sortedFilteredPartners.length})`
              : `Total ${suspendedCount} suspended/inactive partners (showing ${sortedFilteredPartners.length})`
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
                  className="border border-gray-300 rounded-md pl-7 pr-2 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Search by name, RM, or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center cursor-pointer"
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
          {/* Pending Partners Verification Callout Banner */}
          {pendingVerificationCount > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950">
                    {pendingVerificationCount} New Partner{pendingVerificationCount > 1 ? "s" : ""} Awaiting Verification
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Unverified partners do not appear in this active directory until verified and assigned an RM in the Admin verification queue.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/rm-partner")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
              >
                Review & Verify ({pendingVerificationCount})
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Active vs Suspended Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("ACTIVE")}
                className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "ACTIVE"
                    ? "border-brand-primary text-brand-primary font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>Active Partners</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === "ACTIVE"
                      ? "bg-teal-100 text-teal-800 font-bold"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("SUSPENDED")}
                className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "SUSPENDED"
                    ? "border-red-600 text-red-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>Suspended / Inactive</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === "SUSPENDED"
                      ? "bg-red-100 text-red-800 font-bold"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {suspendedCount}
                </span>
              </button>
            </div>

            <div className="text-xs text-gray-500 pb-2 hidden sm:block">
              {activeTab === "ACTIVE"
                ? "Active partner count only"
                : "Suspended / deactivated accounts"}
            </div>
          </div>

          <AppAntTable
            columns={partnerColumns}
            dataSource={sortedFilteredPartners}
            rowKey="_id"
            loading={loading}
            locale={{ emptyText: activeTab === "ACTIVE" ? "No active partners found." : "No suspended partners found." }}
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
        {/* Partner KYC Documents & Verification Modal */}
        {Boolean(kycModalPartner) && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans"
            onClick={() => setKycModalPartner(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileWarning className="text-brand-primary h-5 w-5" />
                    Partner KYC & Registration Documents
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {kycModalPartner.firstName} {kycModalPartner.lastName} • {kycModalPartner.phone} • {kycModalPartner.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setKycModalPartner(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Info Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 mb-4 text-xs">
                <div>
                  <span className="text-gray-500">Account Status: </span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    kycModalPartner.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : kycModalPartner.status === "SUSPENDED"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {kycModalPartner.status || "PENDING"}
                  </span>
                </div>
                {kycModalPartner.canReuploadDocs && (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Re-upload Granted
                  </span>
                )}
              </div>

              {/* Registration Documents List */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Uploaded Documents ({kycModalPartner.docs?.length || 0})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {kycModalPartner.docs && kycModalPartner.docs.length > 0 ? (
                    kycModalPartner.docs.map((doc, index) => {
                      const isRejected =
                        doc.status === "REJECTED" ||
                        (kycModalPartner.rejectedDocTypes || []).includes(doc.docType);
                      const isSelected = selectedDocsToReject.includes(doc.docType);

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                            isRejected
                              ? "bg-red-50/70 border-red-200"
                              : isSelected
                              ? "bg-amber-50 border-amber-300"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocToReject(doc.docType)}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="font-semibold text-gray-800">
                              {toDocLabel(doc.docType)}
                            </span>
                          </label>

                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isRejected
                                  ? "bg-red-100 text-red-700"
                                  : doc.status === "VERIFIED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isRejected ? "REJECTED" : doc.status || "PENDING"}
                            </span>

                            {doc.url ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: doc.url,
                                    name: toDocLabel(doc.docType),
                                  })
                                }
                                className="text-blue-600 text-xs font-semibold hover:underline bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-100 transition cursor-pointer"
                              >
                                View File
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs italic">No URL</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-xs bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      No documents found for this partner.
                    </div>
                  )}
                </div>
              </div>

              {/* Reject & Request Re-upload Action Box */}
              <div className="pt-3 border-t border-gray-200 bg-red-50/40 p-3.5 rounded-xl border border-red-100">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <FileWarning className="h-4 w-4 text-red-600" />
                  Admin Remark & Re-upload Permission
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Select defective documents above, enter your remark/reason below, and send the re-upload request. The partner will see this remark upon logging in and can re-upload only the selected documents.
                </p>

                <textarea
                  rows={2}
                  placeholder="Enter rejection reason / remark for the partner (e.g. Aadhaar card photo is blurry. Please upload a clear photo of front and back)..."
                  value={rejectionRemark}
                  onChange={(e) => setRejectionRemark(e.target.value)}
                  className="mt-2.5 w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none bg-white"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-gray-500">
                    {selectedDocsToReject.length} document(s) selected
                  </span>
                  <button
                    type="button"
                    disabled={isSendingReupload || selectedDocsToReject.length === 0}
                    onClick={handleSendDocReupload}
                    className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {isSendingReupload ? (
                      "Sending..."
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Send Re-upload Request ({selectedDocsToReject.length})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setKycModalPartner(null)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminChangePasswordModal
        isOpen={Boolean(passwordUser)}
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
      />

      {/* Document In-App Preview Modal Popup */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-160 p-4 font-sans"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-primary" />
                <h4 className="font-bold text-gray-900 text-sm md:text-base">
                  {previewDoc.name || "Document Preview"}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition flex items-center gap-1"
                  title="Open in new window"
                >
                  <ExternalLink size={13} />
                  Open in Tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[360px]">
              {previewDoc.url?.toLowerCase().match(/\.(pdf)(\?.*)?$/) ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.name}
                  className="w-full h-[65vh] rounded-lg border border-gray-300 bg-white"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-sm border border-gray-200 bg-white"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-200">
              <span className="text-xs text-gray-500 truncate max-w-md">
                {previewDoc.url}
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
