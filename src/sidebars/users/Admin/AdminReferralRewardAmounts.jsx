import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, IndianRupee, Loader2, Save } from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";

export default function AdminReferralRewardAmounts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disbursedReward, setDisbursedReward] = useState("");
  const [signupReward, setSignupReward] = useState("");
  const [savedInDatabase, setSavedInDatabase] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { adminToken } = getAuthData();
        const { data } = await axios.get(`${backendurl}/admin/referral-reward-amounts`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        setDisbursedReward(String(data.disbursedReward ?? ""));
        setSignupReward(String(data.signupReward ?? ""));
        setSavedInDatabase(!!data.savedInDatabase);
      } catch (e) {
        toast.error(e.response?.data?.message || "Could not load amounts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const d = Number(disbursedReward);
    const s = Number(signupReward);
    if (!Number.isFinite(d) || d <= 0) {
      toast.error("Disbursed amount must be a positive number");
      return;
    }
    if (!Number.isFinite(s) || s <= 0) {
      toast.error("Signup amount must be a positive number");
      return;
    }
    setSaving(true);
    try {
      const { adminToken } = getAuthData();
      const { data } = await axios.put(
        `${backendurl}/admin/referral-reward-amounts`,
        { disbursedReward: d, signupReward: s },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setSavedInDatabase(true);
      toast.success(data.message || "Saved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/admin/referral-rewards"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to referral rewards
        </Link>
      </div>
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 ring-1 ring-amber-100">
          <IndianRupee className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Referral reward amounts
          </h1>
          <p className="mt-1 text-slate-600">
            Super Admin sets how many <span className="font-medium">INR</span> are stored on new
            referral rows. <span className="font-medium">Disbursed</span> applies when a downline
            partner&apos;s loan is marked DISBURSED (partner→partner program).{" "}
            <span className="font-medium">Signup</span> applies only if legacy signup rewards are
            created (non-partner referrers).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-6">
            {!savedInDatabase ? (
              <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
                No values saved in the database yet — showing effective amounts from environment
                defaults (or <code className="text-xs">REFERRAL_DISBURSED_REWARD</code> /{" "}
                <code className="text-xs">REFERRAL_SIGNUP_REWARD</code>). Save below to lock amounts
                for Super Admin.
              </p>
            ) : null}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Disbursed referral reward (INR)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
                value={disbursedReward}
                onChange={(e) => setDisbursedReward(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Signup referral reward (INR)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900"
                value={signupReward}
                onChange={(e) => setSignupReward(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save amounts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
