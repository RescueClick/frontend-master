import { Table } from "antd";

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
  ...rest
}) {
  const paginationConfig =
    pagination === false
      ? false
      : (() => {
          const extra =
            typeof pagination === "object" && pagination !== null
              ? { ...pagination }
              : {};
          delete extra.pageSize;
          delete extra.defaultPageSize;
          delete extra.pageSizeOptions;
          delete extra.showSizeChanger;
          return {
            ...defaultPagination,
            ...extra,
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
      />
    </div>
  );
}
