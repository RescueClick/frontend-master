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
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import AppAntTable from "../../../components/shared/AppAntTable";

function formatDuration(seconds = 0) {
  const sec = parseInt(seconds, 10) || 0;
  if (sec === 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function AdminCallLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalDurationMinutes: 0,
    verifiedCalls: 0,
    missedCalls: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [callType, setCallType] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [contactType, setContactType] = useState("all");

  const getAdminToken = () => {
    const auth = getAuthData();
    return auth.superAdminToken || auth.adminToken || "";
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAdminToken();
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (callType !== "all") params.append("callType", callType);
      if (verifiedFilter !== "all") params.append("verifiedOnly", verifiedFilter === "verified" ? "true" : "false");
      if (contactType !== "all") params.append("contactType", contactType);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [callType, verifiedFilter, contactType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const columns = [
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
      title: "Call Type",
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
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
              Missed Call (Follow-up Needed)
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
      title: "Time & Date",
      key: "time",
      render: (_, row) => (
        <div className="text-xs text-slate-500">
          <div>{new Date(row.callStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-[11px] text-slate-400">{new Date(row.callStartTime).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => (
        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
          {source === "android_native" ? "📱 Android Native" : "💻 Web"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PhoneCall size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              RM & Staff Call Verification Logs
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track real phone calls made by RMs to partners and customers. Verify actual talk time, identify missed calls, and audit follow-up compliance in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition active:scale-95"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh Calls
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Calls</span>
            <PhoneCall size={18} className="text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-blue-900">{stats.totalCalls}</div>
          <div className="mt-1 text-xs text-blue-700 font-medium">Logged today / period</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Real Calls Verified</span>
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-900">{stats.verifiedCalls}</div>
          <div className="mt-1 text-xs text-emerald-700 font-medium">Duration &gt; 0s (baat hui)</div>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Total Talk Time</span>
            <Clock size={18} className="text-purple-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-purple-900">{stats.totalDurationMinutes} min</div>
          <div className="mt-1 text-xs text-purple-700 font-medium">Cumulative minutes</div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Missed Calls</span>
            <PhoneMissed size={18} className="text-red-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-red-900">{stats.missedCalls}</div>
          <div className="mt-1 text-xs text-red-700 font-medium">Requires callback</div>
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
            <option value="all">All Call Types</option>
            <option value="OUTGOING">Outgoing</option>
            <option value="INCOMING">Incoming</option>
            <option value="MISSED">Missed Calls</option>
            <option value="REJECTED">Rejected</option>
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

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <AppAntTable
          rowKey="_id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{ emptyText: "No call logs found for the selected filters" }}
        />
      </div>
    </div>
  );
}
