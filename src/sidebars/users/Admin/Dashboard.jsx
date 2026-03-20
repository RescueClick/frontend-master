
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdminDashboard, fetchRecentActivities } from '../../../feature/thunks/adminThunks'
import { useRealtimeData } from '../../../utils/useRealtimeData'

import {
  BarChart3,
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  Bell,
  Menu,
  ChevronDown,
  Settings,
  Mail,
  FileText,
  LayoutGrid,
  Download,
  Banknote,
  User,
  IndianRupee
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency, formatNumber, typography } from '../../../utils/designSystem';
import PageHeader from "../../../components/shared/PageHeader";
import FiltersBar from "../../../components/shared/FiltersBar";



const Dashboard = () => {

  const dispatch = useDispatch()
  const { data } = useSelector((state) => state.admin.dashboard)
  const recentActivitiesState = useSelector((state) => state.admin.recentActivities || { activities: [] })
  const activities = recentActivitiesState.activities || []

  const navigate = useNavigate();

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchAdminDashboard, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Fetch recent activities on mount and every 30 seconds
  useEffect(() => {
    dispatch(fetchRecentActivities(10));
    const interval = setInterval(() => {
      dispatch(fetchRecentActivities(10));
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);


  const statsCards = [
    {
      title: 'ALL TIME PAYOUT',
      value: '₹ 13710',
      icon: TrendingUp,
      bgColor: 'bg-white',
      iconBg: 'bg-red-500',
      iconColor: 'text-white',

    },





  ];





  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      <div className="mb-4">
        <PageHeader
          title="Dashboard Overview"
          subtitle="Monitor your business metrics and activities"
          right={
            <button
              type="button"
              onClick={() => navigate("/admin/payout")}
              className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              View Payouts
            </button>
          }
        />
      </div>

  

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5 mb-6">
        {/* ALL TIME PAYOUT */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/payout")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>All Time Payout</p>
              <p className={`${typography.h2()} mb-1`}>{formatCurrency(data?.totalPayout || 0)}</p>
              <p className={typography.tiny()}>Total payouts made</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Banknote className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* TOTAL DISBURSED */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/payout")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Total Disbursed</p>
              <p className={`${typography.h2()} mb-1`}>{formatCurrency(data?.totalRevenue || 0)}</p>
              <p className={typography.tiny()}>Company-wide disbursement</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* ASM */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/asm")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Area Sales Managers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalASM || 0)}</p>
              <p className={typography.tiny()}>Active ASMs</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

         {/* RSMs */}
         <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/rsm")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Regional Sales Managers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalRSM || 0)}</p>
              <p className={typography.tiny()}>Active RSMs</p>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>


        {/* RM */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/rm")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Relationship Managers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalRM || 0)}</p>
              <p className={typography.tiny()}>Active RMs</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

       
        {/* PARTNERS */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/partner")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Partners</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalPartners || 0)}</p>
              <p className={typography.tiny()}>Total partners</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div
          className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          onClick={() => navigate("/admin/customer")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>Customers</p>
              <p className={`${typography.h2()} mb-1`}>{formatNumber(data?.totalCustomers || 0)}</p>
              <p className={typography.tiny()}>Total customers</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        {/* Company Disbursement Target */}
        <div className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>
                Company Disbursement Target
              </p>
              <p className={`${typography.h2()} mb-1`}>
                {formatCurrency(data?.totalDisbursementTarget || 0)}
              </p>
              <p className={typography.tiny()}>Monthly company target</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Achieved Company Disbursement */}
        <div className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-full opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className={`${typography.captionSmall()} uppercase tracking-wider mb-2`}>
                Achieved Disbursement
              </p>
              <p className={`${typography.h2()} mb-1`}>
                {formatCurrency(data?.totalRevenue || 0)}
              </p>
              <p className={typography.tiny()}>Actual disbursement this period</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

      </div>

      {/* Target Achievement Pie */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={typography.h3()}>Target Achievement</h2>
            <p className={`${typography.caption()} mt-1`}>
              Company disbursement vs monthly target
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8 flex-wrap">
          <div className="relative w-32 h-32 flex-shrink-0">
            {(() => {
              const pct = data?.totalDisbursementTarget
                ? Math.min(
                    100,
                    Math.round(
                      (data.totalRevenue / data.totalDisbursementTarget) * 100
                    )
                  )
                : 0;
              const radius = 52;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (pct / 100) * circumference;
              const percentageLabel = data?.totalDisbursementTarget
                ? `${pct}%`
                : "—";
              return (
                <svg
                  viewBox="0 0 120 120"
                  className="w-32 h-32"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
              );
            })()}
          </div>
          <div className="flex-1 min-w-[220px] space-y-3">
            <div>
              <p className={typography.captionSmall()}>Target Achievement</p>
              <p className={`${typography.h2()} mt-1`}>
                {data?.totalDisbursementTarget
                  ? `${Math.min(
                      100,
                      Math.round(
                        (data.totalRevenue / data.totalDisbursementTarget) * 100
                      )
                    )}%`
                  : "—"}
              </p>
              <p className={`${typography.caption()} text-gray-500 mt-1`}>
                Company-level achievement vs target
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className={typography.caption()}>Achieved</span>
              </div>
              <span className={typography.label()}>
                {formatCurrency(data?.totalRevenue || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-300" />
                <span className={typography.caption()}>Remaining to target</span>
              </div>
              <span className={typography.label()}>
                {data?.totalDisbursementTarget
                  ? formatCurrency(
                      Math.max(
                        0,
                        (data.totalDisbursementTarget || 0) -
                          (data.totalRevenue || 0)
                      )
                    )
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 20rem)', height: 'calc(100vh - 20rem)' }}>
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h3 className={typography.h3()}>Recent Activity</h3>
              <p className={`${typography.caption()} mt-1`}>Latest system activities and updates</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <Bell className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => {
                const getIcon = () => {
                  switch (activity.icon) {
                    case "users":
                      return <Users size={16} className="text-white" />;
                    case "banknote":
                      return <Banknote size={16} className="text-white" />;
                    case "userCheck":
                      return <UserCheck size={16} className="text-white" />;
                    case "fileText":
                      return <FileText size={16} className="text-white" />;
                    default:
                      return <Bell size={16} className="text-white" />;
                  }
                };

                const getIconColor = () => {
                  switch (activity.iconColor) {
                    case "blue":
                      return "bg-gradient-to-br from-blue-500 to-blue-600";
                    case "green":
                      return "bg-gradient-to-br from-emerald-500 to-emerald-600";
                    case "purple":
                      return "bg-gradient-to-br from-purple-500 to-purple-600";
                    case "red":
                      return "bg-gradient-to-br from-red-500 to-red-600";
                    default:
                      return "bg-gradient-to-br from-gray-500 to-gray-600";
                  }
                };

                return (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 flex-shrink-0 group">
                    <div className={`w-10 h-10 ${getIconColor()} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${typography.label()} mb-1`}>{activity.title}</p>
                      <p className={`${typography.caption()} line-clamp-2 mb-1`}>{activity.description}</p>
                      <p className={`${typography.tiny()} font-medium`}>{activity.timeAgo}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400 flex-shrink-0">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className={typography.label()}>No recent activities</p>
                <p className={`${typography.caption()} mt-1`}>Activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 20rem)', height: 'calc(100vh - 20rem)' }}>
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h3 className={typography.h3()}>Quick Actions</h3>
              <p className={`${typography.caption()} mt-1`}>Frequently used actions</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <LayoutGrid className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1 content-start">
            {/* Add ASM */}
            <button 
              onClick={() => { navigate('/admin/add-asm-page'); }} 
              className="group cursor-pointer flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Users size={24} className="text-white" />
              </div>
              <span className={`${typography.label("text-blue-900")}`}>Add ASM</span>
              <span className={`${typography.caption("text-blue-600")} mt-1`}>Create new ASM</span>
            </button>

            {/* Add RM */}
            <button 
              onClick={() => { navigate('/admin/add-rm-page'); }} 
              className="group cursor-pointer flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Users size={24} className="text-white" />
              </div>
              <span className={`${typography.label("text-indigo-900")}`}>Add RM</span>
              <span className={`${typography.caption("text-indigo-600")} mt-1`}>Create new RM</span>
            </button>

            {/* Add RSM */}
            <button 
              onClick={() => { navigate('/admin/add-rsm-page'); }} 
              className="group cursor-pointer flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Users size={24} className="text-white" />
              </div>
              <span className={`${typography.label("text-emerald-900")}`}>Add RSM</span>
              <span className={`${typography.caption("text-emerald-600")} mt-1`}>Create new RSM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
