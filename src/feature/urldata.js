// API base URL configuration:
// Defaults to http://localhost:5000/api when running on localhost, or uses VITE_API_URL / production url.
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("192.168."));

export const backendurl =
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? "http://localhost:5000/api" : "https://dhansourcecapital.com/api");