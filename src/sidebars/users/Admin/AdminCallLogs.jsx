import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  User,
  Calendar,
  ShieldCheck,
  Download,
  Users,
  Target,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Phone,
  MapPin,
  MessageSquare,
  Check,
  Edit3,
  AlertCircle,
  X,
  History,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import AppAntTable from "../../../components/shared/AppAntTable";
import AsmFollowUps from "../ASM/AsmFollowUps";
import MetaLeadSheetPanel from "../../../components/shared/MetaLeadSheetPanel";

function formatDuration(seconds = 0) {
  const sec = parseInt(seconds, 10) || 0;
  if (sec === 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function AdminCallLogs({ defaultTab = "" }) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      if (defaultTab) return defaultTab;
      if (typeof window !== "undefined") {
        const p = new URLSearchParams(window.location.search);
        if (p.get("tab")) return p.get("tab");
      }
    } catch (_) {}
    return "overview";
  }); // 'overview' | 'team-followup' | 'logs'
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Overview state
  const [overviewList, setOverviewList] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [selectedRmSheet, setSelectedRmSheet] = useState(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [loadingSheetDetails, setLoadingSheetDetails] = useState(false);
  const [sheetSearch, setSheetSearch] = useState("");
  const [sheetStatusFilter, setSheetStatusFilter] = useState("ALL");
  const [editingContact, setEditingContact] = useState(null); // { assignmentId, contact }
  const [updateStatusVal, setUpdateStatusVal] = useState("CONNECTED");
  const [updateNotesVal, setUpdateNotesVal] = useState("");
  const [updateCallTypeVal, setUpdateCallTypeVal] = useState("OUTGOING");
  const [updateDurationVal, setUpdateDurationVal] = useState(60);
  const [savingContactStatus, setSavingContactStatus] = useState(false);

  // Live logs state
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalDurationMinutes: 0,
    verifiedCalls: 0,
    missedCalls: 0,
    outgoingCalls: 0,
    incomingCalls: 0,
  });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState("");

  // Filters for logs
  const [search, setSearch] = useState("");
  const [callType, setCallType] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [contactType, setContactType] = useState("all");

  const pathname = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
  const isRm = pathname.startsWith("/rm");
  const isAsm = pathname.startsWith("/asm");
  const isRsm = pathname.startsWith("/rsm");

  const getAdminToken = () => {
    const auth = getAuthData();
    if (isRm) {
      return auth.rmToken || auth.token || "";
    }
    if (isAsm) {
      return auth.asmToken || auth.rawAsmToken || auth.adminToken || "";
    }
    if (isRsm) {
      return auth.rsmToken || auth.rawRsmToken || auth.adminToken || "";
    }
    return (
      auth.superAdminToken ||
      auth.adminToken ||
      auth.rsmToken ||
      auth.asmToken ||
      auth.rmToken ||
      ""
    );
  };

  const displayRms = useMemo(() => {
    if (!isRm) return overviewList;
    const auth = getAuthData();
    const myId = auth?.rmUser?._id || auth?.rmUser?.id;
    if (!myId) return overviewList.slice(0, 1);
    const mine = overviewList.filter((r) => String(r.rmId) === String(myId));
    return mine.length > 0 ? mine : overviewList.slice(0, 1);
  }, [isRm, overviewList]);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const token = getAdminToken();
      const auth = getAuthData();
      const myId = isRm ? (auth?.rmUser?._id || auth?.rmUser?.id) : "";
      const url = myId
        ? `${backendurl}/calls/assignments/admin-overview?date=${date}&rmId=${myId}`
        : `${backendurl}/calls/assignments/admin-overview?date=${date}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setOverviewList(res.data.rms || []);
      }
    } catch (err) {
      console.error("Failed to fetch overview:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setError("");
    try {
      const token = getAdminToken();
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (callType !== "all") params.append("callType", callType);
      if (verifiedFilter !== "all") params.append("verifiedOnly", verifiedFilter === "verified" ? "true" : "false");
      if (contactType !== "all") params.append("contactType", contactType);
      params.append("startDate", date);
      params.append("endDate", date);
      if (isRm) {
        const auth = getAuthData();
        const myId = auth?.rmUser?._id || auth?.rmUser?.id;
        if (myId) params.append("rmId", myId);
      }

      const res = await axios.get(`${backendurl}/calls/admin-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setLogs(res.data.logs || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch call logs:", err);
      setError(err.response?.data?.message || "Could not load call logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const viewRmSheetDetails = async (rmId, rmName) => {
    setLoadingSheetDetails(true);
    try {
      const token = getAdminToken();
      const res = await axios.get(`${backendurl}/calls/assignments/rm-sheet?rmId=${rmId}&date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setSelectedRmSheet({
          rmName,
          rmId,
          sheets: res.data.sheets || [],
        });
        setSelectedSheetIndex(0);
        setSheetSearch("");
        setSheetStatusFilter("ALL");
      }
    } catch (err) {
      alert("Failed to load sheet details for this RM");
    } finally {
      setLoadingSheetDetails(false);
    }
  };

  const getWhatsAppUrl = (phone, name = "") => {
    const clean = String(phone || "").replace(/\D/g, "").slice(-10);
    if (!clean) return null;
    const msg = name
      ? `Hello ${name}, this is DhanSource Capital. Regarding your loan inquiry.`
      : `Hello, this is DhanSource Capital. Regarding your loan inquiry.`;
    return `https://wa.me/91${clean}?text=${encodeURIComponent(msg)}`;
  };

  const getLoanTypeBadge = (loanType) => {
    const lt = String(loanType || "").toUpperCase();
    if (lt.includes("PERSONAL") || lt === "PL") {
      return { label: "Personal Loan", tone: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (lt.includes("HOME") || lt === "HL") {
      return { label: "Home Loan", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (lt.includes("LAP") || lt.includes("PROPERTY")) {
      return { label: "LAP / Mortgage", tone: "bg-purple-50 text-purple-700 border-purple-200" };
    }
    if (lt.includes("BUSINESS") || lt === "BL") {
      return { label: "Business Loan", tone: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { label: loanType || "General Lead", tone: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  const getCallingStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "CONNECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-600" /> Connected
        </span>
      );
    }
    if (s === "UNANSWERED" || s === "RINGING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200">
          <PhoneMissed size={12} className="text-amber-600" /> Unanswered
        </span>
      );
    }
    if (s === "CALL_BACK" || s.includes("CALLBACK")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200">
          <Clock size={12} className="text-rose-600" /> Call Back
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs bg-slate-100 text-slate-600 border border-slate-200">
        <Clock size={12} className="text-slate-400" /> Pending Call
      </span>
    );
  };

  const openEditContactModal = (assignmentId, contact) => {
    setEditingContact({ assignmentId, contact });
    setUpdateStatusVal(contact.status || "CONNECTED");
    setUpdateNotesVal(contact.notes || "");
    setUpdateCallTypeVal(contact.lastCallType || "OUTGOING");
    setUpdateDurationVal(contact.lastCallDuration || 60);
  };

  const handleUpdateContactStatus = async () => {
    if (!editingContact) return;
    setSavingContactStatus(true);
    try {
      const token = getAdminToken();
      const res = await axios.patch(
        `${backendurl}/calls/assignments/contact-status`,
        {
          assignmentId: editingContact.assignmentId,
          contactPhone: editingContact.contact.phone,
          status: updateStatusVal,
          notes: updateNotesVal,
          callType: updateCallTypeVal,
          durationSeconds: updateDurationVal,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Contact status & call direction updated!");
        setSelectedRmSheet((prev) => {
          if (!prev) return prev;
          const updatedSheets = prev.sheets.map((sheet) => {
            if (sheet._id !== editingContact.assignmentId) return sheet;
            const updatedContacts = sheet.contacts.map((c) =>
              c.phone === editingContact.contact.phone
                ? {
                    ...c,
                    status: updateStatusVal,
                    notes: updateNotesVal,
                    lastCallType: updateCallTypeVal,
                    lastCallDuration: updateDurationVal,
                    lastCallTime: new Date(),
                  }
                : c
            );
            const called = updatedContacts.filter((c) => c.status !== "PENDING").length;
            const connected = updatedContacts.filter((c) => c.status === "CONNECTED").length;
            return {
              ...sheet,
              contacts: updatedContacts,
              stats: {
                ...sheet.stats,
                called,
                connected,
                pending: updatedContacts.length - called,
              },
            };
          });
          return { ...prev, sheets: updatedSheets };
        });
        setEditingContact(null);
        fetchOverview();
        fetchLogs();
      }
    } catch (err) {
      console.error("Failed to update contact status:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSavingContactStatus(false);
    }
  };

  useEffect(() => {
    if (isRm && (activeTab === "sheets" || activeTab === "team-followup")) {
      setActiveTab("overview");
    }
  }, [isRm, activeTab]);

  useEffect(() => {
    if (isRm) {
      fetchOverview();
      fetchLogs();
    } else if (activeTab === "overview") {
      fetchOverview();
    } else if (activeTab === "logs") {
      fetchLogs();
    }
  }, [isRm, activeTab, date, callType, verifiedFilter, contactType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const logColumns = [
    {
      title: "RM / Staff",
      dataIndex: "rmName",
      key: "rmName",
      render: (text) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
            {text ? text[0].toUpperCase() : "R"}
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-xs md:text-sm">{text || "RM"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Contact (Partner / Customer)",
      key: "target",
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-900 text-xs md:text-sm">{row.targetName || "Unknown"}</div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
            <span>{row.targetPhone}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
              row.contactType === "partner" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {row.contactType}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Call Direction",
      key: "callType",
      render: (_, row) => {
        if (row.callType === "OUTGOING") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <PhoneOutgoing size={12} />
              Outgoing
            </span>
          );
        }
        if (row.callType === "INCOMING") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <PhoneIncoming size={12} />
              Incoming
            </span>
          );
        }
        if (row.callType === "MISSED") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <PhoneMissed size={12} />
              Missed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Rejected
          </span>
        );
      },
    },
    {
      title: "Talk Time",
      key: "duration",
      render: (_, row) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {formatDuration(row.durationSeconds)}
        </span>
      ),
    },
    {
      title: "Verification Status",
      key: "verification",
      render: (_, row) => {
        if (row.isVerifiedRealCall) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Real Call Verified ({formatDuration(row.durationSeconds)})
            </span>
          );
        }
        if (row.callType === "MISSED") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
              <PhoneMissed size={13} className="text-red-600" />
              Missed Call (Callback Needed)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle size={13} className="text-amber-600" />
            0s (Unanswered / Ringing)
          </span>
        );
      },
    },
    {
      title: "Time",
      key: "time",
      render: (_, row) => (
        <div className="text-xs text-slate-500 font-mono">
          {new Date(row.callStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => (
        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
          {source === "android_native" ? "📱 Android App" : "💻 Web"}
        </span>
      ),
    },
  ];

  const renderStatCards = () => (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 h-full">
      <div
        onClick={() => {
          setCallType("all");
          setVerifiedFilter("all");
        }}
        role="button"
        tabIndex={0}
        className={`rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none flex flex-col justify-between ${
          callType === "all" && verifiedFilter === "all"
            ? "border-2 border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20"
            : "border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white hover:border-blue-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Calls</span>
          <PhoneCall size={18} className="text-blue-600" />
        </div>
        <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black text-blue-900">{stats.totalCalls}</div>
        <div className="mt-1 flex items-center justify-between text-xs text-blue-700 font-medium">
          <span>Logged on {date}</span>
          {callType === "all" && verifiedFilter === "all" && (
            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">All</span>
          )}
        </div>
      </div>

      <div
        onClick={() => {
          setVerifiedFilter("verified");
          setCallType("all");
        }}
        role="button"
        tabIndex={0}
        className={`rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none flex flex-col justify-between ${
          verifiedFilter === "verified"
            ? "border-2 border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20"
            : "border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white hover:border-emerald-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Verified Real</span>
          <ShieldCheck size={18} className="text-emerald-600" />
        </div>
        <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black text-emerald-900">{stats.verifiedCalls}</div>
        <div className="mt-1 flex items-center justify-between text-xs text-emerald-700 font-medium">
          <span>Duration &gt; 0s (baat hui)</span>
          {verifiedFilter === "verified" && (
            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">Active</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-4 sm:p-5 shadow-xs select-none flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Total Talk Time</span>
          <Clock size={18} className="text-purple-600" />
        </div>
        <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black text-purple-900">{stats.totalDurationMinutes} min</div>
        <div className="mt-1 text-xs text-purple-700 font-medium">Combined talking time</div>
      </div>

      <div
        onClick={() => {
          setCallType("MISSED");
          setVerifiedFilter("all");
        }}
        role="button"
        tabIndex={0}
        className={`rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none flex flex-col justify-between ${
          callType === "MISSED"
            ? "border-2 border-red-600 bg-red-50/80 shadow-md ring-2 ring-red-500/20"
            : "border border-red-200 bg-gradient-to-br from-red-50/50 to-white hover:border-red-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Missed Calls</span>
          <PhoneMissed size={18} className="text-red-600" />
        </div>
        <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black text-red-900">{stats.missedCalls}</div>
        <div className="mt-1 flex items-center justify-between text-xs text-red-700 font-medium">
          <span>Unanswered / Missed</span>
          {callType === "MISSED" && (
            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">Active</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderRmCard = (rm) => (
    <div
      key={rm.rmId}
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full"
    >
      <div>
        {/* RM Info Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              {rm.rmName ? rm.rmName[0].toUpperCase() : "R"}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm">{rm.rmName}</h3>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    rm.rmType === "CUSTOMER"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : rm.rmType === "PARTNER"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-purple-50 text-purple-700 border border-purple-200"
                  }`}
                >
                  {rm.rmType === "CUSTOMER"
                    ? rm.loanSpecialization === "PL_LAP"
                      ? "Customer Desk • PL+LAP"
                      : "Customer Desk"
                    : rm.rmType === "PARTNER"
                    ? "Partner Desk"
                    : "Hybrid Desk"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{rm.employeeId || rm.phone}</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                rm.overallPercentage >= 80
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : rm.overallPercentage >= 40
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {rm.overallPercentage}% Target
            </span>
          </div>
        </div>

        {/* Progress Bars for Both Workflows */}
        <div className="mt-4 space-y-3.5">
          {/* Workflow 1: Partner Calls (Only if partner desk or has target) */}
          {(rm.rmType !== "CUSTOMER" || rm.partnerCallsTarget > 0) && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Users size={13} className="text-emerald-600" />
                  Partner Calls (Target: {rm.partnerCallsTarget || "—"})
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {rm.partnerCallsDone} / {rm.partnerCallsTarget || 0}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      rm.partnerCallsTarget > 0
                        ? Math.min(100, (rm.partnerCallsDone / rm.partnerCallsTarget) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                {rm.partnerCallsConnected} calls connected
              </div>
            </div>
          )}

          {/* Workflow 2: Customer Leads */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Target size={13} className="text-blue-600" />
                Customer Calls (Target: {rm.customerCallsTarget || "—"})
              </span>
              <span className="font-mono font-bold text-slate-800">
                {rm.customerCallsDone} / {rm.customerCallsTarget || 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${
                    rm.customerCallsTarget > 0
                      ? Math.min(100, (rm.customerCallsDone / rm.customerCallsTarget) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {rm.customerCallsConnected} calls connected
            </div>
          </div>
        </div>

        {/* Quick Call Metrics Breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs border border-slate-100">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Talk Time</div>
            <div className="font-black text-slate-800 mt-0.5">{rm.totalTalkTimeMinutes} min</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Outgoing</div>
            <div className="font-black text-blue-700 mt-0.5">📞 {rm.outgoingCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Incoming</div>
            <div className="font-black text-emerald-700 mt-0.5">📥 {rm.incomingCount}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => viewRmSheetDetails(rm.rmId, rm.rmName)}
          className="w-full py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-700/20 active:scale-[0.99]"
        >
          <PhoneCall size={15} />
          Open Calling Sheet &amp; Start Dialing
        </button>
      </div>
    </div>
  );

  const renderLogsTable = () => (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contact, phone, RM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-52 md:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={callType}
            onChange={(e) => setCallType(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Directions</option>
            <option value="OUTGOING">Outgoing (Dialed)</option>
            <option value="INCOMING">Incoming (Inbound)</option>
            <option value="MISSED">Missed Calls</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Verifications</option>
            <option value="verified">✅ Verified Real Calls (&gt;0s)</option>
            <option value="unverified">⚠️ 0s / Unanswered</option>
          </select>

          <select
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Contacts</option>
            <option value="customer">Customers Only</option>
            <option value="partner">Partners Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <AppAntTable
          rowKey="_id"
          columns={logColumns}
          dataSource={logs}
          loading={loadingLogs}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{ emptyText: "No call logs found for the selected filters" }}
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PhoneCall size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {isRm ? "My Calling & Follow-Up Hub" : "Calling & Follow-Up Hub"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isRm
              ? "Track your assigned daily calling target, calling sheets, and verified talk-time."
              : "Track RM calling targets, assigned lead sheets, manager follow-ups, and verified talk-time in one unified hub."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar size={15} className="text-slate-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs md:text-sm font-semibold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (isRm) {
                fetchOverview();
                fetchLogs();
              } else if (activeTab === "overview") {
                fetchOverview();
              } else {
                fetchLogs();
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition active:scale-95"
          >
            <RefreshCw size={14} className={loadingOverview || loadingLogs ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= RM VIEW: CLEAN, MODERN, ZERO-DUPLICATION WORKSPACE ================= */}
      {isRm ? (
        <div className="space-y-6">
          {loadingOverview ? (
            <div className="h-48 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-xs">
              <RefreshCw size={26} className="animate-spin text-emerald-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Loading your calling workspace...</p>
            </div>
          ) : displayRms.length === 0 ? (
            <div className="h-48 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-xs">
              <Target size={32} className="text-slate-400 mb-2" />
              <p className="text-base font-bold text-slate-800">No Calling Target Assigned for Today</p>
              <p className="text-xs text-slate-500 mt-1">Please ask your RSM / ASM to assign lead sheets for today ({date}).</p>
            </div>
          ) : (() => {
            const rm = displayRms[0];
            const targetCalls = rm.customerCallsTarget || rm.partnerCallsTarget || 25;
            const callsDone = rm.customerCallsDone || rm.partnerCallsDone || rm.outgoingCount || 0;
            const callsConnected = rm.customerCallsConnected || rm.partnerCallsConnected || 0;
            const progressPct = targetCalls > 0 ? Math.min(100, Math.round((callsDone / targetCalls) * 100)) : 0;
            const pendingCalls = Math.max(0, targetCalls - callsDone);
            const verifiedDuration = rm.totalTalkTimeMinutes || 0;

            return (
              <div className="space-y-6">
                {/* 1. Main Unified Executive Calling Card (No Duplicate Cards/Values!) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  {/* Top Header of Card */}
                  <div className="p-5 sm:p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-gradient-to-r from-slate-50/70 via-white to-emerald-50/30">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-base shadow-md shadow-slate-900/20 shrink-0">
                        {rm.rmName ? rm.rmName[0].toUpperCase() : "R"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                            {rm.rmName}
                          </h2>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {rm.employeeId || rm.phone}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              rm.rmType === "CUSTOMER"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : rm.rmType === "PARTNER"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            {rm.rmType === "CUSTOMER"
                              ? rm.loanSpecialization === "PL_LAP"
                                ? "Customer Desk • PL+LAP"
                                : "Customer Desk"
                              : rm.rmType === "PARTNER"
                              ? "Partner Desk"
                              : "Hybrid Desk"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Assigned Daily Calling Target • Active Sheet Workspace
                        </p>
                      </div>
                    </div>

                    {/* Single Big Primary Action Button */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => viewRmSheetDetails(rm.rmId, rm.rmName)}
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm tracking-wide shadow-md shadow-emerald-700/25 hover:shadow-lg hover:shadow-emerald-700/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <PhoneCall size={18} />
                        Open Calling Sheet &amp; Start Dialing
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Unified Non-Duplicative Metrics Grid (5 Clean Cards) */}
                  <div className="p-5 sm:p-7 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                      {/* Metric 1: Daily Target */}
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Daily Target
                          </span>
                          <Target size={16} className="text-slate-400" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-slate-900">{targetCalls}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Assigned for {date}</div>
                        </div>
                      </div>

                      {/* Metric 2: Calls Made */}
                      <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-200/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                            Calls Made
                          </span>
                          <PhoneOutgoing size={16} className="text-blue-600" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-blue-900">{callsDone}</div>
                          <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                            {rm.outgoingCount || callsDone} Outgoing • {rm.incomingCount || 0} Incoming
                          </div>
                        </div>
                      </div>

                      {/* Metric 3: Connected */}
                      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                            Connected
                          </span>
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-emerald-900">{callsConnected}</div>
                          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                            Spoke with Customer / Partner
                          </div>
                        </div>
                      </div>

                      {/* Metric 4: Verified Talk Time */}
                      <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-200/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                            Talk Time
                          </span>
                          <Clock size={16} className="text-purple-600" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-purple-900">{verifiedDuration} min</div>
                          <div className="text-[11px] text-purple-600 font-medium mt-0.5">
                            Real verified duration
                          </div>
                        </div>
                      </div>

                      {/* Metric 5: Pending to Dial */}
                      <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/70 flex flex-col justify-between col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                            Pending to Call
                          </span>
                          <AlertCircle size={16} className="text-amber-600" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-amber-900">{pendingCalls}</div>
                          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                            Remaining today
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Line */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Target Completion Progress</span>
                        <span className="font-mono text-emerald-700 font-extrabold">{callsDone} / {targetCalls} ({progressPct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 shadow-xs"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Today's Recent Call Activity Feed (Clean, Minimal, Non-Duplicative) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <History size={17} className="text-emerald-600" />
                        Today's Logged Call Activity
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verified audio recordings and logged calls for {date}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {logs.length} call{logs.length === 1 ? "" : "s"} logged
                    </span>
                  </div>

                  {logs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No calls logged yet today. Click <strong>"Open Calling Sheet &amp; Start Dialing"</strong> above to begin!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {logs.slice(0, 5).map((log) => (
                        <div key={log._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                              {log.targetName ? log.targetName[0].toUpperCase() : "C"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{log.targetName || log.targetPhone}</div>
                              <div className="text-[11px] font-mono text-slate-400">{log.targetPhone}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {formatDuration(log.durationSeconds)}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                log.isVerifiedRealCall
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {log.isVerifiedRealCall ? "✅ Real Call" : "⚠️ Ringing / 0s"}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                              {new Date(log.callStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          {/* Main Tabs: Targets vs Team Follow-up vs Live Logs */}
          <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "overview"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Target size={16} />
          {isRm ? "My Daily Calling Target" : "RM Daily Targets & Calling Sheets"}
        </button>

        {!isRm && (
          <button
            type="button"
            onClick={() => setActiveTab("sheets")}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "sheets"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileSpreadsheet size={16} />
            Upload &amp; Assign Sheets (Meta / Bulk)
          </button>
        )}

        {!isRm && (
          <button
            type="button"
            onClick={() => setActiveTab("team-followup")}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "team-followup"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users size={16} />
            Team Manager Follow-ups
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "logs"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <PhoneCall size={16} />
          {isRm ? "My Live Call Logs" : "Live Call Logs & Verification"}
        </button>
      </div>

      {/* TAB 1: RM Daily Targets & Assigned Calling Sheets Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing {isRm ? "my" : "RM"} calling target progress for date: <strong>{date}</strong></span>
            {!isRm && <span>Total RMs active: <strong>{overviewList.length}</strong></span>}
          </div>

          {loadingOverview ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
              <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading RM Daily Targets &amp; Calling Performance...</p>
              <p className="text-xs text-slate-400 mt-1">Fetching live call logs and assigned sheet progress for {date}</p>
            </div>
          ) : displayRms.length === 0 ? (
            <div className="py-14 px-6 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto mb-4">
                <Target size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {isRm ? "No Calling Targets Assigned to You for Today" : `No Calling Targets Assigned for ${date}`}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                {isRm
                  ? "You don't have assigned calling sheets for today yet. Please check with your RSM / ASM."
                  : "RMs haven't been assigned calling sheets for today yet. You can upload leads or partner sheets and allocate daily calling targets in 1 click."}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {!isRm && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("sheets")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <FileSpreadsheet size={16} />
                    Upload &amp; Assign Calling Sheet Now
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab("logs")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
                >
                  <PhoneCall size={16} />
                  View Live Call Logs
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayRms.map((rm) => (
                <div
                  key={rm.rmId}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* RM Info Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                          {rm.rmName ? rm.rmName[0].toUpperCase() : "R"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-sm">{rm.rmName}</h3>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              rm.rmType === "CUSTOMER"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : rm.rmType === "PARTNER"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}>
                              {rm.rmType === "CUSTOMER"
                                ? (rm.loanSpecialization === "PL_LAP" ? "Customer Desk • PL+LAP" : "Customer Desk")
                                : rm.rmType === "PARTNER"
                                ? "Partner Desk"
                                : "Hybrid Desk"}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{rm.employeeId || rm.phone}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          rm.overallPercentage >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : rm.overallPercentage >= 40 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"
                        }`}>
                          {rm.overallPercentage}% Target
                        </span>
                      </div>
                    </div>

                    {/* Progress Bars for Both Workflows */}
                    <div className="mt-4 space-y-3.5">
                      {/* Workflow 1: Partner Calls */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Users size={13} className="text-emerald-600" />
                            Partner Calls (Target: {rm.partnerCallsTarget || "—"})
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {rm.partnerCallsDone} / {rm.partnerCallsTarget || 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                rm.partnerCallsTarget > 0
                                  ? Math.min(100, (rm.partnerCallsDone / rm.partnerCallsTarget) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {rm.partnerCallsConnected} calls connected
                        </div>
                      </div>

                      {/* Workflow 2: Customer Leads */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Target size={13} className="text-blue-600" />
                            Customer Calls (Target: {rm.customerCallsTarget || "—"})
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {rm.customerCallsDone} / {rm.customerCallsTarget || 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                rm.customerCallsTarget > 0
                                  ? Math.min(100, (rm.customerCallsDone / rm.customerCallsTarget) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {rm.customerCallsConnected} calls connected
                        </div>
                      </div>
                    </div>

                    {/* Quick Call Metrics Breakdown */}
                    <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs border border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Talk Time</div>
                        <div className="font-black text-slate-800 mt-0.5">{rm.totalTalkTimeMinutes} min</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Outgoing</div>
                        <div className="font-black text-blue-700 mt-0.5">📞 {rm.outgoingCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Incoming</div>
                        <div className="font-black text-emerald-700 mt-0.5">📥 {rm.incomingCount}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => viewRmSheetDetails(rm.rmId, rm.rmName)}
                    className="mt-4 w-full py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileSpreadsheet size={14} />
                    View Assigned Sheet & Call Status
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Upload & Assign Leads Sheets (Meta / Bulk CSV) - Managers Only */}
      {activeTab === "sheets" && !isRm && (
        <div className="space-y-4">
          <MetaLeadSheetPanel defaultOpen={true} embedded={true} />
        </div>
      )}

      {/* TAB 2: Team Manager Follow-ups - Managers Only */}
      {activeTab === "team-followup" && !isRm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-4 shadow-sm">
          <AsmFollowUps />
        </div>
      )}

      {/* TAB 3: Live Call Logs & Verification */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* 4 Interactive Stat Cards (Click to Filter) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => {
                setCallType("all");
                setVerifiedFilter("all");
              }}
              role="button"
              tabIndex={0}
              className={`rounded-2xl p-5 shadow-xs cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                callType === "all" && verifiedFilter === "all"
                  ? "border-2 border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20"
                  : "border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Calls</span>
                <PhoneCall size={18} className="text-blue-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-blue-900">{stats.totalCalls}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-blue-700 font-medium">
                <span>Logged on {date}</span>
                {callType === "all" && verifiedFilter === "all" && (
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">All</span>
                )}
              </div>
            </div>

            <div
              onClick={() => {
                setVerifiedFilter("verified");
                setCallType("all");
              }}
              role="button"
              tabIndex={0}
              className={`rounded-2xl p-5 shadow-xs cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                verifiedFilter === "verified"
                  ? "border-2 border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20"
                  : "border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white hover:border-emerald-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Verified Real Calls</span>
                <ShieldCheck size={18} className="text-emerald-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-900">{stats.verifiedCalls}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>Duration &gt; 0s (baat hui)</span>
                {verifiedFilter === "verified" && (
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">Active</span>
                )}
              </div>
            </div>

            <div
              className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-5 shadow-xs select-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Total Talk Time</span>
                <Clock size={18} className="text-purple-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-purple-900">{stats.totalDurationMinutes} min</div>
              <div className="mt-1 text-xs text-purple-700 font-medium">Combined talking time</div>
            </div>

            <div
              onClick={() => {
                setCallType("MISSED");
                setVerifiedFilter("all");
              }}
              role="button"
              tabIndex={0}
              className={`rounded-2xl p-5 shadow-xs cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 select-none ${
                callType === "MISSED"
                  ? "border-2 border-red-600 bg-red-50/80 shadow-md ring-2 ring-red-500/20"
                  : "border border-red-200 bg-gradient-to-br from-red-50/50 to-white hover:border-red-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Missed Calls</span>
                <PhoneMissed size={18} className="text-red-600" />
              </div>
              <div className="mt-3 text-3xl font-black text-red-900">{stats.missedCalls}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-red-700 font-medium">
                <span>Partner missed calls</span>
                {callType === "MISSED" && (
                  <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">Active</span>
                )}
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search RM, partner, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-52 md:w-64"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Directions</option>
                <option value="OUTGOING">Outgoing (RM Dialed)</option>
                <option value="INCOMING">Incoming (Partner Inbound)</option>
                <option value="MISSED">Missed Calls</option>
              </select>

              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Verifications</option>
                <option value="verified">✅ Verified Real Calls Only (&gt;0s)</option>
                <option value="unverified">⚠️ 0s / Unanswered</option>
              </select>

              <select
                value={contactType}
                onChange={(e) => setContactType(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Contacts</option>
                <option value="partner">Partners Only</option>
                <option value="customer">Customers Only</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <AppAntTable
              rowKey="_id"
              columns={logColumns}
              dataSource={logs}
              loading={loadingLogs}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              locale={{ emptyText: "No call logs found for the selected filters" }}
            />
          </div>
        </div>
      )}
        </>
      )}

      {/* ================= MODAL: HIGH-IMPACT EXECUTIVE TELECALLER WORKSPACE ================= */}
      {selectedRmSheet && (() => {
        const sheets = selectedRmSheet.sheets || [];
        const activeSheet = sheets[selectedSheetIndex] || sheets[0] || null;
        const contacts = activeSheet?.contacts || [];
        const totalCount = contacts.length;
        const calledCount = activeSheet?.stats?.called ?? contacts.filter((c) => c.status !== "PENDING").length;
        const connectedCount = activeSheet?.stats?.connected ?? contacts.filter((c) => c.status === "CONNECTED").length;
        const unansweredCount = contacts.filter((c) => c.status === "UNANSWERED" || c.status === "RINGING").length;
        const callBackCount = contacts.filter((c) => c.status === "CALL_BACK").length;
        const pendingCount = Math.max(0, totalCount - calledCount);
        const progressPct = totalCount > 0 ? Math.round((calledCount / totalCount) * 100) : 0;

        const filteredContacts = contacts.filter((c) => {
          if (sheetStatusFilter !== "ALL") {
            if (sheetStatusFilter === "UNANSWERED") {
              if (c.status !== "UNANSWERED" && c.status !== "RINGING") return false;
            } else if (c.status !== sheetStatusFilter) {
              return false;
            }
          }
          if (sheetSearch) {
            const q = sheetSearch.toLowerCase();
            const matches =
              c.name?.toLowerCase().includes(q) ||
              String(c.phone || "").includes(q) ||
              c.city?.toLowerCase().includes(q) ||
              c.loanType?.toLowerCase().includes(q);
            if (!matches) return false;
          }
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-[98vw] max-w-7xl h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
              {/* 1. Modal Top Bar (Compact & Sleek) */}
              <div className="px-5 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                        {activeSheet?.sheetName || "Assigned Calling Sheet"}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        👤 {selectedRmSheet.rmName}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        📅 {date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                          activeSheet?.assignmentType === "PARTNER"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {activeSheet?.assignmentType === "PARTNER" ? "Channel Partner Desk" : "Customer Desk"}
                      </span>
                      <span className="hidden sm:inline text-slate-400">•</span>
                      <span className="hidden sm:inline text-[11px] text-slate-500">
                        Click Call / WhatsApp to dial directly &amp; log verified outcomes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Header Right: Compact KPI Pills & Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  {activeSheet && (
                    <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
                      <div className="bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-xl text-slate-700">
                        Total: <span className="font-black text-slate-900">{totalCount}</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-emerald-700">
                        Called: <span className="font-black text-emerald-800">{calledCount}</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl text-blue-700">
                        Connected: <span className="font-black text-blue-800">{connectedCount}</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-800">
                        Pending: <span className="font-black text-amber-900">{pendingCount}</span>
                      </div>
                      <div className="bg-slate-900 text-white px-2.5 py-1 rounded-xl font-black text-xs shadow-xs">
                        {progressPct}% Done
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                    <button
                      type="button"
                      onClick={() => viewRmSheetDetails(selectedRmSheet.rmId, selectedRmSheet.rmName)}
                      disabled={loadingSheetDetails}
                      className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                      title="Refresh Sheet"
                    >
                      <RefreshCw size={17} className={loadingSheetDetails ? "animate-spin" : ""} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRmSheet(null)}
                      className="text-slate-400 hover:text-slate-700 p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                      title="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Slim Progress Bar Line */}
              <div className="w-full bg-slate-100 h-1 overflow-hidden shrink-0">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Multi-sheet switcher tabs (only if RM has more than 1 assigned sheet) */}
              {sheets.length > 1 && (
                <div className="flex border-b border-slate-200 px-5 sm:px-6 gap-2 bg-slate-50/70 shrink-0 overflow-x-auto py-1">
                  {sheets.map((s, idx) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => setSelectedSheetIndex(idx)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        (selectedSheetIndex || 0) === idx
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <FileSpreadsheet size={13} />
                      {s.sheetName} ({s.contacts?.length || 0})
                    </button>
                  ))}
                </div>
              )}

              {/* 3. Search & Filter Bar (Compact Single Row) */}
              <div className="px-5 sm:px-6 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-xs sm:max-w-sm min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone, city, loan..."
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {sheetSearch && (
                    <button
                      type="button"
                      onClick={() => setSheetSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter("ALL")}
                    className={`px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      sheetStatusFilter === "ALL"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter("PENDING")}
                    className={`px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      sheetStatusFilter === "PENDING"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    ⏳ Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter("CONNECTED")}
                    className={`px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      sheetStatusFilter === "CONNECTED"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    ✅ Connected ({connectedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter("UNANSWERED")}
                    className={`px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      sheetStatusFilter === "UNANSWERED"
                        ? "bg-amber-700 text-white shadow-xs"
                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    ⚠️ Unanswered ({unansweredCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetStatusFilter("CALL_BACK")}
                    className={`px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      sheetStatusFilter === "CALL_BACK"
                        ? "bg-rose-700 text-white shadow-xs"
                        : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    🚨 Call Back ({callBackCount})
                  </button>
                </div>
              </div>

              {/* 4. Contacts Table (Fills ALL Remaining Height with ZERO nested scrollbars) */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-white">
                {!activeSheet || contacts.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FileSpreadsheet size={26} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">No Leads Found in this Sheet</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      No leads have been assigned to {selectedRmSheet.rmName} for {date}.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                      <tr>
                        <th className="py-3 px-4 sm:px-6">Lead / Customer</th>
                        <th className="py-3 px-3">Loan Requirement</th>
                        <th className="py-3 px-3">Contact &amp; Quick Dial</th>
                        <th className="py-3 px-3">Calling Status</th>
                        <th className="py-3 px-3">Duration &amp; Last Call</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredContacts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                            No leads found matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredContacts.map((contact) => {
                          const cleanPhone = String(contact.phone || "").replace(/\D/g, "").slice(-10);
                          const loanBadge = getLoanTypeBadge(contact.loanType);

                          return (
                            <tr key={contact._id || contact.phone} className="hover:bg-slate-50/90 transition-colors">
                              {/* Lead Name & City */}
                              <td className="py-3 px-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {contact.name ? contact.name[0].toUpperCase() : "L"}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {contact.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {contact.city && (
                                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                          <MapPin size={10} className="text-slate-400" />
                                          {contact.city}
                                        </span>
                                      )}
                                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                        {contact.leadSource && !contact.leadSource.endsWith(".csv")
                                          ? contact.leadSource
                                          : "Meta Ads"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Loan Requirement */}
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border ${loanBadge.tone}`}
                                >
                                  {loanBadge.label}
                                </span>
                              </td>

                              {/* Contact & 1-Click Dialing */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                                    {contact.phone}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {/* Direct Call Button */}
                                    <a
                                      href={`tel:${cleanPhone}`}
                                      className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs active:scale-95 transition cursor-pointer"
                                      title={`Call ${contact.name}`}
                                    >
                                      <Phone size={11} /> Call
                                    </a>

                                    {/* WhatsApp Button */}
                                    <a
                                      href={getWhatsAppUrl(contact.phone, contact.name)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
                                      title="Chat on WhatsApp"
                                    >
                                      <FaWhatsapp size={14} />
                                    </a>
                                  </div>
                                </div>
                              </td>

                              {/* Call Status Badge */}
                              <td className="py-3 px-3">
                                {getCallingStatusBadge(contact.status)}
                              </td>

                              {/* Duration, Direction & Last Call */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {contact.lastCallType === "INCOMING" ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                      <PhoneIncoming size={10} /> Incoming
                                    </span>
                                  ) : contact.lastCallType === "OUTGOING" ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      <PhoneOutgoing size={10} /> Outgoing
                                    </span>
                                  ) : contact.lastCallType === "MISSED" ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <PhoneMissed size={10} /> Missed
                                    </span>
                                  ) : null}

                                  <span className="font-mono font-bold text-slate-700 text-xs">
                                    {formatDuration(contact.lastCallDuration)}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {contact.lastCallTime
                                    ? new Date(contact.lastCallTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </div>
                              </td>

                              {/* Actions: Update Status & Add Note */}
                              <td className="py-3 px-4 sm:px-6 text-right">
                                <button
                                  type="button"
                                  onClick={() => openEditContactModal(activeSheet._id, contact)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs active:scale-95 transition cursor-pointer"
                                >
                                  <Edit3 size={12} className="text-slate-500" />
                                  Update Outcome
                                </button>
                                {contact.notes && (
                                  <div
                                    className="text-[10px] text-slate-500 truncate max-w-[130px] ml-auto mt-0.5"
                                    title={contact.notes}
                                  >
                                    Note: {contact.notes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 5. Sleek Bottom Status Bar */}
              <div className="px-5 sm:px-6 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
                <span className="font-medium text-[11px]">
                  Showing <strong className="text-slate-800">{filteredContacts.length}</strong> of{" "}
                  <strong className="text-slate-800">{totalCount}</strong> assigned leads
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  💡 Verified call talk-times &amp; durations sync automatically with your Daily Target
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= SUB-MODAL: UPDATE CALL OUTCOME & REMARKS ================= */}
      {editingContact && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Update Call Outcome
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {editingContact.contact.name} • {editingContact.contact.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Call Outcome Status
                </label>
                <select
                  value={updateStatusVal}
                  onChange={(e) => setUpdateStatusVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="CONNECTED">✅ Connected (Spoke with Customer / Partner)</option>
                  <option value="UNANSWERED">⚠️ Unanswered / Ringing</option>
                  <option value="CALL_BACK">🚨 Call Back Scheduled</option>
                  <option value="PENDING">⏳ Pending Call</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Call Direction (Incoming ya Outgoing?)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setUpdateCallTypeVal("OUTGOING")}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      updateCallTypeVal === "OUTGOING"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <PhoneOutgoing size={13} />
                    📞 Outgoing (Maine lagaya)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateCallTypeVal("INCOMING")}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      updateCallTypeVal === "INCOMING"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <PhoneIncoming size={13} />
                    📥 Incoming (Client ka aaya)
                  </button>
                </div>
              </div>

              {updateStatusVal === "CONNECTED" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kitna Time Baat Hui? (Talk Time)
                  </label>
                  <select
                    value={updateDurationVal}
                    onChange={(e) => setUpdateDurationVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute (Quick brief)</option>
                    <option value={120}>2 minutes (Good conversation)</option>
                    <option value={180}>3 minutes (Detailed inquiry)</option>
                    <option value={300}>5 minutes (Full discussion)</option>
                    <option value={600}>10 minutes (Deep consultation)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Follow-up Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Needs 5 Lakh Personal loan for renovation, call back on Friday..."
                  value={updateNotesVal}
                  onChange={(e) => setUpdateNotesVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateContactStatus}
                  disabled={savingContactStatus}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingContactStatus && <RefreshCw size={12} className="animate-spin" />}
                  Save Outcome
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
