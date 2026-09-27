import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Target,
  IndianRupee,
  FileText,
  ChevronRight,
  RefreshCw,
  Copy,
  Save,
  Send,
  Lock,
  SplitSquareHorizontal,
  AlertTriangle,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  copyPreviousTargets,
  errorMessage,
  fetchMemberTargets,
  fetchMyTargets,
  fetchTargetTrend,
  lockTargetMonth,
  saveTargetAllocations,
} from "./salesTargetApi";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LINE_LABEL = {
  ALL: "All loans",
  PERSONAL: "Personal",
  BUSINESS: "Business",
  HOME_LAP: "Home & LAP",
  BUSINESS_HOME: "Business & Home",
};
const LEVEL_LABEL = { ADMIN: "Company", RSM: "RSM", ASM: "ASM", RM: "RM" };

const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const inrShort = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return inr(v);
};

const pctColor = (p) => {
  if (p == null) return { bar: "bg-slate-300", text: "text-slate-500" };
  if (p >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600" };
  if (p >= 50) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-500", text: "text-rose-600" };
};

function ProgressBar({ percent }) {
  const c = pctColor(percent);
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${c.bar}`} style={{ width: `${Math.min(percent || 0, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold w-12 text-right ${c.text}`}>
        {percent == null ? "—" : `${percent}%`}
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
          {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ target }) {
  if (!target) return <span className="text-xs text-slate-400">Not set</span>;
  if (target.lockedAt)
    return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">Locked</span>;
  if (target.status === "PUBLISHED")
    return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">Published</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">Draft</span>;
}

/**
 * Monthly targets page for Admin / RSM / ASM / RM.
 * mode = the logged-in panel (decides token + what can be edited).
 */
export default function SalesTargets({ mode }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  // Drill-down stack; the first entry is always the viewer's own page.
  const [stack, setStack] = useState([{ self: true, label: mode === "ADMIN" ? "Company" : "My targets" }]);
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState({});
  const [notice, setNotice] = useState(null);

  const current = stack[stack.length - 1];
  const isAdmin = mode === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const period = { month, year };
      const view = current.self
        ? await fetchMyTargets(mode, period)
        : await fetchMemberTargets(mode, { role: current.role, id: current.id, ...period });
      setData(view);
      setEdits({});
      const trendRes = await fetchTargetTrend(mode, {
        year,
        role: current.self ? undefined : current.role,
        userId: current.self ? undefined : current.id,
      }).catch(() => null);
      setTrend(trendRes);
    } catch (err) {
      setData(null);
      setNotice({ type: "error", text: errorMessage(err, "Could not load targets.") });
    } finally {
      setLoading(false);
    }
  }, [mode, month, year, current]);

  useEffect(() => {
    load();
  }, [load]);

  const level = data?.level;
  const own = data?.own;
  const children = data?.children || [];
  const ownTarget = own?.target;

  const canEdit =
    !!data &&
    !data.locked &&
    ["ADMIN", "RSM", "ASM"].includes(level) &&
    (isAdmin || current.self) &&
    (level === "ADMIN" || !!ownTarget?._id);

  const managerId = level === "ADMIN" ? null : own?.user?._id;

  const valueFor = (row, field) => {
    const e = edits[row.user._id];
    if (e && e[field] !== undefined) return e[field];
    return row.target?.[field] ?? "";
  };

  const setField = (userId, field, raw) => {
    const v = raw === "" ? "" : Math.max(0, Number(raw));
    setEdits((prev) => ({ ...prev, [userId]: { ...prev[userId], [field]: v } }));
  };

  const draftTotals = useMemo(() => {
    let amt = 0;
    let files = 0;
    for (const r of children) {
      amt += Number(valueFor(r, "disbursementTarget")) || 0;
      files += Number(valueFor(r, "fileCountTarget")) || 0;
    }
    return { amt, files };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, edits]);

  const overAllocated =
    level !== "ADMIN" &&
    ownTarget &&
    (draftTotals.amt > ownTarget.disbursementTarget || draftTotals.files > ownTarget.fileCountTarget);

  const splitEqually = () => {
    const splittable = children.filter((r) => !r.lineMissing);
    if (!ownTarget || !splittable.length) return;
    const n = splittable.length;
    const baseAmt = Math.floor(ownTarget.disbursementTarget / n);
    const remAmt = ownTarget.disbursementTarget - baseAmt * n;
    const baseFiles = Math.floor(ownTarget.fileCountTarget / n);
    const remFiles = ownTarget.fileCountTarget - baseFiles * n;
    const next = {};
    splittable.forEach((r, i) => {
      next[r.user._id] = {
        disbursementTarget: baseAmt + (i === 0 ? remAmt : 0),
        fileCountTarget: baseFiles + (i < remFiles ? 1 : 0),
      };
    });
    setEdits(next);
  };

  const editedRows = () =>
    children
      .filter((r) => !r.lineMissing && edits[r.user._id])
      .map((r) => ({
        userId: r.user._id,
        disbursementTarget: Number(valueFor(r, "disbursementTarget")) || 0,
        fileCountTarget: Number(valueFor(r, "fileCountTarget")) || 0,
      }));

  const run = async (fn, successText) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      await load();
      setNotice({ type: "success", text: successText });
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Something went wrong.") });
    } finally {
      setBusy(false);
    }
  };

  const save = (publish) =>
    run(
      () =>
        saveTargetAllocations(mode, {
          month,
          year,
          managerId,
          publish,
          rows: editedRows(),
        }),
      publish ? "Targets published. Your team can see them now." : "Draft saved. Only you can see it until you publish."
    );

  const copyPrevious = () =>
    run(
      () => copyPreviousTargets(mode, { month, year, managerId }),
      "Copied last month's targets as drafts (only for people without a target this month)."
    );

  const lockMonth = () => {
    if (!window.confirm(`Lock ${MONTHS[month - 1]} ${year}? Achievement will be frozen and targets can't be edited.`)) return;
    run(() => lockTargetMonth(mode, { month, year }), "Month locked.");
  };

  const drill = (row) => {
    if (!data?.childLevel) return;
    setStack((s) => [...s, { role: data.childLevel, id: row.user._id, label: row.user.name }]);
  };

  const hasEdits = Object.keys(edits).length > 0;
  const hasDrafts = children.some((r) => r.target?.status === "DRAFT");
  const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const trendData = (trend?.months || []).map((m) => ({
    name: MONTHS[m.month - 1],
    Target: m.disbursementTarget,
    Achieved: m.achievedDisbursement,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-7 h-7 text-brand-primary" /> Targets
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {mode === "ADMIN" && "Set monthly targets for each RSM and track the whole company."}
              {mode === "RSM" && "Split your monthly target across your ASMs and track progress."}
              {mode === "ASM" && "Split your line target across your RMs and track progress."}
              {mode === "RM" && "Your monthly targets from each ASM, and how your partners are contributing."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={load}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        {stack.length > 1 && (
          <div className="flex items-center flex-wrap gap-1 text-sm">
            {stack.map((s, i) => (
              <React.Fragment key={`${s.id || "self"}_${i}`}>
                {i > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                <button
                  disabled={i === stack.length - 1}
                  onClick={() => setStack((st) => st.slice(0, i + 1))}
                  className={i === stack.length - 1 ? "font-semibold text-slate-900" : "text-brand-primary hover:underline"}
                >
                  {s.role ? `${s.label} (${s.role})` : s.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {notice && (
          <div
            className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
              notice.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {notice.type === "error" ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
            <span>{notice.text}</span>
          </div>
        )}

        {data?.locked && (
          <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm bg-slate-100 text-slate-700">
            <Lock className="w-4 h-4" /> {MONTHS[month - 1]} {year} is locked. Numbers are final.
          </div>
        )}

        {loading && !data ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">Loading targets…</div>
        ) : data ? (
          <>
            {/* Own summary */}
            {level !== "ADMIN" && !ownTarget && (
              <div className="rounded-lg px-4 py-3 text-sm bg-amber-50 text-amber-800">
                {current.self
                  ? "No target has been published for you this month yet."
                  : "No target set for this person this month yet."}
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={IndianRupee}
                label={`${LEVEL_LABEL[level]} disbursement target`}
                value={inrShort(ownTarget?.disbursementTarget)}
                sub={`Achieved ${inrShort(own?.achieved?.disbursement)}`}
                tone="blue"
              />
              <StatCard
                icon={FileText}
                label="File target"
                value={ownTarget?.fileCountTarget ?? 0}
                sub={`Achieved ${own?.achieved?.files ?? 0} files`}
                tone="blue"
              />
              <StatCard
                icon={Target}
                label="Disbursement achieved"
                value={own?.percent?.disbursement == null ? "—" : `${own.percent.disbursement}%`}
                sub={`Files ${own?.percent?.files == null ? "—" : `${own.percent.files}%`}`}
                tone={
                  own?.percent?.disbursement == null
                    ? "slate"
                    : own.percent.disbursement >= 80
                    ? "green"
                    : own.percent.disbursement >= 50
                    ? "amber"
                    : "red"
                }
              />
              {level === "RSM" || level === "ASM" ? (
                <StatCard
                  icon={SplitSquareHorizontal}
                  label="Unallocated"
                  value={ownTarget ? inrShort(ownTarget.disbursementTarget - draftTotals.amt) : "—"}
                  sub={ownTarget ? `${ownTarget.fileCountTarget - draftTotals.files} files left to give out` : ""}
                  tone={overAllocated ? "red" : "slate"}
                />
              ) : (
                <StatCard
                  icon={Users}
                  label={level === "RM" ? "Partners contributing" : "RSMs"}
                  value={level === "RM" ? (data.partners || []).length : children.length}
                  tone="slate"
                />
              )}
            </div>

            {/* RM: per-line targets + partner contribution */}
            {level === "RM" && (
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">Targets by loan type</div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2">Line</th>
                        <th className="text-right px-4 py-2">Target</th>
                        <th className="text-right px-4 py-2">Achieved</th>
                        <th className="px-4 py-2">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.lines || []).map((l) => (
                        <tr key={l.loanLine} className="border-t border-slate-100">
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-800">{LINE_LABEL[l.loanLine] || l.loanLine}</div>
                            <div className="text-xs text-slate-500">{l.asm ? `ASM: ${l.asm.name}` : ""}</div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {l.target ? (
                              <>
                                <div>{inrShort(l.target.disbursementTarget)}</div>
                                <div className="text-xs text-slate-500">{l.target.fileCountTarget} files</div>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Not set</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div>{inrShort(l.achieved.disbursement)}</div>
                            <div className="text-xs text-slate-500">{l.achieved.files} files</div>
                          </td>
                          <td className="px-4 py-2">
                            <ProgressBar percent={l.percent.disbursement} />
                          </td>
                        </tr>
                      ))}
                      {!(data.lines || []).length && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                            You are not linked to any ASM yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
                    Partner contribution this month
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2">Partner</th>
                        <th className="text-right px-4 py-2">Disbursed</th>
                        <th className="text-right px-4 py-2">Files</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.partners || []).map((p) => (
                        <tr key={p.partnerId || "direct"} className="border-t border-slate-100">
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-800">{p.name}</div>
                            {p.code && <div className="text-xs text-slate-500">{p.code}</div>}
                          </td>
                          <td className="px-4 py-2 text-right">{inrShort(p.disbursement)}</td>
                          <td className="px-4 py-2 text-right">{p.files}</td>
                        </tr>
                      ))}
                      {!(data.partners || []).length && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                            No disbursals yet this month.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Team allocation table */}
            {level !== "RM" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {data.childLevel === "RSM" && "RSM targets"}
                      {data.childLevel === "ASM" && "ASM targets"}
                      {data.childLevel === "RM" && `RM targets · ${LINE_LABEL[own?.loanLine] || ""}`}
                    </div>
                    {canEdit && level !== "ADMIN" && (
                      <div className={`text-xs mt-0.5 ${overAllocated ? "text-rose-600 font-medium" : "text-slate-500"}`}>
                        Allocated {inrShort(draftTotals.amt)} of {inrShort(ownTarget?.disbursementTarget)} · {draftTotals.files} of{" "}
                        {ownTarget?.fileCountTarget ?? 0} files
                        {overAllocated && " — more than your target"}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={copyPrevious}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4" /> Copy last month
                      </button>
                      {level !== "ADMIN" && (
                        <button
                          onClick={splitEqually}
                          disabled={busy || !ownTarget}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <SplitSquareHorizontal className="w-4 h-4" /> Split equally
                        </button>
                      )}
                      <button
                        onClick={() => save(false)}
                        disabled={busy || !hasEdits || overAllocated}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> Save draft
                      </button>
                      <button
                        onClick={() => save(true)}
                        disabled={busy || (!hasEdits && !hasDrafts) || overAllocated}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-brand-primary text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" /> Publish
                      </button>
                      {isAdmin && level === "ADMIN" && (
                        <button
                          onClick={lockMonth}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4" /> Lock month
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2">Name</th>
                        {data.childLevel === "ASM" && <th className="text-left px-4 py-2">Line</th>}
                        <th className="text-right px-4 py-2">Target (₹)</th>
                        <th className="text-right px-4 py-2">Files</th>
                        <th className="text-left px-4 py-2">Status</th>
                        <th className="text-right px-4 py-2">Achieved</th>
                        <th className="px-4 py-2">Progress</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {children.map((r) => {
                        const editable = canEdit && !r.lineMissing;
                        const amt = valueFor(r, "disbursementTarget");
                        return (
                          <tr key={r.user._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-4 py-2">
                              <div className="font-medium text-slate-800">{r.user.name}</div>
                              <div className="text-xs text-slate-500">{r.user.code || r.user.email}</div>
                            </td>
                            {data.childLevel === "ASM" && (
                              <td className="px-4 py-2">
                                {r.lineMissing ? (
                                  <span className="text-xs text-rose-600">Loan type not set</span>
                                ) : (
                                  LINE_LABEL[r.loanLine] || r.loanLine
                                )}
                              </td>
                            )}
                            <td className="px-4 py-2 text-right">
                              {editable ? (
                                <div>
                                  <input
                                    type="number"
                                    min={0}
                                    step={10000}
                                    value={amt}
                                    onChange={(e) => setField(r.user._id, "disbursementTarget", e.target.value)}
                                    className="w-36 border border-slate-300 rounded-md px-2 py-1 text-right"
                                  />
                                  <div className="text-[11px] text-slate-400 mt-0.5">{amt !== "" ? inrShort(amt) : ""}</div>
                                </div>
                              ) : r.target ? (
                                inrShort(r.target.disbursementTarget)
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {editable ? (
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={valueFor(r, "fileCountTarget")}
                                  onChange={(e) => setField(r.user._id, "fileCountTarget", e.target.value)}
                                  className="w-20 border border-slate-300 rounded-md px-2 py-1 text-right"
                                />
                              ) : r.target ? (
                                r.target.fileCountTarget
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <StatusBadge target={r.target} />
                              {edits[r.user._id] && <span className="ml-1 text-[11px] text-blue-600">edited</span>}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div>{inrShort(r.achieved.disbursement)}</div>
                              <div className="text-xs text-slate-500">{r.achieved.files} files</div>
                            </td>
                            <td className="px-4 py-2">
                              <ProgressBar percent={r.percent.disbursement} />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <button
                                onClick={() => drill(r)}
                                className="inline-flex items-center text-xs text-brand-primary hover:underline"
                                title="Open"
                              >
                                View <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!children.length && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                            No team members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 12-month trend */}
            {trendData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="font-semibold text-slate-800 mb-3">{year} — target vs disbursed</div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={inrShort} tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(v) => inr(v)} />
                      <Legend />
                      <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Achieved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
