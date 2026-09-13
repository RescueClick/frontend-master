import { io } from "socket.io-client";
import { getAuthData } from "./localStorage";
import { backendOrigin, backendurl } from "../feature/urldata";

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.boundSocketEvents = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this._connecting = false;
  }

  getToken() {
    const authData = getAuthData() || {};
    const path = typeof window !== "undefined" ? window.location.pathname || "" : "";

    // Match the page the user is on (critical for presence / chat identity)
    if (path.startsWith("/admin") && authData.adminToken) return authData.adminToken;
    if (path.startsWith("/rsm") && (authData.rawRsmToken || authData.rsmToken)) {
      return authData.rawRsmToken || authData.rsmToken;
    }
    if (path.startsWith("/asm") && (authData.rawAsmToken || authData.asmToken)) {
      return authData.rawAsmToken || authData.asmToken;
    }
    if (path.startsWith("/rm") && authData.rmToken) return authData.rmToken;

    // Prefer the active role session (user object present) to avoid mixed tokens
    if (authData?.adminUser && authData?.adminToken) return authData.adminToken;
    if (authData?.rsmUser && (authData?.rawRsmToken || authData?.rsmToken)) {
      return authData.rawRsmToken || authData.rsmToken;
    }
    if (authData?.asmUser && (authData?.rawAsmToken || authData?.asmToken)) {
      return authData.rawAsmToken || authData.asmToken;
    }
    if (authData?.rmUser && authData?.rmToken) return authData.rmToken;
    if (authData?.partnerUser && authData?.partnerToken) return authData.partnerToken;
    if (authData?.customerUser && authData?.customerToken) return authData.customerToken;
    return (
      authData?.adminToken ||
      authData?.rmToken ||
      authData?.rawRsmToken ||
      authData?.rawAsmToken ||
      authData?.rsmToken ||
      authData?.asmToken ||
      authData?.partnerToken ||
      authData?.customerToken ||
      null
    );
  }

  getSocketUrl() {
    // Same host as REST API (VITE_API_URL / production) — never hardcode localhost.
    // Optional override: VITE_SOCKET_URL
    const fromEnv = import.meta.env.VITE_SOCKET_URL;
    const isBrowser = typeof window !== "undefined";
    const isLocalhostHost = isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (fromEnv && String(fromEnv).trim()) {
      const clean = String(fromEnv).trim().replace(/\/+$/, "");
      if (isLocalhostHost || !clean.includes("localhost")) {
        return clean;
      }
    }

    let socketUrl = backendOrigin || backendurl.replace(/\/api\/?$/, "");
    socketUrl = String(socketUrl).replace(/\/+$/, "");
    if (!socketUrl.includes("://")) {
      socketUrl = `https://${socketUrl}`;
    }
    return socketUrl;
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    // Already connecting / existing instance — reuse and ensure handlers
    if (this.socket && !this.socket.connected) {
      this.socket.auth = { token };
      if (!this._connecting) {
        this._connecting = true;
        this.socket.connect();
      }
      return this.socket;
    }

    if (this._connecting) {
      return this.socket;
    }

    this._connecting = true;
    this._connectingSince = Date.now();
    const socketUrl = this.getSocketUrl();
    console.log("🔌 Socket connecting to:", socketUrl);

    this.socket = io(socketUrl, {
      auth: { token },
      path: "/socket.io",
      // Polling first is more reliable across nginx / local; then upgrades
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 15000,
      forceNew: false,
      autoConnect: true,
      withCredentials: false,
    });

    this.setupEventHandlers();
    this.rebindDynamicEvents();

    return this.socket;
  }

  /**
   * Ensure socket is connected after login / route changes.
   */
  ensureConnected() {
    const token = this.getToken();
    if (!token) return null;

    // Rebuild if socket is pointed at the wrong host (e.g. old Vite proxy origin)
    if (this.socket) {
      try {
        const desiredHost = new URL(this.getSocketUrl()).host;
        const currentUri = this.socket.io?.uri || "";
        const currentHost = currentUri ? new URL(currentUri).host : "";
        if (currentHost && currentHost !== desiredHost) {
          this.disconnect(false);
        }
      } catch (_) {
        // ignore URL parse issues
      }
    }

    if (this.socket?.connected) {
      // Token/role changed (e.g. /admin vs leftover RSM) — must reconnect as new user
      if (this.socket.auth?.token !== token) {
        this.disconnect(false);
        return this.connect();
      }
      this.isConnected = true;
      this._connecting = false;
      // Re-notify late subscribers (chat UI mounted after connect)
      this.emit("socketConnected", { connected: true, socketId: this.socket.id, synced: true });
      return this.socket;
    }

    // Reset stuck connecting flag so retries can proceed
    if (this._connecting && this.socket && !this.socket.connected) {
      const startedAgo = this._connectingSince ? Date.now() - this._connectingSince : 99999;
      if (startedAgo > 8000) {
        this._connecting = false;
      }
    }

    // Token changed — rebuild connection
    if (this.socket && this.socket.auth?.token !== token) {
      this.disconnect(false);
    }

    return this.connect();
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.off("connect");
    this.socket.off("disconnect");
    this.socket.off("connect_error");

    this.socket.on("connect", () => {
      this.isConnected = true;
      this._connecting = false;
      this.reconnectAttempts = 0;
      this.rebindDynamicEvents();
      this.emit("socketConnected", { connected: true, socketId: this.socket.id });
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      this._connecting = false;
      this.emit("socketDisconnected", { reason });
    });

    this.socket.on("connect_error", (error) => {
      this.isConnected = false;
      this._connecting = false;
      this.reconnectAttempts += 1;
      this.emit("socketDisconnected", { reason: error.message });
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit("socketConnectionFailed", { error: error.message });
      }
    });

    // Core app events (always bound)
    const coreEvents = [
      "authenticated",
      "unauthorized",
      "applicationUpdated",
      "newApplication",
      "documentUploaded",
      "documentStatusChanged",
      "partnerStatusChanged",
      "newPartnerRegistered",
      "newCustomerRegistered",
      "payoutStatusChanged",
      "incentiveStatusChanged",
      "notification",
      "targetUpdated",
      "dashboardUpdate",
      "bannersUpdated",
      "partnerLevelsUpdated",
      "referralBannersUpdated",
      "referralRewardAmountsUpdated",
      "referralUpdated",
      "userOnline",
      "userOffline",
      // Staff chat
      "chat:presence",
      "chat:online_staff_list",
      "chat:new_message",
      "chat:incoming_message",
      "chat:message_sent",
      "chat:messages_read",
      "chat:user_typing",
      "chat:user_stop_typing",
    ];

    coreEvents.forEach((eventName) => {
      this.bindSocketEvent(eventName);
    });
  }

  bindSocketEvent(eventName) {
    if (!this.socket || this.boundSocketEvents.has(eventName)) return;
    this.boundSocketEvents.add(eventName);
    this.socket.on(eventName, (data) => {
      this.emit(eventName, data);
    });
  }

  rebindDynamicEvents() {
    // Re-bind any events that listeners registered before socket existed
    for (const eventName of this.listeners.keys()) {
      this.bindSocketEvent(eventName);
    }
  }

  emitToServer(event, data, ack) {
    if (this.socket?.connected) {
      if (typeof ack === "function") {
        this.socket.emit(event, data, ack);
      } else {
        this.socket.emit(event, data);
      }
      return true;
    }
    return false;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    // Bind on live socket so late subscribers still receive server events
    this.bindSocketEvent(event);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  emit(eventName, data) {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks?.length) return;
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Socket listener error (${eventName}):`, error);
      }
    });
  }

  disconnect(clearListeners = true) {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this._connecting = false;
    this.boundSocketEvents.clear();
    if (clearListeners) {
      this.listeners.clear();
    }
  }

  reconnect() {
    this.disconnect(false);
    return this.connect();
  }

  getSocket() {
    return this.socket;
  }

  getIsConnected() {
    // Trust the live socket.io connected flag (avoids stale isConnected boolean)
    return !!this.socket?.connected;
  }

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

const socketManager = new SocketManager();

export default socketManager;
