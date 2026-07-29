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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
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

const AsmFollowUps = () => {
  const dispatch = useDispatch();
  const rmState = useSelector((state) => state.asm.rmFollowUps || {});
  const rsmState = useSelector((state) => state.asm.followUps || {});

  const [tab, setTab] = useState("rm"); // rm | rsm
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [performance, setPerformance] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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
  const sorted = sortNewestFirst(filtered, { dateKeys: ["lastCall"] });

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Follow-up</h1>
          <p className="text-sm text-slate-600 mt-1">
            ASM → RM performance follow-ups (and RSM calls). Filter by month / year / date.
            {period?.label ? <span className="ml-2 text-teal-700 font-medium">Period: {period.label}</span> : null}
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setTab("rm")} className={`px-4 py-2 rounded-xl text-sm font-semibold border ${tab === "rm" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700"}`}>RM follow-ups</button>
          <button type="button" onClick={() => setTab("rsm")} className={`px-4 py-2 rounded-xl text-sm font-semibold border ${tab === "rsm" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700"}`}>RSM follow-ups</button>
        </div>

        {tab === "rm" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "RMs", value: summary?.total ?? rows.length, icon: Users, tone: "bg-slate-50 border-slate-200" },
              { label: "Partners filled", value: summary?.partnersFilled ?? 0, icon: FileCheck2, tone: "bg-emerald-50 border-emerald-200", key: "filled" },
              { label: "Not filled", value: summary?.partnersNotFilled ?? 0, icon: FileX2, tone: "bg-amber-50 border-amber-200", key: "not_filled" },
              { label: "Working RMs", value: summary?.working ?? 0, icon: TrendingUp, tone: "bg-teal-50 border-teal-200", key: "working" },
              { label: "Non-working", value: summary?.nonWorking ?? 0, icon: TrendingDown, tone: "bg-rose-50 border-rose-200", key: "non_working" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.label} type="button" onClick={() => c.key && setPerformance(performance === c.key ? "" : c.key)} className={`rounded-xl border p-4 text-left ${c.tone} ${performance === c.key ? "ring-2 ring-teal-500" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase opacity-80">{c.label}</span>
                    <Icon className="w-4 h-4 opacity-70" />
                  </div>
                  <p className="text-2xl font-bold">{c.value}</p>
                </button>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={year} onChange={(e) => { setYear(e.target.value); setDate(""); }}>
              {YEARS.map((y) => <option key={y.value || "all"} value={y.value}>{y.label}</option>)}
            </select>
            <select className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={month} onChange={(e) => { setMonth(e.target.value); setDate(""); }}>
              {MONTHS.map((m) => <option key={m.value || "all"} value={m.value}>{m.label}</option>)}
            </select>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="date" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="relative">
              <select className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 pr-9 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All call status</option>
                <option value="N/A">Not contacted</option>
                {FOLLOW_UP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="px-3 py-2 text-sm rounded-lg border" onClick={() => { setYear(String(currentYear)); setMonth(String(new Date().getMonth() + 1)); setDate(""); setStatusFilter(""); setPerformance(""); setSearchTerm(""); }}>Reset</button>
            <button type="button" className="px-3 py-2 text-sm rounded-lg border inline-flex items-center gap-2" onClick={exportCsv}><Download className="w-4 h-4" /> Export</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="text-white" style={{ backgroundColor: "var(--color-brand-primary)" }}>
                <tr>
                  <th className="px-3 py-3 text-left text-sm">{tab === "rm" ? "RM" : "RSM"}</th>
                  <th className="px-3 py-3 text-left text-sm">ID</th>
                  <th className="px-3 py-3 text-left text-sm">Contact</th>
                  {tab === "rm" && <th className="px-3 py-3 text-left text-sm">Partners filled / not</th>}
                  {tab === "rm" && <th className="px-3 py-3 text-left text-sm">Apps</th>}
                  {tab === "rm" && <th className="px-3 py-3 text-left text-sm">Performance</th>}
                  <th className="px-3 py-3 text-left text-sm">Call status</th>
                  <th className="px-3 py-3 text-left text-sm">Last call</th>
                  <th className="px-3 py-3 text-center text-sm">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <TableLoader colSpan={tab === "rm" ? 9 : 6} label="Loading…" /> : null}
                {!loading && sorted.length === 0 ? (
                  <tr><td colSpan={tab === "rm" ? 9 : 6} className="px-4 py-10 text-center text-slate-500">No records match filters.</td></tr>
                ) : null}
                {!loading && sorted.map((row, idx) => {
                  const style = getFollowUpStatusStyle(row.callStatus);
                  return (
                    <tr key={row.id || idx} className={idx % 2 ? "bg-slate-50/60" : "bg-white"}>
                      <td className="px-3 py-3 text-sm font-semibold">{row.name}</td>
                      <td className="px-3 py-3 text-xs font-mono">{row.employeeId || "—"}</td>
                      <td className="px-3 py-3 text-sm"><span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" />{row.phone || "—"}</span></td>
                      {tab === "rm" && (
                        <td className="px-3 py-3 text-sm">
                          <span className="text-emerald-700 font-semibold">{row.partnersFilled}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-amber-700 font-semibold">{row.partnersNotFilled}</span>
                          <span className="text-xs text-slate-500 ml-1">of {row.partnerCount}</span>
                        </td>
                      )}
                      {tab === "rm" && <td className="px-3 py-3 text-sm font-semibold">{row.applicationCount}</td>}
                      {tab === "rm" && (
                        <td className="px-3 py-3 text-sm font-semibold">
                          {row.performance === "working" ? <span className="text-teal-700">Working</span> : <span className="text-rose-700">Non-working</span>}
                        </td>
                      )}
                      <td className="px-3 py-3 text-sm"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.bgColor} ${style.textColor}`}>{row.callStatus}</span></td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{row.lastCall || "—"}</td>
                      <td className="px-3 py-3 text-center">
                        <button type="button" onClick={() => { setSelected(row); setStatus("Connected"); setRemarks(""); setShowModal(true); }} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1" style={{ backgroundColor: "var(--color-brand-primary)" }}>
                          <Edit3 className="w-3.5 h-3.5" /> Follow up
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold">Follow up — {selected.name}</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <select className="w-full border rounded-xl px-3 py-2.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                {FOLLOW_UP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <textarea className="w-full border rounded-xl px-3 py-2.5 text-sm" rows={3} placeholder="Remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-xl border text-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded-xl text-sm text-white inline-flex items-center gap-2" style={{ backgroundColor: "var(--color-brand-primary)" }} onClick={saveFollowUp}>
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
