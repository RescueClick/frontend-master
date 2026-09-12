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
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { fetchRmFollowUps, recordRmFollowUp } from "../../../feature/thunks/rsmThunks";
import toast from "react-hot-toast";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import {
  FOLLOW_UP_STATUS_OPTIONS,
  getFollowUpStatusStyle,
} from "../../../utils/followUpStatusConfig";
import TableLoader from "../../../components/shared/TableLoader";

const MONTHS = [
  { value: "", label: "All months" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
  })),
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

const RsmFollowUps = () => {
  const dispatch = useDispatch();
  const { data, loading, summary, period } = useSelector(
    (state) => state.rsm.rmFollowUps || {}
  );

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [performance, setPerformance] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRm, setSelectedRm] = useState(null);
  const [status, setStatus] = useState("Connected");
  const [remarks, setRemarks] = useState("");

  const activeFiltersCount = useMemo(() => {
    return [year, month, date, statusFilter, performance].filter(Boolean).length;
  }, [year, month, date, statusFilter, performance]);

  const apiFilters = useMemo(() => {
    const f = {};
    if (date) f.date = date;
    else {
      if (year) f.year = year;
      if (month) f.month = month;
    }
    if (statusFilter) f.status = statusFilter;
    if (performance) f.performance = performance;
    return f;
  }, [year, month, date, statusFilter, performance]);

  useEffect(() => {
    dispatch(fetchRmFollowUps(apiFilters));
  }, [dispatch, apiFilters]);

  const rows = (Array.isArray(data) ? data : []).map((item) => ({
    ...item,
    name: item.rm?.name || "",
    employeeId: item.rm?.employeeId || "",
    phone: item.rm?.phone || "",
    callStatus: item.status || item.followUp?.status || "N/A",
    lastCall: item.lastCall || item.followUp?.lastCallFormatted || "",
    remarksText: item.remarks || item.followUp?.remarks || "",
  }));

  const filtered = rows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      r.name.toLowerCase().includes(q) ||
      String(r.employeeId).toLowerCase().includes(q) ||
      String(r.phone).includes(searchTerm)
    );
  });
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const codeA = String(a.employeeId || "").trim();
      const codeB = String(b.employeeId || "").trim();
      if (codeA && codeB) {
        return codeB.localeCompare(codeA, undefined, { numeric: true });
      }
      return 0;
    });
  }, [filtered]);

  // Pagination (10 data rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, year, month, date, statusFilter, performance]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage, ITEMS_PER_PAGE]);

  const openFollowUp = (row) => {
    setSelectedRm(row);
    setStatus("Connected");
    setRemarks("");
    setShowModal(true);
  };

  const saveFollowUp = async () => {
    if (!selectedRm?.rm?.id) return;
    try {
      await dispatch(
        recordRmFollowUp({
          rmId: selectedRm.rm.id,
          status,
          remarks,
        })
      ).unwrap();
      toast.success("Follow-up recorded");
      setShowModal(false);
      dispatch(fetchRmFollowUps(apiFilters));
    } catch (e) {
      toast.error(e || "Failed to record follow-up");
    }
  };

  const exportCsv = () => {
    const csvRows = [
      ["RM", "Employee ID", "Phone", "Partners", "Filled", "Not filled", "Apps", "Performance", "Call status", "Last call", "Remarks"],
      ...sorted.map((r) => [
        r.name,
        r.employeeId,
        r.phone,
        r.partnerCount || 0,
        r.partnersFilled || 0,
        r.partnersNotFilled || 0,
        r.applicationCount || 0,
        r.performance || "",
        r.callStatus,
        r.lastCall,
        r.remarksText,
      ]),
    ];
    const csv = csvRows.map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsm-rm-followups.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: "RMs", value: summary?.total ?? rows.length, icon: Users, tone: "bg-slate-50 border-slate-200" },
    { label: "Partners filled", value: summary?.partnersFilled ?? 0, icon: FileCheck2, tone: "bg-emerald-50 border-emerald-200", onClick: () => setPerformance(performance === "filled" ? "" : "filled"), active: performance === "filled" || performance === "working" },
    { label: "Partners not filled", value: summary?.partnersNotFilled ?? 0, icon: FileX2, tone: "bg-amber-50 border-amber-200", onClick: () => setPerformance(performance === "not_filled" ? "" : "not_filled"), active: performance === "not_filled" || performance === "non_working" },
    { label: "Working RMs", value: summary?.working ?? 0, icon: TrendingUp, tone: "bg-teal-50 border-teal-200", onClick: () => setPerformance(performance === "working" ? "" : "working"), active: performance === "working" },
    { label: "Non-working RMs", value: summary?.nonWorking ?? 0, icon: TrendingDown, tone: "bg-rose-50 border-rose-200", onClick: () => setPerformance(performance === "non_working" ? "" : "non_working"), active: performance === "non_working" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-1 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            RM Follow-up
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            See which RMs have partners filling loan forms and follow up by performance.
            {period?.label ? (
              <span className="inline-block ml-0 sm:ml-2 mt-1 sm:mt-0 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs font-semibold border border-teal-200">
                Period: {period.label}
              </span>
            ) : null}
          </p>
        </div>

        {/* Summary Stat Cards */}
        <div className="flex overflow-x-auto gap-2 pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                type="button"
                onClick={c.onClick}
                className={`min-w-[130px] sm:min-w-0 rounded-xl border p-2.5 sm:p-4 text-left transition-all shrink-0 sm:shrink ${c.tone} ${
                  c.active ? "ring-2 ring-teal-500 shadow-sm" : ""
                } ${c.onClick ? "hover:shadow-md cursor-pointer active:scale-[0.98]" : "cursor-default"}`}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80 truncate">
                    {c.label}
                  </span>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 shrink-0 ml-1" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{c.value}</p>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="Search RM by name, ID or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <div className="flex items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${
                  showFilters || activeFiltersCount > 0
                    ? "bg-teal-50 border-teal-300 text-teal-800"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] inline-flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {(activeFiltersCount > 0 || searchTerm) && (
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
                  className="px-2.5 py-2 text-xs text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50"
                  title="Reset all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={exportCsv}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>

          {/* Collapsible Dropdowns */}
          <div
            className={`mt-3 pt-3 border-t border-slate-100 ${
              showFilters ? "block" : "hidden sm:block"
            }`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <select
                className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setDate("");
                }}
              >
                {YEARS.map((y) => (
                  <option key={y.value || "all"} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>

              <select
                className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setDate("");
                }}
              >
                {MONTHS.map((m) => (
                  <option key={m.value || "all"} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                <input
                  type="date"
                  className="w-full pl-8 pr-2.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="relative">
                <select
                  className="w-full appearance-none border border-slate-200 rounded-xl px-2.5 py-2 pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All call status</option>
                  <option value="N/A">Not contacted</option>
                  {FOLLOW_UP_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing {sorted.length} RM records
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 inline-flex items-center gap-1.5 transition-colors"
                  onClick={() => {
                    setYear("");
                    setMonth("");
                    setDate("");
                    setStatusFilter("");
                    setPerformance("");
                    setSearchTerm("");
                  }}
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  onClick={exportCsv}
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Phone List View (Clean: Name, Phone, WhatsApp & Call) */}
        <div className="md:hidden">
          {loading ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
              <TableLoader colSpan={1} label="Loading RM follow-ups…" />
            </div>
          ) : null}

          {!loading && sorted.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
              No RMs match current filters.
            </div>
          ) : null}

          {!loading && sorted.length > 0 && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {paginatedRows.map((row, idx) => {
                  const cleanPhone = String(row.phone || "").replace(/[^\d+]/g, "");
                  const waUrl = getWhatsAppUrl(row.phone, row.name);

                  return (
                    <div
                      key={row.rm?.id || idx}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & Phone Number */}
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => openFollowUp(row)}
                      >
                        <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">
                          {row.name || "Unnamed RM"}
                        </h4>
                        {cleanPhone ? (
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 mt-0.5 tracking-tight"
                            title="Tap to call"
                          >
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{row.phone}</span>
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
                          onClick={() => openFollowUp(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition shrink-0"
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

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">RM</th>
                  <th className="px-3 py-3.5 text-left">ID</th>
                  <th className="px-3 py-3.5 text-left">Contact</th>
                  <th className="px-3 py-3.5 text-left">Partners filled / not</th>
                  <th className="px-3 py-3.5 text-left">Total loans</th>
                  <th className="px-3 py-3.5 text-left">Performance</th>
                  <th className="px-3 py-3.5 text-left">Call status</th>
                  <th className="px-3 py-3.5 text-left">Last call</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <TableLoader colSpan={9} label="Loading…" /> : null}
                {!loading && sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500 text-sm">
                      No RMs match filters.
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  paginatedRows.map((row, idx) => {
                    const style = getFollowUpStatusStyle(row.callStatus);
                    const cleanPhone = String(row.phone || "").replace(/[^\d+]/g, "");
                    const waUrl = getWhatsAppUrl(row.phone, row.name);
                    const initials = (row.name || "R").trim().slice(0, 2).toUpperCase();

                    return (
                      <tr key={row.rm?.id || idx} className={`transition-colors hover:bg-slate-50/70 ${idx % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <span className="truncate max-w-[160px]" title={row.name}>{row.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs font-mono text-slate-600">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200/60">
                            {row.employeeId || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          {row.phone && cleanPhone ? (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="font-medium text-slate-800 hover:text-emerald-700 hover:underline font-mono text-xs inline-flex items-center gap-1.5"
                              title={`Call ${row.phone}`}
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{row.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          <span className="text-emerald-700 font-semibold">{row.partnersFilled || 0}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-amber-700 font-semibold">{row.partnersNotFilled || 0}</span>
                          <span className="text-xs text-slate-500 ml-1">of {row.partnerCount || 0}</span>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">{row.applicationCount || 0}</td>
                        <td className="px-3 py-3 text-sm font-semibold capitalize whitespace-nowrap">
                          {row.performance === "working" ? (
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
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bgColor} ${style.textColor}`}>
                            {row.callStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{row.lastCall || "—"}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-[#25D366] hover:bg-[#20bd5a] hover:text-white border border-emerald-200 transition-all duration-150 shadow-2xs hover:scale-105"
                                title={`Chat with ${row.name} on WhatsApp`}
                              >
                                <FaWhatsapp className="w-4 h-4" />
                              </a>
                            ) : null}
                            {cleanPhone ? (
                              <a
                                href={`tel:${cleanPhone}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-200 transition-all duration-150 shadow-2xs hover:scale-105"
                                title={`Call ${cleanPhone}`}
                              >
                                <PhoneCall className="w-4 h-4" />
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => openFollowUp(row)}
                              className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-150 shadow-2xs hover:scale-[1.02]"
                              title="Add / view follow-up notes"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Note</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Desktop Table Pagination Bar */}
          <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {sorted.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(sorted.length, currentPage * ITEMS_PER_PAGE)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">{sorted.length}</span>{" "}
              records
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

      {/* Follow-Up Modal */}
      {showModal && selectedRm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Follow up — {selectedRm.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RM Quick Details & Direct Call Box */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedRm.employeeId || "—"}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedRm.phone || "No phone"}</span>
                </p>
              </div>

              {selectedRm.phone && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {getWhatsAppUrl(selectedRm.phone, selectedRm.name) ? (
                    <a
                      href={getWhatsAppUrl(selectedRm.phone, selectedRm.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs active:scale-95 transition-all shrink-0"
                      title="Chat on WhatsApp"
                    >
                      <FaWhatsapp className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}
                  <a
                    href={`tel:${String(selectedRm.phone).replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-all shrink-0"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Call Status
                </label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {FOLLOW_UP_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Remarks / Discussion Notes
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  rows={3}
                  placeholder="Enter remarks from discussion with RM..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 shadow-xs hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: "var(--color-brand-primary)" }}
                onClick={saveFollowUp}
              >
                <Save className="w-4 h-4" /> Save Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RsmFollowUps;
