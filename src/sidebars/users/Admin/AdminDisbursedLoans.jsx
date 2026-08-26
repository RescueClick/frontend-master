import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  IndianRupee,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Building2,
  User,
  Users,
  Search,
  Download,
  RotateCw,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import { downloadXlsx } from "../../../utils/downloadXlsx";
import AppAntTable from "../../../components/shared/AppAntTable";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getLoanTypeBadge = (type) => {
  const t = String(type || "").toUpperCase();
  if (t.includes("BUSINESS")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (t.includes("HOME")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (t.includes("PERSONAL")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const AdminDisbursedLoans = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const now = new Date();
  const [year, setYear] = useState(location.state?.year || "all");
  const [month, setMonth] = useState(location.state?.month || "all");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [payoutFilter, setPayoutFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalDisbursedVolume: 0,
    totalFilesCount: 0,
    averageTicketSize: 0,
    uniquePartnersCount: 0,
  });

  // Modal State for Full File Dossier
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDisbursedLoans = useCallback(async () => {
    try {
      setLoading(true);
      const { adminToken } = getAuthData();
      const res = await axios.get(`${backendurl}/admin/disbursed-loans`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          year: year || "all",
          month: month || "all",
          loanType: loanTypeFilter === "all" ? undefined : loanTypeFilter,
        },
      });

      if (res?.data) {
        setApplications(res.data.applications || []);
        if (res.data.summary) {
          setSummaryData(res.data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch disbursed loans:", err);
      toast.error(err?.response?.data?.message || "Failed to load disbursed loans");
    } finally {
      setLoading(false);
    }
  }, [year, month, loanTypeFilter]);

  useEffect(() => {
    fetchDisbursedLoans();
  }, [fetchDisbursedLoans]);

  // Client-side search and payout status filter
  const filteredRows = useMemo(() => {
    let rows = applications;

    if (payoutFilter !== "all") {
      rows = rows.filter((r) => r.payoutStatus === payoutFilter);
    }

    if (!searchTerm.trim()) return rows;
    const term = searchTerm.trim().toLowerCase();

    return rows.filter((r) => {
      const appNo = String(r.appNo || "").toLowerCase();
      const cName = String(r.customer?.fullName || "").toLowerCase();
      const cPhone = String(r.customer?.phone || "").toLowerCase();
      const cEmail = String(r.customer?.email || "").toLowerCase();
      const cPan = String(r.customer?.panNumber || "").toLowerCase();
      const pName = String(r.partner?.fullName || "").toLowerCase();
      const pCode = String(r.partner?.partnerCode || "").toLowerCase();
      const pEmp = String(r.partner?.employeeId || "").toLowerCase();
      const bank = String(r.bankName || "").toLowerCase();
      const rm = String(r.rm?.name || "").toLowerCase();
      const type = String(r.loanType || "").toLowerCase();

      return (
        appNo.includes(term) ||
        cName.includes(term) ||
        cPhone.includes(term) ||
        cEmail.includes(term) ||
        cPan.includes(term) ||
        pName.includes(term) ||
        pCode.includes(term) ||
        pEmp.includes(term) ||
        bank.includes(term) ||
        rm.includes(term) ||
        type.includes(term)
      );
    });
  }, [applications, payoutFilter, searchTerm]);

  // Handle Export to Excel
  const handleExportXlsx = () => {
    if (!filteredRows.length) {
      toast.error("No disbursed loans available to export");
      return;
    }

    const exportData = filteredRows.map((r, i) => ({
      "S.No": i + 1,
      "Application No": r.appNo,
      "Customer Name": r.customer?.fullName || "—",
      "Customer Phone": r.customer?.phone || "—",
      "Customer PAN": r.customer?.panNumber || "—",
      "Customer City": r.customer?.city || "—",
      "Loan Type": r.loanType || "—",
      "Disbursed Amount (₹)": Number(r.approvedLoanAmount || 0),
      "Disbursal Date": r.disbursedAt ? new Date(r.disbursedAt).toLocaleDateString("en-IN") : "—",
      "Lender Bank": r.bankName || "—",
      "Partner Name": r.partner?.fullName || "Direct / Company",
      "Partner Code": r.partner?.partnerCode || "—",
      "Partner Phone": r.partner?.phone || "—",
      "Assigned RM": r.rm?.name || "—",
      "Payout Status": r.payoutStatus || "PENDING",
      "Payout Amount (₹)": Number(r.payoutAmount || 0),
      "UTR / Reference": r.payoutNote || "—",
    }));

    downloadXlsx(exportData, `DhanSource-Disbursed-Loans-${year}-${month}.xlsx`, "Disbursed Loans");
    toast.success("Disbursed loan files exported to Excel!");
  };

  const handleOpenDossier = (record) => {
    setSelectedFile(record);
    setModalOpen(true);
  };

  const handleCloseDossier = () => {
    setModalOpen(false);
    setSelectedFile(null);
  };

  const columns = [
    {
      title: "Loan File / App No",
      key: "appNo",
      width: 170,
      render: (_, r) => (
        <div className="space-y-1">
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white shadow-sm inline-block">
            {r.appNo}
          </span>
          <div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLoanTypeBadge(r.loanType)}`}>
              {r.loanType?.replace(/_/g, " ")}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {r.disbursedAt ? new Date(r.disbursedAt).toLocaleDateString("en-IN") : "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Borrower (Customer)",
      key: "customer",
      width: 220,
      render: (_, r) => (
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            {getInitials(r.customer?.fullName)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-slate-900 truncate">
              {r.customer?.fullName}
            </p>
            <p className="text-[11px] text-slate-500">{r.customer?.phone}</p>
            {r.customer?.panNumber && r.customer.panNumber !== "—" && (
              <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 inline-block mt-0.5">
                PAN: {r.customer.panNumber}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Channel Partner (DSA)",
      key: "partner",
      width: 220,
      render: (_, r) => {
        if (!r.partner) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Direct / Company Web</span>
            </span>
          );
        }

        return (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              {getInitials(r.partner.fullName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {r.partner.fullName}
                </span>
                {r.partner.partnerCode && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200">
                    {r.partner.partnerCode}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block">{r.partner.phone}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Lender Bank",
      key: "bank",
      width: 160,
      render: (_, r) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">{r.bankName || "DhanSource Capital"}</span>
        </div>
      ),
    },
    {
      title: "Disbursed Loan Amount",
      key: "amount",
      width: 170,
      render: (_, r) => (
        <div>
          <div className="font-black text-sm text-emerald-700">
            {formatInr(r.approvedLoanAmount)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Requested: {formatInr(r.requestedAmount)}
          </span>
        </div>
      ),
    },
    {
      title: "Payout Status",
      key: "payoutStatus",
      width: 130,
      render: (_, r) => {
        const isPaid = r.payoutStatus === "DONE";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isPaid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>{isPaid ? "Payout Settled" : "Payout Pending"}</span>
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      align: "center",
      render: (_, r) => (
        <button
          type="button"
          onClick={() => handleOpenDossier(r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-primary hover:bg-[#0f9b82] text-white shadow-sm transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Dossier</span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Company Disbursed Loans Explorer
                </h1>
                <p className="text-xs text-slate-500">
                  Comprehensive audit master of all completed & disbursed loan files across partners and banks
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/payout")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Go to Payouts Hub →</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Disbursed Volume */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Disbursed Volume
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-emerald-700">
                {formatInr(summaryData.totalDisbursedVolume)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>{summaryData.totalFilesCount} Completed Files</span>
                <span className="font-bold text-emerald-600">
                  {month === "all" ? (year === "all" ? "All Time" : `Year ${year}`) : new Date(year === "all" ? 2000 : year, month - 1).toLocaleString("default", { month: "short", ...(year !== "all" ? { year: "numeric" } : {}) })}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Average Ticket Size */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Average Ticket Size
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <IndianRupee className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-slate-900">
                {formatInr(summaryData.averageTicketSize)}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Avg per disbursed loan file
              </div>
            </div>
          </div>

          {/* Card 3: Total Closed Files */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Closed & Disbursed Files
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <FileCheck className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-purple-700">
                {summaryData.totalFilesCount}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                100% Disbursed & Approved
              </div>
            </div>
          </div>

          {/* Card 4: Disbursing Partners */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Disbursing Partners
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-amber-700">
                {summaryData.uniquePartnersCount}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Partners with closed files
              </div>
            </div>
          </div>
        </div>

        {/* Master Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Integrated Toolbar */}
          <div className="p-4 border-b border-slate-100 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Left: Section Title & Count */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Disbursed Loan Files ({filteredRows.length})
                </h2>
              </div>

              {/* Right: Period & Type Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Year */}
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Years</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                {/* Month */}
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString("default", { month: "short" })}
                    </option>
                  ))}
                </select>

                {/* Loan Type */}
                <select
                  value={loanTypeFilter}
                  onChange={(e) => setLoanTypeFilter(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Loan Types</option>
                  <option value="PERSONAL">Personal Loan</option>
                  <option value="BUSINESS">Business Loan</option>
                  <option value="HOME_LOAN_SALARIED">Home Loan (Salaried)</option>
                  <option value="HOME_LOAN_SELF_EMPLOYED">Home Loan (Self-Employed)</option>
                </select>

                {/* Payout Status */}
                <select
                  value={payoutFilter}
                  onChange={(e) => setPayoutFilter(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Payout Status</option>
                  <option value="DONE">Settled / Paid</option>
                  <option value="PENDING">Payout Pending</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportXlsx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={fetchDisbursedLoans}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                  title="Refresh Data"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-primary" : ""}`} />
                </button>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by App No (TLF...), Customer Name, Phone, PAN, Partner Name, Partner Code (PT-...), RM, Bank..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Table */}
          <AppAntTable
            rowKey={(r) => String(r.id || r._id)}
            columns={columns}
            dataSource={filteredRows}
            loading={loading}
            size="middle"
          />
        </div>
      </div>

      {/* 2-Column File Dossier Modal */}
      {modalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                  {selectedFile.appNo}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Loan File Dossier</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      DISBURSED ✓
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Disbursed on {selectedFile.disbursedAt ? new Date(selectedFile.disbursedAt).toLocaleString("en-IN") : "—"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDossier}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2-Column Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-70px)] grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Column: Borrower & Loan Dossier */}
              <div className="md:col-span-6 space-y-4">
                {/* Borrower Profile Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Borrower Profile</span>
                    </span>
                    {selectedFile.customer?.employeeId && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        {selectedFile.customer.employeeId}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Full Name
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selectedFile.customer?.fullName}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Phone Number
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedFile.customer?.phone}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Email Address
                      </span>
                      <p className="font-medium text-slate-700 truncate mt-0.5" title={selectedFile.customer?.email}>
                        {selectedFile.customer?.email}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        PAN Number
                      </span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">
                        {selectedFile.customer?.panNumber || "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Employment / Income
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedFile.customer?.employmentType || "—"} · {formatInr(selectedFile.customer?.monthlyIncome)}/mo
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        City & Pincode
                      </span>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {selectedFile.customer?.city || "—"} {selectedFile.customer?.pincode ? `(${selectedFile.customer.pincode})` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loan & Bank Terms */}
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Loan Approval Terms</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLoanTypeBadge(selectedFile.loanType)}`}>
                      {selectedFile.loanType?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Approved Disbursed Amount
                      </span>
                      <p className="font-black text-base text-emerald-700 mt-0.5">
                        {formatInr(selectedFile.approvedLoanAmount)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Requested Amount
                      </span>
                      <p className="font-bold text-sm text-slate-700 mt-0.5">
                        {formatInr(selectedFile.requestedAmount)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Lender Bank
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selectedFile.bankName || "DhanSource Capital"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Payout Commission
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {formatInr(selectedFile.payoutAmount)} ({selectedFile.payoutStatus})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attribution: Partner & RM */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Source & Attribution
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Channel Partner</span>
                      <span className="font-bold text-slate-900">
                        {selectedFile.partner?.fullName || "Direct / Company Web"}
                      </span>
                      {selectedFile.partner?.partnerCode && (
                        <span className="ml-1.5 text-[10px] font-mono font-bold text-emerald-700">
                          ({selectedFile.partner.partnerCode})
                        </span>
                      )}
                    </div>

                    {selectedFile.rm && (
                      <div className="text-right">
                        <span className="text-slate-500 block text-[11px]">Assigned RM</span>
                        <span className="font-bold text-slate-900">{selectedFile.rm.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Uploaded Documents & Stage History */}
              <div className="md:col-span-6 space-y-4">
                {/* Uploaded Documents Dossier */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Uploaded KYC & Income Documents</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedFile.documents?.length || 0} Files
                    </span>
                  </div>

                  {selectedFile.documents && selectedFile.documents.length > 0 ? (
                    <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                      {selectedFile.documents.map((doc, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-800 block truncate">
                              {doc.docType?.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Status: <strong className="text-emerald-700">{doc.status || "VERIFIED"}</strong>
                            </span>
                          </div>

                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-brand-primary transition shrink-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No URL</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No document attachments linked.
                    </p>
                  )}
                </div>

                {/* Stage History */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Disbursement Stage History</span>
                  </span>

                  {selectedFile.stageHistory && selectedFile.stageHistory.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedFile.stageHistory.map((stg, sIdx) => (
                        <div key={sIdx} className="text-xs bg-white p-2 rounded-lg border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">
                              {stg.from ? `${stg.from} ➔ ` : ""}{stg.to}
                            </span>
                            {stg.note && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{stg.note}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {stg.at ? new Date(stg.at).toLocaleDateString("en-IN") : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      Direct disbursement logged.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Application ID: <strong className="font-mono text-slate-800">{selectedFile.id}</strong>
              </span>
              <button
                type="button"
                onClick={handleCloseDossier}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisbursedLoans;
