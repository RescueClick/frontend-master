import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Download, FileText, Award, CreditCard, Edit3, X } from "lucide-react";
import {
  activatePartner,
  fetchAsmPartners,
  asmDeactivatePartner,
} from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
import { INDIAN_STATE_FILTER_OPTIONS } from "../../../utils/indianStates";





const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function AsmPartner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerToActivate, setPartnerToActivate] = useState(null);
  const [newPartnerId, setNewPartnerId] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");

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
  const [Partners, setPartners] = useState([]);
  console.log("Partners", Partners)

  const location = useLocation();
  const { id } = location.state || {};

  const navigate = useNavigate();

  useEffect(() => {
    setSearchQuery(id);
  }, [id]);

  // Filtered list
  const stateOptions = INDIAN_STATE_FILTER_OPTIONS;

  const { activeCount, inactiveCount, pendingCount } = useMemo(() => {
    let act = 0;
    let inact = 0;
    let pend = 0;
    (Partners || []).forEach((p) => {
      const st = String(p.activation || p.status || "").toUpperCase();
      if (st === "ACTIVE") act++;
      else if (st === "PENDING") pend++;
      else inact++;
    });
    return { activeCount: act, inactiveCount: inact, pendingCount: pend };
  }, [Partners]);

  const filteredCustomers = useMemo(() => {
    if (!Partners || Partners.length === 0) return [];
    const term = searchQuery?.trim().toLowerCase();
    const selectedState = stateFilter === "All" ? "" : stateFilter.trim().toLowerCase();

    return Partners.filter((c) => {
      const partnerRegion = String(c.region || "").trim().toLowerCase();
      const matchesState = !selectedState || partnerRegion === selectedState;
      if (!matchesState) return false;

      const st = String(c.activation || c.status || "").toUpperCase();
      if (statusFilter === "ACTIVE" && st !== "ACTIVE") return false;
      if (statusFilter === "INACTIVE" && (st === "ACTIVE" || st === "PENDING")) return false;
      if (statusFilter === "PENDING" && st !== "PENDING") return false;

      if (!term) return true;

      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const id = (c.id || "").toString().toLowerCase();
      const email = (c.email || "").toLowerCase();
      const rmId = (c.Partners || "").toLowerCase();
      const employeeId = (c.employeeId || "").toLowerCase();
      const region = partnerRegion;

      return (
        name.includes(term) ||
        phone.includes(term) ||
        id.includes(term) ||
        email.includes(term) ||
        rmId.includes(term) ||
        employeeId.includes(term) ||
        region.includes(term)
      );
    });
  }, [Partners, searchQuery, stateFilter]);

  const sortedFilteredCustomers = sortNewestFirst(filteredCustomers, { dateKeys: ["createdAt"] });

  const handleExport = useCallback(() => {
    const rows = sortedFilteredCustomers.map((c) => ({
      Name: c.name || "",
      "Employee ID": c.employeeId || "",
      Phone: c.phone || "",
      Email: c.email || "",
      "State / Region": c.region || "",
      Status: c.activation || "",
      "RM Name": c.assignTo?.rmName || "",
      "Created On": c.createdOn || "",
    }));
    downloadXlsx(rows, "ASM_Partners.xlsx");
  }, [sortedFilteredCustomers]);


  const openPartnerAnalytics = (c) => {
    navigate("/asm/analytics", {
      state: {
        id: c.id,
        role: "PARTNER",
        name: c.name || "",
        detail: "Partner",
      },
    });
  };

  const handleOpenAgreement = (c) => {
    const raw = c.raw || {};
    navigate("/Agreement", {
      state: {
        employeeData: {
          name: c.name || `${raw.firstName || ""} ${raw.lastName || ""}`.trim(),
          IDNo: c.employeeId || raw.partnerCode || c.id,
          Aadhar_Number: raw.aadharNumber || "",
          PAN_Number: raw.panNumber || "",
          address: raw.address || c.region || "office No -31 C Wing Ashoka Nagar, Kharadi, Pune, Maharashtra 411014",
          partnerOffice: raw.officeAddress || raw.address || c.region || "",
          partnerResidence: raw.residenceAddress || raw.address || c.region || "",
        },
      },
    });
  };

  const handleOpenAuthLetter = (c) => {
    navigate("/AuthLetter", {
      state: {
        name: c.name,
      },
    });
  };

  const handleOpenIdCard = (c) => {
    const raw = c.raw || {};
    navigate("/IdCard", {
      state: {
        employeeData: {
          id: c.employeeId || raw.partnerCode || c.id,
          name: c.name,
          designation: "Authorized Partner",
          location: c.region || raw.city || "Pune, Maharashtra",
          photo: c.profilePic,
          initials: (c.name || "P").substring(0, 2).toUpperCase(),
        },
      },
    });
  };

  const handleEditPartner = (c) => {
    const raw = c.raw || {};
    setPartnerToEdit(c);
    setEditFormData({
      firstName: raw.firstName || c.name?.split(" ")[0] || "",
      lastName: raw.lastName || c.name?.split(" ").slice(1).join(" ") || "",
      phone: c.phone !== "-" ? c.phone : "",
      email: c.email !== "-" ? c.email : "",
      aadharNumber: raw.aadharNumber || "",
      panNumber: raw.panNumber || "",
      region: c.region || raw.region || "",
      officeAddress: raw.officeAddress || raw.address || "",
      residenceAddress: raw.residenceAddress || raw.address || "",
    });
    setEditModalOpen(true);
  };

  const handleSavePartnerDetails = async (e) => {
    e.preventDefault();
    if (!partnerToEdit?.id) return;
    try {
      setIsSavingPartner(true);
      const { asmToken, token } = getAuthData();
      const authToken = asmToken || token;
      
      const res = await axios.put(
        `${backendurl}/asm/partner/${partnerToEdit.id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(res.data?.message || "Partner details updated successfully!");
      setEditModalOpen(false);
      setPartnerToEdit(null);
      dispatch(fetchAsmPartners());
    } catch (err) {
      console.error("Failed to update partner:", err);
      toast.error(err.response?.data?.message || "Failed to update partner details");
    } finally {
      setIsSavingPartner(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const [day, month, year] = dateString.split("-");
    if (!year) return dateString;
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const dispatch = useDispatch();

  const { data, loading, success, error } = useSelector(
    (state) => state.asm.partners
  );
  const otherPartners = (Partners || []).filter((p) => p.id !== selectedPartner?.id);

 

  useEffect(() => {
    dispatch(fetchAsmPartners());
  }, [dispatch]);

  useEffect(() => {
    if (success && data) {
      // Transform API response -> table format
      const mapped = data.map((p, i) => ({
        id: p._id, // prefer employeeId
        name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        phone: p.phone || "-",
        email: p.email || "-",
        region: p.region || "",
        Partners: p.rmId,
        PartnersID: p._id,
        employeeId: p.employeeId,
        profilePic: p.profilePic,
        createdAt: p.createdAt,
        raw: p,

        createdOn: new Date(p.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        activation: p.status,
        assignTo: {
          asmName: p.asmName || "",
          rmName: p.rmName || "",
          partnerName: p.partnerName || "",
          asmEmployeeId: p.asmEmployeeId || "",
          rmEmployeeId: p.rmEmployeeId || "",
         
        },
        paymentStatus: "pending", // API doesn’t have, set default or remove
      }));
      setPartners(mapped);
    }
  }, [success, data]);

  const toggleActivation = (partner) => {
    if (partner.activation === "ACTIVE") {
      setSelectedPartner(partner);
      setModalOpen(true);
    } else {
      // Optionally handle re-activation here
    }
  };

  const handleCancelDeactivation = () => {
    setModalOpen(false);
    setSelectedPartner(null);
    setNewPartnerId("");
    setReplacementSearch("");
  };

  const handleConfirmDeactivation = () => {
    if (!newPartnerId) return;

    dispatch(
      asmDeactivatePartner({
        oldPartnerId: selectedPartner.id,
        newPartnerId,
      })
    );
    dispatch(fetchAsmPartners());
    setModalOpen(false);
    setSelectedPartner(null);
    setNewPartnerId("");
    setReplacementSearch("");
  };

  const handleConfirmActivation = async () => {
    if (!partnerToActivate?.id) return;
    try {
      await dispatch(activatePartner(partnerToActivate.id));
      await dispatch(fetchAsmPartners());
    } finally {
      setPartnerToActivate(null);
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
  console.log(userId)
loginAsUser(userId, navigate);
};

  const asmPartnerColumns = [
    {
      title: "User name",
      key: "name",
      render: (_, c) => (
        <div className="flex items-center gap-3 align-top">
          <img
            src={c?.profilePic}
            alt=""
            className="h-8 w-8 rounded-full border border-gray-300"
          />
          <span className="text-sm font-semibold text-gray-900">{c.name}</span>
        </div>
      ),
    },
    { title: "User ID", dataIndex: "employeeId", key: "employeeId" },
    {
      title: "Contact",
      key: "phone",
      render: (_, c) => (
        <span className="text-sm font-medium">{c.phone}</span>
      ),
    },
    {
      title: "State / Region",
      key: "region",
      render: (_, c) => <span className="text-sm">{c.region || "—"}</span>,
    },
    {
      title: "Created on",
      key: "createdOn",
      render: (_, c) => formatDate(c.createdOn),
    },
    {
      title: "Login as",
      key: "login",
      render: (_, c) => (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          style={{ borderColor: colors.secondary, color: colors.secondary }}
          onClick={() => handleLoginAs(c.id)}
        >
          Login
        </button>
      ),
    },
    {
      title: "Activation",
      key: "activation",
      render: (_, c) => (
        <div
          role="button"
          tabIndex={0}
          className={`flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
            c.activation === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
          }`}
          onClick={() => {
            if (c.activation === "ACTIVE") {
              toggleActivation(c);
            } else {
              setPartnerToActivate(c);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (c.activation === "ACTIVE") toggleActivation(c);
              else setPartnerToActivate(c);
            }
          }}
        >
          <div
            className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              c.activation === "ACTIVE" ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </div>
      ),
    },
    {
      title: "Documents & Actions",
      key: "actions",
      render: (_, c) => (
        <div className="flex h-full flex-wrap items-center gap-1.5">
          <button
            type="button"
            title="Partner Agreement"
            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleOpenAgreement(c)}
          >
            <FileText size={13} className="text-emerald-600" />
            Agreement
          </button>
          <button
            type="button"
            title="Authorization Letter"
            className="inline-flex items-center gap-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleOpenAuthLetter(c)}
          >
            <Award size={13} className="text-amber-600" />
            Auth Letter
          </button>
          <button
            type="button"
            title="Partner ID Card"
            className="inline-flex items-center gap-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleOpenIdCard(c)}
          >
            <CreditCard size={13} className="text-teal-600" />
            ID Card
          </button>
          <button
            type="button"
            title="Edit Partner Details (CRUD)"
            className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold transition-colors"
            onClick={() => handleEditPartner(c)}
          >
            <Edit3 size={13} />
            Edit
          </button>
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline ml-1"
            onClick={() => openPartnerAnalytics(c)}
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
        title="Partners"
        subtitle={`Total ${sortedFilteredCustomers.length} partners (${activeCount} Active, ${inactiveCount + pendingCount} Inactive/Pending)`}
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
                placeholder="Search by name, phone, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All Statuses ({Partners?.length || 0})</option>
              <option value="ACTIVE">Active ({activeCount})</option>
              <option value="INACTIVE">Inactive / Suspended ({inactiveCount})</option>
              <option value="PENDING">Pending ({pendingCount})</option>
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
          columns={asmPartnerColumns}
          dataSource={sortedFilteredCustomers}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: "No partners found" }}
        />
      </DashboardTablePage>


      <ReassignmentDeactivateModal
        isOpen={modalOpen}
        title="Suspend Partner"
        summaryBadgeText="Will be suspended"
        subjectName={selectedPartner?.name || ""}
        subjectMeta={
          selectedPartner?.employeeId
            ? `Employee ID: ${selectedPartner.employeeId}`
            : ""
        }
        warningText="Linked customers and applications will be reassigned to the active partner you select. This action suspends the current partner."
        searchValue={replacementSearch}
        onSearchChange={setReplacementSearch}
        searchPlaceholder="Search replacement partner..."
        candidates={otherPartners
          .filter((p) => p.activation === "ACTIVE")
          .filter((p) =>
            `${p.name || ""} ${p.employeeId || ""}`
              .toLowerCase()
              .includes((replacementSearch || "").toLowerCase())
          )
          .map((p) => ({
            id: p.id,
            name: p.name,
            meta: p.employeeId || p.id,
            statusBadge: p.activation || "ACTIVE",
          }))}
        selectedId={newPartnerId}
        onSelect={setNewPartnerId}
        onCancel={handleCancelDeactivation}
        onConfirm={handleConfirmDeactivation}
        confirmLabel="Yes, Suspend"
        confirmDisabled={!newPartnerId}
      />

      {/* Edit Partner Details Modal (CRUD) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/80 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Partner Details</h3>
                <p className="text-xs text-gray-500">Update profile & agreement details for {partnerToEdit?.name}</p>
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

      <ActivationConfirmModal
        isOpen={!!partnerToActivate}
        title="Activate Partner"
        message="Are you sure you want to activate"
        subjectName={partnerToActivate?.name || ""}
        confirmLabel="Activate"
        onCancel={() => setPartnerToActivate(null)}
        onConfirm={handleConfirmActivation}
      />
    </>
  );
}
