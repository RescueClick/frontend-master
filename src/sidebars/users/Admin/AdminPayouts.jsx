import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IndianRupee, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import {
  fetchAdminCustomersPayOutPending,
  fetchAdminCustomersPayOutDone,
} from "../../../feature/thunks/adminThunks";
import { useNavigate } from "react-router-dom";
import { matchesMonthYear } from "../../../utils/dateFilter";

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const sumPayoutAmount = (rows) =>
  (Array.isArray(rows) ? rows : []).reduce(
    (sum, row) => sum + (Number(row?.payoutAmount) || 0),
    0
  );

const AdminPayouts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data: pendingData = [] } = useSelector(
    (state) => state.admin?.pendingPayout || { data: [] }
  );
  const { data: doneData = [] } = useSelector(
    (state) => state.admin?.donePayout || { data: [] }
  );

  const allPending = useMemo(
    () => (Array.isArray(pendingData) ? pendingData : []),
    [pendingData]
  );
  const allDone = useMemo(
    () => (Array.isArray(doneData) ? doneData : []),
    [doneData]
  );

  const filteredPending = useMemo(
    () => allPending.filter((row) => matchesMonthYear(row, { year, month })),
    [allPending, year, month]
  );

  const filteredDone = useMemo(
    () => allDone.filter((row) => matchesMonthYear(row, { year, month })),
    [allDone, year, month]
  );

  const allPendingCount = allPending.length;
  const allDoneCount = allDone.length;
  const allPendingAmount = useMemo(() => sumPayoutAmount(allPending), [allPending]);
  const allDoneAmount = useMemo(() => sumPayoutAmount(allDone), [allDone]);
  const monthPendingAmount = useMemo(
    () => sumPayoutAmount(filteredPending),
    [filteredPending]
  );
  const monthDoneAmount = useMemo(
    () => sumPayoutAmount(filteredDone),
    [filteredDone]
  );

  useEffect(() => {
    dispatch(fetchAdminCustomersPayOutPending());
    dispatch(fetchAdminCustomersPayOutDone());
  }, [dispatch]);

  const monthLabel = new Date(year, month - 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  const PayoutCard = ({
    title,
    count,
    amount,
    subtitle,
    iconName,
    bgGradient,
    path,
    passMonth = true,
    navState,
  }) => {
    const IconComponent = iconName === "Clock" ? Clock : CheckCircle;

    return (
      <div
        className="rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        style={{ background: bgGradient }}
        onClick={() =>
          navigate(
            path,
            navState
              ? { state: navState }
              : passMonth
                ? { state: { year, month } }
                : undefined
          )
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            {subtitle ? (
              <p className="text-xs text-white/80 mb-2">{subtitle}</p>
            ) : null}
            <p className="text-3xl font-bold text-white leading-tight">
              {count || 0}
              <span className="ml-2 text-base font-medium text-white/90">
                files
              </span>
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatInr(amount)}
            </p>
          </div>
          <div className="p-3 rounded-full bg-white/20 shrink-0">
            <IconComponent size={32} className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center text-lg text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Dashboard
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payout Management
          </h1>
          <p className="text-gray-600">
            Manage partner payouts for disbursed loans
          </p>
        </div>

        {/* All months totals */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <IndianRupee size={22} className="mr-2 w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              All months total
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Combined pending and done across every month
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PayoutCard
              title="Total Pending"
              subtitle="All months"
              count={allPendingCount}
              amount={allPendingAmount}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/admin/pending-payout"
              passMonth={false}
              navState={{ allMonths: true }}
            />
            <PayoutCard
              title="Total Done"
              subtitle="All months"
              count={allDoneCount}
              amount={allDoneAmount}
              iconName="CheckCircle"
              bgGradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              path="/admin/done-payout"
              passMonth={false}
              navState={{ allMonths: true }}
            />
          </div>
        </div>

        {/* Month-filtered totals */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center">
              <IndianRupee size={24} className="mr-3 w-6 h-6 text-emerald-600" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  By month
                </h2>
                <p className="text-sm text-gray-500">{monthLabel}</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString("default", {
                      month: "short",
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PayoutCard
              title="Pending Payout"
              subtitle={monthLabel}
              count={filteredPending.length}
              amount={monthPendingAmount}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/admin/pending-payout"
            />

            <PayoutCard
              title="Done Payout"
              subtitle={monthLabel}
              count={filteredDone.length}
              amount={monthDoneAmount}
              iconName="CheckCircle"
              bgGradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              path="/admin/done-payout"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayouts;
