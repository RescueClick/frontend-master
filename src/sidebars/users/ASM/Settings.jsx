// SettingsPage.jsx
import React from "react";

const Setting = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] p-6">
      
      {/* Page Header */}
      <header className="bg-[#1E3A8A] text-white p-4 rounded-lg mb-8 shadow">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm opacity-80">Manage your profile, preferences, and security</p>
      </header>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* User Profile Settings */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-[#1E3A8A] mb-4">User Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <img
              src="https://via.placeholder.com/80"
              alt="Profile"
              className="w-20 h-20 rounded-full border-2 border-brand-primary"
            />
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-gray-500">ASM Manager</p>
            </div>
          </div>
          <form className="space-y-3">
            <input type="email" placeholder="Email" className="w-full p-2 border rounded-lg" />
            <input type="tel" placeholder="Phone" className="w-full p-2 border rounded-lg" />
            <input type="text" placeholder="Designation" className="w-full p-2 border rounded-lg" />
          </form>
        </section>

        {/* Account Settings */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-[#1E3A8A] mb-4">Account Settings</h2>
          <form className="space-y-3">
            <input type="password" placeholder="New Password" className="w-full p-2 border rounded-lg" />
            <div className="flex items-center justify-between">
              <label className="font-medium">Two-factor Authentication</label>
              <input type="checkbox" className="toggle accent-brand-primary" />
            </div>
            <button className="w-full py-2 rounded-lg bg-brand-primary text-white font-medium">View Login Activity</button>
          </form>
        </section>

        {/* Dashboard Preferences */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-[#1E3A8A] mb-4">Dashboard Preferences</h2>
          <form className="space-y-3">
            <div className="flex items-center justify-between">
              <label>Theme</label>
              <select className="p-2 border rounded-lg">
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label>Default Landing Page</label>
              <select className="p-2 border rounded-lg">
                <option>Overview</option>
                <option>Transactions</option>
                <option>Reports</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label>Data Refresh Frequency</label>
              <select className="p-2 border rounded-lg">
                <option>5 min</option>
                <option>15 min</option>
                <option>1 hour</option>
              </select>
            </div>
          </form>
        </section>

        {/* Notification Settings */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-[#1E3A8A] mb-4">Notification Settings</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label>Email Notifications</label>
              <input type="checkbox" className="toggle accent-brand-primary" />
            </div>
            <div className="flex justify-between items-center">
              <label>SMS Notifications</label>
              <input type="checkbox" className="toggle accent-brand-primary" />
            </div>
            <div className="flex justify-between items-center">
              <label>Transaction Alerts</label>
              <input type="checkbox" className="toggle accent-brand-primary" />
            </div>
            <div className="flex justify-between items-center">
              <label>Performance Alerts</label>
              <input type="checkbox" className="toggle accent-brand-primary" />
            </div>
          </div>
        </section>

        {/* Privacy & Permissions */}
        <section className="bg-white rounded-2xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-[#1E3A8A] mb-4">Privacy & Permissions</h2>
          <form className="space-y-3">
            <div className="flex items-center justify-between">
              <label>Role-based Access</label>
              <select className="p-2 border rounded-lg">
                <option>Manager</option>
                <option>Team Lead</option>
                <option>Viewer</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label>Data Visibility</label>
              <select className="p-2 border rounded-lg">
                <option>All Data</option>
                <option>Restricted</option>
                <option>Custom</option>
              </select>
            </div>
          </form>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <button className="px-6 py-2 rounded-lg bg-gray-300 text-[#111827]">Cancel</button>
        <button className="px-6 py-2 rounded-lg bg-brand-primary text-white">Save Changes</button>
      </div>
    </div>
  );
};

export default Setting;