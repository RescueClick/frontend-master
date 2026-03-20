import React from "react";

/**
 * Shared page header for panels (dashboards, analytics, lists).
 * - Left: title + optional subtitle
 * - Right: optional actions (buttons, filters, etc.)
 */
const PageHeader = ({ title, subtitle, right, className = "" }) => {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2 flex-wrap">{right}</div> : null}
    </div>
  );
};

export default PageHeader;

