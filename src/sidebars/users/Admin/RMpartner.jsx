import React, { useEffect, useState } from "react";
import { Eye, Search, Trash2 } from "lucide-react";

import { fetchRMs } from "../../../feature/thunks/adminThunks";
import { useDispatch, useSelector } from "react-redux";
import {
  assignPartnerToRm,
  getUnassignedPartners,
  rejectPartner,
} from "../../../feature/thunks/adminThunks";
import { getAuthData } from "../../../utils/localStorage";

const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  text: "#111827",
};

// Sample customer data
const customersData = [
  {
    name: "Sanjay",
    userId: "U001",
    contact: "7720990081",
    applicationDate: "18-08-2025",
    loanType: "Personal Loan",
    loanAmount: "₹5,00,000",
    disburseAmount: "₹4,80,000",
    status: "In Process",
  },
  {
    name: "XYZ",
    userId: "U002",
    contact: "123456789",
    applicationDate: "14-08-2025",
    loanType: "Home Loan",
    loanAmount: "₹25,00,000",
    disburseAmount: "₹24,50,000",
    status: "Disbursed",
  },
  {
    name: "ABCD",
    userId: "U003",
    contact: "8899990000",
    applicationDate: "01-08-2025",
    loanType: "Car Loan",
    loanAmount: "₹10,00,000",
    disburseAmount: "₹9,80,000",
    status: "Rejected",
  },
  {
    name: "Aslam",
    userId: "U004",
    contact: "7517433560",
    applicationDate: "24-07-2025",
    loanType: "Education Loan",
    loanAmount: "₹15,00,000",
    disburseAmount: "₹14,70,000",
    status: "Disbursed",
  },
];

export default function RMpartner() {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [partnerToAssign, setPartnerToAssign] = useState(null);
  const [selectedRm, setSelectedRm] = useState(null);
  const [rmSearch, setRmSearch] = useState("");

  const [handleModal, setHandleModal] = useState({
    modalStatus: false,
    partnerData: null,
  });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [partnerToReject, setPartnerToReject] = useState(null);

  const dispatch = useDispatch();
  const { loading, error, data } = useSelector(
    (state) => state.admin.unassignedPartners
  );
  const rejectPartnerState = useSelector(
    (state) => state.admin.rejectPartner || { loading: false, success: false }
  );

  const { data: rms } = useSelector((state) => state.admin.rm);
  
  const isRejecting = rejectPartnerState.loading;
  
  // Optimistic update: Filter out rejected partner immediately when deletion is successful
  const displayData = data?.filter(
    (partner) => {
      // If rejection was successful and this is the rejected partner, hide it
      if (rejectPartnerState.success && partnerToReject && partner._id === partnerToReject._id) {
        return false;
      }
      return true;
    }
  ) || data;
  
  // Close modal when rejection is successful
  useEffect(() => {
    if (rejectPartnerState.success && rejectModalOpen) {
      // Small delay to show success state
      const timer = setTimeout(() => {
        setRejectModalOpen(false);
        setPartnerToReject(null);
        // Refetch to ensure data is in sync
        dispatch(getUnassignedPartners());
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [rejectPartnerState.success, rejectModalOpen, dispatch]);

  useEffect(() => {
    const { adminToken } = getAuthData() || {};
    if (adminToken) {
      dispatch(fetchRMs(adminToken));
    }

    dispatch(getUnassignedPartners());
  }, [dispatch]);

  const [customers] = useState(customersData);

  const handleRejectPartner = async () => {
    if (!partnerToReject || isRejecting) return;
    
    try {
      const result = await dispatch(rejectPartner(partnerToReject._id)).unwrap();
      
      // Show success message
      alert("Partner request rejected and deleted successfully");
      
      // Modal will close automatically via useEffect when success state changes
      // Refetch will happen in useEffect as well
    } catch (error) {
      console.error("Reject partner error:", error);
      alert(error || "Failed to reject partner. Please try again.");
    }
  };

  const handleCancelReject = () => {
    if (isRejecting) return; // Prevent closing during deletion
    setRejectModalOpen(false);
    setPartnerToReject(null);
  };

  return (
    <div
      className="p-4 rounded-lg"
      style={{ background: colors.background, color: colors.text }}
    >
      {/* Assign RM to Partner Modal */}
      {showAssignModal && partnerToAssign && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-150 p-4"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-[#12B99C] text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Assign RM to Partner
                  </h3>
                  <p className="text-white/90 text-sm mt-1">
                    Select an RM to assign for this partner.
                  </p>
                </div>
                <button
                  className="text-white/80 hover:text-white rounded-full p-2"
                  onClick={() => setShowAssignModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 bg-[#F8FAFC] overflow-y-auto">
              {/* Partner Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Assigning RM for Partner
                  </p>
                  <p className="font-semibold text-[#111827]">
                    {partnerToAssign.firstName} {partnerToAssign.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Partner Code:{" "}
                    <span className="font-mono">
                      {partnerToAssign.partnerCode}
                    </span>
                  </p>
                </div>
              </div>

              {/* RM Selection */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-[#111827]">Select RM</h4>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md pl-7 pr-2 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
                      placeholder="Search by name or RM code"
                      value={rmSearch}
                      onChange={(e) => setRmSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-auto divide-y divide-gray-100">
                  {(rms || [])
                    ?.filter((r) => {
                      const term = rmSearch.trim().toLowerCase();
                      if (!term) return true;
                      const name = `${r.firstName || ""} ${
                        r.lastName || ""
                      }`.toLowerCase();
                      const code = `${r.rmCode || ""}`.toLowerCase();
                      return name.includes(term) || code.includes(term);
                    })
                    ?.map((r) => (
                      <label
                        key={r._id}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedRm"
                            className="text-[#12B99C]"
                            checked={selectedRm?._id === r._id}
                            onChange={() => setSelectedRm(r)}
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

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm rounded-md text-white disabled:opacity-50"
                  style={{ background: colors.primary }}
                  disabled={!selectedRm}
                  onClick={() => {
                  
                    if (selectedRm) {
                      dispatch(
                        assignPartnerToRm({
                          partnerId: partnerToAssign._id,
                          rmId: selectedRm._id,
                        })
                      );
                    }
                    setShowAssignModal(false);
                    setPartnerToAssign(null);
                    setSelectedRm(null);
                    setRmSearch("");
                  }}
                >
                  Confirm & Assign RM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Partner Modal */}
      {rejectModalOpen && partnerToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Reject Partner Request
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to <span className="font-semibold text-red-600">reject and delete</span> the partner request for{" "}
              <span className="font-semibold">
                {partnerToReject.firstName} {partnerToReject.lastName}
              </span>?
              <br />
              <br />
              <span className="text-sm text-red-600">
                ⚠️ This action will permanently delete:
              </span>
              <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc">
                <li>Partner account and all documents</li>
                <li>All associated applications</li>
                <li>All associated payouts</li>
                <li>All assigned targets</li>
              </ul>
              <br />
              This action cannot be undone.
            </p>
            
            {/* Loading indicator */}
            {isRejecting && (
              <div className="mb-4 flex items-center justify-center gap-2 text-blue-600">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Deleting partner...</span>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancelReject}
                disabled={isRejecting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleRejectPartner}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Yes, Reject & Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {handleModal.modalStatus && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans"
          onClick={() => setShowPartnerModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl p-6 relative overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
              <h3 className="text-2xl font-bold text-[#1E3A8A]">
                Partner Details
              </h3>
            </div>

            {/* 4-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Column 1 - Personal Info */}
              <div className="flex flex-col gap-2 bg-[#F8FAFC] rounded-xl p-4 shadow-sm text-sm">
                <h4 className="font-bold text-[#111827] border-b border-gray-300 pb-1 mb-2 text-base">
                  Personal Info
                </h4>
                {[
                  ["First Name", handleModal.partnerData.firstName],
                  ["Middle Name", handleModal.partnerData.middleName || "-"],
                  ["Last Name", handleModal.partnerData.lastName],
                  ["Email", handleModal.partnerData.email],
                  ["Phone", handleModal.partnerData.phone],
                  ["Address", handleModal.partnerData.address],
                  ["Region", handleModal.partnerData.region],
                  ["Pincode", handleModal.partnerData.pincode],
                  ["Landmark", handleModal.partnerData.landmark],
                  ["Date of Birth", handleModal.partnerData.dob || "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-0.5 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-800 font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Column 2 - Employment & Bank Info */}
              <div className="flex flex-col gap-2 bg-[#F8FAFC] rounded-xl p-4 shadow-sm text-sm">
                <h4 className="font-bold text-[#111827] border-b border-gray-300 pb-1 mb-2 text-base">
                  Employment & Bank Info
                </h4>
                {[
                  ["Employment Type", handleModal.partnerData.employmentType],
                  ["Home Type", handleModal.partnerData.homeType],
                  [
                    "Address Stability",
                    handleModal.partnerData.addressStability,
                  ],
                  ["Bank Name", handleModal.partnerData.bankName],
                  ["Account Number", handleModal.partnerData.accountNumber],
                  ["IFSC Code", handleModal.partnerData.ifscCode],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-0.5 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-800 font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Column 3 - Status & Codes */}
              <div className="flex flex-col gap-2 bg-[#F8FAFC] rounded-xl p-4 shadow-sm text-sm">
                <h4 className="font-bold text-[#111827] border-b border-gray-300 pb-1 mb-2 text-base">
                  Status & Codes
                </h4>
                {[
                  ["Status", handleModal.partnerData.status],
                  ["Partner Code", handleModal.partnerData.partnerCode],
                  ["Employee ID", handleModal.partnerData.employeeId],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-0.5 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-800 font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Column 4 - Documents */}
              <div className="flex flex-col gap-2 bg-[#F8FAFC] rounded-xl p-4 shadow-sm text-sm">
                <h4 className="font-bold text-[#111827] border-b border-gray-300 pb-1 mb-2 text-base">
                  Documents
                </h4>
                {handleModal.partnerData.docs &&
                handleModal.partnerData.docs.length > 0 ? (
                  handleModal.partnerData.docs.map((doc, index) => (
                    <div
                      key={index}
                      className="flex justify-between py-0.5 border-b border-gray-200 last:border-b-0"
                    >
                      <span className="text-gray-500">{doc.docType}</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        View
                      </a>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-800 font-semibold">
                    No documents available
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button
                className="bg-blue-600 text-white px-3 py-1 mx-5 rounded hover:bg-blue-700 transition"
                onClick={() => {
                  setPartnerToAssign(handleModal.partnerData);
                  setShowAssignModal(true);

                  setHandleModal((prev) => ({
                    ...prev, // keep existing partnerData
                    modalStatus: false, // update only modalStatus
                  }));
                }}
              >
                Assign RM
              </button>

              <button
                className="px-6 py-2 text-sm font-medium rounded-lg bg-[#12B99C] text-white hover:bg-[#10a68f] transition shadow-md"
                onClick={() =>
                  setHandleModal({ modalStatus: false, partnerData: null })
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <h2 className="text-lg font-semibold mb-2">New Partner</h2>
      <p className="text-xs text-gray-600 mb-3">
        Total {displayData?.length || 0} records found
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="w-full border-collapse bg-white text-sm">
          <thead style={{ background: colors.primary, color: "white" }}>
            <tr>
              <th className="px-3 py-3 text-left">User Name</th>
              <th className="px-3 py-3 text-left">Contact</th>
              <th className="px-3 py-3 text-left">Created on</th>
              <th className="px-3 py-3 text-left">assign</th>
              <th className="px-3 py-3 text-left">view more</th>
              <th className="px-3 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayData?.map((partner, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">
                  {partner.firstName + " " + partner.lastName}
                </td>
                <td className="px-3 py-2">{partner.phone}</td>

                <td className="px-3 py-2">
                  {partner.createdAt
                    ? new Date(partner.createdAt).toLocaleDateString()
                    : "-"}
                </td>

                <td className="px-3 py-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    onClick={() => {
                      setPartnerToAssign(partner);
                      setShowAssignModal(true);
                    }}
                  >
                    Assign RM
                  </button>
                </td>

                <td className="px-3 py-2">
                  <button
                    className="bg-emerald-500 text-white px-3 py-1 rounded hover:bg-emerald-600 transition flex items-center gap-1"
                    onClick={() => {
                      setHandleModal({
                        modalStatus: true,
                        partnerData: partner,
                      });
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View More
                  </button>
                </td>

                <td className="px-3 py-2">
                  <button
                    className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition"
                    onClick={() => {
                      setPartnerToReject(partner);
                      setRejectModalOpen(true);
                    }}
                    title="Reject & Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
