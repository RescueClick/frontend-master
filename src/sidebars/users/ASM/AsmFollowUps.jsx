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
import {
  fetchAsmRmFollowUps,
  recordAsmRmFollowUp,
  fetchRsmFollowUps,
  recordRsmFollowUp,
} from "../../../feature/thunks/asmThunks";
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

const AsmFollowUps = () => {
  const dispatch = useDispatch();
  const rmState = useSelector((state) => state.asm.rmFollowUps || {});
  const rsmState = useSelector((state) => state.asm.followUps || {});

  const [tab, setTab] = useState("rm"); // rm | rsm
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [performance, setPerformance] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("Connected");
  const [remarks, setRemarks] = useState("");

  const apiFilters = useMemo(() => {
    const f = {};
    if (date) f.date = date;
    else {
      if (year) f.year = year;
      if (month) f.month = month;
    }
    if (statusFilter) f.status = statusFilter;
    if (tab === "rm" && performance) f.performance = performance;
    return f;
  }, [year, month, date, statusFilter, performance, tab]);

  useEffect(() => {
    if (tab === "rm") dispatch(fetchAsmRmFollowUps(apiFilters));
    else dispatch(fetchRsmFollowUps(apiFilters));
  }, [dispatch, apiFilters, tab]);

  const loading = tab === "rm" ? rmState.loading : rsmState.loading;
  const summary = tab === "rm" ? rmState.summary : rsmState.summary;
  const period = tab === "rm" ? rmState.period : rsmState.period;
  const raw = tab === "rm" ? rmState.data : rsmState.data;

  const rows = (Array.isArray(raw) ? raw : []).map((item) => {
    if (tab === "rm") {
      return {
        id: item.rm?.id,
        name: item.rm?.name || "",
        employeeId: item.rm?.employeeId || "",
        phone: item.rm?.phone || "",
        partnerCount: item.partnerCount || 0,
        partnersFilled: item.partnersFilled || 0,
        partnersNotFilled: item.partnersNotFilled || 0,
        applicationCount: item.applicationCount || 0,
        performance: item.performance || "non_working",
        callStatus: item.status || item.followUp?.status || "N/A",
        lastCall: item.lastCall || item.followUp?.lastCallFormatted || "",
        remarksText: item.remarks || item.followUp?.remarks || "",
        targetType: "rm",
      };
    }
    return {
      id: item.rsm?.id,
      name: item.rsm?.name || "",
      employeeId: item.rsm?.employeeId || "",
      phone: item.rsm?.phone || "",
      callStatus: item.status || item.followUp?.status || "N/A",
      lastCall: item.lastCall || item.followUp?.lastCallFormatted || "",
      remarksText: item.remarks || item.followUp?.remarks || "",
      targetType: "rsm",
    };
  });

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
  }, [searchTerm, year, month, date, statusFilter, performance, tab]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage, ITEMS_PER_PAGE]);

  const saveFollowUp = async () => {
    if (!selected?.id) return;
    try {
      if (selected.targetType === "rm") {
        await dispatch(
          recordAsmRmFollowUp({ rmId: selected.id, status, remarks })
        ).unwrap();
      } else {
        await dispatch(
          recordRsmFollowUp({ rsmId: selected.id, status, remarks })
        ).unwrap();
      }
      toast.success("Follow-up recorded");
      setShowModal(false);
      if (tab === "rm") dispatch(fetchAsmRmFollowUps(apiFilters));
      else dispatch(fetchRsmFollowUps(apiFilters));
    } catch (e) {
      toast.error(e || "Failed to record follow-up");
    }
  };

  const exportCsv = () => {
    const header =
      tab === "rm"
        ? ["RM", "ID", "Phone", "Partners", "Filled", "Not filled", "Apps", "Performance", "Status", "Last call", "Remarks"]
        : ["RSM", "ID", "Phone", "Status", "Last call", "Remarks"];
    const body = sorted.map((r) =>
      tab === "rm"
        ? [r.name, r.employeeId, r.phone, r.partnerCount, r.partnersFilled, r.partnersNotFilled, r.applicationCount, r.performance, r.callStatus, r.lastCall, r.remarksText]
        : [r.name, r.employeeId, r.phone, r.callStatus, r.lastCall, r.remarksText]
    );
    const csv = [header, ...body]
      .map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab === "rm" ? "asm-rm-followups.csv" : "asm-rsm-followups.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFiltersCount = [
    year,
    month,
    date,
    statusFilter,
    tab === "rm" ? performance : "",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 p-1 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Follow-up</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                ASM → RM performance follow-ups and RSM calls. Filter by month / year / date.
              </p>
            </div>
            {period?.label ? (
              <span className="self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                Period: {period.label}
              </span>
            ) : null}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab("rm")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition active:scale-95 ${
              tab === "rm"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            RM follow-ups
          </button>
          <button
            type="button"
            onClick={() => setTab("rsm")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition active:scale-95 ${
              tab === "rsm"
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            RSM follow-ups
          </button>
        </div>

        {/* RM Summary Cards */}
        {tab === "rm" && (
          <div className="flex overflow-x-auto gap-2 pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-3 mb-3 sm:mb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { label: "RMs", value: summary?.total ?? rows.length, icon: Users, tone: "bg-slate-50 text-slate-800 border-slate-200" },
              { label: "Partners filled", value: summary?.partnersFilled ?? 0, icon: FileCheck2, tone: "bg-emerald-50 text-emerald-800 border-emerald-200", key: "filled" },
              { label: "Not filled", value: summary?.partnersNotFilled ?? 0, icon: FileX2, tone: "bg-amber-50 text-amber-900 border-amber-200", key: "not_filled" },
              { label: "Working RMs", value: summary?.working ?? 0, icon: TrendingUp, tone: "bg-teal-50 text-teal-900 border-teal-200", key: "working" },
              { label: "Non-working", value: summary?.nonWorking ?? 0, icon: TrendingDown, tone: "bg-rose-50 text-rose-900 border-rose-200", key: "non_working" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => c.key && setPerformance(performance === c.key ? "" : c.key)}
                  className={`min-w-[130px] sm:min-w-0 rounded-xl border p-2.5 sm:p-4 text-left transition active:scale-[0.98] shrink-0 sm:shrink ${c.tone} ${
                    performance === c.key ? "ring-2 ring-teal-500 shadow-sm" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide opacity-80 truncate">{c.label}</span>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 shrink-0 ml-1" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{c.value}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder={tab === "rm" ? "Search RM name, ID, phone..." : "Search RSM name, ID, phone..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={year}
                onChange={(e) => { setYear(e.target.value); setDate(""); }}
              >
                {YEARS.map((y) => <option key={y.value || "all"} value={y.value}>{y.label}</option>)}
              </select>

              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={month}
                onChange={(e) => { setMonth(e.target.value); setDate(""); }}
              >
                {MONTHS.map((m) => <option key={m.value || "all"} value={m.value}>{m.label}</option>)}
              </select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="relative">
                <select
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All call status</option>
                  <option value="N/A">Not contacted</option>
                  {FOLLOW_UP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                onClick={() => { setYear(""); setMonth(""); setDate(""); setStatusFilter(""); setPerformance(""); setSearchTerm(""); }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset filters
              </button>

              <button
                type="button"
                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                onClick={exportCsv}
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
              <TableLoader colSpan={1} label="Loading…" />
            </div>
          ) : null}

          {!loading && sorted.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
              No records match filters.
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
                      key={row.id || idx}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & Phone Number */}
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          setSelected(row);
                          setStatus(row.callStatus === "N/A" ? "Connected" : row.callStatus);
                          setRemarks(row.remarksText || "");
                          setShowModal(true);
                        }}
                      >
                        <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">
                          {row.name || "Unnamed"}
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
                          onClick={() => {
                            setSelected(row);
                            setStatus(row.callStatus === "N/A" ? "Connected" : row.callStatus);
                            setRemarks(row.remarksText || "");
                            setShowModal(true);
                          }}
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

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">{tab === "rm" ? "RM" : "RSM"}</th>
                  <th className="px-3 py-3.5 text-left">ID</th>
                  <th className="px-3 py-3.5 text-left">Contact</th>
                  {tab === "rm" && <th className="px-3 py-3.5 text-left">Partners filled / not</th>}
                  {tab === "rm" && <th className="px-3 py-3.5 text-left">Total loans</th>}
                  {tab === "rm" && <th className="px-3 py-3.5 text-left">Performance</th>}
                  <th className="px-3 py-3.5 text-left">Call status</th>
                  <th className="px-3 py-3.5 text-left">Last call</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <TableLoader colSpan={tab === "rm" ? 9 : 6} label="Loading…" /> : null}
                {!loading && sorted.length === 0 ? (
                  <tr><td colSpan={tab === "rm" ? 9 : 6} className="px-4 py-12 text-center text-slate-500 text-sm">No records match filters.</td></tr>
                ) : null}
                {!loading && paginatedRows.map((row, idx) => {
                  const style = getFollowUpStatusStyle(row.callStatus);
                  const hasPhone = Boolean(row.phone && row.phone !== "—");
                  const cleanPhone = String(row.phone || "").replace(/[^\d+]/g, "");
                  const waUrl = getWhatsAppUrl(row.phone, row.name);
                  const initials = (row.name || "U").trim().slice(0, 2).toUpperCase();

                  return (
                    <tr key={row.id || idx} className={`transition-colors hover:bg-slate-50/70 ${idx % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="truncate max-w-[160px]" title={row.name}>{row.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs font-mono">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200/60">
                          {row.employeeId || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">
                        {hasPhone && cleanPhone ? (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="font-medium text-slate-700 hover:text-emerald-700 hover:underline font-mono text-xs inline-flex items-center gap-1.5"
                            title={`Call ${row.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{row.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      {tab === "rm" && (
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          <span className="text-emerald-700 font-semibold">{row.partnersFilled}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-amber-700 font-semibold">{row.partnersNotFilled}</span>
                          <span className="text-xs text-slate-500 ml-1">of {row.partnerCount}</span>
                        </td>
                      )}
                      {tab === "rm" && <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap">{row.applicationCount}</td>}
                      {tab === "rm" && (
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
                      )}
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
                            onClick={() => { setSelected(row); setStatus(row.callStatus === "N/A" ? "Connected" : row.callStatus); setRemarks(row.remarksText || ""); setShowModal(true); }}
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

      {/* Follow up Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Follow up — {selected.name}</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Person Info with Direct Call & WhatsApp Buttons in Modal */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{selected.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {selected.employeeId || "—"}</p>
                </div>
                {selected.phone && selected.phone !== "—" ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getWhatsAppUrl(selected.phone, selected.name) ? (
                      <a
                        href={getWhatsAppUrl(selected.phone, selected.name)}
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
                      href={`tel:${selected.phone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                      title="Call directly"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Call status</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {FOLLOW_UP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  rows={3}
                  placeholder="What was discussed / next step..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white transition"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 shadow-sm transition hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "var(--color-brand-primary)" }}
                onClick={saveFollowUp}
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsmFollowUps;
