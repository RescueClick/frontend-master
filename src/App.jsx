import "./App.css";
import AppRoutes from "./AppRoutes";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthData } from "./utils/localStorage";
import { SocketProvider } from "./components/SocketProvider";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = () => {
      const { impersonationStack = [], adminToken } = getAuthData();

      if (impersonationStack.length > 0) {
        // Pop current impersonation
        const stack = [...impersonationStack];
        stack.pop();
        localStorage.setItem("impersonation_stack", JSON.stringify(stack));

        if (stack.length > 0) {
          navigate(
            `/${stack[stack.length - 1].user.role.toLowerCase()}`,
            { replace: true }
          );
        } else if (adminToken) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else if (adminToken) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  // Wrap the whole app with SocketProvider so all routes share one socket connection
  return (
    <SocketProvider>
      <AppRoutes />
    </SocketProvider>
  );
}

export default App;

