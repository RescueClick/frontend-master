import axios from "axios";
import { backendurl } from "../feature/urldata";
import { loanFieldToApiDocType } from "./loanDocumentUpload";

/**
 * Upload a picked partner loan document straight to the LEAD created on step 1,
 * so the RM receives the file with its documents even if the partner never submits.
 * Final submit still re-sends every file and replaces the doc list.
 * Non-fatal: never throws.
 */
export async function uploadLeadDocumentEarly({
  applicationId,
  partnerToken,
  isPartnerLoggedIn,
  fieldName,
  file,
}) {
  if (!applicationId || !partnerToken || !isPartnerLoggedIn || !file) {
    return { ok: false, skipped: true };
  }
  try {
    const docType = loanFieldToApiDocType(fieldName);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    await axios.post(
      `${backendurl}/partner/applications/${applicationId}/documents?docType=${encodeURIComponent(docType)}`,
      fd,
      { headers: { Authorization: `Bearer ${partnerToken}` }, timeout: 120000 }
    );
    return { ok: true, docType };
  } catch (err) {
    console.warn(
      `[earlyLeadDoc] ${fieldName} not synced to RM yet:`,
      err?.response?.data?.message || err?.message
    );
    return { ok: false, error: err };
  }
}
