// API base URL — always prefer env, otherwise the live backend.
// Local backend only when you explicitly set VITE_API_URL=http://localhost:5000/api
export const backendurl =
  import.meta.env.VITE_API_URL || "https://dhansourcecapital.com/api";

/** Socket / HTTP host without the /api suffix */
export const backendOrigin = backendurl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
