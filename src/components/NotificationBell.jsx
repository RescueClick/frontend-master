import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  Trash2,
  Check,
  RefreshCw,
  ClipboardList,
  FileText,
  UserCircle,
  Banknote,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import socketManager from "../utils/socket";
import { getAuthData } from "../utils/localStorage";
import { backendurl } from "../feature/urldata";
import axios from "axios";
import { loanTypeToTableShort } from "../utils/loanTypeShort";

// API helper functions for MongoDB notifications
const getAuthToken = () => {
  const authData = getAuthData();
  return (
    authData?.adminToken ||
    authData?.asmToken ||
    authData?.rsmToken ||
    authData?.rmToken ||
    authData?.partnerToken ||
    authData?.customerToken ||
    null
  );
};

function formatRelativeTime(ts) {
  if (ts == null) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function getTypeVisuals(type) {
  const base =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset";
  switch (type) {
    case "application":
      return { Icon: ClipboardList, wrap: `${base} bg-emerald-500/10 text-emerald-700 ring-emerald-500/20` };
    case "document":
      return { Icon: FileText, wrap: `${base} bg-sky-500/10 text-sky-700 ring-sky-500/20` };
    case "partner":
      return { Icon: UserCircle, wrap: `${base} bg-violet-500/10 text-violet-700 ring-violet-500/20` };
    case "payout":
      return { Icon: Banknote, wrap: `${base} bg-amber-500/10 text-amber-800 ring-amber-500/25` };
    case "registration":
      return { Icon: Sparkles, wrap: `${base} bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/20` };
    case "success":
      return { Icon: CheckCircle2, wrap: `${base} bg-green-500/10 text-green-700 ring-green-500/20` };
    case "error":
      return { Icon: XCircle, wrap: `${base} bg-red-500/10 text-red-700 ring-red-500/20` };
    case "warning":
      return { Icon: AlertTriangle, wrap: `${base} bg-amber-500/10 text-amber-800 ring-amber-500/25` };
    default:
      return { Icon: Bell, wrap: `${base} bg-slate-500/10 text-slate-700 ring-slate-500/20` };
  }
}

const loadNotificationsFromAPI = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No auth token available");
    }

    // Ensure backendurl is available
    if (!backendurl) {
      throw new Error("Backend URL not configured");
    }

    // Construct API URL - backendurl already includes /api
    // So we just append /notifications
    const apiUrl = `${backendurl}/notifications`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        limit: 200, // Load more notifications
        skip: 0,
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.data) {
      return [];
    }

    const notifications = response.data.notifications || [];
    return notifications;
  } catch (error) {
    if (error.response?.status === 401) {
      throw error; // Re-throw to allow retry logic
    }

    throw error; // Re-throw to allow retry logic in component
  }
};

const saveNotificationToAPI = async (notification) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    const response = await axios.post(
      `${backendurl}/notifications`,
      {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        actionBy: notification.actionBy,
        loanInfo: notification.loanInfo,
        notificationId: notification.id,
        timestamp: notification.timestamp,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.notification;
  } catch (error) {
    if (error.response?.status === 200 || error.response?.data?.message?.includes("already exists")) {
      return null;
    }
    return null;
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    const token = getAuthToken();
    if (!token) return;

    await axios.put(
      `${backendurl}/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {}
};

const deleteNotificationFromAPI = async (notificationId) => {
  try {
    const token = getAuthToken();
    if (!token) return;

    await axios.delete(`${backendurl}/notifications/${notificationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {}
};

const markAllAsReadAPI = async () => {
  try {
    const token = getAuthToken();
    if (!token) return;

    await axios.put(
      `${backendurl}/notifications/read-all`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {}
};

const deleteAllNotificationsAPI = async () => {
  try {
    const token = getAuthToken();
    if (!token) return;

    await axios.delete(`${backendurl}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {}
};

const NotificationBell = () => {
  const { isConnected, subscribe, unsubscribe } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const processedIdsRef = useRef(new Set()); // Track processed notification IDs to prevent duplicates

  // Load notifications from MongoDB on mount and periodically refresh
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second

    const loadNotifications = async (isRetry = false) => {
      // Don't show loading on retries to avoid flickering
      if (!isRetry) {
        setLoading(true);
      }
      
      try {
        const token = getAuthToken();
        if (!token) {
          // Retry if token is not available yet (component might mount before auth is ready)
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              loadNotifications(true);
            }, retryDelay);
            return;
          } else {
            setLoading(false);
            setNotifications([]); // Set empty array instead of leaving it undefined
            return;
          }
        }

        const loadedNotifications = await loadNotificationsFromAPI();
        
        if (Array.isArray(loadedNotifications)) {
          setNotifications(loadedNotifications);
          
          // Initialize processed IDs from loaded notifications
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
        } else {
          setNotifications([]);
        }
      } catch (error) {
        // Retry on error if we haven't exceeded max retries
        if (retryCount < maxRetries && error.response?.status !== 401) {
          retryCount++;
          setTimeout(() => {
            loadNotifications(true);
          }, retryDelay * retryCount); // Exponential backoff
        } else {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Load immediately on mount
    loadNotifications();

    // Refresh notifications every 30 seconds to catch any missed updates
    const refreshInterval = setInterval(() => {
      loadNotifications(true); // Pass true to indicate it's a refresh, not initial load
    }, 30000); // 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, []); // Only run once on mount

  useEffect(() => {
    // Ensure socket is connected
    if (!socketManager.getIsConnected()) {
      const socket = socketManager.connect();
      if (socket) {
      }
    }
    
    // All notifications are now saved to MongoDB on the backend
    // Frontend just loads from MongoDB API - no need to create notifications here
    
    // Listen for socket notifications - REMOVED: Notifications are now saved in MongoDB on backend
    // Frontend should only listen to applicationUpdated and documentStatusChanged events
    // and reload from MongoDB API instead of creating notifications from socket events

    // Listen for application updates - Reload from MongoDB instead of creating from socket
    const handleApplicationUpdate = async (data) => {
      // Small delay to ensure backend has saved to MongoDB
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          // Update processed IDs
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
        } catch (error) {
        }
      }, 500); // 500ms delay to ensure backend saved
    };

    // Listen for document updates - Reload from MongoDB instead of creating from socket
    const handleDocumentUpdate = async (data) => {
      // Small delay to ensure backend has saved to MongoDB
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          // Update processed IDs
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
        } catch (error) {
        }
      }, 500); // 500ms delay to ensure backend saved
    };

    // Listen for partner status changes - Reload from MongoDB
    const handlePartnerStatusChange = async (data) => {
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
        } catch (error) {
        }
      }, 500);
    };

    // Listen for payout updates - Reload from MongoDB
    const handlePayoutUpdate = async (data) => {
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
        } catch (error) {
        }
      }, 500);
    };

    // Listen for new partner/customer registrations - Reload from MongoDB
    const handleNewRegistration = async (data) => {
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
        } catch (error) {
        }
      }, 500);
    };

    // Subscribe to socket events
    subscribe("applicationUpdated", handleApplicationUpdate);
    subscribe("documentStatusChanged", handleDocumentUpdate);
    subscribe("partnerStatusChanged", handlePartnerStatusChange);
    subscribe("payoutStatusChanged", handlePayoutUpdate);
    subscribe("newPartnerRegistered", handleNewRegistration);
    subscribe("newCustomerRegistered", handleNewRegistration);
    
    // Listen for socket authentication confirmation
    const handleAuthenticated = (data) => {};
    
    const socketForAuth = socketManager.getSocket();
    if (socketForAuth) {
      socketForAuth.on("authenticated", handleAuthenticated);
    }

    return () => {
      unsubscribe("applicationUpdated", handleApplicationUpdate);
      unsubscribe("documentStatusChanged", handleDocumentUpdate);
      unsubscribe("partnerStatusChanged", handlePartnerStatusChange);
      unsubscribe("payoutStatusChanged", handlePayoutUpdate);
      unsubscribe("newPartnerRegistered", handleNewRegistration);
      unsubscribe("newCustomerRegistered", handleNewRegistration);
      
      // Clean up authenticated listener
      const socketForCleanup = socketManager.getSocket();
      if (socketForCleanup) {
        socketForCleanup.off("authenticated", handleAuthenticated);
      }
    };
  }, [subscribe, unsubscribe, isConnected]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Format notification for display (handle both MongoDB format and local format)
  const formatNotification = (notification) => {
    const ts = notification.timestamp || notification.createdAt || Date.now();
    return {
      id: notification._id || notification.id,
      _id: notification._id || notification.id,
      notificationId: notification.notificationId || notification._id || notification.id,
      type: notification.type || "info",
      title: notification.title || "Notification",
      message: notification.message || "You have a new notification",
      read: notification.read || false,
      time: notification.time || (notification.timestamp ? new Date(notification.timestamp).toLocaleString() : new Date().toLocaleString()),
      relativeTime: formatRelativeTime(ts),
      timestamp: ts,
      data: notification.data || {},
      actionBy: notification.actionBy || null,
      loanInfo: notification.loanInfo || null,
    };
  };

  useEffect(() => {
    if (!notificationOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setNotificationOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notificationOpen]);

  const markAsRead = async (id) => {
    // Find notification ID (could be _id from MongoDB or id from state)
    const notification = notifications.find(n => n._id === id || n.id === id);
    const notificationId = notification?._id || id;
    
    await markNotificationAsRead(notificationId);
    
    setNotifications((prev) =>
      prev.map((n) => ((n._id === id || n.id === id) ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = async (id) => {
    // Find notification ID (could be _id from MongoDB or id from state)
    const notification = notifications.find(n => n._id === id || n.id === id);
    const notificationId = notification?._id || id;
    
    await deleteNotificationFromAPI(notificationId);
    
    setNotifications((prev) => prev.filter((n) => (n._id !== id && n.id !== id)));
  };

  const clearAllNotifications = async () => {
    await deleteAllNotificationsAPI();
    setNotifications([]);
    processedIdsRef.current.clear(); // Clear processed IDs when clearing all notifications
  };

  const markAllAsRead = async () => {
    await markAllAsReadAPI();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleRefreshList = async () => {
    setLoading(true);
    try {
      const loadedNotifications = await loadNotificationsFromAPI();
      setNotifications(loadedNotifications);
      loadedNotifications.forEach((n) => {
        if (n.notificationId || n._id) {
          processedIdsRef.current.add(n.notificationId || n._id);
        }
      });
    } catch {
      /* keep existing list */
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setNotificationOpen((o) => !o)}
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 ${
            notificationOpen
              ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
              : "border-transparent bg-white/80 text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          }`}
          title="Notifications"
          aria-expanded={notificationOpen}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell size={20} strokeWidth={2} className="shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {notificationOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            aria-label="Close notifications"
            onClick={() => setNotificationOpen(false)}
          />
          <aside
            className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10"
            role="dialog"
            aria-labelledby="notifications-panel-title"
          >
            <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-5 pb-5 pt-5 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 left-1/4 h-24 w-48 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-200/90">
                    Inbox
                  </p>
                  <h2
                    id="notifications-panel-title"
                    className="mt-1 truncate text-lg font-semibold tracking-tight"
                  >
                    Notifications
                  </h2>
                  <p className="mt-1 text-sm text-slate-300/95">
                    {notifications.length === 0
                      ? "You’re all caught up."
                      : unreadCount > 0
                        ? `${unreadCount} unread · ${notifications.length} total`
                        : `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRefreshList}
                    disabled={loading}
                    className="rounded-lg p-2 text-white/90 transition hover:bg-white/10 disabled:opacity-50"
                    title="Refresh"
                    aria-label="Refresh notifications"
                  >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    className="rounded-lg p-2 text-white/90 transition hover:bg-white/10"
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              {notifications.length > 0 && (
                <div className="relative mt-4 flex flex-wrap gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/15"
                    >
                      <Check size={14} />
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-rose-100 ring-1 ring-rose-400/30 backdrop-blur-sm transition hover:bg-rose-500/20"
                  >
                    <Trash2 size={14} />
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20">
                  <div
                    className="h-9 w-9 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-600"
                    aria-hidden
                  />
                  <p className="mt-4 text-sm font-medium text-slate-600">Loading notifications…</p>
                  <p className="mt-1 text-center text-xs text-slate-500">This usually takes a moment.</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500">
                    <Bell size={32} strokeWidth={1.5} />
                  </div>
                  <p className="mt-5 text-base font-semibold text-slate-800">No notifications yet</p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                    When something needs your attention—applications, documents, or payouts—we’ll show it here.
                  </p>
                  {!isConnected && (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200/80">
                      <WifiOff size={14} />
                      Live updates paused (reconnecting…)
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleRefreshList}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-700"
                  >
                    <RefreshCw size={16} />
                    Try again
                  </button>
                </div>
              ) : (
                <ul className="space-y-2 p-3 sm:p-4">
                  {notifications.map((notification) => {
                    const formatted = formatNotification(notification);
                    const { Icon, wrap } = getTypeVisuals(formatted.type);
                    return (
                      <li key={formatted._id || formatted.id}>
                        <article
                          className={`group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md ${
                            !formatted.read
                              ? "border-l-[3px] border-l-teal-500 bg-gradient-to-r from-teal-50/40 to-white"
                              : "border-l-[3px] border-l-transparent"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={wrap}>
                              <Icon size={18} strokeWidth={2} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3
                                      className={`text-sm font-semibold leading-snug ${
                                        !formatted.read ? "text-slate-900" : "text-slate-600"
                                      }`}
                                    >
                                      {formatted.title}
                                    </h3>
                                    {!formatted.read && (
                                      <span className="inline-flex shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                    {formatted.message}
                                  </p>
                                  {typeof formatted?.data?.amount === "number" &&
                                    (formatted.type === "payout" || formatted.type === "incentive") && (
                                      <p className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                                        Amount: ₹{formatted.data.amount.toLocaleString("en-IN")}
                                      </p>
                                    )}
                                  {formatted.loanInfo && (
                                    <div className="mt-3 space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-100">
                                      {formatted.loanInfo.appNo && (
                                        <p>
                                          <span className="font-semibold text-slate-900">Loan #</span>{" "}
                                          {formatted.loanInfo.appNo}
                                        </p>
                                      )}
                                      {formatted.loanInfo.loanType && (
                                        <p>
                                          <span className="font-semibold text-slate-900">Type</span>{" "}
                                          {loanTypeToTableShort(formatted.loanInfo.loanType)}
                                        </p>
                                      )}
                                      {formatted.loanInfo.customerName && (
                                        <p>
                                          <span className="font-semibold text-slate-900">Customer</span>{" "}
                                          {formatted.loanInfo.customerName}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {formatted.actionBy && (
                                    <p className="mt-2 text-xs font-medium text-teal-700">
                                      {formatted.actionBy.name}
                                      {formatted.actionBy.role ? (
                                        <span className="font-normal text-slate-500">
                                          {" "}
                                          · {formatted.actionBy.role}
                                        </span>
                                      ) : null}
                                    </p>
                                  )}
                                  <p className="mt-2 text-xs text-slate-400">
                                    {formatted.relativeTime || formatted.time}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteNotification(formatted._id || formatted.id)}
                                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 md:opacity-0 md:group-hover:opacity-100"
                                  title="Remove"
                                  aria-label="Remove notification"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              {!formatted.read && (
                                <button
                                  type="button"
                                  onClick={() => markAsRead(formatted._id || formatted.id)}
                                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 transition hover:text-teal-800"
                                >
                                  <Check size={14} />
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-200/90 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <Wifi size={14} className="text-slate-400" aria-hidden />
                      <span className="font-medium text-slate-600">Live updates on</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={14} className="text-amber-500" aria-hidden />
                      <span className="font-medium text-amber-800">Reconnecting…</span>
                    </>
                  )}
                </span>
                <span className="tabular-nums text-slate-400">{notifications.length} total</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
