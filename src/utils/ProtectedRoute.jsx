import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuthData } from "./localStorage";

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

  const routeRole = allowedRoles[0];
  let currentRole = null;
  let currentToken = null;

  if (routeRole) {
    const lastImpersonation = impersonationStack[impersonationStack.length - 1];
    if (lastImpersonation && lastImpersonation.user.role === routeRole) {
      currentRole = lastImpersonation.user.role;
      currentToken = lastImpersonation.token;
    }
  }

  if (!currentToken) {
    switch (routeRole) {
      case "SUPER_ADMIN":
        if (adminToken && adminUser) {
          currentRole = adminUser.role;
          currentToken = adminToken;
        }
        break;
      case "ASM":
        if (asmToken && asmUser) {
          currentRole = asmUser.role;
          currentToken = asmToken;
        }
        break;
      case "RSM":
        if (rsmToken && rsmUser) {
          currentRole = rsmUser.role;
          currentToken = rsmToken;
        }
        break;
      case "RM":
        if (rmToken && rmUser) {
          currentRole = rmUser.role;
          currentToken = rmToken;
        }
        break;
      case "PARTNER":
        if (partnerToken && partnerUser) {
          currentRole = partnerUser.role;
          currentToken = partnerToken;
        }
        break;
      case "CUSTOMER":
        if (customerToken && customerUser) {
          currentRole = customerUser.role;
          currentToken = customerToken;
        }
        break;
      default:
        break;
    }
  }

  if (!currentToken) return <Navigate to="/" replace />;
  if (allowedRoles.length && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

