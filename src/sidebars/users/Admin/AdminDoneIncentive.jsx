import React, { useState, useEffect, useMemo } from "react";
import { Search, Award, TrendingUp, Target, CheckCircle, ArrowLeft, IndianRupee } from "lucide-react";
import { fetchAdminIncentives } from "../../../feature/thunks/adminThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import AppAntTable from "../../../components/shared/AppAntTable";

const fmtInr0 = (amount) => {
  if (!amount) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const colors = {
  primary: "var(--color-brand-primary)",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

const AdminDoneIncentive = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get year and month from location state or use current
  const [year, setYear] = useState(
    location.state?.year || new Date().getFullYear()
  );
  const [month, setMonth] = useState(
    location.state?.month || new Date().getMonth() + 1
  );

  const { data, loading } = useSelector(
    (state) => state.admin.incentives || { data: [], loading: false }
  );

  useEffect(() => {
    // For admin, use status filter "PAID" (done incentives)
    dispatch(fetchAdminIncentives({ status: "PAID", year, month }));
  }, [dispatch, year, month]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const incentives = Array.isArray(data) ? data : [];

  const filteredIncentives = incentives.filter((incentive) => {
    const term = searchTerm.toLowerCase();
    return (
      incentive.partnerName?.toLowerCase().includes(term) ||
      incentive.partnerEmployeeId?.toLowerCase().includes(term)
    );
  });

  const sortedFilteredIncentives = sortNewestFirst(filteredIncentives, {
    dateKeys: ["createdAt", "updatedAt"],
  });

  const doneIncentiveColumns = useMemo(
    () => [
      {
        title: "Partner",
        key: "p",
        render: (_, incentive) => (
          <div>
            <p className="font-medium">{incentive.partnerName}</p>
            <p className="text-xs text-gray-500">{incentive.partnerEmployeeId}</p>
          </div>
        ),
      },
      {
        title: "File Target",
        key: "ft",
        render: (_, incentive) => {
          const fileTarget = incentive.fileCountTarget ?? 4;
          return <span className="font-semibold">{fileTarget} files</span>;
        },
      },
      {
        title: "Files Achieved",
        key: "fa",
        render: (_, incentive) => {
          const fileTarget = incentive.fileCountTarget ?? 4;
          const filesAchieved =
            incentive.achievedFileCount ?? incentive.disbursedCount ?? 0;
          return (
            <span className="font-semibold text-green-600">
              {filesAchieved} / {fileTarget} ✓
            </span>
          );
        },
      },
      {
        title: "Disbursement Target",
        key: "dt",
        render: (_, incentive) => {
          const disbursementTarget = incentive.disbursementTarget ?? 2000000;
          return (
            <span className="font-semibold">{fmtInr0(disbursementTarget)}</span>
          );
        },
      },
      {
        title: "Disbursement Achieved",
        key: "da",
        render: (_, Incentive) => {
          const disbursementAchieved =
            Incentive.achievedDisbursement ?? Incentive.totalAchieved ?? 0;
          return (
            <span className="font-semibold text-green-600">
              {fmtInr0(disbursementAchieved)} ✓
            </span>
          );
        },
      },
      {
        title: "Incentive",
        key: "inc",
        render: (_, incentive) => {
          const incentiveAmount = incentive.incentiveAmount ?? 0;
          return incentiveAmount > 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              ₹{incentiveAmount.toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-xs text-gray-500">Target Met</span>
          );
        },
      },
      {
        title: "Status",
        key: "st",
        render: () => (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Done
          </span>
        ),
      },
      {
        title: "Action",
        key: "act",
        render: () => (
          <span className="text-xs text-gray-500">View Only</span>
        ),
      },
    ],
    []
  );

  // Admin cannot change status here; this screen is view-only for done incentives

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/admin/incentives")}
            className="flex items-center text-lg text-gray-600 hover:text-gray-800 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Incentives
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Done Incentives</h1>
        <p className="text-gray-600 mt-1">
          Partners whose incentives have been paid for the selected period.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative w-full md:w-auto">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by partner name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 text-sm">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "short" })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Done Incentives</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{sortedFilteredIncentives.length}</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      <AppAntTable
        rowKey={(r) => String(r.partnerId ?? r.partnerEmployeeId ?? "")}
        columns={doneIncentiveColumns}
        dataSource={sortedFilteredIncentives}
        loading={loading}
        size="small"
        locale={{
          emptyText: (
            <div className="py-8 text-center text-gray-500">
              No done incentives found
            </div>
          ),
        }}
      />

    </div>
  );
};

export default AdminDoneIncentive;

