import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  Phone,
  PhoneCall,
  Save,
  X,
  Calendar,
  Users,
  FileCheck2,
  FileX2,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Edit3,
  RefreshCw,
  Download,
  MapPin,
  TrendingUp,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import toast from "react-hot-toast";

const FOLLOW_UP_STATUS_OPTIONS = [
  "CONNECTED",
  "CALL_BACK_SCHEDULED",
  "INTERESTED",
  "DOCUMENTS_PENDING",
  "RINGING",
  "SWITCH_OFF",
  "NOT_REACHABLE",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
];

const QUICK_STATUS_PILLS = [
  { value: "CONNECTED", label: "Connected", tone: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  { value: "INTERESTED", label: "Interested", tone: "bg-blue-50 text-blue-800 border-blue-300" },
  { value: "DOCUMENTS_PENDING", label: "Docs Pending", tone: "bg-amber-50 text-amber-900 border-amber-300" },
  { value: "CALL_BACK_SCHEDULED", label: "Call Back", tone: "bg-purple-50 text-purple-800 border-purple-300" },
  { value: "RINGING", label: "Ringing / No Ans", tone: "bg-yellow-50 text-yellow-800 border-yellow-300" },
  { value: "NOT_REACHABLE", label: "Not Reachable", tone: "bg-rose-50 text-rose-800 border-rose-300" },
  { value: "NOT_INTERESTED", label: "Not Interested", tone: "bg-slate-100 text-slate-700 border-slate-300" },
];

const getStatusBadge = (status) => {
  const s = String(status || "").toUpperCase();
  if (s.includes("CONNECT") || s === "CONNECTED") {
    return "bg-emerald-50 text-emerald-800 border-emerald-300";
  }
  if (s.includes("CALLBACK") || s.includes("CALL_BACK")) {
    return "bg-purple-50 text-purple-800 border-purple-300";
  }
  if (s.includes("INTEREST") || s === "INTERESTED") {
    return "bg-blue-50 text-blue-800 border-blue-300";
  }
  if (s.includes("DOC") || s.includes("PENDING")) {
    return "bg-amber-50 text-amber-900 border-amber-300";
  }
  if (s.includes("RING") || s === "RINGING") {
    return "bg-yellow-50 text-yellow-800 border-yellow-300";
  }
  if (s.includes("SWITCH") || s.includes("REACHABLE")) {
    return "bg-rose-50 text-rose-800 border-rose-300";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};

function formatDuration(seconds = 0) {
  const sec = parseInt(seconds, 10) || 0;
  if (sec === 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function CustomerFollowUpTab({ rmId }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    formFilled: 0,
    formIncomplete: 0,
    docsPending: 0,
    calledToday: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'filled' | 'incomplete' | 'docs' | 'called_today'

  // Update modal state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalStatus, setModalStatus] = useState("CONNECTED");
  const [modalRemarks, setModalRemarks] = useState("");
  const [modalCallbackDate, setModalCallbackDate] = useState("");
  const [savingModal, setSavingModal] = useState(false);

  const getToken = () => {
    const auth = getAuthData();
    return auth.rmToken || auth.superAdminToken || auth.adminToken || auth.token || "";
  };

  const fetchCustomerFollowUps = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const url = rmId
        ? `${backendurl}/rm/customers-with-followup?rmId=${rmId}`
        : `${backendurl}/rm/customers-with-followup`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setItems(res.data.items || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch customer follow-ups:", err);
      setError(err.response?.data?.message || "Could not load customer follow-ups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerFollowUps();
  }, [rmId]);

  // Direct Call Handler: opens dialer & records call log with duration tracking
  const handleCallCustomer = async (customer) => {
    const phone = customer.phone;
    if (!phone) {
      toast.error("No phone number available");
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    const startTime = Date.now();

    // Trigger native dialer
    window.location.href = `tel:${cleanPhone}`;

    // Prompt after call completes
    setTimeout(async () => {
      const durationSec = Math.round((Date.now() - startTime) / 1000);
      try {
        const token = getToken();
        await axios.post(
          `${backendurl}/calls/log`,
          {
            targetPhone: cleanPhone,
            targetName: customer.customerName,
            contactType: "customer",
            callType: "OUTGOING",
            durationSeconds: durationSec > 5 ? durationSec : 0,
            source: "web_manual",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchCustomerFollowUps();
      } catch (e) {
        console.warn("Could not auto-log call:", e);
      }
    }, 1500);
  };

  const handleOpenModal = (customer) => {
    setSelectedCustomer(customer);
    setModalStatus(customer.followUpStatus || "CONNECTED");
    setModalRemarks(customer.remarks || "");
    setModalCallbackDate(
      customer.nextFollowUpDate
        ? new Date(customer.nextFollowUpDate).toISOString().slice(0, 16)
        : ""
    );
  };

  const handleSaveModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCustomer) return;
    setSavingModal(true);
    try {
      const token = getToken();
      await axios.post(
        `${backendurl}/rm/update-customer-followup/${selectedCustomer.id}`,
        {
          status: modalStatus,
          remarks: modalRemarks,
          nextFollowUpDate: modalCallbackDate || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Customer follow-up updated!");
      setSelectedCustomer(null);
      fetchCustomerFollowUps();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update follow-up");
    } finally {
      setSavingModal(false);
    }
  };

  // Filtered rows
  const filteredItems = useMemo(() => {
    let list = items;

    if (activeFilter === "filled") {
      list = list.filter((i) => i.formStatus === "FILLED");
    } else if (activeFilter === "incomplete") {
      list = list.filter((i) => i.formStatus !== "FILLED");
    } else if (activeFilter === "docs") {
      list = list.filter((i) => i.pendingDocsCount > 0);
    } else if (activeFilter === "called_today") {
      const todayStr = new Date().toISOString().slice(0, 10);
      list = list.filter(
        (i) => i.lastCallTime && new Date(i.lastCallTime).toISOString().slice(0, 10) === todayStr
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((i) => {
        const name = (i.customerName || "").toLowerCase();
        const phone = (i.phone || "").toLowerCase();
        const appNo = (i.appNo || "").toLowerCase();
        const loanType = (i.loanType || "").toLowerCase();
        const partner = (i.partnerName || "").toLowerCase();
        const leadSource = (i.leadSource || "").toLowerCase();
        const city = (i.city || "").toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          appNo.includes(q) ||
          loanType.includes(q) ||
          partner.includes(q) ||
          leadSource.includes(q) ||
          city.includes(q)
        );
      });
    }

    return list;
  }, [items, activeFilter, searchTerm]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 5 Summary Stat Cards — Mobile Swipeable Strip + Desktop Grid */}
      <div className="flex overflow-x-auto gap-2 pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`min-w-[125px] shrink-0 sm:min-w-0 sm:shrink rounded-xl border p-2.5 sm:p-3.5 text-left transition active:scale-[0.98] ${
            activeFilter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-800"
              : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-80 truncate">Total Leads</div>
          <div className="text-xl sm:text-2xl font-black mt-1">{summary.total}</div>
          <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-70 truncate">Assigned Direct Leads</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("filled")}
          className={`min-w-[125px] shrink-0 sm:min-w-0 sm:shrink rounded-xl border p-2.5 sm:p-3.5 text-left transition active:scale-[0.98] ${
            activeFilter === "filled"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600"
              : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-90 truncate">Form Filled</div>
          <div className="text-xl sm:text-2xl font-black mt-1">{summary.formFilled}</div>
          <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 truncate">Applications submitted</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("incomplete")}
          className={`min-w-[125px] shrink-0 sm:min-w-0 sm:shrink rounded-xl border p-2.5 sm:p-3.5 text-left transition active:scale-[0.98] ${
            activeFilter === "incomplete"
              ? "bg-amber-700 text-white border-amber-700 shadow-md ring-2 ring-amber-600"
              : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-90 truncate">Incomplete</div>
          <div className="text-xl sm:text-2xl font-black mt-1">{summary.formIncomplete}</div>
          <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 truncate">Drop-off / In progress</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("docs")}
          className={`min-w-[125px] shrink-0 sm:min-w-0 sm:shrink rounded-xl border p-2.5 sm:p-3.5 text-left transition active:scale-[0.98] ${
            activeFilter === "docs"
              ? "bg-orange-700 text-white border-orange-700 shadow-md ring-2 ring-orange-600"
              : "bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100"
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-90 truncate">Docs Pending</div>
          <div className="text-xl sm:text-2xl font-black mt-1">{summary.docsPending}</div>
          <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 truncate">Needs follow-up call</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("called_today")}
          className={`min-w-[125px] shrink-0 sm:min-w-0 sm:shrink rounded-xl border p-2.5 sm:p-3.5 text-left transition active:scale-[0.98] ${
            activeFilter === "called_today"
              ? "bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-600"
              : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-90 truncate">Called Today</div>
          <div className="text-xl sm:text-2xl font-black mt-1">{summary.calledToday}</div>
          <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 truncate">Target progress</div>
        </button>
      </div>

      {/* Toolbar: Search + Quick Mobile Filter Pills + Refresh */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, phone, loan type, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredItems.length}</strong> leads
          </span>
          <button
            type="button"
            onClick={fetchCustomerFollowUps}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition active:scale-95"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-teal-600" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MOBILE PHONE CALLING CARDS VIEW (Clean, Large Touch Targets, No Horizontal Scroll) */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs sm:text-sm">
            <RefreshCw size={24} className="animate-spin text-teal-600 mx-auto mb-2" />
            Loading direct customer follow-ups...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs sm:text-sm">
            No customers match these filters.
          </div>
        ) : (
          filteredItems.map((c) => {
            const cleanPhone = String(c.phone || "").replace(/\D/g, "").slice(-10);
            const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
              `Hello ${c.customerName || "Customer"}, this is from DhanSource Capital regarding your ${c.loanType || "Loan"} application (${c.appNo || "Lead"}). How may we assist you?`
            )}`;
            const isMeta = String(c.partnerName).includes("Meta") || String(c.leadSource).includes("Meta");
            const isDirect = String(c.partnerName).includes("Direct") || String(c.leadSource).includes("Direct");

            return (
              <div
                key={`mobile-lead-${c.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header: Customer Name + App ID + Source Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                        {c.customerName || "Customer"}
                      </h4>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {c.appNo || "LEAD"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                      <a
                        href={`tel:${cleanPhone}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCallCustomer(c);
                        }}
                        className="font-mono font-bold text-slate-800 hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        <Phone size={12} className="text-slate-400" />
                        <span>{c.phone}</span>
                      </a>
                      {c.city && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <MapPin size={11} className="text-slate-400" />
                          <span>{c.city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lead Source Badge */}
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider border shrink-0 ${
                      isMeta
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : isDirect
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isMeta ? "Meta Ads" : isDirect ? "Direct In-House" : c.partnerName}
                  </span>
                </div>

                {/* Details Strip: Loan Request & Form Progress */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Loan Request
                    </span>
                    <span className="font-bold text-slate-800 truncate block mt-0.5">
                      {c.loanType || "Loan"}
                    </span>
                    <span className="font-bold text-emerald-800 text-xs block">
                      {c.loanAmount > 0 ? `₹${c.loanAmount.toLocaleString("en-IN")}` : "Amount Not Set"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Form Progress
                    </span>
                    <div className="mt-0.5">
                      {c.formStatus === "FILLED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 size={13} />
                          Form Filled
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800">
                            <Clock size={12} />
                            Step {c.stepIndex} of 6
                          </span>
                          {c.pendingDocsCount > 0 && (
                            <span className="block text-[10px] text-orange-700 font-semibold mt-0.5">
                              {c.pendingDocsCount} docs pending
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call Status & Last Call Log Strip */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border truncate shrink-0 ${getStatusBadge(
                        c.followUpStatus
                      )}`}
                    >
                      {c.followUpStatus || "NEW"}
                    </span>
                    {c.remarks && (
                      <span className="text-[11px] text-slate-500 italic truncate" title={c.remarks}>
                        "{c.remarks}"
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {c.lastCallTime ? (
                      <div className="text-[11px] text-slate-600 font-mono">
                        <span>{formatDuration(c.lastCallDuration)}</span>
                        {c.isVerified && <span className="text-emerald-600 font-bold ml-1">✓ Real</span>}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Not called yet</span>
                    )}
                  </div>
                </div>

                {/* PROPER CALLING ACTION BUTTONS (Touch-friendly & High-contrast on mobile!) */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  {/* 1. Call Now Button (Primary Emerald) */}
                  <button
                    type="button"
                    onClick={() => handleCallCustomer(c)}
                    className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <PhoneCall size={14} className="shrink-0" />
                    <span>Call Now</span>
                  </button>

                  {/* 2. WhatsApp Button */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <FaWhatsapp size={15} className="text-emerald-600 shrink-0" />
                    <span>WhatsApp</span>
                  </a>

                  {/* 3. Update Status / Remarks Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenModal(c)}
                    className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Edit3 size={13} className="shrink-0 text-slate-600" />
                    <span>Update</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP / TABLET TABLE VIEW (Hidden on Mobile, Clean on Laptop/Desktop) */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <RefreshCw size={24} className="animate-spin text-teal-600 mx-auto mb-2" />
            Loading customer follow-ups...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No customers found in this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Customer & City</th>
                  <th className="p-3">Loan Request</th>
                  <th className="p-3">Source / Lead Origin</th>
                  <th className="p-3">Form Progress</th>
                  <th className="p-3">Call Status</th>
                  <th className="p-3">Last Call</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((c) => {
                  const cleanPhone = String(c.phone || "").replace(/\D/g, "").slice(-10);
                  const isMeta = String(c.partnerName).includes("Meta") || String(c.leadSource).includes("Meta");
                  const isDirect = String(c.partnerName).includes("Direct") || String(c.leadSource).includes("Direct");

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Customer */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{c.customerName}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-xs">
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallCustomer(c);
                            }}
                            className="hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                          >
                            <Phone size={12} className="text-slate-400" />
                            {c.phone}
                          </a>
                          {c.city && <span>• {c.city}</span>}
                        </div>
                        <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                          {c.appNo}
                        </span>
                      </td>

                      {/* Loan Request */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{c.loanType}</div>
                        <div className="text-slate-500 text-xs">
                          {c.loanAmount > 0 ? `₹${c.loanAmount.toLocaleString("en-IN")}` : "Amount Not Set"}
                        </div>
                      </td>

                      {/* Source / Lead Origin */}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-lg border ${
                            isMeta
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : isDirect
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {c.partnerName}
                        </span>
                      </td>

                      {/* Form Progress */}
                      <td className="p-3">
                        {c.formStatus === "FILLED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={12} />
                            Filled
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <Clock size={12} />
                              Step {c.stepIndex} of 6
                            </span>
                            {c.pendingDocsCount > 0 && (
                              <span className="block text-[11px] text-orange-700 font-medium mt-0.5">
                                {c.pendingDocsCount} docs pending
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Call Status */}
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            c.followUpStatus
                          )}`}
                        >
                          {c.followUpStatus || "NEW"}
                        </span>
                        {c.remarks && (
                          <div className="text-[11px] text-slate-500 mt-1 italic max-w-[150px] truncate" title={c.remarks}>
                            "{c.remarks}"
                          </div>
                        )}
                      </td>

                      {/* Last Call */}
                      <td className="p-3">
                        {c.lastCallTime ? (
                          <div className="text-xs">
                            <div className="font-mono text-slate-700">
                              {new Date(c.lastCallTime).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                              {new Date(c.lastCallTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px] text-slate-500">
                              <span>{formatDuration(c.lastCallDuration)}</span>
                              {c.isVerified && <span className="text-emerald-600 font-bold">✓ Real Call</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not called yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCallCustomer(c)}
                            className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition shadow-xs flex items-center gap-1 font-bold text-xs"
                            title="Call Customer"
                          >
                            <PhoneCall size={13} />
                            <span>Call</span>
                          </button>

                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              `Hello ${c.customerName}, this is from DhanSource regarding your ${c.loanType} application (${c.appNo}). How may we assist you?`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition shadow-xs flex items-center gap-1 font-bold text-xs"
                            title="WhatsApp Customer"
                          >
                            <FaWhatsapp size={14} className="text-emerald-600" />
                            <span>Chat</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenModal(c)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition shadow-xs flex items-center gap-1 font-bold text-xs"
                            title="Update Status / Notes"
                          >
                            <Edit3 size={13} />
                            <span>Log</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE-OPTIMIZED OUTCOME / FOLLOW-UP MODAL (Bottom-sheet on mobile) */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Call Outcome</h3>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.customerName} • {selectedCustomer.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              {/* Quick 1-Tap Status Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Select Call Status (Tap one):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_STATUS_PILLS.map((pill) => {
                    const isSelected = modalStatus === pill.value;
                    return (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => setModalStatus(pill.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          isSelected
                            ? "bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-500/30"
                            : `${pill.tone} hover:opacity-90`
                        }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Callback date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Next Callback Schedule (Optional):
                </label>
                <input
                  type="datetime-local"
                  value={modalCallbackDate}
                  onChange={(e) => setModalCallbackDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Call Remarks / Customer Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Customer needs ₹5 Lakhs personal loan for business expansion, agreed to submit bank statement..."
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Direct Actions Inside Modal */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <a
                  href={`tel:${String(selectedCustomer.phone).replace(/\D/g, "").slice(-10)}`}
                  onClick={() => handleCallCustomer(selectedCustomer)}
                  className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 active:scale-95"
                >
                  <PhoneCall size={13} className="text-emerald-600" />
                  <span>Redial</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingModal}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition shadow-md shadow-teal-500/20 flex items-center gap-1.5 disabled:opacity-60 active:scale-95"
                  >
                    <Save size={13} />
                    {savingModal ? "Saving..." : "Save Outcome"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
