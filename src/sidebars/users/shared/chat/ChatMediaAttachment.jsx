import React, { useState } from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { backendOrigin } from "../../../../feature/urldata";

function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const origin = backendOrigin || "";
  if (url.startsWith("/")) return `${origin}${url}`;
  return `${origin}/${url}`;
}

function isImageAttachment(att) {
  return (
    att?.mimeType?.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif)$/i.test(att?.url || "") ||
    /\.(jpe?g|png|webp|gif)$/i.test(att?.name || "")
  );
}

async function downloadFile(url, filename = "download") {
  const fullUrl = resolveMediaUrl(url);
  try {
    const res = await fetch(fullUrl, { mode: "cors" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (_) {
    // Fallback: open in new tab (works even when CORS blocks blob download)
    const a = document.createElement("a");
    a.href = fullUrl;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

/** Image / PDF / file attachment with View + Download actions */
export default function ChatMediaAttachment({ att, compact = false }) {
  const [downloading, setDownloading] = useState(false);
  const url = resolveMediaUrl(att?.url);
  const name = att?.name || (isImageAttachment(att) ? "image.jpg" : "Document.pdf");
  const isImg = isImageAttachment(att);

  const onDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url || downloading) return;
    setDownloading(true);
    try {
      await downloadFile(url, name);
    } finally {
      setDownloading(false);
    }
  };

  if (isImg) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-black/10 bg-black/5 ${compact ? "" : ""}`}>
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={name}
            className={compact ? "max-h-44 w-full object-cover" : "max-h-60 w-full object-cover"}
          />
        </a>
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/65 text-white text-[10px] font-semibold hover:bg-black/80"
            title="Open"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-700 text-white text-[10px] font-semibold hover:bg-teal-800 disabled:opacity-60"
            title="Download"
          >
            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/5 text-[11px]">
      <FileText className="w-4 h-4 shrink-0 text-red-500" />
      <span className="truncate flex-1 font-medium">{name}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300"
        title="Open"
      >
        <ExternalLink className="w-3 h-3" />
        Open
      </a>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:opacity-60"
        title="Download"
      >
        {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        Download
      </button>
    </div>
  );
}
