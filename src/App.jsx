import "./App.css";
import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { getAuthData } from "./utils/localStorage";
import DhanSourceLoader from "./components/DhanSourceLoader";

/** Keep Suspense fallback visible at least this long so the loader does not flash off. */
const MIN_APP_SPLASH_MS = 1000;

const AppRoutes = lazy(() =>
  Promise.all([
    import("./AppRoutes"),
    new Promise((resolve) => setTimeout(resolve, MIN_APP_SPLASH_MS)),
  ]).then(([mod]) => mod)
);

import axios from "axios";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Add global axios interceptor for 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const url = String(error.config?.url || "");
          // Let login/Google/signup show their own errors — do not bounce to a 404 `/login`
          const isAuthAttempt =
            /\/auth\/(login|google-login)\b/i.test(url) ||
            /\/partner\/signup-partner\b/i.test(url) ||
            /\/auth\/(request-password-reset|reset-password|confirm-email-change)\b/i.test(
              url
            );

          if (!isAuthAttempt) {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("partner_token");
            localStorage.removeItem("asm_token");
            localStorage.removeItem("rsm_token");
            localStorage.removeItem("rm_token");
            localStorage.removeItem("customer_token");
            localStorage.removeItem("impersonation_stack");
            navigate("/LoginPage", { replace: true });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  useEffect(() => {
    const handlePopState = () => {
      const { impersonationStack = [], adminToken } = getAuthData();

      if (impersonationStack.length > 0) {
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

  return (
    <Suspense fallback={<DhanSourceLoader fullScreen label="Loading app…" />}>
      <Toaster position="top-right" reverseOrder={false} />
      <AppRoutes />
    </Suspense>
  );
}

export default App;
