import axios from "axios";
import { backendurl } from "../feature/urldata";

export function getGoogleWebClientId() {
  return String(import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || "").trim();
}

export function isGoogleLoginConfigured() {
  return Boolean(getGoogleWebClientId());
}

/**
 * Exchange Google ID token for DhanSource session (same as partner app).
 * @param {string} idToken
 */
export async function loginWithGoogleIdToken(idToken) {
  const response = await axios.post(`${backendurl}/auth/google-login`, {
    idToken,
  });
  const body = response?.data ?? {};
  const nested = body?.data ?? {};
  const deepest = nested?.data ?? {};
  const token = body?.token || nested?.token || deepest?.token;
  const user = body?.user || nested?.user || deepest?.user;
  if (!token || !user) {
    throw new Error(
      body?.message ||
        nested?.message ||
        "Google login failed (invalid server response)."
    );
  }
  return { token, user };
}
