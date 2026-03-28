import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Export an array of plain objects to an .xlsx file.
 * @param {Record<string, string|number|boolean|null|undefined>[]} rows
 * @param {string} fileName - Filename; .xlsx appended if missing
 * @param {string} [sheetName='Data'] - Excel sheet name (max 31 chars)
 * @returns {boolean} true if file was written
 */
export function downloadXlsx(rows, fileName = "export.xlsx", sheetName = "Data") {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const safeName = String(sheetName || "Data").slice(0, 31) || "Data";
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const name = fileName.toLowerCase().endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), name);
  return true;
}
