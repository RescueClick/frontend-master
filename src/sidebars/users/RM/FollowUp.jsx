import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Edit3,
  Phone,
  Save,
  X,
  Calendar,
  Users,
  FileCheck2,
  FileX2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPartnersWithFollowUp,
  updateFollowUp,
} from "../../../feature/thunks/rmThunks";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import {
  FOLLOW_UP_STATUS_OPTIONS,
  getFollowUpStatusStyle,
} from "../../../utils/followUpStatusConfig";
import TableLoader from "../../../components/shared/TableLoader";
import toast from "react-hot-toast";

const MONTHS = [
  { value: "", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { value: "", label: "All years" },
  ...Array.from({ length: 6 }, (_, i) => {
    const y = String(currentYear - i);
    return { value: y, label: y };
  }),
];

const FollowUp = () => {
  const dispatch = useDispatch();
  const { data, loading, summary, period } = useSelector(
    (state) => state.rm.partnersWithFollowUp
  );

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [performance, setPerformance] = useState(""); // "" | working | non_working | filled | not_filled
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    partnerName: "",
    partnerId: "",
    employeeId: "",
    partnerContact: "",
    status: "Connected",
    remarks: "",
    lastCall: "",
  });

  const apiFilters = useMemo(() => {
    const f = {};
    if (date) {
      f.date = date;
    } else {
      if (year) f.year = year;
      if (month) f.month = month;
    }
    if (statusFilter) f.status = statusFilter;
    if (performance) f.performance = performance;
    return f;
  }, [year, month, date, statusFilter, performance]);

  useEffect(() => {
    dispatch(fetchPartnersWithFollowUp(apiFilters));
  }, [dispatch, apiFilters]);

  const followUps = (data || []).map((item, index) => ({
    id: index + 1,
    partnerName: item.name,
    partnerId: item.partnerId,
    employeeId: item.employeeId,
    partnerContact: item.phone,
    status: item.status,
    remarks: item.remarks,
    lastCall: item.lastCall,
    applicationCount: item.applicationCount || 0,
    hasFilledForm: Boolean(item.hasFilledForm),
    performance: item.performance || "non_working",
    moreInfoRequired: Boolean(item.moreInfoRequired),
    appsNeedingMoreInfoCount: item.appsNeedingMoreInfoCount || 0,
    pendingDocsCount: item.pendingDocsCount || 0,
    remainingDocTypes: item.remainingDocTypes || [],
    appsNeedingMoreInfo: item.appsNeedingMoreInfo || [],
  }));

  const [expandedId, setExpandedId] = useState(null);
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    return d
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.status) {
      toast.error("Select a call status");
      return;
    }
    const formattedLastCall = formatDate(
      formData.lastCall || new Date().toISOString()
    );
    await dispatch(
      updateFollowUp({
        partnerId: formData.partnerId,
        employeeId: formData.employeeId,
        status: formData.status,
        remarks: formData.remarks,
        lastCall: formattedLastCall,
        filters: apiFilters,
      })
    );
    toast.success("Follow-up saved");
    resetForm();
  };

  const handleEdit = (followUp) => {
    setFormData({
      partnerName: followUp.partnerName,
      partnerId: followUp.partnerId,
      employeeId: followUp.employeeId,
      partnerContact: followUp.partnerContact,
      status: followUp.status === "N/A" ? "Connected" : followUp.status,
      remarks: followUp.remarks || "",
      lastCall: "",
    });
    setEditingId(followUp.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      partnerName: "",
      partnerId: "",
      employeeId: "",
      partnerContact: "",
      status: "Connected",
      remarks: "",
      lastCall: "",
    });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredFollowUps = followUps.filter((followUp) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      followUp.partnerName?.toLowerCase().includes(q) ||
      String(followUp.employeeId || "")
        .toLowerCase()
        .includes(q) ||
      String(followUp.partnerContact || "").includes(searchTerm)
    );
  });

  const sortedFilteredFollowUps = sortNewestFirst(filteredFollowUps, {
    dateKeys: ["lastCall"],
  });

  const totalLoans =
    summary?.totalLoans ??
    followUps.reduce((s, f) => s + (Number(f.applicationCount) || 0), 0);
  const partnersFilled =
    summary?.filledPartners ??
    summary?.filled ??
    followUps.filter((f) => f.hasFilledForm).length;

  const cards = [
    {
      label: "Partners",
      value: summary?.total ?? followUps.length,
      icon: Users,
      tone: "bg-slate-50 text-slate-800 border-slate-200",
    },
    {
      // Same scope as Manage Loans — total applications, not partners
      label: "Filled loan form",
      value: totalLoans,
      icon: FileCheck2,
      tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
      onClick: () => setPerformance(performance === "filled" ? "" : "filled"),
      active: performance === "filled" || performance === "working",
    },
    {
      label: "Not filled yet",
      value:
        summary?.notFilled ??
        followUps.filter((f) => !f.hasFilledForm).length,
      icon: FileX2,
      tone: "bg-amber-50 text-amber-900 border-amber-200",
      onClick: () =>
        setPerformance(performance === "not_filled" ? "" : "not_filled"),
      active: performance === "not_filled" || performance === "non_working",
    },
    {
      label: "Working partners",
      value: partnersFilled,
      icon: FileCheck2,
      tone: "bg-teal-50 text-teal-900 border-teal-200",
      onClick: () => setPerformance(performance === "working" ? "" : "working"),
      active: performance === "working",
    },
    {
      label: "More info needed",
      value:
        summary?.moreInfoRequired ??
        followUps.filter((f) => f.moreInfoRequired).length,
      icon: FileX2,
      tone: "bg-orange-50 text-orange-900 border-orange-200",
    },
  ];

  const exportCsv = () => {
    const rows = [
      [
        "Partner",
        "Employee ID",
        "Phone",
        "Apps",
        "Filled",
        "Performance",
        "Call Status",
        "Remarks",
        "Last Call",
      ],
      ...sortedFilteredFollowUps.map((r) => [
        r.partnerName,
        r.employeeId,
        r.partnerContact,
        r.applicationCount,
        r.hasFilledForm ? "Yes" : "No",
        r.performance,
        r.status,
        r.remarks,
        r.lastCall || "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rm-partner-followups.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Partner Follow-up
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Track who filled loan forms and call working vs non-working partners.
            {period?.label ? (
              <span className="ml-2 text-teal-700 font-medium">
                Period: {period.label}
              </span>
            ) : null}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                type="button"
                onClick={c.onClick}
                className={`rounded-xl border p-4 text-left transition ${c.tone} ${
                  c.active ? "ring-2 ring-teal-500" : ""
                } ${c.onClick ? "hover:shadow-md cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    {c.label}
                  </span>
                  <Icon className="w-4 h-4 opacity-70" />
                </div>
                <p className="text-2xl font-bold">{c.value}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, ID, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setDate("");
              }}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
              {YEARS.map((y) => (
                <option key={y.value || "all"} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setDate("");
              }}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m.value || "all"} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                title="Exact date filter (overrides month)"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 pr-9 text-sm"
              >
                <option value="">All call status</option>
                <option value="N/A">Not contacted</option>
                {FOLLOW_UP_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
              <button
              type="button"
              onClick={() => {
                setYear("");
                setMonth("");
                setDate("");
                setStatusFilter("");
                setPerformance("");
                setSearchTerm("");
              }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead
                className="text-white"
                style={{ backgroundColor: "var(--color-brand-primary)" }}
              >
                <tr>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Partner</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Contact</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Total loans</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Pending docs</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Performance</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Call status</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold">Last call</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableLoader colSpan={9} label="Loading follow-ups…" />
                ) : null}
                {!loading && sortedFilteredFollowUps.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      No partners match these filters.
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  sortedFilteredFollowUps.map((followUp, index) => {
                    const statusStyle = getFollowUpStatusStyle(followUp.status);
                    const isOpen = expandedId === followUp.partnerId;
                    return (
                      <React.Fragment key={`${followUp.partnerId}-${index}`}>
                      <tr
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                      >
                        <td className="px-3 py-3 text-sm font-semibold text-slate-800">
                          {followUp.partnerName}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-mono">
                            {followUp.employeeId || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {followUp.partnerContact || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              followUp.hasFilledForm
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                          {followUp.applicationCount}{" "}
                          {followUp.hasFilledForm ? "loans" : "not filled"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {followUp.moreInfoRequired ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isOpen ? null : followUp.partnerId)
                              }
                              className="text-left"
                            >
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-900">
                                {followUp.appsNeedingMoreInfoCount} app
                                {followUp.appsNeedingMoreInfoCount !== 1 ? "s" : ""} ·{" "}
                                {followUp.pendingDocsCount} docs
                              </span>
                              <p className="text-[11px] text-orange-700 mt-1 max-w-[220px] truncate">
                                {(followUp.remainingDocTypes || []).slice(0, 3).join(", ")}
                                {(followUp.remainingDocTypes || []).length > 3
                                  ? "…"
                                  : ""}
                              </p>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700">
                              Complete
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm capitalize">
                          {followUp.performance === "working" ? (
                            <span className="text-teal-700 font-semibold">Working</span>
                          ) : (
                            <span className="text-rose-700 font-semibold">Non-working</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bgColor} ${statusStyle.textColor}`}
                          >
                            {followUp.status || "N/A"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {followUp.lastCall || "—"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEdit(followUp)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                            style={{ backgroundColor: "var(--color-brand-primary)" }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Follow up
                          </button>
                        </td>
                      </tr>
                      {isOpen && followUp.moreInfoRequired ? (
                        <tr key={`${followUp.partnerId}-docs`} className="bg-orange-50/70">
                          <td colSpan={9} className="px-4 py-3">
                            <p className="text-xs font-bold text-orange-900 mb-2">
                              Remaining docs partner must upload / complete
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {(followUp.remainingDocTypes || []).map((d) => (
                                <span
                                  key={d}
                                  className="px-2 py-1 rounded-md bg-white border border-orange-200 text-[11px] font-medium text-orange-900"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                            <div className="space-y-1.5">
                              {(followUp.appsNeedingMoreInfo || []).map((app) => (
                                <div
                                  key={app.appId || app.appNo}
                                  className="text-xs text-slate-700"
                                >
                                  <span className="font-semibold">{app.appNo || "App"}</span>
                                  <span className="text-slate-400"> · </span>
                                  <span>{app.status}</span>
                                  <span className="text-slate-400"> · </span>
                                  <span className="text-orange-800">
                                    {(app.remainingDocTypes || []).join(", ") ||
                                      "Docs incomplete"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Record follow-up</h3>
              <button type="button" onClick={resetForm} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">{formData.partnerName}</p>
                <p className="text-xs text-slate-500">
                  {formData.employeeId} · {formData.partnerContact}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Call status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                >
                  {FOLLOW_UP_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                  placeholder="What was discussed / next step..."
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
                style={{ backgroundColor: "var(--color-brand-primary)" }}
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
