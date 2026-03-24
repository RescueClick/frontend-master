/** Shared follow-up call outcomes for RM (partners), RSM (RMs), ASM (RSMs). */

export const FOLLOW_UP_STATUS_OPTIONS = [
  {
    value: "Ringing",
    label: "Ringing",
    color: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  {
    value: "Connected",
    label: "Connected",
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
  {
    value: "Switch Off",
    label: "Switch Off",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-100",
  },
  {
    value: "Not Reachable",
    label: "Not Reachable",
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-100",
  },
];

export function getFollowUpStatusStyle(status) {
  const option = FOLLOW_UP_STATUS_OPTIONS.find((opt) => opt.value === status);
  return (
    option || {
      color: "bg-gray-500",
      textColor: "text-gray-700",
      bgColor: "bg-gray-100",
    }
  );
}
