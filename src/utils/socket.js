import { io } from "socket.io-client";
import { getAuthData } from "./localStorage";
import { backendurl } from "../feature/urldata";

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    // If socket exists and is connected, return it
    if (this.socket?.connected) {
      return this.socket;
    }

    // If socket exists but not connected, disconnect it first
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const authData = getAuthData();
    const token = authData?.adminToken || authData?.asmToken || authData?.rmToken || authData?.partnerToken || authData?.customerToken;

    if (!token) {
      return null;
    }

    // Extract base URL from backendurl
    let socketUrl = backendurl.replace("/api", "");
    
    // Ensure proper URL format for socket.io
    // Remove trailing slashes
    socketUrl = socketUrl.replace(/\/+$/, "");
    
    // Handle different URL formats
    if (socketUrl.includes("://")) {
      // Already has protocol, use as is
      socketUrl = socketUrl;
    } else if (socketUrl.match(/^\d+\.\d+\.\d+\.\d+/)) {
      // IP address format (e.g., 10.100.12.2:5000)
      socketUrl = `http://${socketUrl}`;
    } else if (socketUrl.includes("localhost") || socketUrl.includes("127.0.0.1")) {
      // Localhost
      socketUrl = `http://${socketUrl}`;
    } else {
      // Domain name or other format
      socketUrl = `http://${socketUrl}`;
    }

    this.socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ["polling", "websocket"], // Try polling first, then websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000, // 20 second timeout
      forceNew: false, // Don't force new connection if one exists
    });

    this.setupEventHandlers();

    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit("socketConnected", { connected: true });
      
      // Verify connection by emitting a test event
      this.socket.emit("ping", { timestamp: Date.now() });
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      this.emit("socketDisconnected", { reason });
    });

    this.socket.on("connect_error", (error) => {
      this.isConnected = false;
      this.emit("socketDisconnected", { reason: error.message });
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit("socketConnectionFailed", { error: error.message });
      } else {
      }
    });

    // Listen for authentication success/failure
    this.socket.on("authenticated", () => {});

    this.socket.on("unauthorized", (error) => {});

    // Application Events
    this.socket.on("applicationUpdated", (data) => {
      this.emit("applicationUpdated", data);
    });

    this.socket.on("newApplication", (data) => {
      this.emit("newApplication", data);
    });

    // Document Events
    this.socket.on("documentUploaded", (data) => {
      this.emit("documentUploaded", data);
    });

    this.socket.on("documentStatusChanged", (data) => {
      this.emit("documentStatusChanged", data);
    });

    // Partner Events
    this.socket.on("partnerStatusChanged", (data) => {
      this.emit("partnerStatusChanged", data);
    });

    this.socket.on("newPartnerRegistered", (data) => {
      this.emit("newPartnerRegistered", data);
    });

    // Customer Events
    this.socket.on("newCustomerRegistered", (data) => {
      this.emit("newCustomerRegistered", data);
    });

    // Payout Events
    this.socket.on("payoutStatusChanged", (data) => {
      this.emit("payoutStatusChanged", data);
    });

    // General Notification Event
    this.socket.on("notification", (data) => {
      this.emit("notification", data);
    });

    // Target Events
    this.socket.on("targetUpdated", (data) => {
      this.emit("targetUpdated", data);
    });

    // Dashboard Updates
    this.socket.on("dashboardUpdate", (data) => {
      this.emit("dashboardUpdate", data);
    });

    // User Online/Offline
    this.socket.on("userOnline", (data) => {
      this.emit("userOnline", data);
    });

    this.socket.on("userOffline", (data) => {
      this.emit("userOffline", data);
    });
  }

  // Emit event to server
  emitToServer(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
    }
  }

  // Listen to custom events (internal event system)
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit internal event to listeners
  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
        }
      });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Reconnect socket
  reconnect() {
    this.disconnect();
    return this.connect();
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  getIsConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Application-specific methods
  notifyApplicationStatusChanged(applicationId, newStatus, oldStatus) {
    this.emitToServer("applicationStatusChanged", { applicationId, newStatus, oldStatus });
  }

  notifyNewApplication(applicationId) {
    this.emitToServer("newApplication", { applicationId });
  }

  notifyDocumentUploaded(applicationId, docType, partnerId, customerId) {
    this.emitToServer("documentUploaded", { applicationId, docType, partnerId, customerId });
  }

  notifyDocumentStatusChanged(applicationId, docType, status, updatedBy) {
    this.emitToServer("documentStatusChanged", { applicationId, docType, status, updatedBy });
  }

  notifyPartnerStatusChanged(partnerId, newStatus, oldStatus) {
    this.emitToServer("partnerStatusChanged", { partnerId, newStatus, oldStatus });
  }

  notifyNewPartnerRegistered(partnerId) {
    this.emitToServer("newPartnerRegistered", { partnerId });
  }

  notifyNewCustomerRegistered(customerId, partnerId) {
    this.emitToServer("newCustomerRegistered", { customerId, partnerId });
  }

  notifyPayoutStatusChanged(payoutId, status, partnerId) {
    this.emitToServer("payoutStatusChanged", { payoutId, status, partnerId });
  }

  notifyTargetUpdated(targetId, assignedTo, role) {
    this.emitToServer("targetUpdated", { targetId, assignedTo, role });
  }

  requestDashboardUpdate(role, userId) {
    this.emitToServer("requestDashboardUpdate", { role, userId });
  }

  sendNotification(userId, notification) {
    this.emitToServer("sendNotification", { userId, notification });
  }

  sendNotificationToRole(role, notification) {
    this.emitToServer("sendNotificationToRole", { role, notification });
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager;
