import { useEffect } from "react";
import socketManager from "../utils/socket";

/**
 * Keeps a single Socket.IO connection alive for the whole app.
 * Reconnects after login when a token becomes available.
 */
export const SocketProvider = ({ children }) => {
  useEffect(() => {
    const tryConnect = () => {
      try {
        if (socketManager.getIsConnected()) return;
        if (!socketManager.getToken()) return;
        socketManager.ensureConnected();
      } catch (error) {
        console.error("SocketProvider connect failed:", error);
      }
    };

    tryConnect();
    const bootTimer = setTimeout(tryConnect, 300);
    const interval = setInterval(tryConnect, 5000);

    const onAuthChanged = () => {
      // Small delay so localStorage write settles
      setTimeout(tryConnect, 150);
    };

    window.addEventListener("storage", onAuthChanged);
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("focus", tryConnect);

    return () => {
      clearTimeout(bootTimer);
      clearInterval(interval);
      window.removeEventListener("storage", onAuthChanged);
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("focus", tryConnect);
    };
  }, []);

  return <>{children}</>;
};
