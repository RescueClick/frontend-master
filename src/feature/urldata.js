const envUrl = import.meta.env.VITE_API_URL;
const isBrowser = typeof window !== "undefined";
const isLocalhostHost = isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// API base URL — dynamically use current browser origin on production (handles both www. and non-www. smoothly)
export const backendurl =
  isBrowser && window.location.hostname.includes("dhansourcecapital.com")
    ? `${window.location.origin}/api`
    : (!isLocalhostHost && envUrl && envUrl.includes("localhost"))
      ? "https://dhansourcecapital.com/api"
      : (envUrl || "https://dhansourcecapital.com/api");

/** Socket / HTTP host without the /api suffix */
export const backendOrigin = backendurl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
