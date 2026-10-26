import React from "react";
import { FileText } from "lucide-react";
import { loanDocumentFieldHint } from "../../utils/loanDocumentUpload";
import { ADDRESS_PROOF_SECTION_LEAD } from "../../utils/loanAddressProofCopy";
import DocumentUploadCard from "./DocumentUploadCard";
import { LOAN_SECTION } from "./loanFormSpec";

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
  const heading = [stepLabel, LOAN_SECTION.DOCS_ADDRESS].filter(Boolean).join(" · ");
  return (
    <>
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-900">
        <FileText className="w-5 h-5 text-teal-600" />
        {heading}
      </h3>
      <div
        className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 leading-relaxed"
      >
        {ADDRESS_PROOF_SECTION_LEAD}
      </div>
      <div className="max-w-xl">
        <DocumentUploadCard
          name={inputName}
          label="Address Proof *"
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
