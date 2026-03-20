import React from "react";

const ChartCard = ({ title, subtitle, right, children, className = "" }) => {
  return (
    <section className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          {title ? (
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
          ) : null}
          {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex items-center gap-2 flex-wrap">{right}</div> : null}
      </div>
      <div className="min-h-[220px]">{children}</div>
    </section>
  );
};

export default ChartCard;

