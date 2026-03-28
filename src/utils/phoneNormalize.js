/**
 * Strip non-digits; keep up to 10, or last 10 if longer (e.g. +91 pasted).
 */
export function normalizeMobileDigits(value) {
  const d = String(value ?? "").replace(/\D/g, "");
  if (!d) return "";
  return d.length > 10 ? d.slice(-10) : d.slice(0, 10);
}
