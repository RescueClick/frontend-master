import React, { useEffect, useState } from "react";
import { User, Phone, Mail, Star } from "lucide-react";
import axios from "axios";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";

const COLORS = {
  primary: "#12B99C",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

const statusStyle = {
  New: {
    gradient: "from-[#12B99C] to-[#5EEAD4]",
    badge: "bg-[#E0F7F4] text-[#12B99C] border border-[#BBF7F0]",
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

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [activeStatus, setActiveStatus] = useState("New");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map actual app statuses to UI tabs
  // Note: DRAFT is normalized to SUBMITTED, but we include both for backward compatibility
  const STATUS_MAPPING = {
    New: ["DRAFT", "SUBMITTED"], // DRAFT will be normalized to SUBMITTED in display
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

  // Extract UI tabs from mapping keys
  const statuses = Object.keys(STATUS_MAPPING);

  // Fetch leads from API
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/rm/customers`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });

      // Map API response to desired format
      const mappedLeads = response.data.map((app) => ({
        id: app.applicationId,
        name: app.customerName,
        email: app.email,
        phone: app.contact,
        status: app.status,
        score: Math.floor(Math.random() * 21) + 80, // example score 80-100
        loanType: app.loanType,
        requestedAmount: app.requestedAmount,
        approvedAmount: app.approvedAmount,
        partnerName: app.partner?.name || "",
        partnerEmail: app.partner?.email || "",
        partnerPhone: app.partner?.phone || "",
      }));

      setLeads(mappedLeads);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filter leads by active status
  // const filteredLeads = leads.filter((lead) => lead?.status === activeStatus);
  const filteredLeads = leads.filter((lead) =>
    STATUS_MAPPING[activeStatus]?.includes(lead.status)
  );

  // Count leads for each status
  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] = leads.filter((lead) =>
      STATUS_MAPPING[status]?.includes(lead.status)
    ).length;
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen py-10 px-4 md:px-10"
      style={{ background: COLORS.background }}
    >
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1
            className="text-4xl md:text-3xl font-extrabold"
            style={{ color: COLORS.primary, letterSpacing: "-0.03em" }}
          >
            Leads Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and track your finance leads effectively
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 items-center">
          <span
            className="px-4 py-2 rounded-full font-bold shadow-lg"
            style={{ background: COLORS.primary, color: "#fff" }}
          >
            {leads.length}
          </span>
          <span className="font-medium" style={{ color: COLORS.text }}>
            Total Leads
          </span>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`cursor-pointer px-5 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${
              activeStatus === status
                ? `bg-gradient-to-r ${statusStyle[status].gradient} text-white shadow-lg`
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {status}{" "}
            <span className="bg-white text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="text-center text-gray-500">Loading leads...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : filteredLeads.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center h-40 text-gray-400 italic">
          No {activeStatus} leads available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex items-center gap-2 font-semibold"
                  style={{ color: COLORS.text }}
                >
                  <User style={{ color: COLORS.primary }} className="w-5 h-5" />
                  {lead.name}
                </div>
                <span
                  className={`inline-block px-3 py-1 mb-2 rounded-full text-xs font-semibold ${statusStyle[activeStatus].badge}`}
                >
                  {lead.status}
                </span>
              </div>

              <div
                className="mt-2 text-sm space-y-1"
                style={{ color: COLORS.text, opacity: 0.8 }}
              >
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: COLORS.primary }} />{" "}
                  {lead.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone
                    className="w-4 h-4"
                    style={{ color: COLORS.primary }}
                  />{" "}
                  {lead.phone}
                </p>
                <p className="text-xs text-gray-500">
                  Loan: {lead.loanType}, Requested: {lead.requestedAmount},
                  Approved: {lead.approvedAmount}
                </p>
                <p className="text-xs text-gray-500">
                  Partner: {lead.partnerName} ({lead.partnerEmail})
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leads;
