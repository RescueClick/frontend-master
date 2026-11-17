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
} from "lucide-react";
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
  const [loadingSheetDetails, setLoadingSheetDetails] = useState(false);

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

  const getAdminToken = () => {
    const auth = getAuthData();
    return (
      auth.superAdminToken ||
      auth.adminToken ||
      auth.rsmToken ||
      auth.asmToken ||
      auth.rmToken ||
      ""
    );
  };

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const token = getAdminToken();
      const res = await axios.get(`${backendurl}/calls/assignments/admin-overview?date=${date}`, {
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
      }
    } catch (err) {
      alert("Failed to load sheet details for this RM");
    } finally {
      setLoadingSheetDetails(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverview();
    } else {
      fetchLogs();
    }
  }, [activeTab, date, callType, verifiedFilter, contactType]);

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
              Calling & Follow-Up Hub
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track RM calling targets, assigned lead sheets, manager follow-ups, and verified talk-time in one unified hub.
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
            onClick={activeTab === "overview" ? fetchOverview : fetchLogs}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition active:scale-95"
          >
            <RefreshCw size={14} className={loadingOverview || loadingLogs ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

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
          RM Daily Targets &amp; Calling Sheets
        </button>

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
          Live Call Logs & Verification
        </button>
      </div>

      {/* TAB 1: RM Daily Targets & Assigned Calling Sheets Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing RM calling target progress for date: <strong>{date}</strong></span>
            <span>Total RMs active: <strong>{overviewList.length}</strong></span>
          </div>

          {loadingOverview ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
              <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading RM Daily Targets &amp; Calling Performance...</p>
              <p className="text-xs text-slate-400 mt-1">Fetching live call logs and assigned sheet progress for {date}</p>
            </div>
          ) : overviewList.length === 0 ? (
            <div className="py-14 px-6 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto mb-4">
                <Target size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Calling Targets Assigned for {date}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                RMs haven't been assigned calling sheets for today yet. You can upload leads or partner sheets and allocate daily calling targets in 1 click.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("sheets")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FileSpreadsheet size={16} />
                  Upload &amp; Assign Calling Sheet Now
                </button>

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
              {overviewList.map((rm) => (
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
                              {rm.rmType === "CUSTOMER" ? "Customer Desk" : rm.rmType === "PARTNER" ? "Partner Desk" : "Hybrid Desk"}
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

      {/* TAB 2: Upload & Assign Leads Sheets (Meta / Bulk CSV) */}
      {activeTab === "sheets" && (
        <div className="space-y-4">
          <MetaLeadSheetPanel defaultOpen={true} embedded={true} />
        </div>
      )}

      {/* TAB 2: Team Manager Follow-ups */}
      {activeTab === "team-followup" && (
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

      {/* Modal: View Assigned Sheet & Contact Calling Status for RM */}
      {selectedRmSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Assigned Calling Sheet: {selectedRmSheet.rmName}
                </h3>
                <p className="text-xs text-slate-500">Date: {date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRmSheet(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {selectedRmSheet.sheets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No calling sheet assigned to this RM on {date}.
                </div>
              ) : (
                selectedRmSheet.sheets.map((sheet) => (
                  <div key={sheet._id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          sheet.assignmentType === "PARTNER" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {sheet.assignmentType} Calling Sheet
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{sheet.sheetName}</h4>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-bold text-slate-800">{sheet.stats?.called || 0} / {sheet.stats?.total || 0}</span> Calls Done
                        <div className="text-[11px] text-emerald-700 font-semibold">{sheet.stats?.connected || 0} Connected</div>
                      </div>
                    </div>

                    {/* Contacts Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Phone</th>
                            <th className="p-2.5">City / Details</th>
                            <th className="p-2.5">Call Status</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Last Call</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sheet.contacts?.map((contact) => (
                            <tr key={contact._id} className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-semibold text-slate-800">{contact.name}</td>
                              <td className="p-2.5 font-mono text-slate-600">{contact.phone}</td>
                              <td className="p-2.5 text-slate-500">{contact.city || contact.loanType || "—"}</td>
                              <td className="p-2.5">
                                {contact.status === "CONNECTED" ? (
                                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✅ Connected
                                  </span>
                                ) : contact.status === "UNANSWERED" ? (
                                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                                    ⚠️ Unanswered
                                  </span>
                                ) : contact.status === "CALL_BACK" ? (
                                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                                    🚨 Call Back
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full font-medium text-[11px] bg-slate-100 text-slate-600">
                                    ⏳ Pending Call
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-700">
                                {formatDuration(contact.lastCallDuration)}
                              </td>
                              <td className="p-2.5 text-slate-400">
                                {contact.lastCallTime ? new Date(contact.lastCallTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
