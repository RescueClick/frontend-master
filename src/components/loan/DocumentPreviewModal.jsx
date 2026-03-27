import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";

export default function DocumentPreviewModal({ url, onClose }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
  }, [url]);

  const isPdf = useMemo(() => {
    if (!url) return false;
    return /\.pdf($|\?)/i.test(url);
  }, [url]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 p-3 sm:p-6">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 sm:px-4">
          <h3 className="truncate text-base font-semibold text-slate-800">Document Preview</h3>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100"
              title="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-sm font-medium text-slate-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
              className="rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100"
              title="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100"
              title="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-red-500 p-1.5 text-white hover:bg-red-600"
              title="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-4">
          <div className="flex min-h-full items-center justify-center">
            {isPdf ? (
              <iframe
                src={url}
                title="Document PDF Preview"
                className="h-[70vh] w-full max-w-5xl rounded-lg border border-slate-200 bg-white shadow"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              />
            ) : (
              <img
                src={url}
                alt="Document Preview"
                className="max-h-[75vh] w-auto max-w-full rounded-lg border border-slate-200 bg-white shadow"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
