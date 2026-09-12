import axios from "axios";
import { backendurl } from "./urldata";
import { PUBLIC_LOAN_REFERRAL_FALLBACK_PARTNER_CODE } from "../config/publicReferral.js";
import { COMPANY_NAME, COMPANY_NAME_LEGAL } from "../config/branding.js";

/** Key for storing partner referral code in sessionStorage */
export const PARTNER_REF_SESSION_KEY = "dhansource_partner_referral_ref";
export const PARTNER_INFO_SESSION_KEY = "dhansource_partner_referral_info";

/**
 * Set partner referral code directly in session storage and runtime cache.
 */
export function setPartnerReferralSession(code) {
  try {
    const trimmed = String(code || "").trim();
    if (trimmed) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(PARTNER_REF_SESSION_KEY, trimmed);
      }
      cachedCode = trimmed;
    }
  } catch {
    /* ignore session storage errors */
  }
}

const FALLBACK = PUBLIC_LOAN_REFERRAL_FALLBACK_PARTNER_CODE;

let cachedCode = null;
let inflight = null;
const partnerInfoCache = new Map();

/**
 * Extract referral code from URL search params (or fallback to sessionStorage).
 * Supports ?ref=, ?partner=, ?partnerCode=, ?code=
 */
export function getPartnerReferralFromUrlOrSession() {
  try {
    if (typeof window !== "undefined" && window.location?.search) {
      const sp = new URLSearchParams(window.location.search);
      const codeFromUrl = (
        sp.get("ref") ||
        sp.get("partner") ||
        sp.get("partnerCode") ||
        sp.get("code") ||
        ""
      ).trim();

      if (codeFromUrl) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(PARTNER_REF_SESSION_KEY, codeFromUrl);
        }
        cachedCode = codeFromUrl;
        return codeFromUrl;
      }
    }
  } catch {
    /* ignore search parsing errors */
  }

  try {
    if (typeof sessionStorage !== "undefined") {
      const stored = (sessionStorage.getItem(PARTNER_REF_SESSION_KEY) || "").trim();
      if (stored) {
        cachedCode = stored;
        return stored;
      }
    }
  } catch {
    /* ignore session storage errors */
  }

  return "";
}

/**
 * Partner code suggested on public loan application forms (admin-configurable or url/session).
 * Cached for the SPA session to avoid repeated requests.
 */
export async function fetchPublicDefaultPartnerReferralCode() {
  const fromUrlOrSession = getPartnerReferralFromUrlOrSession();
  if (fromUrlOrSession) {
    cachedCode = fromUrlOrSession;
    return fromUrlOrSession;
  }

  if (cachedCode != null) return cachedCode;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data } = await axios.get(
        `${backendurl}/partner/public-default-referral-code`
      );
      const code = String(data?.partnerCode ?? "").trim() || FALLBACK;
      cachedCode = code;
      return code;
    } catch {
      cachedCode = FALLBACK;
      return FALLBACK;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Fetch verified public information of a partner by partnerCode (name, certificate info, status).
 * Returns null if not found or inactive.
 */
export async function fetchPublicPartnerInfo(partnerCode) {
  const code = String(partnerCode || "").trim();
  if (!code) return null;

  if (partnerInfoCache.has(code.toUpperCase())) {
    return partnerInfoCache.get(code.toUpperCase());
  }

  try {
    // Check sessionStorage cache
    if (typeof sessionStorage !== "undefined") {
      const storedRaw = sessionStorage.getItem(`${PARTNER_INFO_SESSION_KEY}_${code.toUpperCase()}`);
      if (storedRaw) {
        const parsed = JSON.parse(storedRaw);
        partnerInfoCache.set(code.toUpperCase(), parsed);
        return parsed;
      }
    }

    const { data } = await axios.get(
      `${backendurl}/partner/public-partner-info/${encodeURIComponent(code)}`
    );

    if (data?.success && data?.partner) {
      partnerInfoCache.set(code.toUpperCase(), data.partner);
      if (typeof sessionStorage !== "undefined") {
        try {
          sessionStorage.setItem(
            `${PARTNER_INFO_SESSION_KEY}_${code.toUpperCase()}`,
            JSON.stringify(data.partner)
          );
        } catch {
          /* ignore storage quota */
        }
      }
      return data.partner;
    }
    return null;
  } catch (err) {
    // Partner not found or inactive
    return null;
  }
}

/**
 * Builds the canonical public digital storefront URL for a partner advisor.
 * This links to the advisor profile displaying partner credentials, trust badges,
 * and all loan products so the customer can pick any loan to apply for.
 * @param {string} partnerCode - e.g. "PT-1002"
 */
export function buildPartnerStoreUrl(partnerCode) {
  const code = String(partnerCode || "").trim();
  let baseOrigin = "";
  if (typeof window !== "undefined" && window.location?.origin) {
    baseOrigin = window.location.origin;
  }
  return code ? `${baseOrigin}/advisor/${encodeURIComponent(code)}` : `${baseOrigin}/advisor`;
}

/**
 * Builds the canonical public loan application URL for a customer, tied to the partner.
 * @param {string} route - e.g. "/partner/application/personal-loan" or "personal-loan"
 * @param {string} partnerCode - e.g. "PT-1002"
 */
export function buildPartnerLoanShareUrl(route, partnerCode) {
  const code = String(partnerCode || "").trim();
  let baseOrigin = "";
  if (typeof window !== "undefined" && window.location?.origin) {
    baseOrigin = window.location.origin;
  }

  // Normalize route path to public form route
  let cleanRoute = route;
  if (!cleanRoute.startsWith("/")) cleanRoute = `/${cleanRoute}`;
  if (!cleanRoute.startsWith("/partner/application") && !cleanRoute.startsWith("/apply")) {
    cleanRoute = `/partner/application${cleanRoute.replace(/^\/partner/, "")}`;
  }

  const query = code ? `?ref=${encodeURIComponent(code)}` : "";
  return `${baseOrigin}${cleanRoute}${query}`;
}

/**
 * Prepares professional, minimal WhatsApp promotional text matching WeRize Dukaan style.
 * Displays certified advisor credentials and directs customer to the partner's storefront
 * containing all loan products.
 */
export function buildPartnerLoanShareMessage({
  loanTitle = "",
  loanBadge = "",
  loanUrl = "",
  partnerName = "",
  partnerCode = "",
  location = "",
}) {
  const name = partnerName || "Certified Loan Advisor";
  const idStr = partnerCode ? `🆔 Partner ID: *${partnerCode}*` : "";
  const locStr = location ? ` | 📍 ${location}` : "";
  const metaLine = [idStr, locStr].filter(Boolean).join("");
  const storeLink = loanUrl || buildPartnerStoreUrl(partnerCode);

  return [
    `🌟 *Get free financial consultation of Loans, Insurance or any other financial Products.*`,
    ``,
    `💼 *${name}* — Certified Financial Advisor`,
    metaLine,
    `⚡ Instant Loans • Zero Advance Fees • 100% Digital`,
    ``,
    `👉 *View Profile & Choose Loan to Apply:*`,
    storeLink,
  ].filter((line) => line !== null && line !== undefined).join("\n");
}

export function clearPublicDefaultPartnerReferralCache() {
  cachedCode = null;
  partnerInfoCache.clear();
}

export { FALLBACK as PUBLIC_LOAN_REFERRAL_FALLBACK };
