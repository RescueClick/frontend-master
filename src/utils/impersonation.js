// // src/utils/impersonation.js
// export const backToPreviousRole = (navigate) => {
//     let stack = JSON.parse(localStorage.getItem("impersonation_stack") || "[]");
  
//     if (stack.length > 0) {
//       // Remove current impersonation
//       const current = stack.pop();
//       localStorage.setItem("impersonation_stack", JSON.stringify(stack));
  
//       // Clear impersonated token/user
//       localStorage.removeItem(`${current.role.toLowerCase()}_token`);
//       localStorage.removeItem(`${current.role.toLowerCase()}_user`);
  
//       if (stack.length > 0) {
//         // Restore previous impersonated role in localStorage
//         const prev = stack[stack.length - 1];
//         localStorage.setItem(`${prev.role.toLowerCase()}_token`, prev.token);
//         localStorage.setItem(`${prev.role.toLowerCase()}_user`, JSON.stringify(prev.user));
  
//         // Navigate to previous role dashboard
//         navigate(`/${prev.role.toLowerCase()}`);
//       } else {
//         // If no impersonation left, go back to super admin
//         const superAdminToken = localStorage.getItem("super_admin_token");
//         const superAdminUser = localStorage.getItem("super_admin_user");
//         if (superAdminToken && superAdminUser) {
//           navigate("/admin");
//         } else {
//           navigate("/LoginPage");
//         }
//       }
//     } else {
//       // If stack empty, fallback
//       navigate("/admin");
//     }
//   };
  

// src/utils/impersonation.js
import axios from "axios";
import toast from "react-hot-toast";
import { backendurl } from "../feature/urldata";
import { restoreParentAuth, getAuthData, clearChildAuthData, saveAuthData } from "./localStorage";

// Format role name for display
export const formatRoleName = (role) => {
  const roleMap = {
    SUPER_ADMIN: "Admin",
    ASM: "ASM",
    RSM: "RSM",
    RM: "RM",
    PARTNER: "Partner",
    CUSTOMER: "Customer",
  };
  return roleMap[role] || role;
};

const ROLE_ROUTES = {
  SUPER_ADMIN: "/admin",
  ADMIN: "/admin",
  ASM: "/asm",
  RSM: "/rsm",
  RM: "/rm",
  PARTNER: "/partner",
  CUSTOMER: "/customer",
};

const describeRole = (user) => {
  if (!user?.role) return null;
  const role = String(user.role).toUpperCase();
  return {
    role,
    displayName: formatRoleName(role),
    route: ROLE_ROUTES[role] || "/admin",
    user,
  };
};

// Parent session to return to after "login as".
// Newer logins store parent_user. Older ASM → RM logins left the ASM
// session in storage but never wrote parent_user, so recover that too.
export const getReturnRole = () => {
  const authData = getAuthData();

  const storedParent = describeRole(authData.parentUser);
  if (storedParent) return storedParent;

  const stack = authData.impersonationStack || [];
  const entryParent = describeRole(stack[stack.length - 1]?.parent);
  if (entryParent) return entryParent;

  if (!stack.length) return null;

  if (authData.asmUser) {
    return describeRole({ ...authData.asmUser, role: authData.asmUser.role || "ASM" });
  }
  if (authData.rsmUser) {
    return describeRole({ ...authData.rsmUser, role: authData.rsmUser.role || "RSM" });
  }
  if (authData.adminUser) {
    return describeRole({
      ...authData.adminUser,
      role: authData.adminUser.role || "SUPER_ADMIN",
    });
  }
  return null;
};

const tokenForRole = (authData, role) => {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "ASM") return authData.rawAsmToken || authData.asmToken || null;
  if (normalized === "RSM") return authData.rawRsmToken || null;
  if (normalized === "SUPER_ADMIN" || normalized === "ADMIN") return authData.adminToken || null;
  if (normalized === "RM") return authData.rmToken || null;
  if (normalized === "PARTNER") return authData.partnerToken || null;
  if (normalized === "CUSTOMER") return authData.customerToken || null;
  return null;
};

// Get the original role that started the impersonation (check parent_user first)
export const getOriginalRole = () => {
  const authData = getAuthData();
  
  // First check if there's a parent user (we're impersonating)
  const returnRole = getReturnRole();
  if (returnRole) return returnRole;
  
  // Fallback: Check in priority order: Admin > RSM > ASM > RM
  if (authData.adminToken) {
    return { role: "SUPER_ADMIN", displayName: "Admin", route: "/admin" };
  }
  if (authData.rsmToken) {
    return { role: "RSM", displayName: "RSM", route: "/rsm" };
  }
  if (authData.asmToken) {
    return { role: "ASM", displayName: "ASM", route: "/asm" };
  }
  if (authData.rmToken) {
    return { role: "RM", displayName: "RM", route: "/rm" };
  }
  return null;
};

// Go back to the original role's dashboard (immediate parent)
// This logs out current account and redirects to parent
export const backToOriginalRole = (navigate) => {
  const authData = getAuthData();
  const returnRole = getReturnRole();
  let parentUser = authData.parentUser || returnRole?.user || null;
  let parentToken =
    authData.parentToken ||
    parentUser?.token ||
    (parentUser ? tokenForRole(authData, parentUser.role) : null);
  
  if (!parentUser || !parentToken) {
    // No parent, fallback to admin or login
    const adminToken = authData.adminToken;
    const adminUser = authData.adminUser;
    if (adminToken && adminUser) {
      // Clear all non-admin tokens
      const childRoles = ["asm", "rsm", "rm", "partner", "customer"];
      childRoles.forEach((role) => {
        localStorage.removeItem(`${role}_token`);
        localStorage.removeItem(`${role}_user`);
      });
      localStorage.removeItem("parent_user");
      localStorage.removeItem("parent_token");
      // Keep main_parent for future use
      navigate("/admin");
    } else {
      navigate("/LoginPage");
    }
    return;
  }

  try {
    // The active session is the top of the impersonation stack (the RM),
    // not whichever manager token is still stored underneath it.
    const stack = [...(authData.impersonationStack || [])];
    const currentEntry = stack.length > 0 ? stack[stack.length - 1] : null;
    const currentRole = String(
      currentEntry?.role || currentEntry?.user?.role || ""
    ).toLowerCase();
    const parentRoleKey = String(parentUser.role || "").toLowerCase();
    const parentStorageKey = parentRoleKey === "admin" ? "super_admin" : parentRoleKey;

    if (currentRole && currentRole !== parentRoleKey) {
      localStorage.removeItem(`${currentRole}_token`);
      localStorage.removeItem(`${currentRole}_user`);
    }
    
    // Find the parent's entry in the stack to restore its parent tracking
    let parentParent = null;
    let parentParentToken = null;
    
    // Look for the parent in earlier stack entries (nested impersonations)
    for (let i = stack.length - 2; i >= 0; i--) {
      const entry = stack[i];
      const entryId = entry.user?._id || entry.user?.id;
      const parentId = parentUser._id || parentUser.id;
      if (entryId && parentId && String(entryId) === String(parentId)) {
        parentParent = entry.parent;
        parentParentToken = entry.parent?.token || entry.parentToken;
        break;
      }
    }
    
    // Clear current parent tracking (we're restoring the parent, so it's no longer a parent)
    localStorage.removeItem("parent_user");
    localStorage.removeItem("parent_token");
    
    // Drop only the session we are leaving (top of the stack)
    const updatedStack = currentEntry ? stack.slice(0, -1) : stack;
    localStorage.setItem("impersonation_stack", JSON.stringify(updatedStack));
    
    // Restore parent session
    localStorage.setItem(`${parentStorageKey}_token`, parentToken);
    localStorage.setItem(`${parentStorageKey}_user`, JSON.stringify(parentUser));
    
    // If parent has a parent (nested impersonation), restore that tracking
    // Example: Admin → ASM → RSM, when going back to ASM, restore Admin as ASM's parent
    if (parentParent && parentParentToken) {
      localStorage.setItem("parent_user", JSON.stringify(parentParent));
      localStorage.setItem("parent_token", parentParentToken);
    }
    
    // Ensure parent user has correct role
    if (!ROLE_ROUTES[String(parentUser.role || "").toUpperCase()]) {
      console.error("Invalid parent role:", parentUser.role);
      navigate("/LoginPage");
      return;
    }
    
    const targetRoute = ROLE_ROUTES[String(parentUser.role || "").toUpperCase()] || "/admin";
    console.log("Navigating to:", targetRoute, "for role:", parentUser.role, "with token:", parentToken ? "present" : "missing");
    
    // Use replace to avoid back button issues
    navigate(targetRoute, { replace: true });
  } catch (err) {
    console.error("Error in backToOriginalRole:", err);
    navigate("/LoginPage");
  }
};

export const backToPreviousRole = (navigate) => {
  let stack = JSON.parse(localStorage.getItem("impersonation_stack") || "[]");

  if (stack.length > 0) {
    // Remove current impersonation
    const current = stack.pop();
    localStorage.setItem("impersonation_stack", JSON.stringify(stack));

    // Clear impersonated token/user
    localStorage.removeItem(`${current.role.toLowerCase()}_token`);
    localStorage.removeItem(`${current.role.toLowerCase()}_user`);

    if (stack.length > 0) {
      // Restore previous impersonated role in localStorage
      const prev = stack[stack.length - 1];
      localStorage.setItem(`${prev.role.toLowerCase()}_token`, prev.token);
      localStorage.setItem(`${prev.role.toLowerCase()}_user`, JSON.stringify(prev.user));

      // Navigate to previous role dashboard
      const routeMap = {
        SUPER_ADMIN: "/admin",
        RSM: "/rsm",
        ASM: "/asm",
        RM: "/rm",
        PARTNER: "/partner",
        CUSTOMER: "/customer",
      };
      navigate(routeMap[prev.role] || "/LoginPage");
    } else {
      // If stack empty, fallback to original role
      const roles = ["super_admin", "rsm", "asm", "rm", "partner", "customer"];
      for (let role of roles) {
        const token = localStorage.getItem(`${role}_token`);
        if (token) {
          const routeMap = {
            super_admin: "/admin",
            rsm: "/rsm",
            asm: "/asm",
            rm: "/rm",
            partner: "/partner",
            customer: "/customer",
          };
          navigate(routeMap[role]);
          return;
        }
      }
      // No valid token, go login
      navigate("/LoginPage");
    }
  } else {
    // If stack empty, fallback to first valid token
    const roles = ["super_admin", "rsm", "asm", "rm", "partner", "customer"];
    for (let role of roles) {
      const token = localStorage.getItem(`${role}_token`);
      if (token) {
        const routeMap = {
          super_admin: "/admin",
          rsm: "/rsm",
          asm: "/asm",
          rm: "/rm",
          partner: "/partner",
          customer: "/customer",
        };
        navigate(routeMap[role]);
        return;
      }
    }
    navigate("/LoginPage");
  }
};

// Always go back to SUPER_ADMIN (Admin) directly, clearing all impersonations
// This logs out all accounts and goes directly to admin dashboard
export const backToAdmin = (navigate) => {
  const authData = getAuthData();
  
  // Try to get admin from main_parent first (if admin started the chain)
  // Otherwise try current admin token
  let adminToken = authData.mainParentToken || authData.adminToken;
  let adminUser = authData.mainParentUser || authData.adminUser;

  if (!adminToken || !adminUser) {
    // No admin session, fallback to login
    navigate("/LoginPage");
    return;
  }

  try {
    // Clear ALL non-admin auth & impersonation data
    const childRoles = ["asm", "rsm", "rm", "partner", "customer"];
    childRoles.forEach((role) => {
      localStorage.removeItem(`${role}_token`);
      localStorage.removeItem(`${role}_user`);
    });
    
    // Clear all impersonation tracking
    localStorage.removeItem("impersonation_stack");
    localStorage.removeItem("parent_user");
    localStorage.removeItem("parent_token");
    localStorage.removeItem("main_parent_user");
    localStorage.removeItem("main_parent_token");

    // Re-save admin auth to ensure it's the active session (not impersonating)
    saveAuthData(adminToken, adminUser, false);

    // Go straight to Admin dashboard
    navigate("/admin");
  } catch (err) {
    console.error("Error in backToAdmin:", err);
    navigate("/LoginPage");
  }
};

// Universal Login-As handler for Admin and senior managers
export const loginAsUser = async (userId, navigate) => {
  try {
    const authData = getAuthData();
    const currentToken =
      authData.adminToken ||
      authData.rsmToken ||
      authData.asmToken ||
      authData.rmToken ||
      authData.partnerToken;

    if (!currentToken) {
      toast.error("Not authenticated. Please log in.");
      return;
    }

    const res = await axios.post(
      `${backendurl}/auth/login-as/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${currentToken}` } }
    );

    const { token, user, parent } = res.data;

    const currentUser =
      authData.adminUser ||
      authData.rsmUser ||
      authData.asmUser ||
      authData.rmUser ||
      authData.partnerUser;
    const currentUserToken = currentToken;

    const parentInfo =
      parent || (currentUser ? { ...currentUser, token: currentUserToken } : null);

    saveAuthData(token, user, true, parentInfo);

    toast.success(`Logged in as ${user.firstName || ""} (${user.role})`);

    const routeMap = {
      SUPER_ADMIN: "/admin",
      ADMIN: "/admin",
      RSM: "/rsm",
      ASM: "/asm",
      RM: "/rm",
      PARTNER: "/partner",
      CUSTOMER: "/customer",
    };

    const targetRoute = routeMap[user.role] || routeMap[String(user.role).toUpperCase()] || "/admin";
    navigate(targetRoute);
  } catch (err) {
    console.error("Login as user failed:", err.response?.data || err.message);
    const msg = err.response?.data?.message || err.message || "Login as user failed";
    toast.error(msg);
  }
};
