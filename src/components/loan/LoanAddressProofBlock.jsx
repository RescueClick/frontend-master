import React from "react";
import { FileText } from "lucide-react";
import { loanDocumentFieldHint } from "../../utils/loanDocumentUpload";
import {
  ADDRESS_PROOF_SECTION_LEAD,
  ADDRESS_PROOF_SECTION_TITLE,
} from "../../utils/loanAddressProofCopy";
import DocumentUploadCard from "./DocumentUploadCard";

/**
 * Unified address proof UI: one file upload, accepted examples in copy, stored as ADDRESS_PROOF.
 */
export default function LoanAddressProofBlock({
  file,
  inputName = "addressProof",
  errorKey = "addressProof",
  stepLabel = "",
  onChange,
  onRemove,
  renderError,
  onPreview,
  uploadStatus = "idle",
  uploadProgress = 0,
}) {
  const heading = [stepLabel, ADDRESS_PROOF_SECTION_TITLE].filter(Boolean).join(" · ");
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3 text-gray-900">
        <FileText className="w-6 h-6 text-teal-500" />
        {heading}
      </h2>
      <div
        className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed"
      >
        {ADDRESS_PROOF_SECTION_LEAD}
      </div>
      <div className="max-w-xl">
        <DocumentUploadCard
          name={inputName}
          label="Upload your address proof"
          file={file}
          accept=".pdf,.jpg,.jpeg,.png"
          required={true}
          hint={loanDocumentFieldHint("addressProof")}
          onChange={onChange}
          onRemove={onRemove}
          error={renderError?.(errorKey)}
          onPreview={onPreview}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
        />
      </div>
    </>
  );
}
