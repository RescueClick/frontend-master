import React, { useEffect, useState } from "react";
import { Settings, X, RotateCw, FileText } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { backendurl } from "../../feature/urldata";
import { getAuthData } from "../../utils/localStorage";

const DEFAULT_POLICY = {
  companyName: "DhanSource Capital Pvt Ltd",
  companyAddress:
    "Office No -31, C Wing, Ashoka Nagar, Kharadi, Pune, Maharashtra 411014",
  companyGstin: "27AAACD1234F1Z5",
  companyPan: "AAACD1234F",
  companyTan: "MUMA12345E",
  tdsApplicable: true,
  tdsSection: "194T",
  tdsPercentage: 10,
  invoiceNotes:
    "Tax has been deducted at source under Section 194T of the Income Tax Act, 1961. TDS certificate (Form 16A) will be issued quarterly on TRACES portal.",
};

/**
 * ONE shared invoice company settings for BOTH payout + incentive invoices.
 * Saves to /admin/payout-policy — used everywhere invoices are printed/emailed.
 */
export default function InvoiceSettingsModal({
  isOpen,
  onClose,
  onSaved,
  initialPolicy = null,
}) {
  const [form, setForm] = useState(DEFAULT_POLICY);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      if (initialPolicy && Object.keys(initialPolicy).length) {
        setForm((prev) => ({ ...prev, ...initialPolicy }));
        return;
      }
      try {
        setIsLoading(true);
        const { adminToken } = getAuthData();
        const res = await axios.get(`${backendurl}/admin/payout-policy`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res?.data?.policy) {
          setForm((prev) => ({ ...prev, ...res.data.policy }));
        }
      } catch (err) {
        console.error("Failed to load invoice settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isOpen, initialPolicy]);

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setIsSaving(true);
      const { adminToken } = getAuthData();

      // Only send invoice/company/TDS fields — never overwrite commission rates
      const invoiceOnly = {
        companyName: form.companyName,
        companyAddress: form.companyAddress,
        companyGstin: form.companyGstin,
        companyPan: form.companyPan,
        companyTan: form.companyTan,
        companyEmail: form.companyEmail,
        companyPhone: form.companyPhone,
        tdsApplicable: form.tdsApplicable,
        tdsSection: form.tdsSection || "194T",
        tdsPercentage: form.tdsPercentage,
        invoiceNotes: form.invoiceNotes,
      };

      const res = await axios.put(
        `${backendurl}/admin/payout-policy`,
        { policy: invoiceOnly },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(
        res?.data?.message ||
          "Invoice settings saved — applies to all payout & incentive invoices"
      );
      if (onSaved) onSaved(res?.data?.policy || { ...form, ...invoiceOnly });
      onClose?.();
    } catch (err) {
      console.error("Failed to save invoice settings:", err);
      toast.error(err?.response?.data?.message || "Failed to save invoice settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-primary/20 text-brand-primary">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Invoice Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Company + TDS for all payout &amp; incentive invoices (not commission %)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-3.5">
          {isLoading ? (
            <div className="py-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin" />
              Loading settings...
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-[11px] text-teal-900">
                <strong>Payout invoices</strong> (commission) and{" "}
                <strong>Incentive invoices</strong> (milestone bonus) stay different
                documents — but company name, address, PAN/TAN/GSTIN and statutory notes
                come from this single settings panel.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, companyName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Company Address (printed on every invoice)
                </label>
                <textarea
                  rows={3}
                  value={form.companyAddress || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, companyAddress: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    PAN
                  </label>
                  <input
                    type="text"
                    value={form.companyPan || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, companyPan: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    TAN
                  </label>
                  <input
                    type="text"
                    value={form.companyTan || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, companyTan: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={form.companyGstin || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, companyGstin: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={form.tdsApplicable !== false}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tdsApplicable: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                  />
                  Default TDS On
                </label>
                <select
                  value={form.tdsSection || "194T"}
                  onChange={(e) => {
                    const sec = e.target.value;
                    let rate = form.tdsPercentage;
                    if (sec === "194T") rate = 10;
                    else if (sec === "194H") rate = 5;
                    setForm((p) => ({
                      ...p,
                      tdsSection: sec,
                      tdsPercentage: rate,
                    }));
                  }}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                >
                  <option value="194T">Sec 194T (10%)</option>
                  <option value="194H">Sec 194H (5%)</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Default TDS Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.tdsPercentage ?? 10}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tdsPercentage: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Statutory Note (footer on all invoices)
                </label>
                <textarea
                  rows={3}
                  value={form.invoiceNotes || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, invoiceNotes: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-primary hover:bg-[#0f9b82] shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="w-3.5 h-3.5" />
                  Save for All Invoices
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
