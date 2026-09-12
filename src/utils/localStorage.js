const parseJson = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    // ignore parse errors in production
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("super_admin_token");
  localStorage.removeItem("super_admin_user");
  localStorage.removeItem("asm_token");
  localStorage.removeItem("asm_user");
  localStorage.removeItem("rsm_token");
  localStorage.removeItem("rsm_user");
  localStorage.removeItem("rm_token");
  localStorage.removeItem("rm_user");
  localStorage.removeItem("partner_token");
  localStorage.removeItem("partner_user");
  localStorage.removeItem("customer_token");
  localStorage.removeItem("customer_user");
  localStorage.removeItem("impersonation_stack");
  localStorage.removeItem("parent_user");
  localStorage.removeItem("parent_token");
  localStorage.removeItem("main_parent_user");
  localStorage.removeItem("main_parent_token");
};

/**
 * Clear child tokens when logging back to parent
 */
export const clearChildAuthData = () => {
  // Get current parent info
  const parent = parseJson("parent_user");
  if (!parent) return; // No parent, nothing to clear

  // Clear all child role tokens (roles lower in hierarchy than parent)
  // Standard Banking Hierarchy: SUPER_ADMIN > RSM (Senior) > ASM (Specialized) > RM > PARTNER > CUSTOMER
  const roleHierarchy = {
    SUPER_ADMIN: ["rsm", "asm", "rm", "partner", "customer"],
    RSM: ["asm", "rm", "partner", "customer"],
    ASM: ["rm", "partner", "customer"],
    RM: ["partner", "customer"],
  };

  const childRoles = roleHierarchy[parent.role] || [];
  childRoles.forEach((role) => {
    localStorage.removeItem(`${role}_token`);
    localStorage.removeItem(`${role}_user`);
  });

  // Clear parent tracking (but keep main_parent for admin access)
  localStorage.removeItem("parent_user");
  localStorage.removeItem("parent_token");
  // Note: main_parent_user and main_parent_token are kept for "Back to Admin" functionality
};

/**
 * Clear parent tokens when logging as child
 */
export const clearParentAuthData = () => {
  const parent = parseJson("parent_user");
  if (!parent) return; // No parent, nothing to clear

  const parentRoleKey = parent.role.toLowerCase();
  localStorage.removeItem(`${parentRoleKey}_token`);
  localStorage.removeItem(`${parentRoleKey}_user`);
};

export const saveAuthData = (token, user, impersonation = false, parent = null) => {
  if (!token || !user?.role) {
    return;
  }

  const roleKey = user.role.toLowerCase();
  try {
    // If impersonating, we need to handle parent tracking carefully
    if (impersonation && parent) {
      // Don't clear parent's token - we need it for nested impersonations
      // Instead, just store the parent info for "back to parent" functionality
      localStorage.setItem("parent_user", JSON.stringify(parent));
      localStorage.setItem("parent_token", parent.token || "");
      
      // Track main parent (admin) - check if parent is admin, or if main_parent already exists
      const mainParent = parseJson("main_parent_user");
      if (!mainParent) {
        // If no main parent exists, check if current parent is admin
        if (parent.role === "SUPER_ADMIN") {
          localStorage.setItem("main_parent_user", JSON.stringify(parent));
          localStorage.setItem("main_parent_token", parent.token || "");
        } else {
          // If parent is not admin, check if there's an admin token (admin is the root)
          const adminToken = localStorage.getItem("super_admin_token");
          const adminUser = parseJson("super_admin_user");
          if (adminToken && adminUser) {
            localStorage.setItem("main_parent_user", JSON.stringify(adminUser));
            localStorage.setItem("main_parent_token", adminToken);
          }
        }
      }
    }

    // Clear conflicting role tokens to prevent session cross-contamination
    const allRoles = ["super_admin", "rsm", "asm", "rm", "partner", "customer"];
    allRoles.forEach((r) => {
      if (r !== roleKey && (!impersonation || (parent && parent.role.toLowerCase() !== r))) {
        localStorage.removeItem(`${r}_token`);
        localStorage.removeItem(`${r}_user`);
      }
    });

    localStorage.setItem(`${roleKey}_token`, token);
    localStorage.setItem(`${roleKey}_user`, JSON.stringify(user));

    if (impersonation) {
      const stack = parseJson("impersonation_stack") || [];
      // Store parent info in stack entry for nested impersonation support
      stack.push({ role: user.role, token, user, parent, parentToken: parent?.token });
      localStorage.setItem("impersonation_stack", JSON.stringify(stack));
    }
  } catch (err) {
    // ignore localStorage save errors
  }
};

/**
 * Restore parent user session
 */
export const restoreParentAuth = () => {
  const parent = parseJson("parent_user");
  const parentToken = localStorage.getItem("parent_token");
  
  if (!parent || !parentToken) {
    return null;
  }

  // Clear current child session
  const currentUser = parseJson(`${parent.role.toLowerCase()}_user`);
  if (currentUser) {
    clearChildAuthData();
  }

  // Restore parent session
  saveAuthData(parentToken, parent, false);
  
  return { token: parentToken, user: parent };
};

export const getAuthData = () => {
  const adminToken = localStorage.getItem("super_admin_token");
  const asmToken = localStorage.getItem("asm_token");
  const rsmToken = localStorage.getItem("rsm_token");
  const rsmUser = parseJson("rsm_user");
  const asmUser = parseJson("asm_user");
  
  // Prioritize active role's token
  const managerToken =
    (rsmUser ? rsmToken : null) ||
    (asmUser ? asmToken : null) ||
    rsmToken ||
    asmToken ||
    adminToken ||
    null;

  return {
    adminToken,
    adminUser: parseJson("super_admin_user"),
    asmToken: (asmUser ? asmToken : null) || managerToken,
    asmUser,
    rsmToken: (rsmUser ? rsmToken : null) || managerToken,
    rsmUser,
    rawAsmToken: asmToken,
    rawRsmToken: rsmToken,
    rmToken: localStorage.getItem("rm_token"),
    rmUser: parseJson("rm_user"),
    partnerToken: localStorage.getItem("partner_token"),
    partnerUser: parseJson("partner_user"),
    customerToken: localStorage.getItem("customer_token"),
    customerUser: parseJson("customer_user"),
    impersonationStack: parseJson("impersonation_stack") || [],
    parentUser: parseJson("parent_user"),
    parentToken: localStorage.getItem("parent_token"),
    mainParentUser: parseJson("main_parent_user"),
    mainParentToken: localStorage.getItem("main_parent_token"),
  };
};

