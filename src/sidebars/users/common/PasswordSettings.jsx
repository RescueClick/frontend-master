import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getAuthData } from "../../../utils/localStorage";
import AccountSettings from "./AccountSettings";
import SettingsEmailCard from "./SettingsEmailCard";

function getActiveToken() {
  const auth = getAuthData();
  return (
    auth.adminToken ||
    auth.asmToken ||
    auth.rsmToken ||
    auth.rmToken ||
    auth.partnerToken ||
    auth.customerToken ||
    null
  );
}

function pageTitleForPath(pathname) {
  if (pathname.startsWith("/asm")) return "ASM Settings";
  if (pathname.startsWith("/rsm")) return "RSM Settings";
  if (pathname.startsWith("/rm")) return "RM Settings";
  if (pathname.startsWith("/partner")) return "Partner Settings";
  return "Settings";
}

function emailRoleForPath(pathname) {
  if (pathname.startsWith("/partner")) return "partner";
  if (pathname.startsWith("/asm")) return "asm";
  if (pathname.startsWith("/rm")) return "rm";
  if (pathname.startsWith("/rsm")) return "rsm";
  return null;
}

/**
 * Account center: edit profile (where available), login email, password.
 */
const PasswordSettings = () => {
  const { pathname } = useLocation();
  const pageTitle = useMemo(() => pageTitleForPath(pathname), [pathname]);
  const emailRole = useMemo(() => emailRoleForPath(pathname), [pathname]);

  const profileLinks = useMemo(() => {
    if (pathname.startsWith("/asm")) {
      return [
        {
          to: "/asm/EditProfile",
          label: "Edit profile",
          hint: "Personal details, address & region",
        },
      ];
    }
    if (pathname.startsWith("/rsm")) {
      return [
        {
          to: "/rsm/EditProfile",
          label: "Edit profile",
          hint: "Name, contact & region",
        },
      ];
    }
    if (pathname.startsWith("/rm")) {
      return [
        {
          to: "/rm/EditProfile",
          label: "Edit profile",
          hint: "Name, contact & experience",
        },
      ];
    }
    if (pathname.startsWith("/partner")) {
      return [
        {
          to: "/partner/edit-profile",
          label: "Edit profile",
          hint: "Name, contact & region (not in sidebar — open from here)",
          state: { from: pathname },
        },
      ];
    }
    return [];
  }, [pathname]);

  const pageSubtitle = useMemo(() => {
    if (pathname.startsWith("/partner")) {
      return "Edit profile, login email, and password.";
    }
    return "Update your profile, login email, and password — all in one place.";
  }, [pathname]);

  return (
    <AccountSettings
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      getAuthToken={getActiveToken}
      profileLinks={profileLinks}
      children={emailRole ? <SettingsEmailCard roleKey={emailRole} /> : null}
    />
  );
};

export default PasswordSettings;
