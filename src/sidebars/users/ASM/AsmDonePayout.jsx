import React, { useEffect, useState } from "react";
import {
  Eye,
  ArrowLeft,
  XIcon,
  Building,
  Hash,
  CreditCard,
  Calculator,
  IndianRupee,
  Save,
  Ban,
  XCircle,
  X,
  User,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";
import {
  fetchAsmCustomerPartnersPayout,
  fetchAsmCustomersPayOutDone,
} from "../../../feature/thunks/asmThunks";

const AsmDonePayout = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [payoutPercent, setPayoutPercent] = useState("");

  const [customerID, setCustomerID] = useState(null);

  const dispatch = useDispatch();

  const [payoutData, setPayoutData] = useState({
    approvalAmount: "",
    payoutPercentage: "",
    totalPayout: "",
  });

  useEffect(() => {
    if (customerID) {
      dispatch(fetchAsmCustomerPartnersPayout(customerID));
    }
  }, [customerID, dispatch]);

  const { data, loading, error } = useSelector((state) => state.asm?.donePayout || { data: [], loading: false, error: null });

  const { data: customerPartnersPayout } = useSelector(
    (state) => state.asm?.customerPartnersPayout || { data: null }
  );

  // ASM done view is now read‑only; no save state


  useEffect(() => {
    dispatch(fetchAsmCustomersPayOutDone());
  }, [dispatch]);

  const handleClose = () => setSelectedCustomer(null);

  const totalPayout =
    approvalAmount && payoutPercent
      ? (parseFloat(approvalAmount) * parseFloat(payoutPercent)) / 100
      : 0;

  // Loan type color
  const getAccountTypeColor = (loanType) => {
    switch (loanType) {
      case "HOME_LOAN_SALARIED":
      case "HOME_LOAN_SELF_EMPLOYED":
        return "bg-blue-100 text-blue-700";
      case "BUSINESS":
        return "bg-green-100 text-green-700";
      case "PERSONAL":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Status color
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "DONE":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ASM cannot modify payouts from done screen; view‑only

  return (
    <>
      {/* Popup (Modal) */}
      {customerID && customerPartnersPayout && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/25 bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl relative transform transition-all duration-300 ease-out scale-100 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#12B99C] to-[#0EA688] p-6 rounded-t-2xl text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <User className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <h2 className="text-xl font-bold">Partner Details</h2>
                </div>
                <button
                  onClick={() => {
                    setCustomerID(null);
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5 text-[#F59E0B]" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {customerPartnersPayout.partners?.map((partner, index) => (
                <div
                  key={partner._id || index}
                  className="mb-8 border-b border-gray-200 pb-6 last:border-none"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Partner {index + 1}: {partner.firstName} {partner.lastName}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side - Partner Information */}
                    <div className="space-y-4">
                      {/* Bank Name */}
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#12B99C]">
                        <Building className="w-5 h-5 text-[#12B99C]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">
                            Bank Name:
                          </span>
                          <span className="text-[#111827] font-semibold">
                            {partner.bankName || "—"}
                          </span>
                        </div>
                      </div>

                      {/* IFSC Code */}
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#12B99C]">
                        <Hash className="w-5 h-5 text-[#12B99C]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">
                            IFSC Code:
                          </span>
                          <span className="text-[#111827] font-semibold font-mono">
                            {partner.ifscCode || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#12B99C]">
                        <CreditCard className="w-5 h-5 text-[#12B99C]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">
                            Account Number:
                          </span>
                          <span className="text-[#111827] font-semibold">
                            {partner.accountNumber || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Account Holder */}
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#12B99C]">
                        <User className="w-5 h-5 text-[#12B99C]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">
                            Account Holder:
                          </span>
                          <span className="text-[#111827] font-semibold">
                            {partner.firstName} {partner.lastName}
                          </span>
                        </div>
                      </div>

                      {/* Customer ID */}
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#F59E0B]">
                        <Hash className="w-5 h-5 text-[#F59E0B]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">
                            Customer ID:
                          </span>
                          <span className="text-[#111827] font-semibold">
                            {customerID}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Financial Calculation */}
                    <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-[#12B99C]" />
                          Financial Calculation
                        </h3>

                        <div className="space-y-4">
                          {/* Approval Amount */}
                          <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">
                              Approval Amount
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#12B99C] font-bold">
                                ₹
                              </span>
                              <input
                                type="number"
                                name="approvalAmount"
                                value={payoutData.approvalAmount}
                                readOnly
                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[#111827] font-semibold bg-gray-50 cursor-not-allowed"
                                placeholder="—"
                              />
                            </div>
                          </div>

                          {/* Payout Percentage */}
                          <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">
                              Payout Percentage
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                name="payoutPercentage"
                                value={payoutData.payoutPercentage}
                                readOnly
                                className="w-full pr-8 pl-4 py-3 border-2 border-gray-200 rounded-xl text-[#111827] font-semibold bg-gray-50 cursor-not-allowed"
                                placeholder="—"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#12B99C] font-bold">
                                %
                              </span>
                            </div>
                          </div>

                          {/* Total Payout Display */}
                          <div className="bg-gradient-to-r from-[#F59E0B] to-[#EAB308] p-4 rounded-xl text-white w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IndianRupee className="w-5 h-5" />
                                <span className="font-semibold">
                                  Total Payout
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">
                                  ₹
                                  {(payoutData.totalPayout || 0).toLocaleString(
                                    "en-IN",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </p>
                                <p className="text-sm opacity-90">
                                  Final Amount
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* No action buttons for ASM – payouts are admin‑only */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate("/asm/dashboard")}
              className="flex items-center text-lg text-black-600 hover:text-gray-800 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Dashboard
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Manage and view all done payout customers
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead style={{ background: "#12B99C", color: "white" }}>
              <tr>
                <th className="px-2 py-4 text-left">User Name</th>
                <th className="px-2 py-4 text-left">User Id</th>
                <th className="px-2 py-4 text-left">Contact</th>
                <th className="px-2 py-4 text-left">Application Date</th>
                <th className="px-2 py-4 text-left">Loan Type</th>
                <th className="px-2 py-4 text-left">Loan Amount</th>
                <th className="px-2 py-4 text-left">Approval Amount</th>
                <th className="px-2 py-4 text-left">Payout Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-red-600">
                    {error}
                  </td>
                </tr>
              ) : data && data.length > 0 ? (
                data.map((customer) => (
                  <tr
                    key={customer.customerId || customer.applicationId}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-2 py-3 align-top">
                      <span className="font-medium">{customer.customerName}</span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span className="text-xs text-gray-500">
                        #{customer.customerEmployeeId || "—"}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">{customer.contact || "—"}</td>
                    <td className="px-2 py-3 align-middle">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(
                          customer.loanType
                        )}`}
                      >
                        {customer.loanType || "—"}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle font-semibold">
                      {customer.requestedAmount
                        ? `₹${customer?.requestedAmount.toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="px-2 py-3 align-middle font-semibold">
                      {customer.approvedAmount
                        ? `₹${customer.approvedAmount.toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="px-2 py-3 align-middle font-semibold">
                      {customer.payoutAmount
                        ? `₹${Number(customer.payoutAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No done payouts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AsmDonePayout;

