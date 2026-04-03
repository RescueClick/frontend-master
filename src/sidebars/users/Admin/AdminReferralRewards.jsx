import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Loader2,
  Pencil,
} from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import AppAntTable from "../../../components/shared/AppAntTable";

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function statusPill(status) {
  const map = {
    PENDING: "bg-amber-100 text-amber-900",
    APPROVED: "bg-sky-100 text-sky-900",
    PAID: "bg-emerald-100 text-emerald-900",
    CANCELLED: "bg-slate-200 text-slate-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

const STATUS_KEYS = ["PENDING", "APPROVED", "PAID", "CANCELLED"];

export default function AdminReferralRewards() {
  const [summary, setSummary] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  const [editRow, setEditRow] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [payRow, setPayRow] = useState(null);
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [busy, setBusy] = useState(false);

  const authHeader = useMemo(() => {
    const { adminToken } = getAuthData();
    return { Authorization: `Bearer ${adminToken}` };
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendurl}/admin/referral-rewards/summary`, {
        headers: authHeader,
      });
      setSummary(data?.byStatus || null);
    } catch (e) {
      console.error(e);
    }
  }, [authHeader]);

  const loadRewards = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (eventFilter) params.eventType = eventFilter;
      const { data } = await axios.get(`${backendurl}/admin/referral-rewards`, {
        params,
        headers: authHeader,
      });
      setRewards(Array.isArray(data.rewards) ? data.rewards : []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load rewards");
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader, page, statusFilter, eventFilter]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const act = useCallback(
    async (path, body, msg) => {
      setBusy(true);
      try {
        await axios.patch(`${backendurl}${path}`, body || {}, { headers: authHeader });
        toast.success(msg || "Done");
        await loadRewards();
        await loadSummary();
      } catch (e) {
        toast.error(e.response?.data?.message || "Action failed");
      } finally {
        setBusy(false);
      }
    },
    [authHeader, loadRewards, loadSummary]
  );

  const saveEdit = async () => {
    if (!editRow?._id) return;
    const amt = Number(editAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    await act(
      `/admin/referral-rewards/${editRow._id}`,
      { amount: amt },
      "Amount updated"
    );
    setEditRow(null);
  };

  const confirmPay = async () => {
    if (!payRow?._id) return;
    await act(
      `/admin/referral-rewards/${payRow._id}/pay`,
      {
        paymentReference: payRef.trim() || undefined,
        note: payNote.trim() || undefined,
      },
      "Marked as paid"
    );
    setPayRow(null);
    setPayRef("");
    setPayNote("");
  };

  const columns = useMemo(
    () => [
      {
        title: "Date",
        key: "dt",
        render: (_, r) =>
          r.createdAt
            ? new Date(r.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
      },
      {
        title: "Type",
        key: "ev",
        render: (_, r) => (
          <span className="font-mono text-xs">{r.eventType || "—"}</span>
        ),
      },
      {
        title: "Referrer (earns)",
        key: "ref",
        render: (_, r) => {
          const u = r.referrerId;
          return u
            ? `${u.firstName || ""} ${u.lastName || ""} · ${u.partnerCode || u.employeeId || ""}`
            : "—";
        },
      },
      {
        title: "Downline partner",
        key: "down",
        render: (_, r) => {
          const u = r.referredUserId;
          return u
            ? `${u.firstName || ""} ${u.lastName || ""} · ${u.partnerCode || ""}`
            : "—";
        },
      },
      {
        title: "Application",
        key: "app",
        render: (_, r) => r.applicationId?.appNo || "—",
      },
      {
        title: "Amount",
        key: "amt",
        render: (_, r) => (
          <span className="font-semibold tabular-nums">{formatInr(r.amount)}</span>
        ),
      },
      {
        title: "Status",
        key: "st",
        render: (_, r) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(r.status)}`}
          >
            {r.status}
          </span>
        ),
      },
      {
        title: "Payment ref",
        key: "pr",
        render: (_, r) => r.paymentReference || "—",
      },
      {
        title: "Actions",
        key: "ac",
        fixed: "right",
        width: 280,
        render: (_, r) => (
          <div className="flex flex-wrap gap-1">
            {["PENDING", "APPROVED"].includes(r.status) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditRow(r);
                  setEditAmount(String(r.amount ?? ""));
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="inline h-3 w-3" /> Edit ₹
              </button>
            ) : null}
            {r.status === "PENDING" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  act(`/admin/referral-rewards/${r._id}/approve`, {}, "Approved")
                }
                className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Approve
              </button>
            ) : null}
            {r.status === "APPROVED" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPayRow(r);
                  setPayRef(r.paymentReference || "");
                  setPayNote("");
                }}
                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Pay
              </button>
            ) : null}
            {["PENDING", "APPROVED"].includes(r.status) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Cancel this referral reward?")) {
                    act(
                      `/admin/referral-rewards/${r._id}/cancel`,
                      {},
                      "Cancelled"
                    );
                  }
                }}
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800 hover:bg-red-100 disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [busy, act]
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to dashboard
        </Link>
      </div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <Banknote className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Referral rewards
            </h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              Same flow as incentives: <span className="font-medium">Pending → Approve → Pay</span>.
              Edit line amounts below; configure default signup / disbursal amounts with the button.
            </p>
          </div>
        </div>
        <Link
          to="/admin/referral-reward-amounts"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-700/20 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:self-start"
        >
          <IndianRupee className="h-4 w-4" aria-hidden />
          Referral reward amounts
        </Link>
      </div>

      {summary ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_KEYS.map((k) => (
            <div
              key={k}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">{k}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary[k]?.count ?? 0} · {formatInr(summary[k]?.totalAmount ?? 0)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">All</option>
            {STATUS_KEYS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Event</label>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            value={eventFilter}
            onChange={(e) => {
              setPage(1);
              setEventFilter(e.target.value);
            }}
          >
            <option value="">All</option>
            <option value="DISBURSED">DISBURSED</option>
            <option value="SIGNUP">SIGNUP</option>
          </select>
        </div>
        <p className="text-sm text-slate-500">Total rows: {total}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 py-12 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading…
          </div>
        ) : (
          <AppAntTable columns={columns} dataSource={rewards} rowKey="_id" />
        )}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-600">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {editRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Edit amount</h3>
            <p className="mt-1 text-sm text-slate-600">Referral reward · {editRow.eventType}</p>
            <label className="mt-4 block text-sm font-medium text-slate-700">Amount (INR)</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={saveEdit}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {payRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Mark as paid</h3>
            <p className="mt-1 text-sm text-slate-600">
              {formatInr(payRow.amount)} · {payRow.applicationId?.appNo || "—"}
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              UTR / payment reference (optional)
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. bank UTR"
            />
            <label className="mt-3 block text-sm font-medium text-slate-700">Note (optional)</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={2}
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPayRow(null);
                  setPayRef("");
                  setPayNote("");
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmPay}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm paid
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
