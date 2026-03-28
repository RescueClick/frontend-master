import React, { useState, useEffect } from "react";
import { Search, Award, TrendingUp, Target, CheckCircle, ArrowLeft, IndianRupee, X } from "lucide-react";
import { fetchIncentives, payIncentive } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
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

const AsmEligibleIncentive = () => {
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
    (state) => state.asm.incentives || { data: [], loading: false }
  );

  useEffect(() => {
    dispatch(fetchIncentives({ year, month }));
  }, [dispatch, year, month]);

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [basis, setBasis] = useState("PERCENT");
  const [percentValue, setPercentValue] = useState("");
  const [fixedValue, setFixedValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const incentives = Array.isArray(data) ? data : [];

  // Only show ELIGIBLE but NOT PAID partners in Eligible screen
  const eligibleIncentives = incentives.filter(
    (i) => i.eligibleForIncentive && !i.incentivePaid
  );

  // Filter list by search term
  const filteredIncentives = eligibleIncentives.filter((incentive) => {
    const term = searchTerm.toLowerCase();
    return (
      incentive.partnerName?.toLowerCase().includes(term) ||
      incentive.partnerEmployeeId?.toLowerCase().includes(term)
    );
  });

  const eligibleCount = filteredIncentives.length;

  const handleOpenModal = (row) => {
    setSelectedPartner(row);
    setBasis("PERCENT");
    setPercentValue("");
    setFixedValue("");
  };

  const eligibleAsmColumns = [
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
            {filesAchieved} / {fileTarget}
          </span>
        );
      },
    },
    {
      title: "Disbursement Target",
      key: "dt",
      render: (_, incentive) => {
        const disbursementTarget = incentive.disbursementTarget ?? 2000000;
        return <span className="font-semibold">{fmtInr0(disbursementTarget)}</span>;
      },
    },
    {
      title: "Disbursement Achieved",
      key: "da",
      render: (_, incentive) => {
        const disbursementAchieved =
          incentive.achievedDisbursement ?? incentive.totalAchieved ?? 0;
        return (
          <span className="font-semibold text-green-600">
            {fmtInr0(disbursementAchieved)}
          </span>
        );
      },
    },
    {
      title: "Eligible",
      key: "el",
      render: () => (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Eligible
        </span>
      ),
    },
    {
      title: "Incentive Amount",
      key: "amt",
      render: (_, incentive) => {
        const proposedAmount =
          incentive.proposedAmount || incentive.incentiveAmount || 0;
        return (
          <span className="font-semibold">
            {proposedAmount ? fmtInr0(proposedAmount) : "—"}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "act",
      render: (_, incentive) => (
        <button
          type="button"
          className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => handleOpenModal(incentive)}
        >
          Set Incentive
        </button>
      ),
    },
  ];

  const handleSaveIncentive = async () => {
    if (!selectedPartner) return;

    const partnerId = selectedPartner.partnerId;
    let amount = 0;

    if (basis === "PERCENT") {
      const pct = Number(percentValue);
      if (!pct || pct <= 0) return;
      amount = (selectedPartner.achievedDisbursement * pct) / 100;
    } else {
      const fixed = Number(fixedValue);
      if (!fixed || fixed <= 0) return;
      amount = fixed;
    }

    setIsSaving(true);
    try {
      await dispatch(
        payIncentive({
          partnerId,
          basis,
          percentValue: basis === "PERCENT" ? Number(percentValue) : null,
          fixedValue: basis === "FIXED" ? Number(fixedValue) : null,
          amount: Math.round(amount),
          month,
          year,
          notes: "",
        })
      ).unwrap();
      setSelectedPartner(null);
      setBasis("PERCENT");
      setPercentValue("");
      setFixedValue("");
      dispatch(fetchIncentives({ year, month }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/asm/incentives")}
            className="flex items-center text-lg text-gray-600 hover:text-gray-800 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Incentives
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Eligible Incentives</h1>
        <p className="text-gray-600 mt-1">
          Partners who have exceeded targets and are eligible for incentive payment
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by partner name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
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
            <p className="text-gray-600 text-sm font-medium">Total Eligible Incentives</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{eligibleCount}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      <AppAntTable
        rowKey={(r) => String(r.partnerId ?? r.partnerEmployeeId ?? "")}
        columns={eligibleAsmColumns}
        dataSource={filteredIncentives}
        loading={loading}
        size="small"
        locale={{
          emptyText: (
            <div className="py-8 text-center text-gray-500">
              No eligible incentives found
            </div>
          ),
        }}
      />

      {/* ASM Incentive Proposal Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => !isSaving && setSelectedPartner(null)}
              disabled={isSaving}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create Incentive Proposal
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Partner</p>
                <p className="font-semibold">
                  {selectedPartner.partnerName}{" "}
                  <span className="text-xs text-gray-500">
                    ({selectedPartner.partnerEmployeeId})
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 mb-1">Files (Target / Achieved)</p>
                  <p className="font-semibold">
                    {selectedPartner.achievedFileCount} /{" "}
                    {selectedPartner.fileCountTarget}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">
                    Disbursement (Target / Achieved)
                  </p>
                  <p className="font-semibold">
                    {formatCurrency(selectedPartner.achievedDisbursement)} /{" "}
                    {formatCurrency(selectedPartner.disbursementTarget)}
                  </p>
                </div>
              </div>

              <div className="border rounded-xl p-3 bg-gray-50 space-y-3">
                <p className="text-gray-700 font-semibold mb-1">
                  Incentive Basis
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="PERCENT"
                      checked={basis === "PERCENT"}
                      onChange={() => setBasis("PERCENT")}
                    />
                    <span>Percentage of disbursement</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="FIXED"
                      checked={basis === "FIXED"}
                      onChange={() => setBasis("FIXED")}
                    />
                    <span>Fixed INR amount</span>
                  </label>
                </div>

                {basis === "PERCENT" ? (
                  <div>
                    <p className="text-gray-500 mb-1 text-xs">
                      Incentive percentage on achieved disbursement
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={percentValue}
                        onChange={(e) => setPercentValue(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        placeholder="%"
                      />
                      <span className="text-xs text-gray-500">
                        ≈{" "}
                        {percentValue
                          ? formatCurrency(
                              (selectedPartner.achievedDisbursement *
                                Number(percentValue || 0)) / 100
                            )
                          : "₹0"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 mb-1 text-xs">
                      Fixed incentive amount in INR
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">₹</span>
                      <input
                        type="number"
                        value={fixedValue}
                        onChange={(e) => setFixedValue(e.target.value)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        placeholder="Amount"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => !isSaving && setSelectedPartner(null)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveIncentive}
                disabled={isSaving}
                className={`px-4 py-2 text-sm rounded-lg text-white flex items-center gap-2 ${
                  isSaving
                    ? "bg-emerald-700/70 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSaving ? "Saving..." : "Save Incentive Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsmEligibleIncentive;


