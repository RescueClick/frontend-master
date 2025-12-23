import { useEffect, useRef, useState } from "react";
import socketManager from "../utils/socket";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef([]);

  useEffect(() => {
    console.log("🔌 useSocket: Initializing socket connection");
    
    // Don't connect here - SocketProvider handles connection
    // Just check status and listen for changes
    const checkConnection = () => {
      const connected = socketManager.getIsConnected();
      console.log("🔌 useSocket: Socket connection status:", connected);
      setIsConnected(connected);
    };
    
    // Check initial status
    checkConnection();
    
    // Don't try to connect - let SocketProvider handle it
    // This prevents multiple connection attempts

    // Listen for connection status
    const handleConnect = () => {
      console.log("✅ useSocket: Socket connected event received");
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.log("❌ useSocket: Socket disconnected event received");
      setIsConnected(false);
    };

    socketManager.on("socketConnected", handleConnect);
    socketManager.on("socketDisconnected", handleDisconnect);

    // Check initial connection status
    const initialStatus = socketManager.getIsConnected();
    console.log("🔌 useSocket: Initial connection status:", initialStatus);
    setIsConnected(initialStatus);

    return () => {
      socketManager.off("socketConnected", handleConnect);
      socketManager.off("socketDisconnected", handleDisconnect);
    };
  }, []);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(({ event, callback }) => {
        socketManager.off(event, callback);
      });
      listenersRef.current = [];
    };
  }, []);

  const subscribe = (event, callback) => {
    socketManager.on(event, callback);
    listenersRef.current.push({ event, callback });
  };

  const unsubscribe = (event, callback) => {
    socketManager.off(event, callback);
    listenersRef.current = listenersRef.current.filter(
      (listener) => !(listener.event === event && listener.callback === callback)
    );
  };

  return {
    isConnected,
    socket: socketManager.getSocket(),
    subscribe,
    unsubscribe,
    emit: socketManager.emitToServer.bind(socketManager),
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
