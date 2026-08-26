import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IndianRupee,
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
} from "lucide-react";
import toast from "react-hot-toast";

import {
  fetchAsmCustomersPayOutPending,
  fetchAsmCustomersPayOutDone,
  setAsmPayouts,
} from "../../../feature/thunks/asmThunks";

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

const AsmPayouts = () => {
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
    (state) => state.asm?.pendingPayout || { data: [] }
  );
  const { data: doneData = [], loading: doneLoading } = useSelector(
    (state) => state.asm?.donePayout || { data: [] }
  );

  const loading = pendingLoading || doneLoading;

  const loadData = useCallback(() => {
    dispatch(fetchAsmCustomersPayOutPending());
    dispatch(fetchAsmCustomersPayOutDone());
  }, [dispatch]);

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

  // Filtered rows based on Date and Loan Type
  const periodFilteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Date filter (All Time vs Year/Month)
      if (year !== "all" || month !== "all") {
        const filterOpts = {
          year: year === "all" ? undefined : year,
          month: month === "all" ? undefined : month,
        };
        if (!matchesMonthYear(row, filterOpts)) return false;
      }

      // Loan Type filter
      if (loanTypeFilter !== "all" && row.loanType !== loanTypeFilter) {
        return false;
      }

      return true;
    });
  }, [allRows, year, month, loanTypeFilter]);

  // Filter by Active Tab (All / Pending / Done)
  const tabFilteredRows = useMemo(() => {
    if (activeTab === "pending") {
      return periodFilteredRows.filter((r) => r.payOutStatus !== "DONE");
    }
    if (activeTab === "done") {
      return periodFilteredRows.filter((r) => r.payOutStatus === "DONE");
    }
    return periodFilteredRows;
  }, [periodFilteredRows, activeTab]);

  // Search Filter
  const finalFilteredRows = useMemo(() => {
    if (!searchTerm.trim()) return tabFilteredRows;
    return tabFilteredRows.filter((row) =>
      matchesSearchTerm(row, searchTerm, [
        "appNo",
        "applicationId",
        "customerName",
        "customerEmployeeId",
        "contact",
        "partner.name",
        "partner.email",
        "partner.phone",
        "partner.employeeId",
        "partner.partnerCode",
        "partnerName",
        "partnerEmail",
        "partnerPhone",
        "partnerEmployeeId",
        "loanType",
        "partnerBankName",
        "partnerAccountNumber",
        "partnerIfscCode",
        "payoutNote",
      ])
    );
  }, [tabFilteredRows, searchTerm]);

  // Sort newest first
  const sortedRows = useMemo(() => {
    return sortNewestFirst(finalFilteredRows);
  }, [finalFilteredRows]);

  // Accurate Summary Metrics
  const summary = useMemo(() => {
    let totalDisbursedAmount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let doneAmount = 0;
    let doneCount = 0;

    periodFilteredRows.forEach((r) => {
      const appr = Number(r.approvedAmount || r.requestedAmount || 0);
      totalDisbursedAmount += appr;

      const payoutAmt = Number(r.payoutAmount || 0);
      const isDone = r.payOutStatus === "DONE";

      if (isDone) {
        doneCount += 1;
        doneAmount += payoutAmt;
      } else {
        pendingCount += 1;
        // If pending has no calculated payout yet, estimate at 2% of approval
        pendingAmount += payoutAmt > 0 ? payoutAmt : (appr * 2) / 100;
      }
    });

    return {
      totalDisbursedAmount,
      pendingAmount,
      pendingCount,
      doneAmount,
      doneCount,
      totalFiles: periodFilteredRows.length,
    };
  }, [periodFilteredRows]);

  // Copy helper with feedback
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
      initialPct = "2";
      initialAmt = String((appr * 2) / 100);
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

  // Save Payout via ASM thunk
  const handleSubmitPayout = async (e) => {
    e?.preventDefault();
    if (!modalForm.applicationId) {
      toast.error("Application ID is missing");
      return;
    }

    try {
      setIsSaving(true);
      await dispatch(
        setAsmPayouts({
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
          ? "Payout processed successfully!"
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
      "Disbursed Amount (₹)": Number(r.approvedAmount || r.requestedAmount || 0),
      "Payout Percentage": r.payoutPercentage ? `${r.payoutPercentage}%` : "—",
      "Payout Amount (₹)": Number(r.payoutAmount || 0),
      "Payout Status": r.payOutStatus || "PENDING",
      "UTR / Note": r.payoutNote || "—",
    }));

    const datePrefix =
      year !== "all" && month !== "all"
        ? `${year}-${String(month).padStart(2, "0")}`
        : "All-Time";

    downloadXlsx(exportRows, `ASM-Payouts-${datePrefix}.xlsx`, "ASM Payouts");
    toast.success("ASM Payouts report exported to Excel!");
  };

  // Ant Design Table Columns Configuration
  const columns = [
    {
      title: "App No & Date",
      key: "appNo",
      width: 140,
      render: (_, r) => {
        const appNumber =
          r.appNo ||
          (r.applicationId ? `TLF${r.applicationId.slice(-4).toUpperCase()}` : "—");
        const rawDate = r.disbursedAt || r.createdAt;
        const dateStr = rawDate
          ? new Date(rawDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—";

        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {appNumber}
            </span>
            <div className="text-[11px] text-slate-500">{dateStr}</div>
          </div>
        );
      },
    },
    {
      title: "Channel Partner (Beneficiary)",
      key: "partner",
      width: 240,
      render: (_, r) => {
        const partnerName =
          r.partner?.name ||
          r.partnerName ||
          (r.partner?.firstName
            ? `${r.partner.firstName} ${r.partner.lastName || ""}`.trim()
            : "Partner");
        const partnerId = r.partner?.employeeId || r.partnerEmployeeId || null;
        const partnerPhone = r.partner?.phone || r.partnerPhone || null;
        const partnerEmail = r.partner?.email || r.partnerEmail || null;

        return (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              {getInitials(partnerName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {partnerName}
                </span>
                {partnerId && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono font-semibold border border-emerald-200/80">
                    {partnerId}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                {partnerPhone && <span>{partnerPhone}</span>}
                {partnerEmail && (
                  <span className="text-slate-400 truncate max-w-[140px]" title={partnerEmail}>
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
      width: 190,
      render: (_, r) => {
        const custName = r.customerName || "Customer";
        const custPhone = r.contact || null;

        return (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              {getInitials(custName)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-slate-900 truncate">
                {custName}
              </div>
              {custPhone && (
                <div className="text-[11px] text-slate-500 font-mono">
                  {custPhone}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Loan Details",
      key: "loan",
      width: 140,
      render: (_, r) => {
        const appr = Number(r.approvedAmount || r.requestedAmount || 0);
        return (
          <div className="space-y-1">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${payoutLoanTypePillClass(
                r.loanType
              )}`}
            >
              {loanTypeToTableShort(r.loanType)}
            </span>
            <div className="font-bold text-xs text-slate-900">
              {formatInr(appr)}
            </div>
          </div>
        );
      },
    },
    {
      title: "Payout Amount",
      key: "payoutAmount",
      width: 150,
      render: (_, r) => {
        const isDone = r.payOutStatus === "DONE";
        const payoutAmt = Number(r.payoutAmount || 0);
        const appr = Number(r.approvedAmount || r.requestedAmount || 0);
        const pct =
          r.payoutPercentage ||
          (payoutAmt > 0 && appr > 0
            ? ((payoutAmt / appr) * 100).toFixed(1)
            : null);

        if (payoutAmt > 0) {
          return (
            <div>
              <div className={`font-black text-xs ${isDone ? "text-emerald-700" : "text-amber-700"}`}>
                {formatInrPrecise(payoutAmt)}
              </div>
              {pct && (
                <span className="text-[10px] text-slate-500 font-medium">
                  ({pct}% commission)
                </span>
              )}
            </div>
          );
        }

        return (
          <div className="text-xs text-slate-400 italic">
            <span>Pending Calc</span>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_, r) => <PayoutStatusBadge status={r.payOutStatus || "PENDING"} />,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, r) => {
        const isDone = r.payOutStatus === "DONE";
        return (
          <button
            type="button"
            onClick={() => handleOpenModal(r)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isDone
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                : "bg-brand-primary hover:bg-[#0f9b82] text-white"
            }`}
          >
            {isDone ? (
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
        );
      },
    },
  ];

  // Helper for bank info modal
  const modalBank = useMemo(() => {
    if (!selectedRecord) return {};
    const p = selectedRecord.partner || {};
    return {
      partnerName:
        p.name ||
        selectedRecord.partnerName ||
        (p.firstName ? `${p.firstName} ${p.lastName || ""}`.trim() : "Partner"),
      partnerEmployeeId: p.employeeId || selectedRecord.partnerEmployeeId || "—",
      partnerPhone: p.phone || selectedRecord.partnerPhone || "—",
      bankName: p.bankName || selectedRecord.partnerBankName || "—",
      accountNumber: p.accountNumber || selectedRecord.partnerAccountNumber || "—",
      ifscCode: p.ifscCode || selectedRecord.partnerIfscCode || "—",
      accountHolderName:
        p.accountHolderName ||
        selectedRecord.partnerAccountHolderName ||
        p.name ||
        selectedRecord.partnerName ||
        "—",
      appNo:
        selectedRecord.appNo ||
        (selectedRecord.applicationId
          ? `TLF${selectedRecord.applicationId.slice(-4).toUpperCase()}`
          : "—"),
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
                ? "border-amber-400 ring-2 ring-amber-200/60 shadow-md"
                : "border-slate-200/80 hover:border-amber-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Pending Payouts
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-amber-600">
                {formatInr(summary.pendingAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>{summary.pendingCount} Files Awaiting Payout</span>
                <span className="font-bold text-amber-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Pay Now →
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Done Payout */}
          <div
            onClick={() => setActiveTab("done")}
            className={`bg-white p-4.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              activeTab === "done"
                ? "border-emerald-400 ring-2 ring-emerald-200/60 shadow-md"
                : "border-slate-200/80 hover:border-emerald-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Settled / Paid Payouts
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-emerald-600">
                {formatInr(summary.doneAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>{summary.doneCount} Files Settled</span>
                <span className="font-bold text-emerald-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View Settled →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Integrated Table & Toolbar Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Main Toolbar */}
          <div className="p-4 border-b border-slate-100 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Left: Hub Title & Status Segment Tabs */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Payout Management
                  </h2>
                </div>

                {/* Status Segment Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === "all"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({periodFilteredRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pending")}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "pending"
                        ? "bg-white text-amber-700 shadow-sm"
                        : "text-slate-600 hover:text-amber-700"
                    }`}
                  >
                    <span>Pending</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                      {summary.pendingCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("done")}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "done"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    <span>Completed</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      {summary.doneCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right: Period Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Period Mode Toggle: All Time vs This Month */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setYear("all");
                      setMonth("all");
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      year === "all" && month === "all"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
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
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      year === new Date().getFullYear() &&
                      month === new Date().getMonth() + 1
                        ? "bg-brand-primary text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    This Month
                  </button>
                </div>

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

            {/* 2-Column Body: Left (Bank & Customer Info) | Right (Action & Commission Calculator) */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-64px)] grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* LEFT COLUMN: Bank Details Card */}
              <div className="md:col-span-5 space-y-3">
                {/* Bank Card with 1-Click Copy */}
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl p-3.5 border border-emerald-100/80 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                      <Building2 className="w-4 h-4 text-brand-primary" />
                      <span>Partner Bank Account</span>
                    </div>

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
                              title="Copy Account Number"
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

                    <div className="grid grid-cols-2 gap-2">
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
                              title="Copy IFSC Code"
                            >
                              {copiedKey === "modal-ifsc" ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="font-mono font-bold text-emerald-700 truncate mt-0.5">
                          {modalBank.ifscCode}
                        </p>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Account Holder
                        </span>
                        <p className="font-semibold text-slate-800 truncate mt-0.5">
                          {modalBank.accountHolderName}
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
                    <Calculator className="w-4 h-4 text-brand-primary" />
                    <span>Live Commission Calculator</span>
                  </div>

                  {/* Bidirectional Input Form */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Input 1: Percentage */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Commission Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={modalForm.payoutPercentage}
                          onChange={(e) => handlePercentageChange(e.target.value)}
                          placeholder="e.g. 2.0"
                          className="w-full pl-3 pr-7 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Input 2: Amount (₹) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Payout Amount (₹)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={modalForm.payoutAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="e.g. 6000"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-black text-emerald-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Quick Commission Presets
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 1.5, 2, 2.5, 3].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handlePresetPercentage(pct)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                            String(modalForm.payoutPercentage) === String(pct)
                              ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UTR Note Input */}
                  <div className="space-y-1 mb-3">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Bank Reference / UTR Number / Transaction Note
                    </label>
                    <input
                      type="text"
                      value={modalForm.note}
                      onChange={(e) =>
                        setModalForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      placeholder="e.g. UTR 4235890212 / NEFT transfer complete"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Payout Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setModalForm((prev) => ({ ...prev, payOutStatus: "DONE" }))
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                          modalForm.payOutStatus === "DONE"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Payment Done</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setModalForm((prev) => ({ ...prev, payOutStatus: "PENDING" }))
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                          modalForm.payOutStatus === "PENDING"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Keep Pending</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
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
    </div>
  );
};

export default AsmPayouts;
