import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link2, Loader2, Save } from "lucide-react";
import { fetchPartners } from "../../../feature/thunks/adminThunks";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { clearPublicDefaultPartnerReferralCache } from "../../../feature/publicLoanReferral";

export default function AdminPublicLoanReferral() {
  const dispatch = useDispatch();
  const { data: partners, loading: partnersLoading } = useSelector(
    (s) => s.admin.partners
  );

  const [current, setCurrent] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchPartners());
  }, [dispatch]);

  useEffect(() => {
    const load = async () => {
      try {
        const { adminToken } = getAuthData();
        const { data } = await axios.get(
          `${backendurl}/admin/public-loan-default-partner`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        setCurrent(data);
        if (data?.partnerId) setSelectedId(String(data.partnerId));
      } catch (e) {
        toast.error(e.response?.data?.message || "Could not load current setting");
      } finally {
        setLoadingCurrent(false);
      }
    };
    load();
  }, []);

  const selectablePartners = useMemo(() => {
    const list = Array.isArray(partners) ? partners : [];
    return list
      .filter((p) => p.status === "ACTIVE" && p.partnerCode)
      .map((p) => ({
        id: String(p._id),
        code: p.partnerCode,
        label: `${p.firstName || ""} ${p.lastName || ""} (${p.partnerCode})`.trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [partners]);

  const handleSave = async () => {
    if (!selectedId) {
      toast.error("Select a partner from the list");
      return;
    }
    setSaving(true);
    try {
      const { adminToken } = getAuthData();
      const { data } = await axios.put(
        `${backendurl}/admin/public-loan-default-partner`,
        { partnerId: selectedId },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setCurrent({
        partnerId: data.partnerId,
        partnerCode: data.partnerCode,
        partnerName: data.partnerName,
        partnerStatus: "ACTIVE",
        fallbackUsed: false,
      });
      clearPublicDefaultPartnerReferralCache();
      toast.success(data.message || "Saved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <Link2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Public loan referral
          </h1>
          <p className="mt-1 text-slate-600">
            Choose which partner&apos;s <span className="font-medium">partner code</span> is
            shown as the default on public loan applications (website apply flows). Customers can
            still enter a different code.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loadingCurrent ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading current setting…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
              <p className="font-medium text-slate-800">Currently configured</p>
              <p className="mt-1 text-slate-600">
                Code:{" "}
                <span className="font-mono font-semibold text-slate-900">
                  {current?.partnerCode || "—"}
                </span>
                {current?.partnerName ? (
                  <span className="ml-2">· {current.partnerName}</span>
                ) : null}
              </p>
            </div>

            <div>
              <label
                htmlFor="public-loan-partner-select"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Default partner (must be active and have a partner code)
              </label>
              <select
                id="public-loan-partner-select"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={partnersLoading}
              >
                <option value="">— Select partner —</option>
                {selectablePartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              {selectablePartners.length === 0 && !partnersLoading && (
                <p className="mt-2 text-sm text-amber-700">
                  No active partners with a partner code found. Approve partners and ensure they
                  have codes first.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedId}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save default referral partner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
