import "./App.css";
import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

function App() {
  const navigate = useNavigate();

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
      <AppRoutes />
    </Suspense>
  );
}

export default App;
