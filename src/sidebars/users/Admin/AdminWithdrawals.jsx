import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
  CreditCard,
  Copy,
  Check,
  Download,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Eye,
} from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import AppAntTable from "../../../components/shared/AppAntTable";

const formatINR = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

const formatINRPrecise = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const STATUS_CONFIG = {
  PENDING_ADMIN: {
    label: "Ready to Pay",
    chip: "bg-teal-50 text-teal-800 border border-teal-200",
    badge: "bg-teal-500",
  },
  PENDING_ASM: {
    label: "With ASM",
    chip: "bg-amber-50 text-amber-800 border border-amber-200",
    badge: "bg-amber-500",
  },
  PAID: {
    label: "Paid & Settled",
    chip: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    badge: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    chip: "bg-rose-50 text-rose-800 border border-rose-200",
    badge: "bg-rose-500",
  },
};

const AdminWithdrawals = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState("PENDING_ADMIN");
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Modals
  const [payModalRecord, setPayModalRecord] = useState(null);
  const [rejectModalRecord, setRejectModalRecord] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { adminToken } = getAuthData();
      const res = await axios.get(`${backendurl}/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { status: "ALL" },
      });
      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to load withdrawals:", err);
      toast.error(err?.response?.data?.message || "Failed to load withdrawals");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text || text === "—") return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedKey(key);
    toast.success(`Copied: ${text}`, { duration: 1500 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Metrics summary
  const counts = useMemo(() => {
    const c = {
      PENDING_ADMIN: 0,
      PENDING_ADMIN_AMT: 0,
      PENDING_ASM: 0,
      PENDING_ASM_AMT: 0,
      PAID: 0,
      PAID_AMT: 0,
      REJECTED: 0,
      REJECTED_AMT: 0,
      ALL: rows.length,
      ALL_AMT: 0,
    };
    rows.forEach((r) => {
      const amt = Number(r.amount || 0);
      c.ALL_AMT += amt;
      if (r.status === "PENDING_ADMIN") {
        c.PENDING_ADMIN += 1;
        c.PENDING_ADMIN_AMT += amt;
      } else if (r.status === "PENDING_ASM") {
        c.PENDING_ASM += 1;
        c.PENDING_ASM_AMT += amt;
      } else if (r.status === "PAID") {
        c.PAID += 1;
        c.PAID_AMT += amt;
      } else if (r.status === "REJECTED") {
        c.REJECTED += 1;
        c.REJECTED_AMT += amt;
      }
    });
    return c;
  }, [rows]);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab !== "ALL" && row.status !== tab) return false;
      if (!q) return true;
      const p = row.partnerId || {};
      const a = row.asmId || {};
      const hay = `${p.firstName || ""} ${p.lastName || ""} ${p.partnerCode || ""} ${p.employeeId || ""} ${p.phone || ""} ${p.bankName || ""} ${p.accountNumber || ""} ${p.ifscCode || ""} ${a.firstName || ""} ${a.lastName || ""} ${row.note || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, tab, search]);

  // Process payment
  const handleConfirmPay = async () => {
    if (!payModalRecord) return;
    try {
      setBusyId(payModalRecord._id);
      const { adminToken } = getAuthData();
      await axios.post(
        `${backendurl}/admin/withdrawals/${payModalRecord._id}/pay`,
        { note: paymentNote.trim() },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success("Withdrawal paid and settled successfully!");
      setPayModalRecord(null);
      setPaymentNote("");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payment execution failed");
    } finally {
      setBusyId(null);
    }
  };

  // Reject withdrawal
  const handleConfirmReject = async () => {
    if (!rejectModalRecord) return;
    try {
      setBusyId(rejectModalRecord._id);
      const { adminToken } = getAuthData();
      await axios.post(
        `${backendurl}/admin/withdrawals/${rejectModalRecord._id}/reject`,
        { reason: rejectReason.trim() },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success("Withdrawal request rejected");
      setRejectModalRecord(null);
      setRejectReason("");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  };

  // Export Excel
  const handleExportXlsx = () => {
    if (!filtered.length) {
      toast.error("No withdrawal records to export");
      return;
    }
    const exportRows = filtered.map((r, i) => {
      const p = r.partnerId || {};
      const a = r.asmId || {};
      return {
        "S.No": i + 1,
        "Request Date": r.createdAt
          ? new Date(r.createdAt).toLocaleDateString("en-IN")
          : "—",
        "Partner Name": `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Partner",
        "Partner Code / ID": p.employeeId || p.partnerCode || "—",
        "Partner Phone": p.phone || "—",
        "Bank Name": p.bankName || "—",
        "Account Number": p.accountNumber ? `'${p.accountNumber}` : "—",
        "IFSC Code": p.ifscCode || "—",
        "Requested Amount (INR)": r.amount || 0,
        "ASM Name": `${a.firstName || ""} ${a.lastName || ""}`.trim() || "—",
        Status: STATUS_CONFIG[r.status]?.label || r.status,
        Note: r.note || r.adminNote || "",
      };
    });
    downloadXlsx(exportRows, "Partner-Withdrawals.xlsx", "Withdrawals");
    toast.success("Withdrawals exported to Excel!");
  };

  const columns = useMemo(
    () => [
      {
        title: "Request Date",
        key: "date",
        width: 130,
        render: (_, r) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded w-fit border border-slate-200/80">
              #{r._id.slice(-6).toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 font-medium">
              {r.createdAt
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
          const p = r.partnerId || {};
          const partnerName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Partner";
          const partnerCode = p.employeeId || p.partnerCode;

          return (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                {getInitials(partnerName)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                    {partnerName}
                  </span>
                  {partnerCode && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                      {partnerCode}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {p.phone || p.email || "—"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        title: "Beneficiary Bank Details",
        key: "bank",
        width: 220,
        render: (_, r) => {
          const p = r.partnerId || {};
          return (
            <div className="flex flex-col text-xs">
              <span className="font-bold text-slate-800 truncate">
                {p.bankName || "—"}
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 mt-0.5">
                <span>{p.accountNumber ? `A/C: ${p.accountNumber}` : "—"}</span>
                {p.ifscCode && (
                  <span className="text-emerald-700 font-bold">
                    {p.ifscCode}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: "ASM Reviewer",
        key: "asm",
        width: 170,
        render: (_, r) => {
          const a = r.asmId || {};
          const asmName = `${a.firstName || ""} ${a.lastName || ""}`.trim();
          return (
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-slate-800">
                {asmName || "—"}
              </span>
              {a.employeeId && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {a.employeeId}
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: "Requested Amount",
        key: "amount",
        width: 150,
        render: (_, r) => (
          <span className="text-sm font-black text-slate-900">
            {formatINR(r.amount)}
          </span>
        ),
      },
      {
        title: "Status",
        key: "status",
        width: 130,
        render: (_, r) => {
          const cfg = STATUS_CONFIG[r.status] || {
            label: r.status,
            chip: "bg-slate-100 text-slate-700",
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg.chip}`}
            >
              {cfg.label}
            </span>
          );
        },
      },
      {
        title: "Action",
        key: "actions",
        width: 160,
        fixed: "right",
        render: (_, r) => (
          <div className="flex items-center gap-1.5">
            {r.status === "PENDING_ADMIN" ? (
              <>
                <button
                  type="button"
                  onClick={() => setPayModalRecord(r)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-primary hover:bg-[#0f9b82] text-white shadow-sm flex items-center gap-1 transition"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Pay Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRejectModalRecord(r)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition"
                  title="Reject Request"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPayModalRecord(r)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Ready to Pay (Admin) */}
          <div
            onClick={() => setTab("PENDING_ADMIN")}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              tab === "PENDING_ADMIN"
                ? "border-teal-400 ring-2 ring-teal-400/20 shadow-md"
                : "border-slate-200/80 hover:border-teal-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Ready to Pay (Admin)
              </span>
              <div className="p-2 rounded-xl bg-teal-100 text-teal-600">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-teal-600">
                {formatINR(counts.PENDING_ADMIN_AMT)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>{counts.PENDING_ADMIN} Requests</span>
                <span className="font-bold text-teal-600 group-hover:underline flex items-center gap-0.5">
                  Pay Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Still with ASM */}
          <div
            onClick={() => setTab("PENDING_ASM")}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              tab === "PENDING_ASM"
                ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                : "border-slate-200/80 hover:border-amber-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Still With ASM
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Clock3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-amber-600">
                {formatINR(counts.PENDING_ASM_AMT)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>{counts.PENDING_ASM} Pending ASM</span>
                <span className="font-bold text-amber-600 group-hover:underline">
                  View
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Paid & Settled */}
          <div
            onClick={() => setTab("PAID")}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              tab === "PAID"
                ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-md"
                : "border-slate-200/80 hover:border-emerald-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Paid &amp; Settled
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-emerald-600">
                {formatINR(counts.PAID_AMT)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>{counts.PAID} Settled</span>
                <span className="font-bold text-emerald-600 group-hover:underline">
                  History
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Rejected */}
          <div
            onClick={() => setTab("REJECTED")}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              tab === "REJECTED"
                ? "border-rose-400 ring-2 ring-rose-400/20 shadow-md"
                : "border-slate-200/80 hover:border-rose-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Rejected
              </span>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-rose-600">
                {formatINR(counts.REJECTED_AMT)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>{counts.REJECTED} Declined</span>
                <span className="font-bold text-rose-600 group-hover:underline">
                  Review
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Integrated Toolbar */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Title & Tabs */}
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-2 mr-1">
                  <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Partner Withdrawals
                  </h2>
                </div>

                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTab("PENDING_ADMIN")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tab === "PENDING_ADMIN"
                        ? "bg-white text-teal-700 shadow-sm"
                        : "text-slate-600 hover:text-teal-700"
                    }`}
                  >
                    <span>Ready to pay</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                      {counts.PENDING_ADMIN}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab("PENDING_ASM")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tab === "PENDING_ASM"
                        ? "bg-white text-amber-700 shadow-sm"
                        : "text-slate-600 hover:text-amber-700"
                    }`}
                  >
                    <span>With ASM</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {counts.PENDING_ASM}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab("PAID")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tab === "PAID"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    <span>Paid</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {counts.PAID}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab("REJECTED")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tab === "REJECTED"
                        ? "bg-white text-rose-700 shadow-sm"
                        : "text-slate-600 hover:text-rose-700"
                    }`}
                  >
                    <span>Rejected</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                      {counts.REJECTED}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tab === "ALL"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({counts.ALL})
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
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
                  onClick={load}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-primary" : ""}`} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Partner Name, Partner Code, Phone, Bank Name, A/C No, IFSC..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <AppAntTable
            rowKey={(r) => r._id}
            columns={columns}
            dataSource={filtered}
            loading={loading}
            size="middle"
          />
        </div>
      </div>

      {/* 2-Column NO-SCROLL Payment & Bank Modal for Withdrawals */}
      {payModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>
                      {payModalRecord.status === "PAID"
                        ? "Settled Withdrawal Details"
                        : "Settle Partner Withdrawal"}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-300 font-semibold">
                      #{payModalRecord._id.slice(-6).toUpperCase()}
                    </span>
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayModalRecord(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2-Column Side-by-Side Body */}
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
              {/* Left Column: Beneficiary Bank Details */}
              <div className="md:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Beneficiary Bank Details</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const p = payModalRecord.partnerId || {};
                        const fullText = `Account Holder: ${p.accountHolderName || `${p.firstName || ""} ${p.lastName || ""}`}\nBank: ${p.bankName || "—"}\nAccount Number: ${p.accountNumber || "—"}\nIFSC: ${p.ifscCode || "—"}`;
                        handleCopy(fullText, "all-bank-info");
                      }}
                      className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy All</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Partner / Beneficiary
                      </span>
                      <p className="font-bold text-slate-900">
                        {`${payModalRecord.partnerId?.firstName || ""} ${payModalRecord.partnerId?.lastName || ""}`.trim() || "Partner"}
                        {payModalRecord.partnerId?.employeeId && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                            {payModalRecord.partnerId?.employeeId}
                          </span>
                        )}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {payModalRecord.partnerId?.phone || "—"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Bank Name
                        </span>
                        <p className="font-semibold text-slate-800 truncate mt-0.5">
                          {payModalRecord.partnerId?.bankName || "—"}
                        </p>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Account Number
                          </span>
                          {payModalRecord.partnerId?.accountNumber && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(payModalRecord.partnerId?.accountNumber, "modal-acc")
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
                          {payModalRecord.partnerId?.accountNumber || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          IFSC Code
                        </span>
                        {payModalRecord.partnerId?.ifscCode && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(payModalRecord.partnerId?.ifscCode, "modal-ifsc")
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
                        {payModalRecord.partnerId?.ifscCode || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Settlement & Actions */}
              <div className="md:col-span-6 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block mb-2.5">
                    Settlement Details
                  </span>

                  {/* Total Payable Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-medium text-emerald-100 block">
                        Payable Withdrawal Amount
                      </span>
                      <div className="text-2xl font-black tracking-tight">
                        {formatINRPrecise(payModalRecord.amount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white font-mono">
                        Wallet Withdrawal
                      </span>
                    </div>
                  </div>

                  {payModalRecord.status === "PENDING_ADMIN" && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Payment UTR / Reference Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="e.g. IMPS-UTR-987654321"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  )}

                  {payModalRecord.note && (
                    <div className="mt-2.5 p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Note / Reason:
                      </span>
                      <p className="text-slate-700 mt-0.5">{payModalRecord.note}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayModalRecord(null)}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Close
                  </button>

                  {payModalRecord.status === "PENDING_ADMIN" && (
                    <button
                      type="button"
                      disabled={busyId === payModalRecord._id}
                      onClick={handleConfirmPay}
                      className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-primary hover:bg-[#0f9b82] shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {busyId === payModalRecord._id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Confirm &amp; Settle Payment</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Reject Withdrawal Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-2">
                Provide a reason for rejecting the withdrawal of{" "}
                <span className="font-bold text-slate-900">
                  {formatINR(rejectModalRecord.amount)}
                </span>{" "}
                for{" "}
                <span className="font-bold text-slate-900">
                  {`${rejectModalRecord.partnerId?.firstName || ""} ${rejectModalRecord.partnerId?.lastName || ""}`.trim()}
                </span>
                .
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incorrect bank account details or pending document verification"
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalRecord(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === rejectModalRecord._id}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {busyId === rejectModalRecord._id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Confirm Reject</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
