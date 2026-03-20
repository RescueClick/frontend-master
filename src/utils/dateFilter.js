export function matchesMonthYear(row, { year, month, dateKeys } = {}) {
  const y = typeof year === "string" ? parseInt(year, 10) : year;
  const m = typeof month === "string" ? parseInt(month, 10) : month;

  if (!y && !m) return true;
  if (!Number.isFinite(y) || !Number.isFinite(m)) return true;
  if (m < 1 || m > 12) return true;

  const keys = Array.isArray(dateKeys) && dateKeys.length > 0
    ? dateKeys
    : ["createdAt", "applicationDate", "updatedAt", "created_at", "application_date", "updated_at"];

  for (const key of keys) {
    const value = row?.[key];
    if (!value) continue;

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) continue;

    if (d.getFullYear() === y && d.getMonth() + 1 === m) return true;
  }

  return false;
}

