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
  MessageSquare,
  Search,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Profile from "./users/userProfile/Profile";
import { fetchRsmProfile } from "../feature/thunks/rsmThunks";
import { clearAuthData, getAuthData } from "../utils/localStorage";
import { backToOriginalRole, getOriginalRole, backToAdmin, formatRoleName } from "../utils/impersonation";
import { useDispatch, useSelector } from "react-redux";
import { brandLogo, COMPANY_NAME } from "../config/branding";
import NotificationBell from "../components/NotificationBell";
import DhanSourceLoader from "../components/DhanSourceLoader";
import { useSidebarNotifications } from "../hooks/useSidebarNotifications";
import StaffChatWidget from "./users/shared/chat/StaffChatWidget";

// RSM sidebar component
const RsmSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [profileOpen, setProfileOpen] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Responsive sidebar: auto-close on mobile resize / initial
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-close sidebar on mobile navigation
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Get Redux profile state
  const { loading, error, data } = useSelector((state) => state.rsm.profile);

  // Fetch profile when component mounts or token changes
  useEffect(() => {
    const { rsmToken, asmToken } = getAuthData();
    const token = asmToken || rsmToken;
    if (token) {
      dispatch(fetchRsmProfile(token));
    }
  }, [dispatch]);

  // Get fallback user data from localStorage (for initial render before Redux loads)
  const getFallbackUser = () => {
    const authData = getAuthData();
    return authData?.asmUser || authData?.rsmUser || null;
  };

  const fallbackUser = getFallbackUser();

  // Check if impersonating
  const { parentUser } = getAuthData();
  const isImpersonating = !!parentUser;
  const originalRole = getOriginalRole();

  const counts = useSidebarNotifications();

  const getBadgeCount = (name) => {
    switch (name) {
      case "Chat":
        return counts.chat;
      case "Applications":
        return counts.application;
      default:
        return 0;
    }
  };

  // Sidebar navigation items with icons and routes
  // Hierarchy: RSM manages ASMs (/rsm/asms); ASM manages RMs (/asm/rms)
  const basePath = location.pathname.startsWith("/rsm") ? "/rsm" : "/asm";
  const subordinateLabel = basePath === "/rsm" ? "My ASMs" : "My RMs";
  const subordinatePath = basePath === "/rsm" ? `${basePath}/asms` : `${basePath}/rms`;
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutGrid, path: `${basePath}/dashboard` },
    { name: subordinateLabel, icon: Users, path: subordinatePath },
    { name: "Partners", icon: UserCheck, path: `${basePath}/partners` },
    { name: "Applications", icon: FileText, path: `${basePath}/applications` },
    { name: "Follow Up", icon: CalendarCheck, path: `${basePath}/follow-ups` },
    { name: "Banks", icon: Building2, path: `${basePath}/banks`, highlight: true },
    { name: "Find Bank RM", icon: Search, path: `${basePath}/find-bank-rm` },
    { name: "Settings", icon: Settings, path: `${basePath}/settings` },
  ];

  // Logout function
  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 h-full bg-white shadow-xl transition-all duration-300 flex flex-col border-r border-gray-200 shrink-0 ${
          sidebarOpen
            ? "translate-x-0 w-60"
            : "-translate-x-full md:w-20"
        }`}
      >
        {/* Logo — match Admin */}
        <div
          className={`flex w-full min-w-0 items-center border-b border-gray-200 py-4 md:py-5 min-h-[64px] md:min-h-[72px] ${
            sidebarOpen ? "justify-between px-4" : "justify-center px-2"
          }`}
        >
          <div className="w-full min-w-0 h-10 md:h-[72px] rounded-lg flex items-center justify-center shrink-0 overflow-hidden px-1">
            <img src={brandLogo} alt={COMPANY_NAME} className="h-full w-full object-cover object-center" />
          </div>
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 ml-1"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-4 md:mt-6 flex-1 overflow-y-auto px-3">
          {sidebarItems.map((item, index) => {
            const active = location.pathname === item.path;
            const isHighlight = item.highlight;
            const count = getBadgeCount(item.name);

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
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center mb-2 rounded-xl transition-all duration-200 ${
                  sidebarOpen ? "space-x-3 px-4 py-3" : "justify-center px-2 py-3"
                } ${active ? activeClasses : baseClasses}`}
              >
                <div className="relative flex items-center">
                  <item.icon size={22} className={active ? "text-white" : ""} />
                  {!sidebarOpen && count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="text-sm font-medium truncate">
                      {item.name}
                    </span>
                    {count > 0 && (
                      <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active 
                          ? "bg-white text-teal-600" 
                          : isHighlight 
                            ? "bg-amber-500 text-white shadow-sm" 
                            : "bg-rose-500 text-white shadow-sm"
                      }`}>
                        {count}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <h1 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
                {basePath === "/asm" ? "ASM Dashboard" : "RSM Dashboard"}
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Go Back Buttons - Show when impersonating */}
              {isImpersonating && originalRole && (
                <>
                  {/* Back directly to Admin if available */}
                  <button
                    onClick={() => backToAdmin(navigate)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium"
                    title="Back to Admin Dashboard (exit all impersonations)"
                  >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Back to Admin</span>
                  </button>
                </>
              )}
              {/* Notifications */}
              <NotificationBell />

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="cursor-pointer w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-sm text-xs sm:text-sm">
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
        <main className="flex-1 p-2 sm:p-3 md:p-4 bg-gray-50 overflow-y-auto min-w-0">
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
                roleLabel="Regional Sales Manager"
                editPath="/rsm/EditProfile"
                onLogout={handleLogout}
              />
            </div>
          </div>
        </>
      )}

      {/* Floating Bottom-Right Staff Chat Widget */}
      <StaffChatWidget currentRole="ASM" />
    </div>
  );
};

export default RsmSidebar;
