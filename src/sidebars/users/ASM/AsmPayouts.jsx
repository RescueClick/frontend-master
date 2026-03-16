import React, { useState, useEffect } from "react";
import { Search, Filter, CheckCircle, X, IndianRupee, Eye, Calendar, Clock } from "lucide-react";
import { fetchPayouts, approvePayout, createPayout, fetchDisbursedApplications, fetchAsmCustomersPayOutPending, fetchAsmCustomersPayOutDone } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AsmPayouts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: pendingData, loading: pendingLoading } = useSelector(
    (state) => state.asm?.pendingPayout || { data: [], loading: false }
  );

  const { data: doneData, loading: doneLoading } = useSelector(
    (state) => state.asm?.donePayout || { data: [], loading: false }
  );

  useEffect(() => {
    dispatch(fetchAsmCustomersPayOutPending());
    dispatch(fetchAsmCustomersPayOutDone());
  }, [dispatch]);

  const PayoutCard = ({ title, count, iconName, bgGradient, path }) => {
    const IconComponent = iconName === "Clock" ? Clock : CheckCircle;
    
    return (
      <div
        className="rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        style={{ background: bgGradient }}
        onClick={() => navigate(path)}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payout Management</h1>
          <p className="text-gray-600">Manage partner payouts for disbursed loans</p>
        </div>

        {/* Payout Cards Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-6">
            <IndianRupee size={24} className="mr-3 w-6 h-6 text-[#12B99C]" />
            <h2 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Payouts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PayoutCard
              title="Pending Payout"
              count={pendingData?.length || 0}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/asm/pending-payout"
            />

            <PayoutCard
              title="Done Payout"
              count={doneData?.length || 0}
              iconName="CheckCircle"
              bgGradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              path="/asm/done-payout"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsmPayouts;
