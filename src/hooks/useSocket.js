import { useCallback, useEffect, useRef, useState } from "react";
import socketManager from "../utils/socket";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(() => socketManager.getIsConnected());
  const [socket, setSocket] = useState(() => socketManager.getSocket());
  const listenersRef = useRef([]);

  const syncConnectionState = useCallback(() => {
    const connected = socketManager.getIsConnected();
    const sock = socketManager.getSocket();
    setIsConnected(connected);
    setSocket(sock);
    return connected;
  }, []);

  useEffect(() => {
    // Connect (or reconnect) whenever a staff/partner token is available
    socketManager.ensureConnected();
    syncConnectionState();

    const handleConnect = () => syncConnectionState();
    const handleDisconnect = () => syncConnectionState();

    socketManager.on("socketConnected", handleConnect);
    socketManager.on("socketDisconnected", handleDisconnect);

    // Keep UI in sync even if the connect event was missed
    const syncTimer = setInterval(() => {
      if (!socketManager.getIsConnected() && socketManager.getToken()) {
        socketManager.ensureConnected();
      }
      syncConnectionState();
    }, 2000);

    const onAuthChanged = () => {
      setTimeout(() => {
        socketManager.ensureConnected();
        syncConnectionState();
      }, 150);
    };

    window.addEventListener("storage", onAuthChanged);
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("focus", onAuthChanged);

    return () => {
      clearInterval(syncTimer);
      window.removeEventListener("storage", onAuthChanged);
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("focus", onAuthChanged);
      socketManager.off("socketConnected", handleConnect);
      socketManager.off("socketDisconnected", handleDisconnect);
    };
  }, [syncConnectionState]);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach(({ event, callback }) => {
        socketManager.off(event, callback);
      });
      listenersRef.current = [];
    };
  }, []);

  const subscribe = useCallback((event, callback) => {
    socketManager.on(event, callback);
    listenersRef.current.push({ event, callback });
  }, []);

  const unsubscribe = useCallback((event, callback) => {
    socketManager.off(event, callback);
    listenersRef.current = listenersRef.current.filter(
      (listener) => !(listener.event === event && listener.callback === callback)
    );
  }, []);

  const emit = useCallback((event, data, ack) => {
    return socketManager.emitToServer(event, data, ack);
  }, []);

  return {
    isConnected,
    socket,
    subscribe,
    unsubscribe,
    emit,
    ensureConnected: () => {
      const s = socketManager.ensureConnected();
      syncConnectionState();
      return s;
    },
    notifyApplicationStatusChanged: socketManager.notifyApplicationStatusChanged.bind(socketManager),
    notifyNewApplication: socketManager.notifyNewApplication.bind(socketManager),
    notifyDocumentUploaded: socketManager.notifyDocumentUploaded.bind(socketManager),
    notifyDocumentStatusChanged: socketManager.notifyDocumentStatusChanged.bind(socketManager),
    notifyPartnerStatusChanged: socketManager.notifyPartnerStatusChanged.bind(socketManager),
    notifyNewPartnerRegistered: socketManager.notifyNewPartnerRegistered.bind(socketManager),
    notifyNewCustomerRegistered: socketManager.notifyNewCustomerRegistered.bind(socketManager),
    notifyPayoutStatusChanged: socketManager.notifyPayoutStatusChanged.bind(socketManager),
    notifyTargetUpdated: socketManager.notifyTargetUpdated.bind(socketManager),
    requestDashboardUpdate: socketManager.requestDashboardUpdate.bind(socketManager),
  };
};
