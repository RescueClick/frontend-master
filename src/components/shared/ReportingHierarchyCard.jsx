import React from "react";
import { Users } from "lucide-react";

/**
 * Shows reporting chain (ASM → RSM → RM → Partner) from universal analytics `profile.reportingChain`.
 */
export default function ReportingHierarchyCard({ chain, className = "" }) {
  if (!chain || chain.length === 0) return null;

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/90 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-brand-primary shrink-0" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Reporting hierarchy
        </h4>
        <span className="text-[10px] text-slate-400 font-normal normal-case">
          (Organization → user)
        </span>
      </div>
      <ol className="space-y-3">
        {chain.map((node, i) => (
          <li
            key={`${node.role}-${node.name}-${i}`}
            className="flex flex-wrap items-start gap-2 border-b border-slate-200/80 pb-3 last:border-0 last:pb-0"
          >
            <span className="mt-0.5 w-6 shrink-0 text-center text-[11px] font-semibold text-slate-400">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    node.isSelf
                      ? "font-bold text-slate-900"
                      : "font-semibold text-slate-800"
                  }
                >
                  {node.name}
                </span>
                {node.segmentLabel && (
                  <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                    {node.segmentLabel}
                  </span>
                )}
                {node.isSelf && (
                  <span className="rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-primary">
                    Viewing
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                <span className="font-medium">{node.role}</span>
                {node.employeeId ? (
                  <span className="text-slate-500"> · ID {node.employeeId}</span>
                ) : null}
                {node.rsmType ? (
                  <span className="text-slate-500"> · {node.rsmType}</span>
                ) : null}
              </p>
              {(node.phone || node.email) && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {node.phone ? <span>{node.phone}</span> : null}
                  {node.phone && node.email ? " · " : null}
                  {node.email ? <span className="break-all">{node.email}</span> : null}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
