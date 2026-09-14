import React from "react";
import { Check, Copy, Loader2, Pencil, Trash2 } from "lucide-react";

const contactName = (row, role) =>
  row?.[role]?.name || (role === "rm" ? row?.rmName : "") || "";
const contactPhone = (row, role) =>
  row?.[role]?.phone || (role === "rm" ? row?.rmPhone : "") || "";
const contactEmail = (row, role) =>
  row?.[role]?.email || (role === "rm" ? row?.rmEmail : "") || "";
const contactProduct = (row, role) => row?.[role]?.product || "";

export const BANK_RM_TABLE_COLUMNS = [
  "Bank NBFC Name",
  "Product",
  "Login Code",
  "Market & Sub Type",
  "City",
  "State",
  "Company",
  "RM",
  "ASM",
  "RSM",
  "Last Updated",
];

function formatUserName(user) {
  if (!user || typeof user !== "object") return "";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (name) return name;
  return user.email || user.role || "";
}

function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ContactCell({ name, phone, email, product }) {
  if (!name && !phone && !email && !product) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <div className="space-y-0.5 min-w-[140px]">
      <p className="font-medium text-slate-800">{name || "—"}</p>
      {product ? (
        <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 inline-block px-1.5 py-0.5 rounded">
          {product}
        </p>
      ) : null}
      {phone ? (
        <a href={`tel:${phone}`} className="block text-xs text-teal-700 hover:underline">
          {phone}
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className="block text-xs text-teal-700 hover:underline truncate max-w-[180px]">
          {email}
        </a>
      ) : null}
    </div>
  );
}

/**
 * Shared Bank RM results table for Admin / RSM / ASM.
 */
export default function BankRmResultsTable({
  rows = [],
  loading = false,
  emptyMessage = "No Bank RM records found",
  showActions = false,
  onEdit,
  onDelete,
  copiedLoginCodeId = null,
  onCopyLoginCode,
  compact = false,
}) {
  const thPad = compact ? "px-3 py-2.5" : "px-4 py-3";
  const tdPad = compact ? "px-3 py-2.5" : "px-4 py-3";
  const colCount = BANK_RM_TABLE_COLUMNS.length + (showActions ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {BANK_RM_TABLE_COLUMNS.map((label) => (
              <th key={label} className={thPad}>
                {label}
              </th>
            ))}
            {showActions && <th className={`${thPad} text-right`}>Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={colCount} className={`${tdPad} py-10 text-center text-slate-500`}>
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading Bank RMs...
                </span>
              </td>
            </tr>
          ) : !rows.length ? (
            <tr>
              <td colSpan={colCount} className={`${tdPad} py-10 text-center text-slate-500`}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = row._id || row.id;
              const loginCopied = copiedLoginCodeId === id;
              return (
                <tr key={id} className="hover:bg-slate-50/80">
                  <td className={`${tdPad} font-medium text-slate-800`}>
                    {row.bankNbfcName || "—"}
                  </td>
                  <td className={`${tdPad} text-slate-700`}>{row.product || "—"}</td>
                  <td className={`${tdPad} text-slate-700`}>
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-mono font-semibold">{row.loginCode || "—"}</span>
                      {row.loginCode && onCopyLoginCode && (
                        <button
                          type="button"
                          onClick={() => onCopyLoginCode(row.loginCode, id)}
                          className={`rounded p-1 ${
                            loginCopied
                              ? "bg-emerald-50 text-emerald-600"
                              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          }`}
                          title="Copy login code"
                        >
                          {loginCopied ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className={`${tdPad} text-slate-700`}>{row.marketType || "—"}</td>
                  <td className={`${tdPad} text-slate-700`}>
                    {row.isPanIndia ||
                    row.state === "PAN India" ||
                    row.state === "Open India" ? (
                      <span className="text-xs text-slate-500 italic">
                        {row.city && row.city !== "All Cities" ? row.city : "All Cities (Nationwide)"}
                      </span>
                    ) : (
                      row.city || "—"
                    )}
                  </td>
                  <td className={`${tdPad} text-slate-700`}>
                    {row.isPanIndia ||
                    row.state === "PAN India" ||
                    row.state === "Open India" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-xs">
                        <span className="text-xs">🌍</span> PAN India
                      </span>
                    ) : (
                      row.state || "—"
                    )}
                  </td>
                  <td className={`${tdPad} text-slate-700`}>{row.company || "—"}</td>
                  <td className={tdPad}>
                    <ContactCell
                      name={contactName(row, "rm")}
                      phone={contactPhone(row, "rm")}
                      email={contactEmail(row, "rm")}
                      product={contactProduct(row, "rm")}
                    />
                  </td>
                  <td className={tdPad}>
                    <ContactCell
                      name={contactName(row, "asm")}
                      phone={contactPhone(row, "asm")}
                      email={contactEmail(row, "asm")}
                      product={contactProduct(row, "asm")}
                    />
                  </td>
                  <td className={tdPad}>
                    <ContactCell
                      name={contactName(row, "rsm")}
                      phone={contactPhone(row, "rsm")}
                      email={contactEmail(row, "rsm")}
                      product={contactProduct(row, "rsm")}
                    />
                  </td>
                  <td className={`${tdPad} text-slate-700 whitespace-nowrap`}>
                    {(() => {
                      const updatedAt = formatDateTime(row.updatedAt);
                      const createdAt = formatDateTime(row.createdAt);
                      const updater =
                        formatUserName(row.updatedBy) ||
                        formatUserName(row.createdBy) ||
                        "";
                      if (!updatedAt && !createdAt) {
                        return <span className="text-slate-400">—</span>;
                      }
                      return (
                        <div className="space-y-0.5 min-w-[150px]">
                          <p className="font-medium text-slate-800">
                            {updatedAt || createdAt}
                          </p>
                          {updater ? (
                            <p className="text-xs text-slate-500">
                              by {updater}
                              {row.updatedBy?.role || row.createdBy?.role
                                ? ` (${row.updatedBy?.role || row.createdBy?.role})`
                                : ""}
                            </p>
                          ) : null}
                          {createdAt && updatedAt && createdAt !== updatedAt ? (
                            <p className="text-[11px] text-slate-400">
                              Created: {createdAt}
                            </p>
                          ) : null}
                        </div>
                      );
                    })()}
                  </td>
                  {showActions && (
                    <td className={tdPad}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit?.(row)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(row)}
                          className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
