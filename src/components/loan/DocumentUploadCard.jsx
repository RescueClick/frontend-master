import React from "react";
import { Eye, X } from "lucide-react";

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
}) {
  return (
    <div>
      <label className="block text-base font-medium mb-1.5" style={{ color: "#111827" }}>
        {label}
      </label>
      {hint ? (
        <p className="text-xs text-slate-500 mb-2 leading-relaxed">{hint}</p>
      ) : null}
      <div className="relative flex items-center gap-1.5">
        <input
          type="file"
          name={name}
          onChange={onChange}
          className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
          style={{
            borderColor: "var(--color-brand-primary)",
            backgroundColor: "#F8FAFC",
          }}
          accept={accept}
          required={required}
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

        {file && (
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

      {file && (
        <p className="text-sm mt-1 text-green-600 flex items-center gap-1">
          <span>✓</span> {file.name}
        </p>
      )}

      {!file && error}
    </div>
  );
}
