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
    e.preventDefault();
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
      list = list.filter(
        (i) =>
          i.customerName?.toLowerCase().includes(q) ||
          i.phone?.includes(q) ||
          i.city?.toLowerCase().includes(q) ||
          i.loanType?.toLowerCase().includes(q) ||
          i.partnerName?.toLowerCase().includes(q) ||
          i.appNo?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [items, activeFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* 5 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`rounded-xl border p-3.5 text-left transition ${
            activeFilter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-800"
              : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Customers</div>
          <div className="text-2xl font-black mt-1">{summary.total}</div>
          <div className="text-[10px] mt-0.5 opacity-70">Assigned / In-House</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("filled")}
          className={`rounded-xl border p-3.5 text-left transition ${
            activeFilter === "filled"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600"
              : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Form Filled</div>
          <div className="text-2xl font-black mt-1">{summary.formFilled}</div>
          <div className="text-[10px] mt-0.5 opacity-80">Applications submitted</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("incomplete")}
          className={`rounded-xl border p-3.5 text-left transition ${
            activeFilter === "incomplete"
              ? "bg-amber-700 text-white border-amber-700 shadow-md ring-2 ring-amber-600"
              : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Form Incomplete</div>
          <div className="text-2xl font-black mt-1">{summary.formIncomplete}</div>
          <div className="text-[10px] mt-0.5 opacity-80">Drop-off / In progress</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("docs")}
          className={`rounded-xl border p-3.5 text-left transition ${
            activeFilter === "docs"
              ? "bg-orange-700 text-white border-orange-700 shadow-md ring-2 ring-orange-600"
              : "bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Docs Pending</div>
          <div className="text-2xl font-black mt-1">{summary.docsPending}</div>
          <div className="text-[10px] mt-0.5 opacity-80">Needs follow-up call</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("called_today")}
          className={`col-span-2 sm:col-span-1 rounded-xl border p-3.5 text-left transition ${
            activeFilter === "called_today"
              ? "bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-600"
              : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Called Today</div>
          <div className="text-2xl font-black mt-1">{summary.calledToday}</div>
          <div className="text-[10px] mt-0.5 opacity-80">Target progress</div>
        </button>
      </div>

      {/* Toolbar: Search + Refresh */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, phone, loan type, partner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <button
          type="button"
          onClick={fetchCustomerFollowUps}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Customers
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Customer Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading customer follow-ups...</div>
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
                  <th className="p-3">Source / Partner</th>
                  <th className="p-3">Form Progress</th>
                  <th className="p-3">Call Status</th>
                  <th className="p-3">Last Call</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Customer */}
                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-sm">{c.customerName}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-xs">
                        <span>{c.phone}</span>
                        {c.city && <span>• {c.city}</span>}
                      </div>
                      <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
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
                      <span className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-lg border ${
                        String(c.partnerName).includes("Meta") || String(c.leadSource).includes("Meta")
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : String(c.partnerName).includes("Direct") || String(c.leadSource).includes("Direct")
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
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
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(c.followUpStatus)}`}>
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
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
                          title="Call Customer"
                        >
                          <PhoneCall size={14} />
                        </button>

                        <a
                          href={`https://wa.me/91${c.phone}?text=${encodeURIComponent(
                            `Hello ${c.customerName}, this is from DhanSource regarding your ${c.loanType} application (${c.appNo}). How may we assist you?`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition shadow-xs"
                          title="WhatsApp Customer"
                        >
                          <FaWhatsapp size={14} />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenModal(c)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition shadow-xs"
                          title="Update Status / Notes"
                        >
                          <Edit3 size={14} />
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

      {/* Update Follow-Up Status Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Update Customer Follow-Up</h3>
                <p className="text-xs text-slate-500">{selectedCustomer.customerName} ({selectedCustomer.phone})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Call / Lead Status:
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {FOLLOW_UP_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Remarks / Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Needs ₹5 Lakhs personal loan, agreed to send bank statement tomorrow morning..."
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingModal}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition shadow-md shadow-teal-500/20 flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save size={13} />
                  {savingModal ? "Saving..." : "Save Follow-Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
