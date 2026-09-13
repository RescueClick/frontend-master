import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Phone,
  Calendar,
  PlusCircle,
  LogOut,
  FileText,
  RefreshCw,
  ArrowLeft,
  Smartphone,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData, clearAuthData } from "../../../utils/localStorage";
import { getOriginalRole, backToAdmin } from "../../../utils/impersonation";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../../components/NotificationBell";
import { CUSTOMER_APP_PLAY_STORE_URL, CUSTOMER_APP_ON_PLAY_STORE, CUSTOMER_APP_PLAY_SEARCH_NAME, CUSTOMER_APP_PLAY_SEARCH_URL, COMPANY_NAME } from "../../../config/branding";

const LOAN_TYPE_LABELS = {
  PERSONAL: "Personal Loan (Salaried)",
  BUSINESS: "Business Loan",
  HOME_LOAN_SALARIED: "Home Loan (Salaried)",
  HOME_LOAN_SELF_EMPLOYED: "Home Loan (Self-Employed)",
  LAP_SALARIED: "Loan Against Property (Salaried)",
  LAP_SELF_EMPLOYED: "Loan Against Property (Self-Employed)",
  LAP: "Loan Against Property",
};

/** Same stage flow as Partner Customers page */
const LOAN_STAGES = [
  {
    id: 1,
    title: "Documents Incomplete",
    description: "Upload pending documents: Aadhaar, PAN, salary slip & bank statement",
    bgColor: "#FEFCE8",
    iconBg: "#CA8A04",
    statuses: ["DRAFT", "SUBMITTED", "DOC_INCOMPLETE", "DOC_SUBMITTED", "LOGIN"],
  },
  {
    id: 2,
    title: "Documents Complete",
    description: "All required documents uploaded. Ready for review.",
    bgColor: "#F0FDFA",
    iconBg: "#0D9488",
    statuses: ["DOC_COMPLETE"],
  },
  {
    id: 3,
    title: "Under Review",
    description: "Your file is being reviewed for credit evaluation",
    bgColor: "#EFF6FF",
    iconBg: "#3B82F6",
    statuses: ["UNDER_REVIEW"],
  },
  {
    id: 4,
    title: "Approved",
    description: "Approved — waiting for agreement",
    bgColor: "#F0FDFA",
    iconBg: "#0D9488",
    statuses: ["APPROVED"],
  },
  {
    id: 5,
    title: "Agreement",
    description: "Agreement stage — final steps before disbursement",
    bgColor: "#FEFCE8",
    iconBg: "#CA8A04",
    statuses: ["AGREEMENT"],
  },
  {
    id: 6,
    title: "Disbursed",
    description: "Loan disbursed successfully",
    bgColor: "#F0FDFA",
    iconBg: "#0D9488",
    statuses: ["DISBURSED"],
  },
  {
    id: 7,
    title: "Rejected",
    description: "Application was declined",
    bgColor: "#FEE2E2",
    iconBg: "#EF4444",
    statuses: ["REJECTED"],
  },
];

const STATUS_FILTERS = [
  { key: "In-Progress", label: "In-Progress" },
  { key: "Disbursed", label: "Disbursed" },
  { key: "Rejected", label: "Rejected" },
];

function normalizeStatus(status) {
  const s = String(status || "").toUpperCase();
  return s === "DRAFT" ? "SUBMITTED" : s;
}

function matchesTopFilter(app, filterKey) {
  const status = normalizeStatus(app.status);
  if (filterKey === "In-Progress") return !["DISBURSED", "REJECTED"].includes(status);
  if (filterKey === "Disbursed") return status === "DISBURSED";
  if (filterKey === "Rejected") return status === "REJECTED";
  return true;
}

function appsInStage(apps, stage) {
  return apps.filter((a) => stage.statuses.includes(normalizeStatus(a.status)));
}

const Customer = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("In-Progress");
  const [selectedStage, setSelectedStage] = useState(null);

  const navigate = useNavigate();
  const { parentUser } = getAuthData();
  const isImpersonating = !!parentUser;
  const originalRole = getOriginalRole();

  useEffect(() => {
    const { customerToken } = getAuthData();
    if (!customerToken) navigate("/LoginPage", { replace: true });
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

  const filteredByTop = useMemo(
    () => applications.filter((a) => matchesTopFilter(a, statusFilter)),
    [applications, statusFilter]
  );

  const stagesWithCounts = useMemo(() => {
    return LOAN_STAGES.map((stage) => ({
      ...stage,
      applications: appsInStage(filteredByTop, stage),
      count: appsInStage(filteredByTop, stage).length,
    })).filter((stage) => {
      if (statusFilter === "In-Progress") return stage.id !== 6 && stage.id !== 7;
      if (statusFilter === "Disbursed") return stage.id === 6;
      if (statusFilter === "Rejected") return stage.id === 7;
      return true;
    });
  }, [filteredByTop, statusFilter]);

  const topCounts = useMemo(() => {
    const c = {};
    STATUS_FILTERS.forEach((f) => {
      c[f.key] = applications.filter((a) => matchesTopFilter(a, f.key)).length;
    });
    return c;
  }, [applications]);

  const stageList = selectedStage
    ? appsInStage(filteredByTop, selectedStage)
    : [];

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
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Loans
            </h1>
            <p className="text-xs text-slate-500">Track by stage — same as Partner flow</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isImpersonating && originalRole && (
              <button
                type="button"
                onClick={() => backToAdmin(navigate)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchApplications(true)}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/apply")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              Apply
            </button>
            <NotificationBell />
            <button type="button" onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {/* Partner-style status filters only */}
        {!loading && applications.length > 0 && !selectedStage ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.key;
              const colorMap = {
                "In-Progress": active
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-green-600 text-green-700",
                Disbursed: active
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-blue-600 text-blue-700",
                Rejected: active
                  ? "bg-rose-600 border-rose-600 text-white"
                  : "bg-white border-rose-600 text-rose-700",
              };
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 text-xs font-bold ${colorMap[f.key]}`}
                >
                  {f.label} ({topCounts[f.key] || 0})
                </button>
              );
            })}
          </div>
        ) : null}

        {loading ? (
          <div className="py-20 flex flex-col items-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
            <p className="text-sm font-medium">Loading...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto">
            <FileText className="w-10 h-10 text-teal-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">No loan files yet</h2>
            <button
              type="button"
              onClick={() => navigate("/apply")}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-600 text-white text-sm font-bold"
            >
              <PlusCircle className="w-4 h-4" /> Apply for Loan
            </button>
          </div>
        ) : !selectedStage ? (
          /* Partner-style stage cards */
          <div className="space-y-2.5">
            {stagesWithCounts.map((stage) => {
              const empty = stage.count === 0;
              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={empty}
                  onClick={() => setSelectedStage(stage)}
                  className={`w-full text-left rounded-xl border p-3.5 flex items-center gap-3 transition ${
                    empty
                      ? "bg-slate-50 border-slate-100 opacity-80 cursor-not-allowed"
                      : "border-transparent shadow-sm hover:shadow-md"
                  }`}
                  style={{ backgroundColor: empty ? "#F8FAFC" : stage.bgColor }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: empty ? "#E2E8F0" : stage.iconBg, color: empty ? "#94A3B8" : "#fff" }}
                  >
                    {stage.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${empty ? "text-slate-500" : "text-slate-900"}`}>
                      {stage.title}
                    </p>
                    <p className={`text-xs ${empty ? "text-slate-400" : "text-slate-600"}`}>
                      No. of Applications: <span className="font-bold">{stage.count}</span>
                    </p>
                    {!empty ? (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{stage.description}</p>
                    ) : null}
                    {!empty ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 mt-1">
                        View files <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Stage detail list */
          <div>
            <button
              type="button"
              onClick={() => setSelectedStage(null)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 mb-3 hover:underline"
            >
              <ChevronLeft className="w-4 h-4" /> Back to stages
            </button>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedStage.title} ({stageList.length})
              </h2>
              <p className="text-xs text-slate-500 mt-1">{selectedStage.description}</p>
            </div>

            {stageList.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-10">No files in this stage</p>
            ) : (
              <div className="space-y-3">
                {stageList.map((app) => {
                  const loanName =
                    LOAN_TYPE_LABELS[app.loanType] || app.loanType || "Loan";
                  const applied = Number(
                    app.appliedLoanAmount || app.customer?.loanAmount || 0
                  );
                  return (
                    <div
                      key={app._id || app.appNo}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                          #{app.appNo}
                        </span>
                        {app.formFillingDate ? (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(app.formFillingDate).toLocaleDateString("en-IN")}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-bold text-slate-900">{loanName}</p>
                      <p className="text-sm text-slate-700 mt-1">
                        Applied:{" "}
                        <span className="font-bold">
                          ₹{applied.toLocaleString("en-IN")}
                        </span>
                        {app.approvedLoanAmount ? (
                          <>
                            {" · "}Sanctioned:{" "}
                            <span className="font-bold text-emerald-700">
                              ₹{Number(app.approvedLoanAmount).toLocaleString("en-IN")}
                            </span>
                          </>
                        ) : null}
                      </p>
                      {app.remarks ? (
                        <p className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 text-amber-900">
                          <span className="font-bold">Remark: </span>
                          {app.remarks}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {app?.partner?.phone ? (
                          <button
                            type="button"
                            onClick={() => handleCall(app.partner.phone)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-800 font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Advisor
                          </button>
                        ) : null}
                        {app?.rm?.phone ? (
                          <button
                            type="button"
                            onClick={() => handleCall(app.rm.phone)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Support
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 mb-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 p-5 text-white">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black">
                  {CUSTOMER_APP_ON_PLAY_STORE
                    ? `Download ${COMPANY_NAME} Customer App`
                    : `Get ${COMPANY_NAME} Customer App`}
                </h3>
                <p className="text-sm text-teal-50 mt-1">
                  Track loan stages on your phone
                </p>
              </div>
            </div>

            {CUSTOMER_APP_ON_PLAY_STORE ? (
              <a
                href={CUSTOMER_APP_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-800 font-bold text-sm self-start"
              >
                <ExternalLink className="w-4 h-4" />
                Get it on Google Play
              </a>
            ) : (
              <div className="rounded-xl bg-white/10 border border-white/20 p-4">
                <p className="text-sm font-bold text-white mb-2">
                  How to find the app on Google Play
                </p>
                <ol className="text-sm text-teal-50 space-y-1.5 list-decimal list-inside">
                  <li>Open the <strong className="text-white">Play Store</strong> on your Android phone</li>
                  <li>
                    Tap Search and type:{" "}
                    <span className="inline-block mt-1 px-2.5 py-1 rounded-md bg-white text-teal-900 font-black tracking-wide">
                      {CUSTOMER_APP_PLAY_SEARCH_NAME}
                    </span>
                  </li>
                  <li>Install the official {COMPANY_NAME} Customer app</li>
                  <li>Sign in with the email &amp; password we sent you</li>
                </ol>
                <a
                  href={CUSTOMER_APP_PLAY_SEARCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-800 font-bold text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Play Store Search
                </a>
                <p className="text-xs text-teal-100/80 mt-3">
                  App is publishing soon. If search shows no result yet, keep using this Track page online.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Customer;
