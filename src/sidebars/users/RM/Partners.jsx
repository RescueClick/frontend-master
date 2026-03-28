import React, { useEffect, useState, useMemo, useCallback } from "react";
import { User, Search, Plus, Download } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { rmActivatePartner, rmDeactivatePartner, fetchPartners } from "../../../feature/thunks/rmThunks";
import { matchesSearchTerm, matchesStatusFilter } from "../../../utils/tableFilter";
import { useRealtimeData, useRefetch } from "../../../utils/useRealtimeData";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import EntityStatusBadge from "../../../components/shared/EntityStatusBadge";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";


const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

const Partners = () => {


  const [ActivateModel, setActivateModel] = useState(null)

  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newPartnerId, setNewPartnerId] = useState(null);
  const [replacementSearch, setReplacementSearch] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const openPartnerAnalytics = useCallback((partner) => {
    if (!partner?.id) return;
    navigate("/rm/analytics", {
      state: {
        id: partner.id,
        role: "RM",
        name: partner.name || "",
        detail: "Partner",
      },
    });
  }, [navigate]);

  const { loading, error, data } = useSelector((state) => state.rm.partner);
  

  // Real-time data fetching with 30 second polling
  const { refetch } = useRealtimeData(fetchPartners, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Manual refetch function
  const refetchPartners = useRefetch(fetchPartners);

  const deactivatePartnerCandidates = useMemo(() => {
    if (!selectedPartner || !data) return [];
    const term = replacementSearch.trim().toLowerCase();
    return data
      .filter((p) => p.id !== selectedPartner.id && p.status === "ACTIVE")
      .filter((p) =>
        `${p.name || ""} ${p.employeeId || ""}`.toLowerCase().includes(term)
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        meta: p.employeeId || p.id,
        statusBadge: p.status,
      }));
  }, [data, selectedPartner, replacementSearch]);

  const partnerStats = {
    totalPartners: 48,
    activePartners: 42,
    newThisMonth: 6,
    totalRevenue: 12500000,
    avgPartnerRating: 4.7,
    topPerformer: "Alpha Financial Services",
  };


  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      // 1 Crore = 1,00,00,000
      return `₹${(amount / 10000000).toFixed(2)}C`;
    } else if (amount >= 100000) {
      // 1 Lakh = 1,00,000
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      // 1 Thousand = 1,000
      return `₹${(amount / 1000).toFixed(2)}K`;
    } else {
      return `₹${amount}`;
    }
  };

  const filteredPartners = useMemo(() => {
    if (!data) return [];

    return data.filter((partner) => {
      const matchesSearch = matchesSearchTerm(searchTerm, [partner.name, partner.type]);
      const matchesFilter = matchesStatusFilter(partner.status, selectedFilter);
      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, selectedFilter]);

  const sortedFilteredPartners = sortNewestFirst(filteredPartners, { dateKeys: ["createdAt"] });


  const toggleActivation = (partner) => {
    if (partner.status === "ACTIVE") {
      setSelectedPartner(partner);
      setReplacementSearch("");
      setNewPartnerId(null);
      setModalOpen(true);
    } else {
      // Optionally handle re-activation here
    }
  };

  const handleCancelDeactivation = () => {
    setModalOpen(false);
    setSelectedPartner(null);
    setNewPartnerId(null);
    setReplacementSearch("");
  };


  const handleConfirmDeactivation = useCallback(async () => {
    try {
      if (!newPartnerId) {
        alert("Please select a replacement partner");
        return;
      }
      await dispatch(
        rmDeactivatePartner({
          oldPartnerId: selectedPartner.id,
          newPartnerId,
        })
      ).unwrap();

      // Refetch partners after deactivation
      refetchPartners();

      setModalOpen(false);
      setSelectedPartner(null);
      setNewPartnerId(null);
      setReplacementSearch("");
    } catch (error) {
      console.error("Deactivation error:", error);
    }
  }, [dispatch, selectedPartner, newPartnerId, refetchPartners]);

  const handlePartnerActive = useCallback(async () => {
    try {
      await dispatch(rmActivatePartner({ partnerId: selectedPartner.id })).unwrap();

      // Refetch partners after activation
      refetchPartners();

      setActivateModel(null);
      setSelectedPartner(null);
    } catch (error) {
      console.error("Activation error:", error);
    }
  }, [dispatch, selectedPartner, refetchPartners]);


  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }

    // Create new object with easy-to-read column names
    const formattedData = data.map((item) => ({
      "Partner ID": item.id,
      "RM ID": item.rmId,
      "RM Name": item.rmName,
      "ASM ID": item.asmId,
      "ASM Name": item.asmName,
      "Partner Name": item.name,
      "Email": item.email,
      "Phone": item.phone,
      "Status": item.status,
      "Rating": item.rating,
      "Deals This Month": item.dealsThisMonth,
      "Revenue Generated": item.totalDisbursed,
      "Success Rate": item.successRate,
      "Total Disbursed": item.totalDisbursed,
      "Assigned Target": item.assignedTarget,
      "Performance": item.performance,
      "Payout (done)": item.totalPayout ?? item.payoutDone,
      "Payout (pending)": item.payoutPending,
      "Incentive (paid)": item.incentivePaid,
      "Incentive (pending)": item.incentivePending,
      "Incentive (total)": item.incentiveTotal,

    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const blobData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blobData, "partners.xlsx");
  };


  const loginAsUser = async (userId, navigate) => {
    try {
      const { rmToken } = getAuthData();
      if (!rmToken) throw new Error("Admin not authenticated");

      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${rmToken}` } }
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


  const handleDeletePartner = async (partnerId) => {
    console.log("Deleting partner:", partnerId);
  
    try {
      const { rmToken } = getAuthData(); // get token
  
      // Old hard-delete API removed; keep behavior to just log for now.
      console.warn("Hard delete for partners is disabled. Use suspend/deactivate flow instead.");
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
    }
  };

  const partnerColumns = [
    {
      title: "Partner name",
      key: "name",
      render: (_, partner) => (
        <div className="flex items-center gap-2 align-top">
          {partner?.profilePic ? (
            <img
              src={partner.profilePic}
              alt={partner.name || "Partner"}
              className="h-8 w-8 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <User className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <div>
            <span className="text-sm font-semibold">{partner.name}</span>
            <p className="text-xs text-gray-500">{partner.type || "Partner"}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "phone",
      key: "contact",
      render: (phone) => <span className="text-sm">{phone || "—"}</span>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, partner) => <EntityStatusBadge status={partner.status} />,
    },
    {
      title: "Deals",
      key: "deals",
      render: (_, partner) => (
        <span className="text-sm font-medium text-blue-600">
          {partner.dealsClosedThisMonth ?? partner.dealsThisMonth ?? 0}
        </span>
      ),
    },
    {
      title: "Revenue",
      key: "revenue",
      render: (_, partner) => (
        <span className="text-sm font-medium text-green-600">
          {formatCurrency(partner.totalDisbursed || 0)}
        </span>
      ),
    },
    {
      title: "Payout",
      key: "payout",
      render: (_, partner) => (
        <span className="text-sm font-medium text-purple-700">
          {formatCurrency(partner.totalPayout ?? partner.payoutDone ?? 0)}
        </span>
      ),
    },
    {
      title: "Incentive",
      key: "incentive",
      render: (_, partner) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-emerald-700">
            {formatCurrency(partner.incentivePaid ?? 0)}
          </span>
          <span className="text-[10px] leading-tight text-slate-500">
            Pending {formatCurrency(partner.incentivePending ?? 0)}
          </span>
        </div>
      ),
    },
    {
      title: "Login as",
      key: "login",
      render: (_, partner) => (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          style={{ borderColor: colors.secondary, color: colors.secondary }}
          onClick={() => handleLoginAs(partner?.id)}
        >
          Login
        </button>
      ),
    },
    {
      title: "Activation",
      key: "activation",
      render: (_, partner) =>
        partner.status === "ACTIVE" ? (
          <button
            type="button"
            className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
            onClick={() => toggleActivation(partner)}
          >
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            className="rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
            onClick={() => {
              setActivateModel(true);
              setSelectedPartner(partner);
            }}
          >
            Activate
          </button>
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, partner) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openPartnerAnalytics(partner)}
            className="text-xs font-medium text-slate-600 hover:text-brand-primary hover:underline"
          >
            Analytics
          </button>
          {partner.status === "SUSPENDED" && (
            <button
              type="button"
              onClick={() => handleDeletePartner(partner.id)}
              className="flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700"
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

      <ActivationConfirmModal
        isOpen={!!ActivateModel}
        title="Activate Partner"
        message="Are you sure you want to activate"
        confirmLabel="Activate"
        onCancel={() => setActivateModel(null)}
        onConfirm={handlePartnerActive}
      />

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
        candidates={deactivatePartnerCandidates}
        selectedId={newPartnerId}
        onSelect={setNewPartnerId}
        onCancel={handleCancelDeactivation}
        onConfirm={handleConfirmDeactivation}
        confirmLabel="Yes, Suspend"
        confirmDisabled={!newPartnerId}
      />
      <DashboardTablePage
        title="Partner Directory"
        subtitle={`${sortedFilteredPartners.length} partner${sortedFilteredPartners.length !== 1 ? "s" : ""}`}
        headerRight={
          <>
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
              onClick={() => {
                handleExport();
              }}
            >
              <Download size={16} className="mr-2 inline" />
              Export
            </button>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
              onClick={() => navigate("/rm/add-partner")}
            >
              <Plus size={16} className="mr-2 inline" />
              Add Partner
            </button>
          </>
        }
        toolbar={
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative flex-1 sm:max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search partners..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        }
      >
        <AppAntTable
          columns={partnerColumns}
          dataSource={sortedFilteredPartners}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: "No partners found" }}
        />
      </DashboardTablePage>
    </>
  );
};

export default Partners;
