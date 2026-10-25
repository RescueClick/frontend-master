import React from "react";

export default function LoanStepper({
  steps,
  currentStep,
  maxStep,
  onStepClick,
  loading = false,
  stepErrorCounts = [],
  helperText = "Complete step-by-step. Your progress is saved on this device.",
}) {
  const progress =
    steps.length > 1 ? Math.round((currentStep / (steps.length - 1)) * 100) : 0;

  return (
    <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 -mx-6 mb-3 sticky top-0 z-20 backdrop-blur-sm">
      <div className="mb-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--color-brand-primary, #0D9488)",
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {steps.map((step, idx) => {
          const label = typeof step === "string" ? step : step?.label || step?.id || `Step ${idx + 1}`;
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          const isClickable = idx <= maxStep && !loading;
          const stepErrorCount = Number(stepErrorCounts[idx] || 0);

          return (
            <button
              key={typeof step === "string" ? step : step?.id || label}
              type="button"
              onClick={() => isClickable && onStepClick(idx)}
              disabled={!isClickable}
              className="flex-1 min-w-[90px] rounded-md border px-2 py-1 text-center font-medium transition-all text-xs"
              style={{
                borderColor: isActive
                  ? "var(--color-brand-primary, #0D9488)"
                  : isDone
                  ? "#10B981"
                  : "#E2E8F0",
                backgroundColor: isActive ? "#F0FDFA" : isDone ? "#F0FDF4" : "#FFFFFF",
                color: isActive ? "#0F766E" : isDone ? "#047857" : "#475569",
                opacity: isClickable ? 1 : 0.6,
                cursor: isClickable ? "pointer" : "not-allowed",
              }}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="inline-flex items-center justify-center gap-1 w-full truncate">
                <span className="font-bold">{idx + 1}.</span>
                <span className="truncate">{label}</span>
                {stepErrorCount > 0 && (
                  <span className="inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-red-100 px-1 text-[9px] font-bold text-red-700">
                    {stepErrorCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {helperText ? <p className="mt-1.5 text-[11px] text-slate-500 font-medium">{helperText}</p> : null}
    </div>
  );
}
