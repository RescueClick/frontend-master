import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Mail,
  CheckCircle2,
  ShieldCheck,
  FileText,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../feature/urldata";
import { getAuthData } from "../../utils/localStorage";

const formatInr = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

/**
 * Shared invoice preview/email for PAYOUT and INCENTIVE.
 * Company header (name/address/PAN/TAN/GST) always comes from ONE shared
 * /admin/payout-policy settings — not edited per invoice.
 */
export default function PartnerInvoiceModal({
  isOpen,
  onClose,
  record,
  policy = {},
  onSuccess,
  invoiceType = "PAYOUT", // PAYOUT | INCENTIVE
}) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [sharedPolicy, setSharedPolicy] = useState(policy || {});
  const isIncentive =
    String(invoiceType || record?.invoiceType || "PAYOUT").toUpperCase() ===
    "INCENTIVE";

  const getRecordId = () =>
    record?.payoutId ||
    record?.incentiveRecordId ||
    record?.id ||
    record?._id ||
    null;

  // Load ONE shared company invoice settings for payout + incentive
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const loadPolicy = async () => {
      try {
        const { adminToken } = getAuthData();
        const res = await axios.get(`${backendurl}/admin/payout-policy`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!cancelled && res?.data?.policy) {
          setSharedPolicy({ ...(policy || {}), ...res.data.policy });
        }
      } catch {
        if (!cancelled) setSharedPolicy(policy || {});
      }
    };
    if (policy && Object.keys(policy).length) {
      setSharedPolicy(policy);
    }
    loadPolicy();
    return () => {
      cancelled = true;
    };
  }, [isOpen, policy]);

  useEffect(() => {
    if (!record) return;
    const activePolicy = sharedPolicy || policy || {};

    const appr = Number(
      record.approvedAmount ||
        record.disbursedAmount ||
        record.requestedAmount ||
        0
    );
    const payoutAmt = Number(
      record.payoutAmount ?? record.netAmount ?? record.amount ?? 0
    );
    const storedGross = Number(record.grossAmount);
    const hasRealGross =
      record.grossAmount != null && !Number.isNaN(storedGross) && storedGross > 0;

    const gross = Number(
      hasRealGross
        ? storedGross
        : record.payoutPercentage && appr > 0
        ? (appr * Number(record.payoutPercentage)) / 100
        : payoutAmt || 0
    );

    const isTds =
      record.tdsApplicable !== undefined
        ? Boolean(record.tdsApplicable)
        : activePolicy.tdsApplicable !== false;

    const tdsSec = record.tdsSection || activePolicy.tdsSection || "194T";
    const tdsRate =
      record.tdsPercentage != null
        ? Number(record.tdsPercentage)
        : activePolicy.tdsPercentage != null
        ? Number(activePolicy.tdsPercentage)
        : 10;

    const storedTds = Number(record.tdsAmount);
    const hasRealTds =
      record.tdsAmount != null && !Number.isNaN(storedTds) && storedTds > 0;
    const tdsAmt = hasRealTds
      ? storedTds
      : isTds && gross > 0
      ? Number(((gross * tdsRate) / 100).toFixed(2))
      : 0;

    const storedNet = Number(record.netAmount);
    const hasRealNet =
      record.netAmount != null && !Number.isNaN(storedNet) && storedNet > 0;
    const netAmt = hasRealNet
      ? storedNet
      : payoutAmt > 0
      ? payoutAmt
      : Number(Math.max(0, gross - tdsAmt).toFixed(2));

    const computedPct =
      record.payoutPercentage != null
        ? Number(record.payoutPercentage)
        : appr > 0 && gross > 0 && !isIncentive
        ? Number(((gross / appr) * 100).toFixed(2))
        : 0;

    const periodLabel =
      record.periodLabel ||
      (record.month && record.year
        ? new Date(record.year, record.month - 1).toLocaleString("en-IN", {
            month: "short",
            year: "numeric",
          })
        : "");

    const appNo =
      record.appNo ||
      (isIncentive
        ? `INC-${record.year || ""}-${String(record.month || "").padStart(2, "0")}-${
            record.partnerEmployeeId || record.partner?.employeeId || "PARTNER"
          }`.toUpperCase()
        : record.applicationId
        ? `TLF${String(record.applicationId).slice(-4).toUpperCase()}`
        : "APP");

    const defaultInvNo =
      record.invoiceNumber ||
      `${isIncentive ? "INV-IN" : "INV-PO"}-${new Date().getFullYear()}-${appNo}-${String(
        record.payoutId ||
          record.incentiveRecordId ||
          record._id ||
          Math.floor(1000 + Math.random() * 9000)
      )
        .slice(-4)
        .toUpperCase()}`;

    const invDate = record.invoiceDate
      ? new Date(record.invoiceDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

    setInvoiceDetails({
      appNo,
      customerName: isIncentive
        ? record.tier || record.customerName || "Milestone Bonus"
        : record.customerName || "Customer",
      loanType: isIncentive
        ? periodLabel || "Monthly Milestone Incentive"
        : record.loanType || "Personal Loan",
      approvedAmount: appr,
      grossAmount: gross,
      payoutPercentage: computedPct,
      tdsApplicable: isTds,
      tdsSection: tdsSec,
      tdsPercentage: tdsRate,
      tdsAmount: tdsAmt,
      netAmount: netAmt,
      invoiceNumber: defaultInvNo,
      invoiceDate: invDate,
      utrNumber:
        record.payoutNote || record.note || record.utrNumber || record.notes || "",
      note: record.payoutNote || record.note || record.utrNumber || record.notes || "",
      partnerName:
        record.partner?.name ||
        `${record.partner?.firstName || ""} ${record.partner?.lastName || ""}`.trim() ||
        record.partnerName ||
        "Channel Partner",
      partnerEmployeeId:
        record.partner?.employeeId ||
        record.partner?.partnerCode ||
        record.partnerEmployeeId ||
        "—",
      partnerPan:
        record.partner?.panNumber ||
        record.partner?.panCard ||
        record.partnerPan ||
        "ON FILE",
      partnerPhone: record.partner?.phone || record.partnerPhone || "—",
      partnerEmail: record.partner?.email || record.partnerEmail || "—",
      bankName:
        record.partner?.bankName || record.partnerBankName || "Registered Partner Bank",
      accountNumber:
        record.partner?.accountNumber || record.partnerAccountNumber || "",
      ifscCode: record.partner?.ifscCode || record.partnerIfscCode || "",
      invoiceSentAt: record.invoiceSentAt || null,
      invoiceSentTo: record.invoiceSentTo || record.partner?.email || null,
      invoiceNotes:
        record.invoiceNotes ||
        activePolicy.invoiceNotes ||
        "Tax has been deducted at source under Section 194T of the Income Tax Act, 1961. TDS Certificate (Form 16A) will be issued quarterly on TRACES portal.",
      periodLabel,
      tierLabel: record.tier || "Milestone",
      isIncentive,
    });
  }, [record, policy, sharedPolicy, isIncentive]);

  useEffect(() => {
    if (!isOpen) setIsSendingEmail(false);
  }, [isOpen]);

  if (!isOpen || !invoiceDetails) return null;

  const handlePrint = () => window.print();

  const handleSendInvoiceEmail = async () => {
    const recordId = getRecordId();
    if (!recordId) {
      toast.error(
        isIncentive
          ? "Please settle/save the incentive first before sending invoice email."
          : "Please save the payout first before sending invoice email."
      );
      return;
    }
    if (!invoiceDetails.partnerEmail || invoiceDetails.partnerEmail === "—") {
      toast.error("Partner has no registered email address.");
      return;
    }

    try {
      setIsSendingEmail(true);
      const { adminToken } = getAuthData();
      const endpoint = isIncentive
        ? `${backendurl}/admin/incentives/${recordId}/send-invoice`
        : `${backendurl}/admin/payouts/${recordId}/send-invoice`;
      const res = await axios.post(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(
        res?.data?.message || `Invoice email sent to ${invoiceDetails.partnerEmail}`
      );
      setInvoiceDetails((prev) => ({
        ...prev,
        invoiceSentAt: new Date(),
        invoiceSentTo: invoiceDetails.partnerEmail,
      }));
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to send invoice email:", err);
      toast.error(
        err?.response?.data?.message || "Failed to send invoice email to partner"
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const activePolicy = sharedPolicy || policy || {};
  const company = {
    brandName: activePolicy.brandName || "DhanSource Capital",
    companyName: activePolicy.companyName || "DhanSource Capital Pvt Ltd",
    address:
      activePolicy.companyAddress ||
      "Office No -31, C Wing, Ashoka Nagar, Kharadi, Pune, Maharashtra 411014",
    gstin: activePolicy.companyGstin || "27AAACD1234F1Z5",
    pan: activePolicy.companyPan || "AAACD1234F",
    tan: activePolicy.companyTan || "MUMA12345E",
    email: activePolicy.companyEmail || "accounts@dhansourcecapital.com",
    phone: activePolicy.companyPhone || "+91 98765 43210",
  };

  const maskedAcc = invoiceDetails.accountNumber
    ? `XXXX-XXXX-${String(invoiceDetails.accountNumber).slice(-4)}`
    : "Registered Bank Account";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0; padding: 20px; box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>
                  {invoiceDetails.isIncentive
                    ? "Tax Invoice & Incentive Advice"
                    : "Tax Invoice & Settlement Advice"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                  Sec 194T Compliant
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {invoiceDetails.isIncentive
                  ? "Official Milestone Incentive Invoice for Partner"
                  : "Official Commission Payout Invoice for Partner"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              disabled={isSendingEmail}
              onClick={handleSendInvoiceEmail}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary hover:bg-[#0f9b82] text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSendingEmail ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Share via Email</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {invoiceDetails.invoiceSentAt && (
          <div className="no-print px-5 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Invoice emailed to{" "}
                <strong>{invoiceDetails.invoiceSentTo || invoiceDetails.partnerEmail}</strong>{" "}
                on {new Date(invoiceDetails.invoiceSentAt).toLocaleString("en-IN")}
              </span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">SENT</span>
          </div>
        )}

        <div className="overflow-y-auto p-5 sm:p-7 bg-white" id="printable-invoice">
          <div className="border-b-2 border-emerald-600 pb-5 mb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {company.brandName}
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {company.companyName}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-0.5 whitespace-pre-line">
                {company.address}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-600 font-mono">
                <span>
                  <strong>PAN:</strong> {company.pan}
                </span>
                <span>
                  <strong>TAN:</strong> {company.tan}
                </span>
                <span>
                  <strong>GSTIN:</strong> {company.gstin}
                </span>
              </div>
            </div>
            <div className="text-right sm:min-w-[200px]">
              <span className="inline-block px-3 py-1 bg-teal-800 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                {invoiceDetails.isIncentive
                  ? "Tax Invoice / Incentive Advice"
                  : "Tax Invoice / Payout Advice"}
              </span>
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Invoice Number
                </span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {invoiceDetails.invoiceNumber}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Invoice Date
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {invoiceDetails.invoiceDate}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 border-l-4 border-l-teal-600 rounded-lg p-3 mb-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Statutory TDS under Section 194T</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold uppercase tracking-wider">
                {invoiceDetails.tdsApplicable
                  ? `TDS U/S ${invoiceDetails.tdsSection} (${invoiceDetails.tdsPercentage}%) APPLIED`
                  : "TDS EXEMPTED"}
              </span>
            </div>
            <p className="text-[11px] text-teal-800 mt-1">
              TDS at {invoiceDetails.tdsPercentage}% on{" "}
              {invoiceDetails.isIncentive ? "incentive / bonus" : "commission"} payments.
              Form 16A issued quarterly on TRACES.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
                Beneficiary / Channel Partner
              </span>
              <p className="text-sm font-bold text-slate-900">{invoiceDetails.partnerName}</p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                <strong>Partner ID:</strong> {invoiceDetails.partnerEmployeeId}
              </p>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[11px] font-bold">
                  PAN: {invoiceDetails.partnerPan}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1.5">
                <strong>Email:</strong> {invoiceDetails.partnerEmail}
              </p>
              <p className="text-slate-500 text-[11px]">
                <strong>Mobile:</strong> {invoiceDetails.partnerPhone}
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
                  Bank Settlement Details
                </span>
                <p className="text-xs font-bold text-slate-800">{invoiceDetails.bankName}</p>
                <p className="text-slate-600 text-[11px] font-mono mt-0.5">
                  <strong>Account:</strong> {maskedAcc}
                </p>
                {invoiceDetails.ifscCode && (
                  <p className="text-slate-600 text-[11px] font-mono">
                    <strong>IFSC:</strong> {invoiceDetails.ifscCode}
                  </p>
                )}
                {invoiceDetails.utrNumber && (
                  <p className="text-teal-700 font-mono text-[11px] font-bold mt-1">
                    <strong>UTR / Ref:</strong> {invoiceDetails.utrNumber}
                  </p>
                )}
              </div>
              <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Disbursed &amp; Settled via Bank Transfer</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              {invoiceDetails.isIncentive
                ? "Milestone Incentive Particulars"
                : "Disbursed Loan Particulars"}
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">
                    {invoiceDetails.isIncentive ? "Period / Ref #" : "Loan App #"}
                  </th>
                  <th className="px-4 py-2">
                    {invoiceDetails.isIncentive ? "Milestone / Tier" : "Customer"}
                  </th>
                  <th className="px-4 py-2">
                    {invoiceDetails.isIncentive ? "Incentive Type" : "Loan Product"}
                  </th>
                  <th className="px-4 py-2 text-right">
                    {invoiceDetails.isIncentive ? "Disbursed Volume" : "Disbursed Amount"}
                  </th>
                  <th className="px-4 py-2 text-right">
                    {invoiceDetails.isIncentive ? "Bonus Basis" : "Agreed Commission"}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                    #{invoiceDetails.appNo}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                    {invoiceDetails.customerName}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{invoiceDetails.loanType}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                    {formatInr(invoiceDetails.approvedAmount)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-teal-700">
                    {invoiceDetails.isIncentive
                      ? invoiceDetails.tierLabel || "Flat Bonus"
                      : invoiceDetails.payoutPercentage
                      ? `${invoiceDetails.payoutPercentage}%`
                      : "Flat Commission"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden mb-5">
            <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center text-xs font-bold">
              <span>
                {invoiceDetails.isIncentive
                  ? "INCENTIVE BONUS & TDS SECTION 194T STATEMENT"
                  : "COMMISSION & TDS SECTION 194T STATEMENT"}
              </span>
              <span className="font-mono text-teal-300">INCOME TAX COMPLIANCE</span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-100 bg-white">
                  <td className="px-4 py-2.5 text-slate-700 font-medium">
                    {invoiceDetails.isIncentive
                      ? "1. Gross Incentive Bonus (Before Tax Deduction)"
                      : "1. Gross Commission Amount (Before Tax Deduction)"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900 text-sm">
                    {formatInr(invoiceDetails.grossAmount)}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 bg-red-50/50">
                  <td className="px-4 py-2.5 text-red-700">
                    <span className="font-bold">
                      2. Less: TDS Deducted u/s {invoiceDetails.tdsSection || "194T"} (@{" "}
                      {invoiceDetails.tdsPercentage}%)
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-red-600 text-sm">
                    {invoiceDetails.tdsApplicable && invoiceDetails.tdsAmount > 0
                      ? `(-) ${formatInr(invoiceDetails.tdsAmount)}`
                      : "₹0.00"}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 bg-white">
                  <td className="px-4 py-2 text-slate-500 text-[11px]">
                    3. Other Statutory Taxes / GST
                  </td>
                  <td className="px-4 py-2 text-right text-slate-500 text-[11px]">₹0.00</td>
                </tr>
                <tr className="bg-emerald-50">
                  <td className="px-4 py-3 font-black text-emerald-900 text-sm">
                    {invoiceDetails.isIncentive
                      ? "NET INCENTIVE TRANSFERRED TO PARTNER BANK"
                      : "NET AMOUNT TRANSFERRED TO PARTNER BANK"}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 text-lg">
                    {formatInr(invoiceDetails.netAmount || invoiceDetails.grossAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {invoiceDetails.invoiceNotes && (
            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
              {invoiceDetails.invoiceNotes}
            </p>
          )}

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between gap-1">
            <span>
              Support: {company.email} · {company.phone}
            </span>
            <span>Computer-generated advice. Authorized by DhanSource Capital Accounts Dept.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
