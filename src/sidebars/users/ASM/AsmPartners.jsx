import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Download } from "lucide-react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [Partners, setPartners] = useState([]);
  console.log("Partners", Partners)

  const location = useLocation();
  const { id } = location.state || {};

  const navigate = useNavigate()

  useEffect(() => {
    setSearchQuery(id);
  }, [id]);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    if (!Partners || Partners.length === 0) return [];
    const term = searchQuery?.trim().toLowerCase();
    if (!term) return Partners;

    return Partners.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const id = (c.id || "").toString().toLowerCase();
      const email = (c.email || "").toLowerCase();
      const rmId = (c.Partners || "").toLowerCase();
      const employeeId= (c.employeeId|| "" ).toLowerCase();
      // const profilePic = (c.profilePic)

      
      return (
        name.includes(term) ||
        phone.includes(term) ||
        id.includes(term) ||
        email.includes(term) ||
        rmId.includes(term) ||
        employeeId.includes(term)
      );
    });
  }, [Partners, searchQuery]);

  const sortedFilteredCustomers = sortNewestFirst(filteredCustomers, { dateKeys: ["createdAt"] });

  const handleExport = useCallback(() => {
    const rows = sortedFilteredCustomers.map((c) => ({
      Name: c.name || "",
      "Employee ID": c.employeeId || "",
      Phone: c.phone || "",
      Email: c.email || "",
      Status: c.activation || "",
      "RM Name": c.assignTo?.rmName || "",
      "Created On": c.createdOn || "",
    }));
    if (!downloadXlsx(rows, "asm-partners.xlsx", "Partners")) {
      toast.error("No rows to export");
    }
  }, [sortedFilteredCustomers]);


  const openPartnerAnalytics = (c) => {
    if (!c?.id) return;
    navigate("/asm/analytics", {
      state: {
        id: c.id,
        role: "PARTNER",
        name: c.name || "",
        detail: "Partner",
      },
    });
  };

  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split("-");
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
        Partners: p.rmId,
        PartnersID: p._id,
        employeeId: p.employeeId,
        profilePic: p.profilePic,
        createdAt: p.createdAt,

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
      title: "Action",
      key: "action",
      render: (_, c) => (
        <div className="flex h-full flex-wrap items-center gap-3">
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
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
        subtitle={`Total ${filteredCustomers?.length || 0} records found`}
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
