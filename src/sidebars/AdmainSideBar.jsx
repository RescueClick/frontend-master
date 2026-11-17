import React, { useEffect, useState, Suspense } from "react";
import {
  Users,
  UserCheck,
  Building2,
  Menu,
  X,
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
  Link2,
  Gift,
  Shield,
  FileCheck,
  Crown,
  Sparkles,
  MessageSquare,
  Search,
  QrCode,
  Target,
  Layers,
  PhoneCall,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Profile from "./users/userProfile/Profile";
import { getAuthData, clearAuthData } from "../utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile } from "../feature/thunks/adminThunks";
import { backToOriginalRole, getOriginalRole, backToAdmin, formatRoleName } from "../utils/impersonation";

import { brandLogo, COMPANY_NAME } from "../config/branding";
import NotificationBell from "../components/NotificationBell";
import DhanSourceLoader from "../components/DhanSourceLoader";
import { useSidebarNotifications } from "../hooks/useSidebarNotifications";
import StaffChatWidget from "./users/shared/chat/StaffChatWidget";

// Admin sidebar component
const AdminSideBar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [profileOpen, setProfileOpen] = useState(false);

  const location = useLocation();
  const dispatch = useDispatch();
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

  const counts = useSidebarNotifications();

  const getBadgeCount = (name) => {
    switch (name) {
      case "Chat":
        return counts.chat;
      case "Admin Partner":
        return counts.partner;
      case "Payout":
      case "Payout Management":
      case "Payout & Incentives":
        return counts.payout;
      case "Delete Requests":
        return counts.delete_request;
      default:
        return 0;
    }
  };

  // Grouped and organized sidebar navigation sections with accordion support
  const sidebarSections = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
      path: "/admin/dashboard",
      isDirect: true,
    },
    {
      id: "hierarchy",
      label: "Staff & Hierarchy",
      icon: Users,
      items: [
        { name: "RSM", icon: Users, path: "/admin/rsm" },
        { name: "ASM", icon: Users, path: "/admin/asm" },
        { name: "RM", icon: Users, path: "/admin/rm" },
      ],
    },
    {
      id: "calling",
      label: "Calling & Performance",
      icon: PhoneCall,
      items: [
        { name: "Calling & Follow-Up Hub", icon: PhoneCall, path: "/admin/call-logs", highlight: true },
        { name: "Targets", icon: Target, path: "/admin/target", highlight: true },
      ],
    },
    {
      id: "network",
      label: "Network & Clients",
      icon: UserCheck,
      items: [
        { name: "Admin Partner", icon: FileCheck, path: "/admin/rm-partner", highlight: true },
        { name: "Partner", icon: UserCheck, path: "/admin/partner" },
        { name: "Customer", icon: Users, path: "/admin/customer" },
      ],
    },
    {
      id: "finance",
      label: "Finance & Operations",
      icon: IndianRupee,
      items: [
        { name: "Payout & Incentives", icon: IndianRupee, path: "/admin/payout-incentives", highlight: true },
        { name: "Rewards & Levels", icon: Gift, path: "/admin/rewards-levels", highlight: true },
      ],
    },
    {
      id: "growth",
      label: "Growth & Tools",
      icon: Sparkles,
      items: [
        { name: "Public loan referral", icon: Link2, path: "/admin/public-loan-referral", highlight: true },
        { name: "QR Stickers", icon: QrCode, path: "/admin/qr-inventory", highlight: true },
        { name: "Banners", icon: Sparkles, path: "/admin/banner", highlight: true },
      ],
    },
    {
      id: "banking",
      label: "Banking & Credit",
      icon: Building2,
      items: [
        { name: "Loan Products", icon: Layers, path: "/admin/loan-products", highlight: true },
        { name: "Add Bank", icon: Building2, path: "/admin/banks", highlight: true },
        { name: "Find Bank RM", icon: Search, path: "/admin/find-bank-rm" },
        { name: "CIBIL Audit", icon: Shield, path: "/admin/cibil-audit", highlight: true },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
      isDirect: true,
    },
  ];

  const isItemActive = (item) => {
    if (!item?.path) return false;
    if (location.pathname === item.path) return true;
    if (item.path === "/admin/call-logs") {
      return location.pathname === "/admin/call-logs" || location.pathname === "/admin/meta-leads";
    }
    if (item.path === "/admin/payout-incentives" || item.path === "/admin/payout") {
      return (
        location.pathname === "/admin/payout" ||
        location.pathname === "/admin/incentives" ||
        location.pathname === "/admin/payout-incentives" ||
        location.pathname.startsWith("/admin/pending-payout") ||
        location.pathname.startsWith("/admin/done-payout")
      );
    }
    if (item.path === "/admin/rewards-levels" || item.path === "/admin/referral-rewards") {
      return (
        location.pathname === "/admin/referral-rewards" ||
        location.pathname === "/admin/partner-levels" ||
        location.pathname === "/admin/rewards-levels"
      );
    }
    if (item.path === "/admin/banner" || item.path === "/admin/referral-banners") {
      return (
        location.pathname === "/admin/banner" ||
        location.pathname === "/admin/referral-banners"
      );
    }
    return false;
  };

  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    sidebarSections.forEach((section) => {
      if (!section.isDirect && section.items?.some((item) => isItemActive(item))) {
        initial[section.id] = true;
      }
    });
    if (Object.keys(initial).length === 0) {
      initial["hierarchy"] = true;
    }
    return initial;
  });

  // Auto-expand section containing active path
  useEffect(() => {
    sidebarSections.forEach((section) => {
      if (!section.isDirect && section.items?.some((item) => isItemActive(item))) {
        setOpenSections((prev) => ({ ...prev, [section.id]: true }));
      }
    });
  }, [location.pathname]);

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
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — Off-canvas overlay on mobile, relative full-height sidebar on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 h-full bg-white shadow-xl transition-all duration-300 ease-in-out flex flex-col border-r border-gray-200 shrink-0 ${
          sidebarOpen
            ? "translate-x-0 w-64 md:w-60"
            : "-translate-x-full md:w-20"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex w-full min-w-0 items-center justify-between border-b border-gray-100 py-3 md:py-5 min-h-[64px] md:min-h-[72px] px-3 ${
            sidebarOpen ? "md:justify-start md:px-4 md:gap-3" : "md:justify-center md:px-2"
          }`}
        >
          <div className="w-full min-w-0 h-[56px] md:h-[72px] rounded-lg flex items-center justify-center shrink-0 overflow-hidden px-2">
            <img src={brandLogo} alt={COMPANY_NAME} className="h-full w-full object-contain md:object-cover object-center" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`mt-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4 space-y-1.5 ${
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
              <h1 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
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
        <main className="flex-1 p-2 sm:p-4 md:p-6 bg-gray-50 overflow-y-auto min-w-0">
          <Suspense
            fallback={
              <DhanSourceLoader label="Loading page…" className="min-h-[50vh]" />
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Floating Bottom-Right Staff Chat Widget */}
      <StaffChatWidget currentRole="SUPER_ADMIN" />
    </div>
  );
};

export default AdminSideBar;