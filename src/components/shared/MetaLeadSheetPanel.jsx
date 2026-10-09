import React, { useMemo, useState } from "react";
import axios from "axios";
import { Download, Upload } from "lucide-react";
import { backendurl } from "../../feature/urldata";
import { getAuthData } from "../../utils/localStorage";
import { getLoanStatusLabel } from "../../utils/loanStatus";
import AppAntTable from "./AppAntTable";

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

async function readSheetFile(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let encoding = "utf-8";
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";
  return new TextDecoder(encoding).decode(buf);
}

export default function MetaLeadSheetPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [view, setView] = useState("notFilled");
  const [fileName, setFileName] = useState("");

  const visibleRows = useMemo(() => {
    const rows = result?.rows || [];
    if (view === "filled") return rows.filter((row) => row.filled);
    if (view === "notFilled") return rows.filter((row) => !row.filled);
    return rows;
  }, [result, view]);

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setError("");
    setLoading(true);
    try {
      const csvText = await readSheetFile(file);
      const auth = getAuthData();
      const token = auth.adminToken;
      const res = await axios.post(
        `${backendurl}/admin/meta-leads/check`,
        { csvText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setView("notFilled");
      setOpen(true);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Could not check this sheet.");
    } finally {
      setLoading(false);
    }
  };

  const downloadNotFilled = () => {
    const rows = (result?.rows || []).filter((row) => !row.filled);
    downloadCsv(
      `meta-leads-not-filled-${stamp()}.csv`,
      ["Name", "Contact Number", "Email", "City"],
      rows.map((row) => [row.name, row.phone, row.email, row.city])
    );
  };

  const downloadAll = () => {
    downloadCsv(
      `meta-leads-checked-${stamp()}.csv`,
      ["Name", "Contact Number", "Loan form", "App No", "Application status", "Email", "City"],
      (result?.rows || []).map((row) => [
        row.name,
        row.phone,
        row.filled ? "Filled" : "Not filled",
        row.appNo,
        row.filled ? getLoanStatusLabel(row.applicationStatus) : "",
        row.email,
        row.city,
      ])
    );
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Contact", dataIndex: "phone", key: "phone" },
    {
      title: "Loan form",
      key: "filled",
      render: (_, row) => (
        <span className={row.filled ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
          {row.filled ? "Filled" : "Not filled"}
        </span>
      ),
    },
    {
      title: "App No",
      key: "appNo",
      render: (_, row) => row.appNo || "—",
    },
    {
      title: "Status",
      key: "status",
      render: (_, row) => (row.filled ? getLoanStatusLabel(row.applicationStatus) : "—"),
    },
  ];

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Meta leads sheet</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload a Meta leads CSV. Numbers that already have a loan form are marked filled. Not filled stay at the top.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-white cursor-pointer bg-slate-900 hover:bg-slate-800">
            <Upload size={16} />
            {loading ? "Checking..." : "Upload sheet"}
            <input
              type="file"
              accept=".csv,.txt,.tsv,text/csv,text/plain"
              className="hidden"
              disabled={loading}
              onChange={onFile}
            />
          </label>
          {result && (
            <button type="button" onClick={() => setOpen((value) => !value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
              {open ? "Hide results" : "Show results"}
            </button>
          )}
        </div>
      </div>
      {fileName && <p className="mt-2 text-xs text-slate-500">{fileName}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {result && open && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {[
              ["notFilled", `Not filled (${result.notFilledCount})`],
              ["filled", `Filled (${result.filledCount})`],
              ["all", `All (${result.total})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                  view === key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
            <button type="button" onClick={downloadNotFilled} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50">
              <Download size={14} />
              Download not filled CSV
            </button>
            <button type="button" onClick={downloadAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50">
              <Download size={14} />
              Download all CSV
            </button>
          </div>
          <AppAntTable
            rowKey={(row) => `${row.phone}-${row.createdTime || ""}`}
            columns={columns}
            dataSource={visibleRows}
            size="small"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "No leads in this group" }}
          />
        </div>
      )}
    </div>
  );
}
