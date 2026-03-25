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

export { brandLogo };
