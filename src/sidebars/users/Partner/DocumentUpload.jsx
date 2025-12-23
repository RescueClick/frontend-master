import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata.js";
import { getAuthData } from "../../../utils/localStorage.js";

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const customerId = searchParams.get("customerId");
  const docType = searchParams.get("docType");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    if (applicationId && customerId) {
      fetchApplicationData();
    }
  }, [applicationId, customerId]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const { partnerToken } = getAuthData();

      if (!partnerToken) {
        alert("Authentication required");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${backendurl}/partner/customers/${customerId}/applications/${applicationId}`,
        {
          headers: { Authorization: `Bearer ${partnerToken}` },
        }
      );

      setApplicationData(response.data);

      // Check if document is already uploaded
      const existingDoc = response.data.docs?.find(
        (doc) => doc.docType?.toUpperCase() === docType?.toUpperCase()
      );
      if (existingDoc) {
        setDocument(existingDoc);
        if (existingDoc.url) {
          setSelectedFile({ 
            name: getDocumentDisplayName(docType),
            url: existingDoc.url 
          });
        }
      }
    } catch (err) {
      console.error("Error fetching application data:", err);
      alert("Failed to fetch application data");
    } finally {
      setLoading(false);
    }
  };

  const getDocumentDisplayName = (docType) => {
    const docNames = {
      PAN: "PAN Card",
      AADHAR_FRONT: "Aadhaar Front",
      AADHAR_BACK: "Aadhaar Back",
      SALARY_SLIP_1: "Salary Slip",
      SALARY_SLIP_2: "Salary Slip 2",
      SALARY_SLIP_3: "Salary Slip 3",
      BANK_STATEMENT: "Bank Statement",
      GST_CERTIFICATE: "GST Certificate",
      PHOTO: "Photo",
      SELFIE: "Selfie",
      ADDRESS_PROOF: "Address Proof",
      OTHER_DOCS: "Other Documents",
      ALLOTMENT_LETTER: "Allotment Letter",
      NEW_PROPERTY_PAYMENT_RECEIPTS: "New Property Payment Receipts",
      TITLE_DEEDS: "Title Deeds",
      RESALE_PAYMENT_RECEIPTS: "Resale Payment Receipts",
      AGREEMENT_COPY: "Agreement Copy",
    };
    return docNames[docType] || docType;
  };

  const getDocumentDescription = (docType) => {
    const descriptions = {
      PAN: "Upload customer's PAN card",
      AADHAR_FRONT: "Upload customer's Aadhaar card front side",
      AADHAR_BACK: "Upload customer's Aadhaar card back side",
      SALARY_SLIP_1: "Upload customer's latest salary slip",
      SALARY_SLIP_2: "Upload customer's second salary slip",
      SALARY_SLIP_3: "Upload customer's third salary slip",
      BANK_STATEMENT: "Upload customer's latest 12-month bank statement",
      GST_CERTIFICATE: "Upload GST certificate",
      PHOTO: "Upload customer's passport size photo",
      SELFIE: "Upload customer's selfie",
      ADDRESS_PROOF: "Upload address proof document",
      OTHER_DOCS: "Upload other supporting documents",
      ALLOTMENT_LETTER: "Upload allotment letter",
      NEW_PROPERTY_PAYMENT_RECEIPTS: "Upload new property payment receipts",
      TITLE_DEEDS: "Upload title deeds",
      RESALE_PAYMENT_RECEIPTS: "Upload resale payment receipts",
      AGREEMENT_COPY: "Upload agreement copy",
    };
    return descriptions[docType] || `Upload ${getDocumentDisplayName(docType)}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid file (JPEG, PNG, GIF, or PDF)");
        e.target.value = '';
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        e.target.value = '';
        return;
      }

      setSelectedFile({
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedFile.file) {
      alert("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      const { partnerToken } = getAuthData();

      if (!partnerToken) {
        alert("Authentication required");
        setUploading(false);
        return;
      }

      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile.file);

      // Upload document
      const uploadUrl = `${backendurl}/partner/applications/${applicationId}/documents?docType=${encodeURIComponent(docType)}`;
      
      const response = await axios.post(
        uploadUrl,
        uploadFormData,
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Show success message
      const isUpdate = response?.data?.isUpdate;
      const statusMessage = isUpdate
        ? "Document updated successfully! ✅\n\nStatus: UPDATED\nRM verification is pending. RM has been notified and will review your document."
        : "Document uploaded successfully! ✅\n\nStatus: UPDATED\nRM verification is pending. RM has been notified and will review your document.";

      alert(statusMessage);

      // Refresh application data
      await fetchApplicationData();
      
      // Navigate back
      navigate(-1);
    } catch (err) {
      console.error("Error uploading document:", err);
      
      let errorMessage = "Failed to upload document";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status) {
        errorMessage = `Server error (${err.response.status}): ${err.response.statusText || 'Unknown error'}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(`Upload Error: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isRejected = document?.status === "REJECTED";
  const isUpdated = document?.status === "UPDATED";
  const isVerified = document?.status === "VERIFIED";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Upload Document</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Document Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {getDocumentDisplayName(docType)}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {getDocumentDescription(docType)}
          </p>

          {/* Show current status */}
          {isRejected && document?.remarks && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Previous Rejection Reason:
                  </h3>
                  <p className="text-sm text-red-700 mb-2">{document.remarks}</p>
                  <p className="text-xs text-red-600 italic">
                    Re-uploading will notify RM for review. Please ensure the document meets the requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isUpdated && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">
                    Document Status: UPDATED
                  </h3>
                  <p className="text-sm text-blue-700">
                    This document has been uploaded/updated by you. RM verification is pending. RM will review and verify this document.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isVerified && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-4">
              <div className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-green-800 mb-1">
                    Document Status: VERIFIED
                  </h3>
                  <p className="text-sm text-green-700">
                    This document is already verified. If you update it, RM will need to verify again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="space-y-4">
            {selectedFile ? (
              <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CheckCircle className="text-teal-600 flex-shrink-0" size={24} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-teal-900 truncate">
                      {selectedFile.name}
                    </p>
                    {selectedFile.size && (
                      <p className="text-xs text-teal-700">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    // Reset file input
                    const fileInput = document.getElementById('file-input');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="ml-4 p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-teal-300 rounded-lg p-8 text-center bg-teal-50">
                <p className="text-sm text-gray-600">No file selected</p>
              </div>
            )}

            <div>
              <label
                htmlFor="file-input"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-teal-700 transition-colors"
              >
                <Upload size={20} />
                <span>Choose File</span>
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Supported formats: JPEG, PNG, GIF, PDF (Max 10MB)
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={uploading || !selectedFile || !selectedFile.file}
          className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all ${
            uploading || !selectedFile || !selectedFile.file
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            "SUBMIT"
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
