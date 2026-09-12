import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  IndianRupee,
  Building2,
  Copy,
  Check,
  Download,
  RotateCw,
  Eye,
  Calculator,
  User,
  CreditCard,
  X,
  ShieldCheck,
  Percent,
  Clock,
  AlertCircle,
  FileText,
  Mail,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

import {
  fetchAdminCustomersPayOutPending,
  setAdminPayouts,
} from "../../../feature/thunks/adminThunks";

import { matchesSearchTerm } from "../../../utils/tableFilter";
import { loanTypeToTableShort, payoutLoanTypePillClass } from "../../../utils/loanTypeShort";
import { matchesMonthYear } from "../../../utils/dateFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import AppAntTable from "../../../components/shared/AppAntTable";
import PayoutStatusBadge from "../../../components/shared/PayoutStatusBadge";
import PartnerInvoiceModal from "../../../components/shared/PartnerInvoiceModal";

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

const AdminPendingPayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [year, setYear] = useState(
    location.state?.year || "all"
  );
  const [month, setMonth] = useState(
    location.state?.month || "all"
  );

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalRecord, setInvoiceModalRecord] = useState(null);
  const [isSendingInvoiceId, setIsSendingInvoiceId] = useState(null);

  const [modalForm, setModalForm] = useState({
    applicationId: "",
    partnerId: "",
    approvalAmount: 0,
    payoutPercentage: "2",
    grossAmount: "",
    tdsApplicable: true,
    tdsSection: "194T",
    tdsPercentage: "10",
    tdsAmount: "0",
    netAmount: "",
    payoutAmount: "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    sendInvoiceEmail: true,
    invoiceNotes: "Tax deducted under Section 194T of the Income Tax Act, 1961.",
    payOutStatus: "DONE",
    note: "",
  });

  const { data: pendingData = [], loading } = useSelector(
    (state) => state.admin?.pendingPayout || { data: [] }
  );

  useEffect(() => {
    dispatch(fetchAdminCustomersPayOutPending());
  }, [dispatch]);

  const rawRows = useMemo(
    () => (Array.isArray(pendingData) ? pendingData : []),
    [pendingData]
  );

  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      if (loanTypeFilter !== "all" && row.loanType !== loanTypeFilter)
        return false;

      if (year !== "all" || month !== "all") {
        if (
          !matchesMonthYear(row, {
            year,
            month,
            dateKeys: ["disbursedAt", "createdAt", "applicationDate"],
          })
        ) {
          return false;
        }
      }

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
        partnerObj.panNumber,
        row.partnerPan,
      ];

      return matchesSearchTerm(searchTerm, searchFields);
    });
  }, [rawRows, loanTypeFilter, year, month, searchTerm]);

  const sortedRows = useMemo(() => {
    return sortNewestFirst(filteredRows, {
      dateKeys: ["disbursedAt", "createdAt", "updatedAt"],
    });
  }, [filteredRows]);

  const handleCopy = (text, key) => {
    if (!text || text === "—") return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedKey(key);
    toast.success(`Copied: ${text}`, { duration: 1500 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendDirectEmail = async (record) => {
    const payoutId = record?.payoutId || record?.payout?._id || record?._id;
    if (!payoutId) {
      toast.error("Payout ID not found for this record.");
      return;
    }
    const email = record.partner?.email || record.partnerEmail;
    if (!email) {
      toast.error("Partner does not have an email registered.");
      return;
    }

    try {
      setIsSendingInvoiceId(payoutId);
      const { adminToken } = getAuthData();
      const res = await axios.post(
        `${backendurl}/admin/payouts/${payoutId}/send-invoice`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(res?.data?.message || `Tax invoice email sent to ${email}`);
      dispatch(fetchAdminCustomersPayOutPending());
    } catch (err) {
      console.error("Error sending invoice email:", err);
      toast.error(err?.response?.data?.message || "Failed to send invoice email");
    } finally {
      setIsSendingInvoiceId(null);
    }
  };

  const handleOpenModal = (record) => {
    setSelectedRecord(record);

    const appr = Number(record.approvedAmount || record.requestedAmount || 0);
    const existingPayoutAmt = Number(record.payoutAmount || 0);

    let initialPct = "2";
    let initialGross = "";

    if (record.grossAmount != null && Number(record.grossAmount) > 0) {
      initialGross = String(record.grossAmount);
      if (record.payoutPercentage) {
        initialPct = String(record.payoutPercentage);
      } else if (appr > 0) {
        initialPct = String(Number(((Number(record.grossAmount) / appr) * 100).toFixed(2)));
      }
    } else if (record.payoutPercentage) {
      initialPct = String(record.payoutPercentage);
      initialGross = String(existingPayoutAmt || (appr * record.payoutPercentage) / 100);
    } else if (existingPayoutAmt > 0 && appr > 0) {
      initialGross = String(existingPayoutAmt);
      initialPct = String(Number(((existingPayoutAmt / appr) * 100).toFixed(2)));
    } else {
      initialGross = String((appr * 2) / 100);
      initialPct = "2";
    }

    const isTds = record.tdsApplicable !== undefined ? Boolean(record.tdsApplicable) : true;
    const tdsSec = record.tdsSection || "194T";
    const tdsPct = record.tdsPercentage != null ? Number(record.tdsPercentage) : 10;

    const grossNum = Number(initialGross) || 0;
    const tdsAmt = isTds ? Number(((grossNum * tdsPct) / 100).toFixed(2)) : 0;
    const netAmt = isTds ? Number(Math.max(0, grossNum - tdsAmt).toFixed(2)) : grossNum;

    const appNo =
      record.appNo ||
      (record.applicationId
        ? `TLF${String(record.applicationId).slice(-4).toUpperCase()}`
        : "APP");

    const defaultInvNo =
      record.invoiceNumber ||
      `INV-PO-${new Date().getFullYear()}-${appNo}-${String(
        record.payoutId || record._id || Math.floor(1000 + Math.random() * 9000)
      ).slice(-4).toUpperCase()}`;

    setModalForm({
      applicationId: String(record.applicationId || record._id || ""),
      partnerId: String(record.partnerId || record.partner?.partnerId || ""),
      approvalAmount: appr,
      payoutPercentage: initialPct,
      grossAmount: initialGross ? String(Number(initialGross).toFixed(2)) : "",
      tdsApplicable: isTds,
      tdsSection: tdsSec,
      tdsPercentage: String(tdsPct),
      tdsAmount: String(tdsAmt),
      netAmount: String(netAmt),
      payoutAmount: String(netAmt),
      invoiceNumber: defaultInvNo,
      invoiceDate: record.invoiceDate
        ? new Date(record.invoiceDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      sendInvoiceEmail: true,
      invoiceNotes:
        record.invoiceNotes ||
        "Tax deducted under Section 194T of the Income Tax Act, 1961.",
      payOutStatus: "DONE",
      note: record.payoutNote || "",
    });

    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  const updateFinancials = (overrides = {}) => {
    setModalForm((prev) => {
      const merged = { ...prev, ...overrides };
      const appr = Number(merged.approvalAmount || 0);

      let gross = Number(merged.grossAmount) || 0;
      let pct = merged.payoutPercentage;

      if (overrides.payoutPercentage !== undefined) {
        const p = Number(overrides.payoutPercentage);
        if (!isNaN(p) && appr > 0) {
          gross = Number(((appr * p) / 100).toFixed(2));
        }
      } else if (overrides.grossAmount !== undefined) {
        gross = Number(overrides.grossAmount) || 0;
        if (appr > 0) {
          pct = Number(((gross / appr) * 100).toFixed(2));
        }
      }

      const isTds = merged.tdsApplicable !== false;
      const rate = Number(merged.tdsPercentage) || 0;
      const tdsAmt = isTds ? Number(((gross * rate) / 100).toFixed(2)) : 0;
      const netAmt = isTds ? Number(Math.max(0, gross - tdsAmt).toFixed(2)) : gross;

      return {
        ...merged,
        payoutPercentage: pct !== undefined ? String(pct) : prev.payoutPercentage,
        grossAmount: String(gross),
        tdsAmount: String(tdsAmt),
        netAmount: String(netAmt),
        payoutAmount: String(netAmt),
      };
    });
  };

  const handlePercentageChange = (pctValue) => {
    updateFinancials({ payoutPercentage: pctValue });
  };

  const handleAmountChange = (amtValue) => {
    updateFinancials({ grossAmount: amtValue });
  };

  const handlePresetPercentage = (pct) => {
    handlePercentageChange(String(pct));
  };

  const handleSubmitPayout = async (e) => {
    e?.preventDefault();
    if (!modalForm.applicationId) return;

    try {
      setIsSaving(true);
      await dispatch(
        setAdminPayouts({
          applicationId: modalForm.applicationId,
          partnerId: modalForm.partnerId || undefined,
          payoutAmount: modalForm.payoutAmount ? Number(modalForm.payoutAmount) : undefined,
          grossAmount: modalForm.grossAmount ? Number(modalForm.grossAmount) : undefined,
          payoutPercentage: modalForm.payoutPercentage ? Number(modalForm.payoutPercentage) : undefined,
          tdsApplicable: modalForm.tdsApplicable,
          tdsSection: modalForm.tdsSection,
          tdsPercentage: modalForm.tdsPercentage ? Number(modalForm.tdsPercentage) : 10,
          tdsAmount: modalForm.tdsAmount ? Number(modalForm.tdsAmount) : 0,
          netAmount: modalForm.netAmount ? Number(modalForm.netAmount) : Number(modalForm.payoutAmount || 0),
          invoiceNumber: modalForm.invoiceNumber,
          invoiceDate: modalForm.invoiceDate,
          invoiceNotes: modalForm.invoiceNotes,
          sendInvoiceEmail: modalForm.sendInvoiceEmail,
          payOutStatus: modalForm.payOutStatus,
          note: modalForm.note || "",
        })
      ).unwrap();

      toast.success(
        modalForm.payOutStatus === "DONE"
          ? (modalForm.sendInvoiceEmail
              ? "Payout settled! Section 194T tax invoice & statement emailed to partner."
              : "Payout marked as DONE!")
          : "Payout processed successfully!"
      );
      handleCloseModal();
      dispatch(fetchAdminCustomersPayOutPending());
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "Failed to update payout");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportXlsx = () => {
    if (!sortedRows.length) {
      toast.error("No pending payout records to export");
      return;
    }

    const exportRows = sortedRows.map((r, i) => ({
      "S.No": i + 1,
      "App No": r.appNo || (r.applicationId ? `APP-${r.applicationId.slice(-6).toUpperCase()}` : "—"),
      "Disbursal Date": r.disbursedAt
        ? new Date(r.disbursedAt).toLocaleDateString("en-IN")
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
      Status: r.payOutStatus || "PENDING",
    }));

    downloadXlsx(exportRows, "Pending-Payouts.xlsx", "Pending Payouts");
    toast.success("Pending payouts exported to Excel!");
  };

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
        width: 260,
        render: (_, r) => {
          const partnerName = r.partner?.name || r.partnerName || "Partner";
          const partnerEmpId = r.partner?.employeeId || r.partnerEmployeeId;
          const partnerPhone = r.partner?.phone || r.partnerPhone;
          const partnerPan = r.partner?.panNumber || r.partnerPan;

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
                  {partnerEmpId && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                      {partnerEmpId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  {partnerPhone && <span>{partnerPhone}</span>}
                  {partnerPan && (
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                      PAN: {partnerPan}
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
        title: "Payout & Tax Details",
        key: "payout",
        width: 190,
        render: (_, r) => {
          const gross = Number(r.grossAmount || r.payoutAmount || 0);
          const isTds = r.tdsApplicable !== false;
          const sec = r.tdsSection || "194T";
          const rate = r.tdsPercentage != null ? r.tdsPercentage : 10;
          const tdsAmt = Number(r.tdsAmount || (isTds ? (gross * rate) / 100 : 0));
          const net = Number(r.netAmount != null ? r.netAmount : Math.max(0, gross - tdsAmt));

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-amber-600">
                  {formatInrPrecise(net || gross)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Net
                </span>
              </div>

              {isTds && tdsAmt > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-red-50 text-red-700 rounded border border-red-200">
                    -{formatInrPrecise(tdsAmt)} ({rate}% u/s {sec})
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Gross: {formatInr(gross)}</span>
                {r.payoutPercentage ? (
                  <span className="text-slate-400 font-mono">
                    ({r.payoutPercentage}%)
                  </span>
                ) : null}
              </div>

              {r.invoiceSentAt ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Invoice Emailed</span>
                </span>
              ) : null}
            </div>
          );
        },
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
        title: "Action & Invoice",
        key: "actions",
        width: 210,
        fixed: "right",
        render: (_, r) => {
          const isDone = r.payOutStatus === "DONE";
          const payoutId = r.payoutId || r._id;
          const isSending = isSendingInvoiceId === payoutId;

          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenModal(r)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-primary hover:bg-[#0f9b82] text-white shadow-sm flex items-center gap-1 transition"
                title="Process Payout"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Pay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInvoiceModalRecord(r);
                  setInvoiceModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition flex items-center gap-1 shadow-sm"
                title="Build & View Tax Invoice (Section 194T)"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Invoice</span>
              </button>

              {isDone && (
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendDirectEmail(r)}
                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition disabled:opacity-50"
                  title="Share Tax Invoice Email to Partner"
                >
                  {isSending ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const modalBank = useMemo(() => {
    if (!selectedRecord) return {};
    const p = selectedRecord.partner || {};
    return {
      partnerName: p.name || selectedRecord.partnerName || "Partner",
      partnerEmployeeId: p.employeeId || selectedRecord.partnerEmployeeId || "",
      partnerPhone: p.phone || selectedRecord.partnerPhone || "—",
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
        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/payout")}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                  title="Back to Payout Hub"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Pending Payouts</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold font-mono">
                      {filteredRows.length} Files
                    </span>
                  </h1>
                </div>
              </div>

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

                <select
                  value={year}
                  onChange={(e) => {
                    const v = e.target.value;
                    setYear(v === "all" ? "all" : parseInt(v, 10));
                  }}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
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
                    const v = e.target.value;
                    setMonth(v === "all" ? "all" : parseInt(v, 10));
                  }}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
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
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                >
                  <option value="all">All Loans</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="BUSINESS">Business</option>
                  <option value="HOME_LOAN_SALARIED">Home (Sal)</option>
                  <option value="HOME_LOAN_SELF_EMPLOYED">Home (Self)</option>
                  <option value="LAP_SALARIED">LAP (Sal)</option>
                  <option value="LAP_SELF_EMPLOYED">LAP (Self)</option>
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
                  onClick={() => dispatch(fetchAdminCustomersPayOutPending())}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-primary" : ""}`} />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Partner Name, Customer, Phone, App ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <AppAntTable
            rowKey={(r) =>
              `${r.applicationId ?? ""}-${r.customerId ?? ""}-${r.customerEmployeeId ?? ""}`
            }
            columns={columns}
            dataSource={sortedRows}
            loading={loading}
            size="middle"
          />
        </div>
      </div>

      {/* 2-Column NO-SCROLL Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all max-h-[92vh]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Process Partner Payout</span>
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

            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
              {/* LEFT COLUMN: Beneficiary & Loan Info */}
              <div className="md:col-span-5 flex flex-col gap-3">
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

              {/* RIGHT COLUMN: Calculation, Section 194T TDS & Invoice */}
              <div className="md:col-span-7 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      <span>Commission &amp; Section 194T TDS Plan</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceModalRecord({
                          ...selectedRecord,
                          ...modalForm,
                          grossAmount: modalForm.grossAmount,
                          tdsAmount: modalForm.tdsAmount,
                          netAmount: modalForm.netAmount,
                          payoutAmount: modalForm.netAmount,
                        });
                        setInvoiceModalOpen(true);
                      }}
                      className="px-2 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1 transition"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Preview Invoice</span>
                    </button>
                  </div>

                  {/* 1. COMMISSION INPUTS */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                          placeholder="e.g. 2"
                          className="w-full pl-3 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>

                      <div className="flex items-center gap-1 mt-1">
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gross Commission (₹)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={modalForm.grossAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="e.g. 6000"
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Base commission before tax
                      </span>
                    </div>
                  </div>

                  {/* 2. SECTION 194T TDS CONFIG CARD */}
                  <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalForm.tdsApplicable}
                          onChange={(e) =>
                            updateFinancials({ tdsApplicable: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-teal-600 rounded border-teal-300 focus:ring-teal-500"
                        />
                        <span className="text-xs font-bold text-teal-950 flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-teal-700" />
                          <span>Deduct TDS (Income Tax Act)</span>
                        </span>
                      </label>

                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-200/60 text-teal-900 border border-teal-300">
                        {modalForm.tdsApplicable ? `Sec ${modalForm.tdsSection} Active` : "TDS Exempt"}
                      </span>
                    </div>

                    {modalForm.tdsApplicable && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-200/60">
                        <div>
                          <label className="block text-[11px] font-bold text-teal-800 mb-1">
                            TDS Section
                          </label>
                          <select
                            value={modalForm.tdsSection}
                            onChange={(e) => {
                              const sec = e.target.value;
                              let rate = modalForm.tdsPercentage;
                              if (sec === "194T") rate = "10";
                              else if (sec === "194H") rate = "5";
                              updateFinancials({ tdsSection: sec, tdsPercentage: rate });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="194T">Sec 194T (Partner Payment - 10%)</option>
                            <option value="194H">Sec 194H (Commission - 5%)</option>
                            <option value="CUSTOM">Custom Section / Rate</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-teal-800 mb-1">
                            TDS Rate (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={modalForm.tdsPercentage}
                              onChange={(e) =>
                                updateFinancials({ tdsPercentage: e.target.value })
                              }
                              className="w-full pl-3 pr-7 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. 3-WAY FINANCIAL SUMMARY BANNER */}
                  <div className="p-3 bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-xl shadow-sm">
                    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/10">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Gross Commission
                        </span>
                        <div className="text-sm font-bold text-white mt-0.5 font-mono">
                          {formatInr(modalForm.grossAmount)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-rose-300 uppercase block font-semibold">
                          TDS u/s {modalForm.tdsSection} ({modalForm.tdsPercentage}%)
                        </span>
                        <div className="text-sm font-bold text-rose-300 mt-0.5 font-mono">
                          {modalForm.tdsApplicable && Number(modalForm.tdsAmount) > 0
                            ? `-${formatInr(modalForm.tdsAmount)}`
                            : "₹0.00"}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-emerald-300 uppercase block font-bold">
                          Net Credited
                        </span>
                        <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">
                          {formatInrPrecise(modalForm.netAmount || modalForm.grossAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. INVOICE & PAYMENT DETAILS */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Invoice Reference #
                      </label>
                      <input
                        type="text"
                        value={modalForm.invoiceNumber}
                        onChange={(e) =>
                          setModalForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                        }
                        placeholder="e.g. INV-PO-2026-..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Invoice / Disbursal Date
                      </label>
                      <input
                        type="date"
                        value={modalForm.invoiceDate}
                        onChange={(e) =>
                          setModalForm((prev) => ({ ...prev, invoiceDate: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  </div>

                  {/* Payment Reference / UTR */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bank Reference / UTR / Transaction Note
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

                  {/* Status & Email Dispatch Toggle */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        <option value="DONE">DONE (Disbursed &amp; Settled)</option>
                        <option value="PENDING">PENDING (Keep Pending)</option>
                        <option value="REJECTED">REJECTED (Decline Payout)</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalForm.sendInvoiceEmail}
                          onChange={(e) =>
                            setModalForm((prev) => ({
                              ...prev,
                              sendInvoiceEmail: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary"
                        />
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>Email Invoice to Partner</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
                        <span>Confirm &amp; Settle Payout</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARTNER TAX INVOICE BUILDER & PREVIEW MODAL */}
      <PartnerInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setInvoiceModalRecord(null);
        }}
        record={invoiceModalRecord}
        onEmailSent={() => {
          dispatch(fetchAdminCustomersPayOutPending());
        }}
      />
    </div>
  );
};

export default AdminPendingPayout;
