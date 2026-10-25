import React from "react";
import { Eye, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function DocumentUploadCard({
  name,
  label,
  file,
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
  onChange,
  onRemove,
  error,
  onPreview,
  hint,
  uploadStatus = "idle", // 'idle' | 'uploading' | 'uploaded' | 'failed'
  uploadProgress = 0,
}) {
  const isUploading = uploadStatus === "uploading";
  const isUploaded = uploadStatus === "uploaded";
  const isFailed = uploadStatus === "failed";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-base font-medium mb-1.5" style={{ color: "#111827" }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isUploaded && (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      {hint ? (
        <p className="text-xs text-slate-500 mb-2 leading-relaxed">{hint}</p>
      ) : null}

      <div className="relative flex items-center gap-1.5">
        <input
          type="file"
          name={name}
          onChange={onChange}
          disabled={isUploading}
          className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium disabled:opacity-60"
          style={{
            borderColor: isFailed
              ? "#EF4444"
              : isUploaded
              ? "#10B981"
              : "var(--color-brand-primary)",
            backgroundColor: "#F8FAFC",
          }}
          accept={accept}
          required={required && !file}
        />

        {file && onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
            style={{ color: "#2563EB" }}
            title="View file"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        {file && !isUploading && (
          <button
            type="button"
            onClick={() => onRemove(name)}
            className="p-1 rounded-full hover:bg-red-100 transition-colors"
            style={{ color: "#EF4444" }}
            title="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress bar while uploading in background */}
      {isUploading && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading in background...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* File status indicators */}
      {file && !isUploading && (
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-slate-600 truncate max-w-[260px]">
            {file.name}
          </span>
          {file.size && (
            <span className="text-slate-400">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          )}
        </div>
      )}

      {isFailed && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" /> Upload blip. Re-select file to retry.
        </p>
      )}

      {!file && error}
    </div>
  );
}
