import axios from "axios";
import { backendurl } from "./urldata";

const FALLBACK = "PT-D4CTD8B2";

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
