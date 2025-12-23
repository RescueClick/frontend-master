import { useEffect } from "react";
import socketManager from "../utils/socket";
import { useSocket } from "../hooks/useSocket";

// Socket Provider Component - Initialize socket connection on app load
export const SocketProvider = ({ children }) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    // Connect socket when app loads (only once)
    const connectSocket = () => {
      try {
        // Check if already connected
        if (socketManager.getIsConnected()) {
          console.log("✅ SocketProvider: Socket already connected, skipping");
          return;
        }

        console.log("🔌 SocketProvider: Attempting to connect socket...");
        const socket = socketManager.connect();
        if (socket) {
          console.log("✅ SocketProvider: Socket connection initiated, socket ID:", socket.id);
          
          // Verify connection after a short delay
          setTimeout(() => {
            const connected = socketManager.getIsConnected();
            console.log("🔌 SocketProvider: Connection status check:", connected);
            if (!connected) {
              console.warn("⚠️ SocketProvider: Socket not connected after delay, may need retry");
            }
          }, 2000);
        } else {
          console.warn("⚠️ SocketProvider: Socket connection returned null - may retry when token is available");
        }
      } catch (error) {
        console.error("❌ SocketProvider: Failed to connect socket:", error);
      }
    };

    // Small delay to ensure token is available
    const timer = setTimeout(connectSocket, 100);

    // Keep connection alive - don't disconnect on unmount
    return () => {
      clearTimeout(timer);
      // Don't disconnect - keep connection alive during navigation
    };
  }, []);

  return <>{children}</>;
};
