const envUrl = import.meta.env.VITE_API_URL;
const isBrowser = typeof window !== "undefined";
const isLocalhostHost = isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// API base URL — always prefer live backend unless running locally on localhost
export const backendurl =
  (!isLocalhostHost && envUrl && envUrl.includes("localhost"))
    ? "https://dhansourcecapital.com/api"
    : (envUrl || "https://dhansourcecapital.com/api");

/** Socket / HTTP host without the /api suffix */
export const backendOrigin = backendurl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
