import React from "react";
import { FileText } from "lucide-react";
import { loanDocumentFieldHint } from "../../utils/loanDocumentUpload";
import {
  ADDRESS_PROOF_SECTION_LEAD,
  ADDRESS_PROOF_SECTION_TITLE,
} from "../../utils/loanAddressProofCopy";

/**
 * Unified address proof UI: one file upload, accepted examples in copy, stored as ADDRESS_PROOF.
 */
export default function LoanAddressProofBlock({
  file,
  inputName = "addressProof",
  errorKey = "addressProof",
  stepLabel = "",
  onChange,
  renderError,
  onPreview,
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
      <label className="block text-sm font-medium mb-2 text-gray-900">
        Upload your address proof *
      </label>
      <p className="text-xs text-slate-500 mb-2 leading-relaxed">
        {loanDocumentFieldHint("addressProof")}
      </p>
      <input
        type="file"
        name={inputName}
        onChange={onChange}
        accept=".pdf,.jpg,.jpeg,.png"
        className="w-full px-4 py-3 border-2 border-teal-500 rounded-lg focus:outline-none focus:border-teal-600 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-500 file:text-white hover:file:bg-teal-600 bg-slate-50"
      />
      {renderError?.(errorKey)}

      {file && onPreview && (
        <div className="mt-2 text-sm text-gray-700">
          <button
            type="button"
            className="text-blue-600 underline"
            onClick={onPreview}
          >
            {file.type?.includes?.("image") ? "🖼️" : "📄"} {file.name} (Preview)
          </button>
        </div>
      )}
    </>
  );
}
