import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Mail,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  ShieldCheck,
  FileText,
  IndianRupee,
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

export default function PartnerInvoiceModal({
  isOpen,
  onClose,
  record,
  policy = {},
  onSuccess,
}) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);

  useEffect(() => {
    if (!record) return;

    const appr = Number(record.approvedAmount || record.requestedAmount || 0);
    const gross = Number(
      record.grossAmount ??
        (record.payoutPercentage && appr > 0
          ? (appr * Number(record.payoutPercentage)) / 100
          : record.payoutAmount || 0)
    );

    const isTds =
      record.tdsApplicable !== undefined
        ? Boolean(record.tdsApplicable)
        : policy.tdsApplicable !== false;

    const tdsSec = record.tdsSection || policy.tdsSection || "194T";
    const tdsRate =
      record.tdsPercentage != null
        ? Number(record.tdsPercentage)
        : policy.tdsPercentage != null
        ? Number(policy.tdsPercentage)
        : 10;

    const tdsAmt =
      record.tdsAmount != null
        ? Number(record.tdsAmount)
        : isTds && gross > 0
        ? Number(((gross * tdsRate) / 100).toFixed(2))
        : 0;

    const netAmt =
      record.netAmount != null
        ? Number(record.netAmount)
        : record.payoutAmount != null && record.grossAmount == null
        ? Number(record.payoutAmount)
        : Number(Math.max(0, gross - tdsAmt).toFixed(2));

    const computedPct =
      record.payoutPercentage != null
        ? Number(record.payoutPercentage)
        : appr > 0 && gross > 0
        ? Number(((gross / appr) * 100).toFixed(2))
        : 0;

    const appNo =
      record.appNo ||
      (record.applicationId
        ? `TLF${String(record.applicationId).slice(-4).toUpperCase()}`
        : "APP");

    const defaultInvNo =
      record.invoiceNumber ||
      `INV-PO-${new Date().getFullYear()}-${appNo}-${String(
        record.payoutId || record._id || Math.floor(1000 + Math.random() * 9000)
      ).slice(-4).toUpperCase()}`;

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
      customerName: record.customerName || "Customer",
      loanType: record.loanType || "Personal Loan",
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
      utrNumber: record.payoutNote || record.note || "",
      note: record.payoutNote || record.note || "",
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
        policy.invoiceNotes ||
        "Tax has been deducted at source under Section 194T of the Income Tax Act, 1961. TDS Certificate (Form 16A) will be issued quarterly on TRACES portal.",
    });
  }, [record, policy]);

  if (!isOpen || !invoiceDetails) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendInvoiceEmail = async () => {
    const payoutId = record?.payoutId || record?._id;
    if (!payoutId) {
      toast.error("Please save the payout first before sending invoice email.");
      return;
    }

    if (!invoiceDetails.partnerEmail || invoiceDetails.partnerEmail === "—") {
      toast.error("Partner has no registered email address.");
      return;
    }

    try {
      setIsSendingEmail(true);
      const { adminToken } = getAuthData();
      const res = await axios.post(
        `${backendurl}/admin/payouts/${payoutId}/send-invoice`,
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

  const company = {
    brandName: policy.brandName || "DhanSource Capital",
    companyName: policy.companyName || "DhanSource Capital Pvt Ltd",
    address:
      policy.companyAddress ||
      "Corporate Office: 402, Trade Avenue, Andheri East, Mumbai, Maharashtra - 400069",
    gstin: policy.companyGstin || "27AAACD1234F1Z5",
    pan: policy.companyPan || "AAACD1234F",
    tan: policy.companyTan || "MUMA12345E",
    email: policy.companyEmail || "accounts@dhansourcecapital.com",
    phone: policy.companyPhone || "+91 98765 43210",
  };

  const maskedAcc = invoiceDetails.accountNumber
    ? `XXXX-XXXX-${String(invoiceDetails.accountNumber).slice(-4)}`
    : "Registered Bank Account";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* TOP MODAL ACTION BAR */}
        <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tax Invoice &amp; Settlement Advice</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                  Sec 194T Compliant
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Commission Payout Invoice for Partner
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

        {/* NOTIFICATION STATUS STRIP (IF EMAILED) */}
        {invoiceDetails.invoiceSentAt && (
          <div className="no-print px-5 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Invoice emailed to{" "}
                <strong>{invoiceDetails.invoiceSentTo || invoiceDetails.partnerEmail}</strong> on{" "}
                {new Date(invoiceDetails.invoiceSentAt).toLocaleString("en-IN")}
              </span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">SENT</span>
          </div>
        )}

        {/* SCROLLABLE PRINTABLE INVOICE BODY */}
        <div className="overflow-y-auto p-5 sm:p-7 bg-white" id="printable-invoice">
          {/* HEADER SECTION */}
          <div className="border-b-2 border-emerald-600 pb-5 mb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {company.brandName}
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {company.companyName}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
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
                Tax Invoice / Payout Advice
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

          {/* SECTION 194T STATUTORY NOTICE BANNER */}
          <div className="bg-teal-50 border border-teal-200 border-l-4 border-l-teal-600 rounded-lg p-3 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Statutory TDS Deduction under Section 194T, Income Tax Act, 1961</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold uppercase tracking-wider">
                {invoiceDetails.tdsApplicable
                  ? `TDS U/S ${invoiceDetails.tdsSection} (${invoiceDetails.tdsPercentage}%) APPLIED`
                  : "TDS EXEMPTED"}
              </span>
            </div>
            <p className="text-[11px] text-teal-800 mt-1">
              TDS has been deducted at {invoiceDetails.tdsPercentage}% as per Section 194T of the Income Tax Act on commission payments made to partners. Form 16A will be generated quarterly on TRACES portal and will reflect in partner's Form 26AS / AIS.
            </p>
          </div>

          {/* TWO COLUMN PARTICULARS: Billed By & Beneficiary Partner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
            {/* Beneficiary Partner */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
                Beneficiary / Channel Partner
              </span>
              <p className="text-sm font-bold text-slate-900">
                {invoiceDetails.partnerName}
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                <strong>Partner ID:</strong> {invoiceDetails.partnerEmployeeId}
              </p>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[11px] font-bold">
                  <span>PAN:</span>
                  <span>{invoiceDetails.partnerPan}</span>
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1.5">
                <strong>Email:</strong> {invoiceDetails.partnerEmail}
              </p>
              <p className="text-slate-500 text-[11px]">
                <strong>Mobile:</strong> {invoiceDetails.partnerPhone}
              </p>
            </div>

            {/* Bank Settlement Account */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
                  Bank Settlement Details
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {invoiceDetails.bankName}
                </p>
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

          {/* APPLICATION & COMMISSION PARTICULARS TABLE */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Disbursed Loan Particulars
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">Loan App #</th>
                  <th className="px-4 py-2">Customer (Borrower)</th>
                  <th className="px-4 py-2">Loan Product</th>
                  <th className="px-4 py-2 text-right">Disbursed Amount</th>
                  <th className="px-4 py-2 text-right">Agreed Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                    #{invoiceDetails.appNo}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                    {invoiceDetails.customerName}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {invoiceDetails.loanType}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                    {formatInr(invoiceDetails.approvedAmount)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-teal-700">
                    {invoiceDetails.payoutPercentage
                      ? `${invoiceDetails.payoutPercentage}%`
                      : "Flat Commission"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* COMMISSION & SECTION 194T BREAKDOWN STATEMENT */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-5">
            <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center text-xs font-bold">
              <span>COMMISSION &amp; TDS SECTION 194T STATEMENT</span>
              <span className="font-mono text-teal-300">INCOME TAX COMPLIANCE</span>
            </div>

            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-100 bg-white">
                  <td className="px-4 py-2.5 text-slate-700 font-medium">
                    1. Gross Commission Amount (Before Tax Deduction)
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900 text-sm">
                    {formatInr(invoiceDetails.grossAmount)}
                  </td>
                </tr>

                <tr className="border-b border-slate-100 bg-red-50/50">
                  <td className="px-4 py-2.5 text-red-700">
                    <span className="font-bold">
                      2. Less: TDS Deducted u/s {invoiceDetails.tdsSection || "194T"} (@ {invoiceDetails.tdsPercentage}%)
                    </span>
                    <span className="block text-[10px] text-red-500 mt-0.5">
                      {invoiceDetails.tdsApplicable
                        ? `Credited to Central Govt. under PAN: ${invoiceDetails.partnerPan}`
                        : "Exempted / Not Applied"}
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
                  <td className="px-4 py-2 text-right text-slate-500 text-[11px]">
                    ₹0.00
                  </td>
                </tr>

                <tr className="bg-emerald-50">
                  <td className="px-4 py-3 font-black text-emerald-900 text-sm">
                    <span>NET AMOUNT TRANSFERRED TO PARTNER BANK</span>
                    <span className="block text-[10px] font-normal text-emerald-700 mt-0.5">
                      Credited via Direct Bank Transfer (NEFT/RTGS/IMPS)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 text-lg">
                    {formatInr(invoiceDetails.netAmount || invoiceDetails.grossAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* NOTES & STATUTORY DECLARATION */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] text-slate-600 space-y-1 mb-5">
            <span className="font-bold text-slate-800 uppercase block tracking-wider">
              Important Notes &amp; Statutory Disclaimer:
            </span>
            <p>
              • <strong>Section 194T of the Income Tax Act, 1961:</strong> TDS is deducted at 10% on remuneration, commission, or salary payable to partners of a firm.
            </p>
            <p>
              • <strong>Form 16A Certificate:</strong> The deducted amount will be deposited with the Income Tax Department and Form 16A will be generated quarterly on TRACES portal.
            </p>
            <p>
              • <strong>Credit Verification:</strong> Partners can view their tax credit under Form 26AS / AIS on the Income Tax Portal against PAN: <strong>{invoiceDetails.partnerPan}</strong>.
            </p>
            {invoiceDetails.invoiceNotes && (
              <p className="text-slate-700 font-medium pt-1">
                • <strong>Remarks:</strong> {invoiceDetails.invoiceNotes}
              </p>
            )}
          </div>

          {/* INVOICE FOOTER */}
          <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
            <div>
              Support Desk: <strong>{company.email}</strong> | {company.phone}
            </div>
            <div>
              Computer-generated advice. Authorized by DhanSource Capital Accounts Dept.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
