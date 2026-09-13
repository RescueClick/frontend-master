import { useCallback, useEffect, useRef, useState } from "react";
import socketManager from "../utils/socket";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(() => socketManager.getIsConnected());
  const [socket, setSocket] = useState(() => socketManager.getSocket());
  const listenersRef = useRef([]);

  useEffect(() => {
    // Connect (or reconnect) whenever a staff/partner token is available
    const sock = socketManager.ensureConnected();
    setSocket(sock || socketManager.getSocket());
    setIsConnected(socketManager.getIsConnected());

    const handleConnect = () => {
      setIsConnected(true);
      setSocket(socketManager.getSocket());
    };
    const handleDisconnect = () => {
      setIsConnected(false);
      setSocket(socketManager.getSocket());
    };

    socketManager.on("socketConnected", handleConnect);
    socketManager.on("socketDisconnected", handleDisconnect);

    // Retry if login happens after first mount (token appears in storage)
    const retryTimer = setInterval(() => {
      if (!socketManager.getIsConnected() && socketManager.getToken()) {
        socketManager.ensureConnected();
        setSocket(socketManager.getSocket());
      }
    }, 4000);

    const onStorage = () => {
      if (socketManager.getToken()) {
        socketManager.ensureConnected();
        setSocket(socketManager.getSocket());
      }
    };
    window.addEventListener("storage", onStorage);
    // Custom event fired by login flows in some apps
    window.addEventListener("auth-changed", onStorage);

    return () => {
      clearInterval(retryTimer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onStorage);
      socketManager.off("socketConnected", handleConnect);
      socketManager.off("socketDisconnected", handleDisconnect);
    };
  }, []);

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
      setSocket(s || socketManager.getSocket());
      setIsConnected(socketManager.getIsConnected());
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
