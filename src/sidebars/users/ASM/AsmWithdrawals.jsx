import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCw,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";

const formatINR = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const STATUS = {
  PENDING_ASM: {
    label: "Needs your review",
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  PENDING_ADMIN: {
    label: "Sent to Admin",
    chip: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  PAID: {
    label: "Paid",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    chip: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
};

const TABS = [
  { key: "PENDING_ASM", label: "Pending review" },
  { key: "PENDING_ADMIN", label: "Sent to Admin" },
  { key: "PAID", label: "Paid" },
  { key: "REJECTED", label: "Rejected" },
];

const AsmWithdrawals = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState("PENDING_ASM");
  const [search, setSearch] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { asmToken } = getAuthData();
      const res = await axios.get(`${backendurl}/asm/withdrawals`, {
        headers: { Authorization: `Bearer ${asmToken}` },
        params: { status: "ALL" },
      });
      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load withdrawals");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { PENDING_ASM: 0, PENDING_ADMIN: 0, PAID: 0, REJECTED: 0 };
    rows.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status] += 1;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (row.status !== tab) return false;
      if (!q) return true;
      const p = row.partnerId || {};
      const hay = `${p.firstName || ""} ${p.lastName || ""} ${p.partnerCode || ""} ${p.employeeId || ""} ${p.email || ""} ${p.phone || ""} ${row.note || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, tab, search]);

  const approve = async (id) => {
    try {
      setBusyId(id);
      const { asmToken } = getAuthData();
      await axios.post(
        `${backendurl}/asm/withdrawals/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${asmToken}` } }
      );
      toast.success("Approved — request sent to Admin for payment");
      setConfirmApprove(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    try {
      setBusyId(rejectModal._id);
      const { asmToken } = getAuthData();
      await axios.post(
        `${backendurl}/asm/withdrawals/${rejectModal._id}/reject`,
        { reason: rejectReason.trim() },
        { headers: { Authorization: `Bearer ${asmToken}` } }
      );
      toast.success("Withdraw request rejected");
      setRejectModal(null);
      setRejectReason("");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F8] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                <IndianRupee className="h-3.5 w-3.5" />
                Withdraw pipeline
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Partner Withdrawals</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Partners request withdraw from the app. You review first — approve to send to Admin for payment, or reject.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Flow */}
          <div className="mt-5 grid gap-2 rounded-xl bg-gradient-to-r from-teal-700 via-teal-600 to-amber-600 p-3 text-white sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">1</div>
              <div>
                <div className="text-xs font-semibold opacity-80">Partner</div>
                <div className="text-sm font-bold">Requests withdraw</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/20 px-3 py-2.5 ring-2 ring-white/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-teal-900">2</div>
              <div>
                <div className="text-xs font-semibold opacity-90">You (ASM)</div>
                <div className="text-sm font-bold">Approve or Reject</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">3</div>
              <div>
                <div className="text-xs font-semibold opacity-80">Admin</div>
                <div className="text-sm font-bold">Pays approved requests</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Pending your review", value: counts.PENDING_ASM, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
            { label: "Approved → Admin", value: counts.PENDING_ADMIN, color: "text-sky-700", bg: "bg-sky-50 border-sky-100" },
            { label: "Paid", value: counts.PAID, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
            { label: "Rejected", value: counts.REJECTED, color: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</div>
              <div className={`mt-1 text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    tab === t.key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 ${tab === t.key ? "text-teal-100" : "text-slate-400"}`}>
                    {counts[t.key] ?? 0}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search partner / note…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center text-slate-500 shadow-sm">
              Loading withdraw requests…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center shadow-sm">
              <Clock3 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <div className="text-base font-semibold text-slate-700">No requests here</div>
              <div className="mt-1 text-sm text-slate-500">
                {tab === "PENDING_ASM"
                  ? "No partner withdraw requests waiting for your review."
                  : "Try another status tab or clear search."}
              </div>
            </div>
          ) : (
            filtered.map((row) => {
              const p = row.partnerId || {};
              const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Partner";
              const st = STATUS[row.status] || STATUS.PENDING_ASM;
              const canAct = row.status === "PENDING_ASM";
              return (
                <div
                  key={row._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-slate-900">{name}</h3>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${st.chip}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{p.partnerCode || p.employeeId || "—"}</span>
                          {p.phone ? <span>{p.phone}</span> : null}
                          {p.email ? <span className="truncate">{p.email}</span> : null}
                        </div>
                        {row.note ? (
                          <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-600">
                            Note: {row.note}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-400">
                          Requested {row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "—"}
                          {row.asmReviewedAt
                            ? ` · Reviewed ${new Date(row.asmReviewedAt).toLocaleString("en-IN")}`
                            : ""}
                          {row.rejectReason ? ` · Reason: ${row.rejectReason}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:pl-4">
                      <div className="rounded-xl bg-teal-50 px-4 py-2 text-center">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">Amount</div>
                        <div className="text-xl font-extrabold text-teal-800">{formatINR(row.amount)}</div>
                      </div>
                      {canAct ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busyId === row._id}
                            onClick={() => setConfirmApprove(row)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 sm:flex-none"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                            <ArrowRight className="h-3.5 w-3.5 opacity-80" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row._id}
                            onClick={() => {
                              setRejectReason("");
                              setRejectModal(row);
                            }}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60 sm:flex-none"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      ) : row.status === "PENDING_ADMIN" ? (
                        <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                          Waiting for Admin to pay
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Approve confirm */}
      {confirmApprove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Approve & send to Admin?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This withdraw of <span className="font-bold text-teal-700">{formatINR(confirmApprove.amount)}</span> will move to Admin for payment.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmApprove(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === confirmApprove._id}
                onClick={() => approve(confirmApprove._id)}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {busyId === confirmApprove._id ? "Sending…" : "Yes, approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reject modal */}
      {rejectModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject withdraw request</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Amount {formatINR(rejectModal.amount)}. Partner will be notified.
                </p>
              </div>
              <button type="button" onClick={() => setRejectModal(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Reason (optional)
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Why is this being rejected?"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === rejectModal._id}
                onClick={reject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {busyId === rejectModal._id ? "Rejecting…" : "Reject request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AsmWithdrawals;
