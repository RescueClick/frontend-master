import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Calendar,
  Gift,
  IndianRupee,
  Copy,
  Share2,
  Check,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { matchesSearchTerm } from "../../../utils/tableFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";
import AppAntTable from "../../../components/shared/AppAntTable";
import {
  COMPANY_NAME,
  PARTNER_APP_PLAY_STORE_URL,
  PUBLIC_WEB_ORIGIN,
  appendPartnerShareUtm,
  canonicalPartnerReferralCode,
  legacyReferralAlternate,
  whatsAppShareUrl,
  buildCombinedPartnerReferralMessage,
} from "../../../config/branding";
import { PARTNER_REGISTRATION_ROUTE } from "../../../config/publicReferral";

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

  // Profile data for referral code & invite share
  const [profileData, setProfileData] = useState(null);
  const [inviteHint, setInviteHint] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const { partnerUser, partnerToken } = getAuthData();
    if (partnerUser) {
      setProfileData(partnerUser);
    }
    const fetchProfile = async () => {
      try {
        if (!partnerToken) return;
        const res = await axios.get(`${backendurl}/partner/profile`, {
          headers: { Authorization: `Bearer ${partnerToken}` },
        });
        const p = res?.data?.partner || res?.data;
        if (p) setProfileData(p);
      } catch (err) {
        console.warn("Could not fetch partner profile:", err?.message);
      }
    };
    fetchProfile();
  }, []);

  const referralCodeCanonical = useMemo(
    () => canonicalPartnerReferralCode(profileData?.partnerCode, profileData?.referralCode),
    [profileData?.partnerCode, profileData?.referralCode]
  );

  const referralLegacyAlt = useMemo(
    () => legacyReferralAlternate(profileData?.partnerCode, profileData?.referralCode),
    [profileData?.partnerCode, profileData?.referralCode]
  );

  const webRegistrationUrl = useMemo(() => {
    if (!referralCodeCanonical) {
      return appendPartnerShareUtm(`${PUBLIC_WEB_ORIGIN}${PARTNER_REGISTRATION_ROUTE}`, "web");
    }
    return appendPartnerShareUtm(
      `${PUBLIC_WEB_ORIGIN}${PARTNER_REGISTRATION_ROUTE}?ref=${encodeURIComponent(referralCodeCanonical)}`,
      "web"
    );
  }, [referralCodeCanonical]);

  const playStoreUrlResolved = useMemo(
    () => String(profileData?.playStoreUrl || PARTNER_APP_PLAY_STORE_URL).trim(),
    [profileData?.playStoreUrl]
  );

  const appInviteUrlResolved = useMemo(() => {
    if (!referralCodeCanonical) return "";
    return appendPartnerShareUtm(
      `${PUBLIC_WEB_ORIGIN}/invite?code=${encodeURIComponent(referralCodeCanonical)}`,
      "invite"
    );
  }, [referralCodeCanonical]);

  const combinedReferralMessage = useMemo(
    () =>
      buildCombinedPartnerReferralMessage({
        webRegistrationUrl,
        appInviteUrl: appInviteUrlResolved,
        playStoreUrl: playStoreUrlResolved,
        code: referralCodeCanonical,
        legacyAlt: referralLegacyAlt,
      }),
    [
      webRegistrationUrl,
      appInviteUrlResolved,
      playStoreUrlResolved,
      referralCodeCanonical,
      referralLegacyAlt,
    ]
  );

  const whatsAppCombinedUrl = useMemo(
    () => whatsAppShareUrl(combinedReferralMessage),
    [combinedReferralMessage]
  );

  const copyReferralCode = useCallback(async () => {
    setInviteHint("");
    if (!referralCodeCanonical) {
      setInviteHint("No code available.");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralCodeCanonical);
      setCopiedCode(true);
      setInviteHint("Referral code copied.");
      setTimeout(() => setCopiedCode(false), 2500);
      setTimeout(() => setInviteHint(""), 4000);
    } catch {
      setInviteHint("Could not copy code.");
    }
  }, [referralCodeCanonical]);

  const shareCombinedReferral = useCallback(async () => {
    setInviteHint("");
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${COMPANY_NAME} — Partner referral invite`,
          text: combinedReferralMessage,
        });
        setInviteHint("Invite shared.");
        setTimeout(() => setInviteHint(""), 4000);
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(combinedReferralMessage);
      setInviteHint("Invite message copied.");
      setTimeout(() => setInviteHint(""), 4000);
    } catch {
      setInviteHint("Could not copy message.");
    }
  }, [combinedReferralMessage]);

  const copyCombinedReferral = useCallback(async () => {
    setInviteHint("");
    try {
      await navigator.clipboard.writeText(combinedReferralMessage);
      setInviteHint("Invite message copied.");
      setTimeout(() => setInviteHint(""), 4000);
    } catch {
      setInviteHint("Could not copy message.");
    }
  }, [combinedReferralMessage]);

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
        title: "App No",
        key: "app",
        render: (_, row) => (
          <span className="font-mono text-xs text-slate-800">
            {row?.applicationId?.appNo || "—"}
          </span>
        ),
      },
      {
        title: "Loan",
        key: "lt",
        render: (_, row) => (
          <span className="text-xs text-slate-600">
            {loanTypeToTableShort(row?.applicationId?.loanType) || "-"}
          </span>
        ),
      },
      {
        title: "Amount",
        key: "amt",
        render: (_, row) => (
          <span className="text-xs font-semibold text-teal-700">
            {formatInr(row.amount)}
          </span>
        ),
      },
      {
        title: "Status",
        key: "st",
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass(
              row.status
            )}`}
          >
            {row.status || "-"}
          </span>
        ),
      },
      {
        title: "UTR / Ref",
        key: "utr",
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
        <div className="mb-6">
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
            Rewards earned when your referred partners join and disburse a loan file successfully. Totals are for the
            selected month.
          </p>
        </div>

        {/* Referral Invites Card */}
        <div className="mb-6 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <Gift className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold text-gray-900">Referral Invites &amp; Earn</h2>
              </div>
              <p className="mt-1 text-xs text-gray-600 max-w-2xl">
                Invite other partners to join DhanSource and earn referral payouts when they disburse loans.
              </p>
            </div>
            {inviteHint ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 animate-fade-in">
                {inviteHint}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-dashed border-teal-300 bg-white p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">YOUR REFERRAL CODE</p>
              <p className="font-mono text-xl font-extrabold text-gray-900 mt-0.5">
                {referralCodeCanonical || "—"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyReferralCode}
                disabled={!referralCodeCanonical}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? "Copied!" : "Copy Code"}
              </button>
              <button
                type="button"
                onClick={shareCombinedReferral}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 px-3.5 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Invite
              </button>
              <button
                type="button"
                onClick={copyCombinedReferral}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Msg
              </button>
              <a
                href={whatsAppCombinedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#20ba5a] transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </div>

          {referralLegacyAlt &&
          referralLegacyAlt.toUpperCase() !== (referralCodeCanonical || "").toUpperCase() ? (
            <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Older code: <span className="font-mono font-semibold">{referralLegacyAlt}</span>. Always share your PT code above.
            </p>
          ) : null}
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
          pagination={{ pageSize: 15 }}
          tableId="partner-referral-rewards"
        />
      </div>
    </div>
  );
}
