import React, { useEffect, useMemo, useState } from "react";
import { Eye, Edit, Trash, Search, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { activateRM, assignPartnersToRM, deleteRm, fetchRMs } from "../../../feature/thunks/adminThunks";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";




import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function RM() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [rmToView, setRmToView] = useState(null);
  const [rmToDeactivate, setRmToDeactivate] = useState(null);
  const [replacementSearch, setReplacementSearch] = useState("");

  const [selectedReplacement, setSelectedReplacement] = useState(null);


  const [RMactiveModel, setRMactiveModel] = useState(null)

  // Fetch RMs on mount
  useEffect(() => {
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchRMs(adminToken));
    }
  }, [dispatch]);

  // Prefill search from navigation state
  useEffect(() => {
    if (location?.state) {
      const incoming = location.state;

      if (typeof incoming === "string") {
        setSearchQuery(incoming);
      } else if (typeof incoming === "object" && incoming !== null) {
        const possible =
          incoming.employeeId || incoming.asmEmployeeId || incoming.query;
        if (possible) setSearchQuery(String(possible));
      }
    }
  }, [location]);

  // Get RMs from Redux
  const { data: rms, loading, error } = useSelector((state) => state.admin.rm);




  // Filtered list (search by name, RM code, or _id)
  // Filtered list (search by RM name, RM code, RM _id/employeeId, or ASM _id)
  const filteredRms = useMemo(() => {
    if (!rms || rms.length === 0) return [];



    const term = searchQuery.trim().toLowerCase();
    if (!term) return rms;

    return rms.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const rmCode = (r.rmCode || "").toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase(); // RM employeeId
      const rmMongoId = (r._id || "").toLowerCase(); // RM MongoDB _id
      const asmMongoId = (r.asmId || "").toLowerCase(); // ASM MongoDB _id

      return (
        fullName.includes(term) ||
        rmCode.includes(term) ||
        employeeId.includes(term) ||
        rmMongoId.includes(term) ||
        asmMongoId.includes(term)
      );
    });
  }, [rms, searchQuery]);

  // Handle view RM details
  const handleViewRM = (rm) => {
    setRmToView(rm);
    setShowViewModal(true);
  };


  const deactivateRm = (rmToDeactivate, selectedReplacement) => {



    dispatch(
      assignPartnersToRM({ oldRmId: rmToDeactivate, newRmId: selectedReplacement })
    );

    setShowDeactivateModal(false);
    setRmToDeactivate(null);
    setSelectedReplacement(null);
    setReplacementSearch("");

  }


  const handleExport = () => {
    // Format data before exporting
    const formattedData = rms.map((user) => ({
      "First Name": user.firstName || "",
      "Last Name": user.lastName || "",
      "Date of Birth": user.dob ? new Date(user.dob).toLocaleDateString() : "",
      Email: user.email || "",
      Phone: user.phone || "",
      Role: user.role || "",
      Status: user.status || "",
      "Employee ID": user.employeeId || "",
      "RM Code": user.rmCode || "",
      "ASM Name": user.asmName || "",
      "ASM Employee ID": user.asmEmployeeId || "",
      "Documents": user.docs ? user.docs.map(doc => doc.docType).join(", ") : "",
      "Created At": user.createdAt ? new Date(user.createdAt).toLocaleString() : "",
      "Updated At": user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "",
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RMs");

    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blobData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blobData, "RMs.xlsx");
  };


  const handleRMactive = () => {

    dispatch(activateRM(RMactiveModel));
    setTimeout(() => {
      setRMactiveModel(null)
    }, 100);

  }


  
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

  const handleDeleteRm = async (rmId) => {
    const { adminToken } = getAuthData() || {};
    if (!adminToken) {
      alert("Missing admin token");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this RM account?"
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteRm(rmId)).unwrap();
      dispatch(fetchRMs(adminToken));
      alert("RM deleted");
    } catch (err) {
      alert(
        typeof err === "string" ? err : err?.message || "Failed to delete RM"
      );
    }
  };


  return (
    <>
      <div
        className="p-2"
        style={{ background: colors.background, color: colors.text }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-medium">Relationship Managers</h2>
            <p className="text-xs">
              Total {filteredRms?.length || 0} records found
            </p>
          </div>
          <div className="flex items-center gap-2">

            <div className="relative">
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="border border-gray-300 rounded-md pl-7 pr-2 py-2 text-sm w-100 focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
                placeholder="Search by name, RM code, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>


            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => { handleExport() }}
            >
              <Download size={16} className="inline mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead style={{ background: colors.primary, color: "white" }}>
              <tr>
                <th className="px-2 py-4 text-left">User Name</th>
                <th className="px-2 py-4 text-left">User ID</th>
                <th className="px-2 py-4 text-left">Contact</th>
                <th className="px-2 py-4 text-left">Created On</th>
                <th className="px-2 py-4 text-left">Login as</th>
                <th className="px-2 py-4 text-left">Activation</th>
                <th className="px-2 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredRms.length > 0 ? (
                filteredRms.map((rm) => (
                  <tr key={rm._id} className="border-b hover:bg-gray-50">
                    <td
                      className="px-2 py-3 align-top  "
                      
                      onClick={() =>

                        navigate("/admin/Analytics", {
                          state: { id: rm._id, role: "RM" },
                        })
                      }

                    >
                      <div className="cursor-pointer">
                        {rm.firstName} {rm.lastName}
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">{rm.employeeId}</td>
                    <td className="px-2 py-3 align-middle">
                      <span className="text-sm font-medium">
                        {rm.phone || "N/A"}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {new Date(rm.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                        onClick={()=> handleLoginAs(rm._id)}
                      >
                        Login
                      </button>
                    </td>

                    <td className="px-2 py-3 align-middle">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${rm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        onClick={() => {
                          if (rm.status === "ACTIVE") {
                            setRmToDeactivate(rm);
                            setSelectedReplacement(null);
                            setReplacementSearch("");
                            setShowDeactivateModal(true);
                          } else {

                            setRMactiveModel(rm._id)

                          }
                        }}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${rm.status === "ACTIVE"
                              ? "translate-x-6"
                              : "translate-x-0"
                            }`}
                        />
                      </div>
                    </td>


                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-1 h-full">
                        <button
                          className="cursor-pointer p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          onClick={() => handleViewRM(rm)}
                        >
                          <Eye size={14} />
                        </button>
                        {rm.status !== "ACTIVE" && (
                          <button
                            className="cursor-pointer p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold"
                            onClick={() => handleDeleteRm(rm._id)}
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
                  <td colSpan="7" className="text-center py-4">
                    No RMs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View RM Details Modal */}
      {showViewModal && rmToView && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-[#12B99C] text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">RM Details</h3>
                </div>
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
            <div className="p-5 bg-[#F8FAFC] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-3 text-sm">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="font-medium text-sm">
                        {rmToView.firstName} {rmToView.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-mono">{rmToView.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-mono">{rmToView.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Joing date</p>
                      <p className="text-sm">
                        {new Date(rmToView.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-3 text-sm">
                    Work Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Role</p>
                      <p className="text-sm">{rmToView.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                      <p className="text-sm font-mono">{rmToView.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">RM Code</p>
                      <p className="text-sm font-mono">{rmToView.rmCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${rmToView.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {rmToView.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ASM Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-[#111827] mb-3 text-sm">
                    ASM Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ASM Name</p>
                      <p className="text-sm">{rmToView.asmName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        ASM Employee ID
                      </p>
                      <p className="text-sm font-mono">
                        {rmToView.asmEmployeeId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
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
                  {(rms || [])
                    .filter((r) => r._id !== rmToDeactivate._id && r.status == "ACTIVE")
                    .filter((r) => {
                      const term = replacementSearch.trim().toLowerCase();
                      if (!term) return true;
                      const name = `${r.firstName || ""} ${r.lastName || ""
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
                  onClick={() => { deactivateRm(rmToDeactivate._id, selectedReplacement._id) }}

                >
                  Confirm Deactivate & Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {RMactiveModel &&

        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Are you sure?</h3>
            <p className="text-gray-600 mb-5">Do you really want to proceed?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setRMactiveModel(null)
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                No
              </button>
              <button
                onClick={() => {
                  handleRMactive()

                }}

                className="px-4 py-2 rounded-lg bg-[#12B99C] text-white "
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      }


    </>
  );
}
