export function normalizeText(value) {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
}

export function matchesSearchTerm(searchTerm, fields) {
  const term = normalizeText(searchTerm);
  if (!term) return true;
  for (const field of fields) {
    if (normalizeText(field).includes(term)) return true;
  }
  return false;
}

export function normalizeStatus(status) {
  if (!status) return "";
  const s = String(status).trim().toUpperCase();
  // UI shows SUBMITTED for DRAFT in several pages
  if (s === "DRAFT") return "SUBMITTED";
  return s;
}

export function matchesStatusFilter(value, selected) {
  const sel = normalizeText(selected);
  if (!sel || sel === "all") return true;
  return normalizeText(value) === sel;
}

