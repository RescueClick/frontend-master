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
import { restoreParentAuth, getAuthData, clearChildAuthData } from "./localStorage";

// Get the original role that started the impersonation (check parent_user first)
export const getOriginalRole = () => {
  const authData = getAuthData();
  
  // First check if there's a parent user (we're impersonating)
  if (authData.parentUser) {
    const parent = authData.parentUser;
    const routeMap = {
      SUPER_ADMIN: "/admin",
      ASM: "/asm",
      RM: "/rm",
      PARTNER: "/partner",
      CUSTOMER: "/customer",
    };
    return { 
      role: parent.role, 
      route: routeMap[parent.role] || "/admin",
      user: parent
    };
  }
  
  // Fallback: Check in priority order: Admin > ASM > RM
  if (authData.adminToken) {
    return { role: "SUPER_ADMIN", route: "/admin" };
  }
  if (authData.asmToken) {
    return { role: "ASM", route: "/asm" };
  }
  if (authData.rmToken) {
    return { role: "RM", route: "/rm" };
  }
  return null;
};

// Go back to the original role's dashboard (Admin/ASM/RM)
export const backToOriginalRole = (navigate) => {
  const originalRole = getOriginalRole();
  
  if (originalRole) {
    // Restore parent auth (this clears child tokens and restores parent)
    const restored = restoreParentAuth();
    
    if (restored) {
      // Navigate to parent role
      navigate(originalRole.route);
    } else {
      // Fallback: clear everything and go to login
      clearChildAuthData();
      navigate("/LoginPage");
    }
  } else {
    // Fallback: clear everything and go to login
    clearChildAuthData();
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
  