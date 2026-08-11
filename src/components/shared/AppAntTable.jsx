import { Table } from "antd";
import { useState } from "react";

/** Fixed 10 rows per page everywhere (size changer off). */
const defaultPagination = {
  showSizeChanger: false,
  showQuickJumper: true,
  defaultPageSize: 10,
  pageSizeOptions: ["10"],
  showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} entries`,
};

/**
 * Ant Design Table with consistent pagination defaults across the app.
 * Set pagination={false} to disable.
 */
export default function AppAntTable({
  columns,
  dataSource = [],
  rowKey = "id",
  loading = false,
  pagination = {},
  scroll = { x: "max-content" },
  size = "middle",
  className = "",
  /** Use in cards/widgets: no min-height on the shell so short tables stay tight */
  compact = false,
  tableId,
  ...rest
}) {
  const locationPath = typeof window !== "undefined" ? window.location.pathname : "";
  // Use a stable key for session storage. Use tableId if provided, else use pathname
  const storageKey = `table-page-${tableId || locationPath}`;

  // Initial page from session storage
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const handleTableChange = (newPagination, filters, sorter, extra) => {
    if (newPagination && newPagination.current) {
      setCurrentPage(newPagination.current);
      try {
        sessionStorage.setItem(storageKey, newPagination.current.toString());
      } catch {}
    }
    if (rest.onChange) {
      rest.onChange(newPagination, filters, sorter, extra);
    }
  };

  const paginationConfig =
    pagination === false
      ? false
      : (() => {
          const extra =
            typeof pagination === "object" && pagination !== null
              ? { ...pagination }
              : {};
          
          // Calculate valid page to avoid "No data" if list shrinks
          let validPage = currentPage;
          const totalItems = extra.total !== undefined ? extra.total : (dataSource ? dataSource.length : 0);
          
          if (!loading && totalItems >= 0) {
            const maxPage = Math.max(1, Math.ceil(totalItems / 10));
            if (validPage > maxPage) {
              validPage = maxPage;
            }
          }

          delete extra.pageSize;
          delete extra.defaultPageSize;
          delete extra.pageSizeOptions;
          delete extra.showSizeChanger;
          return {
            ...defaultPagination,
            ...extra,
            current: validPage,
            defaultPageSize: 10,
            pageSizeOptions: ["10"],
            showSizeChanger: false,
          };
        })();

  return (
    <div
      className={`app-ant-table-shell w-full min-w-0${compact ? " app-ant-table-shell--compact" : ""}`}
    >
      <Table
        className={`app-ant-table rounded-xl overflow-hidden ${className}`}
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        pagination={paginationConfig}
        scroll={scroll}
        size={size}
        {...rest}
        onChange={handleTableChange}
      />
    </div>
  );
}
