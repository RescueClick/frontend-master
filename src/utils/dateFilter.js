/**
 * Matches a record against a specified year and month.
 * Uses the FIRST available valid date in dateKeys (authoritative primary date)
 * to prevent the same record from matching multiple months if updatedAt differs from createdAt.
 */
export function matchesMonthYear(row, { year, month, dateKeys } = {}) {
  if (!row) return false;

  const y = typeof year === "string" ? (year === "all" ? null : parseInt(year, 10)) : year;
  const m = typeof month === "string" ? (month === "all" ? null : parseInt(month, 10)) : month;

  // If both year and month are null/unspecified or 'all', match all
  if ((y === null || y === undefined) && (m === null || m === undefined)) return true;

  const keys = Array.isArray(dateKeys) && dateKeys.length > 0
    ? dateKeys
    : ["disbursedAt", "createdAt", "applicationDate", "created_at", "application_date"];

  // Find the first valid date value (authoritative date for this record)
  let recordDate = null;
  for (const key of keys) {
    const value = row?.[key];
    if (value) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        recordDate = d;
        break; // Use the highest-priority date only!
      }
    }
  }

  if (!recordDate) return false;

  const recYear = recordDate.getFullYear();
  const recMonth = recordDate.getMonth() + 1; // 1-12

  // If year is specified, must match
  if (Number.isFinite(y) && recYear !== y) {
    return false;
  }

  // If month is specified (1-12), must match
  if (Number.isFinite(m) && m >= 1 && m <= 12 && recMonth !== m) {
    return false;
  }

  return true;
}
