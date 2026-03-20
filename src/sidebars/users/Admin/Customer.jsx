import React, { useEffect, useState } from "react";
import { Eye , Download, Trash2 } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "../../../feature/thunks/adminThunks";
import { getAuthData,saveAuthData } from "../../../utils/localStorage";
import axios from "axios"
import { useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";

 

const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  text: "#111827",
};
 

 
export default function CustomerTable() {


  const [model, setModel] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // Customer to delete
  const [deleting, setDeleting] = useState(false)
  const  navigate = useNavigate()



  const dispatch = useDispatch();
  const { loading, data, error } = useSelector((state) => state.admin.allCustomers);

  console.log("data : ",data);

  const sortedData = [...(data || [])].sort((a, b) => {
    const aTime = a?.applicationDate ? new Date(a.applicationDate).getTime() : (a?.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = b?.applicationDate ? new Date(b.applicationDate).getTime() : (b?.createdAt ? new Date(b.createdAt).getTime() : 0);
    return bTime - aTime; // newest first
  });
  


  useEffect(() => {
    dispatch(getAllCustomers());
  }, [dispatch]);

      // Format date
      const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
      };


      const loginAsUser = async (userId, navigate) => {
        try {
          const { adminToken } = getAuthData();
          if (!adminToken) throw new Error("Admin not authenticated");
      
          const res = await axios.post(
            `${backendurl}/auth/login-as/${userId}`,
            {},
            { headers: { Authorization: `Bearer ${adminToken}` } }
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
      console.log("userId", userId)
    loginAsUser(userId, navigate);
    };

    // ✅ Delete customer and all their loan applications
    const handleDeleteCustomer = async (customerId, customerName) => {
      try {
        setDeleting(true);
        const { adminToken } = getAuthData();
        if (!adminToken) {
          throw new Error("Admin not authenticated");
        }

        const response = await axios.delete(
          `${backendurl}/admin/customer/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );

        // Show success message
        alert(`Customer "${customerName}" and all associated loan applications deleted successfully.`);
        
        // Close delete confirmation modal
        setDeleteConfirm(null);
        
        // Refresh the customer list
        dispatch(getAllCustomers());
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert(
          error.response?.data?.message || 
          error.message || 
          "Failed to delete customer"
        );
      } finally {
        setDeleting(false);
      }
    };
    
 
  return (


    <>


    
{/* ✅ Delete Confirmation Modal */}
{deleteConfirm && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] overflow-y-auto">
    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative mx-4">
      {/* Warning Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Trash2 className="w-8 h-8 text-red-600" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
        Delete Customer?
      </h2>

      {/* Warning Message */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-red-800 font-medium mb-2">
          ⚠️ This action cannot be undone!
        </p>
        <p className="text-sm text-gray-700">
          You are about to permanently delete:
        </p>
        <ul className="text-sm text-gray-700 mt-2 ml-4 list-disc">
          <li>Customer: <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong></li>
          <li>Customer ID: <strong>{deleteConfirm.employeeId}</strong></li>
          <li>All associated loan applications</li>
          <li>All uploaded documents</li>
        </ul>
      </div>

      {/* Confirmation Text */}
      <p className="text-center text-gray-600 mb-6">
        Are you sure you want to proceed?
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setDeleteConfirm(null)}
          disabled={deleting}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={() => handleDeleteCustomer(deleteConfirm._id, `${deleteConfirm.firstName} ${deleteConfirm.lastName}`)}
          disabled={deleting}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {deleting ? (
            <>
              <span className="animate-spin">⏳</span>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Delete Permanently
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

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


<div
      className="p-4 rounded-lg"
      style={{ background: colors.background, color: colors.text }}
    >
      


       <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          {/* Left side - Text */}
          <div>
            <h2 className="text-lg font-medium mb-2">Customer Applications</h2>
            <p className="text-xs mb-3">
            
               {loading ? "Loading..." : `Total ${data?.length} records found`}
            </p>
          </div>

          {/* Right side - Export button */}
          <div>
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
 
      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="w-full border-collapse bg-white text-sm">
          <thead style={{ background: colors.primary, color: "white" }}>
            <tr>
              <th className="px-3 py-3 text-left">User Name</th>
              <th className="px-3 py-3 text-left">User ID</th>
              <th className="px-3 py-3 text-left">Contact</th>
              <th className="px-3 py-3 text-left">Application Date</th>
              <th className="px-3 py-3 text-left">Loan Type</th>
              <th className="px-3 py-3 text-left">Loan </th>
              <th className="px-3 py-3 text-left">Disburse </th>
              <th className="px-3 py-3 text-left">Login As </th> 
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Action</th>
            </tr>
          </thead>


          <tbody>
  {sortedData?.map((c, idx) => (
    <tr key={idx} className="border-b hover:bg-gray-50">
      <td className="px-3 py-2">{`${c.firstName} ${c.lastName}`}</td>
      <td className="px-3 py-2">{c.employeeId}</td>
      <td className="px-3 py-2">{c.phone}</td>
      <td className="px-3 py-2">
        {new Date(c.applicationDate).toLocaleDateString("en-IN")}
      </td>
      <td className="px-3 py-2">{c.loanType || "-"}</td>
      <td className="px-3 py-2">{c.loanAmount || "-"}</td>
      <td className="px-3 py-2">{c.disburseAmount || "-"}</td>
      <td className="px-3 py-2">
      <button
                        className="px-2 py-1 border rounded text-xs"
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                        onClick={()=> handleLoginAs(c._id)}
                      >
                        Login
                      </button> 
      </td>                
      <td className="px-3 py-2">
        <span
          className={`px-2 py-1 text-xs rounded
            ${
              c.status === "ACTIVE"
                ? "bg-green-100 text-green-600"
                : c.status === "INACTIVE"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-600"
            }`}
        >
          {c.status}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button 
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={()=>{setModel(c)}}
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button 
            className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
            onClick={() => setDeleteConfirm(c)}
            title="Delete Customer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>



        </table>
      </div>
    </div>


    </>

  


  );
}