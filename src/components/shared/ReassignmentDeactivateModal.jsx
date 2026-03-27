import React, { useState } from "react";

/**
 * Shared deactivate + reassignment modal — matches ActivationConfirmModal shell
 * (brand header, slate body, disclaimer strip) for visual consistency app-wide.
 */
export default function ReassignmentDeactivateModal({
  isOpen,
  title = "Deactivate User",
  /** Shown in the red disclaimer strip */
  warningText = "",
  /** Summary card title (user being deactivated) */
  subjectName = "",
  /** Optional second line under subject (e.g. RM code, employee ID) */
  subjectMeta = "",
  summaryBadgeText = "Will be deactivated",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search replacement...",
  /** { id, name, meta?, statusBadge? } */
  candidates = [],
  selectedId,
  onSelect,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm & Deactivate",
  confirmLoadingLabel = "Processing...",
  loadingMessage = "Deactivation in progress. Reassigning old user data to new user. Please wait...",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  confirmLoading = false,
  errorMessage = "",
  maxWidthClass = "max-w-2xl",
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isBusy = confirmLoading || internalLoading;

  const handleConfirm = async () => {
    if (!onConfirm || isBusy || confirmDisabled) return;
    try {
      setInternalLoading(true);
      await Promise.resolve(onConfirm());
    } finally {
      setInternalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidthClass} relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-primary p-6 text-white relative rounded-t-3xl">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="space-y-3 pr-10">
            <h3 className="text-xl font-bold">{title}</h3>

            {warningText ? (
              <div className="flex items-start gap-3 bg-red-50 border-l-4 border-red-500 rounded-md p-3 shadow-sm">
                <span className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden>
                  ⚠️
                </span>
                <p className="text-sm text-red-800 leading-snug">
                  <span className="font-semibold">Disclaimer: </span>
                  {warningText}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#F8FAFC] space-y-4 rounded-b-3xl">
          {(subjectName || subjectMeta) && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
              <div>
                {subjectName ? (
                  <h4 className="font-semibold text-[#111827] text-lg">{subjectName}</h4>
                ) : null}
                {subjectMeta ? (
                  <p className="text-gray-600 text-sm mt-0.5">{subjectMeta}</p>
                ) : null}
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100 whitespace-nowrap">
                {summaryBadgeText}
              </span>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              disabled={isBusy}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200">
              {candidates.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  No replacement candidates found.
                </div>
              ) : (
                candidates.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="reassignment-replacement"
                        checked={selectedId === c.id}
                        onChange={() => onSelect?.(c.id)}
                        disabled={isBusy}
                        className="text-brand-primary flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#111827] truncate">
                          {c.name}
                        </div>
                        {c.meta ? (
                          <div className="text-xs text-gray-500 truncate">{c.meta}</div>
                        ) : null}
                      </div>
                    </div>
                    {c.statusBadge ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                          String(c.statusBadge).toUpperCase() === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.statusBadge}
                      </span>
                    ) : null}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            {errorMessage ? (
              <span className="text-red-600 text-xs mr-auto w-full sm:w-auto">{errorMessage}</span>
            ) : null}
            {isBusy ? (
              <div className="mr-auto w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                {loadingMessage}
              </div>
            ) : null}
            <button
              type="button"
              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
              disabled={isBusy}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={confirmDisabled || isBusy}
              className={`px-4 py-2 text-sm rounded-md text-white font-medium ${
                !confirmDisabled && !isBusy
                  ? "bg-brand-primary hover:opacity-90"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              onClick={handleConfirm}
            >
              {isBusy ? confirmLoadingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
