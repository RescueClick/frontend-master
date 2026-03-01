const parseJson = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${key} from localStorage`, err);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("super_admin_token");
  localStorage.removeItem("super_admin_user");
  localStorage.removeItem("asm_token");
  localStorage.removeItem("asm_user");
  localStorage.removeItem("rm_token");
  localStorage.removeItem("rm_user");
  localStorage.removeItem("partner_token");
  localStorage.removeItem("partner_user");
  localStorage.removeItem("customer_token");
  localStorage.removeItem("customer_user");
  localStorage.removeItem("impersonation_stack");
  localStorage.removeItem("parent_user");
  localStorage.removeItem("parent_token");
};

/**
 * Clear child tokens when logging back to parent
 */
export const clearChildAuthData = () => {
  // Get current parent info
  const parent = parseJson("parent_user");
  if (!parent) return; // No parent, nothing to clear

  // Clear all child role tokens (roles lower in hierarchy than parent)
  const roleHierarchy = {
    SUPER_ADMIN: ["asm", "rm", "partner", "customer"],
    ASM: ["rm", "partner", "customer"],
    RM: ["partner", "customer"],
  };

  const childRoles = roleHierarchy[parent.role] || [];
  childRoles.forEach((role) => {
    localStorage.removeItem(`${role}_token`);
    localStorage.removeItem(`${role}_user`);
  });

  // Clear parent tracking
  localStorage.removeItem("parent_user");
  localStorage.removeItem("parent_token");
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
    console.error("Missing token or user role while saving auth data");
    return;
  }

  const roleKey = user.role.toLowerCase();
  try {
    // If impersonating, clear parent's token first
    if (impersonation && parent) {
      clearParentAuthData();
      // Store parent info for "back to parent" functionality
      localStorage.setItem("parent_user", JSON.stringify(parent));
      localStorage.setItem("parent_token", parent.token || "");
    }

    localStorage.setItem(`${roleKey}_token`, token);
    localStorage.setItem(`${roleKey}_user`, JSON.stringify(user));

    if (impersonation) {
      const stack = parseJson("impersonation_stack") || [];
      stack.push({ role: user.role, token, user, parent });
      localStorage.setItem("impersonation_stack", JSON.stringify(stack));
    }
  } catch (err) {
    console.error("Failed to save auth data:", err);
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
  return {
    adminToken: localStorage.getItem("super_admin_token"),
    adminUser: parseJson("super_admin_user"),
    asmToken: localStorage.getItem("asm_token"),
    asmUser: parseJson("asm_user"),
    rmToken: localStorage.getItem("rm_token"),
    rmUser: parseJson("rm_user"),
    partnerToken: localStorage.getItem("partner_token"),
    partnerUser: parseJson("partner_user"),
    customerToken: localStorage.getItem("customer_token"),
    customerUser: parseJson("customer_user"),
    impersonationStack: parseJson("impersonation_stack") || [],
    parentUser: parseJson("parent_user"),
    parentToken: localStorage.getItem("parent_token"),
  };
};

