// API base must match the server scheme: local Express is almost always HTTP, not HTTPS.
// Set VITE_API_URL in .env (e.g. https://api.yourdomain.com/api for production).
export const backendurl =
    import.meta.env.VITE_API_URL || "https://trustlinefintech.com/api";
// export const backendurl = "http://localhost:5000/api";
