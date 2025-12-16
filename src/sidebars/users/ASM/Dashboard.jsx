import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  DollarSign,
  Target,
  CheckCircle,
  Award,
  Building2,
  BarChart3,
  IndianRupee,
} from "lucide-react";
import { fetchAsmDashboard } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useRealtimeData } from "../../../utils/useRealtimeData";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { data, loading, success, error } = useSelector(
    (state) => state.asm.dashboard
  );

  // Real-time dashboard updates with 30 second polling
  useRealtimeData(fetchAsmDashboard, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Memoized metrics
  const metrics = useMemo(() => [
    {
      title: "Relationship Managers",
      value: data?.totals?.totalRMs || 0,
      icon: Users,
      color: "text-blue-600",
      path: '/asm/RM'
    },
    {
      title: "Active Partners",
      value: data?.totals?.activePartners || 0,
      icon: Building2,
      color: "text-purple-600",
      path: '/asm/partners'
    },
    {
      title: "Total Customers",
      value: data?.totals?.totalCustomers || 0,
      icon: UserCheck,
      color: "text-green-600",
      path: '/asm/customers'
    },
    {
      title: "Revenue (₹)",
      value: data?.totals?.totalRevenue, // convert 9000000 -> 0.90 Cr
      icon: IndianRupee,
      color: "text-amber-600",
    },
  ], [data?.totals]);

  const targetVsAchievement = useMemo(() => {
    return (data?.targets || []).map((item) => {
      const target = item.target || 0; // keep 0
      const achievement = item.achieved || 0;
      const percentage =
        target > 0 ? Math.round((achievement / target) * 100) : 0;

      return {
        month: item.month.substring(0, 3),
        target,
        achievement,
        percentage,
      };
    });
  }, [data?.targets]);

  const topPerformers = useMemo(() => {
    return (data?.topPerformers || []).map((item, index) => ({
      name: item.name,
      revenue: `₹${item.totalRevenue}`, // you can format if needed
      achievement: `${Math.floor(Math.random() * 50) + 90}%`, // mock achievement for now
      rank: index + 1,
    }));
  }, [data?.topPerformers]);

  // const topPerformers = [
  //   { name: "Rajesh Kumar", revenue: "₹12.5Cr", achievement: "124%", rank: 1 },
  //   { name: "Priya Sharma", revenue: "₹11.8Cr", achievement: "118%", rank: 2 },
  //   { name: "Amit Patel", revenue: "₹10.9Cr", achievement: "115%", rank: 3 },
  //   { name: "Neha Singh", revenue: "₹10.2Cr", achievement: "108%", rank: 4 },
  //   { name: "Vikram Rao", revenue: "₹9.8Cr", achievement: "105%", rank: 5 },
  // ];

  const rmList = [
    {
      name: "Rajesh Kumar",
      id: "RM001",
      partners: 25,
      customers: 342,
      revenue: "₹12.5Cr",
      status: "Active",
    },
    {
      name: "Priya Sharma",
      id: "RM002",
      partners: 21,
      customers: 298,
      revenue: "₹11.8Cr",
      status: "Active",
    },
    {
      name: "Amit Patel",
      id: "RM003",
      partners: 19,
      customers: 315,
      revenue: "₹10.9Cr",
      status: "Active",
    },
    {
      name: "Neha Singh",
      id: "RM004",
      partners: 23,
      customers: 289,
      revenue: "₹10.2Cr",
      status: "Active",
    },
    {
      name: "Vikram Rao",
      id: "RM005",
      partners: 18,
      customers: 267,
      revenue: "₹9.8Cr",
      status: "Review",
    },
  ];


  const currentDate = new Date();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ASM Dashboard</h1>
            <p className="text-gray-600">Area Sales Manager - Mumbai Region</p>
          </div>
        </div>
      </div>

      {/* Top Row - Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div
            onClick={()=>navigate(metric.path)}
            key={index}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {metric.value}
                </p>
             
              </div>
              <div className={`p-3 rounded-full bg-gray-100 ${metric.color}`}>
                <metric.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-5 "> 
      

      
      <div className="space-y-4">

            {targetVsAchievement.map((item, index) => (

              <>

              { item.month == monthNames[currentDate.getMonth()] &&

                <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {item.month}
                    </span>
                    <div className="flex items-center space-x-2">
                      {item.percentage >= 100 ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Target size={16} className="text-orange-500" />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.percentage >= 100
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.achievement}K / {item.target}K
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (item.achievement / item.target) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        item.achievement >= item.target ? "#12B99C" : "#F59E0B",
                    }}
                  ></div>
                </div>
              </div>

              }

              </>

        
            ))}

            
          </div>
      
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Performance Analytics */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Analytics
              </h3>
              <p className="text-sm text-gray-600">
                Monthly target vs achievement comparison
              </p>
            </div>
            <BarChart3 className="text-gray-400" size={20} />
          </div>


          <div className="space-y-4">
  {targetVsAchievement
    .filter((item) => item?.target !== 0) // Filter out items with target 0
    .map((item, index) => (
      <div key={index} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 w-8">
              {item.month}
            </span>
            <div className="flex items-center space-x-2">
              {item.percentage >= 100 ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <Target size={16} className="text-orange-500" />
              )}
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  item.percentage >= 100
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {item.percentage}%
              </span>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {item.achievement}K / {item.target}K
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                (item.achievement / item.target) * 100,
                100
              )}%`,
              backgroundColor:
                item.achievement >= item.target ? "#12B99C" : "#F59E0B",
            }}
          ></div>
        </div>
      </div>
    ))}
</div>



        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Award className="text-amber-500 mr-2" size={24} />
            <h3 className="text-xl font-bold text-gray-900">Top Performers</h3>
          </div>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div
                key={performer.id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-amber-600"
                        : "bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {performer.name}
                    </p>
                    <p className="text-gray-500 text-xs">{performer.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-800 text-sm">
                    {performer.revenue ? `${performer.revenue}` : "-"}
                  </p>
                  {/* <p className="text-gray-500 text-xs">
          {performer.totalDisbursedApps ?? 0} Apps
        </p> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
