import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdminDashboard } from '../../../feature/thunks/adminThunks'
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
  User
} from 'lucide-react';
import { useEffect } from 'react';



const Dashboard = () => {

  const dispatch = useDispatch()
  const { data } = useSelector((state) => state.admin.dashboard)

  const navigate = useNavigate();

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchAdminDashboard, {
    interval: 30000, // 30 seconds
    enabled: true,
  });


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
    <div className="p-6">


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* ALL TIME PAYOUT */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer"
          onClick={() => navigate("/admin/payout")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">ALL TIME PAYOUT</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalPayout}</p>
            </div>
            <div className="bg-red-500 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        
        {/* ALL Dibursed */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer"
          onClick={() => navigate("/admin/payout")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">TOTAL DISBURSED</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalRevenue}</p>
            </div>
            <div className="bg-red-500 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* ASM */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer"
          onClick={() => navigate("/admin/asm")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">ASM</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalASM}</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>



        {/* RM */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer"
          onClick={() => navigate("/admin/rm")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">RM</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalRM}</p>
            </div>
            <div className="bg-yellow-500 rounded-full p-3">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* PARTNERS */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer"
          onClick={() => navigate("/admin/partner")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">PARTNERS</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalPartners}</p>
            </div>
            <div className="bg-green-500 rounded-full p-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer"
          onClick={() => navigate("/admin/customer")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">CUSTOMERS</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalCustomers}</p>
            </div>
            <div className="bg-purple-500 rounded-full p-3">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

      </div>



      {/* Additional Dashboard Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New customer registered</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Banknote size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Payout completed</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <UserCheck size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New partner onboarded</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">

            <button onClick={() => { navigate('/admin/Add-ASM-Page'); }} className="cursor-pointer flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Users size={24} className="text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Add ASM</span>
            </button>

            <button onClick={() => { navigate('/admin/Add-RM-Page'); }} className="cursor-pointer  flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Users size={24} className="text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Add RM</span>
            </button>




          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
