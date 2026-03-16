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

// Get the original role that started the impersonation (check parent_user first)
export const getOriginalRole = () => {
  const authData = getAuthData();
  
  // First check if there's a parent user (we're impersonating)
  if (authData.parentUser) {
    const parent = authData.parentUser;
    const routeMap = {
      SUPER_ADMIN: "/admin",
      ASM: "/asm",
      RSM: "/rsm",
      RM: "/rm",
      PARTNER: "/partner",
      CUSTOMER: "/customer",
    };
    return { 
      role: parent.role, 
      displayName: formatRoleName(parent.role),
      route: routeMap[parent.role] || "/admin",
      user: parent
    };
  }
  
  // Fallback: Check in priority order: Admin > ASM > RM
  if (authData.adminToken) {
    return { role: "SUPER_ADMIN", displayName: "Admin", route: "/admin" };
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
  const parentUser = authData.parentUser;
  const parentToken = authData.parentToken;
  
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
    // Get current user role to clear (only the immediate child we're logging out of)
    const currentUser = authData.asmUser || authData.rsmUser || authData.rmUser || authData.partnerUser || authData.customerUser;
    const currentRole = currentUser?.role?.toLowerCase();
    
    // Only clear the current child session (e.g., RSM when going back to ASM)
    if (currentRole) {
      localStorage.removeItem(`${currentRole}_token`);
      localStorage.removeItem(`${currentRole}_user`);
    }
    
    // Get the impersonation stack to restore parent's parent if needed
    const stack = authData.impersonationStack || [];
    
    // Find the parent's entry in the stack to restore its parent tracking
    let parentParent = null;
    let parentParentToken = null;
    
    // Look for the parent in the stack to get its parent (for nested impersonations)
    for (let i = stack.length - 1; i >= 0; i--) {
      const entry = stack[i];
      if (entry.user && entry.user._id === parentUser._id) {
        // Found the parent's entry, get its parent
        parentParent = entry.parent;
        parentParentToken = entry.parent?.token;
        break;
      }
    }
    
    // Clear current parent tracking (we're restoring the parent, so it's no longer a parent)
    localStorage.removeItem("parent_user");
    localStorage.removeItem("parent_token");
    
    // Update impersonation stack - remove current entry
    const updatedStack = stack.filter(entry => {
      // Remove the current child's entry
      return !(currentUser && entry.user && entry.user._id === currentUser._id);
    });
    localStorage.setItem("impersonation_stack", JSON.stringify(updatedStack));
    
    // Restore parent session
    const parentRoleKey = parentUser.role.toLowerCase();
    localStorage.setItem(`${parentRoleKey}_token`, parentToken);
    localStorage.setItem(`${parentRoleKey}_user`, JSON.stringify(parentUser));
    
    // If parent has a parent (nested impersonation), restore that tracking
    // Example: Admin → ASM → RSM, when going back to ASM, restore Admin as ASM's parent
    if (parentParent && parentParentToken) {
      localStorage.setItem("parent_user", JSON.stringify(parentParent));
      localStorage.setItem("parent_token", parentParentToken);
    }
    
    // Ensure parent user has correct role
    if (parentUser.role !== "ASM" && parentUser.role !== "SUPER_ADMIN" && parentUser.role !== "RSM" && parentUser.role !== "RM" && parentUser.role !== "PARTNER" && parentUser.role !== "CUSTOMER") {
      console.error("Invalid parent role:", parentUser.role);
      navigate("/LoginPage");
      return;
    }
    
    // Navigate to parent role dashboard
    const routeMap = {
      SUPER_ADMIN: "/admin",
      ASM: "/asm",
      RSM: "/rsm",
      RM: "/rm",
      PARTNER: "/partner",
      CUSTOMER: "/customer",
    };
    
    const targetRoute = routeMap[parentUser.role] || "/admin";
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
        ASM: "/asm",
        RM: "/rm",
        PARTNER: "/partner",
        CUSTOMER: "/customer",
      };
      navigate(routeMap[prev.role] || "/LoginPage");
    } else {
      // If stack empty, fallback to original role
      const roles = ["super_admin", "asm", "rm", "partner", "customer"];
      for (let role of roles) {
        const token = localStorage.getItem(`${role}_token`);
        if (token) {
          const routeMap = {
            super_admin: "/admin",
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
    const roles = ["super_admin", "asm", "rm", "partner", "customer"];
    for (let role of roles) {
      const token = localStorage.getItem(`${role}_token`);
      if (token) {
        const routeMap = {
          super_admin: "/admin",
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
