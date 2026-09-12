import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuthData } from "./localStorage";
import { getSessionDashboardBasePath } from "./sessionDashboardPath";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const {
    adminToken,
    adminUser,
    asmToken,
    asmUser,
    rsmToken,
    rsmUser,
    rmToken,
    rmUser,
    partnerToken,
    partnerUser,
    customerToken,
    customerUser,
    impersonationStack = [],
  } = getAuthData();

  let currentRole = null;
  let currentToken = null;

  // 1. If impersonating, check the top of the impersonation stack
  const lastImpersonation = impersonationStack[impersonationStack.length - 1];
  if (
    lastImpersonation &&
    lastImpersonation.user?.role &&
    lastImpersonation.token
  ) {
    currentRole = lastImpersonation.user.role;
    currentToken = lastImpersonation.token;
  }

  // 2. If not impersonating, detect active logged-in user
  if (!currentToken) {
    const candidates = [
      { role: adminUser?.role || "SUPER_ADMIN", token: adminToken, user: adminUser },
      { role: rsmUser?.role || "RSM", token: rsmToken, user: rsmUser },
      { role: asmUser?.role || "ASM", token: asmToken, user: asmUser },
      { role: rmUser?.role || "RM", token: rmToken, user: rmUser },
      { role: partnerUser?.role || "PARTNER", token: partnerToken, user: partnerUser },
      { role: customerUser?.role || "CUSTOMER", token: customerToken, user: customerUser },
    ];

    for (const c of candidates) {
      if (c.token && c.user) {
        currentRole = c.role;
        currentToken = c.token;
        break;
      }
    }
  }

  // 3. Fallback: if token exists but user object was partially missing
  if (!currentToken) {
    if (adminToken) { currentRole = "SUPER_ADMIN"; currentToken = adminToken; }
    else if (rsmToken) { currentRole = "RSM"; currentToken = rsmToken; }
    else if (asmToken) { currentRole = "ASM"; currentToken = asmToken; }
    else if (rmToken) { currentRole = "RM"; currentToken = rmToken; }
    else if (partnerToken) { currentRole = "PARTNER"; currentToken = partnerToken; }
    else if (customerToken) { currentRole = "CUSTOMER"; currentToken = customerToken; }
  }

  // If completely unauthenticated, redirect to LoginPage (never to landing page)
  if (!currentToken) {
    return <Navigate to="/LoginPage" replace />;
  }

  const normalizedCurrent = String(currentRole || "").toUpperCase();

  // Super Admin / Admin has universal access
  if (normalizedCurrent === "SUPER_ADMIN" || normalizedCurrent === "ADMIN") {
    return <Outlet />;
  }

  // Check if role is allowed
  if (allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => String(r || "").toUpperCase());
    if (!normalizedAllowed.includes(normalizedCurrent)) {
      // Role is authenticated but not authorized for this specific route.
      // Redirect to their own role dashboard instead of kicking to landing page.
      const fallbackHome = getSessionDashboardBasePath() || "/LoginPage";
      return <Navigate to={fallbackHome} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
