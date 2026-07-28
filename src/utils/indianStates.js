/** Official states and union territories of India (for region/state dropdowns). */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

/** Options for list filters (includes All). */
export const INDIAN_STATE_FILTER_OPTIONS = ["All", ...INDIAN_STATES];

/**
 * If saved region is not in the official list (legacy free-text),
 * include it so edit forms still display the current value.
 */
export function statesWithLegacy(currentValue) {
  const current = String(currentValue || "").trim();
  if (!current) return INDIAN_STATES;
  const exists = INDIAN_STATES.some(
    (s) => s.toLowerCase() === current.toLowerCase()
  );
  if (exists) return INDIAN_STATES;
  return [current, ...INDIAN_STATES];
}
