export function sortNewestFirst(items, options = {}) {
  const list = Array.isArray(items) ? [...items] : [];
  const dateKeys = options.dateKeys || [
    "createdAt",
    "created_at",
    "applicationDate",
    "application_date",
    "updatedAt",
    "updated_at",
    "timestamp",
    "date",
  ];
  const idKeys = options.idKeys || ["_id", "id"];

  const toTime = (value) => {
    if (!value) return 0;
    if (value instanceof Date) {
      const t = value.getTime();
      return Number.isFinite(t) ? t : 0;
    }
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const toComparableId = (value) => {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    const str = String(value);
    const asNum = Number(str);
    return Number.isFinite(asNum) ? asNum : str;
  };

  const pickFirst = (obj, keys) => {
    for (const k of keys) {
      if (obj && obj[k] != null) return obj[k];
    }
    return undefined;
  };

  return list.sort((a, b) => {
    const aDate = pickFirst(a, dateKeys);
    const bDate = pickFirst(b, dateKeys);
    const aTime = toTime(aDate);
    const bTime = toTime(bDate);
    if (aTime !== bTime) return bTime - aTime;

    const aId = toComparableId(pickFirst(a, idKeys));
    const bId = toComparableId(pickFirst(b, idKeys));

    if (typeof aId === "number" && typeof bId === "number") return bId - aId;
    return String(bId).localeCompare(String(aId));
  });
}

