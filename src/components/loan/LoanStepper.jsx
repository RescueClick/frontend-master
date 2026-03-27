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
    <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200 -mx-6 mb-4">
      <div className="mb-3 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--color-brand-primary)",
          }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          const isClickable = idx <= maxStep && !loading;
          const stepErrorCount = Number(stepErrorCounts[idx] || 0);

          return (
            <button
              key={step}
              type="button"
              onClick={() => isClickable && onStepClick(idx)}
              disabled={!isClickable}
              className="rounded-lg border px-2 py-1.5 text-center font-medium transition-colors"
              style={{
                borderColor: isActive
                  ? "var(--color-brand-primary)"
                  : isDone
                  ? "#22C55E"
                  : "#CBD5E1",
                backgroundColor: isActive ? "#EEF2FF" : "#FFFFFF",
                color: isActive ? "#4F46E5" : "#334155",
                opacity: isClickable ? 1 : 0.6,
                cursor: isClickable ? "pointer" : "not-allowed",
              }}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="inline-flex items-center gap-1">
                <span>{idx + 1}. {step}</span>
                {stepErrorCount > 0 && (
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-100 px-1 text-[10px] font-semibold text-red-700">
                    {stepErrorCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-sm text-slate-600">{helperText}</p>
    </div>
  );
}
