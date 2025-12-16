import React, { useEffect, useState } from "react";
import { Eye, Edit, Trash, Plus, X, Calendar, IndianRupee, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import {
  fetchAsms,
  fetchRMs,
  assignRmToAsm,
  reassignAllRmsFromAsm,
  activateAsm,
  assignAsmBulkTarget,
  deleteAsm,
} from "../../../feature/thunks/adminThunks";
import toast, { Toaster } from "react-hot-toast";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Import core + React wrapper
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import the specific icon you need
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { loginAsUserThunk } from "../../../feature/thunks/adminThunks";
import { backendurl } from "../../../feature/urldata";


const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};



export default function ASM() {
  const dispatch = useDispatch();
  const [selectedUser, setSelectedUser] = useState(null);
  const [regionQuery, setRegionQuery] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [searchReplacement, setSearchReplacement] = useState("");
  const [selectedReplacementId, setSelectedReplacementId] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [userToActivate, setUserToActivate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingState, setLoading] = useState(false);
  

  useEffect(() => {
    // Get token from local storage
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchAsms(adminToken));
      dispatch(fetchRMs(adminToken));
    }
  }, [dispatch]);

  // 🔹 Fix: Access the correct state structure from adminSlice
  const { data: asm, loading, error } = useSelector((state) => state.admin.asm);

  const navigate = useNavigate();



 

  const toggleActivation = (user) => {
    if (user?.status === "ACTIVE") {
      setUserToDeactivate(user);
      setShowDeactivateModal(true);
      setSelectedReplacementId(null);
      setSearchReplacement("");
      return;
    }
    if (user?.status !== "ACTIVE") {
      setUserToActivate(user);
      setShowActivateModal(true);
      return;
    }
  };

  


  const handleExport = () => {
    // Optional: Format data before exporting
    const formattedData = asm.map((user) => ({
      "First Name": user.firstName,
      "Last Name": user.lastName,
      "Date of Birth": new Date(user.dob).toLocaleDateString(),
      Email: user.email,
      Phone: user.phone,
      Region: user.region,
      Role: user.role,
      Status: user.status,
      "Employee ID": user.employeeId,
      "ASM Code": user.asmCode,
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "ASM.xlsx");
  };

 
    const months = [
      { name: "January", value: 1 },
      { name: "February", value: 2 },
      { name: "March", value: 3 },
      { name: "April", value: 4 },
      { name: "May", value: 5 },
      { name: "June", value: 6 },
      { name: "July", value: 7 },
      { name: "August", value: 8 },
      { name: "September", value: 9 },
      { name: "October", value: 10 },
      { name: "November", value: 11 },
      { name: "December", value: 12 },
    ];
  
    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i);
  
    const [formData, setFormData] = useState({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      target: 0,
    });

  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      try {
        await dispatch(
          assignAsmBulkTarget({
            month: Number(formData.month),
            year: formData.year,
            totalTarget: Number(formData.target),
          })
        ).unwrap();
  
        toast.success("Target assigned successfully!");
        setFormData((prev) => ({ ...prev, target: 0 })); // reset target field
      } catch (err) {
        console.error("Error assigning target:", err);
        toast.error("Failed to assign target. Please try again.");
      } finally {
        setLoading(false);
      }
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
  loginAsUser(userId, navigate);
};

  const handleDeleteAsm = async (asmId) => {
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      toast.error("Missing admin token");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this ASM account?"
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await dispatch(deleteAsm({ asmId })).unwrap();
      toast.success("ASM deleted");
      dispatch(fetchAsms(adminToken));
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : err?.message || "Failed to delete ASM"
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
  {isModalOpen && (
        <div className="fixed inset-0 bg-black/25 flex justify-center items-center z-50 transition-opacity duration-300 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 animate-slide-up">
            {/* Close Button */}
            <button
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Set Monthly Target
            </h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Track your goals with precision.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Month Input - Now a dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Month
                </label>
                <div className="relative">
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:outline-none transition-colors appearance-none pr-10"
                    required
                  >
                    <option value="" disabled>
                      Select a month
                    </option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.name}
                      </option>
                    ))}
                  </select>
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                </div>
              </div>

              {/* Year Input - Now a dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Year
                </label>
                <div className="relative">
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:outline-none transition-colors appearance-none pr-10"
                    required
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                </div>
              </div>

              {/* Target Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Target Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <IndianRupee className="w-5 h-5" />
                  </span>
                  <input
                    type="number"
                    name="target"
                    placeholder="Enter target amount"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:outline-none transition-colors"
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#12B99C] text-white py-3 rounded-xl hover:bg-[#0d8a73] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Save Target
              </button>
            </form>
          </div>
        </div>
      )}


      

      <div
        className="p-2"
        style={{ background: colors.background, color: colors.text }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-medium">Area Sales Manager</h2>
            <p className="text-xs">Total {asm?.length || 0} records found</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={regionQuery}
              onChange={(e) => setRegionQuery(e.target.value)}
              placeholder="Search by name "
              className="w-48 sm:w-64 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
            />

             {/* <button
                className="bg-[#12B99C] text-white px-4 ml-2 py-2 rounded-lg hover:bg-[#0d8a73] transition"
                onClick={() => setIsModalOpen(true)}
              >
                Set Target
              </button> */}

            <button 
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={()=>{handleExport()}}
            >
              <Download size={16} className="inline mr-2" />
              Export
            </button>
          </div>
        </div>

        {/*  Add error handling */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead style={{ background: colors.primary, color: "white" }}>
              <tr>
                <th className="px-2 py-4 text-left">User Name</th>
                <th className="px-2 py-4 text-left">User ID</th>
                <th className="px-2 py-4 text-left">Contact</th>
                <th className="px-2 py-4 text-left">Create on</th>
                <th className="px-2 py-4 text-left">Login as</th>
                <th className="px-2 py-4 text-left">Activation</th>
                <th className="px-2 py-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {loadingState ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : asm && asm.length > 0 ? (
                asm.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    {/* User Info */}
                    <td className="px-2 py-3 align-top">
                      <div>
                        <button
                          type="button"
                          className="font-semibold hover:underline"
                          onClick={() =>
                            navigate("/admin/Analytics", {
                              state: { id: c._id, role: "ASM" },
                            })
                          }
                        >
                          {c.firstName} {c.lastName}
                        </button>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="px-2 py-3 align-middle">
                      <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                        {c.employeeId}
                      </span>
                    </td>

                    {/* Phone Number */}
                    <td className="px-2 py-3 align-middle">
                      <span className="text-sm font-medium">
                        {c.phone || "N/A"}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-2 py-3 align-middle">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    {/* Login As */}
                    <td className="px-2 py-3 whitespace-nowrap align-middle">
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

                    {/* Activation Toggle Switch */}
                    <td className="px-2 py-3 align-middle">
                      <div
                        onClick={() => toggleActivation(c)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                          c.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            c.status === "ACTIVE"
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-1 h-full">
                        <button
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          onClick={() => setSelectedUser(c)}
                        >
                          <Eye size={14} />
                        </button>
                        {c.status !== "ACTIVE" && (
                          <button
                            className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold"
                            onClick={() => handleDeleteAsm(c._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No ASM records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-[#12B99C] p-6 text-white relative">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                ✕
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {selectedUser.firstName?.charAt(0)}
                    {selectedUser.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">ASM Details</h3>
                  <p className="text-white/90 text-sm">
                    {selectedUser.asmCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-[#F8FAFC] space-y-4">
              {/* Name + Role */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#111827] text-lg">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-gray-600 text-sm capitalize">
                      {selectedUser.role}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedUser.status === "ACTIVE"
                        ? "bg-[#12B99C]/10 text-[#12B99C]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h5 className="font-semibold text-[#111827] mb-3 flex items-center">
                  <div className="w-2 h-2 bg-[#F59E0B] rounded-full mr-2"></div>
                  Contact Information
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-[#111827] font-medium">
                      {selectedUser.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-[#111827] font-medium text-sm">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h5 className="font-semibold text-[#111827] mb-3 flex items-center">
                  <div className="w-2 h-2 bg-[#12B99C] rounded-full mr-2"></div>
                  System Information
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Employee Id.</p>
                    <p className="text-[#111827] font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                      {selectedUser.employeeId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">ASM Code</p>
                    <p className="text-[#111827] font-semibold">
                      {selectedUser.asmCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Created</p>
                    <p className="text-[#111827]">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Updated</p>
                    <p className="text-[#111827]">
                      {new Date(selectedUser.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate & Reassign Modal (UI-only) */}
      {showDeactivateModal && userToDeactivate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#12B99C] p-6 text-white relative">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setUserToDeactivate(null);
                }}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                ✕
              </button>

              {/* Disclaimer */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Deactivate ASM</h3>

                {/* Disclaimer */}
                <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 rounded-md p-3 shadow-sm">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="text-red-600 text-lg"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Disclaimer:</span> When
                      you deactivate an ASM, their responsibilities will be
                      reassigned to the new ASM you select.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-[#F8FAFC] space-y-4">
              {/* Summary Card */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#111827] text-lg">
                      {userToDeactivate.firstName} {userToDeactivate.lastName}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Current status: {userToDeactivate.status}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                    Will be deactivated
                  </span>
                </div>
              </div>

              {/* Selector */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <input
                    type="text"
                    value={searchReplacement}
                    onChange={(e) => setSearchReplacement(e.target.value)}
                    placeholder="Search ASM by name, phone, or code"
                    className="w-60 sm:w-72 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
                  />
                </div>

                {/* Results List */}
                <div className="max-h-64 overflow-auto divide-y rounded-lg border">
                  {(() => {
                    const sourceList = asm || [];
                    const filtered = sourceList
                      .filter((u) => u?._id !== userToDeactivate._id && u.status === "ACTIVE" )
                      .filter((u) => {
                        const hay = `${u.firstName || ""} ${u.lastName || ""} ${
                          u.phone || ""
                        } ${u.asmCode || ""}`.toLowerCase();
                        return hay.includes(searchReplacement.toLowerCase());
                      });
                    if (filtered.length === 0) {
                      return (
                        <div className="p-4 text-sm text-gray-500">
                          No results
                        </div>
                      );
                    }
                    return filtered.map((u) => (
                      <label
                        key={u._id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="replacement"
                            checked={selectedReplacementId === u._id}
                            onChange={() => setSelectedReplacementId(u._id)}
                          />
                          <div>
                            <div className="text-sm font-medium text-[#111827]">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {u.phone || "N/A"}{" "}
                              {u.employeeId ? `• ${u.employeeId}` : ""}{" "}
                      
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.status}
                        </span>
                      </label>
                    ));
                  })()}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowDeactivateModal(false);
                      setUserToDeactivate(null);
                      setSelectedReplacementId(null);
                    }}
                    className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {confirmError && (
                    <span className="text-red-600 text-xs mr-auto">
                      {confirmError}
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      setConfirmError("");
                      if (!selectedReplacementId || !userToDeactivate?._id)
                        return;
                      const { adminToken } = getAuthData() || {};

                      let token = adminToken;

                      if (!token) {
                        setConfirmError("Missing auth token");
                        return;
                      }
                      try {
                        setConfirmBusy(true);
                        // Bulk reassign all RMs under old ASM to the selected new ASM
                        await dispatch(
                          reassignAllRmsFromAsm({
                            oldAsmId: userToDeactivate._id,
                            newAsmId: selectedReplacementId,
                            token,
                          })
                        ).unwrap();
                        // Refresh lists
                        dispatch(fetchRMs(token));
                        dispatch(fetchAsms(token));
                        setShowDeactivateModal(false);
                        setUserToDeactivate(null);
                        setSelectedReplacementId(null);
                      } catch (err) {
                        setConfirmError(
                          typeof err === "string"
                            ? err
                            : err?.message || "Failed to reassign"
                        );
                      } finally {
                        setConfirmBusy(false);
                      }
                    }}
                    disabled={!selectedReplacementId || confirmBusy}
                    className={`px-4 py-2 text-sm rounded-md text-white ${
                      selectedReplacementId && !confirmBusy
                        ? "bg-[#12B99C] hover:opacity-90"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {confirmBusy ? "Reassigning..." : "Confirm & Deactivate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && userToActivate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#12B99C] p-6 text-white relative">
              <button
                onClick={() => {
                  setShowActivateModal(false);
                  setUserToActivate(null);
                }}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold">Activate ASM</h3>
            </div>




            <div className="p-6 bg-[#F8FAFC] space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-[#111827]">Are you sure?</p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => {
                    setShowActivateModal(false);
                    setUserToActivate(null);
                  }}
                  className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const { adminToken } = getAuthData() || {};

                    let token = adminToken;

                    if (!token || !userToActivate?._id) return;
                    try {
                      setConfirmBusy(true);
                      await dispatch(
                        activateAsm({ asmId: userToActivate._id, token })
                      ).unwrap();
                      dispatch(fetchAsms(token));
                      setShowActivateModal(false);
                      setUserToActivate(null);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setConfirmBusy(false);
                    }
                  }}
                  disabled={confirmBusy}
                  className={`px-4 py-2 text-sm rounded-md text-white ${
                    !confirmBusy
                      ? "bg-[#12B99C] hover:opacity-90"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {confirmBusy ? "Activating..." : "OK"}
                </button>
              </div>
            </div>



            
          </div>
        </div>
      )}
    </>
  );
}
