import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IndianRupee,
  Banknote,
  Clock,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  Search,
  Download,
  RotateCw,
  Eye,
  Calculator,
  User,
  CreditCard,
  X,
  ShieldCheck,
  Percent,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

import {
  fetchAdminCustomersPayOutPending,
  fetchAdminCustomersPayOutDone,
  setAdminPayouts,
} from "../../../feature/thunks/adminThunks";

import { matchesSearchTerm } from "../../../utils/tableFilter";
import { loanTypeToTableShort, payoutLoanTypePillClass } from "../../../utils/loanTypeShort";
import { matchesMonthYear } from "../../../utils/dateFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import AppAntTable from "../../../components/shared/AppAntTable";
import PayoutStatusBadge from "../../../components/shared/PayoutStatusBadge";

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

const formatInrPrecise = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AdminPayouts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation tab state: 'all' | 'pending' | 'done'
  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || "all"
  );

  // Filters - Default to "all" (All-Time)
  const [searchTerm, setSearchTerm] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [year, setYear] = useState(
    location.state?.year || "all"
  );
  const [month, setMonth] = useState(
    location.state?.month || "all"
  );

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Payout Policy State
  const [payoutPolicy, setPayoutPolicy] = useState({
    PERSONAL: 2.0,
    BUSINESS: 1.8,
    HOME_LOAN_SALARIED: 0.75,
    HOME_LOAN_SELF_EMPLOYED: 0.85,
    LAP: 1.0,
    DEFAULT: 2.0,
  });
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Modal form data
  const [modalForm, setModalForm] = useState({
    applicationId: "",
    partnerId: "",
    approvalAmount: 0,
    payoutPercentage: "",
    payoutAmount: "",
    payOutStatus: "DONE",
    note: "",
  });

  // Redux Data
  const { data: pendingData = [], loading: pendingLoading } = useSelector(
    (state) => state.admin?.pendingPayout || { data: [] }
  );
  const { data: doneData = [], loading: doneLoading } = useSelector(
    (state) => state.admin?.donePayout || { data: [] }
  );

  const loading = pendingLoading || doneLoading;

  const fetchPayoutPolicy = useCallback(async () => {
    try {
      const { adminToken } = getAuthData();
      const res = await axios.get(`${backendurl}/admin/payout-policy`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res?.data?.policy) {
        setPayoutPolicy(res.data.policy);
      }
    } catch (e) {
      console.error("Failed to fetch payout policy:", e);
    }
  }, []);

  const loadData = useCallback(() => {
    dispatch(fetchAdminCustomersPayOutPending());
    dispatch(fetchAdminCustomersPayOutDone());
    fetchPayoutPolicy();
  }, [dispatch, fetchPayoutPolicy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combine and deduplicate rows for unified table
  const allRows = useMemo(() => {
    const pendingList = Array.isArray(pendingData) ? pendingData : [];
    const doneList = Array.isArray(doneData) ? doneData : [];

    const map = new Map();
    // 1. Add pending records
    pendingList.forEach((row) => {
      const key = String(row.applicationId || row._id || Math.random());
      map.set(key, { ...row, payOutStatus: row.payOutStatus || "PENDING" });
    });
    // 2. Add or overwrite with done records
    doneList.forEach((row) => {
      const key = String(row.applicationId || row._id || Math.random());
      map.set(key, { ...row, payOutStatus: "DONE" });
    });

    return Array.from(map.values());
  }, [pendingData, doneData]);

  // Date filtering logic using single authoritative date
  const isDateMatch = useCallback(
    (row) => {
      if (year === "all" && month === "all") return true;
      return matchesMonthYear(row, {
        year,
        month,
        dateKeys: ["disbursedAt", "createdAt", "applicationDate"],
      });
    },
    [year, month]
  );

  // Filtered rows for current Tab and Filter conditions
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Tab filter
      if (activeTab === "pending" && row.payOutStatus === "DONE") return false;
      if (activeTab === "done" && row.payOutStatus !== "DONE") return false;

      // Loan Type filter
      if (loanTypeFilter !== "all" && row.loanType !== loanTypeFilter)
        return false;

      // Date match
      if (!isDateMatch(row)) return false;

      // Search match
      const partnerObj = row.partner || {};
      const searchFields = [
        row.customerName,
        row.customerEmployeeId,
        row.contact,
        row.email,
        row.loanType,
        row.appNo,
        row.payoutNote,
        row.partnerName,
        partnerObj.name,
        partnerObj.firstName,
        partnerObj.lastName,
        partnerObj.employeeId,
        partnerObj.phone,
        partnerObj.email,
        partnerObj.bankName,
        partnerObj.accountNumber,
        partnerObj.ifscCode,
      ];

      return matchesSearchTerm(searchTerm, searchFields);
    });
  }, [allRows, activeTab, loanTypeFilter, isDateMatch, searchTerm]);

  const sortedRows = useMemo(() => {
    return sortNewestFirst(filteredRows, {
      dateKeys: ["disbursedAt", "createdAt", "updatedAt"],
    });
  }, [filteredRows]);

  // Metrics summary based on selected period
  const summary = useMemo(() => {
    const dateFiltered = allRows.filter(isDateMatch);

    const pendingEligible = dateFiltered.filter(
      (r) => r.payOutStatus !== "DONE"
    );
    const doneEligible = dateFiltered.filter(
      (r) => r.payOutStatus === "DONE"
    );

    const pendingAmount = pendingEligible.reduce(
      (sum, r) => sum + (Number(r.payoutAmount) || 0),
      0
    );
    const doneAmount = doneEligible.reduce(
      (sum, r) => sum + (Number(r.payoutAmount) || 0),
      0
    );

    const totalDisbursedAmount = dateFiltered.reduce(
      (sum, r) => sum + (Number(r.approvedAmount || r.requestedAmount) || 0),
      0
    );

    return {
      totalFiles: dateFiltered.length,
      totalDisbursedAmount,
      pendingCount: pendingEligible.length,
      pendingAmount,
      doneCount: doneEligible.length,
      doneAmount,
    };
  }, [allRows, isDateMatch]);

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    if (!text || text === "—") return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedKey(key);
    toast.success(`Copied: ${text}`, { duration: 1500 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open Payout Action Modal
  const handleOpenModal = (record) => {
    setSelectedRecord(record);

    const appr = Number(record.approvedAmount || record.requestedAmount || 0);
    const existingPayoutAmt = Number(record.payoutAmount || 0);

    let initialPct = "";
    let initialAmt = "";

    if (record.payoutPercentage) {
      initialPct = String(record.payoutPercentage);
      initialAmt = String(existingPayoutAmt || (appr * record.payoutPercentage) / 100);
    } else if (existingPayoutAmt > 0 && appr > 0) {
      initialAmt = String(existingPayoutAmt);
      initialPct = String(Number(((existingPayoutAmt / appr) * 100).toFixed(2)));
    } else if (record.payOutStatus !== "DONE") {
      const defaultRate =
        payoutPolicy[record.loanType] != null
          ? Number(payoutPolicy[record.loanType])
          : payoutPolicy.DEFAULT != null
          ? Number(payoutPolicy.DEFAULT)
          : 2.0;
      initialPct = String(defaultRate);
      initialAmt = String((appr * defaultRate) / 100);
    }

    setModalForm({
      applicationId: String(record.applicationId || record._id || ""),
      partnerId: String(record.partnerId || record.partner?.partnerId || ""),
      approvalAmount: appr,
      payoutPercentage: initialPct,
      payoutAmount: initialAmt,
      payOutStatus: "DONE",
      note: record.payoutNote || "",
    });

    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  // Save Payout Policy
  const handleSavePolicy = async (e) => {
    e?.preventDefault();
    try {
      setIsSavingPolicy(true);
      const { adminToken } = getAuthData();
      await axios.put(
        `${backendurl}/admin/payout-policy`,
        { policy: payoutPolicy },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success("Default payout commission policy saved successfully!");
      setPolicyModalOpen(false);
    } catch (err) {
      console.error("Failed to save payout policy:", err);
      toast.error(err?.response?.data?.message || "Failed to save payout policy");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Live Bidirectional Calculation in Modal
  const handlePercentageChange = (pctValue) => {
    const pct = pctValue;
    const appr = Number(modalForm.approvalAmount || 0);
    let calculatedAmt = "";

    if (pct !== "" && !isNaN(Number(pct)) && appr > 0) {
      calculatedAmt = String(Number(((appr * Number(pct)) / 100).toFixed(2)));
    }

    setModalForm((prev) => ({
      ...prev,
      payoutPercentage: pct,
      payoutAmount: calculatedAmt,
    }));
  };

  const handleAmountChange = (amtValue) => {
    const amt = amtValue;
    const appr = Number(modalForm.approvalAmount || 0);
    let calculatedPct = "";

    if (amt !== "" && !isNaN(Number(amt)) && appr > 0) {
      calculatedPct = String(Number(((Number(amt) / appr) * 100).toFixed(2)));
    }

    setModalForm((prev) => ({
      ...prev,
      payoutAmount: amt,
      payoutPercentage: calculatedPct,
    }));
  };

  const handlePresetPercentage = (pct) => {
    handlePercentageChange(String(pct));
  };

  // Save Payout
  const handleSubmitPayout = async (e) => {
    e?.preventDefault();
    if (!modalForm.applicationId) {
      toast.error("Application ID is missing");
      return;
    }

    try {
      setIsSaving(true);
      await dispatch(
        setAdminPayouts({
          applicationId: modalForm.applicationId,
          partnerId: modalForm.partnerId || undefined,
          payoutAmount: modalForm.payoutAmount ? Number(modalForm.payoutAmount) : undefined,
          payoutPercentage: modalForm.payoutPercentage ? Number(modalForm.payoutPercentage) : undefined,
          payOutStatus: modalForm.payOutStatus,
          note: modalForm.note || "",
        })
      ).unwrap();

      toast.success(
        modalForm.payOutStatus === "DONE"
          ? "Payout settled! Commission invoice & statement emailed to partner."
          : "Payout record updated successfully!"
      );
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error("Failed to save payout:", err);
      toast.error(typeof err === "string" ? err : err?.message || "Failed to update payout");
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Excel
  const handleExportXlsx = () => {
    if (!sortedRows.length) {
      toast.error("No payout rows available to export");
      return;
    }

    const exportRows = sortedRows.map((r, i) => ({
      "S.No": i + 1,
      "App No": r.appNo || (r.applicationId ? `APP-${r.applicationId.slice(-6).toUpperCase()}` : "—"),
      "Disbursal Date": r.disbursedAt
        ? new Date(r.disbursedAt).toLocaleDateString("en-IN")
        : r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-IN")
        : "—",
      "Partner Name": r.partner?.name || r.partnerName || "Partner",
      "Partner ID": r.partner?.employeeId || r.partnerEmployeeId || "—",
      "Partner Phone": r.partner?.phone || r.partnerPhone || "—",
      "Bank Name": r.partner?.bankName || r.partnerBankName || "—",
      "Account Number": (r.partner?.accountNumber || r.partnerAccountNumber) ? `'${r.partner?.accountNumber || r.partnerAccountNumber}` : "—",
      "IFSC Code": r.partner?.ifscCode || r.partnerIfscCode || "—",
      "Customer Name": r.customerName || "Customer",
      "Customer Phone": r.contact || "—",
      "Loan Type": loanTypeToTableShort(r.loanType),
      "Approved Loan (INR)": r.approvedAmount || 0,
      "Payout %": r.payoutPercentage ? `${r.payoutPercentage}%` : "—",
      "Payout Amount (INR)": r.payoutAmount || 0,
      "Payout Status": r.payOutStatus || "PENDING",
      "UTR / Note": r.payoutNote || "",
    }));

    const dateLabel =
      year === "all" && month === "all"
        ? "All-Time"
        : `${year}-${month}`;

    downloadXlsx(exportRows, `DhanSource-Payouts-${dateLabel}.xlsx`, "Payouts");
    toast.success("Payout data exported to Excel!");
  };

  // Table Columns with Avatar Chips and AppNo resolution
  const columns = useMemo(
    () => [
      {
        title: "App No & Date",
        key: "appDetails",
        width: 140,
        render: (_, r) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded w-fit border border-slate-200/80">
              {r.appNo || (r.applicationId ? `APP-${r.applicationId.slice(-6).toUpperCase()}` : "—")}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 font-medium">
              {r.disbursedAt
                ? new Date(r.disbursedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : r.createdAt
                ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        ),
      },
      {
        title: "Channel Partner (Beneficiary)",
        key: "partner",
        width: 250,
        render: (_, r) => {
          const partnerName = r.partner?.name || r.partnerName || "Partner";
          const partnerEmpId = r.partner?.employeeId || r.partnerEmployeeId;
          const partnerPhone = r.partner?.phone || r.partnerPhone;
          const partnerEmail = r.partner?.email || r.partnerEmail;

          return (
            <div className="flex items-center gap-2.5">
              {/* Partner Avatar Chip */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                {getInitials(partnerName)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                    {partnerName}
                  </span>
                  {partnerEmpId && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                      {partnerEmpId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  {partnerPhone && <span>{partnerPhone}</span>}
                  {partnerEmail && (
                    <span className="truncate max-w-[120px] text-slate-400">
                      {partnerEmail}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        title: "Customer / Borrower",
        key: "customer",
        width: 210,
        render: (_, r) => {
          const custName = r.customerName || "Customer";
          const custContact = r.contact;
          const custEmpId = r.customerEmployeeId;

          return (
            <div className="flex items-center gap-2.5">
              {/* Customer Avatar Chip */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                {getInitials(custName)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-900 text-xs truncate max-w-[140px]">
                  {custName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {custContact || (custEmpId ? `#${custEmpId}` : "—")}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        title: "Loan Details",
        key: "loan",
        width: 170,
        render: (_, r) => (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold ${payoutLoanTypePillClass(
                r.loanType
              )}`}
            >
              {loanTypeToTableShort(r.loanType)}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {r.approvedAmount ? formatInr(r.approvedAmount) : "—"}
            </span>
          </div>
        ),
      },
      {
        title: "Payout Amount",
        key: "payout",
        width: 160,
        render: (_, r) => (
          <div className="flex flex-col">
            <span
              className={`text-sm font-black ${
                r.payOutStatus === "DONE"
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {r.payoutAmount ? formatInrPrecise(r.payoutAmount) : "₹0.00"}
            </span>
            {r.payoutPercentage ? (
              <span className="text-[11px] font-semibold text-slate-500">
                ({r.payoutPercentage}% commission)
              </span>
            ) : null}
          </div>
        ),
      },
      {
        title: "Status",
        key: "status",
        width: 120,
        render: (_, r) => (
          <PayoutStatusBadge status={r.payOutStatus || "PENDING"} />
        ),
      },
      {
        title: "Action",
        key: "actions",
        width: 130,
        fixed: "right",
        render: (_, r) => (
          <button
            type="button"
            onClick={() => handleOpenModal(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shadow-sm ${
              r.payOutStatus === "DONE"
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                : "bg-brand-primary hover:bg-[#0f9b82] text-white shadow-emerald-500/20"
            }`}
          >
            {r.payOutStatus === "DONE" ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </>
            ) : (
              <>
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Pay Payout</span>
              </>
            )}
          </button>
        ),
      },
    ],
    []
  );

  // Beneficiary details with robust multi-field fallbacks
  const modalBank = useMemo(() => {
    if (!selectedRecord) return {};
    const p = selectedRecord.partner || {};
    return {
      partnerName: p.name || selectedRecord.partnerName || "Partner",
      partnerEmployeeId: p.employeeId || selectedRecord.partnerEmployeeId || "",
      partnerPhone: p.phone || selectedRecord.partnerPhone || "—",
      partnerEmail: p.email || selectedRecord.partnerEmail || "—",
      bankName: p.bankName || selectedRecord.partnerBankName || selectedRecord.bankName || "—",
      accountNumber: p.accountNumber || selectedRecord.partnerAccountNumber || selectedRecord.accountNumber || "—",
      ifscCode: p.ifscCode || selectedRecord.partnerIfscCode || selectedRecord.ifscCode || "—",
      accountHolderName: p.accountHolderName || selectedRecord.partnerAccountHolderName || p.name || selectedRecord.partnerName || "—",
      appNo: selectedRecord.appNo || (selectedRecord.applicationId ? `APP-${selectedRecord.applicationId.slice(-6).toUpperCase()}` : "APP"),
    };
  }, [selectedRecord]);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Total Disbursed Volume */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Disbursed Loan Volume
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-black text-slate-900">
                    {formatInr(summary.totalDisbursedAmount)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                    <span>{summary.totalFiles} Disbursed Loans</span>
                    <span className="font-semibold text-blue-600">
                      {year === "all" && month === "all" ? "All Time" : "Filtered Period"}
                    </span>
                  </div>
                </div>
              </div>

          {/* Card 2: Total Pending Payout */}
          <div
            onClick={() => setActiveTab("pending")}
            className={`bg-white p-4.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              activeTab === "pending"
                ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                : "border-slate-200/80 hover:border-amber-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Pending Payouts
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Clock className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-amber-600">
                {formatInr(summary.pendingAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span className="font-medium">
                  {summary.pendingCount} Files Awaiting Payout
                </span>
                <span className="text-xs font-bold text-amber-600 group-hover:underline flex items-center gap-1">
                  Pay Now <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Completed Payout */}
          <div
            onClick={() => setActiveTab("done")}
            className={`bg-white p-4.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              activeTab === "done"
                ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-md"
                : "border-slate-200/80 hover:border-emerald-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Settled / Paid Payouts
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-emerald-600">
                {formatInr(summary.doneAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span className="font-medium">
                  {summary.doneCount} Files Settled
                </span>
                <span className="text-xs font-bold text-emerald-600 group-hover:underline flex items-center gap-1">
                  View Settled <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Table Container with Integrated Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Integrated Header Toolbar (Title, Period, Filters, Export) */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            {/* Top Toolbar Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Title & Tabs */}
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-2 mr-1">
                  <div className="p-1.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Payout Management
                  </h2>
                </div>

                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "all"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({summary.totalFiles})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pending")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "pending"
                        ? "bg-white text-amber-700 shadow-sm"
                        : "text-slate-600 hover:text-amber-700"
                    }`}
                  >
                    <span>Pending</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {summary.pendingCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("done")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "done"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    <span>Completed</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {summary.doneCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Integrated Filters & Export Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setYear("all");
                    setMonth("all");
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    year === "all" && month === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All Time
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setYear(now.getFullYear());
                    setMonth(now.getMonth() + 1);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    year === new Date().getFullYear() &&
                    month === new Date().getMonth() + 1
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  This Month
                </button>

                <select
                  value={year}
                  onChange={(e) => {
                    const val = e.target.value;
                    setYear(val === "all" ? "all" : parseInt(val, 10));
                  }}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Years</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <select
                  value={month}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMonth(val === "all" ? "all" : parseInt(val, 10));
                  }}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString("default", { month: "short" })}
                    </option>
                  ))}
                </select>

                <select
                  value={loanTypeFilter}
                  onChange={(e) => setLoanTypeFilter(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Loans</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="BUSINESS">Business</option>
                  <option value="HOME_LOAN_SALARIED">Home (Sal)</option>
                  <option value="HOME_LOAN_SELF_EMPLOYED">Home (Self)</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportXlsx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPolicyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition"
                  title="Configure Default Commission % by Loan Product"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Payout Settings</span>
                </button>

                <button
                  type="button"
                  onClick={loadData}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                  title="Refresh Data"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-primary" : ""}`} />
                </button>
              </div>
            </div>

            {/* Search Toolbar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Partner Name, Partner ID, Customer Name, Phone, App ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <AppAntTable
            rowKey={(r) =>
              `${r.applicationId ?? ""}-${r.customerId ?? ""}-${r.customerEmployeeId ?? ""}`
            }
            columns={columns}
            dataSource={sortedRows}
            loading={loading}
            size="middle"
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No payout records found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try switching tabs or resetting the date filter to All-Time.
                  </p>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* Modern 2-Column NO-SCROLL Payout Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>
                      {selectedRecord.payOutStatus === "DONE"
                        ? "Payout Details & Receipt"
                        : "Process Partner Payout"}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-300 font-semibold">
                      {modalBank.appNo}
                    </span>
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - 2 Columns Side by Side (NO SCROLL) */}
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
              {/* LEFT COLUMN: Beneficiary Partner & Loan Details */}
              <div className="md:col-span-5 flex flex-col gap-3">
                {/* Beneficiary Partner Bank Info Box */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Beneficiary Bank Details</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const fullText = `Account Holder: ${modalBank.accountHolderName}\nBank: ${modalBank.bankName}\nAccount Number: ${modalBank.accountNumber}\nIFSC Code: ${modalBank.ifscCode}`;
                          handleCopy(fullText, "all-bank-info");
                        }}
                        className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy All</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Partner / Beneficiary
                        </span>
                        <p className="font-bold text-slate-900">
                          {modalBank.partnerName}
                          {modalBank.partnerEmployeeId && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                              {modalBank.partnerEmployeeId}
                            </span>
                          )}
                        </p>
                        <span className="text-[11px] text-slate-500">
                          {modalBank.partnerPhone}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Bank Name
                          </span>
                          <p className="font-semibold text-slate-800 truncate mt-0.5">
                            {modalBank.bankName}
                          </p>
                        </div>

                        <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Account Number
                            </span>
                            {modalBank.accountNumber && modalBank.accountNumber !== "—" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(modalBank.accountNumber, "modal-acc")
                                }
                                className="text-slate-400 hover:text-brand-primary"
                              >
                                {copiedKey === "modal-acc" ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <p className="font-mono font-bold text-slate-900 truncate mt-0.5">
                            {modalBank.accountNumber}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            IFSC Code
                          </span>
                          {modalBank.ifscCode && modalBank.ifscCode !== "—" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(modalBank.ifscCode, "modal-ifsc")
                              }
                              className="text-slate-400 hover:text-brand-primary"
                            >
                              {copiedKey === "modal-ifsc" ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="font-mono font-bold text-emerald-700 mt-0.5">
                          {modalBank.ifscCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Borrower & Loan Overview Card */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Customer (Borrower)
                      </span>
                      <p className="font-bold text-slate-900">
                        {selectedRecord.customerName || "Customer"}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {selectedRecord.contact || "—"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${payoutLoanTypePillClass(
                          selectedRecord.loanType
                        )}`}
                      >
                        {loanTypeToTableShort(selectedRecord.loanType)}
                      </span>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {formatInr(modalForm.approvalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Calculation & Payout Action */}
              <div className="md:col-span-7 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs mb-2.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>Commission Calculation &amp; Action</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Payout % Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Payout Percentage (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={modalForm.payoutPercentage}
                          onChange={(e) => handlePercentageChange(e.target.value)}
                          placeholder="e.g. 2"
                          className="w-full pl-3 pr-7 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1.0, 1.5, 2.0, 2.5, 3.0].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handlePresetPercentage(rate)}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold border transition ${
                              Number(modalForm.payoutPercentage) === rate
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculated Amount Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Calculated Payout (₹)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={modalForm.payoutAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="e.g. 6000"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Auto-syncs with percentage.
                      </span>
                    </div>
                  </div>

                  {/* Compact Total Payable Banner */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-medium text-emerald-100 block">
                        Total Payable Commission
                      </span>
                      <div className="text-xl font-black tracking-tight">
                        {formatInrPrecise(modalForm.payoutAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                        {modalForm.payoutPercentage || "0"}% of Loan
                      </span>
                    </div>
                  </div>

                  {/* Payment Reference / UTR */}
                  <div className="mt-2.5">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Reference / UTR / Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={modalForm.note}
                      onChange={(e) =>
                        setModalForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      placeholder="e.g. NEFT-UTR-123456789 or Approved as per policy"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  {/* Payout Status Selector */}
                  <div className="mt-2.5">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Payout Status
                    </label>
                    <select
                      value={modalForm.payOutStatus}
                      onChange={(e) =>
                        setModalForm((prev) => ({
                          ...prev,
                          payOutStatus: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="DONE">DONE (Disbursed &amp; Settled)</option>
                      <option value="PENDING">PENDING (Keep Pending)</option>
                      <option value="REJECTED">REJECTED (Decline Payout)</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSubmitPayout}
                    className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-primary hover:bg-[#0f9b82] shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {modalForm.payOutStatus === "DONE"
                            ? "Confirm & Mark as Done"
                            : "Save Payout Record"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Policy Settings Modal */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-primary/20 text-brand-primary">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Default Payout Commission Policy
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Auto-calculates commission when loans are disbursed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSavePolicy} className="p-5 space-y-4">
              <div className="space-y-3 text-xs">
                {/* Personal Loan */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="font-bold text-slate-900 block">Personal Loan (PL)</span>
                    <span className="text-[11px] text-slate-500">Unsecured salaried / professional loans</span>
                  </div>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={payoutPolicy.PERSONAL ?? 2.0}
                      onChange={(e) =>
                        setPayoutPolicy((prev) => ({
                          ...prev,
                          PERSONAL: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full pl-3 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary text-right"
                    />
                    <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Business Loan */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="font-bold text-slate-900 block">Business Loan (BL)</span>
                    <span className="text-[11px] text-slate-500">SME / MSME business working capital</span>
                  </div>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={payoutPolicy.BUSINESS ?? 1.8}
                      onChange={(e) =>
                        setPayoutPolicy((prev) => ({
                          ...prev,
                          BUSINESS: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full pl-3 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary text-right"
                    />
                    <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Home Loan Salaried */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="font-bold text-slate-900 block">Home Loan (Salaried)</span>
                    <span className="text-[11px] text-slate-500">Secured home purchase for salaried clients</span>
                  </div>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={payoutPolicy.HOME_LOAN_SALARIED ?? 0.75}
                      onChange={(e) =>
                        setPayoutPolicy((prev) => ({
                          ...prev,
                          HOME_LOAN_SALARIED: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full pl-3 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary text-right"
                    />
                    <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Home Loan Self-Employed */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="font-bold text-slate-900 block">Home Loan (Self-Employed)</span>
                    <span className="text-[11px] text-slate-500">Secured home purchase for self-employed</span>
                  </div>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={payoutPolicy.HOME_LOAN_SELF_EMPLOYED ?? 0.85}
                      onChange={(e) =>
                        setPayoutPolicy((prev) => ({
                          ...prev,
                          HOME_LOAN_SELF_EMPLOYED: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full pl-3 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary text-right"
                    />
                    <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Default Fallback */}
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                  <div>
                    <span className="font-bold text-emerald-900 block">Default Fallback Rate</span>
                    <span className="text-[11px] text-emerald-700">Applied when product type is unclassified</span>
                  </div>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={payoutPolicy.DEFAULT ?? 2.0}
                      onChange={(e) =>
                        setPayoutPolicy((prev) => ({
                          ...prev,
                          DEFAULT: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full pl-3 pr-7 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary text-right"
                    />
                    <Percent className="w-3 h-3 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPolicyModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPolicy}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-primary hover:bg-[#0f9b82] shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingPolicy ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Policy Settings</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
