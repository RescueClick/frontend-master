import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Search, Calendar, Gift, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { matchesSearchTerm } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";
import AppAntTable from "../../../components/shared/AppAntTable";

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function statusClass(status) {
  const map = {
    PENDING: "bg-amber-50 text-amber-800 border-amber-100",
    APPROVED: "bg-sky-50 text-sky-800 border-sky-100",
    PAID: "bg-emerald-50 text-emerald-800 border-emerald-100",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return map[status] || "bg-slate-50 text-slate-700 border-slate-100";
}

export default function PartnerReferralRewardHistory() {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const { partnerToken } = getAuthData();
        const params = { year, month };
        if (status) params.status = status;
        const res = await axios.get(`${backendurl}/partner/referral-rewards/history`, {
          params,
          headers: {
            ...(partnerToken ? { Authorization: `Bearer ${partnerToken}` } : {}),
          },
        });
        setRows(Array.isArray(res.data?.rewards) ? res.data.rewards : []);
        setTotalAmount(Number(res.data?.totalAmount) || 0);
        setPaidTotal(Number(res.data?.paidTotal) || 0);
      } catch (err) {
        console.error("Error fetching referral rewards:", err);
        setRows([]);
        setTotalAmount(0);
        setPaidTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, [year, month, status]);

  const filtered = rows.filter((row) =>
    matchesSearchTerm(searchTerm, [
      row?.applicationId?.appNo,
      row?.applicationId?.loanType,
      row?.referredUserId?.partnerCode,
      row?.referredUserId?.firstName,
      row?.referredUserId?.lastName,
      row?.referredUserId?.employeeId,
      row?.paymentReference,
      row?.status,
      row?.eventType,
      row?.amount,
    ])
  );

  const sortedFiltered = sortNewestFirst(filtered, { dateKeys: ["createdAt", "updatedAt"] });

  const columns = useMemo(
    () => [
      {
        title: "Date",
        key: "dt",
        render: (_, row) =>
          row.createdAt
            ? new Date(row.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
      },
      {
        title: "Event",
        key: "ev",
        render: (_, row) => (
          <span className="text-xs font-medium uppercase text-slate-700">
            {row.eventType || "-"}
          </span>
        ),
      },
      {
        title: "Downline",
        key: "dl",
        render: (_, row) => {
          const u = row.referredUserId;
          if (!u) return "-";
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-800">{name}</div>
              <div className="text-slate-500">{u.partnerCode || u.employeeId || ""}</div>
            </div>
          );
        },
      },
      {
        title: "Application",
        key: "app",
        render: (_, row) => {
          const a = row.applicationId;
          if (!a) return <span className="text-slate-400">—</span>;
          return (
            <div className="text-xs">
              <div className="font-medium">{a.appNo || "—"}</div>
              <div className="text-slate-500">{loanTypeToTableShort(a.loanType)}</div>
            </div>
          );
        },
      },
      {
        title: "Disbursed amt",
        key: "dis",
        render: (_, row) => formatInr(row.applicationId?.approvedLoanAmount),
      },
      {
        title: "Reward",
        key: "amt",
        render: (_, row) => (
          <span className="font-semibold text-slate-900">{formatInr(row.amount)}</span>
        ),
      },
      {
        title: "Status",
        key: "st",
        render: (_, row) => (
          <span
            className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium border ${statusClass(row.status)}`}
          >
            {row.status || "—"}
          </span>
        ),
      },
      {
        title: "Payment ref",
        key: "ref",
        render: (_, row) => (
          <span className="text-xs text-slate-600 break-all max-w-[140px] inline-block">
            {row.status === "PAID" && row.paymentReference ? row.paymentReference : "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => navigate("/partner/dashboard")}
              className="flex items-center text-lg text-gray-600 hover:text-gray-800 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-8 h-8 text-teal-600" />
            Referral rewards
          </h1>
          <p className="text-gray-600 mt-1">
            Rewards when your referred partners sign up or when their loans disburse. Totals are for the
            selected month.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex-1 relative w-full">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search app no, partner code, status, amount…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:max-w-md pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
              min="2020"
              max="2100"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Total reward (this month)</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatInr(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Paid to you (this month)</p>
              <p className="text-2xl font-bold text-emerald-700 mt-2">{formatInr(paidTotal)}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <IndianRupee size={24} />
            </div>
          </div>
        </div>

        <AppAntTable
          rowKey={(row, idx) => String(row?._id ?? idx)}
          columns={columns}
          dataSource={sortedFiltered}
          loading={loading}
          size="small"
          locale={{
            emptyText: (
              <div className="py-8 text-center text-gray-500">
                No referral rewards for this month and filters.
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}
