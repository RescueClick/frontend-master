import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IndianRupee, TrendingUp, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import PageHeader from "../../../components/shared/PageHeader";
import FiltersBar from "../../../components/shared/FiltersBar";
import ChartCard from "../../../components/shared/ChartCard";
import { fetchAnalyticsKpis } from "../../../feature/thunks/analyticsThunks";
import { designSystem, formatCurrency } from "../../../utils/designSystem";
import { getAuthData } from "../../../utils/localStorage";

function toYmd(d) {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function presetToRange(preset) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  const p = preset || "30d";
  if (p === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (p === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (p === "30d") {
    start.setDate(start.getDate() - 29);
  } else if (p === "mtd") {
    start.setDate(1);
  } else if (p === "ytd") {
    start.setMonth(0, 1);
  } else {
    return { start: null, end: null };
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const PartnerAnalytics = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = getAuthData();
  const partnerId = auth?.partnerUser?._id;

  const [filters, setFilters] = useState({ preset: "30d" });
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!partnerId) {
      setError("Partner not found. Please login again.");
      return;
    }

    const { preset, customStart, customEnd } = filters || {};
    const presetRange = preset === "custom" ? null : presetToRange(preset);
    const startDate = preset === "custom" ? customStart : presetRange?.start;
    const endDate = preset === "custom" ? customEnd : presetRange?.end;

    const start = startDate ? toYmd(startDate) : null;
    const end = endDate ? toYmd(endDate) : null;

    setLoading(true);
    setError(null);

    dispatch(fetchAnalyticsKpis({ id: partnerId, start, end }))
      .unwrap()
      .then((res) => setKpis(res?.data?.kpis || null))
      .catch((e) => setError(String(e || "Failed to load analytics")))
      .finally(() => setLoading(false));
  }, [dispatch, partnerId, filters]);

  const trends = useMemo(() => {
    const t = Array.isArray(kpis?.trends) ? kpis.trends : [];
    return t.map((r) => ({
      period: r.period,
      payouts: Number(r.payouts || 0),
      incentives: Number(r.incentives || 0),
      submitted: Number(r.submitted || 0),
      disbursed: Number(r.disbursed || 0),
    }));
  }, [kpis]);

  const totalEarnings = useMemo(
    () => trends.reduce((s, r) => s + (r.payouts || 0) + (r.incentives || 0), 0),
    [trends]
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: designSystem.colors.background }}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <PageHeader
            title="My Analytics"
            subtitle="Your earnings and performance trends"
            right={
              <button
                type="button"
                onClick={() => navigate("/partner/dashboard")}
                className="text-sm px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            }
          />
        </div>

        <FiltersBar value={filters} onChange={setFilters} className="mb-6" />

        {error ? (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Earnings Trend"
            subtitle="Incentive + payout trend"
            right={
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <IndianRupee className="w-4 h-4" />
                <span className="font-semibold">Total: {formatCurrency(totalEarnings)}</span>
              </div>
            }
          >
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : trends.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v || 0)), "Amount"]} />
                  <Legend />
                  <Line type="monotone" dataKey="payouts" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="incentives" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-center px-6">
                <div>
                  <p className="text-sm font-semibold text-gray-800">No earnings data</p>
                  <p className="text-xs text-gray-500 mt-1">Try expanding the date range.</p>
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="My Performance"
            subtitle="Apps submitted vs disbursed"
            right={
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span className="font-semibold">
                  Submitted {trends.reduce((s, r) => s + r.submitted, 0)} • Disbursed{" "}
                  {trends.reduce((s, r) => s + r.disbursed, 0)}
                </span>
              </div>
            }
          >
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : trends.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submitted" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="disbursed" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-center px-6">
                <div>
                  <p className="text-sm font-semibold text-gray-800">No performance data</p>
                  <p className="text-xs text-gray-500 mt-1">Try expanding the date range.</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-4 h-4" />
              <span>Performance is aggregated monthly for the selected range.</span>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default PartnerAnalytics;

