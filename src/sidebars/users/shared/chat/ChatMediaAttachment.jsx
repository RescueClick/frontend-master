import React, { useState } from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { backendOrigin } from "../../../../feature/urldata";
import { chatService } from "./chatService";

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

/** Image / PDF / file attachment with View + Download actions */
export default function ChatMediaAttachment({ att, compact = false }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const url = resolveMediaUrl(att?.url);
  const rawUrl = att?.url || "";
  const name = att?.name || (isImageAttachment(att) ? "image.jpg" : "Document.pdf");
  const isImg = isImageAttachment(att);

  const onDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rawUrl || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      // Always go through API so browser saves the file (not open-as-view)
      await chatService.downloadAttachment(rawUrl, name);
    } catch (err) {
      console.error("Chat attachment download failed:", err);
      setDownloadError("Download failed");
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
        {downloadError ? (
          <p className="absolute left-1.5 bottom-1.5 text-[10px] text-rose-100 bg-rose-700/80 px-1.5 py-0.5 rounded">
            {downloadError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
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
      {downloadError ? <p className="text-[10px] text-rose-600 px-1">{downloadError}</p> : null}
    </div>
  );
}
