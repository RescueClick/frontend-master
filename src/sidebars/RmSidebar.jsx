import React, { useEffect, useState, useMemo, Suspense } from "react";
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
  QrCode,
  UserPlus,
  Target,
  PhoneCall,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Profile from "./users/userProfile/Profile";
import { fetchRmProfile } from "../feature/thunks/rmThunks";
import { clearAuthData, getAuthData } from "../utils/localStorage";
import { backToOriginalRole, getReturnRole } from "../utils/impersonation";
import { useDispatch, useSelector } from "react-redux";
import { brandLogo, COMPANY_NAME } from "../config/branding";
import NotificationBell from "../components/NotificationBell";
import DhanSourceLoader from "../components/DhanSourceLoader";
import { useSidebarNotifications } from "../hooks/useSidebarNotifications";
import StaffChatWidget from "./users/shared/chat/StaffChatWidget";

// Admin sidebar component
export default function RmSidebar() {
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

  // Show a return button whenever this RM session was opened from ASM, RSM, or Admin
  const returnRole = getReturnRole();

  const counts = useSidebarNotifications();

  const getBadgeCount = (name) => {
    switch (name) {
      case "Chat":
        return counts.chat;
      case "My Partners":
        return counts.partner;
      case "Manage Loans":
        return counts.application;
      default:
        return 0;
    }
  };

  const activeRmUser = data || fallbackUser;
  const rmType = activeRmUser?.rmType || "HYBRID";
  const isCustomerDesk = rmType === "CUSTOMER";
  const isPartnerDesk = rmType === "PARTNER";

  // Sidebar navigation items tailored by RM desk type
  const sidebarSections = useMemo(() => {
    if (isCustomerDesk) {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          path: "/rm/dashboard",
          isDirect: true,
        },
        {
          id: "calling",
          label: "Calling & Pipeline",
          icon: PhoneCall,
          items: [
            { name: "Calling & Follow-Up", icon: PhoneCall, path: "/rm/Follow-up", highlight: true },
            { name: "Leads & Pipeline", icon: LineChart, path: "/rm/leads" },
          ],
        },
        {
          id: "loans",
          label: "Loans & Performance",
          icon: Users,
          items: [
            { name: "Manage Loans", icon: Users, path: "/rm/customers" },
            { name: "My Targets", icon: Target, path: "/rm/targets" },
          ],
        },
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          path: "/rm/settings",
          isDirect: true,
        },
      ];
    }
    if (isPartnerDesk) {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          path: "/rm/dashboard",
          isDirect: true,
        },
        {
          id: "network",
          label: "Partner Network",
          icon: UserCheck,
          items: [
            { name: "My Partners", icon: UserCheck, path: "/rm/partners" },
            { name: "Add Partner", icon: UserPlus, path: "/rm/add-partner", highlight: true },
            { name: "Assign QR", icon: QrCode, path: "/rm/qr-assign", highlight: true },
          ],
        },
        {
          id: "calling",
          label: "Calling & Loans",
          icon: PhoneCall,
          items: [
            { name: "Calling & Follow-Up", icon: PhoneCall, path: "/rm/Follow-up", highlight: true },
            { name: "Manage Loans", icon: Users, path: "/rm/customers" },
            { name: "My Targets", icon: Target, path: "/rm/targets" },
          ],
        },
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          path: "/rm/settings",
          isDirect: true,
        },
      ];
    }
    return [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutGrid,
        path: "/rm/dashboard",
        isDirect: true,
      },
      {
        id: "calling",
        label: "Calling & Pipeline",
        icon: PhoneCall,
        items: [
          { name: "Calling & Follow-Up", icon: PhoneCall, path: "/rm/Follow-up", highlight: true },
          { name: "Leads & Pipeline", icon: LineChart, path: "/rm/leads" },
        ],
      },
      {
        id: "network",
        label: "Partner Network",
        icon: UserCheck,
        items: [
          { name: "My Partners", icon: UserCheck, path: "/rm/partners" },
          { name: "Add Partner", icon: UserPlus, path: "/rm/add-partner", highlight: true },
          { name: "Assign QR", icon: QrCode, path: "/rm/qr-assign", highlight: true },
        ],
      },
      {
        id: "loans",
        label: "Loans & Performance",
        icon: Users,
        items: [
          { name: "Manage Loans", icon: Users, path: "/rm/customers" },
          { name: "My Targets", icon: Target, path: "/rm/targets" },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/rm/settings",
        isDirect: true,
      },
    ];
  }, [isCustomerDesk, isPartnerDesk]);

  const isItemActive = (item) => {
    if (!item?.path) return false;
    return location.pathname === item.path;
  };

  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    sidebarSections.forEach((section) => {
      if (!section.isDirect && section.items?.some((item) => isItemActive(item))) {
        initial[section.id] = true;
      }
    });
    if (Object.keys(initial).length === 0) {
      initial["calling"] = true;
      initial["network"] = true;
      initial["loans"] = true;
    }
    return initial;
  });

  useEffect(() => {
    sidebarSections.forEach((section) => {
      if (!section.isDirect && section.items?.some((item) => isItemActive(item))) {
        setOpenSections((prev) => ({ ...prev, [section.id]: true }));
      }
    });
  }, [location.pathname, sidebarSections]);

  const toggleSection = (id) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getSectionBadgeCount = (section) => {
    if (section.isDirect) return getBadgeCount(section.label);
    return section.items?.reduce((acc, item) => acc + getBadgeCount(item.name), 0) || 0;
  };

  // Logout function for admin
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

        {/* Desk Specialization Badge */}
        {sidebarOpen && (
          <div className="px-3 pt-2 pb-1">
            <div
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-center tracking-wide border shadow-2xs ${
                isCustomerDesk
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : isPartnerDesk
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-purple-50 text-purple-800 border-purple-200"
              }`}
            >
              {isCustomerDesk ? "📞 Customer Desk" : isPartnerDesk ? "🤝 Partner Desk" : "⚡ Hybrid Desk"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4 space-y-1.5 ${
            sidebarOpen ? "px-3" : "px-2"
          }`}
        >
          {sidebarSections.map((section) => {
            // DIRECT 1-CLICK LINK (e.g. Dashboard, Settings)
            if (section.isDirect) {
              const active = location.pathname === section.path;
              const count = getBadgeCount(section.label);
              return (
                <Link
                  key={section.id}
                  to={section.path}
                  title={section.label}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 ${
                    sidebarOpen ? "space-x-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
                  } ${
                    active
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md font-bold"
                      : "text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <div className="relative flex items-center">
                    <section.icon size={20} className={`shrink-0 ${active ? "text-white" : ""}`} />
                    {!sidebarOpen && count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </div>
                  {sidebarOpen && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="text-sm truncate">{section.label}</span>
                      {count > 0 && (
                        <span
                          className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            active ? "bg-white text-teal-600" : "bg-rose-500 text-white"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            }

            // COLLAPSIBLE ACCORDION MODULE
            const isOpen = !!openSections[section.id];
            const hasActiveChild = section.items?.some((item) => isItemActive(item));
            const sectionBadgeCount = getSectionBadgeCount(section);

            // Collapsed sidebar (desktop icon-only mode)
            if (!sidebarOpen) {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setSidebarOpen(true);
                    setOpenSections((prev) => ({ ...prev, [section.id]: true }));
                  }}
                  title={section.label}
                  className={`w-full flex items-center justify-center py-2.5 rounded-xl transition-all duration-200 relative ${
                    hasActiveChild
                      ? "bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <section.icon size={20} />
                  {sectionBadgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>
              );
            }

            // Expanded sidebar (standard full drawer mode)
            return (
              <div key={section.id} className="rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                    hasActiveChild
                      ? "bg-teal-50/80 text-teal-900 border border-teal-200/80 font-black"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <section.icon
                      size={18}
                      className={hasActiveChild ? "text-teal-600 shrink-0" : "text-slate-500 shrink-0"}
                    />
                    <span className="text-xs uppercase tracking-wide truncate">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {sectionBadgeCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {sectionBadgeCount}
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronDown size={14} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <div className="mt-1 ml-3.5 pl-2.5 border-l-2 border-teal-100 space-y-1 py-0.5">
                    {section.items.map((item, idx) => {
                      const active = isItemActive(item);
                      const isHighlight = item.highlight;
                      const count = getBadgeCount(item.name);

                      return (
                        <Link
                          key={idx}
                          to={item.path}
                          title={item.name}
                          onClick={() => {
                            if (typeof window !== "undefined" && window.innerWidth < 768) {
                              setSidebarOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                            active
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs font-bold"
                              : isHighlight
                              ? "text-amber-800 hover:bg-amber-50"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <item.icon
                              size={14}
                              className={`shrink-0 ${active ? "text-white" : isHighlight ? "text-amber-600" : "text-slate-400"}`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {count > 0 && (
                            <span
                              className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                active ? "bg-white text-teal-700" : "bg-rose-500 text-white"
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
                  {isCustomerDesk ? "Customer Telesales Desk" : isPartnerDesk ? "Channel Partner Desk" : "RM Dashboard"}
                </h1>
                {isCustomerDesk && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    📞 Customer Inbound
                  </span>
                )}
                {isPartnerDesk && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    🤝 Channel Network
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {returnRole && (
                <button
                  type="button"
                  onClick={() => backToOriginalRole(navigate)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm"
                  title={`Back to ${returnRole.displayName} Dashboard`}
                >
                  <ArrowLeft size={14} />
                  <span>Back to {returnRole.displayName}</span>
                </button>
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
                roleLabel="Relationship Manager"
                editPath="/rm/EditProfile"
                onLogout={handleLogout}
              />
            </div>



          </div>
        </>
      )}

      {/* Floating Bottom-Right Staff Chat Widget */}
      <StaffChatWidget currentRole="RM" />
    </div>
  );
}
