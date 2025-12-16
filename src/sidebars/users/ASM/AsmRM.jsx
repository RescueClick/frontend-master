import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, X, Calendar, IndianRupee } from "lucide-react";

import {
  activateRM,
  assignRMBulkTarget,
  fetchRmList,
  reassignPartnersAndDeactivateRM,
  deleteRmAsm,
} from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import axios from "axios"
import { backendurl } from "../../../feature/urldata";



const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function AsmRM() {
  const navigate = useNavigate();


  const [showActivateModal, setShowActivateModal] = useState(null)

  const [userToDeactivate, setUserToDeactivate] = useState(null)

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [rmToDeactivate, setRmToDeactivate] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [replacementSearch, setReplacementSearch] = useState("");
  
  

  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [rmToView, setRmToView] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.asm.rmList);

  

  useEffect(() => {
    dispatch(fetchRmList());
  }, [dispatch]);

  const rmList = data;

  // Filtered list
  const filteredRms = useMemo(() => {
    if (!rmList || rmList.length === 0) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rmList;

    return rmList.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const rmCode = (r.rmCode || "").toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase();
      const rmMongoId = (r._id || "").toLowerCase();
      const asmMongoId = (r.asmId || "").toLowerCase();

      return (
        fullName.includes(term) ||
        rmCode.includes(term) ||
        employeeId.includes(term) ||
        rmMongoId.includes(term) ||
        asmMongoId.includes(term)
      );
    });
  }, [rmList, searchQuery]);

  // Handle view RM details
  const handleViewRM = (rm) => {
    setRmToView(rm);
    setShowViewModal(true);
  };

  // model

  const [formData, setFormData] = useState({
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear(),
    target: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const years = Array.from(
    { length: 11 },
    (_, i) => new Date().getFullYear() + i
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(
      assignRMBulkTarget({
        month: Number(formData.month),
        year: formData.year,
        totalTarget: Number(formData.target),
      })
    );
  };


  const deactivateRm =(rmToDeactivate,selectedReplacement )=>{

    
    
  
    dispatch(
        reassignPartnersAndDeactivateRM({ oldRmId: rmToDeactivate, newRmId: selectedReplacement })
    );
    
     setShowDeactivateModal(false);
     setRmToDeactivate(null);
     setSelectedReplacement(null);
     setReplacementSearch ("");
    
  }

    
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
loginAsUser(userId, navigate);
};

  const handleDeleteRm = async (rmId) => {
    const confirmed = window.confirm(
      "Delete this RM account permanently? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteRmAsm(rmId)).unwrap();
      dispatch(fetchRmList());
      alert("RM deleted successfully");
    } catch (err) {
      alert(
        typeof err === "string" ? err : err?.message || "Failed to delete RM"
      );
    }
  };

  return (
    <>
      {/* target Modal */}
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
        className="p-6"
        style={{
          background: colors.background,
          color: colors.text,
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Relationship Managers
            </h2>
            <p className="text-gray-600 mt-1">
              Total {filteredRms?.length || 0} records found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
                placeholder="Search by name, RM code, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <button
                className="bg-[#12B99C] text-white px-4 ml-2 py-2 rounded-lg hover:bg-[#0d8a73] transition"
                onClick={() => setIsModalOpen(true)}
              >
                Set Target
              </button>

              <button
                className=" bg-white text text-black border-2 border-black px-4 ml-2 py-2 rounded-lg hover:bg-[#e6e6e6] transition"
                onClick={()=>{ navigate('/asm/ASMaddRM'); }} 
              >
                Add New RM
              </button>


            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: colors.primary }}>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    User Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Created On
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Login as
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Activation
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#12B99C]"></div>
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : filteredRms.length > 0 ? (
                  filteredRms.map((rm) => (
                    <tr
                      key={rm._id}
                      className="transition-colors border-b hover:bg-gray-50"
                    >
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          {/* <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                                        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                                                        {rm.firstName?.charAt(0)}{rm.lastName?.charAt(0)}
                                                    </div> */}

                          <div
                            onClick={() => {
                              navigate("/asm/ASManalytics", {
                                state: { id: rm._id },
                              });
                            }}
                          >
                            <p className="font-semibold text-gray-900 text-sm">
                              {rm.firstName} {rm.lastName}
                            </p>
                            {/* <p className="text-sm text-gray-500">{rm.rmCode}</p> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-6">
                        <span className="font-mono text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                          {rm.employeeId}
                        </span>
                      </td>
                      <td className="px-6">
                        <p className="text-sm font-medium text-gray-900">
                          {rm.phone}
                        </p>
                      </td>
                      <td className="px-6">
                        <span className="text-sm text-gray-600">
                          {new Date(rm.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-2 whitespace-nowrap align-middle">
                        <button
                          className="px-4 py-1 border rounded text-xs"
                          style={{
                            borderColor: "rgb(30, 58, 138)",
                            color: "rgb(30, 58, 138)",
                          }}
                          onClick={()=> handleLoginAs(rm._id)}
                        >
                          Login
                        </button>
                      </td>

                      <td className="px-2 py-3 align-middle">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                          rm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                        }`}
                        onClick={() => {
                          if (rm.status === "ACTIVE") {
                            setRmToDeactivate(rm);
                            setSelectedReplacement(null);
                            setReplacementSearch("");
                            setShowDeactivateModal(true);
                          } else {
                            dispatch(activateRM(rm._id));
                          }
                        }}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            rm.status === "ACTIVE"
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </div>
                    </td>


                      <td className="px-6 py-2">
                        <button
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                          onClick={() => handleViewRM(rm)}
                          title="View Details"
                        >
                          <Eye size={16} className="text-gray-600" />
                        </button>
                        {rm.status !== "ACTIVE" && (
                          <button
                            className="ml-2 px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold"
                            onClick={() => handleDeleteRm(rm._id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="text-gray-500">
                        <p className="text-lg font-medium">No datafound</p>
                        <p className="text-sm mt-1">
                          Try adjusting your search criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View RM Details Modal */}
      {showViewModal && rmToView && (
        <div
          className="fixed inset-0 bg-black/25  flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-[#12B99C] text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold">RM Details</h3>
                <button
                  className="text-white/80 hover:text-white rounded-full p-2"
                  onClick={() => setShowViewModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-[#F8FAFC] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-4 text-base">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <p>
                      <strong className="text-gray-700">Name:</strong>{" "}
                      <span className="text-gray-900">
                        {rmToView.firstName} {rmToView.lastName}
                      </span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Email:</strong>{" "}
                      <span className="text-gray-900">{rmToView.email}</span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Phone:</strong>{" "}
                      <span className="text-gray-900">{rmToView.phone}</span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Joined:</strong>{" "}
                      <span className="text-gray-900">
                        {new Date(rmToView.createdAt).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-4 text-base">
                    Work Information
                  </h4>
                  <div className="space-y-3">
                    <p>
                      <strong className="text-gray-700">Employee ID:</strong>{" "}
                      <span className="text-gray-900 font-mono">
                        {rmToView.employeeId}
                      </span>
                    </p>
                    <p>
                      <strong className="text-gray-700">RM Code:</strong>{" "}
                      <span className="text-gray-900 font-mono">
                        {rmToView.rmCode}
                      </span>
                    </p>
                    <p>
                      <strong className="text-gray-700">Status:</strong>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rmToView.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rmToView.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2">
                  <h4 className="font-semibold text-[#111827] mb-4 text-base">
                    ASM Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p>
                      <strong className="text-gray-700">ASM Name:</strong>{" "}
                      <span className="text-gray-900">{rmToView.asmName}</span>
                    </p>
                    <p>
                      <strong className="text-gray-700">
                        ASM Employee ID:
                      </strong>{" "}
                      <span className="text-gray-900 font-mono">
                        {rmToView.asmEmployeeId}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  className="px-6 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


         {/* Deactivate RM Modal */}
         {showDeactivateModal && rmToDeactivate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeactivateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-[#12B99C] text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Deactivate RM</h3>
                  <p className="text-white/90 text-sm mt-1">
                    Select a replacement RM to assign partners before
                    deactivation.
                  </p>
                </div>
                <button
                  className="text-white/80 hover:text-white rounded-full p-2"
                  onClick={() => setShowDeactivateModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 bg-[#F8FAFC] overflow-y-auto">
              {/* Current RM info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Deactivating</p>
                    <p className="font-semibold text-[#111827]">
                      {rmToDeactivate.firstName} {rmToDeactivate.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      RM Code:{" "}
                      <span className="font-mono">{rmToDeactivate.rmCode}</span>
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-red-50 text-red-600 border border-red-100">
                    Active → Inactive
                  </span>
                </div>
              </div>

              {/* Replacement picker */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-[#111827]">
                    Assign Replacement RM
                  </h4>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md pl-7 pr-2 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
                      placeholder="Search by name or RM code"
                      value={replacementSearch}
                      onChange={(e) => setReplacementSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-auto divide-y divide-gray-100">
                  {(data|| [])
                    .filter((r) => r._id !== rmToDeactivate._id)
                    .filter((r) => {
                      const term = replacementSearch.trim().toLowerCase();
                      if (!term) return true;
                      const name = `${r.firstName || ""} ${
                        r.lastName || ""
                      }`.toLowerCase();
                      const code = `${r.rmCode || ""}`.toLowerCase();
                      return name.includes(term) || code.includes(term);
                    })
                    .map((r) => (
                      <label
                        key={r._id}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="replacementRm"
                            className="text-[#12B99C]"
                            checked={selectedReplacement?._id === r._id}
                            onChange={() => setSelectedReplacement(r)}
                          />
                          <div>
                            <p className="font-medium text-sm text-[#111827]">
                              {r.firstName} {r.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              RM Code:{" "}
                              <span className="font-mono">{r.rmCode}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-[#12B99C]/10 text-[#12B99C]">
                          {r.status}
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                  onClick={() => setShowDeactivateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm rounded-md text-white disabled:opacity-50"
                  style={{ background: colors.primary }}
                  disabled={!selectedReplacement}
                  onClick={() => {deactivateRm(rmToDeactivate._id,selectedReplacement._id)}}
                >
                  Confirm Deactivate & Assign
                </button>
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
                      .filter((u) => u?._id !== userToDeactivate._id)
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
                              {u.asmCode ? `• ${u.asmCode}` : ""}{" "}
                              {u.rmCode ? `• ${u.rmCode}` : ""}
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
