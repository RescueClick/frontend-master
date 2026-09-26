import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { QRCode } from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Loader2,
  QrCode,
  Plus,
  RefreshCw,
  Link2,
  Unlink,
  Ban,
  Printer,
  Download,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPartners } from "../../../feature/thunks/adminThunks";
import { getAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";
import { PARTNER_CHANNEL_TYPES } from "../../../utils/partnerChannelTypes";
import { INDIAN_STATES } from "../../../utils/indianStates";
import { citiesForState } from "../../../utils/indianCities";

function downloadStickersExcel(stickers, filename) {
  const rows = (stickers || []).map((s) => ({
    Serial: s.serial,
    "QR URL (encode this in QR)": s.scanUrl,
    Status: s.status || "UNASSIGNED",
    Channel: s.channelHint || "",
    BatchId: s.batchId || "",
    Region: s.region || "",
    City: s.city || "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "QR Stickers");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename
  );
}

export default function AdminQrInventory() {
  const dispatch = useDispatch();
  const { data: partners } = useSelector((s) => s.admin.partners);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rows, setRows] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    channelHint: "",
    search: "",
    batchId: "",
  });

  const [genForm, setGenForm] = useState({
    count: 1000,
    prefix: "DSQR",
    channelHint: "RICKSHAW",
    region: "Maharashtra",
    city: "",
  });

  const [seriesInfo, setSeriesInfo] = useState(null);
  const [lastBatchMeta, setLastBatchMeta] = useState(null);
  const [assignSerial, setAssignSerial] = useState(null);
  const [assignPartnerId, setAssignPartnerId] = useState("");
  const [printBatch, setPrintBatch] = useState(null);

  const cityOptions = useMemo(
    () => citiesForState(genForm.region, genForm.city),
    [genForm.region, genForm.city]
  );

  const selectablePartners = useMemo(() => {
    const list = Array.isArray(partners) ? partners : [];
    return list
      .filter((p) => p.partnerCode)
      .map((p) => ({
        id: String(p._id),
        label: `${p.firstName || ""} ${p.lastName || ""} (${p.partnerCode})${
          p.partnerChannelType ? ` · ${p.partnerChannelType}` : ""
        }`.trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [partners]);

  const authHeaders = () => {
    const { adminToken } = getAuthData();
    return { Authorization: `Bearer ${adminToken}` };
  };

  const loadSeries = useCallback(async (prefix) => {
    try {
      const { data } = await axios.get(`${backendurl}/admin/qr-stickers/next-serial`, {
        headers: authHeaders(),
        params: { prefix: prefix || "DSQR" },
      });
      setSeriesInfo(data);
    } catch {
      setSeriesInfo(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 40 };
      if (filters.status) params.status = filters.status;
      if (filters.channelHint) params.channelHint = filters.channelHint;
      if (filters.search) params.search = filters.search;
      if (filters.batchId) params.batchId = filters.batchId;
      const { data } = await axios.get(`${backendurl}/admin/qr-stickers`, {
        headers: authHeaders(),
        params,
      });
      setRows(data.stickers || []);
      setTotal(data.total || 0);
      setStatusCounts(data.statusCounts || {});
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load QR inventory");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    dispatch(fetchPartners());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadSeries(genForm.prefix);
  }, [genForm.prefix, loadSeries]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    const count = Number(genForm.count);
    if (!count || count < 1) {
      toast.error("Enter how many QRs to generate (e.g. 1000)");
      return;
    }
    if (count > 20000) {
      toast.error("Max 20,000 per generate. Run again to continue the series.");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await axios.post(
        `${backendurl}/admin/qr-stickers/generate`,
        {
          count,
          prefix: genForm.prefix,
          channelHint: genForm.channelHint || undefined,
          region: genForm.region || undefined,
          city: genForm.city || undefined,
        },
        { headers: authHeaders() }
      );
      toast.success(data.message || "Generated");
      // Only keep QR preview for small batches (browser can't render 3000 QR images)
      setPrintBatch(count <= 100 ? data.stickers || [] : null);
      setLastBatchMeta({
        batchId: data.batchId,
        firstSerial: data.firstSerial,
        lastSerial: data.lastSerial,
        count: data.count,
        nextSerialAfterThis: data.nextSerialAfterThis,
      });
      setFilters((f) => ({ ...f, batchId: data.batchId || "" }));
      setPage(1);
      await load();
      await loadSeries(genForm.prefix);
      downloadStickersExcel(
        data.stickers,
        `DhanSource-QR-${data.firstSerial}-to-${data.lastSerial}.xlsx`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleRedownloadBatch = async () => {
    const batchId = lastBatchMeta?.batchId || filters.batchId;
    if (!batchId) {
      toast.error("Generate a batch first, or enter Batch ID in filters");
      return;
    }
    try {
      const { data } = await axios.get(`${backendurl}/admin/qr-stickers/export`, {
        headers: authHeaders(),
        params: { batchId },
      });
      if (!data.stickers?.length) {
        toast.error("No stickers in this batch");
        return;
      }
      if (data.stickers.length <= 100) setPrintBatch(data.stickers);
      downloadStickersExcel(data.stickers, `DhanSource-QR-batch-${batchId}.xlsx`);
      toast.success(`Downloaded ${data.count} rows`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Download failed");
    }
  };

  const handleAssign = async () => {
    if (!assignSerial || !assignPartnerId) {
      toast.error("Select a partner");
      return;
    }
    try {
      const { data } = await axios.post(
        `${backendurl}/admin/qr-stickers/${encodeURIComponent(assignSerial)}/assign`,
        { partnerId: assignPartnerId },
        { headers: authHeaders() }
      );
      toast.success(data.message || "Assigned");
      setAssignSerial(null);
      setAssignPartnerId("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Assign failed");
    }
  };

  const handleUnassign = async (serial) => {
    if (!window.confirm(`Unassign QR ${serial}?`)) return;
    try {
      await axios.post(
        `${backendurl}/admin/qr-stickers/${encodeURIComponent(serial)}/unassign`,
        {},
        { headers: authHeaders() }
      );
      toast.success("Unassigned");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Unassign failed");
    }
  };

  const handleDisable = async (serial) => {
    if (!window.confirm(`Disable QR ${serial}? It cannot be scanned.`)) return;
    try {
      await axios.patch(
        `${backendurl}/admin/qr-stickers/${encodeURIComponent(serial)}`,
        { status: "DISABLED" },
        { headers: authHeaders() }
      );
      toast.success("Disabled");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Disable failed");
    }
  };

  const previewEnd =
    seriesInfo?.nextNum && Number(genForm.count) > 0
      ? Number(seriesInfo.nextNum) + Number(genForm.count) - 1
      : null;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-7 h-7 text-teal-700" />
              Partner QR Stickers
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate any count (1000 / 2000 / 3000…). Next generate always continues the last
              serial. Excel downloads for the print vendor automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              load();
              loadSeries(genForm.prefix);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-lg">
          {["UNASSIGNED", "ASSIGNED", "DISABLED"].map((s) => (
            <div key={s} className="rounded-xl bg-white border border-slate-200 p-3 text-center">
              <p className="text-xs font-medium text-slate-500">{s}</p>
              <p className="text-xl font-bold text-slate-900">{statusCounts[s] || 0}</p>
            </div>
          ))}
        </div>

        {seriesInfo && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
            <b>Series `{seriesInfo.prefix}`:</b>{" "}
            {seriesInfo.lastSerial ? (
              <>
                last printed <span className="font-mono font-bold">{seriesInfo.lastSerial}</span>
                {" → "}next starts at{" "}
                <span className="font-mono font-bold">{seriesInfo.nextSerial}</span>
                {" "}({seriesInfo.totalForPrefix} total in system)
              </>
            ) : (
              <>
                no stickers yet — first will be{" "}
                <span className="font-mono font-bold">{seriesInfo.nextSerial}</span>
              </>
            )}
          </div>
        )}

        <form
          onSubmit={handleGenerate}
          className="rounded-xl bg-white border border-slate-200 p-5 space-y-4"
        >
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Generate batch (continues last series)
          </h2>

          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2000, 3000, 5000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setGenForm((f) => ({ ...f, count: n }))}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  Number(genForm.count) === n
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {n.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Count (max 20,000)</label>
              <input
                type="number"
                min={1}
                max={20000}
                value={genForm.count}
                onChange={(e) => setGenForm((f) => ({ ...f, count: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Serial prefix</label>
              <input
                type="text"
                value={genForm.prefix}
                onChange={(e) =>
                  setGenForm((f) => ({
                    ...f,
                    prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Channel kit</label>
              <select
                value={genForm.channelHint}
                onChange={(e) => setGenForm((f) => ({ ...f, channelHint: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {PARTNER_CHANNEL_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">State</label>
              <select
                value={genForm.region}
                onChange={(e) =>
                  setGenForm((f) => ({ ...f, region: e.target.value, city: "" }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">City</label>
              <select
                value={genForm.city}
                onChange={(e) => setGenForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {seriesInfo?.nextSerial && previewEnd && (
            <p className="text-xs text-slate-600 font-mono">
              This run will create: {seriesInfo.nextSerial} → {genForm.prefix}
              {String(previewEnd).padStart(7, "0")}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate + download Excel
            </button>
            <button
              type="button"
              onClick={handleRedownloadBatch}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              <Download className="w-4 h-4" /> Re-download Excel
            </button>
          </div>

          {lastBatchMeta && (
            <p className="text-xs text-slate-500">
              Last batch <span className="font-mono">{lastBatchMeta.batchId}</span>:{" "}
              {lastBatchMeta.firstSerial} → {lastBatchMeta.lastSerial} ({lastBatchMeta.count}).
              Next generate starts at{" "}
              <span className="font-mono font-semibold">{lastBatchMeta.nextSerialAfterThis}</span>.
            </p>
          )}
        </form>

        {printBatch?.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print preview ({printBatch.length})
              </h2>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
              >
                Print / Save PDF
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {printBatch.map((s) => (
                <div
                  key={s.serial}
                  className="flex flex-col items-center border border-slate-200 rounded-lg p-3 break-inside-avoid"
                >
                  <QRCode value={s.scanUrl} size={120} />
                  <p className="mt-2 font-mono text-xs font-bold text-slate-900">{s.serial}</p>
                  <p className="text-[10px] text-slate-400 text-center break-all">{s.scanUrl}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {lastBatchMeta && Number(lastBatchMeta.count) > 100 && !printBatch && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Large batch ({lastBatchMeta.count}): use the downloaded <b>Excel</b> for the print
            vendor. On-screen QR preview is only for batches ≤ 100.
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-end">
          <input
            placeholder="Search serial…"
            value={filters.search}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, search: e.target.value }));
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, status: e.target.value }));
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All status</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <select
            value={filters.channelHint}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, channelHint: e.target.value }));
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All channels</option>
            {PARTNER_CHANNEL_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Batch ID"
            value={filters.batchId}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, batchId: e.target.value }));
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Serial</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3">Scan URL</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.serial} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono font-semibold">{r.serial}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          r.status === "ASSIGNED"
                            ? "bg-emerald-50 text-emerald-700"
                            : r.status === "DISABLED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{r.channelHint || "—"}</td>
                    <td className="px-4 py-3">
                      {r.partner ? (
                        <span className="text-xs">
                          {r.partner.name}
                          <br />
                          <span className="font-mono text-teal-700">{r.partner.partnerCode}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate text-xs text-slate-500">
                      <a
                        href={r.scanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-teal-700"
                      >
                        {r.scanUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.status === "UNASSIGNED" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignSerial(r.serial);
                              setAssignPartnerId("");
                            }}
                            className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800"
                          >
                            <Link2 className="w-3 h-3" /> Assign
                          </button>
                        )}
                        {r.status === "ASSIGNED" && (
                          <button
                            type="button"
                            onClick={() => handleUnassign(r.serial)}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
                          >
                            <Unlink className="w-3 h-3" /> Unassign
                          </button>
                        )}
                        {r.status !== "DISABLED" && (
                          <button
                            type="button"
                            onClick={() => handleDisable(r.serial)}
                            className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700"
                          >
                            <Ban className="w-3 h-3" /> Disable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      No stickers yet. Generate a batch above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {total > 40 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <span className="text-slate-500">
                Page {page} · {total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border px-3 py-1 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page * 40 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border px-3 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {assignSerial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-slate-900 mb-1">Assign {assignSerial}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Bind this sticker to a partner. Scans will open their share link.
            </p>
            <select
              value={assignPartnerId}
              onChange={(e) => setAssignPartnerId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
            >
              <option value="">Select partner</option>
              {selectablePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignSerial(null)}
                className="rounded-lg px-3 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
