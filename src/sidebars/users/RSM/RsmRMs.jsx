import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, X, User, Mail, Phone, Calendar, Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { fetchRsmRms, activateRM, deactivateRM } from "../../../feature/thunks/rsmThunks";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";

const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

export default function RsmRMs() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [rmToView, setRmToView] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [rmToDeactivate, setRmToDeactivate] = useState(null);

  const { data: rmList, loading, error } = useSelector((state) => state.rsm.rms);

  useEffect(() => {
    dispatch(fetchRsmRms());
  }, [dispatch]);

  // Filtered list
  const filteredRms = useMemo(() => {
    if (!rmList || rmList.length === 0) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rmList;

    return rmList.filter((r) => {
      const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const rmCode = (r.rmCode || "").toLowerCase();
      const employeeId = (r.employeeId || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const phone = (r.phone || "").toLowerCase();

      return (
        fullName.includes(term) ||
        rmCode.includes(term) ||
        employeeId.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    });
  }, [rmList, searchQuery]);

  // Handle view RM details
  const handleViewRM = (rm) => {
    setRmToView(rm);
    setShowViewModal(true);
  };

  const handleToggleActivation = async (rm) => {
    if (rm.status === "ACTIVE") {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate ${rm.firstName} ${rm.lastName}? All their data will be reassigned to another RM.`
      );
      if (!confirmed) return;
      setRmToDeactivate(rm);
      setShowDeactivateModal(true);
    } else {
      try {
        await dispatch(activateRM(rm._id)).unwrap();
        dispatch(fetchRsmRms());
        alert("RM activated successfully");
      } catch (err) {
        alert(err || "Failed to activate RM");
      }
    }
  };

  const handleDeactivate = async () => {
    if (!rmToDeactivate) return;
    try {
      await dispatch(deactivateRM(rmToDeactivate._id)).unwrap();
      dispatch(fetchRsmRms());
      setShowDeactivateModal(false);
      setRmToDeactivate(null);
      alert("RM deactivated successfully. All data has been reassigned.");
    } catch (err) {
      alert(err || "Failed to deactivate RM");
    }
  };

  const loginAsUser = async (userId) => {
    try {
      const { rsmToken } = getAuthData();
      if (!rsmToken) throw new Error("RSM not authenticated");

      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${rsmToken}` } }
      );

      const { token, user } = res.data;
      saveAuthData(token, user, true);

      switch (user.role) {
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

  return (
    <>
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
              My Relationship Managers
            </h2>
            <p className="text-gray-600 mt-1">
              Total {filteredRms?.length || 0} RMs found
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
            </div>
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
                      className="px-2 py-3 align-top cursor-pointer"
                      onClick={() =>
                        navigate("/rsm/analytics", {
                          state: { id: rm._id, role: "RM" },
                        })
                      }
                    >
                      {rm.firstName} {rm.lastName}
                    </td>
                    <td className="px-2 py-3 align-middle">{rm.employeeId}</td>
                    <td className="px-2 py-3 align-middle">
                      <span className="text-sm font-medium">
                        {rm.phone}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      {new Date(rm.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                        onClick={() => loginAsUser(rm._id)}
                      >
                        Login
                      </button>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                          rm.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-300"
                        }`}
                        onClick={() => handleToggleActivation(rm)}
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
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-1 h-full">
                        <button
                          className="cursor-pointer p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          onClick={() => handleViewRM(rm)}
                        >
                          <Eye size={14} />
                        </button>
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
          className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4"
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
                  <X size={20} />
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

                {/* Personal Loan RSM Information */}
                {rmToView.personalRsmName && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2">
                    <h4 className="font-semibold text-[#111827] mb-4 text-base">
                      Personal Loan RSM Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p>
                        <strong className="text-gray-700">RSM Name:</strong>{" "}
                        <span className="text-gray-900">{rmToView.personalRsmName}</span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Employee ID:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.personalRsmEmployeeId || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Phone:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.personalRsmPhone || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Email:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.personalRsmEmail || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Business & Home Loan RSM Information */}
                {rmToView.businessHomeRsmName && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2">
                    <h4 className="font-semibold text-[#111827] mb-4 text-base">
                      Business & Home Loan RSM Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p>
                        <strong className="text-gray-700">RSM Name:</strong>{" "}
                        <span className="text-gray-900">{rmToView.businessHomeRsmName}</span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Employee ID:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.businessHomeRsmEmployeeId || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Phone:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.businessHomeRsmPhone || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-700">RSM Email:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {rmToView.businessHomeRsmEmail || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
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

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && rmToDeactivate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeactivateModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Deactivation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate <strong>{rmToDeactivate.firstName} {rmToDeactivate.lastName}</strong>?
              All their applications, partners, and customers will be automatically reassigned to another active RM.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setRmToDeactivate(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeactivate}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

