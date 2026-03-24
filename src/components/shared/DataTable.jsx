// Shared Data Table Component - Linear Design System
import DhanSourceLoader from "../DhanSourceLoader";
import { designSystem } from "../../utils/designSystem";

const DataTable = ({ 
  headers, 
  data, 
  renderRow, 
  loading = false, 
  emptyMessage = "No data available",
  className = ""
}) => {
  if (loading) {
    return (
      <div className={`${designSystem.table.container} ${className}`}>
        <DhanSourceLoader size="sm" label="Loading table…" className="py-12" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${designSystem.table.container} ${className}`}>
        <div className="p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${designSystem.table.container} ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={designSystem.table.header}>
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={designSystem.table.headerCell}
                  style={{ minWidth: header.minWidth || "auto" }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={designSystem.table.row}>
                {renderRow(row, rowIndex)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

