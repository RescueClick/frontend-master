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
  Users,
  CheckSquare,
  Square,
  Zap,
  Trash2,
  X,
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
  const [deletingAuditId, setDeletingAuditId] = useState(null);

  // Assign to RM State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [rmsList, setRmsList] = useState([]);
  const [loadingRms, setLoadingRms] = useState(false);
  const [assignMode, setAssignMode] = useState("split"); // 'split' (Multi-RM) | 'single'
  const [assignRmId, setAssignRmId] = useState("");
  const [selectedRmIds, setSelectedRmIds] = useState(new Set());
  const [rmAllocations, setRmAllocations] = useState({});
  const [assignLeadSlice, setAssignLeadSlice] = useState("fresh"); // 'fresh' | 'noLoan' | 'partners' | 'filtered'
  const [assignDailyTarget, setAssignDailyTarget] = useState(25);
  const [assignSheetName, setAssignSheetName] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState("");
  const [modalDeskFilter, setModalDeskFilter] = useState("ALL"); // 'ALL' | 'CUSTOMER' | 'PARTNER'

  const getAdminToken = () => {
    const auth = getAuthData();
    const pathname = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
    if (pathname.startsWith("/rsm")) {
      return auth.rsmToken || auth.rawRsmToken || auth.adminToken || auth.superAdminToken || "";
    }
    if (pathname.startsWith("/asm")) {
      return auth.asmToken || auth.rawAsmToken || auth.adminToken || auth.superAdminToken || "";
    }
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

  const getSmartInitialFilter = (data) => {
    if (!data) return "fresh";
    if ((data.freshLeads || 0) > 0) return "fresh";
    if ((data.existingPartners || 0) > 0) return "partners";
    if ((data.existingCustomersNoLoan || 0) > 0) return "noLoan";
    if ((data.existingCustomersLoanFilled || 0) > 0) return "loanFilled";
    return "all";
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
        const auditResult = {
          total: audit.stats?.total || audit.rows?.length || 0,
          existingPartners: audit.stats?.existingPartners || 0,
          existingCustomersLoanFilled: audit.stats?.existingCustomersLoanFilled || 0,
          existingCustomersNoLoan: audit.stats?.existingCustomersNoLoan || 0,
          freshLeads: audit.stats?.freshLeads || 0,
          filledCount: audit.stats?.existingCustomersLoanFilled || 0,
          notFilledCount: (audit.stats?.total || 0) - (audit.stats?.existingCustomersLoanFilled || 0),
          rows: audit.rows || [],
          auditId: audit._id,
        };
        setResult(auditResult);
        setActiveFilter(getSmartInitialFilter(auditResult));
        setOpen(true);
        setShowHistory(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this audit record.");
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (auditId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete uploaded sheet "${fileName}"? This will permanently remove the audit record and DELETE this sheet across ALL RMs everywhere.`)) {
      return;
    }
    setDeletingAuditId(auditId);
    try {
      const token = getAdminToken();
      const res = await axios.delete(`${backendurl}/admin/meta-leads/history/${auditId}?deleteAssignments=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setHistoryList((prev) => prev.filter((item) => item._id !== auditId));
        if (result?.auditId === auditId) {
          setResult(null);
          setFileName("");
          setOpen(false);
        }
      }
    } catch (err) {
      console.error("Failed to delete sheet history:", err);
      alert(err.response?.data?.message || "Failed to delete sheet history.");
    } finally {
      setDeletingAuditId(null);
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

  const availablePool = useMemo(() => {
    if (assignLeadSlice === "fresh") {
      return (result?.rows || []).filter((r) => r.systemStatus === "FRESH_LEAD");
    } else if (assignLeadSlice === "noLoan") {
      return (result?.rows || []).filter((r) => r.systemStatus === "CUSTOMER_NO_LOAN");
    } else if (assignLeadSlice === "partners") {
      return (result?.rows || []).filter((r) => r.systemStatus === "EXISTING_PARTNER");
    }
    return filteredRows || [];
  }, [assignLeadSlice, result?.rows, filteredRows]);

  const totalAllocated = useMemo(() => {
    let sum = 0;
    for (const id of selectedRmIds) {
      sum += parseInt(rmAllocations[id] || 0, 10);
    }
    return sum;
  }, [rmAllocations, selectedRmIds]);

  const remainingLeads = availablePool.length - totalAllocated;

  const handleDistributeEqually = () => {
    const selected = Array.from(selectedRmIds);
    if (!selected.length) return;
    const total = availablePool.length;
    const perRm = Math.floor(total / selected.length);
    const rem = total % selected.length;
    const nextAlloc = { ...rmAllocations };
    selected.forEach((id, idx) => {
      nextAlloc[id] = perRm + (idx < rem ? 1 : 0);
    });
    setRmAllocations(nextAlloc);
  };

  const toggleRmSelect = (rmId) => {
    setSelectedRmIds((prev) => {
      const next = new Set(prev);
      if (next.has(rmId)) {
        next.delete(rmId);
      } else {
        next.add(rmId);
      }
      return next;
    });
  };

  const handleAllocationChange = (rmId, count) => {
    const val = Math.max(0, parseInt(count, 10) || 0);
    setRmAllocations((prev) => ({ ...prev, [rmId]: val }));
    if (!selectedRmIds.has(rmId) && val > 0) {
      setSelectedRmIds((prev) => new Set(prev).add(rmId));
    }
  };

  const openAssignModal = async () => {
    setShowAssignModal(true);
    setAssignSuccessMsg("");
    setAssignSheetName(fileName ? `Calling Sheet - ${fileName.replace(/\.csv$/i, "")}` : "Meta Calling Sheet");

    let initialSlice = "fresh";
    if (activeFilter === "partners" || ((result?.freshLeads || 0) === 0 && (result?.existingPartners || 0) > 0)) {
      initialSlice = "partners";
    } else if (activeFilter === "noLoan" || ((result?.freshLeads || 0) === 0 && (result?.existingCustomersNoLoan || 0) > 0)) {
      initialSlice = "noLoan";
    } else {
      initialSlice = "fresh";
    }
    setAssignLeadSlice(initialSlice);

    setLoadingRms(true);
    try {
      const token = getAdminToken();
      const res = await axios.get(`${backendurl}/calls/assignments/admin-overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.rms) {
        setRmsList(res.data.rms);
        if (res.data.rms.length > 0) {
          const hasCustomerRms = res.data.rms.some((r) => r.rmType === "CUSTOMER");
          const defaultDesk =
            initialSlice === "partners"
              ? "PARTNER"
              : hasCustomerRms && (initialSlice === "fresh" || initialSlice === "noLoan")
              ? "CUSTOMER"
              : "ALL";
          setModalDeskFilter(defaultDesk);

          const filteredRms =
            defaultDesk === "ALL"
              ? res.data.rms
              : res.data.rms.filter((r) => r.rmType === defaultDesk || r.rmType === "HYBRID");
          const activePool = filteredRms.length > 0 ? filteredRms : res.data.rms;

          setAssignRmId(activePool[0].rmId);
          const initialSet = new Set(activePool.map((r) => r.rmId));
          setSelectedRmIds(initialSet);

          const total = availablePool.length;
          const perRm = Math.floor(total / activePool.length);
          const rem = total % activePool.length;
          const initialAlloc = {};
          activePool.forEach((rm, idx) => {
            initialAlloc[rm.rmId] = perRm + (idx < rem ? 1 : 0);
          });
          setRmAllocations(initialAlloc);
        }
      }
    } catch (err) {
      console.error("Failed to fetch RMs:", err);
    } finally {
      setLoadingRms(false);
    }
  };

  const handleFilterDesk = (desk) => {
    setModalDeskFilter(desk);
    const targetRms =
      desk === "ALL"
        ? rmsList
        : rmsList.filter((r) => r.rmType === desk || r.rmType === "HYBRID");
    const active = targetRms.length > 0 ? targetRms : rmsList;
    const newSelected = new Set(active.map((r) => r.rmId));
    setSelectedRmIds(newSelected);

    const total = availablePool.length;
    const perRm = Math.floor(total / active.length);
    const rem = total % active.length;
    const nextAlloc = {};
    active.forEach((rm, idx) => {
      nextAlloc[rm.rmId] = perRm + (idx < rem ? 1 : 0);
    });
    setRmAllocations(nextAlloc);
  };

  // Rebalance equal split whenever slice changes while modal is open
  useEffect(() => {
    if (showAssignModal && rmsList.length > 0 && selectedRmIds.size > 0) {
      const selected = Array.from(selectedRmIds);
      const total = availablePool.length;
      const perRm = Math.floor(total / selected.length);
      const rem = total % selected.length;
      const nextAlloc = {};
      selected.forEach((id, idx) => {
        nextAlloc[id] = perRm + (idx < rem ? 1 : 0);
      });
      setRmAllocations(nextAlloc);
    }
  }, [assignLeadSlice, availablePool.length]);

  const handleAssignToRm = async (e) => {
    e.preventDefault();

    if (assignMode === "single") {
      if (!assignRmId) {
        alert("Please select an RM");
        return;
      }

      const contactsToAssign = availablePool;
      if (!contactsToAssign.length) {
        alert("No contacts found in selected group to assign.");
        return;
      }

      const assignmentType = assignLeadSlice === "partners" ? "PARTNER" : "CUSTOMER";
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
    } else {
      // Multi-RM Batch Split Mode
      const selected = Array.from(selectedRmIds);
      if (!selected.length) {
        alert("Please select at least one RM from the list.");
        return;
      }

      if (totalAllocated <= 0) {
        alert("Please allocate at least 1 lead to an RM.");
        return;
      }

      if (totalAllocated > availablePool.length) {
        alert(`Cannot allocate ${totalAllocated} leads. Only ${availablePool.length} leads are available in this group.`);
        return;
      }

      let offset = 0;
      const allocationsPayload = [];
      for (const rmId of selected) {
        const count = parseInt(rmAllocations[rmId] || 0, 10);
        if (count <= 0) continue;
        const slice = availablePool.slice(offset, offset + count);
        offset += count;
        allocationsPayload.push({
          rmId,
          contacts: slice.map((r) => ({
            name: r.name,
            phone: r.phone,
            city: r.city,
            loanType: r.metaLoanType || r.loanInfo?.loanType,
            leadSource: fileName || "Meta Ads",
            partnerId: r.partnerInfo?.partnerId,
            customerId: r.customerInfo?.customerId,
          })),
        });
      }

      if (!allocationsPayload.length) {
        alert("No valid RM allocations to submit.");
        return;
      }

      const assignmentType = assignLeadSlice === "partners" ? "PARTNER" : "CUSTOMER";
      setAssigning(true);
      try {
        const token = getAdminToken();
        const res = await axios.post(
          `${backendurl}/calls/assignments/bulk-split`,
          {
            sheetName: assignSheetName || "Meta Calling Sheet",
            assignmentType,
            dailyTarget: parseInt(assignDailyTarget, 10) || 25,
            allocations: allocationsPayload,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.success) {
          setAssignSuccessMsg(`✅ ${res.data.message}! Each RM will now see their assigned calling sheet.`);
          setTimeout(() => {
            setShowAssignModal(false);
            setAssignSuccessMsg("");
          }, 2400);
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to split and assign leads to RMs");
      } finally {
        setAssigning(false);
      }
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
      setActiveFilter(getSmartInitialFilter(res.data));
      setOpen(true);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Could not check this sheet. Ensure it is a valid CSV with phone numbers.");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-blue-500" />
            <span>Active Sheet: <strong className="text-slate-800 font-semibold">{fileName}</strong></span>
            {result?.auditId && (
              <span className="ml-2 inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                Audit Saved in DB
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setFileName("");
              setOpen(false);
            }}
            title="Clear active sheet from view"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition"
          >
            <X size={13} />
            Clear Active Sheet
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Smart Loading State: File Uploading & Contact Pipeline Processing */}
      {loading && (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-white p-6 shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            {/* Animated Pulse Rings & Icon */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                <RefreshCw size={28} className="animate-spin text-blue-600" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Auditing Leads & Fetching Contact Pipeline...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Uploading <strong className="text-slate-700">{fileName || "CSV Sheet"}</strong> and cross-referencing contact phone numbers against database records.
            </p>

            {/* Simulated Animated Progress Bar */}
            <div className="w-full mt-5">
              <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>

            {/* Smart Pipeline Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full mt-5 text-left text-xs">
              <div className="p-3 rounded-xl bg-white border border-blue-100/80 shadow-2xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="text-slate-700 font-medium">1. Parse CSV Sheet</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-100/80 shadow-2xs flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-500 animate-spin shrink-0" />
                <span className="text-slate-800 font-semibold">2. Match Contacts</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center gap-2">
                <Clock size={16} className="shrink-0" />
                <span>3. Build Lead Pool</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium bg-blue-100/50 px-3 py-1 rounded-full">
              <Sparkles size={13} />
              <span>Smart deduplication in progress • Please do not refresh</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Results View */}
      {result && open && (
        <div className="mt-6 space-y-5 animate-in fade-in duration-200">
          {/* 5 Interactive Stat Cards (Click any card to filter) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Fresh Leads Card */}
            <div
              onClick={() => setActiveFilter("fresh")}
              role="button"
              tabIndex={0}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                activeFilter === "fresh"
                  ? "border-2 border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-500/20"
                  : "border border-blue-200 bg-gradient-to-br from-blue-50/60 to-blue-100/30 hover:border-blue-400 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Fresh Leads</span>
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  ★
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-blue-900">{result.freshLeads || 0}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-blue-700 font-medium">
                <span>Not in system (Call now)</span>
                {activeFilter === "fresh" && (
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>
                )}
              </div>
            </div>

            {/* Registered No Loan Card */}
            <div
              onClick={() => setActiveFilter("noLoan")}
              role="button"
              tabIndex={0}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                activeFilter === "noLoan"
                  ? "border-2 border-amber-600 bg-amber-50/90 shadow-md ring-2 ring-amber-500/20"
                  : "border border-amber-200 bg-gradient-to-br from-amber-50/60 to-amber-100/30 hover:border-amber-400 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Registered (No Loan)</span>
                <Clock size={16} className="text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-900">{result.existingCustomersNoLoan || 0}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700 font-medium">
                <span>Signed up, 0 forms filled</span>
                {activeFilter === "noLoan" && (
                  <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>
                )}
              </div>
            </div>

            {/* Existing Partners Card */}
            <div
              onClick={() => setActiveFilter("partners")}
              role="button"
              tabIndex={0}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                activeFilter === "partners"
                  ? "border-2 border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20"
                  : "border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 hover:border-emerald-400 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Existing Partners</span>
                <UserCheck size={16} className="text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-900">{result.existingPartners || 0}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                <span>Already our DSA/Partner</span>
                {activeFilter === "partners" && (
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>
                )}
              </div>
            </div>

            {/* Loan Form Filled Card */}
            <div
              onClick={() => setActiveFilter("loanFilled")}
              role="button"
              tabIndex={0}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                activeFilter === "loanFilled"
                  ? "border-2 border-purple-600 bg-purple-50/90 shadow-md ring-2 ring-purple-500/20"
                  : "border border-purple-200 bg-gradient-to-br from-purple-50/60 to-purple-100/30 hover:border-purple-400 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Loan Form Filled</span>
                <CheckCircle2 size={16} className="text-purple-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-purple-900">{result.existingCustomersLoanFilled || 0}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-purple-700 font-medium">
                <span>Active application in DB</span>
                {activeFilter === "loanFilled" && (
                  <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>
                )}
              </div>
            </div>

            {/* Total Leads Card */}
            <div
              onClick={() => setActiveFilter("all")}
              role="button"
              tabIndex={0}
              className={`col-span-2 md:col-span-1 rounded-xl p-4 cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                activeFilter === "all"
                  ? "border-2 border-slate-700 bg-slate-100 shadow-md ring-2 ring-slate-400/20"
                  : "border border-slate-200 bg-slate-50 hover:border-slate-400 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Leads</span>
                <FileText size={16} className="text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-800">{result.total || 0}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Audited from CSV</span>
                {activeFilter === "all" && (
                  <span className="text-[10px] bg-slate-700 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>
                )}
              </div>
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

              {/* Download Buttons with Live Counts & Disabled States */}
              <button
                type="button"
                onClick={downloadFreshLeads}
                disabled={!result?.freshLeads}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors shadow-xs ${
                  result?.freshLeads
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer"
                    : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                }`}
                title={result?.freshLeads ? "Download leads not in system with +91 WhatsApp format" : "0 Fresh Leads in this sheet"}
              >
                <Download size={13} />
                Fresh Leads CSV ({result?.freshLeads || 0})
              </button>

              <button
                type="button"
                onClick={downloadPartners}
                disabled={!result?.existingPartners}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors shadow-xs ${
                  result?.existingPartners
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                }`}
                title={result?.existingPartners ? "Download existing partners found in this sheet" : "0 Existing Partners in this sheet"}
              >
                <Download size={13} />
                Partners CSV ({result?.existingPartners || 0})
              </button>

              <button
                type="button"
                onClick={openAssignModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                title="Assign leads to RM calling sheets with multi-RM split & targets"
              >
                <UserPlus size={13} />
                Assign to RM Sheet
              </button>

              <button
                type="button"
                onClick={downloadFullAuditedCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                title="Download full audited sheet with original Meta campaign columns + DhanSource audit columns"
              >
                <Download size={13} />
                Full Audited CSV ({result?.total || 0})
              </button>
            </div>
          </div>

          {/* Table with Context-Aware Empty State */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <AppAntTable
              rowKey={(row) => `${row.phone}-${row.createdTime || ""}`}
              columns={columns}
              dataSource={filteredRows}
              size="small"
              pagination={{ pageSize: 12, showSizeChanger: true }}
              locale={{
                emptyText: (
                  <div className="py-12 px-6 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
                      <Filter size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {activeFilter === "fresh" && (result.freshLeads || 0) === 0
                        ? "0 Fresh Leads in this Sheet"
                        : activeFilter === "partners" && (result.existingPartners || 0) === 0
                        ? "0 Existing Partners in this Sheet"
                        : activeFilter === "noLoan" && (result.existingCustomersNoLoan || 0) === 0
                        ? "0 Registered Customers (No Loan) Found"
                        : "No records found in this view"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {activeFilter === "fresh" && (result.existingPartners || 0) > 0
                        ? `All ${result.total} contacts in "${fileName || "this sheet"}" are already registered as Existing Partners in DhanSource.`
                        : searchQuery
                        ? `No contacts matched your search query "${searchQuery}". Try clearing the search.`
                        : `No records match the active filter criteria.`}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {activeFilter === "fresh" && (result.existingPartners || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter("partners")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                        >
                          <UserCheck size={14} />
                          View Existing Partners ({result.existingPartners})
                        </button>
                      )}
                      {activeFilter === "fresh" && (result.existingCustomersNoLoan || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter("noLoan")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-all"
                        >
                          <Clock size={14} />
                          View Customers No Loan ({result.existingCustomersNoLoan})
                        </button>
                      )}
                      {activeFilter !== "all" && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter("all")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                        >
                          Show All Contacts ({result.total || 0})
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-blue-600 hover:underline"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </div>
                ),
              }}
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
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => loadPastAudit(item._id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition whitespace-nowrap"
                              >
                                Load Results
                              </button>
                              <button
                                type="button"
                                disabled={deletingAuditId === item._id}
                                onClick={() => deleteHistoryItem(item._id, item.fileName)}
                                title="Delete this uploaded sheet"
                                className="p-1.5 text-xs rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition disabled:opacity-40"
                              >
                                <Trash2 size={15} className={deletingAuditId === item._id ? "animate-spin" : ""} />
                              </button>
                            </div>
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <UserPlus size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                    Assign Calling Sheet to Relationship Managers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Allocate fresh leads or existing contacts to RMs with target tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition shrink-0 ml-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignToRm} className="p-5 overflow-y-auto space-y-4 flex-1">
              {assignSuccessMsg ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold text-center space-y-1">
                  <div>{assignSuccessMsg}</div>
                  <p className="text-xs font-normal text-emerald-600">
                    The leads are immediately available in the assigned RMs' Calling & Follow-Up Hub.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mode Selector */}
                  <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAssignMode("split")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        assignMode === "split"
                          ? "bg-white text-purple-700 shadow-xs border border-purple-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Users size={14} />
                      Split Across Multiple RMs (e.g. 50 to RM 1, 50 to RM 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignMode("single")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        assignMode === "single"
                          ? "bg-white text-purple-700 shadow-xs border border-purple-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <UserCheck size={14} />
                      Single RM
                    </button>
                  </div>

                  {/* Which Group of Leads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Select Contacts Group:
                      </label>
                      <select
                        value={assignLeadSlice}
                        onChange={(e) => setAssignLeadSlice(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      >
                        <option value="fresh">
                          🔵 Fresh Leads Only ({result?.freshLeads || 0} leads)
                        </option>
                        <option value="noLoan">
                          🟠 Registered Customers (No Loan) ({result?.existingCustomersNoLoan || 0} leads)
                        </option>
                        <option value="partners">
                          🟢 Existing Partners ({result?.existingPartners || 0} partners)
                        </option>
                        <option value="filtered">
                          All Filtered in Table ({filteredRows.length} contacts)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Available Leads Pool:
                      </label>
                      <div className="px-3 py-2 text-xs font-bold rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-between">
                        <span>Total in Selected Group:</span>
                        <span className="text-sm px-2 py-0.5 rounded-md bg-purple-600 text-white font-extrabold">
                          {availablePool.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MULTI-RM ALLOCATION TABLE */}
                  {assignMode === "split" ? (
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            RM Allocation List ({rmsList.length} RMs):
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDistributeEqually}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition flex items-center gap-1 shadow-2xs"
                          title="Evenly divide available leads across selected RMs"
                        >
                          <Zap size={13} className="text-teal-600" />
                          ⚡ Distribute Evenly
                        </button>
                      </div>

                      {/* Live Allocation Summary Pill */}
                      <div
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-wrap items-center justify-between gap-2 transition-colors ${
                          remainingLeads === 0
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : remainingLeads > 0
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span>Total Available: <strong>{availablePool.length}</strong></span>
                          <span>Allocated: <strong>{totalAllocated}</strong></span>
                        </div>
                        <div>
                          {remainingLeads === 0 && (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 size={13} /> All {availablePool.length} leads assigned
                            </span>
                          )}
                          {remainingLeads > 0 && (
                            <span className="text-amber-800">
                              ⚠️ {remainingLeads} leads remaining unallocated
                            </span>
                          )}
                          {remainingLeads < 0 && (
                            <span className="text-rose-700">
                              ❌ Over-allocated by {Math.abs(remainingLeads)} leads! Please decrease count.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Desk Filter Tabs */}
                      {rmsList.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleFilterDesk("ALL")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                              modalDeskFilter === "ALL"
                                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            All RMs ({rmsList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFilterDesk("CUSTOMER")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                              modalDeskFilter === "CUSTOMER"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            📞 Customer Desk ({rmsList.filter((r) => r.rmType === "CUSTOMER").length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFilterDesk("PARTNER")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                              modalDeskFilter === "PARTNER"
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                            }`}
                          >
                            🤝 Partner Desk ({rmsList.filter((r) => r.rmType === "PARTNER").length})
                          </button>
                        </div>
                      )}

                      {/* RM List */}
                      {loadingRms ? (
                        <div className="py-6 text-center text-xs text-slate-400">Loading active RMs...</div>
                      ) : rmsList.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">No active RMs found.</div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white shadow-2xs">
                          {rmsList
                            .filter((r) => modalDeskFilter === "ALL" || r.rmType === modalDeskFilter || r.rmType === "HYBRID")
                            .map((rm) => {
                            const isSelected = selectedRmIds.has(rm.rmId);
                            const currentCount = rmAllocations[rm.rmId] || 0;
                            const deskTag =
                              rm.rmType === "CUSTOMER"
                                ? { label: "📞 Customer Desk", color: "bg-emerald-50 text-emerald-800 border-emerald-200" }
                                : rm.rmType === "PARTNER"
                                ? { label: "🤝 Partner Desk", color: "bg-blue-50 text-blue-800 border-blue-200" }
                                : { label: "⚡ Hybrid Desk", color: "bg-purple-50 text-purple-800 border-purple-200" };

                            return (
                              <div
                                key={rm.rmId}
                                className={`p-2.5 flex items-center justify-between gap-3 transition-colors ${
                                  isSelected ? "bg-purple-50/40" : "hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleRmSelect(rm.rmId)}
                                    className="p-1 rounded text-purple-700 hover:bg-purple-100 transition shrink-0"
                                  >
                                    {isSelected ? (
                                      <CheckSquare size={17} className="text-purple-600" />
                                    ) : (
                                      <Square size={17} className="text-slate-400" />
                                    )}
                                  </button>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {rm.rmName}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        ({rm.employeeId || rm.phone})
                                      </span>
                                      <span
                                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${deskTag.color}`}
                                      >
                                        {deskTag.label}
                                      </span>
                                    </div>
                                    {rm.branchName && (
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        Branch: {rm.branchName}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Count Input */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <label className="text-[11px] font-bold text-slate-600">
                                    Leads:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={availablePool.length}
                                    value={currentCount}
                                    onChange={(e) => handleAllocationChange(rm.rmId, e.target.value)}
                                    disabled={!isSelected}
                                    className="w-20 px-2 py-1 text-xs font-bold text-center rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-40 disabled:bg-slate-100"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SINGLE RM MODE */
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
                  )}

                  {/* Daily Target & Sheet Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Daily Call Target per RM:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={assignDailyTarget}
                        onChange={(e) => setAssignDailyTarget(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Calling Sheet Name:
                      </label>
                      <input
                        type="text"
                        value={assignSheetName}
                        onChange={(e) => setAssignSheetName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigning || (assignMode === "split" && (totalAllocated <= 0 || remainingLeads < 0))}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition shadow-md shadow-purple-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={13} />
                      {assigning
                        ? "Assigning..."
                        : assignMode === "split"
                        ? `Assign ${totalAllocated} Leads to Selected RMs`
                        : "Assign Sheet to RM"}
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
