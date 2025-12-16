import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Eye, Users, Phone } from "lucide-react";
import { fetchAsmCustomers } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import axios from "axios"
import { useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";




const Customer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [model, setModel] = useState(null)

  const dispatch = useDispatch();
  const navigate = useNavigate()

  const { data, loading, success, error } = useSelector(
    (state) => state.asm.customers
  );

  // Real-time customer updates with 30 second polling
  useRealtimeData(fetchAsmCustomers, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Memoized customer data
  const customers = useMemo(() => {
    return Array.isArray(data)
      ? data.map((c) => ({
          name: c.userName,
          id: c.employeeId,
          phone: c.phone || "-",
          applicationDate: new Date(c.applicationDate).toLocaleDateString(), // formatted
          loanType: c.loanType,
          loanAmount: c.loanAmount || 0,
          disburseAmount: c.disburseAmount || 0,
          status: c.status, // comes as "DISBURSED"
          customerId: c.customerId
        }))
      : [];
  }, [data]);

  // Memoized filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        customer.name?.toLowerCase().includes(term) ||
        customer.id?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term);

      const matchesFilter =
        filterStatus === "All" ||
        customer.status?.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [customers, searchTerm, filterStatus]);


  // Helpers for status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Disbursed":
        return "bg-green-100 text-green-800";
      case "In Process":
        return "bg-amber-100 text-amber-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const colors = {
    primary: "#12B99C",
    secondary: "#1E3A8A",
    background: "#F8FAFC",
    accent: "#F59E0B",
    text: "#111827",
  };


    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString();
    };


    const loginAsUser = async (userId, navigate) => {
      try {
        const { asmToken } = getAuthData();
        if (!asmToken) throw new Error("Admin not authenticated");
    
        const res = await axios.post(
          `${backendurl}/auth/login-as/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${asmToken}` } }
        );
    
        const { token, user } = res.data;
    
        // Save impersonated token without removing admin token
        saveAuthData(token, user, true);
    
        // Navigate to role
        switch (user.role) {
          case "ASM": navigate("/asm"); break;
          case "RM": navigate("/rm"); break;
          case "PARTNER": navigate("/partner"); break;
          case "CUSTOMER": navigate("/customer"); break;
          default: navigate("/"); break;
        }
      } catch (err) {
        console.error("Login as user failed:", err.response?.data || err.message);
        alert(err.response?.data?.message || err.message || "Login as user failed");
      }
    };
    
   // Usage in component
  const handleLoginAs = (userId) => {
    console.log(userId)
  loginAsUser(userId, navigate);
  };


  return (

    <>
{model && 
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 overflow-y-auto">
    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl p-6 relative mx-4 my-8">
      
      {/* Close Button */}
      <button
        onClick={() => setModel(null)}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl"
      >
        ×
      </button>

      {/* Header */}
      <h2 className="text-xl font-bold mb-6 text-center text-[#12B99C]">
        Customer Details
      </h2>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Personal Info */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-center">Personal Info</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Application No</p>
              <p className="font-medium text-gray-800">{model.appNo}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Application Date</p>
              <p className="font-medium text-gray-800">{formatDate(model.applicationDate)}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">User Name</p>
              <p className="font-medium text-gray-800">{model.userName}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">User ID</p>
              <p className="font-medium text-gray-800">{model.userId || "N/A"}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-800">{model.phone}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{model.email}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Custromers ID</p>
              <p className="font-medium text-gray-800">{model.employeeId}</p>
            </div>
          </div>
        </div>

        {/* Management Team */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-center">Management Team</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">ASM Employee ID</p>
              <p className="font-medium text-gray-800">{model.asmEmployeeId}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">ASM Name</p>
              <p className="font-medium text-gray-800">{model.asmName}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">RM Employee ID</p>
              <p className="font-medium text-gray-800">{model.rmEmployeeId}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">RM Name</p>
              <p className="font-medium text-gray-800">{model.rmName}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Partner Employee ID</p>
              <p className="font-medium text-gray-800">{model.partnerEmployeeId}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Partner Name</p>
              <p className="font-medium text-gray-800">{model.partnerName}</p>
            </div>

          
          </div>
        </div>

        {/* Loan Info */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-center">Loan Info</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Loan Amount</p>
              <p className="font-medium text-gray-800">{model.loanAmount}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Disburse Amount</p>
              <p className="font-medium text-gray-800">{model.disburseAmount}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Loan Type</p>
              <p className="font-medium text-gray-800">{model.loanType}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-medium text-gray-800">{model.status}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setModel(null)}
          className="bg-[#1E3A8A] text-white px-6 py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  </div>
}



    
<div className="min-h-screen bg-slate-50 p-2">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        {/* <p className="text-gray-600 mt-1">Manage your customer database</p> */}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name, ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="relative">
            <Filter
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white min-w-[160px]"
            >
              <option value="All">All Status</option>
              <option value="In Process">In Process</option>
              <option value="Disbursed">Disbursed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr style={{backgroundColor: "rgb(18, 185, 156)"}} className="text-white">
                <th className="px-2 py-3 text-left ">User Name</th>
                <th className="px-2 py-3 text-left">User ID</th>
                <th className="px-2 py-3 text-left">Contact</th>
                <th className="px-2 py-3 text-left">Application Date</th>
                <th className="px-2 py-3 text-left">Loan Type</th>
                <th className="px-2 py-3 text-left">Loan </th>
                <th className="px-2 py-3 text-left">Disburse</th>
                <th className="px-2 py-3 text-left">Login As</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer,index) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-4 font-medium">{customer.name}</td>
                  <td className="px-2 py-4 text-gray-600">
                    {customer.id ? customer.id : "N/A"}
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} /> {customer.phone}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-gray-600">
                    {customer.applicationDate}
                  </td>
                  <td className="px-2 py-4">{customer.loanType}</td>
                  <td className="px-2 py-4 font-semibold">
                    {customer.loanAmount}
                  </td>
                  <td className="px-2 py-4 font-semibold">
                    {customer.disburseAmount}
                  </td>
                  <td className="px-2 py-4 font-semibold">
                  <button className="px-2 py-1 border border-[#1E3A8A] text-[#1E3A8A] text-sm transition-colors font-medium cursor-pointer"
                          onClick={()=> handleLoginAs(customer?.customerId)}
                          >
                            Login
                          </button>
                  </td>
                  
                  <td className="px-2 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        customer.status
                      )}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <button className="p-2 hover:bg-gray-100 rounded"
                    onClick={()=>{setModel(data[index])}}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              No customers found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>


    </>






  );
};

export default Customer;
