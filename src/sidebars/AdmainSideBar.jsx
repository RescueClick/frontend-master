import React, { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Building2,
  Menu,
  Download,
  LayoutGrid,
  User,
  Settings,
  LogOut,
  TrendingUp,
  ArrowLeft,
  Trash2,
  IndianRupee,
  Award,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Profile from "./users/userProfile/Profile";
import { getAuthData, clearAuthData } from "../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile } from "../feature/thunks/adminThunks";
import { backToOriginalRole, getOriginalRole, backToAdmin, formatRoleName } from "../utils/impersonation";

import logo from "../assets/logo.png";
import NotificationBell from "../components/NotificationBell";

// Admin sidebar component
const AdminSideBar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get Redux profile state
  const { loading, error, data } = useSelector((state) => state.admin?.profile);

  // Fetch profile when component mounts or token changes
  useEffect(() => {
    const { adminToken } = getAuthData();
    if (adminToken) {
      dispatch(fetchAdminProfile(adminToken));
    }
  }, [dispatch]);

  // Get fallback user data from localStorage (for initial render before Redux loads)
  const getFallbackUser = () => {
    const authData = getAuthData();
    return authData?.adminUser || null;
  };

  const fallbackUser = getFallbackUser();

  // Check if impersonating (check for parent_user)
  const { parentUser } = getAuthData();
  const isImpersonating = !!parentUser;
  const originalRole = getOriginalRole();

  // Sidebar navigation items with icons and routes
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutGrid, path: "/admin/dashboard" },
    { name: "ASM", icon: Users, path: "/admin/ASM" },
    { name: "RSM", icon: Users, path: "/admin/RSM" },
    { name: "RM", icon: Users, path: "/admin/RM" },
    { name: "Partner", icon: UserCheck, path: "/admin/partner" },
    { name: "Customer", icon: Users, path: "/admin/customer" },
    { name: "Payout", icon: IndianRupee, path: "/admin/payout" },
    { name: "Incentives", icon: Award, path: "/admin/incentives" },
    { name: "Set Target", icon: TrendingUp, path: "/admin/target" },
    { name: "Banner", icon: Download, path: "/admin/banner" },
    { name: "Admin → Partner", icon: UserCheck, path: "/admin/RM-partner" },
    { name: "Banks", icon: Building2, path: "/admin/banks" },
    {
      name: "Delete Requests",
      icon: Trash2,
      path: "/admin/delete-requests",
    },
  ];


  // Logout function for admin
  const handleLogout = () => {

    clearAuthData();

    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-55" : "w-20"
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
            return (
              <Link
                key={index}
                to={item.path}
                className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${active
                  ? "bg-gradient-to-r bg-teal-500  text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
              >
                <item.icon size={22} className={active ? "text-white" : ""} />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.name}</span>
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
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Go Back Buttons - Show when impersonating */}
              {isImpersonating && originalRole && (
                <>
                  {/* Back to immediate parent */}
                  <button
                    onClick={() => backToOriginalRole(navigate)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    title={`Go back to ${originalRole.displayName || formatRoleName(originalRole.role)} Panel`}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to {originalRole.displayName || formatRoleName(originalRole.role)}</span>
                  </button>
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

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="cursor-pointer flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="cursor-pointer w-9 h-9 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg">
                    {(data?.firstName?.charAt(0) || fallbackUser?.firstName?.charAt(0) || "T").toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {data?.firstName || fallbackUser?.firstName || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {data?.email || fallbackUser?.email || ""}
                    </p>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-2">
                    <button
                      className="cursor-pointer w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        handleLogout()
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminSideBar;