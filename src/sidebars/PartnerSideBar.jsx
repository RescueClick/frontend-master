


import React, { useState, useEffect } from "react";
import {
  Menu,
  LayoutGrid,
  Settings,
  ArrowLeft,
  FileText,
  Calculator,
  IdCard,
  Target,
  Award,
  IndianRupee,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAuthData } from "../utils/localStorage";
import { getOriginalRole, backToAdmin } from "../utils/impersonation";
import { fetchPartnerProfile } from "../feature/thunks/partnerThunks";
import PartnerProfile from "../components/PartnerProfile";
import logo from "../assets/logo.png";
import NotificationBell from "../components/NotificationBell";

// Admin sidebar component
const PartnerSideBar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: profileData } = useSelector((state) => state.partner?.profile || { data: null });

  const getCurrentUser = () => {
    const { adminUser, asmUser, rmUser, partnerUser, customerUser } = getAuthData();
    return adminUser || asmUser || rmUser || partnerUser || customerUser;
  };
  const currentUser = getCurrentUser();

  useEffect(() => {
    const { partnerToken } = getAuthData();
    if (partnerToken) dispatch(fetchPartnerProfile());
  }, [dispatch]);

  // Check if impersonating
  const { parentUser } = getAuthData();
  const isImpersonating = !!parentUser;
  const originalRole = getOriginalRole();

  // Sidebar navigation items with icons and routes
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutGrid, path: "/partner/dashboard" },
    { name: "Applications", icon: FileText, path: "/partner/applications" },
    { name: "My Target", icon: Target, path: "/partner/my-target" },
    { name: "Incentive History", icon: Award, path: "/partner/incentives" },
    { name: "Payout History", icon: IndianRupee, path: "/partner/payouts" },
    { name: "Emi Calculator", icon: Calculator, path: "/partner/EmiCalculator" },
    { name: "KYC Details", icon: IdCard, path: "/partner/KYCDetails" },
    { name: "Settings", icon: Settings, path: "/partner/settings" },
  ];


  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-60" : "w-20"
        } bg-white shadow-xl transition-all duration-300 flex flex-col sticky top-0 h-screen border-r border-gray-200`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
          <div className="w-10 h-10  rounded-lg flex items-center justify-center ">
              <span className="text-white font-bold text-lg">
                <img src={logo} alt="logo" />
              </span>
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold text-gray-800 tracking-wide">
                TRUSTLINE
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 overflow-y-auto px-3">
          {sidebarItems.map((item, index) => {
            const active = location.pathname === item.path;

            const baseClasses =
              "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

            const activeClasses =
              "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md";

            return (
              <Link
                key={index}
                to={item.path}
                className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
                  active ? activeClasses : baseClasses
                }`}
              >
                <item.icon size={22} className={active ? "text-white" : ""} />
                {sidebarOpen && (
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                Partner Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Go Back Buttons - Show when impersonating */}
              {isImpersonating && originalRole && (
                <>
                  {/* Back directly to Admin if available */}
                  <button
                    onClick={() => backToAdmin(navigate)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium"
                    title="Back to Admin Dashboard (exit all impersonations)"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Admin</span>
                  </button>
                </>
              )}
              {/* Notifications */}
              <NotificationBell />

              {/* Profile — opens slide-out panel on the right */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-gray-100"
                  aria-expanded={profileOpen}
                  aria-label="Open profile"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-sm font-semibold text-white shadow-lg">
                    {(profileData?.firstName?.charAt(0) || currentUser?.firstName?.charAt(0) || "P").toUpperCase()}
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium text-gray-800">
                      {profileData?.firstName && profileData?.lastName
                        ? `${profileData.firstName} ${profileData.lastName}`
                        : currentUser?.firstName && currentUser?.lastName
                          ? `${currentUser.firstName} ${currentUser.lastName}`
                          : "Partner"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profileData?.email || currentUser?.email || ""}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-2 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Profile slide-out panel (right) */}
      {profileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            aria-label="Close profile"
            onClick={() => setProfileOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[min(100vw,700px)] flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
              <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <PartnerProfile />
          </div>
        </>
      )}
    </div>
  );
};

export default PartnerSideBar;
