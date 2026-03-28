/**
 * Shared list/table page shell — matches Admin RSM spacing:
 * #F8FAFC page background, compact header row, white bordered card around the table.
 */
export default function DashboardTablePage({
  title,
  subtitle,
  headerRight,
  toolbar,
  error,
  children,
  className = "",
  tableWrapClassName = "",
}) {
  const showHeader =
    title != null || subtitle != null || headerRight != null;

  return (
    <div className={`app-list-page ${className}`.trim()}>
      {showHeader ? (
        <div className="app-list-page__header">
          <div className="min-w-0">
            {title != null ? (
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            ) : null}
            {subtitle != null ? (
              <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {headerRight != null ? (
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 justify-start sm:justify-end">
              {headerRight}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {toolbar != null ? (
        <div className="app-list-page__toolbar">{toolbar}</div>
      ) : null}

      <div
        className={`app-list-page__table-wrap ${tableWrapClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
