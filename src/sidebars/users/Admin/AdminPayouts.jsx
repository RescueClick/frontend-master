import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IndianRupee, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import {
  fetchAdminCustomersPayOutPending,
  fetchAdminCustomersPayOutDone,
} from "../../../feature/thunks/adminThunks";
import { useNavigate } from "react-router-dom";
import { matchesMonthYear } from "../../../utils/dateFilter";

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

  const filteredPending = useMemo(() => {
    const list = Array.isArray(pendingData) ? pendingData : [];
    return list.filter((row) => matchesMonthYear(row, { year, month }));
  }, [pendingData, year, month]);

  const filteredDone = useMemo(() => {
    const list = Array.isArray(doneData) ? doneData : [];
    return list.filter((row) => matchesMonthYear(row, { year, month }));
  }, [doneData, year, month]);

  useEffect(() => {
    dispatch(fetchAdminCustomersPayOutPending());
    dispatch(fetchAdminCustomersPayOutDone());
  }, [dispatch]);

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
        <div className="flex items-center mb-4">
          <button
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

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <IndianRupee size={24} className="mr-3 w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Payouts</h2>
            </div>

            <div className="flex gap-3 text-sm">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
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
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
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
              count={filteredPending?.length || 0}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/admin/pending-payout"
            />

            <PayoutCard
              title="Done Payout"
              count={filteredDone?.length || 0}
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


