import axios from "axios";
import { backendurl } from "./urldata";
import { PUBLIC_LOAN_REFERRAL_FALLBACK_PARTNER_CODE } from "../config/publicReferral.js";

/** Set by `LoginPage` when user opens `/LoginPage?ref=PT-XXXX` */
export const PARTNER_REF_SESSION_KEY = "dhansource_partner_referral_ref";

const FALLBACK = PUBLIC_LOAN_REFERRAL_FALLBACK_PARTNER_CODE;

let cachedCode = null;
let inflight = null;

/**
 * Partner code suggested on public loan application forms (admin-configurable).
 * Cached for the SPA session to avoid repeated requests.
 */
export async function fetchPublicDefaultPartnerReferralCode() {
  if (cachedCode != null) return cachedCode;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const fromLoginLink = String(
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem(PARTNER_REF_SESSION_KEY) || ""
          : ""
      ).trim();
      if (fromLoginLink) {
        cachedCode = fromLoginLink;
        return fromLoginLink;
      }
    } catch {
      /* ignore */
    }
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

export function clearPublicDefaultPartnerReferralCache() {
  cachedCode = null;
}

export { FALLBACK as PUBLIC_LOAN_REFERRAL_FALLBACK };
