import React, { useEffect, useState } from "react";
import * as Lucide from "lucide-react"; // dynamic icon loading
import { useNavigate } from "react-router-dom";
import { fetchRmCustomersPayOutDone, fetchRmCustomersPayOutPending } from "../../../feature/thunks/rmThunks";
import { useDispatch, useSelector } from "react-redux";


 
// Small helper to render any Lucide icon by name safely
const AppIcon = ({ name, className = "", size = 24, strokeWidth = 2 }) => {
  const IconCmp = Lucide[name] || Lucide.HelpCircle; // fallback if name is wrong/missing
  return <IconCmp className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
};
 
const RmApplication = () => {

  const dispatch = useDispatch();


  const { data: pendingData, loading: pendingLoading, error: pendingError } =
  useSelector((state) => state.rm.pendingPayout);

const { data: doneData, loading: doneLoading, error: doneError } =
  useSelector((state) => state.rm.donePayout);

  
  useEffect(() => {
    dispatch(fetchRmCustomersPayOutPending());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchRmCustomersPayOutDone());
  }, [dispatch]);
 
  const navigate = useNavigate();
  // Sample data - you can replace with your actual data
  const [payoutData] = useState({
    allPayout: 156,
    pendingPayout: 23,
    donePayout: 133,
  });
 
  const PayoutCard = ({ title, count, iconName, bgGradient, path }) => (
    <div
      className="rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
      style={{ background: bgGradient }}
 
      onClick={()=>navigate(path)}
    >
      <div className="flex items-center justify-between">
        <div >
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-3xl font-bold text-white">{count}</p>
        </div>
 
        {/* Icon bubble */}
        <div className="p-3 rounded-full bg-white/20">
          {/* Use Tailwind for color/size so stroke follows currentColor */}
          <AppIcon name={iconName} size={32} className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
 
  return (
    <div className="p-6" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto">
        {/* Application Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-6">
            {/* Title icon */}
            <AppIcon name="FileText" size={24} className="mr-3 w-6 h-6 text-brand-primary" />
            <h2 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              Application
            </h2>
          </div>
 
          {/* Payout Cards Grid */}
          <div className=" cursor-pointer grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <PayoutCard
              title="Pending Payout"
              count={pendingData?.length}
              iconName="Clock"
              bgGradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              path="/rm/pending-payout"
            />
 
            <PayoutCard
              title="Done Payout"
              count={doneData?.length  }
              iconName="CheckCircle"
              bgGradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              path="/rm/done-payout"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default RmApplication;
 