// import React, { useState } from "react";
// import { TrendingUp, TrendingDown, Target, BarChart3, X, Calendar, IndianRupee } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { assignPartnerBulkTarget } from "../../../feature/thunks/rmThunks";

// const Reports = () => {
//   const dispatch = useDispatch();

//   // Access state from Redux
//   const { loading, error, success, data } = useSelector((state) => state.rm.bulkTarget);



//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const [formData, setFormData] = useState({
//     month: new Date().getMonth() + 1, // month as number
//     year: new Date().getFullYear(),
//     target: 0,
//   });

//   const [totalPartners, setTotalPartners] = useState(10); // Example: total partners
//   const [onePartnerTarget, setOnePartnerTarget] = useState(0);

//   const months = [
//     { name: 'January', value: 1 },
//     { name: 'February', value: 2 },
//     { name: 'March', value: 3 },
//     { name: 'April', value: 4 },
//     { name: 'May', value: 5 },
//     { name: 'June', value: 6 },
//     { name: 'July', value: 7 },
//     { name: 'August', value: 8 },
//     { name: 'September', value: 9 },
//     { name: 'October', value: 10 },
//     { name: 'November', value: 11 },
//     { name: 'December', value: 12 },
//   ];

//   const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: name === "month" || name === "year" ? Number(value) : value, // convert month/year to number
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     dispatch(
//       assignPartnerBulkTarget({
//         month: formData.month,
//         year: formData.year,
//         totalTarget: formData.target,
//       })
//     );
//     setIsModalOpen(false);
//   };

//   return (
//     <div className="p-6 bg-[#F8FAFC] min-h-screen">
//       {/* Page Title */}
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-[#111827]">🎯 Targets & Reports</h2>
//         <button
//           className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover transition"
//           onClick={() => setIsModalOpen(true)}
//         >
//           Set Target
//         </button>
//       </div>

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <div className="bg-white rounded-2xl shadow-md p-6">
//           <div className="flex items-center justify-between">
//             <h4 className="text-sm font-medium text-gray-500">Monthly Target</h4>
//             <Target className="w-5 h-5 text-brand-primary" />
//           </div>
//           <p className="text-2xl font-bold text-[#111827] mt-2">
//             ₹{formData.target || "120K"}
//           </p>
//           <p className="text-sm text-brand-primary mt-1">+15% from last month</p>
//         </div>

//         <div className="bg-white rounded-2xl shadow-md p-6">
//           <div className="flex items-center justify-between">
//             <h4 className="text-sm font-medium text-gray-500">All Deals</h4>
//             <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
//           </div>
//           <p className="text-2xl font-bold text-[#111827] mt-2">85</p>
//           <p className="text-sm text-brand-primary mt-1">+12 this week</p>
//         </div>

//         <div className="bg-white rounded-2xl shadow-md p-6">
//           <div className="flex items-center justify-between">
//             <h4 className="text-sm font-medium text-gray-500">Revenue Growth</h4>
//             <TrendingUp className="w-5 h-5 text-brand-primary" />
//           </div>
//           <p className="text-2xl font-bold text-[#111827] mt-2">32%</p>
//           <p className="text-sm text-brand-primary mt-1">Positive trend</p>
//         </div>

//         <div className="bg-white rounded-2xl shadow-md p-6">
//           <div className="flex items-center justify-between">
//             <h4 className="text-sm font-medium text-gray-500">Closed Deals</h4>
//             <TrendingDown className="w-5 h-5 text-red-500" />
//           </div>
//           <p className="text-2xl font-bold text-[#111827] mt-2">5.6%</p>
//           <p className="text-sm text-red-500 mt-1">-2% this quarter</p>
//         </div>
//       </div>

//       {/* Reports Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Progress Towards Targets */}
//         <div className="bg-white rounded-2xl shadow-md p-6">
//           <h3 className="text-lg font-semibold text-[#111827] mb-4">📈 Target Progress</h3>
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-600">Sales Target</p>
//               <div className="w-full bg-gray-200 h-3 rounded-full mt-1">
//                 <div className="bg-brand-primary h-3 rounded-full w-[75%]"></div>
//               </div>
//               <p className="text-sm text-[#111827] mt-1">75% Achieved</p>
//             </div>

//             <div>
//               <p className="text-sm text-gray-600">Leads Conversion</p>
//               <div className="w-full bg-gray-200 h-3 rounded-full mt-1">
//                 <div className="bg-[#F59E0B] h-3 rounded-full w-[60%]"></div>
//               </div>
//               <p className="text-sm text-[#111827] mt-1">60% Completed</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4 animate-fade-in">
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 animate-slide-up">

//             {/* Close Button */}
//             <button
//               className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition"
//               onClick={() => setIsModalOpen(false)}
//               aria-label="Close modal"
//             >
//               <X className="w-6 h-6" />
//             </button>

//             {/* Modal Title */}
//             <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Set Monthly Target</h3>
//             <p className="text-gray-500 text-sm text-center mb-6">Track your goals with precision.</p>

//             {/* Form */}
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Month Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-2">Month</label>
//                 <div className="relative">
//                   <select
//                     name="month"
//                     value={formData.month}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors appearance-none pr-10"
//                     required
//                   >
//                     <option value="" disabled>Select a month</option>
//                     {months.map(month => (
//                       <option key={month.value} value={month.value}>{month.name}</option>
//                     ))}
//                   </select>
//                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
//                 </div>
//               </div>

//               {/* Year Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-2">Year</label>
//                 <div className="relative">
//                   <select
//                     name="year"
//                     value={formData.year}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors appearance-none pr-10"
//                     required
//                   >
//                     {years.map(year => (
//                       <option key={year} value={year}>{year}</option>
//                     ))}
//                   </select>
//                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
//                 </div>
//               </div>

//               {/* Target Amount Input */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-2">Target Amount</label>
//                 <div className="relative">
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                     <IndianRupee className="w-5 h-5" />
//                   </span>
//                   <input
//                     type="number"
//                     name="target"
//                     placeholder="Enter target amount"
//                     value={formData.target}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
//                     required
//                     min="0"
//                   />
//                 </div>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 className="w-full bg-brand-primary text-white py-3 rounded-xl hover:bg-brand-primary-hover transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//               >
//                 Save Target
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Reports;



import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Target, BarChart3, X, IndianRupee } from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";


const Reports = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    target: 0,
  });
  const [partnerReports, setPartnerReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const months = [
    { name: "January", value: 1 }, { name: "February", value: 2 }, { name: "March", value: 3 },
    { name: "April", value: 4 }, { name: "May", value: 5 }, { name: "June", value: 6 },
    { name: "July", value: 7 }, { name: "August", value: 8 }, { name: "September", value: 9 },
    { name: "October", value: 10 }, { name: "November", value: 11 }, { name: "December", value: 12 },
  ];

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { rmToken } = getAuthData();
        const response = await axios.get(`${backendurl}/rm/partner-reports`, {
          headers: { Authorization: `Bearer ${rmToken}` },
        });
        setPartnerReports(response.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "month" || name === "year" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Target of ₹${formData.target} set for ${formData.month}/${formData.year}`);
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  // KPI totals
  const totalTarget = partnerReports.reduce((acc, p) => acc + p.targetValue, 0);
  const totalApplications = partnerReports.reduce((acc, p) => acc + p.totalApplications, 0);
  const totalDisbursed = partnerReports.reduce((acc, p) => acc + p.disbursed, 0);
  const totalRevenue = partnerReports.reduce((acc, p) => acc + p.revenue, 0);
  const totalClosedDeals = partnerReports.reduce((acc, p) => acc + (p.approved > 0 ? (p.disbursed / p.approved) : 0), 0);
  const totalClosedDealsPercent = partnerReports.reduce((acc, p) => acc + p.closedDeals, 0);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#111827]">🎯 Targets & Reports</h2>
        <button
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover transition"
          onClick={() => setIsModalOpen(true)}
        >
          Set Target
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-500">Monthly Target</h4>
            <Target className="w-5 h-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">₹{totalTarget}</p>
          <p className="text-sm text-brand-primary mt-1">Calculated dynamically</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-medium text-gray-500">Achieved Target</h4>
      <TrendingUp className="w-5 h-5 text-brand-primary" />
    </div>
    <p className="text-2xl font-bold text-[#111827]">₹{totalRevenue}</p>
    <p className="text-sm text-brand-primary mt-1">
      {totalTarget > 0 ? Math.min(100, ((totalRevenue / totalTarget) * 100).toFixed(0)) : 0}% of target
    </p>
  </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-500">All Deals</h4>
            <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">{totalApplications}</p>
          <p className="text-sm text-brand-primary mt-1">Aggregated from partners</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-500">Revenue</h4>
            <TrendingUp className="w-5 h-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">₹{totalRevenue}</p>
          <p className="text-sm text-brand-primary mt-1">Aggregated from disbursed loans</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-500">Closed Deals</h4>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">{totalClosedDealsPercent}</p>
          <p className="text-sm text-red-500 mt-1">Aggregated from disbursed/total applications</p>
        </div>
      </div>

      {/* Partner Reports Table */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">📊 Partner Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border-b">Partner</th>
                <th className="px-4 py-2 border-b">Total Applications</th>
                <th className="px-4 py-2 border-b">Approved</th>
                <th className="px-4 py-2 border-b">Disbursed</th>
                <th className="px-4 py-2 border-b">Rejected</th>
                <th className="px-4 py-2 border-b">Target Achieved</th>
              </tr>
            </thead>
            <tbody>
              {partnerReports.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{partner.name}</td>
                  <td className="px-4 py-2 border-b">{partner.totalApplications}</td>
                  <td className="px-4 py-2 border-b">{partner.approved}</td>
                  <td className="px-4 py-2 border-b">{partner.disbursed}</td>
                  <td className="px-4 py-2 border-b">{partner.rejected}</td>
                  <td className="px-4 py-2 border-b">
                    ₹{partner.targetAchievedAmount} ({partner.targetAchievedPercent}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for setting target */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Set Monthly Target</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Month</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary"
                  required
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>{month.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary"
                  required
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IndianRupee className="w-5 h-5" />
                  </span>
                  <input
                    type="number"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:ring-brand-primary"
                    min="0"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-brand-primary text-white py-3 rounded-xl hover:bg-brand-primary-hover"
              >
                Save Target
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
