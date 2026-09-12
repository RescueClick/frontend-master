import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Edit3,
  Phone,
  PhoneCall,
  Save,
  X,
  Calendar,
  Users,
  FileCheck2,
  FileX2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
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

const getWhatsAppUrl = (phone, name = "") => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const waPhone = digits.length === 10 ? `91${digits}` : digits;
  const msg = name
    ? `Hello ${name}, this is DhanSource Capital.`
    : `Hello, this is DhanSource Capital.`;
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
};

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
  const [showFilters, setShowFilters] = useState(false);

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

  const sortedFilteredFollowUps = useMemo(() => {
    return [...filteredFollowUps].sort((a, b) => {
      const codeA = String(a.employeeId || "").trim();
      const codeB = String(b.employeeId || "").trim();
      if (codeA && codeB) {
        return codeB.localeCompare(codeA, undefined, { numeric: true });
      }
      return 0;
    });
  }, [filteredFollowUps]);

  // Pagination (10 data rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, year, month, date, statusFilter, performance]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredFollowUps.length / ITEMS_PER_PAGE));
  const paginatedFollowUps = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFilteredFollowUps.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedFilteredFollowUps, currentPage, ITEMS_PER_PAGE]);

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

  const activeFiltersCount = [year, month, date, statusFilter, performance].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 p-1 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        {/* Page Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Partner Follow-up
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs sm:text-sm">
                Track who filled loan forms and call working vs non-working partners.
              </p>
            </div>
            {period?.label ? (
              <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                Period: {period.label}
              </span>
            ) : null}
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="flex overflow-x-auto gap-2 pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-3 mb-3 sm:mb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                type="button"
                onClick={c.onClick}
                className={`min-w-[130px] sm:min-w-0 rounded-xl border p-2.5 sm:p-4 text-left transition active:scale-[0.98] shrink-0 sm:shrink ${c.tone} ${
                  c.active ? "ring-2 ring-teal-500 shadow-sm" : ""
                } ${c.onClick ? "hover:shadow-md cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide opacity-80 truncate">
                    {c.label}
                  </span>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 shrink-0 ml-1" />
                </div>
                <p className="text-lg sm:text-2xl font-bold">{c.value}</p>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, ID, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`md:hidden flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-sm font-semibold transition ${
                  showFilters || activeFiltersCount > 0
                    ? "border-teal-500 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={exportCsv}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filter options (expandable on mobile, always visible on desktop) */}
          <div className={`${showFilters ? "block" : "hidden md:block"} mt-3 pt-3 border-t border-slate-100`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setDate("");
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {MONTHS.map((m) => (
                  <option key={m.value || "all"} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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

            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset filters
              </button>

              <button
                type="button"
                onClick={exportCsv}
                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Phone List View (Clean: Name, Phone, WhatsApp & Call) */}
        <div className="md:hidden">
          {loading ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
              <TableLoader colSpan={1} label="Loading follow-ups…" />
            </div>
          ) : null}

          {!loading && sortedFilteredFollowUps.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
              No partners match these filters.
            </div>
          ) : null}

          {!loading && sortedFilteredFollowUps.length > 0 && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {paginatedFollowUps.map((followUp, index) => {
                  const cleanPhone = String(followUp.partnerContact || "").replace(/[^\d+]/g, "");
                  const waUrl = getWhatsAppUrl(followUp.partnerContact, followUp.partnerName);

                  return (
                    <div
                      key={`mobile-${followUp.partnerId}-${index}`}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & Phone Number */}
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => handleEdit(followUp)}
                      >
                        <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">
                          {followUp.partnerName || "Unnamed Partner"}
                        </h4>
                        {cleanPhone ? (
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 mt-0.5 tracking-tight"
                            title="Tap to call"
                          >
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{followUp.partnerContact}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 mt-0.5 block">No phone</span>
                        )}
                      </div>

                      {/* WhatsApp & Call Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-2xs active:scale-95 transition"
                            title="WhatsApp"
                          >
                            <FaWhatsapp className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        ) : null}

                        {cleanPhone ? (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs active:scale-95 transition"
                            title="Call"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleEdit(followUp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition"
                          title="Follow up note"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-slate-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium inline-flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop Table View (Clean SaaS Table, 10 data rows per page) */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Partner</th>
                  <th className="px-3 py-3.5 text-left">ID</th>
                  <th className="px-3 py-3.5 text-left">Contact</th>
                  <th className="px-3 py-3.5 text-left">Total loans</th>
                  <th className="px-3 py-3.5 text-left">Pending docs</th>
                  <th className="px-3 py-3.5 text-left">Performance</th>
                  <th className="px-3 py-3.5 text-left">Call status</th>
                  <th className="px-3 py-3.5 text-left">Last call</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableLoader colSpan={9} label="Loading follow-ups…" />
                ) : null}
                {!loading && sortedFilteredFollowUps.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500 text-sm">
                      No partners match these filters.
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  paginatedFollowUps.map((followUp, index) => {
                    const statusStyle = getFollowUpStatusStyle(followUp.status);
                    const isOpen = expandedId === followUp.partnerId;
                    const hasPhone = Boolean(followUp.partnerContact && followUp.partnerContact !== "—");
                    const cleanPhone = String(followUp.partnerContact || "").replace(/[^\d+]/g, "");
                    const waUrl = getWhatsAppUrl(followUp.partnerContact, followUp.partnerName);
                    const initials = (followUp.partnerName || "P").trim().slice(0, 2).toUpperCase();

                    return (
                      <React.Fragment key={`${followUp.partnerId}-${index}`}>
                      <tr
                        className={`transition-colors hover:bg-slate-50/70 ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                        }`}
                      >
                        {/* Partner Name with Avatar Initials */}
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <span className="truncate max-w-[160px]" title={followUp.partnerName}>
                              {followUp.partnerName}
                            </span>
                          </div>
                        </td>

                        {/* Employee ID */}
                        <td className="px-3 py-3 text-sm">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-mono border border-slate-200/60">
                            {followUp.employeeId || "—"}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="px-3 py-3 text-sm text-slate-700 whitespace-nowrap">
                          {hasPhone && cleanPhone ? (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="font-medium text-slate-700 hover:text-emerald-700 hover:underline font-mono text-xs inline-flex items-center gap-1.5"
                              title={`Direct Call: ${followUp.partnerContact}`}
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{followUp.partnerContact}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Total Loans */}
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              followUp.hasFilledForm
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-900 border border-amber-200"
                            }`}
                          >
                            {followUp.applicationCount}{" "}
                            {followUp.hasFilledForm ? "loans" : "not filled"}
                          </span>
                        </td>

                        {/* Pending Docs */}
                        <td className="px-3 py-3 text-sm">
                          {followUp.moreInfoRequired ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isOpen ? null : followUp.partnerId)
                              }
                              className="text-left group"
                            >
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200 group-hover:bg-orange-100 transition">
                                {followUp.appsNeedingMoreInfoCount} app
                                {followUp.appsNeedingMoreInfoCount !== 1 ? "s" : ""} ·{" "}
                                {followUp.pendingDocsCount} docs
                              </span>
                              <p className="text-[11px] text-orange-700 mt-0.5 max-w-[200px] truncate">
                                {(followUp.remainingDocTypes || []).slice(0, 3).join(", ")}
                                {(followUp.remainingDocTypes || []).length > 3 ? "…" : ""}
                              </p>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                              Complete
                            </span>
                          )}
                        </td>

                        {/* Performance */}
                        <td className="px-3 py-3 text-sm capitalize whitespace-nowrap">
                          {followUp.performance === "working" ? (
                            <span className="inline-flex items-center gap-1.5 text-teal-700 font-semibold text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                              Working
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Non-working
                            </span>
                          )}
                        </td>

                        {/* Call status */}
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bgColor} ${statusStyle.textColor}`}
                          >
                            {followUp.status || "N/A"}
                          </span>
                        </td>

                        {/* Last call */}
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {followUp.lastCall || "—"}
                        </td>

                        {/* Actions (Sleek modern SaaS Action Group) */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-emerald-200 transition-all duration-150 shadow-2xs hover:scale-105"
                                title={`Chat with ${followUp.partnerName} on WhatsApp`}
                              >
                                <FaWhatsapp className="w-4 h-4" />
                              </a>
                            ) : null}

                            {cleanPhone ? (
                              <a
                                href={`tel:${cleanPhone}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-200 transition-all duration-150 shadow-2xs hover:scale-105"
                                title={`Direct call to ${cleanPhone}`}
                              >
                                <PhoneCall className="w-4 h-4" />
                              </a>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleEdit(followUp)}
                              className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-150 shadow-2xs hover:scale-[1.02]"
                              title="Add / view follow-up notes"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Note</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Docs Row */}
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

          {/* Desktop Table Pagination Bar (10 data rows per page) */}
          <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {sortedFilteredFollowUps.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(sortedFilteredFollowUps.length, currentPage * ITEMS_PER_PAGE)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">{sortedFilteredFollowUps.length}</span>{" "}
              partners
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium inline-flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && <span className="px-1 text-slate-400">…</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                              currentPage === p
                                ? "bg-teal-600 text-white shadow-2xs"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium inline-flex items-center gap-1 transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Record Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Record follow-up</h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Partner Card with Direct Call & WhatsApp Buttons in Modal */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{formData.partnerName}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {formData.employeeId || "—"}
                  </p>
                </div>
                {formData.partnerContact && formData.partnerContact !== "—" ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getWhatsAppUrl(formData.partnerContact, formData.partnerName) ? (
                      <a
                        href={getWhatsAppUrl(formData.partnerContact, formData.partnerName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition"
                        title="Chat on WhatsApp"
                      >
                        <FaWhatsapp className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                    <a
                      href={`tel:${formData.partnerContact}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95"
                      title="Call directly"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Call status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="What was discussed / next step..."
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 shadow-sm transition hover:opacity-90 active:scale-95"
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
