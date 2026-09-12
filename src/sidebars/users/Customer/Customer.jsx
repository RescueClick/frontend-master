import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Phone,
  User,
  Calendar,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  LogOut,
  FileText,
  Building2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData, clearAuthData } from "../../../utils/localStorage";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../../components/NotificationBell";

const LOAN_TYPE_LABELS = {
  PERSONAL: "Personal Loan (Salaried)",
  BUSINESS: "Business Loan",
  HOME_LOAN_SALARIED: "Home Loan (Salaried)",
  HOME_LOAN_SELF_EMPLOYED: "Home Loan (Self-Employed)",
  LAP_SALARIED: "Loan Against Property (Salaried)",
  LAP_SELF_EMPLOYED: "Loan Against Property (Self-Employed)",
  LAP: "Loan Against Property",
};

const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AGREEMENT: "bg-teal-100 text-teal-800 border-teal-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  DISBURSED: "bg-purple-100 text-purple-800 border-purple-200",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  SUBMITTED: "bg-amber-100 text-amber-800 border-amber-200",
  DOC_COMPLETE: "bg-cyan-100 text-cyan-800 border-cyan-200",
  DOC_INCOMPLETE: "bg-orange-100 text-orange-800 border-orange-200",
  default: "bg-slate-100 text-slate-800 border-slate-200",
};

// Progress bar configuration
const statusSteps = [
  { key: "SUBMITTED", label: "Submitted", icon: CheckCircle },
  { key: "UNDER_REVIEW", label: "Review", icon: Clock },
  { key: "APPROVED", label: "Approved", icon: CheckCircle },
  { key: "AGREEMENT", label: "Agreement", icon: CheckCircle },
  { key: "DISBURSED", label: "Disbursed", icon: CheckCircle },
];

const getStatusProgress = (currentStatus) => {
  const s = String(currentStatus || "").toUpperCase();
  if (s === "REJECTED") {
    return { currentStep: -1, isRejected: true };
  }
  if (s === "DOC_INCOMPLETE" || s === "DOC_COMPLETE" || s === "DOC_SUBMITTED" || s === "LOGIN") {
    return { currentStep: 0, isRejected: false };
  }
  const currentIndex = statusSteps.findIndex((step) => step.key === s);
  return { currentStep: currentIndex >= 0 ? currentIndex : 0, isRejected: false };
};

const ProgressBar = ({ status }) => {
  const { currentStep, isRejected } = getStatusProgress(status);

  if (isRejected) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-center p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <XCircle className="w-5 h-5 text-rose-600 mr-2 shrink-0" />
          <span className="text-rose-700 text-sm font-semibold">Application Declined / Rejected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.key} className="flex flex-col items-center relative flex-1">
              {/* Connection line */}
              {index > 0 && (
                <div
                  className={`absolute left-0 top-3 w-full h-0.5 -z-10 ${
                    index <= currentStep ? "bg-teal-500" : "bg-slate-200"
                  }`}
                  style={{ left: "-50%", width: "100%" }}
                />
              )}

              {/* Step circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] font-bold ${
                  isCompleted
                    ? "bg-teal-600 text-white shadow-sm"
                    : isCurrent
                    ? "bg-teal-500 text-white ring-2 ring-teal-200 animate-pulse"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? <Icon className="w-3.5 h-3.5" /> : index + 1}
              </div>

              {/* Step label */}
              <span
                className={`text-[10px] sm:text-xs text-center font-medium ${
                  isCompleted
                    ? "text-teal-700 font-semibold"
                    : isCurrent
                    ? "text-teal-600 font-bold"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress line */}
      <div className="relative">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
            style={{
              width: currentStep >= 0 ? `${((currentStep + 1) / statusSteps.length) * 100}%` : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
};

const Customer = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const { customerToken } = getAuthData();
    if (!customerToken) {
      navigate("/LoginPage", { replace: true });
    }
  }, [navigate]);

  const fetchApplications = async (isManual = false) => {
    const { customerToken } = getAuthData();
    if (!customerToken) return;

    try {
      if (isManual) setRefreshing(true);
      const res = await axios.get(`${backendurl}/customer/get-applications`, {
        headers: { Authorization: `Bearer ${customerToken}` },
        withCredentials: true,
      });
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleLogout = () => {
    clearAuthData();
    navigate("/LoginPage", { replace: true });
  };

  const handleCall = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/\D/g, "")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Loans
            </h1>
            <p className="text-xs text-slate-500">Track real-time progress & sanctions</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => fetchApplications(true)}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/apply")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply Loan</span>
            </button>

            <NotificationBell />

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
            <p className="text-sm font-medium">Loading your loan files...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm my-6">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Active Applications</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              You do not have any open loan files right now. Choose a loan product below and get pre-approved sanctions with fast digital processing.
            </p>
            <button
              type="button"
              onClick={() => navigate("/apply")}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Apply for a Loan Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app, idx) => {
              const statusClass = statusColors[app.status] || statusColors.default;
              const loanName =
                LOAN_TYPE_LABELS[app.loanType] || app.loanType || "Loan Application";
              const partnerPhone = app?.partner?.phone || "";
              const rmPhone = app?.rm?.phone || "";

              return (
                <div
                  key={app._id || idx}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition"
                >
                  {/* Top Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        #{app.appNo}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {loanName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusClass}`}
                      >
                        {app.status}
                      </span>
                      {app.formFillingDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(app.formFillingDate).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <ProgressBar status={app.status} />

                  {/* Financial Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">
                        Applied Amount
                      </p>
                      <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                        ₹
                        {Number(
                          app.appliedLoanAmount || app.customer?.loanAmount || 0
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                      <p className="text-[11px] font-semibold text-emerald-700 uppercase">
                        Sanctioned Amount
                      </p>
                      <p className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">
                        {app.approvedLoanAmount
                          ? `₹${Number(app.approvedLoanAmount).toLocaleString("en-IN")}`
                          : "Under Review"}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">
                        Product Stage
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                        {app.status === "APPROVED"
                          ? "Sanction Ready"
                          : app.status === "AGREEMENT"
                          ? "eNACH Pending"
                          : app.status === "DISBURSED"
                          ? "Disbursed to Bank"
                          : "Verification In-Progress"}
                      </p>
                    </div>
                  </div>

                  {/* Underwriter Remarks */}
                  {app.remarks && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 mb-4 text-xs text-amber-900">
                      <span className="font-bold">Officer Remarks: </span>
                      <span>{app.remarks}</span>
                    </div>
                  )}

                  {/* Assistance & Contact Row */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-4">
                      {app?.partner && (
                        <div>
                          <span className="text-slate-400">Advisor: </span>
                          <span className="font-semibold text-slate-800">
                            {app.partner.firstName} {app.partner.lastName}
                          </span>
                        </div>
                      )}
                      {app?.rm && (
                        <div>
                          <span className="text-slate-400">Manager: </span>
                          <span className="font-semibold text-slate-800">
                            {app.rm.firstName} {app.rm.lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {partnerPhone && (
                        <button
                          type="button"
                          onClick={() => handleCall(partnerPhone)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span>Call Advisor</span>
                        </button>
                      )}
                      {rmPhone && (
                        <button
                          type="button"
                          onClick={() => handleCall(rmPhone)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>Call Support</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Customer;
