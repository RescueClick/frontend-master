/**
 * DhanSource Capital — branding
 * Use `COMPANY_NAME` (short) in UI, nav, and almost all copy.
 * Use `COMPANY_NAME_LEGAL` only for the site footer copyright line (and matching email copyright in backend).
 *
 * Logo: transparent PNG for nav / login (works on any background). Source: `src/assets/logo_list/`.
 */
import brandLogo from "../assets/logo_list/logo-horizontal-1200x400.png";

export const loginBanner = brandLogo;

export const COMPANY_NAME = "DhanSource Capital";

/** Full legal name — website footer copyright, legal name field, contracts */
export const COMPANY_NAME_LEGAL = "DhanSource Capital Pvt Ltd";

export const COMPANY_TAGLINE = "Financial Consultancy";

/**
 * Logo-aligned palette (DhanSource mark: teal “Source” + gold धन).
 * Use for inline styles; prefer Tailwind `brand-*` theme classes in JSX where possible.
 */
export const BRAND_PRIMARY = "#0d9488";
export const BRAND_PRIMARY_HOVER = "#0f766e";
export const BRAND_PRIMARY_LIGHT = "#5eead4";
export const BRAND_PRIMARY_MUTED = "#ccfbf1";
export const BRAND_GOLD = "#ca8a04";
export const BRAND_GOLD_LIGHT = "#fbbf24";
export const BRAND_GOLD_MUTED = "#fffbeb";

/** Update these to your live support / legal inboxes */
export const CONTACT_EMAIL = "contact@dhansourcecapital.com";
export const SUPPORT_EMAIL = "support@dhansourcecapital.com";
export const LEGAL_EMAIL = "legal@dhansourcecapital.com";
export const PRIVACY_EMAIL = "privacy@dhansourcecapital.com";

/** Public web origin for fixing legacy links if API still returns an old domain */
export const PUBLIC_WEB_ORIGIN = String(
  import.meta.env.VITE_PUBLIC_WEB_URL || "https://dhansourcecapital.com"
).replace(/\/$/, "");

/** Rewrite URLs that still use Trustline domains to the DhanSource site */
export function rewriteLegacyTrustlineUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!/trustline/i.test(url)) return url;
  try {
    const parsed = new URL(url);
    const base = new URL(PUBLIC_WEB_ORIGIN);
    parsed.protocol = base.protocol;
    parsed.host = base.host;
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Partner Android app on Play Store (for invite messages). Override with VITE_PARTNER_APP_PLAY_STORE_URL.
 * Replace placeholder package id when the real app is published.
 */
export const PARTNER_APP_PLAY_STORE_URL = String(
  import.meta.env.VITE_PARTNER_APP_PLAY_STORE_URL ||
    "https://play.google.com/store/apps/details?id=com.dhansourcecapital.partner"
).trim();

/** Match backend `appendPartnerShareUtm` for client-built fallback URLs */
export function appendPartnerShareUtm(url, kind = "web") {
  if (!url || typeof url !== "string") return url;
  if (/[?&]utm_source=/i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  const medium = kind === "invite" ? "app_invite_landing" : "web_partner_registration";
  return `${url}${sep}utm_source=partner_share&utm_medium=${encodeURIComponent(medium)}&utm_campaign=partner_signup`;
}

/** Open WhatsApp with a pre-filled message (plain text; will be URL-encoded). */
export function whatsAppShareUrl(messageText) {
  return `https://wa.me/?text=${encodeURIComponent(messageText ?? "")}`;
}

/** Prefer `PT-…` when either `partnerCode` or `referralCode` holds it (keep aligned with app `branding.js`). */
export function canonicalPartnerReferralCode(partnerCode, referralCode) {
  const a = String(partnerCode || "").trim();
  const b = String(referralCode || "").trim();
  if (/^PT-/i.test(a)) return a;
  if (/^PT-/i.test(b)) return b;
  if (a) return a;
  if (b) return b;
  return "";
}

export function legacyReferralAlternate(partnerCode, referralCode) {
  const canonical = canonicalPartnerReferralCode(partnerCode, referralCode);
  if (!canonical) return "";
  const a = String(partnerCode || "").trim();
  const b = String(referralCode || "").trim();
  if (a && a.toUpperCase() !== canonical.toUpperCase()) return a;
  if (b && b.toUpperCase() !== canonical.toUpperCase()) return b;
  return "";
}

export { brandLogo };
