import React, { useEffect, useState, Suspense } from "react";
import {
  Users,
  UserCheck,
  Building2,
  Menu,
  Download,
  LayoutGrid,
  User,
  Settings,
  ArrowLeft,
  FileText,
  LineChart,
  BarChart2,
  ClipboardList,
  CalendarCheck,
  Edit,
  X,
  TrendingUp,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Profile from "./users/userProfile/Profile";
import { fetchRmProfile } from "../feature/thunks/rmThunks";
import { clearAuthData, getAuthData } from "../utils/localStorage";
import { backToOriginalRole, getOriginalRole, backToAdmin, formatRoleName } from "../utils/impersonation";
import { useDispatch, useSelector } from "react-redux";
import { brandLogo, COMPANY_NAME } from "../config/branding";
import NotificationBell from "../components/NotificationBell";
import DhanSourceLoader from "../components/DhanSourceLoader";

// Admin sidebar component
export default function RmSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Get Redux profile state
  const { loading, error, data } = useSelector((state) => state.rm.profile);

  // Fetch profile when component mounts or token changes
  useEffect(() => {
    const { rmToken } = getAuthData();
    if (rmToken) {
      dispatch(fetchRmProfile(rmToken));
    }
  }, [dispatch]);

  // Get fallback user data from localStorage (for initial render before Redux loads)
  const getFallbackUser = () => {
    const authData = getAuthData();
    return authData?.rmUser || null;
  };

  const fallbackUser = getFallbackUser();

  // Check if impersonating
  const { parentUser } = getAuthData();
  const isImpersonating = !!parentUser;
  const originalRole = getOriginalRole();

  // Sidebar navigation items with icons and routes
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutGrid, path: "/rm/dashboard" },
    { name: "My Partners", icon: UserCheck, path: "/rm/partners" },
    { name: "Manage Loans", icon: Users, path: "/rm/customers" },
    { name: "Follow Up", icon: CalendarCheck, path: "/rm/Follow-up" },
    { name: "Leads & Pipeline", icon: LineChart, path: "/rm/leads" },
    { name: "Settings", icon: Settings, path: "/rm/settings" },
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
        className={`${sidebarOpen ? "w-60" : "w-20"} shrink-0 bg-white shadow-xl transition-all duration-300 flex flex-col sticky top-0 h-screen border-r border-gray-200 overflow-x-hidden`}
      >
        {/* Logo — match Admin */}
        <div
          className={`flex w-full min-w-0 items-center border-b border-gray-800 py-5 min-h-[72px] ${
            sidebarOpen ? "justify-start px-4 gap-3" : "justify-center px-2"
          }`}
        >
          <div className="w-full min-w-0 h-[55px] rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <img src={brandLogo} alt={COMPANY_NAME} className="h-full w-full object-cover" />
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
                RM Dashboard
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
                    {(data?.firstName?.charAt(0) || fallbackUser?.firstName?.charAt(0) || "U").toUpperCase()}
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
          <Suspense
            fallback={
              <DhanSourceLoader label="Loading page…" className="min-h-[50vh]" />
            }
          >
            <Outlet />
          </Suspense>
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


            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
              <Profile
                setProfileOpen={setProfileOpen}
                data={data}
                roleLabel="Relationship Manager"
                editPath="/rm/EditProfile"
                onLogout={handleLogout}
              />
            </div>



          </div>
        </>
      )}

    </div>
  );
}
