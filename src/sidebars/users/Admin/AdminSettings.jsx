import React from "react";
import { getAuthData } from "../../../utils/localStorage";
import AccountSettings from "../common/AccountSettings";
import SettingsEmailCard from "../common/SettingsEmailCard";

const AdminSettings = () => (
  <AccountSettings
    pageTitle="Admin Settings"
    pageSubtitle="Update your login email and password. Super-admin profile is loaded when available."
    getAuthToken={() => getAuthData()?.adminToken ?? null}
    profileLinks={[]}
    children={<SettingsEmailCard roleKey="admin" />}
  />
);

export default AdminSettings;
