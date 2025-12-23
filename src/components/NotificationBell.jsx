import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Trash2, Check } from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import socketManager from "../utils/socket";
import { getAuthData } from "../utils/localStorage";
import { backendurl } from "../feature/urldata";
import axios from "axios";

// API helper functions for MongoDB notifications
const getAuthToken = () => {
  const authData = getAuthData();
  const token = authData?.adminToken || authData?.asmToken || authData?.rmToken || authData?.partnerToken || authData?.customerToken;
  
  // Debug logging to help identify token issues
  if (!token) {
    console.warn("⚠️ Web: No auth token found. Available tokens:", {
      hasAdminToken: !!authData?.adminToken,
      hasAsmToken: !!authData?.asmToken,
      hasRmToken: !!authData?.rmToken,
      hasPartnerToken: !!authData?.partnerToken,
      hasCustomerToken: !!authData?.customerToken,
      authDataKeys: Object.keys(authData || {}),
    });
  } else {
    // Determine which token type was used
    let tokenType = "unknown";
    if (authData?.adminToken === token) tokenType = "adminToken";
    else if (authData?.asmToken === token) tokenType = "asmToken";
    else if (authData?.rmToken === token) tokenType = "rmToken";
    else if (authData?.partnerToken === token) tokenType = "partnerToken";
    else if (authData?.customerToken === token) tokenType = "customerToken";
    
    console.log("✅ Web: Auth token found:", {
      hasToken: true,
      tokenType: tokenType,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + "...",
    });
  }
  
  return token;
};

const loadNotificationsFromAPI = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("⚠️ No auth token found, cannot load notifications");
      throw new Error("No auth token available");
    }

    // Ensure backendurl is available
    if (!backendurl) {
      console.error("❌ Backend URL is not configured");
      throw new Error("Backend URL not configured");
    }

    // Construct API URL - backendurl already includes /api
    // So we just append /notifications
    const apiUrl = `${backendurl}/notifications`;

    console.log("📥 Web: Loading notifications from API...", { 
      backendurl, 
      apiUrl,
      hasToken: !!token,
      tokenType: token ? "found" : "missing"
    });
    
    console.log("📡 Web: Making API request to:", apiUrl);
    console.log("📡 Web: Request headers:", {
      Authorization: `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': 'application/json',
    });
    
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

    console.log("📥 Web: API Response received:", {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      notificationsCount: response.data?.notifications?.length || 0,
      total: response.data?.total || 0,
      unreadCount: response.data?.unreadCount || 0,
    });

    if (!response.data) {
      console.warn("⚠️ No data in response:", response);
      return [];
    }

    const notifications = response.data.notifications || [];
    console.log(`✅ Loaded ${notifications.length} notifications from MongoDB`, {
      total: response.data.total,
      unreadCount: response.data.unreadCount,
      returned: response.data.returned,
      responseData: response.data, // Log full response for debugging
    });
    
    // If notifications array is empty but total > 0, there might be an issue
    if (notifications.length === 0 && response.data.total > 0) {
      console.warn("⚠️ Response shows total > 0 but notifications array is empty!", response.data);
    }
    
    return notifications;
  } catch (error) {
    console.error("❌ Failed to load notifications from API:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });
    
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized - token may be expired");
      throw error; // Re-throw to allow retry logic
    }
    
    if (error.code === 'ECONNABORTED') {
      console.warn("⚠️ Request timeout - API might be slow");
    }
    
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.warn("⚠️ Network error - backend might be unreachable");
    }
    
    throw error; // Re-throw to allow retry logic in component
  }
};

const saveNotificationToAPI = async (notification) => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("⚠️ No auth token found, cannot save notification");
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
    // If duplicate, that's okay - just log it
    if (error.response?.status === 200 || error.response?.data?.message?.includes("already exists")) {
      console.log("⚠️ Duplicate notification, skipping save");
      return null;
    }
    console.error("Failed to save notification to API:", error);
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
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
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
  } catch (error) {
    console.error("Failed to delete notification:", error);
  }
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
  } catch (error) {
    console.error("Failed to mark all as read:", error);
  }
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
  } catch (error) {
    console.error("Failed to delete all notifications:", error);
  }
};

// Generate unique notification ID based on content to prevent duplicates
const generateNotificationId = (data) => {
  // Use applicationId + docType + status + timestamp for documents
  if (data.applicationId && data.docType) {
    return `${data.applicationId}_${data.docType}_${data.status}_${data.timestamp || Date.now()}`;
  }
  // Use applicationId + status + timestamp for applications
  if (data.applicationId && data.status) {
    return `${data.applicationId}_${data.status}_${data.timestamp || Date.now()}`;
  }
  // Fallback to timestamp + random
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          console.warn("⚠️ No auth token found, will retry...", { retryCount, maxRetries });
          
          // Retry if token is not available yet (component might mount before auth is ready)
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Retrying to load notifications (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(() => {
              loadNotifications(true);
            }, retryDelay);
            return;
          } else {
            console.error("❌ Failed to get auth token after", maxRetries, "retries");
            console.error("❌ This might mean the user is not logged in or token was cleared");
            setLoading(false);
            setNotifications([]); // Set empty array instead of leaving it undefined
            return;
          }
        }

        console.log("📥 Web: Attempting to load notifications from API...");
        const loadedNotifications = await loadNotificationsFromAPI();
        
        if (Array.isArray(loadedNotifications)) {
          console.log("✅ Web: Received notifications array with", loadedNotifications.length, "items");
          
          // Calculate unread count
          const unread = loadedNotifications.filter(n => !n.read).length;
          console.log("✅ Web: Unread count:", unread);
          
          if (loadedNotifications.length > 0) {
            console.log("📋 Web: First notification sample:", {
              _id: loadedNotifications[0]._id,
              userId: loadedNotifications[0].userId,
              type: loadedNotifications[0].type,
              title: loadedNotifications[0].title,
              read: loadedNotifications[0].read,
            });
          } else {
            console.warn("⚠️ Web: API returned empty notifications array");
            console.warn("⚠️ Web: This might mean no notifications exist for this user, or userId mismatch");
          }
          
          setNotifications(loadedNotifications);
          
          // Initialize processed IDs from loaded notifications
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
          
          console.log("✅ Web: NotificationBell: Loaded", loadedNotifications.length, "notifications from MongoDB");
        } else {
          console.warn("⚠️ Web: Invalid notifications format received:", loadedNotifications);
          console.warn("⚠️ Web: Type:", typeof loadedNotifications, "Is Array:", Array.isArray(loadedNotifications));
          setNotifications([]);
        }
      } catch (error) {
        console.error("❌ Failed to load notifications:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          stack: error.stack,
        });
        
        // Retry on error if we haven't exceeded max retries
        if (retryCount < maxRetries && error.response?.status !== 401) {
          retryCount++;
          console.log(`🔄 Retrying after error (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(() => {
            loadNotifications(true);
          }, retryDelay * retryCount); // Exponential backoff
        } else {
          console.error("❌ Max retries reached or 401 error. Stopping retries.");
          setNotifications([]);
        }
      } finally {
        setLoading(false);
        // Note: notifications.length here refers to the state at the time of the finally block
        // The actual state update happens asynchronously
        console.log("🏁 Loading complete. setLoading(false) called");
      }
    };

    // Load immediately on mount
    console.log("🔔 Web: NotificationBell: Mounting, loading notifications from MongoDB...");
    loadNotifications();

    // Refresh notifications every 30 seconds to catch any missed updates
    const refreshInterval = setInterval(() => {
      console.log("🔄 Web: NotificationBell: Periodic refresh from MongoDB");
      loadNotifications(true); // Pass true to indicate it's a refresh, not initial load
    }, 30000); // 30 seconds

    return () => {
      console.log("🔔 Web: NotificationBell: Unmounting, clearing intervals");
      clearInterval(refreshInterval);
    };
  }, []); // Only run once on mount

  useEffect(() => {
    console.log("🔔 NotificationBell: Setting up socket listeners", { isConnected });
    
    // Ensure socket is connected
    if (!socketManager.getIsConnected()) {
      console.log("🔔 NotificationBell: Socket not connected, attempting to connect...");
      const socket = socketManager.connect();
      if (socket) {
        console.log("✅ NotificationBell: Socket connection initiated");
      }
    }
    
    // All notifications are now saved to MongoDB on the backend
    // Frontend just loads from MongoDB API - no need to create notifications here
    
    // Listen for socket notifications - REMOVED: Notifications are now saved in MongoDB on backend
    // Frontend should only listen to applicationUpdated and documentStatusChanged events
    // and reload from MongoDB API instead of creating notifications from socket events

    // Listen for application updates - Reload from MongoDB instead of creating from socket
    const handleApplicationUpdate = async (data) => {
      console.log("📨 NotificationBell: Received applicationUpdated event, reloading from MongoDB", data);
      
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
          console.log("✅ NotificationBell: Reloaded", loadedNotifications.length, "notifications from MongoDB");
        } catch (error) {
          console.error("Failed to reload notifications:", error);
        }
      }, 500); // 500ms delay to ensure backend saved
    };

    // Listen for document updates - Reload from MongoDB instead of creating from socket
    const handleDocumentUpdate = async (data) => {
      console.log("📨 NotificationBell: Received documentStatusChanged event, reloading from MongoDB", data);
      
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
          console.log("✅ NotificationBell: Reloaded", loadedNotifications.length, "notifications from MongoDB");
        } catch (error) {
          console.error("Failed to reload notifications:", error);
        }
      }, 500); // 500ms delay to ensure backend saved
    };

    // Listen for partner status changes - Reload from MongoDB
    const handlePartnerStatusChange = async (data) => {
      console.log("📨 NotificationBell: Received partnerStatusChanged event, reloading from MongoDB", data);
      
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
          console.log("✅ NotificationBell: Reloaded", loadedNotifications.length, "notifications from MongoDB");
        } catch (error) {
          console.error("Failed to reload notifications:", error);
        }
      }, 500);
    };

    // Listen for payout updates - Reload from MongoDB
    const handlePayoutUpdate = async (data) => {
      console.log("📨 NotificationBell: Received payoutStatusChanged event, reloading from MongoDB", data);
      
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
          console.log("✅ NotificationBell: Reloaded", loadedNotifications.length, "notifications from MongoDB");
        } catch (error) {
          console.error("Failed to reload notifications:", error);
        }
      }, 500);
    };

    // Listen for new partner/customer registrations - Reload from MongoDB
    const handleNewRegistration = async (data) => {
      console.log("📨 NotificationBell: Received new registration event, reloading from MongoDB", data);
      
      setTimeout(async () => {
        try {
          const loadedNotifications = await loadNotificationsFromAPI();
          setNotifications(loadedNotifications);
          
          loadedNotifications.forEach(n => {
            if (n.notificationId || n._id) {
              processedIdsRef.current.add(n.notificationId || n._id);
            }
          });
          console.log("✅ NotificationBell: Reloaded", loadedNotifications.length, "notifications from MongoDB");
        } catch (error) {
          console.error("Failed to reload notifications:", error);
        }
      }, 500);
    };

    // Subscribe to socket events - Only listen to applicationUpdated and documentStatusChanged
    // Notifications are now saved in MongoDB on backend, so we just reload from API
    console.log("🔔 NotificationBell: Subscribing to socket events via internal event bus");
    subscribe("applicationUpdated", handleApplicationUpdate);
    subscribe("documentStatusChanged", handleDocumentUpdate);
    subscribe("partnerStatusChanged", handlePartnerStatusChange);
    subscribe("payoutStatusChanged", handlePayoutUpdate);
    subscribe("newPartnerRegistered", handleNewRegistration);
    subscribe("newCustomerRegistered", handleNewRegistration);
    
    // Listen for socket authentication confirmation
    const handleAuthenticated = (data) => {
      console.log("✅ NotificationBell: Socket authenticated", data);
      console.log("✅ NotificationBell: User rooms:", data?.rooms);
    };
    
    const socketForAuth = socketManager.getSocket();
    if (socketForAuth) {
      socketForAuth.on("authenticated", handleAuthenticated);
    } else {
      console.warn("⚠️ NotificationBell: Socket not available yet");
    }

    return () => {
      console.log("🔔 NotificationBell: Cleaning up socket listeners");
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
  
  // Debug: Log notification state changes
  useEffect(() => {
    console.log("🔔 NotificationBell: State updated", {
      notificationCount: notifications.length,
      unreadCount,
      loading,
      notificationOpen,
    });
  }, [notifications.length, unreadCount, loading, notificationOpen]);

  // Format notification for display (handle both MongoDB format and local format)
  const formatNotification = (notification) => {
    return {
      id: notification._id || notification.id,
      _id: notification._id || notification.id,
      notificationId: notification.notificationId || notification._id || notification.id,
      type: notification.type || "info",
      title: notification.title || "Notification",
      message: notification.message || "You have a new notification",
      read: notification.read || false,
      time: notification.time || (notification.timestamp ? new Date(notification.timestamp).toLocaleString() : new Date().toLocaleString()),
      timestamp: notification.timestamp || notification.createdAt || Date.now(),
      data: notification.data || {},
      actionBy: notification.actionBy || null,
      loanInfo: notification.loanInfo || null,
    };
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "application":
        return "📋";
      case "document":
        return "📄";
      case "partner":
        return "👤";
      case "payout":
        return "💰";
      case "registration":
        return "✨";
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "🔔";
    }
  };

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

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setNotificationOpen(!notificationOpen)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell size={20} className="text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {!isConnected && (
            <span className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full w-2 h-2"></span>
          )}
        </button>
      </div>

      {/* Notifications Side Panel */}
      {notificationOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setNotificationOpen(false)}
          ></div>

          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications ({notifications.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const loadedNotifications = await loadNotificationsFromAPI();
                      setNotifications(loadedNotifications);
                      loadedNotifications.forEach(n => {
                        if (n.notificationId || n._id) {
                          processedIdsRef.current.add(n.notificationId || n._id);
                        }
                      });
                      console.log("✅ Manually refreshed notifications");
                    } catch (error) {
                      console.error("Failed to refresh:", error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-sm text-blue-500 hover:underline"
                  title="Refresh notifications"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-[#12B99C] hover:underline"
                        title="Mark all as read"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={clearAllNotifications}
                      className="text-sm text-red-500 hover:underline"
                      title="Clear all"
                    >
                      Clear all
                    </button>
                  </>
                )}
                <button
                  onClick={() => setNotificationOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#12B99C] mb-4"></div>
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <Bell size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500">No notifications</p>
                  {!isConnected && (
                    <p className="text-xs text-yellow-600 mt-2">
                      Socket disconnected
                    </p>
                  )}
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const loadedNotifications = await loadNotificationsFromAPI();
                        setNotifications(loadedNotifications);
                        loadedNotifications.forEach(n => {
                          if (n.notificationId || n._id) {
                            processedIdsRef.current.add(n.notificationId || n._id);
                          }
                        });
                      } catch (error) {
                        console.error("Failed to load:", error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-[#12B99C] text-white rounded hover:bg-[#0fa588] transition-colors"
                  >
                    Reload Notifications
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const formatted = formatNotification(notification);
                    return (
                      <div
                        key={formatted._id || formatted.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !formatted.read ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {getNotificationIcon(formatted.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p
                                  className={`text-sm font-medium ${
                                    !formatted.read
                                      ? "text-gray-900"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {formatted.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {formatted.message}
                                </p>
                                {formatted.loanInfo && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                    {formatted.loanInfo.appNo && (
                                      <p className="text-gray-700">
                                        <span className="font-semibold">Loan #:</span> {formatted.loanInfo.appNo}
                                      </p>
                                    )}
                                    {formatted.loanInfo.loanType && (
                                      <p className="text-gray-700">
                                        <span className="font-semibold">Type:</span> {formatted.loanInfo.loanType}
                                      </p>
                                    )}
                                    {formatted.loanInfo.customerName && (
                                      <p className="text-gray-700">
                                        <span className="font-semibold">Customer:</span> {formatted.loanInfo.customerName}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {formatted.actionBy && (
                                  <p className="text-xs text-[#12B99C] mt-1 font-semibold">
                                    By: {formatted.actionBy.name} ({formatted.actionBy.role})
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatted.time}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteNotification(formatted._id || formatted.id)}
                                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            {!formatted.read && (
                              <button
                                onClick={() => markAsRead(formatted._id || formatted.id)}
                                className="mt-2 text-xs text-[#12B99C] hover:underline flex items-center gap-1"
                              >
                                <Check size={12} />
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer - Connection Status */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {isConnected ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Connecting...
                    </span>
                  )}
                </span>
                <span className="text-gray-400">
                  {notifications.length} total
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
