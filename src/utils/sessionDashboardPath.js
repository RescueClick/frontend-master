import { getAuthData } from "./localStorage";

const ROLE_TO_BASE = {
  SUPER_ADMIN: "/admin",
  ASM: "/asm",
  RSM: "/rsm",
  RM: "/rm",
  PARTNER: "/partner",
  CUSTOMER: "/customer",
};

/**
 * Base app path for the current browser session (login + impersonation), or null if guest.
 * Matches post-login routing in `LoginPage.jsx`.
 */
export function getSessionDashboardBasePath() {
  const d = getAuthData();
  const stack = d.impersonationStack || [];
  const last = stack[stack.length - 1];
  if (last?.user?.role) {
    const r = String(last.user.role).toUpperCase();
    if (ROLE_TO_BASE[r]) return ROLE_TO_BASE[r];
  }

  const pairs = [
    [d.customerToken, d.customerUser],
    [d.partnerToken, d.partnerUser],
    [d.rmToken, d.rmUser],
    [d.rsmToken, d.rsmUser],
    [d.asmToken, d.asmUser],
    [d.adminToken, d.adminUser],
  ];
  for (const [token, user] of pairs) {
    if (token && user?.role) {
      const r = String(user.role).toUpperCase();
      if (ROLE_TO_BASE[r]) return ROLE_TO_BASE[r];
    }
  }
  return null;
}
