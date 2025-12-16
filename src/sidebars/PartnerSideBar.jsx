


import React, { useEffect, useState } from "react";
import {
  Users,
  Menu,
  LayoutGrid,
  Bell,
  Settings,
  LogOut,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  FileText,
  Calculator,
  IdCard
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PartnerProfile from "../components/PartnerProfile"; // ✅ Correct import
import { getAuthData } from "../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { fetchPartnerProfile } from "../feature/thunks/partnerThunks";
import logo from "../assets/logo.png";


// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    type: "success",
    title: "New Partner Registered",
    message: "ABC Financial Services has successfully registered as a partner.",
    time: "2 minutes ago",
    read: false
  },
  {
    id: 2,
    type: "warning",
    title: "System Maintenance",
    message: "Scheduled maintenance will occur tonight at 2:00 AM.",
    time: "1 hour ago",
    read: false
  },
  {
    id: 3,
    type: "info",
    title: "Monthly Report Ready",
    message: "Your monthly analytics report is now available for download.",
    time: "3 hours ago",
    read: true
  },
  {
    id: 4,
    type: "error",
    title: "Failed Transaction Alert",
    message: "Multiple transaction failures detected in the system.",
    time: "5 hours ago",
    read: true
  }
];

// Admin sidebar component
const PartnerSideBar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const location = useLocation();
  const dispatch = useDispatch();

  // Get user data from localStorage reactively (inside component)
  const getCurrentUser = () => {
    const {
      adminUser,
      asmUser,
      rmUser,
      partnerUser,
      customerUser,
    } = getAuthData();
    return adminUser || asmUser || rmUser || partnerUser || customerUser;
  };

  // Get current user reactively
  const currentUser = getCurrentUser();

  // Extract initials from name
  const initials = currentUser?.firstName
    ? currentUser?.firstName.charAt(0).toUpperCase()
    : "U"; // fallback "U" for unknown

  // Fetch partner profile from Redux
  const { loading, error, data } = useSelector((state) => state.partner?.profile);

  // Fetch profile when component mounts or token changes
  useEffect(() => {
    const { partnerToken } = getAuthData();
    if (partnerToken) {
      dispatch(fetchPartnerProfile());
    }
  }, [dispatch]);

  // Sidebar navigation items with icons and routes
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutGrid, path: "/partner/dashboard" },
    { name: "Customers", icon: Users, path: "/partner/customers" },
    { name: "Applications", icon: FileText, path: "/partner/applications" },
  { name: "Emi Calculator", icon: Calculator, path: "/partner/EmiCalculator" },
  { name: "KYC Details", icon: IdCard, path: "/partner/KYCDetails" }
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-55" : "w-20"
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
                className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r bg-teal-500 text-white shadow-lg transform scale-105"
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
                Partner Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg">
                   {(data?.firstName?.charAt(0) || currentUser?.firstName?.charAt(0) || "U").toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">
                    {data?.firstName && data?.lastName 
                      ? `${data.firstName} ${data.lastName}`
                      : currentUser?.firstName && currentUser?.lastName
                      ? `${currentUser.firstName} ${currentUser.lastName}`
                      : "Partner"}
                    </p>
                    <p className="text-xs text-gray-500">
                    {data?.email || currentUser?.email || "guest@example.com"}
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

      {/* Profile Side Panel */}
      {profileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
            onClick={() => setProfileOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-[700px] bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
            <div className="flex items-center justify-between p-1 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            {/* ✅ Full PartnerProfile inside side panel */}
            <PartnerProfile />
          </div>
        </>
      )}

      {/* Notifications Side Panel */}
      {notificationOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
            onClick={() => setNotificationOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Notifications ({notifications.length})
              </h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setNotificationOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  !notification.read
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="p-1 hover:bg-red-100 rounded transition-colors ml-2"
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PartnerSideBar;
