import React from "react";

export default function ActivationConfirmModal({
  isOpen,
  title = "Activate User",
  subjectName = "",
  message = "Are you sure you want to activate this user?",
  confirmLabel = "Activate",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  confirmLoading = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-primary p-6 text-white relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            aria-label="Close"
          >
            x
          </button>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>

        <div className="p-6 bg-[#F8FAFC] space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-[#111827]">
              {message}{" "}
              {subjectName ? (
                <span className="font-semibold">{subjectName}</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmDisabled || confirmLoading}
              className={`px-4 py-2 text-sm rounded-md text-white ${
                !confirmDisabled && !confirmLoading
                  ? "bg-brand-primary hover:opacity-90"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {confirmLoading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
