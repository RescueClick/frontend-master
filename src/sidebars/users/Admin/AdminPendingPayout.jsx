import React, { useEffect, useMemo, useState } from "react";
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

import { useLocation, useNavigate } from "react-router-dom";

import {
  fetchAdminCustomerPartnersPayout,
  fetchAdminCustomersPayOutPending,
  setAdminPayouts,
} from "../../../feature/thunks/adminThunks";

import { matchesSearchTerm, matchesStatusFilter } from "../../../utils/tableFilter";
import { matchesMonthYear } from "../../../utils/dateFilter";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";
import TableLoader from "../../../components/shared/TableLoader";
import DhanSourceLoader from "../../../components/DhanSourceLoader";

const AdminPendingPayout = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();

  const [year, setYear] = useState(location.state?.year || new Date().getFullYear());
  const [month, setMonth] = useState(location.state?.month || new Date().getMonth() + 1);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [payoutPercent, setPayoutPercent] = useState("");

  const [customerID, setCustomerID] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const dispatch = useDispatch();

  const [payoutData, setPayoutData] = useState({
    applicationId: "",
    partnerId: "",
    approvalAmount: "",
    payoutPercentage: "",
    totalPayout: "",
    payOutStatus: "PENDING",
  });

  useEffect(() => {
    if (customerID) {
      dispatch(fetchAdminCustomerPartnersPayout(customerID));
    }
  }, [customerID, dispatch]);

  const { data, loading, error } = useSelector(
    (state) => state.admin?.pendingPayout || { data: [], loading: false, error: null }
  );

  const { data: customerPartnersPayout, loading: payoutDetailLoading } =
    useSelector(
      (state) =>
        state.admin?.customerPartnersPayout || {
          data: null,
          loading: false,
        }
    );

  // When modal opens and partner payout data is loaded, prefill admin payout form
  useEffect(() => {
    if (customerID && customerPartnersPayout && customerPartnersPayout.partners?.length) {
      const partner = customerPartnersPayout.partners[0];
      setPayoutData((prev) => ({
        ...prev,
        applicationId: partner.applicationId || prev.applicationId || "",
        // backend returns partner _id, use that as partnerId for payout API
        partnerId: partner._id?.toString() || prev.partnerId || "",
        // approvalAmount is sourced from list row click; keep existing if already set
        approvalAmount: prev.approvalAmount || "",
        payoutPercentage: prev.payoutPercentage || "",
        // backend returns existing payoutAmount & payoutStatus if any
        totalPayout: partner.payoutAmount ?? prev.totalPayout ?? "",
        payOutStatus: partner.payoutStatus || prev.payOutStatus || "PENDING",
      }));
    }
  }, [customerID, customerPartnersPayout]);

  useEffect(() => {
    dispatch(fetchAdminCustomersPayOutPending());
  }, [dispatch]);


  const handleClose = () => {
    setCustomerID(null);
  };

  const computedTotalPayout =
    payoutData.approvalAmount && payoutData.payoutPercentage
      ? (parseFloat(payoutData.approvalAmount) *
          parseFloat(payoutData.payoutPercentage)) / 100
      : 0;

  const handleApplyPayout = async () => {
    if (!payoutData.applicationId || !payoutData.partnerId) {
      return;
    }

    try {
      setIsApplying(true);
      await dispatch(
        setAdminPayouts({
          applicationId: payoutData.applicationId,
          partnerId: payoutData.partnerId,
          // If admin leaves percentage empty, backend will keep existing amount
          payoutPercentage: payoutData.payoutPercentage
            ? Number(payoutData.payoutPercentage)
            : undefined,
          payOutStatus: payoutData.payOutStatus,
        })
      ).unwrap();

      // Refresh pending list and close modal
      dispatch(fetchAdminCustomersPayOutPending());
      setCustomerID(null);
    } catch (e) {
      // Optional: handle error via toast/snackbar
      console.error("Failed to set payout", e);
    } finally {
      setIsApplying(false);
    }
  };

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

  // Admin view (currently read‑only list + partner details modal)

  const filteredRows = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    const filtered = rows.filter((row) => {
      const matchesSearch = matchesSearchTerm(searchTerm, [
        row.customerName,
        row.customerEmployeeId,
        row.contact,
        row.loanType,
      ]);
      const matchesStatus = matchesStatusFilter(row.payOutStatus, selectedFilter);
      const matchesDate = matchesMonthYear(row, { year, month });
      return matchesSearch && matchesStatus && matchesDate;
    });
    return sortNewestFirst(filtered, { dateKeys: ["createdAt", "applicationDate"] });
  }, [data, searchTerm, selectedFilter, year, month]);

  return (
    <>
      {/* Popup (Modal) — payout review */}
      {customerID && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200/80">
            <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <User className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 truncate">
                    Apply payout
                  </h2>
                  <p className="text-xs text-slate-500">
                    Partner bank details &amp; payout calculation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {payoutDetailLoading || !customerPartnersPayout ? (
                <div className="flex min-h-[280px] items-center justify-center p-8">
                  <DhanSourceLoader size="sm" label="Loading partner details…" />
                </div>
              ) : (
                <div className="p-6 space-y-8">
                {customerPartnersPayout.partners?.map((partner, index) => (
                <div
                  key={partner._id || index}
                  className="mb-8 border-b border-gray-200 pb-8 last:mb-0 last:border-b-0 last:pb-0"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Partner {index + 1}: {partner.firstName} {partner.lastName}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side - Partner Information */}
                    <div className="space-y-4">
                      {/* Bank Name */}
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-brand-primary">
                        <Building className="w-5 h-5 text-brand-primary" />
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
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-brand-primary">
                        <Hash className="w-5 h-5 text-brand-primary" />
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
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-brand-primary">
                        <CreditCard className="w-5 h-5 text-brand-primary" />
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
                      <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-brand-primary">
                        <User className="w-5 h-5 text-brand-primary" />
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
                          <Calculator className="w-5 h-5 text-brand-primary" />
                          Financial Calculation
                        </h3>

                        <div className="space-y-4">
                          {/* Approval Amount */}
                          <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">
                              Approval Amount
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-primary font-bold">
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
                                onChange={(e) =>
                                  setPayoutData((prev) => ({
                                    ...prev,
                                    payoutPercentage: e.target.value,
                                  }))
                                }
                                className="w-full pr-8 pl-4 py-3 border-2 border-gray-200 rounded-xl text-[#111827] font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="Enter %"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-primary font-bold">
                                %
                              </span>
                            </div>
                          </div>

                          {/* Disbursed / Total Payout Display */}
                          <div className="bg-gradient-to-r from-[#F59E0B] to-[#EAB308] p-4 rounded-xl text-white w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IndianRupee className="w-5 h-5" />
                                <span className="font-semibold">
                                  Disbursed Amount
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">
                                  ₹
                                  {(payoutData.totalPayout || computedTotalPayout).toLocaleString(
                                    "en-IN",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </p>
                                <p className="text-sm opacity-90">
                                  Calculated Payout
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status selector */}
                          <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">
                              Payout Status
                            </label>
                            <select
                              value={payoutData.payOutStatus}
                              onChange={(e) =>
                                setPayoutData((prev) => ({
                                  ...prev,
                                  payOutStatus: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="DONE">DONE</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </div>

                          {/* Apply button */}
                          <button
                            type="button"
                            onClick={handleApplyPayout}
                            disabled={isApplying}
                            className={`mt-4 w-full text-white font-semibold py-3 rounded-xl transition-all duration-200 ${
                              isApplying
                                ? "bg-[#0f9b82]/70 cursor-not-allowed"
                                : "bg-brand-primary hover:bg-[#0f9b82]"
                            }`}
                          >
                            {isApplying ? "Applying..." : "Apply Payout"}
                          </button>
                        </div>
                      </div>

                      {/* No action buttons for ASM – payouts are admin-only */}
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center text-lg text-black-600 hover:text-gray-800 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Dashboard
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Manage and view all pending payout customers
          </p>

          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, phone, loan type..."
              className="w-full md:flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full md:w-56 px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="DONE">DONE</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full md:w-44 px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full md:w-44 px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "short" })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead style={{ background: "var(--color-brand-primary)", color: "white" }}>
              <tr>
                <th className="px-2 py-4 text-left">User Name</th>
                <th className="px-2 py-4 text-left">User Id</th>
                <th className="px-2 py-4 text-left">Contact</th>
                <th className="px-2 py-4 text-left">Application Date</th>
                <th className="px-2 py-4 text-left">Loan Type</th>
                <th className="px-2 py-4 text-left">Loan Amount</th>
                <th className="px-2 py-4 text-left">Approval Amount</th>
                <th className="px-2 py-4 text-left">Proposed Payout</th>
                <th className="px-2 py-4 text-left">Status</th>
                <th className="px-2 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader colSpan={9} label="Loading payouts…" />
              ) : error ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredRows.length > 0 ? (
                filteredRows.map((customer) => (
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
                    <td className="px-2 py-3 align-middle">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          customer.payOutStatus
                        )}`}
                      >
                        {customer.payOutStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <button
                        type="button"
                        onClick={() => {
                          // Prefill approval amount directly from list row and default status to DONE
                          setPayoutData((prev) => ({
                            ...prev,
                            approvalAmount:
                              customer.approvedAmount ?? prev.approvalAmount ?? "",
                            payoutPercentage: prev.payoutPercentage || "",
                            totalPayout: customer.payoutAmount || prev.totalPayout || "",
                            payOutStatus: "DONE",
                          }));
                          setCustomerID(customer.customerId);
                        }}
                        className="px-4 py-2 bg-brand-primary hover:bg-[#0f9b82] text-white text-xs font-semibold rounded-lg transition-all duration-200"
                      >
                        Pay Payout
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">
                    No customers found for this filter
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

export default AdminPendingPayout;

