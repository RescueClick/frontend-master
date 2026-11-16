import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  Download,
  Upload,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileText,
  Sparkles,
  RefreshCw,
  Phone,
  Filter,
  UserPlus,
  Send,
} from "lucide-react";
import { backendurl } from "../../feature/urldata";
import { getAuthData } from "../../utils/localStorage";
import { getLoanStatusLabel } from "../../utils/loanStatus";
import AppAntTable from "./AppAntTable";

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

async function readSheetFile(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let encoding = "utf-8";
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";
  return new TextDecoder(encoding).decode(buf);
}

export default function MetaLeadSheetPanel({ defaultOpen = false, embedded = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState("fresh"); // 'fresh' | 'noLoan' | 'partners' | 'loanFilled' | 'all'
  const [fileName, setFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // History & Trace Drawer State
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [tracePhone, setTracePhone] = useState("");
  const [traceResult, setTraceResult] = useState(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  // Assign to RM State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [rmsList, setRmsList] = useState([]);
  const [loadingRms, setLoadingRms] = useState(false);
  const [assignRmId, setAssignRmId] = useState("");
  const [assignLeadSlice, setAssignLeadSlice] = useState("fresh"); // 'fresh' | 'noLoan' | 'partners' | 'filtered'
  const [assignDailyTarget, setAssignDailyTarget] = useState(25);
  const [assignSheetName, setAssignSheetName] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState("");

  const getAdminToken = () => {
    const auth = getAuthData();
    return (
      auth.superAdminToken ||
      auth.adminToken ||
      auth.rsmToken ||
      auth.asmToken ||
      ""
    );
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = getAdminToken();
      const res = await axios.get(`${backendurl}/admin/meta-leads/history?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setHistoryList(res.data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch upload history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadPastAudit = async (auditId) => {
    setLoading(true);
    setError("");
    try {
      const token = getAdminToken();
      const res = await axios.get(`${backendurl}/admin/meta-leads/history/${auditId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.audit) {
        const audit = res.data.audit;
        setFileName(audit.fileName || "Historical Sheet");
        setResult({
          total: audit.stats?.total || audit.rows?.length || 0,
          existingPartners: audit.stats?.existingPartners || 0,
          existingCustomersLoanFilled: audit.stats?.existingCustomersLoanFilled || 0,
          existingCustomersNoLoan: audit.stats?.existingCustomersNoLoan || 0,
          freshLeads: audit.stats?.freshLeads || 0,
          filledCount: audit.stats?.existingCustomersLoanFilled || 0,
          notFilledCount: (audit.stats?.total || 0) - (audit.stats?.existingCustomersLoanFilled || 0),
          rows: audit.rows || [],
          auditId: audit._id,
        });
        setActiveFilter("fresh");
        setOpen(true);
        setShowHistory(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this audit record.");
    } finally {
      setLoading(false);
    }
  };

  const handleTracePhone = async (e) => {
    e.preventDefault();
    const clean = String(tracePhone).trim().replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoadingTrace(true);
    try {
      const token = getAdminToken();
      const res = await axios.get(`${backendurl}/admin/meta-leads/trace-phone?phone=${clean}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTraceResult(res.data);
    } catch (err) {
      console.error("Trace failed:", err);
      alert(err.response?.data?.message || "Failed to trace phone number");
    } finally {
      setLoadingTrace(false);
    }
  };

  const openAssignModal = async () => {
    setShowAssignModal(true);
    setAssignSuccessMsg("");
    setAssignSheetName(fileName ? `Calling Sheet - ${fileName.replace(/\.csv$/i, "")}` : "Meta Calling Sheet");
    if (rmsList.length === 0) {
      setLoadingRms(true);
      try {
        const token = getAdminToken();
        const res = await axios.get(`${backendurl}/calls/assignments/admin-overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && res.data.rms) {
          setRmsList(res.data.rms);
          if (res.data.rms.length > 0) setAssignRmId(res.data.rms[0].rmId);
        }
      } catch (err) {
        console.error("Failed to fetch RMs:", err);
      } finally {
        setLoadingRms(false);
      }
    }
  };

  const handleAssignToRm = async (e) => {
    e.preventDefault();
    if (!assignRmId) {
      alert("Please select an RM");
      return;
    }

    let contactsToAssign = [];
    let assignmentType = "CUSTOMER";

    if (assignLeadSlice === "fresh") {
      contactsToAssign = (result?.rows || []).filter((r) => r.systemStatus === "FRESH_LEAD");
    } else if (assignLeadSlice === "noLoan") {
      contactsToAssign = (result?.rows || []).filter((r) => r.systemStatus === "CUSTOMER_NO_LOAN");
    } else if (assignLeadSlice === "partners") {
      contactsToAssign = (result?.rows || []).filter((r) => r.systemStatus === "EXISTING_PARTNER");
      assignmentType = "PARTNER";
    } else {
      contactsToAssign = filteredRows;
    }

    if (!contactsToAssign.length) {
      alert("No contacts found in selected group to assign.");
      return;
    }

    setAssigning(true);
    try {
      const token = getAdminToken();
      const res = await axios.post(
        `${backendurl}/calls/assignments/create`,
        {
          rmId: assignRmId,
          assignmentType,
          sheetName: assignSheetName || "Meta Calling Sheet",
          dailyTarget: parseInt(assignDailyTarget, 10) || 25,
          contacts: contactsToAssign.map((r) => ({
            name: r.name,
            phone: r.phone,
            city: r.city,
            loanType: r.metaLoanType || r.loanInfo?.loanType,
            leadSource: fileName || "Meta Ads",
            partnerId: r.partnerInfo?.partnerId,
            customerId: r.customerInfo?.customerId,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setAssignSuccessMsg(`✅ ${res.data.message}! The sheet is now active in the RM App and Call Tracker.`);
        setTimeout(() => {
          setShowAssignModal(false);
          setAssignSuccessMsg("");
        }, 2200);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign leads to RM");
    } finally {
      setAssigning(false);
    }
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setError("");
    setLoading(true);
    try {
      const csvText = await readSheetFile(file);
      const token = getAdminToken();
      const res = await axios.post(
        `${backendurl}/admin/meta-leads/check`,
        { csvText, fileName: file.name, saveAudit: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setActiveFilter("fresh");
      setOpen(true);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Could not check this sheet. Ensure it is a valid CSV with phone numbers.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const rows = result?.rows || [];
    let list = rows;

    if (activeFilter === "fresh") {
      list = rows.filter((r) => r.systemStatus === "FRESH_LEAD");
    } else if (activeFilter === "noLoan") {
      list = rows.filter((r) => r.systemStatus === "CUSTOMER_NO_LOAN");
    } else if (activeFilter === "partners") {
      list = rows.filter((r) => r.systemStatus === "EXISTING_PARTNER");
    } else if (activeFilter === "loanFilled") {
      list = rows.filter((r) => r.systemStatus === "CUSTOMER_LOAN_FILLED");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.phone?.includes(q) ||
          r.city?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.partnerInfo?.employeeId?.toLowerCase().includes(q) ||
          r.loanInfo?.appNo?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [result, activeFilter, searchQuery]);

  // 1-Click Export Handlers
  const downloadFreshLeads = () => {
    const freshRows = (result?.rows || []).filter((r) => r.systemStatus === "FRESH_LEAD");
    if (!freshRows.length) {
      alert("No fresh leads found to export.");
      return;
    }
    downloadCsv(
      `fresh-leads-not-in-system-${stamp()}.csv`,
      ["Full Name", "Contact Number", "WhatsApp Format (+91)", "City", "Email", "Meta Loan Type", "Lead Date"],
      freshRows.map((r) => [
        r.name,
        r.phone,
        `+91${r.phone}`,
        r.city || "",
        r.email || "",
        r.metaLoanType || "",
        r.createdTime || "",
      ])
    );
  };

  const downloadPartners = () => {
    const partnerRows = (result?.rows || []).filter((r) => r.systemStatus === "EXISTING_PARTNER");
    if (!partnerRows.length) {
      alert("No existing partners found in this sheet.");
      return;
    }
    downloadCsv(
      `existing-partners-${stamp()}.csv`,
      ["Partner Name", "Contact Number", "Partner ID", "Assigned RM", "City", "Email"],
      partnerRows.map((r) => [
        r.partnerInfo?.partnerName || r.name,
        r.phone,
        r.partnerInfo?.employeeId || "—",
        r.partnerInfo?.rmName || "Unassigned",
        r.city || "",
        r.email || "",
      ])
    );
  };

  const downloadFullAuditedCsv = () => {
    const rows = result?.rows || [];
    if (!rows.length) return;

    // Collect all original Meta CSV headers
    const rawKeys = new Set();
    rows.forEach((r) => {
      Object.keys(r.rawMeta || {}).forEach((k) => rawKeys.add(k));
    });
    const originalHeaders = Array.from(rawKeys);

    const auditHeaders = [
      "DhanSource Status",
      "Normalized Phone (10 digits)",
      "WhatsApp Number (+91)",
      "Existing Partner Code",
      "Assigned RM",
      "Loan Application No",
      "Loan Status",
      ...originalHeaders,
    ];

    const exportRows = rows.map((r) => {
      const statusLabel =
        r.systemStatus === "FRESH_LEAD"
          ? "Fresh Lead (Not in System)"
          : r.systemStatus === "CUSTOMER_NO_LOAN"
          ? "Registered Customer (No Loan Form)"
          : r.systemStatus === "EXISTING_PARTNER"
          ? "Existing Partner"
          : "Customer with Active Loan";

      return [
        statusLabel,
        r.phone,
        `+91${r.phone}`,
        r.partnerInfo?.employeeId || "",
        r.partnerInfo?.rmName || "",
        r.loanInfo?.appNo || "",
        r.loanInfo?.status ? getLoanStatusLabel(r.loanInfo.status) : "",
        ...originalHeaders.map((h) => r.rawMeta?.[h] || ""),
      ];
    });

    downloadCsv(`dhansource-meta-leads-audited-${stamp()}.csv`, auditHeaders, exportRows);
  };

  const columns = [
    {
      title: "Lead Name",
      dataIndex: "name",
      key: "name",
      render: (text, row) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{text}</span>
          {row.city && <span className="block text-xs text-slate-500">{row.city}</span>}
        </div>
      ),
    },
    {
      title: "Phone Number",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-slate-700">
          <Phone size={13} className="text-slate-400" />
          <span>{phone}</span>
        </div>
      ),
    },
    {
      title: "DhanSource Status",
      key: "systemStatus",
      render: (_, row) => {
        if (row.systemStatus === "FRESH_LEAD") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles size={12} />
              Fresh Lead (Not in System)
            </span>
          );
        }
        if (row.systemStatus === "CUSTOMER_NO_LOAN") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              <AlertCircle size={12} />
              Registered (No Loan Form)
            </span>
          );
        }
        if (row.systemStatus === "EXISTING_PARTNER") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <UserCheck size={12} />
              Partner: {row.partnerInfo?.employeeId || "Existing"}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-300">
            <CheckCircle2 size={12} />
            Loan Filled ({row.loanInfo?.appNo || "Active"})
          </span>
        );
      },
    },
    {
      title: "Match Details",
      key: "matchDetails",
      render: (_, row) => {
        if (row.systemStatus === "EXISTING_PARTNER") {
          return (
            <div className="text-xs text-slate-600">
              <div className="font-medium text-slate-800">{row.partnerInfo?.partnerName}</div>
              <div className="text-slate-500">RM: {row.partnerInfo?.rmName || "Not assigned"}</div>
            </div>
          );
        }
        if (row.systemStatus === "CUSTOMER_LOAN_FILLED") {
          return (
            <div className="text-xs text-slate-600">
              <div className="font-semibold text-slate-900">{row.loanInfo?.loanType || "Loan"}</div>
              <div className="text-emerald-700 font-medium">
                {row.loanInfo?.status ? getLoanStatusLabel(row.loanInfo.status) : "Active"}
              </div>
            </div>
          );
        }
        if (row.systemStatus === "CUSTOMER_NO_LOAN") {
          return <span className="text-xs text-amber-700 italic">User registered, 0 forms filled</span>;
        }
        return <span className="text-xs text-blue-600 font-medium">Ready for telecalling</span>;
      },
    },
    {
      title: "Meta Campaign / Type",
      key: "metaDetails",
      render: (_, row) => (
        <div className="text-xs text-slate-500 max-w-[160px] truncate">
          <div>{row.metaLoanType || "—"}</div>
          {row.createdTime && <span className="text-[11px] text-slate-400">{row.createdTime}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all ${embedded ? "mb-6 p-5" : "p-6"}`}>
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Filter size={18} />
            </span>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Meta Ads & Bulk Leads Auditor
            </h2>
          </div>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            Upload any Meta/Facebook Ads or partner CSV. System automatically checks 10-digit phone numbers against database, categorizes fresh leads vs existing partners/customers, and maintains audit records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setShowHistory(true);
              fetchHistory();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <History size={16} className="text-slate-500" />
            Upload History & Trace
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl text-white cursor-pointer bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20">
            <Upload size={16} />
            {loading ? "Auditing Leads..." : "Upload Leads CSV"}
            <input
              type="file"
              accept=".csv,.txt,.tsv,text/csv,text/plain"
              className="hidden"
              disabled={loading}
              onChange={onFile}
            />
          </label>

          {result && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="px-3.5 py-2 text-xs md:text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
            >
              {open ? "Collapse View" : "Expand Results"}
            </button>
          )}
        </div>
      </div>

      {fileName && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <FileText size={14} className="text-blue-500" />
          <span>Active Sheet: <strong className="text-slate-700">{fileName}</strong></span>
          {result?.auditId && (
            <span className="ml-2 inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              Audit Saved in DB
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Results View */}
      {result && open && (
        <div className="mt-6 space-y-5 animate-in fade-in duration-200">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Fresh Leads</span>
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  ★
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-blue-900">{result.freshLeads || 0}</div>
              <div className="mt-1 text-[11px] text-blue-700 font-medium">Not in system (Call now)</div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Registered (No Loan)</span>
                <Clock size={16} className="text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-900">{result.existingCustomersNoLoan || 0}</div>
              <div className="mt-1 text-[11px] text-amber-700 font-medium">Signed up, 0 forms filled</div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Existing Partners</span>
                <UserCheck size={16} className="text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-900">{result.existingPartners || 0}</div>
              <div className="mt-1 text-[11px] text-emerald-700 font-medium">Already our DSA/Partner</div>
            </div>

            <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Loan Form Filled</span>
                <CheckCircle2 size={16} className="text-purple-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-purple-900">{result.existingCustomersLoanFilled || 0}</div>
              <div className="mt-1 text-[11px] text-purple-700 font-medium">Active application in DB</div>
            </div>

            <div className="col-span-2 md:col-span-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Leads</span>
                <FileText size={16} className="text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-800">{result.total || 0}</div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">Audited from CSV</div>
            </div>
          </div>

          {/* Action Row: Filter Pills + Search + 1-Click Downloads */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ["fresh", `Fresh Leads (${result.freshLeads || 0})`, "bg-blue-600 text-white border-blue-600"],
                ["noLoan", `Registered No Loan (${result.existingCustomersNoLoan || 0})`, "bg-amber-600 text-white border-amber-600"],
                ["partners", `Existing Partners (${result.existingPartners || 0})`, "bg-emerald-600 text-white border-emerald-600"],
                ["loanFilled", `Loan Filled (${result.existingCustomersLoanFilled || 0})`, "bg-purple-600 text-white border-purple-600"],
                ["all", `All (${result.total || 0})`, "bg-slate-800 text-white border-slate-800"],
              ].map(([key, label, activeClass]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                    activeFilter === key
                      ? `${activeClass} shadow-sm`
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, phone, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 md:w-56"
                />
              </div>

              {/* Download Buttons */}
              <button
                type="button"
                onClick={downloadFreshLeads}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
                title="Download leads that are not in system with +91 WhatsApp format"
              >
                <Download size={13} />
                Fresh Leads CSV
              </button>

              <button
                type="button"
                onClick={downloadPartners}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
                title="Download existing partners found in this sheet"
              >
                <Download size={13} />
                Partners CSV
              </button>

              <button
                type="button"
                onClick={openAssignModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
                title="Assign leads to an RM with a daily calling target"
              >
                <UserPlus size={13} />
                Assign to RM Sheet
              </button>

              <button
                type="button"
                onClick={downloadFullAuditedCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                title="Download full audited sheet with original Meta campaign columns + DhanSource audit columns"
              >
                <Download size={13} />
                Full Audited CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <AppAntTable
              rowKey={(row) => `${row.phone}-${row.createdTime || ""}`}
              columns={columns}
              dataSource={filteredRows}
              size="small"
              pagination={{ pageSize: 12, showSizeChanger: true }}
              locale={{ emptyText: "No leads found in this filter" }}
            />
          </div>
        </div>
      )}

      {/* Upload History & Phone Trace Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800 text-base">Meta Leads Upload History & Phone Trace</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Phone Trace Search Box */}
            <div className="p-5 border-b border-slate-100 bg-blue-50/40">
              <form onSubmit={handleTracePhone} className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    🔍 Trace Any Phone Number Across Historical Uploads:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 10-digit mobile number (e.g. 9876543210)..."
                    value={tracePhone}
                    onChange={(e) => setTracePhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingTrace}
                  className="mt-5 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-60"
                >
                  {loadingTrace ? "Tracing..." : "Trace Lead"}
                </button>
              </form>

              {traceResult && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-blue-200 text-xs">
                  {traceResult.count > 0 ? (
                    <div>
                      <span className="font-bold text-emerald-700">
                        ✅ Number found in {traceResult.count} historical upload(s):
                      </span>
                      <ul className="mt-1 space-y-1">
                        {traceResult.traces.map((t, idx) => (
                          <li key={idx} className="text-slate-600">
                            • Sheet <strong>{t.fileName}</strong> uploaded on {new Date(t.uploadedAt).toLocaleDateString()} by {t.uploadedByName} — Status: <strong className="text-slate-800">{t.leadRecord?.systemStatus}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-slate-500 font-medium">
                      ℹ️ This phone number has never been uploaded in any Meta sheet before.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Historical Uploads Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Past Uploaded Sheets:</h4>
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <RefreshCw size={12} className={loadingHistory ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading history...</div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No past uploads recorded yet.</div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">File Name</th>
                        <th className="p-3">Uploaded By</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Fresh Leads</th>
                        <th className="p-3">Partners</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyList.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">{item.fileName}</td>
                          <td className="p-3">{item.uploadedByName}</td>
                          <td className="p-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 font-bold text-slate-800">{item.stats?.total || 0}</td>
                          <td className="p-3 font-bold text-blue-700">{item.stats?.freshLeads || 0}</td>
                          <td className="p-3 font-bold text-emerald-700">{item.stats?.existingPartners || 0}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => loadPastAudit(item._id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            >
                              Load Results
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Assign Leads to RM Calling Sheet Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="text-purple-600" size={20} />
                <h3 className="font-bold text-slate-900 text-base">Assign Calling Sheet to RM</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignToRm} className="p-6 space-y-4">
              {assignSuccessMsg ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold text-center">
                  {assignSuccessMsg}
                </div>
              ) : (
                <>
                  {/* Select RM */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Select Relationship Manager (RM):
                    </label>
                    {loadingRms ? (
                      <div className="text-xs text-slate-400">Loading RMs...</div>
                    ) : (
                      <select
                        value={assignRmId}
                        onChange={(e) => setAssignRmId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        required
                      >
                        {rmsList.map((rm) => {
                          const deskLabel =
                            rm.rmType === "CUSTOMER"
                              ? "📞 [Customer RM - Inbound Leads]"
                              : rm.rmType === "PARTNER"
                              ? "🤝 [Partner RM - Channel/DSA]"
                              : "🔄 [Hybrid RM]";
                          const branch = rm.branchName ? ` • ${rm.branchName}` : "";
                          return (
                            <option key={rm.rmId} value={rm.rmId}>
                              {deskLabel} {rm.rmName} ({rm.employeeId || rm.phone}){branch}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {/* Which Group of Leads */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Which Contacts to Assign:
                    </label>
                    <select
                      value={assignLeadSlice}
                      onChange={(e) => setAssignLeadSlice(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                    >
                      <option value="fresh">
                        🔵 Fresh Leads Only ({result?.freshLeads || 0} leads - Recommended)
                      </option>
                      <option value="noLoan">
                        🟠 Registered Customers (No Loan) ({result?.existingCustomersNoLoan || 0} leads)
                      </option>
                      <option value="partners">
                        🟢 Existing Partners ({result?.existingPartners || 0} partners)
                      </option>
                      <option value="filtered">
                        All Filtered Leads in Current View ({filteredRows.length} contacts)
                      </option>
                    </select>
                  </div>

                  {/* Daily Target */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Daily Call Target:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={assignDailyTarget}
                        onChange={(e) => setAssignDailyTarget(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Sheet Name:
                      </label>
                      <input
                        type="text"
                        value={assignSheetName}
                        onChange={(e) => setAssignSheetName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigning}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition shadow-md shadow-purple-500/20 flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Send size={13} />
                      {assigning ? "Assigning..." : "Assign Sheet to RM"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
