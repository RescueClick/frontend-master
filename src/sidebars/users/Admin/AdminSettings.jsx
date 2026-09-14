import React from "react";
import { getAuthData } from "../../../utils/localStorage";
import AccountSettings from "../common/AccountSettings";
import SettingsEmailCard from "../common/SettingsEmailCard";
import CustomerSupportSettingsCard from "./CustomerSupportSettingsCard";

const AdminSettings = () => (
  <AccountSettings
    pageTitle="Admin Settings"
    pageSubtitle="Manage admin credentials, system security, and customer mobile app support channels."
    getAuthToken={() => getAuthData()?.adminToken ?? null}
    profileLinks={[]}
    children={<SettingsEmailCard roleKey="admin" />}
    afterSections={<CustomerSupportSettingsCard />}
  />
);

export default AdminSettings;
