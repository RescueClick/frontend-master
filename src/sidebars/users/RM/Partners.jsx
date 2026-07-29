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
import AppAntTable from "../../../components/shared/AppAntTable";
import DashboardTablePage from "../../../components/shared/DashboardTablePage";
import EntityStatusBadge from "../../../components/shared/EntityStatusBadge";
import ReassignmentDeactivateModal from "../../../components/shared/ReassignmentDeactivateModal";
import ActivationConfirmModal from "../../../components/shared/ActivationConfirmModal";
import { INDIAN_STATE_FILTER_OPTIONS } from "../../../utils/indianStates";

const Partners = () => {


  const [ActivateModel, setActivateModel] = useState(null)

  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("All");
  const [activityFilter, setActivityFilter] = useState("all"); // all | with_loans | more_info | no_loans

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

  const stateOptions = INDIAN_STATE_FILTER_OPTIONS;

  const filteredPartners = useMemo(() => {
    if (!data) return [];

    return data.filter((partner) => {
      const matchesSearch = matchesSearchTerm(searchTerm, [
        partner.name,
        partner.type,
        partner.region,
        partner.employeeId,
        partner.phone,
        partner.email,
      ]);
      const matchesFilter = matchesStatusFilter(partner.status, selectedFilter);
      const selectedState = stateFilter === "All" ? "" : stateFilter.trim().toLowerCase();
      const partnerRegion = String(partner.region || "").trim().toLowerCase();
      const matchesState = !selectedState || partnerRegion === selectedState;
      const forms = Number(partner.formsFilled ?? partner.applicationCount ?? 0);
      const matchesActivity =
        activityFilter === "all" ||
        (activityFilter === "with_loans" && forms > 0) ||
        (activityFilter === "more_info" && partner.moreInfoRequired) ||
        (activityFilter === "no_loans" && forms === 0);
      return matchesSearch && matchesFilter && matchesState && matchesActivity;
    });
  }, [data, searchTerm, selectedFilter, stateFilter, activityFilter]);

  // Partners with strongest loan book first so RM can judge performance
  const sortedFilteredPartners = useMemo(() => {
    const list = [...filteredPartners];
    list.sort((a, b) => {
      const aFiled = Number(a.filedAmount || 0);
      const bFiled = Number(b.filedAmount || 0);
      if (bFiled !== aFiled) return bFiled - aFiled;
      const aForms = Number(a.formsFilled ?? a.applicationCount ?? 0);
      const bForms = Number(b.formsFilled ?? b.applicationCount ?? 0);
      if (bForms !== aForms) return bForms - aForms;
      const aInfo = a.moreInfoRequired ? 1 : 0;
      const bInfo = b.moreInfoRequired ? 1 : 0;
      if (bInfo !== aInfo) return bInfo - aInfo;
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
    return list;
  }, [filteredPartners]);

  const partnerSummary = useMemo(() => {
    const rows = data || [];
    const formsTotal = rows.reduce(
      (s, p) => s + Number(p.formsFilled ?? p.applicationCount ?? 0),
      0
    );
    const withLoans = rows.filter(
      (p) => Number(p.formsFilled ?? p.applicationCount ?? 0) > 0
    ).length;
    const moreInfo = rows.filter((p) => p.moreInfoRequired).length;
    const filedAmount = rows.reduce((s, p) => s + Number(p.filedAmount || 0), 0);
    const approvedAmount = rows.reduce(
      (s, p) => s + Number(p.approvedAmount || 0),
      0
    );
    const disbursedAmount = rows.reduce(
      (s, p) => s + Number(p.disbursedAmount ?? p.totalDisbursed ?? 0),
      0
    );
    return {
      partners: rows.length,
      formsTotal,
      withLoans,
      moreInfo,
      filedAmount,
      approvedAmount,
      disbursedAmount,
    };
  }, [data]);

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
      "State / Region": item.region || "",
      "Status": item.status,
      "Rating": item.rating,
      "Forms Filled": item.formsFilled ?? item.applicationCount ?? 0,
      "Filed Amount": item.filedAmount ?? 0,
      "Approved Count": item.approvedCount ?? 0,
      "Approved Amount": item.approvedAmount ?? 0,
      "Disbursed Count": item.disbursedCount ?? item.disbursedFilesLifetime ?? 0,
      "Disbursed Amount": item.disbursedAmount ?? item.totalDisbursed ?? 0,
      "More Info Required": item.moreInfoRequired ? "Yes" : "No",
      "Loans This Month": item.appsThisMonth ?? item.dealsThisMonth ?? 0,
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
      title: "Partner",
      key: "partner",
      width: "34%",
      ellipsis: true,
      render: (_, partner) => {
        const region = String(partner.region || "").trim();
        const shortRegion =
          region.length > 28 ? `${region.slice(0, 28)}…` : region;
        return (
          <div className="flex min-w-0 items-start gap-2.5">
            {partner?.profilePic ? (
              <img
                src={partner.profilePic}
                alt=""
                className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <User className="h-4 w-4 text-slate-500" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-slate-900">
                  {partner.name}
                </span>
                <EntityStatusBadge status={partner.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {partner.phone || "—"}
                {shortRegion ? ` · ${shortRegion}` : ""}
              </p>
              {partner.employeeId ? (
                <p className="truncate text-[11px] text-slate-400">
                  {partner.employeeId}
                </p>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      title: "Loan book",
      key: "loanBook",
      width: "28%",
      render: (_, partner) => {
        const forms = Number(partner.formsFilled ?? partner.applicationCount ?? 0);
        const filed = Number(partner.filedAmount || 0);
        const approvedAmt = Number(partner.approvedAmount || 0);
        const approvedCnt = Number(partner.approvedCount || 0);
        const disbursedAmt = Number(
          partner.disbursedAmount ?? partner.totalDisbursed ?? 0
        );
        const disbursedCnt = Number(
          partner.disbursedCount ?? partner.disbursedFilesLifetime ?? 0
        );
        return (
          <div className="min-w-0 space-y-1 text-[11px] leading-snug">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-slate-500">Filed</span>
              <span className="text-right font-semibold text-slate-900">
                {formatCurrency(filed)}
                <span className="ml-1 font-normal text-slate-400">
                  · {forms}
                </span>
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-slate-500">Approved</span>
              <span className="text-right font-semibold text-blue-700">
                {formatCurrency(approvedAmt)}
                <span className="ml-1 font-normal text-slate-400">
                  · {approvedCnt}
                </span>
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-slate-500">Disbursed</span>
              <span className="text-right font-semibold text-emerald-700">
                {formatCurrency(disbursedAmt)}
                <span className="ml-1 font-normal text-slate-400">
                  · {disbursedCnt}
                </span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Docs",
      key: "docs",
      width: "16%",
      render: (_, partner) => {
        const forms = Number(partner.formsFilled ?? partner.applicationCount ?? 0);
        if (partner.moreInfoRequired) {
          const docs = (partner.remainingDocTypes || []).join(", ");
          return (
            <div className="min-w-0" title={docs || "Documents pending"}>
              <span className="inline-flex rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-900">
                {partner.appsNeedingMoreInfoCount || 0} app ·{" "}
                {partner.pendingDocsCount || 0} docs
              </span>
              <p className="mt-1 truncate text-[10px] text-orange-700">
                {(partner.remainingDocTypes || []).slice(0, 2).join(", ") ||
                  "Pending"}
                {(partner.remainingDocTypes || []).length > 2 ? "…" : ""}
              </p>
            </div>
          );
        }
        if (forms > 0) {
          return (
            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Complete
            </span>
          );
        }
        return <span className="text-[11px] text-slate-400">No forms</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: "22%",
      render: (_, partner) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => handleLoginAs(partner?.id)}
          >
            Login
          </button>
          {partner.status === "ACTIVE" ? (
            <button
              type="button"
              className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
              onClick={() => toggleActivation(partner)}
            >
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
              onClick={() => {
                setActivateModel(true);
                setSelectedPartner(partner);
              }}
            >
              Activate
            </button>
          )}
          <button
            type="button"
            onClick={() => openPartnerAnalytics(partner)}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50"
          >
            Analytics
          </button>
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
        subtitle={`${sortedFilteredPartners.length} partner${sortedFilteredPartners.length !== 1 ? "s" : ""} · ${partnerSummary.formsTotal} loan form${partnerSummary.formsTotal !== 1 ? "s" : ""} total`}
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
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Partners</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{partnerSummary.partners}</p>
                <p className="text-[11px] text-slate-500">
                  {partnerSummary.withLoans} with loans · {partnerSummary.moreInfo} need docs
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActivityFilter(activityFilter === "with_loans" ? "all" : "with_loans")
                }
                className={`rounded-xl border p-3 text-left ${
                  activityFilter === "with_loans"
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-400"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Filed amount</p>
                <p className="mt-1 text-xl font-bold text-teal-900">
                  {formatCurrency(partnerSummary.filedAmount)}
                </p>
                <p className="text-[11px] text-teal-700">
                  {partnerSummary.formsTotal} forms filed
                </p>
              </button>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Approved</p>
                <p className="mt-1 text-xl font-bold text-blue-900">
                  {formatCurrency(partnerSummary.approvedAmount)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Disbursed</p>
                <p className="mt-1 text-xl font-bold text-emerald-900">
                  {formatCurrency(partnerSummary.disbursedAmount)}
                </p>
                <p className="text-[11px] text-orange-700">
                  {partnerSummary.moreInfo} need more docs
                </p>
              </div>
            </div>
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
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        }
      >
        <AppAntTable
          columns={partnerColumns}
          dataSource={sortedFilteredPartners}
          rowKey="id"
          loading={loading}
          scroll={{}}
          tableLayout="fixed"
          className="rm-partners-table"
          locale={{ emptyText: "No partners found" }}
        />
      </DashboardTablePage>
    </>
  );
};

export default Partners;
