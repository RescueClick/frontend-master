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
  ArrowLeft,
  FileText,
  LineChart,
  BarChart2,
  ClipboardList,
  Phone,
  Mail,
  Calendar,
  CalendarCheck,
  Briefcase,
  MapPin,
  Edit,
  X,
  TrendingUp,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Profile from "./users/userProfile/Profile";
import { fetchRsmProfile } from "../feature/thunks/rsmThunks";
import { clearAuthData, getAuthData } from "../utils/localStorage";
import { backToOriginalRole, getOriginalRole, backToAdmin, formatRoleName } from "../utils/impersonation";
import { useDispatch, useSelector } from "react-redux";
import logo from "../assets/logo.png";
import NotificationBell from "../components/NotificationBell";

// RSM sidebar component
const RsmSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Get Redux profile state
  const { loading, error, data } = useSelector((state) => state.rsm.profile);

  // Fetch profile when component mounts or token changes
  useEffect(() => {
    const { rsmToken } = getAuthData();
    if (rsmToken) {
      dispatch(fetchRsmProfile(rsmToken));
    }
  }, [dispatch]);

  // Get fallback user data from localStorage (for initial render before Redux loads)
  const getFallbackUser = () => {
    const authData = getAuthData();
    return authData?.rsmUser || null;
  };

  const fallbackUser = getFallbackUser();

  // Check if impersonating
  const { parentUser } = getAuthData();
  const isImpersonating = !!parentUser;
  const originalRole = getOriginalRole();

  // Sidebar navigation items with icons and routes
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutGrid, path: "/rsm/dashboard" },
    { name: "My RMs", icon: Users, path: "/rsm/rms" },
    { name: "Applications", icon: FileText, path: "/rsm/applications" },
    { name: "Follow Up", icon: CalendarCheck, path: "/rsm/follow-ups" },
    // highlight banks for RSM
    { name: "Banks", icon: Building2, path: "/rsm/banks", highlight: true },
    //   { name: "Analytics", icon: BarChart2, path: "/rsm/analytics" },
    { name: "Settings", icon: Settings, path: "/rsm/settings" },
  ];

  // Logout function
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
            const isHighlight = item.highlight;

            const baseClasses = isHighlight
              ? "text-amber-700 hover:bg-amber-50 hover:text-amber-900"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

            const activeClasses = isHighlight
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md";

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
                RSM Dashboard
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

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="cursor-pointer w-9 h-9 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg">
                    {(data?.firstName?.charAt(0) || fallbackUser?.firstName?.charAt(0) || "R").toUpperCase()}
                  </div>
                  <div className="cursor-pointer hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {data?.firstName && data?.lastName
                        ? `${data.firstName} ${data.lastName}`
                        : fallbackUser?.firstName && fallbackUser?.lastName
                        ? `${fallbackUser.firstName} ${fallbackUser.lastName}`
                        : "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {data?.employeeId || fallbackUser?.employeeId || "N/A"}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-3 bg-gray-50 overflow-y-auto">
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
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
              <button
                onClick={() => setProfileOpen(false)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Profile Actions */}
            <div className="">
              <div className="h-full w-full bg-white shadow-lg z-50 flex flex-col max-h-[90vh]">
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {/* Avatar & Name */}
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-20 h-20 rounded-full bg-[#12B99C] flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                        {data?.firstName?.charAt(0) || "R"}
                      </div>
                      <h2 className="text-2xl font-semibold text-[#111827] mb-2">
                        {data?.firstName + " " + data?.lastName || "Update your Name"}
                      </h2>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-6">
                      {/* Mobile No */}
                      <div className="flex items-start gap-4">
                        <Phone className="w-5 h-5 text-[#12B99C]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-500">Mobile No</p>
                          <p className="text-[#111827]">
                            {data?.phone || "Update your Mobile No"}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-4">
                        <Mail className="w-5 h-5 text-[#12B99C]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-500">Email</p>
                          <p className="text-[#111827]">
                            {data?.email || "Update your Email"}
                          </p>
                        </div>
                      </div>

                      {/* DOB */}
                      <div className="flex items-start gap-4">
                        <Calendar className="w-5 h-5 text-[#12B99C]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-500">Date of Birth</p>
                          <p className="text-[#111827]">
                            {data?.dob
                              ? new Date(data.dob).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              : "Update your DOB"}
                          </p>
                        </div>
                      </div>

                      {/* DOJ */}
                      <div className="flex items-start gap-4">
                        <Briefcase className="w-5 h-5 text-[#12B99C]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-500">Date of Joining</p>
                          <p className="text-[#111827]">
                            {data?.JoiningDate
                              ? new Date(data?.JoiningDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              : "Update your DOJ"}
                          </p>
                        </div>
                      </div>

                      {/* Region */}
                      <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-[#12B99C]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-500">Region</p>
                          <p className="text-[#111827]">
                            {data?.region || "Update your Region"}
                          </p>
                        </div>
                      </div>

                      {/* ASM Details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-[#12B99C]" />
                          <p className="text-sm font-semibold text-gray-500">ASM Details</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <span className="text-sm font-semibold text-gray-600">Name</span>
                                  <p className="text-gray-800 font-medium">{data?.asmName || "Update Name"}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-gray-600">Phone</span>
                                  <p className="text-gray-800 font-medium">{data?.asmPhone || "Update Phone"}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-gray-600">ASM ID</span>
                                  <p className="text-gray-800 font-medium">{data?.asmEmployeeId || "Update ASM ID"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Logout */}
                    <div className="mt-4">
                      <div className="flex items-center gap-3 cursor-pointer hover:text-red-500"
                        onClick={() => { handleLogout() }}
                      >
                        <LogOut className="w-5 h-5" />
                        <p className="text-[#111827]">Log Out</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RsmSidebar;
