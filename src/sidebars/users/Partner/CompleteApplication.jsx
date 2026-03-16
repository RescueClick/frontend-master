import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
} from "lucide-react";
import { backendurl } from "../../../feature/urldata.js";
import { getAuthData } from "../../../utils/localStorage.js";

const CompleteApplication = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const customerId = searchParams.get("customerId");

  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState(null);
  const [pendingDocuments, setPendingDocuments] = useState([]);

  // Treat PHOTO and SELFIE (and co-applicant selfie) as the same logical document
  const normalizeDocType = (docType) => {
    const upper = (docType || "").toUpperCase();
    if (upper === "SELFIE" || upper === "CO_APPLICANT_SELFIE") {
      return "PHOTO";
    }
    return upper;
  };

  useEffect(() => {
    if (applicationId && customerId) {
      fetchApplicationData();
    } else {
      setLoading(false);
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

      // Get pending/rejected/updated documents (documents that need to be uploaded/re-uploaded)
      const allDocs = response.data.docs || [];
      const pending = allDocs.filter((doc) =>
        ["REJECTED", "PENDING", "UPDATED"].includes(doc.status)
      );

      // Also check for required documents that might not exist yet
      // Common required document types based on loan type
      const requiredDocTypes = getRequiredDocTypes(response.data.loanType);
      
      const missingDocs = requiredDocTypes
        .filter(
          (docType) =>
            !allDocs.some(
              (doc) =>
                normalizeDocType(doc.docType) === normalizeDocType(docType)
            )
        )
        .map((docType) => ({
          docType,
          status: "PENDING",
          url: "",
          remarks: "",
        }));

      // Combine pending/rejected docs with missing docs
      const allPendingDocs = [...pending, ...missingDocs];

      // Remove duplicates and treat SELFIE / CO_APPLICANT_SELFIE as PHOTO
      const seenTypes = new Set();
      const uniquePendingDocs = [];
      allPendingDocs.forEach((doc) => {
        const key = normalizeDocType(doc.docType);
        if (seenTypes.has(key)) return;
        seenTypes.add(key);
        uniquePendingDocs.push({
          ...doc,
          docType: key,
        });
      });

      setPendingDocuments(uniquePendingDocs);
    } catch (err) {
      alert("Failed to fetch application data");
    } finally {
      setLoading(false);
    }
  };

  const getRequiredDocTypes = (loanType) => {
    const baseDocs = ["PAN", "AADHAR_FRONT", "AADHAR_BACK"];

    // Treat PHOTO/SELFIE as a single requirement: PHOTO
    if (loanType === "PERSONAL_LOAN" || loanType === "HOME_LOAN_SALARIED") {
      return [
        ...baseDocs,
        "SALARY_SLIP_1",
        "BANK_STATEMENT",
        "PHOTO",
        "ADDRESS_PROOF",
      ];
    } else if (
      loanType === "BUSINESS_LOAN" ||
      loanType === "HOME_LOAN_SELF_EMPLOYED"
    ) {
      return [
        ...baseDocs,
        "BANK_STATEMENT",
        "GST_CERTIFICATE",
        "PHOTO",
        "ADDRESS_PROOF",
      ];
    }

    return [...baseDocs, "PHOTO", "ADDRESS_PROOF"];
  };

  const calculateProgress = () => {
    if (!applicationData) return 0;
    
    const allDocs = applicationData.docs || [];
    const requiredDocTypes = getRequiredDocTypes(applicationData.loanType);
    const totalRequired = requiredDocTypes.length;
    
    // Count verified documents
    const verifiedDocs = requiredDocTypes.filter((docType) => {
      const target = normalizeDocType(docType);
      const doc = allDocs.find(
        (d) => normalizeDocType(d.docType) === target
      );
      return doc && doc.status === "VERIFIED";
    }).length;
    
    // Calculate progress percentage
    const progress = totalRequired > 0 ? Math.round((verifiedDocs / totalRequired) * 100) : 0;
    return Math.min(progress, 100); // Cap at 100%
  };

  const getDocumentDisplayName = (docType) => {
    const docNames = {
      PAN: "PAN Card",
      AADHAR_FRONT: "Aadhaar Front",
      AADHAR_BACK: "Aadhaar Back",
      SALARY_SLIP_1: "Salary Slip 1",
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

  const handleDocumentClick = (document) => {
    navigate(
      `/partner/document-upload?applicationId=${applicationId}&customerId=${customerId}&docType=${encodeURIComponent(document.docType)}`
    );
  };

  const handleSubmit = async () => {
    try {
      const { partnerToken } = getAuthData();
      if (!partnerToken) {
        alert("Authentication required");
        return;
      }

      // Check if all required documents are uploaded (not necessarily verified)
      const allDocs = applicationData?.docs || [];
      const requiredDocTypes = getRequiredDocTypes(applicationData?.loanType);
      const hasAllUploaded = requiredDocTypes.every((docType) =>
        allDocs.some((doc) => {
          const target = normalizeDocType(docType);
          return (
            normalizeDocType(doc.docType) === target &&
            doc.url &&
            doc.url.trim() !== ""
          );
        })
      );

      // Check if there are any rejected documents that need re-upload
      const hasRejectedDocs = allDocs.some(
        (doc) => doc.status === "REJECTED"
      );

      if (!hasAllUploaded || hasRejectedDocs || pendingDocuments.length > 0) {
        alert(
          "Please upload all required documents before submitting. Some documents may be pending or rejected."
        );
        return;
      }

      // Submit application
      const response = await axios.post(
        `${backendurl}/partner/applications/${applicationId}/submit`,
        {},
        {
          headers: { Authorization: `Bearer ${partnerToken}` },
        }
      );

      alert("Application submitted successfully");
      navigate(-1);
    } catch (err) {
      alert("Failed to submit application");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const requiredDocTypes = applicationData
    ? getRequiredDocTypes(applicationData.loanType)
    : [];
  const allDocs = applicationData?.docs || [];
  
  // Calculate completed (verified) docs
  const completedSteps = requiredDocTypes.filter((docType) => {
    const target = normalizeDocType(docType);
    const doc = allDocs.find(
      (d) => normalizeDocType(d.docType) === target
    );
    return doc && doc.status === "VERIFIED";
  }).length;
  
  // Calculate pending docs count (including missing and rejected/updated)
  const pendingDocsCount = pendingDocuments.length;

  // Total documents considered in progress = verified + pending
  const totalSteps = completedSteps + pendingDocsCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Complete Application</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Commission Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-orange-900 italic">
            Act Fast, don't miss your commission
          </p>
          <span className="text-4xl font-bold text-teal-600">₹</span>
        </div>

        {/* Document Upload Prompt */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-3">
          <span className="text-3xl">💰</span>
          <p className="text-sm text-gray-700 flex-1">
            Upload pending customer documents to get instant loan offer.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">
              Document Completion Progress
            </h3>
            {pendingDocsCount > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-300">
                {pendingDocsCount} Pending
              </span>
            )}
          </div>
          <div className="w-full bg-green-200 rounded-full h-3 mb-3 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-teal-600">
              {progress}% Complete
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {completedSteps}/{totalSteps} documents verified
            </span>
          </div>
          {pendingDocsCount > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-yellow-700 font-medium">
                {pendingDocsCount} document{pendingDocsCount > 1 ? 's' : ''} {pendingDocsCount > 1 ? 'are' : 'is'} pending upload or verification
              </p>
            </div>
          )}
        </div>

        {/* Pending Documents List */}
        <div className="space-y-3 mb-6">
          {pendingDocuments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <CheckCircle size={48} className="text-teal-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">
                All documents are verified!
              </p>
            </div>
          ) : (
            pendingDocuments.map((document, index) => {
              const isRejected = document.status === "REJECTED";
              const isUpdated = document.status === "UPDATED";
              const isPending = document.status === "PENDING";
              const isVerified = document.status === "VERIFIED";
              
              return (
                <div
                  key={document.docType || index}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {getDocumentDisplayName(document.docType)}
                    </h3>
                    {isRejected && document.remarks && (
                      <p className="text-xs text-red-600 italic mb-2">
                        Rejection reason: {document.remarks}
                      </p>
                    )}
                    {isUpdated && (
                      <p className="text-xs text-blue-600 italic mb-2">
                        🔄 Document uploaded/updated by partner - RM verification pending
                      </p>
                    )}
                    {isVerified && (
                      <p className="text-xs text-green-600 italic mb-2">
                        ✓ Document verified - No action needed
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {isRejected ? (
                        <>
                          <AlertCircle size={16} className="text-red-500" />
                          <span className="text-xs font-semibold text-red-600">
                            Rejected - Re-upload required
                          </span>
                        </>
                      ) : isUpdated ? (
                        <>
                          <AlertCircle size={16} className="text-blue-500" />
                          <span className="text-xs font-semibold text-blue-600">
                            Updated - Under review
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-teal-500" />
                          <span className="text-xs font-semibold text-teal-600">
                            Pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDocumentClick(document)}
                    className="ml-4 px-5 py-2.5 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 transition-colors whitespace-nowrap"
                  >
                    Click Here
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 px-6 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg hover:shadow-xl transition-all"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
};

export default CompleteApplication;
