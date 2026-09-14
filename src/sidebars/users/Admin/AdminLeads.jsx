import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Target,
  Clock,
  MessageCircle,
  PhoneCall,
  Save,
  X,
  Building,
  CheckCircle,
  AlertCircle,
  Search,
  Users,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";

const COLORS = {
  primary: "var(--color-brand-primary)",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

const statusStyle = {
  "New Leads": {
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-50 text-amber-800 border border-amber-300",
  },
  New: {
    gradient: "from-teal-600 to-emerald-500",
    badge: "bg-[#E0F7F4] text-teal-800 border border-[#BBF7F0]",
  },
  InProcess: {
    gradient: "from-[#111827] to-[#4B5563]",
    badge: "bg-[#E5E7EB] text-[#111827] border border-[#D1D5DB]",
  },
  Disbursed: {
    gradient: "from-[#27AE60] to-[#6EE7B7]",
    badge: "bg-[#E7FBEF] text-[#27AE60] border border-[#BDF4D5]",
  },
  Rejected: {
    gradient: "from-[#DC2626] to-[#F87171]",
    badge: "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]",
  },
};

const FOLLOW_UP_OPTIONS = [
  "NEW",
  "CONNECTED",
  "RINGING",
  "FOLLOW_UP_SCHEDULED",
  "INTERESTED",
  "DOCUMENTS_PENDING",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
  "LOST",
];

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [activeStatus, setActiveStatus] = useState("New Leads");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Follow-up modal state
  const [selectedLead, setSelectedLead] = useState(null);
  const [followUpStatus, setFollowUpStatus] = useState("CONNECTED");
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  const STATUS_MAPPING = {
    "New Leads": ["LEAD"],
    New: ["DRAFT", "SUBMITTED"],
    InProcess: [
      "DOC_INCOMPLETE",
      "DOC_COMPLETE",
      "DOC_SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "AGREEMENT",
    ],
    Disbursed: ["DISBURSED"],
    Rejected: ["REJECTED"],
  };

  const statuses = Object.keys(STATUS_MAPPING);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/leads/admin`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const rawList = response.data?.leads || [];
      const mappedLeads = rawList.map((app) => ({
        id: app._id,
        appNo: app.appNo || "N/A",
        name:
          [app.customer?.firstName, app.customer?.lastName]
            .filter(Boolean)
            .join(" ") || "Customer",
        email: app.customer?.email || "",
        phone: app.customer?.phone || "",
        status: app.status,
        createdAt: app.createdAt,
        loanType: app.loanType,
        requestedAmount: app.loanAmount || app.customer?.loanAmount || 0,
        approvedAmount: app.approvedAmount,
        hasRunningLoan: app.hasRunningLoan || app.customer?.hasRunningLoan || "NO",
        monthlyEmiPaying: app.monthlyEmiPaying || app.customer?.monthlyEmiPaying || 0,
        loanPurpose: app.loanPurpose || app.customer?.loanPurpose || "",
        leadSource: app.leadSource || "PARTNER",
        leadFollowUp: app.leadFollowUp || { status: "NEW", remarks: "" },
        partnerName:
          [app.partner?.firstName, app.partner?.lastName].filter(Boolean).join(" ") ||
          app.partner?.partnerName ||
          "",
        partnerCode: app.partner?.partnerCode || app.partner?.referralCode || "",
        rmName:
          [app.assignedRM?.firstName, app.assignedRM?.lastName].filter(Boolean).join(" ") ||
          app.assignedRM?.name ||
          "Unassigned",
        rmPhone: app.assignedRM?.phone || "",
        rmCode: app.assignedRM?.employeeId || app.assignedRM?.rmCode || "",
      }));

      setLeads(mappedLeads);
    } catch (err) {
      console.error("Error fetching admin leads:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch leads"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const openFollowUpModal = (lead) => {
    setSelectedLead(lead);
    setFollowUpStatus(lead.leadFollowUp?.status || "CONNECTED");
    setFollowUpRemarks(lead.leadFollowUp?.remarks || "");
    if (lead.leadFollowUp?.nextFollowUpDate) {
      const d = new Date(lead.leadFollowUp.nextFollowUpDate);
      setNextFollowUpDate(d.toISOString().slice(0, 16));
    } else {
      setNextFollowUpDate("");
    }
  };

  const closeFollowUpModal = () => {
    setSelectedLead(null);
    setFollowUpStatus("CONNECTED");
    setFollowUpRemarks("");
    setNextFollowUpDate("");
  };

  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    setSubmittingFollowUp(true);
    try {
      const { adminToken } = getAuthData();
      await axios.post(
        `${backendurl}/leads/${selectedLead.id}/follow-up`,
        {
          status: followUpStatus,
          remarks: followUpRemarks,
          nextFollowUpDate: nextFollowUpDate || null,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      toast.success("Follow-up updated successfully!");
      closeFollowUpModal();
      fetchLeads();
    } catch (err) {
      console.error("Failed to update follow-up:", err);
      toast.error(err.response?.data?.message || "Failed to save follow-up");
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const filteredLeads = leads
    .filter((lead) => STATUS_MAPPING[activeStatus]?.includes(lead.status))
    .filter((lead) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(term) ||
        lead.phone?.includes(term) ||
        lead.appNo?.toLowerCase().includes(term) ||
        lead.partnerName?.toLowerCase().includes(term) ||
        lead.partnerCode?.toLowerCase().includes(term) ||
        lead.rmName?.toLowerCase().includes(term)
      );
    });

  const sortedFilteredLeads = sortNewestFirst(filteredLeads, {
    dateKeys: ["createdAt"],
  });

  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] = leads.filter((lead) =>
      STATUS_MAPPING[status]?.includes(lead.status)
    ).length;
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen py-8 px-4 md:px-10"
      style={{ background: COLORS.background }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className="text-3xl md:text-4xl font-extrabold"
            style={{ color: COLORS.primary, letterSpacing: "-0.03em" }}
          >
            Leads & Follow-ups
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Track all step-1 leads across partners, customers, and assigned Relationship Managers
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
            Total Leads: {leads.filter((l) => l.status === "LEAD").length}
          </span>
          <button
            onClick={fetchLeads}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 max-w-md relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer, phone, partner, RM..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-gray-800"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
              activeStatus === status
                ? "bg-gradient-to-r from-teal-700 to-teal-900 text-white shadow-md scale-105"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <span>{status}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                activeStatus === status
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : sortedFilteredLeads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold text-lg">No records found in {activeStatus}</p>
          <p className="text-gray-400 text-sm mt-1">New step-1 submissions will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFilteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                      <User className="w-4 h-4 text-teal-600" />
                      {lead.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      Ref: {lead.appNo}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                      statusStyle[activeStatus]?.badge || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-gray-600 mb-4 pb-3 border-b border-gray-100">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{lead.phone || "N/A"}</span>
                  </p>
                  {lead.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{lead.email}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </p>
                </div>

                {/* Financial Lead Details */}
                <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-200/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Loan Type:</span>
                    <span className="font-bold text-gray-800">
                      {loanTypeToTableShort(lead.loanType)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Req. Amount:</span>
                    <span className="font-bold text-teal-700">
                      ₹{lead.requestedAmount?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Running Loan:</span>
                    <span
                      className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
                        lead.hasRunningLoan === "YES"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {lead.hasRunningLoan === "YES" ? "YES" : "NO"}
                    </span>
                  </div>
                  {lead.hasRunningLoan === "YES" && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Monthly EMI:</span>
                      <span className="font-bold text-gray-900">
                        ₹{lead.monthlyEmiPaying?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {lead.loanPurpose && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Loan Purpose:</span>
                      <span className="font-bold text-gray-900 text-right truncate max-w-[150px]">
                        {lead.loanPurpose}
                      </span>
                    </div>
                  )}
                </div>

                {/* Assignment & Source */}
                <div className="text-[11px] text-gray-500 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Assigned RM:</span>
                    <span className="font-bold text-teal-700">
                      {lead.rmName} {lead.rmCode ? `(${lead.rmCode})` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Source:</span>
                    <span className="font-medium text-gray-700">
                      {lead.leadSource === "CUSTOMER_DIRECT"
                        ? "Direct Customer"
                        : lead.partnerName
                        ? `Partner: ${lead.partnerName}`
                        : "Partner Referral"}
                    </span>
                  </div>
                  {lead.leadFollowUp?.remarks && (
                    <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200/60 text-amber-900">
                      <span className="font-bold">Follow-up Note: </span>
                      {lead.leadFollowUp.remarks}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                {lead.phone && (
                  <>
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      title="Call Lead"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Call
                    </a>
                    <a
                      href={`https://wa.me/91${lead.phone.replace(/\D/g, "").slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      title="WhatsApp Lead"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </>
                )}
                <button
                  onClick={() => openFollowUpModal(lead)}
                  className="py-2 px-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  Follow-up
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Lead Follow-Up</h3>
                <p className="text-xs text-gray-500">
                  {selectedLead.name} ({selectedLead.phone})
                </p>
              </div>
              <button
                onClick={closeFollowUpModal}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Follow-Up Status *
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                >
                  {FOLLOW_UP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Next Callback Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Call Remarks / Discussion Notes *
                </label>
                <textarea
                  rows={3}
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  placeholder="E.g. Spoke with customer, needs 10L loan for shop renovation, running loan of 15k EMI, asked to call back tomorrow."
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeFollowUpModal}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFollowUp}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {submittingFollowUp ? "Saving..." : "Save Follow-Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
