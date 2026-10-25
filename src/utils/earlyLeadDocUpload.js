import axios from "axios";
import { backendurl } from "../feature/urldata";
import { loanFieldToApiDocType } from "./loanDocumentUpload";
import { compressImageIfApplicable } from "./compressImage";

/**
 * Upload a picked loan document immediately to the LEAD/application in the background.
 * Uses client-side image compression to reduce 5MB-10MB photos to ~500KB.
 * Supports both Partner (authenticated) and Public/Guest applicants.
 * Returns the compressed file and server upload status.
 */
export async function uploadLeadDocumentEarly({
  applicationId,
  partnerToken,
  isPartnerLoggedIn,
  fieldName,
  file,
  onProgress,
}) {
  if (!applicationId || !file) {
    return { ok: false, skipped: true, file };
  }

  try {
    // 1. Compress image in browser if applicable
    const compressedFile = await compressImageIfApplicable(file);

    const docType = loanFieldToApiDocType(fieldName);
    const fd = new FormData();
    fd.append("file", compressedFile);
    fd.append("docType", docType);

    const headers = {};
    if (isPartnerLoggedIn && partnerToken) {
      headers.Authorization = `Bearer ${partnerToken}`;
    }

    const endpoint = isPartnerLoggedIn && partnerToken
      ? `${backendurl}/partner/applications/${applicationId}/documents?docType=${encodeURIComponent(docType)}`
      : `${backendurl}/partner/public/applications/${applicationId}/documents?docType=${encodeURIComponent(docType)}`;

    const response = await axios.post(endpoint, fd, {
      headers,
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        if (typeof onProgress === "function" && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    const docObj = response.data?.document || response.data?.doc;
    const uploadedUrl = docObj?.url || response.data?.uploadedUrl || "";

    return {
      ok: true,
      docType,
      file: compressedFile,
      doc: docObj,
      uploadedUrl,
    };
  } catch (err) {
    console.warn(
      `[earlyLeadDoc] ${fieldName} background sync error:`,
      err?.response?.data?.message || err?.message
    );
    return { ok: false, error: err, file };
  }
}
