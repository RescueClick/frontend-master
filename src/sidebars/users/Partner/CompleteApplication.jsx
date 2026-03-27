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
  const [requiredDocRules, setRequiredDocRules] = useState([]);

  // Treat PHOTO and SELFIE (and co-applicant selfie) as the same logical document
  const normalizeDocType = (docType) => {
    const upper = (docType || "").toUpperCase();
    const aliases = {
      SELFIE: "PHOTO",
      CO_APPLICANT_SELFIE: "PHOTO",
      GST: "GST_DOCUMENT",
      GST_DOC: "GST_DOCUMENT",
      GST_CERTIFICATE: "GST_DOCUMENT",
      BANK_STATEMENT: "BANK_STATEMENT_1",
    };
    return aliases[upper] || upper;
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
      const rules = await fetchRequiredDocRules(response.data, partnerToken);
      setRequiredDocRules(rules);
      const appStatus = String(response.data?.status || "").toUpperCase();

      // Disbursed applications should never show pending docs.
      if (appStatus === "DISBURSED") {
        setPendingDocuments([]);
        return;
      }

      // Get pending/rejected/updated documents (documents that need to be uploaded/re-uploaded)
      const allDocs = response.data.docs || [];
      const pending = allDocs.filter((doc) =>
        ["REJECTED", "PENDING", "UPDATED"].includes(doc.status)
      );

      // Also check for required documents that might not exist yet
      const effectiveRules = getEffectiveRules(response.data.loanType, rules);
      const missingDocs = effectiveRules
        .filter((rule) => !hasRuleUpload(rule, allDocs))
        .map((rule) => ({
          docType: getPrimaryDocType(rule),
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

  const getLocalRequiredDocTypes = (loanType) => {
    const baseDocs = ["PAN", "AADHAR_FRONT", "AADHAR_BACK", "PHOTO", "ADDRESS_PROOF"];
    const key = (loanType || "").toUpperCase();

    if (key === "PERSONAL" || key === "PERSONAL_LOAN") {
      return [
        ...baseDocs,
        "OTHER_DOCS",
        "COMPANY_ID_CARD",
        "SALARY_SLIP_1",
        "SALARY_SLIP_2",
        "SALARY_SLIP_3",
        "FORM_16_26AS",
        "BANK_STATEMENT_1",
        "BANK_STATEMENT_2",
      ];
    }
    if (key === "HOME_LOAN_SALARIED") {
      return [
        ...baseDocs,
        "OTHER_DOCS",
        "COMPANY_ID_CARD",
        "SALARY_SLIP_1",
        "SALARY_SLIP_2",
        "SALARY_SLIP_3",
        "FORM_16_26AS",
        "BANK_STATEMENT_1",
        "BANK_STATEMENT_2",
      ];
    }
    if (key === "BUSINESS" || key === "BUSINESS_LOAN" || key === "HOME_LOAN_SELF_EMPLOYED") {
      return [
        ...baseDocs,
        "BUSINESS_OTHER_DOCS",
        "SHOP_ACT",
        "UDHYAM_AADHAR",
        "ITR",
        "GST_DOCUMENT",
        "SHOP_PHOTO",
        "BANK_STATEMENT_1",
        "BANK_STATEMENT_2",
      ];
    }

    return baseDocs;
  };

  const getEffectiveRules = (loanType, rules = []) => {
    if (Array.isArray(rules) && rules.length) return rules;
    return getLocalRequiredDocTypes(loanType).map((docType) => ({
      key: docType,
      acceptedDocTypes: [docType],
    }));
  };

  const getPrimaryDocType = (rule) => {
    const accepted = Array.isArray(rule?.acceptedDocTypes) ? rule.acceptedDocTypes : [];
    return accepted[0] || rule?.key || "";
  };

  const hasRuleUpload = (rule, docs = []) => {
    const accepted = Array.isArray(rule?.acceptedDocTypes) ? rule.acceptedDocTypes : [];
    return docs.some((doc) =>
      accepted.some(
        (docType) => normalizeDocType(doc.docType) === normalizeDocType(docType) && doc.url && doc.url.trim() !== ""
      )
    );
  };

  const hasRuleVerified = (rule, docs = []) => {
    const accepted = Array.isArray(rule?.acceptedDocTypes) ? rule.acceptedDocTypes : [];
    return docs.some((doc) =>
      accepted.some(
        (docType) => normalizeDocType(doc.docType) === normalizeDocType(docType) && doc.status === "VERIFIED"
      )
    );
  };

  const fetchRequiredDocRules = async (application, partnerToken) => {
    try {
      const response = await axios.get(`${backendurl}/partner/loan-doc-rules`, {
        params: {
          loanType: application?.loanType,
          gender: application?.customer?.gender || "",
        },
        headers: { Authorization: `Bearer ${partnerToken}` },
      });
      if (Array.isArray(response?.data?.rules) && response.data.rules.length) {
        return response.data.rules;
      }
    } catch (_err) {}

    return getEffectiveRules(application?.loanType, []);
  };

  const calculateProgress = () => {
    if (!applicationData) return 0;
    
    const allDocs = applicationData.docs || [];
    const effectiveRules = getEffectiveRules(applicationData.loanType, requiredDocRules);
    const totalRequired = effectiveRules.length;
    
    // Count verified documents
    const verifiedDocs = effectiveRules.filter((rule) => hasRuleVerified(rule, allDocs)).length;
    
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
      BANK_STATEMENT_1: "Bank Statement 1",
      BANK_STATEMENT_2: "Bank Statement 2",
      GST_DOCUMENT: "GST Document",
      PHOTO: "Photo",
      SELFIE: "Selfie",
      ADDRESS_PROOF: "Address Proof",
      OTHER_DOCS: "Other Documents",
      BUSINESS_OTHER_DOCS: "Business Other Documents",
      COMPANY_ID_CARD: "Company ID Card",
      FORM_16_26AS: "Form 16 / 26AS",
      SHOP_ACT: "Shop Act / Gumasta",
      UDHYAM_AADHAR: "Udyam Aadhaar",
      ITR: "ITR",
      SHOP_PHOTO: "Shop Photo",
      ALLOTMENT_LETTER: "Allotment Letter",
      NEW_PROPERTY_PAYMENT_RECEIPTS: "New Property Payment Receipts",
      TITLE_DEEDS: "Title Deeds",
      RESALE_PAYMENT_RECEIPTS: "Resale Payment Receipts",
      AGREEMENT_COPY: "Agreement Copy",
    };
    return docNames[docType] || docType;
  };

  const getRuleLabel = (rule) => {
    const key = String(rule?.key || "").toUpperCase();
    if (key === "PHOTO_OR_SELFIE") return "Photo or Selfie";
    if (key === "CO_APPLICANT_SELFIE_OR_PHOTO") return "Co-applicant Selfie or Photo";
    return getDocumentDisplayName(key);
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
      const effectiveRules = getEffectiveRules(applicationData?.loanType, requiredDocRules);
      const hasAllUploaded = effectiveRules.every((rule) => hasRuleUpload(rule, allDocs));

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
  const effectiveRules = applicationData
    ? getEffectiveRules(applicationData.loanType, requiredDocRules)
    : [];
  const allDocs = applicationData?.docs || [];
  
  // Calculate completed (verified) docs
  const completedSteps = effectiveRules.filter((rule) => hasRuleVerified(rule, allDocs)).length;
  const requiredDocsCount = effectiveRules.length;
  const uploadedSteps = effectiveRules.filter((rule) => hasRuleUpload(rule, allDocs)).length;
  const pendingRequiredDocsCount = Math.max(requiredDocsCount - completedSteps, 0);
  
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Required</p>
            <p className="text-lg font-bold text-gray-900">{requiredDocsCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Uploaded</p>
            <p className="text-lg font-bold text-blue-700">{uploadedSteps}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Verified</p>
            <p className="text-lg font-bold text-green-700">{completedSteps}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg font-bold text-amber-700">{pendingRequiredDocsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-3">Required Documents Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {effectiveRules.map((rule, index) => {
              const isUploaded = hasRuleUpload(rule, allDocs);
              const isVerified = hasRuleVerified(rule, allDocs);
              const stateText = isVerified ? "Verified" : isUploaded ? "Uploaded" : "Missing";
              const stateClass = isVerified
                ? "text-green-700 bg-green-100"
                : isUploaded
                ? "text-blue-700 bg-blue-100"
                : "text-amber-700 bg-amber-100";

              return (
                <div
                  key={`${rule?.key || "rule"}-${index}`}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {getRuleLabel(rule)}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${stateClass}`}>
                    {stateText}
                  </span>
                </div>
              );
            })}
          </div>
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
