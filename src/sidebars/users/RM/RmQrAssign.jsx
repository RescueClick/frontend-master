import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Link2,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
  Unlink,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPartners } from "../../../feature/thunks/rmThunks";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { partnerChannelLabel } from "../../../utils/partnerChannelTypes";

/**
 * Field RM: assign printed QR stickers to existing (or newly added) partners.
 * Partner-first for day-to-day; QR lookup when you have a sticker in hand.
 */
export default function RmQrAssign() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: partners, loading: partnersLoading } = useSelector(
    (s) => s.rm.partner || { data: null, loading: false }
  );

  const [mode, setMode] = useState("partner"); // partner | sticker
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [serialInput, setSerialInput] = useState("");
  const [lookup, setLookup] = useState(null);
  const [looking, setLooking] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [myStickers, setMyStickers] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const authHeaders = () => {
    const { rmToken, token } = getAuthData();
    return { Authorization: `Bearer ${rmToken || token}` };
  };

  const partnerList = useMemo(() => {
    const list = Array.isArray(partners) ? partners : [];
    return list
      .filter((p) => (p.status || "").toUpperCase() === "ACTIVE")
      .map((p) => ({
        id: String(p.id || p._id),
        name:
          p.name ||
          `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
          "Partner",
        code: p.partnerCode || p.employeeId || "—",
        channel: p.partnerChannelType || null,
        qr: p.assignedQrSerial || null,
        phone: p.phone || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [partners]);

  const filteredPartners = useMemo(() => {
    const q = partnerSearch.trim().toLowerCase();
    if (!q) return partnerList;
    return partnerList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.code).toLowerCase().includes(q) ||
        String(p.phone).includes(q) ||
        String(p.qr || "")
          .toLowerCase()
          .includes(q)
    );
  }, [partnerList, partnerSearch]);

  const selectedPartner = useMemo(
    () => partnerList.find((p) => p.id === partnerId) || null,
    [partnerList, partnerId]
  );

  const withoutQr = partnerList.filter((p) => !p.qr).length;
  const withQr = partnerList.length - withoutQr;

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

  const refreshAll = () => {
    dispatch(fetchPartners());
    loadMine();
  };

  const confirmReplace = (partner) => {
    if (!partner?.qr) return true;
    return window.confirm(
      `${partner.name} already has QR ${partner.qr}.\n\nReplace it with ${serialInput.trim().toUpperCase()}?`
    );
  };

  const handleAssign = async (targetPartnerId) => {
    const serial = serialInput.trim().toUpperCase();
    const pid = targetPartnerId || partnerId;
    if (!serial || !pid) {
      toast.error("Select a partner and enter the QR serial");
      return;
    }

    const partner = partnerList.find((p) => p.id === pid);
    if (partner && !confirmReplace(partner)) return;

    if (
      lookup?.status === "ASSIGNED" &&
      lookup.partner &&
      !lookup.partner.isMine
    ) {
      toast.error("This QR belongs to another RM’s partner");
      return;
    }

    if (
      lookup?.status === "ASSIGNED" &&
      lookup.partner?.isMine &&
      String(lookup.partner.id) !== String(pid)
    ) {
      const ok = window.confirm(
        `QR ${serial} is on ${lookup.partner.name}. Move it to ${partner?.name || "this partner"}?`
      );
      if (!ok) return;
    }

    setAssigning(true);
    try {
      const { data } = await axios.post(
        `${backendurl}/rm/qr-stickers/${encodeURIComponent(serial)}/assign`,
        { partnerId: pid },
        { headers: authHeaders() }
      );
      toast.success(data.message || "QR assigned");
      setLookup(null);
      setSerialInput("");
      setPartnerId("");
      setPartnerSearch("");
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

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
      if (data.status === "ASSIGNED" && data.partner?.isMine && data.partner?.id) {
        setPartnerId(String(data.partner.id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "QR not found");
      setLookup(null);
    } finally {
      setLooking(false);
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
      refreshAll();
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
              Give a printed QR to any existing partner — new or already in your team.
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

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg border border-slate-200 bg-white px-2 py-3">
            <p className="text-lg font-bold text-slate-900">{partnerList.length}</p>
            <p className="text-xs text-slate-500">Active partners</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-3">
            <p className="text-lg font-bold text-amber-800">{withoutQr}</p>
            <p className="text-xs text-amber-700">Need QR</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-3">
            <p className="text-lg font-bold text-emerald-800">{withQr}</p>
            <p className="text-xs text-emerald-700">Already have QR</p>
          </div>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("partner")}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "partner"
                ? "bg-teal-700 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" /> Existing partner
          </button>
          <button
            type="button"
            onClick={() => setMode("sticker")}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "sticker"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <QrCode className="w-4 h-4" /> Sticker first
          </button>
        </div>

        {mode === "partner" && (
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Find existing partner
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  placeholder="Search name, code, phone, or QR…"
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-100">
              {partnersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                </div>
              ) : filteredPartners.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  No partners found. Add one first.
                </p>
              ) : (
                filteredPartners.map((p) => {
                  const selected = partnerId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPartnerId(p.id)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition ${
                        selected
                          ? "bg-teal-50 ring-1 ring-inset ring-teal-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {p.code}
                          {p.channel ? ` · ${partnerChannelLabel(p.channel)}` : ""}
                        </p>
                      </div>
                      {p.qr ? (
                        <span className="shrink-0 font-mono text-[11px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                          {p.qr}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-800">
                          No QR
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {selectedPartner && (
              <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedPartner.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {selectedPartner.code}
                      {selectedPartner.qr
                        ? ` · current QR ${selectedPartner.qr}`
                        : " · no QR yet — assign one below"}
                    </p>
                  </div>
                  {selectedPartner.qr && (
                    <button
                      type="button"
                      onClick={() => handleUnassign(selectedPartner.qr)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                    >
                      <Unlink className="w-3 h-3" /> Remove current
                    </button>
                  )}
                </div>

                <label className="text-sm font-medium text-slate-700">
                  Printed serial to {selectedPartner.qr ? "replace with" : "assign"}
                </label>
                <div className="flex gap-2">
                  <input
                    value={serialInput}
                    onChange={(e) =>
                      setSerialInput(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                      )
                    }
                    placeholder="DSQR0000042"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAssign(selectedPartner.id)}
                    disabled={assigning || !serialInput.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {assigning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {selectedPartner.qr ? "Replace QR" : "Assign QR"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "sticker" && (
          <>
            <form
              onSubmit={handleLookup}
              className="rounded-xl bg-white border border-slate-200 p-5 space-y-3"
            >
              <label className="text-sm font-semibold text-slate-800">
                Printed QR serial
              </label>
              <div className="flex gap-2">
                <input
                  value={serialInput}
                  onChange={(e) =>
                    setSerialInput(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                    )
                  }
                  placeholder="DSQR0000042"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={looking}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {looking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Look up
                </button>
              </div>
            </form>

            {lookup && (
              <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="font-mono font-bold text-slate-900">
                    {lookup.serial}
                  </span>
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
                    Currently on{" "}
                    <b>{lookup.partner.name}</b> ({lookup.partner.partnerCode})
                    {lookup.partner.isMine
                      ? " — your partner (you can move it)"
                      : " — another RM’s partner (locked)"}
                  </p>
                )}

                {(lookup.status === "UNASSIGNED" ||
                  (lookup.status === "ASSIGNED" && lookup.partner?.isMine)) && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Assign to existing partner
                      </label>
                      <select
                        value={partnerId}
                        onChange={(e) => setPartnerId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        disabled={partnersLoading}
                      >
                        <option value="">Select partner</option>
                        {partnerList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                            {p.qr ? ` · has ${p.qr}` : " · no QR"}
                          </option>
                        ))}
                      </select>
                      {partnerList.length === 0 && (
                        <p className="mt-2 text-xs text-amber-700">
                          No active partners. Add a partner first.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssign(partnerId)}
                      disabled={assigning || !partnerId}
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {assigning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                      {selectedPartner?.qr ? "Replace / Assign" : "Assign QR"}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              QRs assigned to my partners
            </h2>
            <button
              type="button"
              onClick={refreshAll}
              className="p-2 text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {listLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : myStickers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              No assigned QRs yet
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {myStickers.map((s) => (
                <li
                  key={s.serial}
                  className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
                >
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
