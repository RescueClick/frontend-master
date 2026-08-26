import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Award,
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
  User,
  CreditCard,
  X,
  ShieldCheck,
  Percent,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Settings,
  Plus,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

import {
  fetchAdminIncentives,
  payAdminIncentive,
} from "../../../feature/thunks/adminThunks";

import { matchesSearchTerm } from "../../../utils/tableFilter";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import AppAntTable from "../../../components/shared/AppAntTable";

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

const getTierColor = (tier) => {
  const t = String(tier || "").toLowerCase();
  if (t.includes("platinum") || t.includes("diamond")) {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }
  if (t.includes("gold")) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (t.includes("silver")) {
    return "bg-slate-200 text-slate-800 border-slate-300";
  }
  if (t.includes("bronze")) {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const AdminIncentives = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const now = new Date();
  // Navigation tab state: 'all' | 'eligible' | 'paid'
  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || "all"
  );

  // Filters - Default to current month & year
  const [searchTerm, setSearchTerm] = useState("");
  const [year, setYear] = useState(location.state?.year || now.getFullYear());
  const [month, setMonth] = useState(location.state?.month || now.getMonth() + 1);

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Slabs Settings Modal State
  const [slabsModalOpen, setSlabsModalOpen] = useState(false);
  const [activeSlabs, setActiveSlabs] = useState([]);
  const [isSavingSlabs, setIsSavingSlabs] = useState(false);
  const [newSlab, setNewSlab] = useState({
    tier: "",
    minDisbursement: "",
    rewardAmount: "",
    rewardType: "FLAT",
  });

  // Modal form data for settlement
  const [modalForm, setModalForm] = useState({
    id: "",
    partnerId: "",
    amount: "",
    note: "",
    utrNumber: "",
    status: "PAID",
  });

  // Redux Data
  const { data: rawData = [], loading = false } = useSelector(
    (state) => state.admin?.incentives || { data: [], loading: false }
  );

  const fetchSlabs = useCallback(async () => {
    try {
      const { adminToken } = getAuthData();
      const res = await axios.get(`${backendurl}/admin/incentive-slabs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res?.data?.slabs) {
        setActiveSlabs(res.data.slabs);
      }
    } catch (e) {
      console.error("Failed to fetch incentive slabs:", e);
    }
  }, []);

  const loadData = useCallback(() => {
    dispatch(
      fetchAdminIncentives({
        year: year === "all" ? undefined : year,
        month: month === "all" ? undefined : month,
      })
    );
    fetchSlabs();
  }, [dispatch, year, month, fetchSlabs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allRows = useMemo(() => {
    return Array.isArray(rawData) ? rawData : [];
  }, [rawData]);

  // Tab Filtering
  const tabFilteredRows = useMemo(() => {
    if (activeTab === "eligible") {
      return allRows.filter((r) => r.status === "PENDING" || (r.eligibleForIncentive && r.status !== "PAID"));
    }
    if (activeTab === "paid") {
      return allRows.filter((r) => r.status === "PAID" || r.incentivePaid);
    }
    return allRows;
  }, [allRows, activeTab]);

  // Search Filter
  const finalFilteredRows = useMemo(() => {
    if (!searchTerm.trim()) return tabFilteredRows;
    const term = searchTerm.trim().toLowerCase();
    return tabFilteredRows.filter((r) => {
      const pName = String(r.partnerName || "").toLowerCase();
      const pId = String(r.partnerEmployeeId || "").toLowerCase();
      const phone = String(r.partnerPhone || "").toLowerCase();
      const email = String(r.partnerEmail || "").toLowerCase();
      const bank = String(r.partnerBankName || "").toLowerCase();
      const acc = String(r.partnerAccountNumber || "").toLowerCase();
      const ifsc = String(r.partnerIfscCode || "").toLowerCase();
      const tier = String(r.tier || "").toLowerCase();
      const notes = String(r.notes || r.utrNumber || "").toLowerCase();
      const status = String(r.status || "").toLowerCase();

      return (
        pName.includes(term) ||
        pId.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        bank.includes(term) ||
        acc.includes(term) ||
        ifsc.includes(term) ||
        tier.includes(term) ||
        notes.includes(term) ||
        status.includes(term)
      );
    });
  }, [tabFilteredRows, searchTerm]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalDisbursedVolume = 0;
    let totalFiles = 0;
    let eligiblePoolAmount = 0;
    let eligibleCount = 0;
    let paidAmount = 0;
    let paidCount = 0;

    allRows.forEach((r) => {
      const vol = Number(r.disbursedAmount || r.achievedDisbursement || 0);
      totalDisbursedVolume += vol;
      totalFiles += Number(r.disbursedCount || r.achievedFileCount || 0);

      const incAmt = Number(r.incentiveAmount || r.amount || 0);
      const isPaid = r.status === "PAID" || r.incentivePaid;
      const isEligible = r.eligibleForIncentive || r.status === "PENDING";

      if (isPaid) {
        paidCount += 1;
        paidAmount += incAmt;
      } else if (isEligible) {
        eligibleCount += 1;
        eligiblePoolAmount += incAmt;
      }
    });

    return {
      totalDisbursedVolume,
      totalFiles,
      eligiblePoolAmount,
      eligibleCount,
      paidAmount,
      paidCount,
      totalPartners: allRows.length,
    };
  }, [allRows]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text || text === "—") return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedKey(key);
    toast.success(`Copied: ${text}`, { duration: 1500 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open Settlement Modal
  const handleOpenModal = (record) => {
    setSelectedRecord(record);
    const incAmt = Number(record.incentiveAmount || record.amount || 1000);

    setModalForm({
      id: record.incentiveRecordId || record.id || "",
      partnerId: record.partnerId || "",
      amount: String(incAmt),
      note: record.notes || record.utrNumber || "",
      utrNumber: record.utrNumber || record.notes || "",
      status: "PAID",
    });

    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  // Submit Incentive Settlement
  const handleSubmitSettlement = async (e) => {
    e?.preventDefault();
    if (!modalForm.partnerId && !modalForm.id) {
      toast.error("Partner ID or Record ID is missing");
      return;
    }

    try {
      setIsSaving(true);
      await dispatch(
        payAdminIncentive({
          id: modalForm.id || undefined,
          partnerId: modalForm.partnerId,
          month,
          year,
          amount: Number(modalForm.amount),
          note: modalForm.utrNumber || modalForm.note || "",
          utrNumber: modalForm.utrNumber || modalForm.note || "",
        })
      ).unwrap();

      toast.success("Incentive bonus settled and marked as PAID!");
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error("Failed to settle incentive:", err);
      toast.error(typeof err === "string" ? err : err?.message || "Failed to settle incentive");
    } finally {
      setIsSaving(false);
    }
  };

  // Slabs Management Handlers
  const handleSaveSlabs = async () => {
    try {
      setIsSavingSlabs(true);
      const { adminToken } = getAuthData();
      const res = await axios.put(
        `${backendurl}/admin/incentive-slabs`,
        { slabs: activeSlabs },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success("Incentive slabs saved successfully!");
      if (res?.data?.slabs) {
        setActiveSlabs(res.data.slabs);
      }
      setSlabsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to update slabs:", err);
      toast.error(err?.response?.data?.message || "Failed to update slabs");
    } finally {
      setIsSavingSlabs(false);
    }
  };

  const handleAddSlab = () => {
    if (!newSlab.tier.trim() || !newSlab.minDisbursement || !newSlab.rewardAmount) {
      toast.error("Please fill in Tier Name, Min Disbursement, and Reward Amount");
      return;
    }

    const updated = [
      ...activeSlabs,
      {
        id: `slab_${Date.now()}`,
        tier: newSlab.tier.trim(),
        minDisbursement: Number(newSlab.minDisbursement),
        rewardAmount: Number(newSlab.rewardAmount),
        rewardType: newSlab.rewardType,
      },
    ].sort((a, b) => a.minDisbursement - b.minDisbursement);

    setActiveSlabs(updated);
    setNewSlab({ tier: "", minDisbursement: "", rewardAmount: "", rewardType: "FLAT" });
    toast.success("New slab tier added to preview. Click 'Save Slabs' to persist.");
  };

  const handleDeleteSlab = (index) => {
    const updated = activeSlabs.filter((_, idx) => idx !== index);
    setActiveSlabs(updated);
  };

  // Export to Excel
  const handleExportXlsx = () => {
    if (!finalFilteredRows.length) {
      toast.error("No incentive rows available to export");
      return;
    }

    const exportRows = finalFilteredRows.map((r, i) => ({
      "S.No": i + 1,
      "Partner Name": r.partnerName || "Partner",
      "Partner ID": r.partnerEmployeeId || "—",
      "Phone": r.partnerPhone || "—",
      "Email": r.partnerEmail || "—",
      "Bank Name": r.partnerBankName || "—",
      "Account Number": r.partnerAccountNumber ? `'${r.partnerAccountNumber}` : "—",
      "IFSC Code": r.partnerIfscCode || "—",
      "Disbursed Volume (₹)": Number(r.disbursedAmount || 0),
      "Disbursed Count": Number(r.disbursedCount || 0),
      "Milestone Tier": r.tier || "—",
      "Incentive Reward (₹)": Number(r.incentiveAmount || 0),
      "Status": r.status || "IN_PROGRESS",
      "UTR / Note": r.notes || r.utrNumber || "—",
    }));

    downloadXlsx(exportRows, `Admin-Incentives-${year}-${month}.xlsx`, "Incentives");
    toast.success("Incentive report exported to Excel!");
  };

  // Table Columns
  const columns = [
    {
      title: "Channel Partner (Beneficiary)",
      key: "partner",
      width: 250,
      render: (_, r) => {
        const name = r.partnerName || "Partner";
        const empId = r.partnerEmployeeId || null;
        const phone = r.partnerPhone || null;
        const email = r.partnerEmail || null;

        return (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              {getInitials(name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {name}
                </span>
                {empId && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                    {empId}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                {phone && <span>{phone}</span>}
                {email && (
                  <span className="text-slate-400 truncate max-w-[140px]" title={email}>
                    {email}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Monthly Disbursed Volume",
      key: "volume",
      width: 170,
      render: (_, r) => {
        const vol = Number(r.disbursedAmount || 0);
        const count = Number(r.disbursedCount || 0);
        return (
          <div className="space-y-0.5">
            <div className="font-black text-xs text-slate-900">
              {formatInr(vol)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {count} Disbursed Loans
            </div>
          </div>
        );
      },
    },
    {
      title: "Milestone Tier & Progress",
      key: "milestone",
      width: 210,
      render: (_, r) => {
        const tier = r.tier || "Standard";
        const isEligible = r.eligibleForIncentive || r.status === "PENDING" || r.status === "PAID";
        const progress = Math.min(100, Math.max(0, Number(r.progressPercent || 0)));
        const rem = Number(r.remainingToNextMilestone || 0);

        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${getTierColor(
                  tier
                )}`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{tier} Milestone</span>
              </span>
            </div>

            {r.nextSlab && (
              <div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-primary h-full rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Need {formatInr(rem)} for {r.nextSlab.tier} ({formatInr(r.nextSlab.rewardAmount)})
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Incentive Bonus",
      key: "amount",
      width: 140,
      render: (_, r) => {
        const amt = Number(r.incentiveAmount || r.amount || 0);
        const isPaid = r.status === "PAID" || r.incentivePaid;

        if (amt > 0) {
          return (
            <div>
              <div className={`font-black text-xs ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                {formatInrPrecise(amt)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {isPaid ? "Paid to Bank" : "Bonus Unlocked"}
              </span>
            </div>
          );
        }

        return (
          <span className="text-xs text-slate-400 italic">
            In Progress
          </span>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_, r) => {
        const isPaid = r.status === "PAID" || r.incentivePaid;
        const isEligible = r.eligibleForIncentive || r.status === "PENDING";

        if (isPaid) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              <span>Paid</span>
            </span>
          );
        }

        if (isEligible) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3" />
              <span>Eligible</span>
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span>In Progress</span>
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, r) => {
        const isPaid = r.status === "PAID" || r.incentivePaid;
        const isEligible = r.eligibleForIncentive || r.status === "PENDING";

        if (isPaid) {
          return (
            <button
              type="button"
              onClick={() => handleOpenModal(r)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Receipt</span>
            </button>
          );
        }

        if (isEligible) {
          return (
            <button
              type="button"
              onClick={() => handleOpenModal(r)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary hover:bg-[#0f9b82] text-white shadow-sm transition"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Pay Bonus</span>
            </button>
          );
        }

        return (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
          >
            <span>Target Active</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Disbursed Volume */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Disbursed Volume
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-slate-900">
                {formatInr(summary.totalDisbursedVolume)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>{summary.totalFiles} Disbursed Loans</span>
                <span className="font-semibold text-blue-600">
                  {month === "all"
                    ? (year === "all" ? "All Time" : `Year ${year}`)
                    : new Date(year === "all" ? 2000 : year, month - 1).toLocaleString("default", {
                        month: "short",
                        ...(year !== "all" ? { year: "numeric" } : {}),
                      })}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Eligible Incentive Pool */}
          <div
            onClick={() => setActiveTab("eligible")}
            className={`bg-white p-4.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              activeTab === "eligible"
                ? "border-amber-400 ring-2 ring-amber-200/60 shadow-md"
                : "border-slate-200/80 hover:border-amber-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Eligible Incentive Pool
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-amber-600">
                {formatInr(summary.eligiblePoolAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>{summary.eligibleCount} Partners Unlocked Bonus</span>
                <span className="font-bold text-amber-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Pay Now →
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Settled Incentives */}
          <div
            onClick={() => setActiveTab("paid")}
            className={`bg-white p-4.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              activeTab === "paid"
                ? "border-emerald-400 ring-2 ring-emerald-200/60 shadow-md"
                : "border-slate-200/80 hover:border-emerald-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Settled / Paid Incentives
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-emerald-600">
                {formatInr(summary.paidAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>{summary.paidCount} Partners Settled</span>
                <span className="font-bold text-emerald-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View Paid →
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
              {/* Left: Title & Tabs */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Award className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Incentive Hub
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
                    All ({allRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("eligible")}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "eligible"
                        ? "bg-white text-amber-700 shadow-sm"
                        : "text-slate-600 hover:text-amber-700"
                    }`}
                  >
                    <span>Eligible</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                      {summary.eligibleCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("paid")}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "paid"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    <span>Paid</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      {summary.paidCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right: Filters & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
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
                  onChange={(e) => setMonth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString("default", { month: "short" })}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSlabsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-700" />
                  <span>⚙️ Incentive Slabs</span>
                </button>

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

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Partner Name, ID, Phone, Email, Bank, Milestone Tier..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Table */}
          <AppAntTable
            rowKey={(r) => String(r.partnerId || r._id || Math.random())}
            columns={columns}
            dataSource={finalFilteredRows}
            loading={loading}
            size="middle"
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No incentive records found for this period
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Partners will appear automatically as their disbursed loans accumulate in {new Date(year, month - 1).toLocaleString("default", { month: "short", year: "numeric" })}.
                  </p>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* Modern 2-Column NO-SCROLL Incentive Settlement Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>
                      {selectedRecord.status === "PAID"
                        ? "Incentive Bonus Settlement Advice"
                        : "Settle Milestone Incentive Bonus"}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-amber-300 font-semibold">
                      {selectedRecord.tier} Milestone
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

            {/* 2-Column Body */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-64px)] grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Bank Card */}
              <div className="md:col-span-6 space-y-3">
                <div className="bg-gradient-to-br from-slate-50 to-amber-50/30 rounded-xl p-3.5 border border-amber-100 shadow-sm">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>Beneficiary Bank Account</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const fullText = `Account Holder: ${selectedRecord.partnerAccountHolderName}\nBank: ${selectedRecord.partnerBankName}\nAccount Number: ${selectedRecord.partnerAccountNumber}\nIFSC Code: ${selectedRecord.partnerIfscCode}`;
                        handleCopy(fullText, "all-bank-info");
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy All</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Partner Name
                      </span>
                      <p className="font-bold text-slate-900">
                        {selectedRecord.partnerName}
                        {selectedRecord.partnerEmployeeId && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                            {selectedRecord.partnerEmployeeId}
                          </span>
                        )}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {selectedRecord.partnerPhone}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Bank Name
                        </span>
                        <p className="font-semibold text-slate-800 truncate mt-0.5">
                          {selectedRecord.partnerBankName || "—"}
                        </p>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Account Number
                          </span>
                          {selectedRecord.partnerAccountNumber && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(selectedRecord.partnerAccountNumber, "modal-acc")
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
                          {selectedRecord.partnerAccountNumber || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            IFSC Code
                          </span>
                          {selectedRecord.partnerIfscCode && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(selectedRecord.partnerIfscCode, "modal-ifsc")
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
                        <p className="font-mono font-bold text-emerald-700 truncate mt-0.5">
                          {selectedRecord.partnerIfscCode || "—"}
                        </p>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Account Holder
                        </span>
                        <p className="font-semibold text-slate-800 truncate mt-0.5">
                          {selectedRecord.partnerAccountHolderName || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone Performance Card */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Disbursement Milestone
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">
                        {formatInr(selectedRecord.disbursedAmount)} Disbursed
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Period: {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${getTierColor(selectedRecord.tier)}`}>
                      {selectedRecord.tier} Tier
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Settlement Form */}
              <div className="md:col-span-6 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-4 rounded-xl border border-amber-100 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Incentive Bonus Amount (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={modalForm.amount}
                        onChange={(e) =>
                          setModalForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        placeholder="e.g. 1000"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-black text-amber-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Bank UTR Number / Transaction Reference
                    </label>
                    <input
                      type="text"
                      value={modalForm.utrNumber}
                      onChange={(e) =>
                        setModalForm((prev) => ({ ...prev, utrNumber: e.target.value, note: e.target.value }))
                      }
                      placeholder="e.g. UTR 948275928120 / NEFT Completed"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Instant Partner Notification</span>
                    </p>
                    <p className="text-[11px] text-amber-800">
                      When marked as PAID, an automated official DhanSource Incentive Settlement email with the UTR number will be sent to the partner.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
                    onClick={handleSubmitSettlement}
                    className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-primary hover:bg-[#0f9b82] shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Confirm & Settle Bonus</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incentive Slabs Policy Configuration Modal */}
      {slabsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Configure Monthly Disbursement Incentive Slabs
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Set volume thresholds (e.g. ₹10 Lakhs ➔ ₹1,000) for automatic partner bonus qualification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSlabsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Existing Slabs List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Active Milestone Tiers
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeSlabs.map((slab, idx) => (
                    <div
                      key={slab.id || idx}
                      className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-xs text-slate-900">
                            {slab.tier} Tier
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Min Disbursed Volume: <strong className="text-slate-800">{formatInr(slab.minDisbursement)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700">
                            +{formatInr(slab.rewardAmount)} Bonus
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {slab.rewardType === "PERCENT" ? "Percentage Bonus" : "Flat Reward"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSlab(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Slab"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Slab Form */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Add New Milestone Tier
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tier Name
                    </label>
                    <input
                      type="text"
                      value={newSlab.tier}
                      onChange={(e) => setNewSlab((prev) => ({ ...prev, tier: e.target.value }))}
                      placeholder="e.g. Diamond"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Min Disbursed (₹)
                    </label>
                    <input
                      type="number"
                      value={newSlab.minDisbursement}
                      onChange={(e) => setNewSlab((prev) => ({ ...prev, minDisbursement: e.target.value }))}
                      placeholder="e.g. 2500000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Bonus Reward (₹)
                    </label>
                    <input
                      type="number"
                      value={newSlab.rewardAmount}
                      onChange={(e) => setNewSlab((prev) => ({ ...prev, rewardAmount: e.target.value }))}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddSlab}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tier</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSlabsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingSlabs}
                onClick={handleSaveSlabs}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-primary hover:bg-[#0f9b82] transition disabled:opacity-50"
              >
                {isSavingSlabs ? "Saving Slabs..." : "Save Slabs Policy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncentives;
