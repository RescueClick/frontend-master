/** Partner business channel — used for payout tiers (rickshaw gets lower %). */
export const PARTNER_CHANNEL_TYPES = [
  { value: "RICKSHAW", label: "Rickshaw / Auto driver" },
  { value: "NET_CAFE", label: "Net café / Cyber café" },
  { value: "KIRANA", label: "Kirana / Local shop" },
  { value: "OTHER", label: "Other" },
];

export const PARTNER_CHANNEL_VALUES = PARTNER_CHANNEL_TYPES.map((c) => c.value);

export function partnerChannelLabel(value) {
  const found = PARTNER_CHANNEL_TYPES.find((c) => c.value === value);
  return found ? found.label : value || "—";
}
