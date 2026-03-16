

import React, { useEffect, useState } from "react";
import {
  Eye,
  ArrowLeft,
  XIcon,
  Building,
  Hash,
  CreditCard,
  Calculator,
  DollarSign,
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
  fetchCustomerPartnersPayout,
  fetchRmCustomersPayOutDone,
  setPayouts,
} from "../../../../feature/thunks/rmThunks";

const DonePayout = () => {
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

  // ✅ Single handleChange method
  // ✅ Handle change correctly
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayoutData((prev) => ({
      ...prev,
      [name]: value,
      totalPayout:
        name === "approvalAmount" || name === "payoutPercentage"
          ? ((name === "approvalAmount" ? value : prev.approvalAmount) *
              (name === "payoutPercentage" ? value : prev.payoutPercentage)) /
            100
          : prev.totalPayout,
    }));
  };

  useEffect(() => {
    if (customerID) {
      dispatch(fetchCustomerPartnersPayout(customerID));
    }
  }, [customerID, dispatch]);

  const { data, loading, error } = useSelector((state) => state.rm.donePayout);

  const { data: customerPartnersPayout } = useSelector(
    (state) => state.rm.customerPartnersPayout
  );

  // ✅ Get setPayouts loading state
  const { loading: savingPayout, success: payoutSuccess, error: payoutError } = useSelector(
    (state) => state.rm.setPayouts
  );


  useEffect(() => {
    dispatch(fetchRmCustomersPayOutDone());
  }, [dispatch]);

  const handleClose = () => setSelectedCustomer(null);

  const totalPayout =
    approvalAmount && payoutPercent
      ? (parseFloat(approvalAmount) * parseFloat(payoutPercent)) / 100
      : 0;

  const customers = [
    {
      id: 1,
      name: "Sarah Johnson",
      phone: "+91 22123-54567",
      totalLoan: 500000,
      loanType: "Home Loan",
      joinDate: "2023-01-15",
      status: "Pending",
      approvalAmount: 250000,
      bankName: "SBI Bank",
      ifsc: "SBIN0001234",

      accountNumber: "1234567890",
      accountHolder: "Sarah Johnson",
    },
    {
      id: 2,
      name: "Michael Chen",
      phone: "+91 22123-54567",
      totalLoan: 1200000,
      loanType: "Business Loan",
      joinDate: "2022-11-08",
      status: "Pending",
      approvalAmount: 600000,
      bankName: "HDFC Bank",
      ifsc: "HDFC0005678",
      accountNumber: "9876543210",
      accountHolder: "Michael Chen",
    },
  ];

  // Loan type color
  const getAccountTypeColor = (loanType) => {
    switch (loanType) {
      case "Home Loan":
        return "bg-blue-100 text-blue-700";
      case "Business Loan":
        return "bg-green-100 text-green-700";
      case "Personal Loan":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "Done":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ✅ Filtering
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      customer.status.toLowerCase() === selectedFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleSavePayout = async (applicationId, partnerId, payoutPercent, note) => {
    try {
      await dispatch(
        setPayouts({
          applicationId,
          partnerId,
          payoutPercentage: Number(payoutPercent), // ✅ Ensures it's a number
          note,
          payOutStatus: "DONE",
        })
      ).unwrap(); // unwrap() throws error if rejected

      // ✅ Success - refresh data and close modal
      dispatch(fetchRmCustomersPayOutDone());
      setCustomerID(null); // Close modal
      setPayoutData({ approvalAmount: "", payoutPercentage: "", totalPayout: "" }); // Reset form
    } catch (err) {
      // Error is handled by Redux state, will show in popup
      console.error("Failed to save payout:", err);
    }
  };

  return (
    <>
      {/* ✅ Loading Popup Modal */}
      {savingPayout && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[70] overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative mx-4">
            {/* Loading Spinner */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-[#12B99C] border-t-transparent rounded-full animate-spin mb-4"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Processing Payout...
              </h2>
              <p className="text-sm text-gray-600 text-center">
                Please wait while we save the payout details. This may take a few moments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success Popup Modal */}
      {payoutSuccess && !savingPayout && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[70] overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative mx-4">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Payout Saved Successfully!
              </h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                The payout details have been saved and the customer list has been updated.
              </p>
              <button
                onClick={() => {
                  // Reset success state by dispatching a reset action or just closing
                  window.location.reload(); // Simple refresh
                }}
                className="px-6 py-2 bg-[#12B99C] text-white rounded-lg hover:bg-[#0EA688] transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Error Popup Modal */}
      {payoutError && !savingPayout && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[70] overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative mx-4">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Failed to Save Payout
              </h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                {payoutError || "An error occurred while saving the payout. Please try again."}
              </p>
              <button
                onClick={() => {
                  // Reset error by refreshing or dispatching reset
                  window.location.reload();
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              {customerPartnersPayout.partners.map((partner, index) => (
                <div
                  key={partner._id}
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
                            {partner.bankName}
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
                            {partner.ifscCode}
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
                            {partner.accountNumber}
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
                                onChange={handleChange}
                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[#111827] font-semibold"
                                placeholder="Enter amount"
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
                                onChange={handleChange}
                                className="w-full pr-8 pl-4 py-3 border-2 border-gray-200 rounded-xl text-[#111827] font-semibold"
                                placeholder="Enter percentage"
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
                                  {payoutData.totalPayout.toLocaleString(
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

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button 
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-[#12B99C] to-[#0EA688] hover:from-[#0EA688] hover:to-[#12B99C] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          onClick={() =>
                            handleSavePayout(
                              partner.applicationId,
                              partner._id,
                              Number(payoutData.payoutPercentage), // ✅ Convert string → number
                              "Initial payout"
                            )
                          }
                          disabled={savingPayout || !payoutData.approvalAmount || !payoutData.payoutPercentage}
                        >
                          {savingPayout ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Details
                            </>
                          )}
                        </button>
                      </div>
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
              onClick={() => navigate("/rm/Rm-Application")}
              className="flex items-center text-lg text-black-600 hover:text-gray-800 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Customer List
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Manage and view all customer information
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
                <th className="px-2 py-4 text-left">Payout</th>
              </tr>
            </thead>
            <tbody>
              {data.map((customer) => (
                <tr
                  key={customer.customerID}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-2 py-3 align-top">
                    <span className="font-medium">{customer.customerName}</span>
                  </td>
                  <td className="px-2 py-3 align-middle">
                    <span className="text-xs text-gray-500">
                      #{customer.customerEmployeeId}
                    </span>
                  </td>
                  <td className="px-2 py-3 align-middle">{customer.contact}</td>
                  <td className="px-2 py-3 align-middle">
                    {new Date(customer.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-2 py-3 align-middle">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(
                        customer.loanType
                      )}`}
                    >
                      {customer.loanType}
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
                  <td className="px-2 py-3 align-middle">
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-medium cursor-pointer ${getStatusColor(
                        customer.payOutStatus
                      )}`}
                      onClick={() => {
                        setCustomerID(customer.customerId);
                      }}
                    >
                      {customer.payOutStatus}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DonePayout;
