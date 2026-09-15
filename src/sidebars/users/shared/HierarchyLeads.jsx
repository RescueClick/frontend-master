import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Building,
  Clock,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
  X,
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
};

function getManagerToken() {
  const auth = getAuthData();
  return (
    auth?.asmToken ||
    auth?.rsmToken ||
    auth?.adminToken ||
    auth?.token ||
    ""
  );
}

function hoursAgo(dateVal) {
  if (!dateVal) return null;
  const ms = Date.now() - new Date(dateVal).getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / (60 * 60 * 1000));
}

function ageLabel(dateVal) {
  const h = hoursAgo(dateVal);
  if (h == null) return "—";
  if (h < 1) return "<1h";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * ASM / RSM view of open LEADs under their RMs.
 * Managers monitor & nudge RMs so partners complete the loan form.
 */
export default function HierarchyLeads() {
  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState({
    openLeads: 0,
    partnerLeads: 0,
    agingOver48h: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rmFilter, setRmFilter] = useState("");
  const [agingOnly, setAgingOnly] = useState(false);

  const [nudgeLead, setNudgeLead] = useState(null);
  const [nudgeRemarks, setNudgeRemarks] = useState("");
  const [nudgingId, setNudgingId] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getManagerToken();
      if (!token) {
        setError("Session expired. Please log in again.");
        setLeads([]);
        return;
      }
      const response = await axios.get(`${backendurl}/leads/hierarchy`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = Array.isArray(response.data?.items)
        ? response.data.items
        : [];
      setLeads(items);
      setSummary(
        response.data?.summary || {
          openLeads: items.length,
          partnerLeads: items.filter((i) => i.leadSource === "PARTNER").length,
          agingOver48h: items.filter(
            (i) => hoursAgo(i.createdAt) > 48
          ).length,
        }
      );
    } catch (err) {
      console.error("Error fetching hierarchy leads:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leads"
      );
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const rmOptions = useMemo(() => {
    const map = new Map();
    leads.forEach((lead) => {
      const id = lead.rm?.id ? String(lead.rm.id) : "";
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: lead.rm?.name || "RM",
          employeeId: lead.rm?.employeeId || "",
          count: 0,
        });
      }
      map.get(id).count += 1;
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return leads.filter((lead) => {
      if (rmFilter && String(lead.rm?.id || "") !== rmFilter) return false;
      if (agingOnly && !(hoursAgo(lead.createdAt) > 48)) return false;
      if (!term) return true;
      const hay = [
        lead.customerName,
        lead.customerPhone,
        lead.appNo,
        lead.partner?.name,
        lead.partner?.code,
        lead.rm?.name,
        lead.rm?.employeeId,
        lead.loanType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [leads, searchTerm, rmFilter, agingOnly]);

  const sortedLeads = sortNewestFirst(filteredLeads, {
    dateKeys: ["createdAt", "updatedAt"],
  });

  const openNudgeModal = (lead) => {
    setNudgeLead(lead);
    setNudgeRemarks(
      "Please follow up with the partner and get the loan form completed."
    );
  };

  const closeNudgeModal = () => {
    setNudgeLead(null);
    setNudgeRemarks("");
  };

  const handleNudgeRm = async (e) => {
    e.preventDefault();
    if (!nudgeLead?.id && !nudgeLead?.applicationId) return;

    const id = nudgeLead.id || nudgeLead.applicationId;
    setNudgingId(id);
    try {
      const token = getManagerToken();
      await axios.post(
        `${backendurl}/leads/${id}/nudge-rm`,
        { remarks: nudgeRemarks.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        `RM ${nudgeLead.rm?.name || ""} notified to progress this lead`.trim()
      );
      closeNudgeModal();
      fetchLeads();
    } catch (err) {
      console.error("Failed to nudge RM:", err);
      toast.error(err.response?.data?.message || "Failed to notify RM");
    } finally {
      setNudgingId(null);
    }
  };

  return (
    <div
      className="min-h-screen py-8 px-4 md:px-10"
      style={{ background: COLORS.background }}
    >
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className="text-3xl md:text-4xl font-extrabold"
            style={{ color: COLORS.primary, letterSpacing: "-0.03em" }}
          >
            Leads & Pipeline
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Open step-1 leads under your RMs — follow up so partners complete
            the form
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLeads}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow transition-all self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-amber-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Open leads
          </p>
          <p className="text-3xl font-extrabold text-amber-800 mt-1">
            {summary.openLeads}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-teal-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            Partner leads
          </p>
          <p className="text-3xl font-extrabold text-teal-800 mt-1">
            {summary.partnerLeads}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
            Aging &gt; 48h
          </p>
          <p className="text-3xl font-extrabold text-rose-800 mt-1">
            {summary.agingOver48h}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer, partner, RM, app no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-gray-800"
          />
        </div>
        <select
          value={rmFilter}
          onChange={(e) => setRmFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All RMs</option>
          {rmOptions.map((rm) => (
            <option key={rm.id} value={rm.id}>
              {rm.name}
              {rm.employeeId ? ` (${rm.employeeId})` : ""} — {rm.count}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agingOnly}
            onChange={(e) => setAgingOnly(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          Aging &gt; 48h only
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : sortedLeads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold text-lg">
            No open leads to follow up
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Step-1 LEADs under your RMs will appear here until the form is
            completed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedLeads.map((lead) => {
            const aging = hoursAgo(lead.createdAt) > 48;
            const followStatus = lead.leadFollowUp?.status || "NEW";
            return (
              <div
                key={lead.id || lead.applicationId}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 ${
                  aging ? "border-rose-200" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      {lead.appNo || "—"}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                      {lead.customerName || "Customer"}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                      aging
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    LEAD · {ageLabel(lead.createdAt)}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  {lead.customerPhone ? (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {lead.customerPhone}
                    </p>
                  ) : null}
                  <p className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    {loanTypeToTableShort(lead.loanType) || lead.loanType || "—"}
                    {lead.requestedAmount
                      ? ` · ₹${Number(lead.requestedAmount).toLocaleString("en-IN")}`
                      : ""}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Partner:{" "}
                    <span className="font-semibold text-gray-800">
                      {lead.partner?.name || "—"}
                      {lead.partner?.code ? ` (${lead.partner.code})` : ""}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    RM:{" "}
                    <span className="font-semibold text-gray-800">
                      {lead.rm?.name || "Unassigned"}
                      {lead.rm?.employeeId ? ` · ${lead.rm.employeeId}` : ""}
                    </span>
                  </p>
                  {lead.rm?.phone ? (
                    <p className="flex items-center gap-2 pl-5 text-xs text-gray-500">
                      RM phone: {lead.rm.phone}
                    </p>
                  ) : null}
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    Follow-up:{" "}
                    <span className="font-semibold text-gray-800">
                      {followStatus.replace(/_/g, " ")}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openNudgeModal(lead)}
                  disabled={!lead.rm?.id}
                  className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold shadow transition-all"
                >
                  <Bell className="w-4 h-4" />
                  Ask RM to follow up
                </button>
              </div>
            );
          })}
        </div>
      )}

      {nudgeLead ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              type="button"
              onClick={closeNudgeModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Ask RM to progress lead
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Notify{" "}
              <span className="font-semibold text-gray-800">
                {nudgeLead.rm?.name || "RM"}
              </span>{" "}
              to get{" "}
              <span className="font-semibold text-gray-800">
                {nudgeLead.appNo || "this lead"}
              </span>{" "}
              form filled.
            </p>
            <form onSubmit={handleNudgeRm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Message to RM
                </label>
                <textarea
                  value={nudgeRemarks}
                  onChange={(e) => setNudgeRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Please follow up with the partner..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeNudgeModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!nudgingId}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {nudgingId ? "Sending..." : "Send nudge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
