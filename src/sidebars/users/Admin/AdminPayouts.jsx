import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IndianRupee, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import {
  fetchAdminCustomersPayOutPending,
  fetchAdminCustomersPayOutDone,
} from "../../../feature/thunks/adminThunks";
import { useNavigate } from "react-router-dom";

const AdminPayouts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: pendingData = [] } = useSelector(
    (state) => state.admin?.pendingPayout || { data: [] }
  );
  const { data: doneData = [] } = useSelector(
    (state) => state.admin?.donePayout || { data: [] }
  );

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
        onClick={() => navigate(path)}
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
          <div className="flex items-center mb-6">
            <IndianRupee size={24} className="mr-3 w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Payouts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PayoutCard
              title="Pending Payout"
              count={pendingData?.length || 0}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/admin/pending-payout"
            />

            <PayoutCard
              title="Done Payout"
              count={doneData?.length || 0}
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


