import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link2, Loader2, QrCode, RefreshCw, Search, Unlink, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPartners } from "../../../feature/thunks/rmThunks";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { partnerChannelLabel } from "../../../utils/partnerChannelTypes";

/**
 * Field RM: look up a printed QR serial and assign it to one of their partners.
 * Admin generates/prints stickers; RM completes onboarding outside.
 */
export default function RmQrAssign() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: partners, loading: partnersLoading } = useSelector((s) => s.rm.partners);

  const [serialInput, setSerialInput] = useState("");
  const [lookup, setLookup] = useState(null);
  const [looking, setLooking] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [myStickers, setMyStickers] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const authHeaders = () => {
    const { rmToken, token } = getAuthData();
    return { Authorization: `Bearer ${rmToken || token}` };
  };

  const activePartners = useMemo(() => {
    const list = Array.isArray(partners) ? partners : [];
    return list
      .filter((p) => (p.status || "").toUpperCase() === "ACTIVE")
      .map((p) => ({
        id: String(p.id || p._id),
        label: `${p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim()} (${p.partnerCode || p.employeeId || "—"})`,
        channel: p.partnerChannelType,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [partners]);

  const loadMine = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await axios.get(`${backendurl}/rm/qr-stickers`, {
        headers: authHeaders(),
      });
      setMyStickers(data.stickers || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load assigned QRs");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchPartners());
    loadMine();
  }, [dispatch, loadMine]);

  const handleLookup = async (e) => {
    e?.preventDefault?.();
    const serial = serialInput.trim().toUpperCase();
    if (!serial) {
      toast.error("Enter the serial printed on the sticker");
      return;
    }
    setLooking(true);
    setLookup(null);
    try {
      const { data } = await axios.get(
        `${backendurl}/rm/qr-stickers/lookup/${encodeURIComponent(serial)}`,
        { headers: authHeaders() }
      );
      setLookup(data);
      setSerialInput(data.serial || serial);
    } catch (err) {
      toast.error(err.response?.data?.message || "QR not found");
      setLookup(null);
    } finally {
      setLooking(false);
    }
  };

  const handleAssign = async () => {
    if (!lookup?.serial || !partnerId) {
      toast.error("Look up QR and select a partner");
      return;
    }
    setAssigning(true);
    try {
      const { data } = await axios.post(
        `${backendurl}/rm/qr-stickers/${encodeURIComponent(lookup.serial)}/assign`,
        { partnerId },
        { headers: authHeaders() }
      );
      toast.success(data.message || "Assigned");
      setLookup(null);
      setPartnerId("");
      setSerialInput("");
      loadMine();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (serial) => {
    if (!window.confirm(`Unassign ${serial}?`)) return;
    try {
      await axios.post(
        `${backendurl}/rm/qr-stickers/${encodeURIComponent(serial)}/unassign`,
        {},
        { headers: authHeaders() }
      );
      toast.success("Unassigned");
      loadMine();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unassign failed");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "#F8FAFC" }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-7 h-7 text-teal-700" />
              Assign QR Sticker
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Field onboarding: register partner → activate → type printed serial → assign.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/rm/add-partner")}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
          >
            <UserPlus className="w-4 h-4" /> Add Partner
          </button>
        </div>

        <ol className="rounded-xl border border-teal-100 bg-teal-50/80 p-4 text-sm text-teal-900 space-y-1 list-decimal list-inside">
          <li>Partner registers (or you add them) and is <b>ACTIVE</b></li>
          <li>Enter serial from the sticker (e.g. DSQR0000042)</li>
          <li>Assign to that partner — customer scans → their share link</li>
        </ol>

        <form onSubmit={handleLookup} className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
          <label className="text-sm font-semibold text-slate-800">Printed QR serial</label>
          <div className="flex gap-2">
            <input
              value={serialInput}
              onChange={(e) =>
                setSerialInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
              }
              placeholder="DSQR0000042"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={looking}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Look up
            </button>
          </div>
        </form>

        {lookup && (
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="font-mono font-bold text-slate-900">{lookup.serial}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  lookup.status === "UNASSIGNED"
                    ? "bg-amber-50 text-amber-800"
                    : lookup.status === "ASSIGNED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                }`}
              >
                {lookup.status}
              </span>
              {lookup.channelHint && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {partnerChannelLabel(lookup.channelHint)}
                </span>
              )}
            </div>

            {lookup.status === "ASSIGNED" && lookup.partner && (
              <p className="text-sm text-slate-600">
                Already assigned to{" "}
                <b>{lookup.partner.name}</b> ({lookup.partner.partnerCode})
                {lookup.partner.isMine ? " — your partner" : " — another RM’s partner"}
              </p>
            )}

            {lookup.status === "UNASSIGNED" && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700">Assign to your partner</label>
                  <select
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    disabled={partnersLoading}
                  >
                    <option value="">Select ACTIVE partner</option>
                    {activePartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                        {p.channel ? ` · ${p.channel}` : ""}
                      </option>
                    ))}
                  </select>
                  {activePartners.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      No active partners. Add or activate a partner first.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning || !partnerId}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {assigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  Assign QR
                </button>
              </>
            )}
          </div>
        )}

        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">QRs assigned to my partners</h2>
            <button type="button" onClick={loadMine} className="p-2 text-slate-500 hover:text-slate-800">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {listLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : myStickers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No assigned QRs yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {myStickers.map((s) => (
                <li key={s.serial} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono font-semibold text-sm">{s.serial}</p>
                    <p className="text-xs text-slate-500">
                      {s.partner?.name} · {s.partner?.partnerCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnassign(s.serial)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                  >
                    <Unlink className="w-3 h-3" /> Unassign
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
