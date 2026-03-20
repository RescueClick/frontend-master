import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "../../utils/designSystem";

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

const AGE_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export const FunnelChart = ({ kpis }) => {
  const data = useMemo(() => {
    const funnel = kpis?.funnel || {};
    return [
      { stage: "Applications", value: safeNum(funnel.application) },
      { stage: "Approved", value: safeNum(funnel.approved) },
      { stage: "Disbursed", value: safeNum(funnel.disbursed) },
      { stage: "Rejected", value: safeNum(funnel.rejected) },
    ];
  }, [kpis]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#6B7280" />
        <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
        <Tooltip />
        <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ConversionChart = ({ kpis }) => {
  const data = useMemo(() => {
    const c = kpis?.conversion || {};
    return [
      { metric: "App→Approved", pct: safeNum(c.application_to_approved_pct) },
      { metric: "Approved→Disbursed", pct: safeNum(c.approved_to_disbursed_pct) },
      { metric: "App→Disbursed", pct: safeNum(c.application_to_disbursed_pct) },
      { metric: "App→Rejected", pct: safeNum(c.application_to_rejected_pct) },
    ];
  }, [kpis]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="#6B7280" />
        <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" domain={[0, 100]} />
        <Tooltip formatter={(v) => [`${safeNum(v)}%`, "Conversion"]} />
        <Bar dataKey="pct" fill="#3B82F6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const FinancialsChart = ({ kpis }) => {
  const data = useMemo(() => {
    const f = kpis?.financials || {};
    const payouts = f.payouts || {};
    const incentives = f.incentives || {};
    return [
      {
        group: "Payouts",
        Pending: safeNum(payouts.PENDING?.amount),
        Done: safeNum(payouts.DONE?.amount),
      },
      {
        group: "Incentives",
        Pending: safeNum(incentives.PENDING?.amount),
        Paid: safeNum(incentives.PAID?.amount),
      },
    ];
  }, [kpis]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="group" tick={{ fontSize: 11 }} stroke="#6B7280" />
        <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
        <Tooltip formatter={(v) => [formatCurrency(safeNum(v)), "Amount"]} />
        <Legend />
        <Bar dataKey="Pending" stackId="a" fill="#F59E0B" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Done" stackId="a" fill="#10B981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Paid" stackId="b" fill="#10B981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const AgingChart = ({ kpis, variant = "pie" }) => {
  const { byStatus, totalBuckets, totalCount } = useMemo(() => {
    const aging = kpis?.sla?.aging || {};
    const entries = Object.entries(aging);

    const byStatusData = entries.map(([status, buckets]) => ({
      status,
      "<3d": safeNum(buckets?.lt3),
      "3-7d": safeNum(buckets?.d3to7),
      "7-14d": safeNum(buckets?.d7to14),
      "14d+": safeNum(buckets?.gte14),
    }));

    const totals = entries.reduce(
      (acc, [, b]) => {
        acc.lt3 += safeNum(b?.lt3);
        acc.d3to7 += safeNum(b?.d3to7);
        acc.d7to14 += safeNum(b?.d7to14);
        acc.gte14 += safeNum(b?.gte14);
        return acc;
      },
      { lt3: 0, d3to7: 0, d7to14: 0, gte14: 0 }
    );

    const bucketData = [
      { name: "<3d", value: totals.lt3 },
      { name: "3-7d", value: totals.d3to7 },
      { name: "7-14d", value: totals.d7to14 },
      { name: "14d+", value: totals.gte14 },
    ];

    const sum = bucketData.reduce((s, x) => s + safeNum(x.value), 0);
    const openCountApi = safeNum(kpis?.sla?.openCount);

    return {
      byStatus: byStatusData,
      totalBuckets: bucketData,
      // Prefer backend-provided openCount when present (even if buckets are empty)
      totalCount: openCountApi || sum,
    };
  }, [kpis]);

  if (!totalCount) {
    return (
      <div className="h-[260px] flex items-center justify-center text-center px-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">No open applications</p>
          <p className="text-xs text-gray-500 mt-1">Nothing to age in the selected range.</p>
        </div>
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={byStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="<3d" stackId="age" fill={AGE_COLORS[0]} />
          <Bar dataKey="3-7d" stackId="age" fill={AGE_COLORS[1]} />
          <Bar dataKey="7-14d" stackId="age" fill={AGE_COLORS[2]} />
          <Bar dataKey="14d+" stackId="age" fill={AGE_COLORS[3]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie
          data={totalBuckets}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={45}
          paddingAngle={2}
          isAnimationActive={false}
        >
          {totalBuckets.map((_, idx) => (
            <Cell key={`cell-${idx}`} fill={AGE_COLORS[idx % AGE_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

