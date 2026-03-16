import React, { useState, useEffect } from "react";
import { Award, Clock, CheckCircle, IndianRupee } from "lucide-react";
import { fetchIncentives } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const AsmIncentives = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data, loading } = useSelector(
    (state) => state.asm.incentives || { data: [], loading: false }
  );

  useEffect(() => {
    dispatch(fetchIncentives({ year, month }));
  }, [dispatch, year, month]);

  const incentives = Array.isArray(data) ? data : [];
  
  // Separate pending and done incentives
  const pendingIncentives = incentives.filter((i) => !i.eligibleForIncentive);
  const doneIncentives = incentives.filter((i) => i.eligibleForIncentive);

  const PayoutCard = ({ title, count, iconName, bgGradient, path }) => {
    const IconComponent = iconName === "Clock" ? Clock : CheckCircle;
    
    return (
      <div
        className="rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        style={{ background: bgGradient }}
        onClick={() => navigate(path, { state: { year, month } })}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-3xl font-bold text-white">{count || 0}</p>
          </div>

          {/* Icon bubble */}
          <div className="p-3 rounded-full bg-white/20">
            <IconComponent size={32} className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Incentive Management</h1>
          <p className="text-gray-600">Track partner target achievements and incentives</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-4">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
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
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
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

        {/* Incentive Cards Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-6">
            <Award size={24} className="mr-3 w-6 h-6 text-[#12B99C]" />
            <h2 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Incentives
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PayoutCard
              title="Pending Incentive"
              count={pendingIncentives.length}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/asm/pending-incentive"
            />

            <PayoutCard
              title="Done Incentive"
              count={doneIncentives.length}
              iconName="CheckCircle"
              bgGradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              path="/asm/done-incentive"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsmIncentives;
