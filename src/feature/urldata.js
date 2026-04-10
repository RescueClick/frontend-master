// API base must match the server scheme: local Express is almost always HTTP, not HTTPS.
// Set VITE_API_URL in .env (e.g. https://api.yourdomain.com/api for production).
// Backend base URL for API calls.
// Must include the `/api` path if your backend mounts routes like `/api/auth/login`.
// export const backendurl =
//   import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// export const backendurl = import.meta.env.VITE_API_URL || "https://dhansourcecapital.com/api";
export const backendurl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";