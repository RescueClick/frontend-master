import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, X, ExternalLink, FileText } from "lucide-react";

export default function DocumentPreviewModal({ url, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [detectedType, setDetectedType] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  // Normalize input: url can be string or { url, file, name, type }
  const previewData = useMemo(() => {
    if (!url) return null;
    if (typeof url === "object" && url.url) {
      return {
        url: url.url,
        name: url.name || url.file?.name || "Document Preview",
        type: url.type || url.file?.type || "",
      };
    }
    if (typeof url === "string") {
      return {
        url,
        name: "Document Preview",
        type: "",
      };
    }
    return null;
  }, [url]);

  const targetUrl = previewData?.url || "";
  const targetName = previewData?.name || "Document Preview";

  // Check if MIME type or extension indicates PDF
  const isDefinitelyPdf = useMemo(() => {
    if (!targetUrl) return false;
    if (previewData?.type?.includes("pdf")) return true;
    if (previewData?.name?.toLowerCase().endsWith(".pdf")) return true;
    if (/\.pdf($|\?)/i.test(targetUrl)) return true;
    if (detectedType?.includes("pdf")) return true;
    return false;
  }, [targetUrl, previewData, detectedType]);

  // If blob URL without known type, fetch local blob header to detect MIME type in 0ms
  useEffect(() => {
    setZoom(1);
    setImgFailed(false);
    setDetectedType(null);

    if (targetUrl.startsWith("blob:") && !previewData?.type) {
      fetch(targetUrl)
        .then((res) => res.blob())
        .then((blob) => {
          if (blob?.type) setDetectedType(blob.type);
        })
        .catch(() => {});
    }
  }, [targetUrl, previewData?.type]);

  if (!targetUrl) return null;

  const showAsPdf = isDefinitelyPdf || imgFailed;

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-teal-600 shrink-0" />
            <h3 className="truncate text-base font-semibold text-slate-800" title={targetName}>
              {targetName}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {!showAsPdf && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                  className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-slate-700">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                  className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Reset zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}

            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Open document in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors"
              title="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-4">
          <div className="flex min-h-full items-center justify-center">
            {showAsPdf ? (
              <iframe
                src={targetUrl}
                title={targetName}
                className="h-[75vh] w-full max-w-5xl rounded-xl border border-slate-200 bg-white shadow-sm"
              />
            ) : (
              <img
                src={targetUrl}
                alt={targetName}
                onError={() => {
                  // If image rendering failed (e.g. PDF blob mistakenly routed to img tag), switch to iframe
                  setImgFailed(true);
                }}
                className="max-h-[75vh] w-auto max-w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-transform duration-150"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
