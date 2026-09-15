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

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [activeStatus, setActiveStatus] = useState("New Leads");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Follow-up modal state
  const [selectedLead, setSelectedLead] = useState(null);
  const [followUpStatus, setFollowUpStatus] = useState("CONNECTED");
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [notifyPartnerOnSave, setNotifyPartnerOnSave] = useState(true);
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [nudgingPartnerId, setNudgingPartnerId] = useState(null);

  // Map actual app statuses to UI tabs
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

  const loanTypeFormPath = (loanType) => {
    const map = {
      PERSONAL: "/partner/personal-loan",
      BUSINESS: "/partner/business-loan",
      HOME_LOAN_SALARIED: "/partner/home-loan-salaried",
      HOME_LOAN_SELF_EMPLOYED: "/partner/home-loan-self-employed",
      LAP_SALARIED: "/partner/lap-loan-salaried",
      LAP_SELF_EMPLOYED: "/partner/lap-loan-self-employed",
      LAP: "/partner/lap-loan-salaried",
    };
    return map[String(loanType || "").toUpperCase()] || "/partner/get-loan";
  };

  // Fetch leads from API
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/rm/customers`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });

      const mappedLeads = response.data.map((app) => ({
        id: app.applicationId,
        appNo: app.appNo || "N/A",
        name: app.customerName || "Customer",
        email: app.email,
        phone: app.contact,
        status: app.status,
        createdAt: app.createdAt,
        loanType: app.loanType,
        requestedAmount: app.requestedAmount,
        approvedAmount: app.approvedAmount,
        hasRunningLoan: app.hasRunningLoan || "NO",
        monthlyEmiPaying: app.monthlyEmiPaying || 0,
        loanPurpose: app.loanPurpose || "",
        leadSource: app.leadSource || "PARTNER",
        leadFollowUp: app.leadFollowUp || { status: "NEW", remarks: "" },
        partnerName: app.partner?.name || "",
        partnerCode: app.partner?.code || "",
        partnerEmail: app.partner?.email || "",
        partnerPhone: app.partner?.phone || "",
        partnerId: app.partner?.partnerId || null,
      }));

      setLeads(mappedLeads);
    } catch (err) {
      console.error("Error fetching customers/leads:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leads"
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
    setNotifyPartnerOnSave(lead.leadSource === "PARTNER" && Boolean(lead.partnerPhone || lead.partnerId));
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
    setNotifyPartnerOnSave(true);
  };

  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    setSubmittingFollowUp(true);
    try {
      const { rmToken } = getAuthData();
      const { data } = await axios.post(
        `${backendurl}/leads/${selectedLead.id}/follow-up`,
        {
          status: followUpStatus,
          remarks: followUpRemarks,
          nextFollowUpDate: nextFollowUpDate || null,
          notifyPartner: Boolean(notifyPartnerOnSave && selectedLead.leadSource === "PARTNER"),
        },
        {
          headers: { Authorization: `Bearer ${rmToken}` },
        }
      );

      toast.success(data?.message || "Follow-up updated successfully!");
      closeFollowUpModal();
      fetchLeads();
    } catch (err) {
      console.error("Failed to update follow-up:", err);
      toast.error(err.response?.data?.message || "Failed to save follow-up");
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleAskPartnerCompleteForm = async (lead) => {
    if (!lead?.id) return;
    setNudgingPartnerId(lead.id);
    try {
      const { rmToken } = getAuthData();
      const { data } = await axios.post(
        `${backendurl}/leads/${lead.id}/nudge-partner`,
        {
          remarks: `Please complete the ${loanTypeToTableShort(lead.loanType)} form for ${lead.name} (App ${lead.appNo}).`,
        },
        { headers: { Authorization: `Bearer ${rmToken}` } }
      );
      toast.success(data?.message || "Partner notified to complete the form");
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to notify partner");
    } finally {
      setNudgingPartnerId(null);
    }
  };

  const buildPartnerWhatsAppUrl = (lead) => {
    const phone = String(lead.partnerPhone || "").replace(/\D/g, "");
    if (!phone) return null;
    const waNumber = phone.length === 10 ? `91${phone}` : phone;
    const formHint = `${window.location.origin}${loanTypeFormPath(lead.loanType)}?applicationId=${lead.id}`;
    const msg =
      `Hello ${lead.partnerName || "Partner"}, this is your DhanSource RM. ` +
      `Please complete the ${loanTypeToTableShort(lead.loanType)} application for customer ${lead.name} ` +
      `(App ${lead.appNo}). Resume here: ${formHint}`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  };

  const filteredLeads = leads.filter((lead) =>
    STATUS_MAPPING[activeStatus]?.includes(lead.status)
  );

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
            Leads & Pipeline
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Track and follow up with step-1 leads and applications across your partners
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span
            className="px-4 py-1.5 rounded-full font-bold shadow-md text-sm"
            style={{ background: COLORS.primary, color: "#fff" }}
          >
            {leads.length}
          </span>
          <span className="font-semibold text-sm" style={{ color: COLORS.text }}>
            Total Pipeline
          </span>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeStatus === status
                ? `bg-gradient-to-r ${statusStyle[status].gradient} text-white shadow-md`
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {status}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeStatus === status
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 font-medium">Loading leads...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 font-medium">{error}</div>
      ) : sortedFilteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
          <AlertCircle className="w-10 h-10 mb-2 text-gray-300" />
          <p className="font-medium">No {activeStatus} found.</p>
          <p className="text-xs text-gray-400 mt-1">Leads captured at Step 1 will appear here immediately.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFilteredLeads.map((lead) => {
            const cleanPhoneDigits = String(lead.phone || "").replace(/\D/g, "");
            const waNumber = cleanPhoneDigits.length === 10 ? `91${cleanPhoneDigits}` : cleanPhoneDigits;
            const waMessage = `Hello ${lead.name}, this is your DhanSource Relationship Manager regarding your ${loanTypeToTableShort(lead.loanType)} inquiry. How can I assist you with your application?`;
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
            const isPartnerLead = lead.status === "LEAD" && lead.leadSource === "PARTNER";
            const partnerWaUrl = isPartnerLead ? buildPartnerWhatsAppUrl(lead) : null;

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Name, AppNo, Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-600" />
                        {lead.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">App No: {lead.appNo}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        statusStyle[activeStatus]?.badge || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {lead.status === "LEAD" ? "⚡ Step 1 Lead" : lead.status}
                    </span>
                  </div>

                  {/* Loan & Amount Details */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Loan Type:</span>
                      <span className="font-semibold text-gray-900">
                        {loanTypeToTableShort(lead.loanType)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Req. Amount:</span>
                      <span className="font-semibold text-emerald-700">
                        {lead.requestedAmount ? `₹${Number(lead.requestedAmount).toLocaleString("en-IN")}` : "Not specified"}
                      </span>
                    </div>

                    {/* NEW Step 1 Fields */}
                    <div className="pt-2 mt-2 border-t border-gray-200/60 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          Running Loan:
                        </span>
                        <span className="font-medium text-gray-800">
                          {lead.hasRunningLoan === "YES" ? (
                            <span className="text-amber-700 font-semibold">
                              Yes (₹{Number(lead.monthlyEmiPaying || 0).toLocaleString("en-IN")}/mo)
                            </span>
                          ) : (
                            <span className="text-gray-600">No</span>
                          )}
                        </span>
                      </div>

                      {lead.loanPurpose && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-gray-400" />
                            Purpose:
                          </span>
                          <span className="font-medium text-gray-800 truncate max-w-[140px]" title={lead.loanPurpose}>
                            {lead.loanPurpose}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <a href={`tel:${lead.phone}`} className="hover:underline font-medium text-gray-800">
                        {lead.phone || "N/A"}
                      </a>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{lead.email || "N/A"}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                      <Building className="w-3.5 h-3.5 text-gray-400" />
                      Source:{" "}
                      <span className="font-medium text-gray-700">
                        {lead.leadSource === "PARTNER"
                          ? `Partner (${lead.partnerName || "Partner"})`
                          : "Direct Customer"}
                      </span>
                    </p>
                  </div>

                  {isPartnerLead && (
                    <div className="mb-3 p-2.5 rounded-lg border border-teal-200 bg-teal-50 text-[11px] text-teal-900">
                      <p className="font-semibold">Partner lead — RM action</p>
                      <p className="mt-0.5 text-teal-800">
                        Ask the partner to complete the remaining loan form steps for this customer.
                      </p>
                    </div>
                  )}

                  {/* Last Follow-up info */}
                  {lead.leadFollowUp && (
                    <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2 mb-3 text-[11px] text-amber-900">
                      <div className="flex justify-between font-semibold">
                        <span>Follow-up: {lead.leadFollowUp.status || "NEW"}</span>
                        {lead.leadFollowUp.nextFollowUpDate && (
                          <span className="text-amber-700">
                            Due: {new Date(lead.leadFollowUp.nextFollowUpDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {lead.leadFollowUp.remarks && (
                        <p className="text-amber-800 italic mt-0.5 truncate">
                          "{lead.leadFollowUp.remarks}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {isPartnerLead && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAskPartnerCompleteForm(lead)}
                        disabled={nudgingPartnerId === lead.id}
                        className="flex-1 min-w-[140px] cursor-pointer px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
                      >
                        {nudgingPartnerId === lead.id ? "Sending..." : "Ask partner to complete form"}
                      </button>
                      {partnerWaUrl && (
                        <a
                          href={partnerWaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100"
                          title="WhatsApp partner"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Partner WA
                        </a>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Call Customer"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                          title="Chat on WhatsApp (Customer)"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => openFollowUpModal(lead)}
                      className="cursor-pointer px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Follow Up
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Follow-up Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={closeFollowUpModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Lead Follow-Up
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {selectedLead.name} • {selectedLead.phone} • {loanTypeToTableShort(selectedLead.loanType)}
            </p>

            <form onSubmit={handleSaveFollowUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Call / Follow-Up Status *
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
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
                  Follow-Up Remarks & Notes
                </label>
                <textarea
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  placeholder="e.g. Customer interested in ₹5L personal loan. Requested callback tomorrow evening with bank statement."
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Next Follow-Up Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {selectedLead.leadSource === "PARTNER" && selectedLead.status === "LEAD" && (
                <label className="flex items-start gap-2 text-xs text-gray-700 bg-teal-50 border border-teal-200 rounded-xl p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={notifyPartnerOnSave}
                    onChange={(e) => setNotifyPartnerOnSave(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-teal-900">Notify partner to complete form</span>
                    <span className="block text-teal-800 mt-0.5">
                      Sends an in-app alert (and is recommended when status is Documents Pending / Interested).
                    </span>
                  </span>
                </label>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeFollowUpModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFollowUp}
                  className="cursor-pointer px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
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
};

export default Leads;
