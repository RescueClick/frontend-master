import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuthData } from "../../../utils/localStorage";
import toast from "react-hot-toast";
import {
  User,
  FileText,
  CreditCard,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Clock,
  Download,
  Camera,
  Building2,
  Receipt,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  Lock,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";
import { fetchRsmApplication, transitionRsmApplication } from "../../../feature/thunks/rsmThunks";
import { useDispatch } from "react-redux";
import { getLoanStatusBadgeClass, getLoanStatusLabel } from "../../../utils/loanStatus";

// ================== FIELD DEFINITIONS (Outside component) ==================
const customerFields = [
  { label: "Full Name", value: (c) => `${c.firstName || ""} ${c.middleName || ""} ${c.lastName || ""}`.trim() },
  { label: "Email", value: (c) => c.email },
  { label: "Official Email", value: (c) => c.officialEmail },
  { label: "Phone", value: (c) => c.phone },
  { label: "Alternate Phone", value: (c) => c.alternatePhone },
  { label: "Mother's Name", value: (c) => c.mothersName },
  { label: "PAN Number", value: (c) => c.panNumber },
  { label: "Date of Birth", value: (c) => c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString() : "N/A" },
  { label: "Gender", value: (c) => c.gender },
  { label: "Marital Status", value: (c) => c.maritalStatus },
  { label: "Spouse Name", value: (c) => c.spouseName },
  { label: "Loan Amount", value: (c) => c.loanAmount },
  { label: "Current Address", value: (c) => c.currentAddress },
  { label: "Current Address Landmark", value: (c) => c.currentAddressLandmark },
  { label: "Current Address Pin", value: (c) => c.currentAddressPinCode },
  { label: "Current House Status", value: (c) => c.currentAddressHouseStatus },
  { label: "Stability of Residency", value: (c) => c.stabilityOfResidency },
  { label: "Permanent Address", value: (c) => c.permanentAddress },
  { label: "Permanent Landmark", value: (c) => c.permanentAddressLandmark },
  { label: "Permanent Pin", value: (c) => c.permanentAddressPinCode },
  { label: "Permanent House Status", value: (c) => c.permanentAddressHouseStatus },
  { label: "Permanent Stability", value: (c) => c.permanentAddressStability },
];

const employmentFields = [
  { label: "Company Name", value: (e) => e?.companyName },
  { label: "Designation", value: (e) => e?.designation },
  { label: "Company Address", value: (e) => e?.companyAddress },
  { label: "Monthly Salary", value: (e) => e?.monthlySalary },
  { label: "Salary In Hand", value: (e) => e?.salaryInHand },
  { label: "Total Experience", value: (e) => e?.totalExperience },
  { label: "Current Experience", value: (e) => e?.currentExperience },
];

const businessFields = [
  { label: "Business Name", value: (b) => b?.businessName },
  { label: "Business Address", value: (b) => b?.businessAddress },
  { label: "Landmark", value: (b) => b?.businessLandmark },
  { label: "Business Vintage", value: (b) => b?.businessVintage },
  { label: "GST Number", value: (b) => b?.gstNumber },
  { label: "Annual Turnover (INR)", value: (b) => b?.annualTurnoverInINR },
  { label: "Years in Business", value: (b) => b?.yearsInBusiness },
];

const RsmApplicationView = () => {
  const [applicationData, setApplicationData] = useState(null);
  const [requiredDocRules, setRequiredDocRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [status, setStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { applicationId, customerId } = location.state || {};

  const normalizeDocType = (value) => String(value || "").trim().toUpperCase();

  const getLocalRequiredDocRules = (loanType, gender) => {
    const isFemale = String(gender || "").toLowerCase() === "female";

    if (loanType === "PERSONAL" || loanType === "HOME_LOAN_SALARIED") {
      return [
        { key: "AADHAR_FRONT", acceptedDocTypes: ["AADHAR_FRONT"] },
        { key: "AADHAR_BACK", acceptedDocTypes: ["AADHAR_BACK"] },
        { key: "PAN", acceptedDocTypes: ["PAN"] },
        { key: "PHOTO_OR_SELFIE", acceptedDocTypes: ["PHOTO", "SELFIE"] },
        { key: "OTHER_DOCS", acceptedDocTypes: ["OTHER_DOCS"] },
        { key: "ADDRESS_PROOF", acceptedDocTypes: ["ADDRESS_PROOF", "LIGHT_BILL", "UTILITY_BILL", "RENT_AGREEMENT"] },
        { key: "COMPANY_ID_CARD", acceptedDocTypes: ["COMPANY_ID_CARD"] },
        { key: "SALARY_SLIP_1", acceptedDocTypes: ["SALARY_SLIP_1"] },
        { key: "SALARY_SLIP_2", acceptedDocTypes: ["SALARY_SLIP_2"] },
        { key: "SALARY_SLIP_3", acceptedDocTypes: ["SALARY_SLIP_3"] },
        { key: "FORM_16_26AS", acceptedDocTypes: ["FORM_16_26AS"] },
        { key: "BANK_STATEMENT_1", acceptedDocTypes: ["BANK_STATEMENT_1", "BANK_STATEMENT"] },
        { key: "BANK_STATEMENT_2", acceptedDocTypes: ["BANK_STATEMENT_2"] },
      ];
    }

    const baseRules = [
      { key: "ADDRESS_PROOF", acceptedDocTypes: ["ADDRESS_PROOF", "LIGHT_BILL", "UTILITY_BILL", "RENT_AGREEMENT"] },
      { key: "AADHAR_FRONT", acceptedDocTypes: ["AADHAR_FRONT"] },
      { key: "AADHAR_BACK", acceptedDocTypes: ["AADHAR_BACK"] },
      { key: "BUSINESS_OTHER_DOCS", acceptedDocTypes: ["BUSINESS_OTHER_DOCS"] },
      { key: "PAN", acceptedDocTypes: ["PAN"] },
      { key: "PHOTO_OR_SELFIE", acceptedDocTypes: ["PHOTO", "SELFIE"] },
      { key: "SHOP_ACT", acceptedDocTypes: ["SHOP_ACT"] },
      { key: "UDHYAM_AADHAR", acceptedDocTypes: ["UDHYAM_AADHAR"] },
      { key: "ITR", acceptedDocTypes: ["ITR"] },
      { key: "GST_DOCUMENT", acceptedDocTypes: ["GST_DOCUMENT", "GST_CERTIFICATE"] },
      { key: "SHOP_PHOTO", acceptedDocTypes: ["SHOP_PHOTO"] },
      { key: "BANK_STATEMENT_1", acceptedDocTypes: ["BANK_STATEMENT_1", "BANK_STATEMENT"] },
      { key: "BANK_STATEMENT_2", acceptedDocTypes: ["BANK_STATEMENT_2"] },
    ];

    if (isFemale && (loanType === "BUSINESS" || loanType === "HOME_LOAN_SELF_EMPLOYED")) {
      baseRules.push(
        { key: "CO_APPLICANT_AADHAR_FRONT", acceptedDocTypes: ["CO_APPLICANT_AADHAR_FRONT"] },
        { key: "CO_APPLICANT_AADHAR_BACK", acceptedDocTypes: ["CO_APPLICANT_AADHAR_BACK"] },
        { key: "CO_APPLICANT_PAN", acceptedDocTypes: ["CO_APPLICANT_PAN"] },
        { key: "CO_APPLICANT_SELFIE_OR_PHOTO", acceptedDocTypes: ["CO_APPLICANT_SELFIE"] }
      );
    }

    return baseRules;
  };

  const getEffectiveRules = () => {
    if (Array.isArray(requiredDocRules) && requiredDocRules.length) return requiredDocRules;
    return getLocalRequiredDocRules(applicationData?.loanType, applicationData?.customer?.gender);
  };

  const findDocForRule = (rule, docs = []) => {
    const accepted = Array.isArray(rule?.acceptedDocTypes) ? rule.acceptedDocTypes : [];
    return docs.find((doc) =>
      accepted.some((type) => normalizeDocType(type) === normalizeDocType(doc?.docType))
    );
  };

  const hasRuleUpload = (rule, docs = []) => {
    const matched = findDocForRule(rule, docs);
    return Boolean(matched?.url);
  };

  const hasRuleVerified = (rule, docs = []) => {
    const matched = findDocForRule(rule, docs);
    return matched?.status === "VERIFIED";
  };

  const docTypeDisplayNames = {
    PAN: "PAN Card",
    AADHAR_FRONT: "Aadhaar Front",
    AADHAR_BACK: "Aadhaar Back",
    PHOTO: "Photo",
    SELFIE: "Selfie",
    PHOTO_OR_SELFIE: "Photo or Selfie",
    ADDRESS_PROOF: "Address Proof",
    LIGHT_BILL: "Light Bill",
    UTILITY_BILL: "Utility Bill",
    RENT_AGREEMENT: "Rent Agreement",
    OTHER_DOCS: "Other Documents",
    BUSINESS_OTHER_DOCS: "Business Other Documents",
    COMPANY_ID_CARD: "Company ID Card",
    SALARY_SLIP_1: "Salary Slip 1",
    SALARY_SLIP_2: "Salary Slip 2",
    SALARY_SLIP_3: "Salary Slip 3",
    FORM_16_26AS: "Form 16 / 26AS",
    BANK_STATEMENT_1: "Bank Statement 1",
    BANK_STATEMENT_2: "Bank Statement 2",
    BANK_STATEMENT: "Bank Statement",
    SHOP_ACT: "Shop Act / Gumasta",
    UDHYAM_AADHAR: "Udyam Aadhaar",
    ITR: "ITR",
    GST_DOCUMENT: "GST Document",
    GST_CERTIFICATE: "GST Certificate",
    SHOP_PHOTO: "Shop Photo",
    CO_APPLICANT_AADHAR_FRONT: "Co-applicant Aadhaar Front",
    CO_APPLICANT_AADHAR_BACK: "Co-applicant Aadhaar Back",
    CO_APPLICANT_PAN: "Co-applicant PAN",
    CO_APPLICANT_SELFIE: "Co-applicant Selfie",
    CO_APPLICANT_SELFIE_OR_PHOTO: "Co-applicant Selfie or Photo",
  };

  const toDocLabel = (docType) => {
    const key = normalizeDocType(docType);
    return docTypeDisplayNames[key] || key || "Document";
  };

  const getCanonicalRuleKeyForDoc = (docType) => {
    const match = getEffectiveRules().find((rule) =>
      Array.isArray(rule?.acceptedDocTypes) &&
      rule.acceptedDocTypes.some((type) => normalizeDocType(type) === normalizeDocType(docType))
    );
    return normalizeDocType(match?.key) || normalizeDocType(docType);
  };

  const toDocLabelByRule = (docType) => toDocLabel(getCanonicalRuleKeyForDoc(docType));

  const fetchRequiredDocRules = async (appData) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/partner/loan-doc-rules`, {
        params: {
          loanType: appData?.loanType,
          gender: appData?.customer?.gender || "",
        },
        headers: { Authorization: `Bearer ${rsmToken}` },
      });
      if (Array.isArray(response?.data?.rules) && response.data.rules.length) {
        return response.data.rules;
      }
    } catch (_err) {}
    return getLocalRequiredDocRules(appData?.loanType, appData?.customer?.gender);
  };

  // Fetch application data from API
  const fetchApplicationData = async () => {
    if (!applicationId) {
      setError("Application ID is missing");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(fetchRsmApplication(applicationId));
      if (fetchRsmApplication.fulfilled.match(result)) {
        setApplicationData(result.payload);
        const rules = await fetchRequiredDocRules(result.payload);
        setRequiredDocRules(rules);
        setStatus(result.payload.status || "");
      } else {
        setError(result.payload || "Failed to fetch application data");
      }
    } catch (err) {
      console.error("Error fetching application data:", err);
      setError(err.message || "Failed to fetch application data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    } else {
      setError("Application ID not provided");
    }
  }, [applicationId, dispatch]);

  useEffect(() => {
    return () => {
      if (selectedDoc?.previewUrl) {
        window.URL.revokeObjectURL(selectedDoc.previewUrl);
      }
    };
  }, [selectedDoc]);

  const handleView = async (doc) => {
    setPreviewLoading(true);
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rsm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
          },
          responseType: "blob",
        }
      );

      if (response.data.type === "application/json" || response.status >= 400) {
        const text = await response.data.text();
        let errorMessage = `Failed to load ${doc.docType}`;
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          if (text && text.length < 200) {
            errorMessage = text;
          }
        }
        setModalMessage(errorMessage);
        setShowModal(true);
        setSelectedDoc(null);
        return;
      }

      let contentType = response.headers["content-type"] || response.data.type || "application/octet-stream";
      const fileBlob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType });

      const url = window.URL.createObjectURL(fileBlob);
      const isImage = contentType.startsWith("image/") ||
        ["photo", "selfie", "aadhar", "pan", "profile"].some((key) =>
          doc.docType?.toLowerCase().includes(key)
        );

      setSelectedDoc({
        ...doc,
        previewUrl: url,
        contentType,
        isImage,
      });
      setShowModal(true);
    } catch (err) {
      console.error(`Error previewing ${doc.docType}:`, err);
      let errorMessage = `Failed to load ${doc.docType}. Please try downloading the document instead.`;
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setModalMessage(errorMessage);
      setShowModal(true);
      setSelectedDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async (doc) => {
    setDownloading(true);
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rsm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
          },
          responseType: "blob",
        }
      );

      const contentType = response.headers["content-type"];
      let fileExtension = ".pdf";
      if (contentType) {
        if (contentType.includes("image/jpeg") || contentType.includes("image/jpg")) {
          fileExtension = ".jpg";
        } else if (contentType.includes("image/png")) {
          fileExtension = ".png";
        } else if (contentType.includes("application/pdf")) {
          fileExtension = ".pdf";
        }
      }

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${doc.docType}_${applicationData.appNo}${fileExtension}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error downloading ${doc.docType}:`, err);
      toast.error(err.response?.data?.message || `Failed to download ${doc.docType}`, {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    try {
      if (!status) {
        toast.error("Please select a status");
        setSubmitLoading(false);
        return;
      }

      if (!remark.trim()) {
        toast.error("Please add a remark");
        setSubmitLoading(false);
        return;
      }

      // ✅ RSM can only handle processing statuses (including LOGIN)
      const RSM_ALLOWED_STATUSES = [
        "LOGIN",
        "UNDER_REVIEW",
        "APPROVED",
        "AGREEMENT",
        "REJECTED",
        "DISBURSED",
      ];
      if (!RSM_ALLOWED_STATUSES.includes(status)) {
        toast.error(`RSM can only transition to processing statuses: ${RSM_ALLOWED_STATUSES.join(", ")}`);
        setSubmitLoading(false);
        return;
      }

      // Validate transitions
      const currentStatus = applicationData.status;
      const allowedTransitions = {
        DOC_COMPLETE: ["LOGIN"],
        LOGIN: ["UNDER_REVIEW"],
        UNDER_REVIEW: ["APPROVED", "REJECTED"],
        APPROVED: ["AGREEMENT", "DISBURSED"],
        AGREEMENT: ["DISBURSED"],
      };

      if (!allowedTransitions[currentStatus]?.includes(status)) {
        toast.error(`Cannot transition from ${currentStatus} to ${status}. Allowed: ${allowedTransitions[currentStatus]?.join(", ") || "none"}`);
        setSubmitLoading(false);
        return;
      }

      // For APPROVED status, approved amount is mandatory
      if (status === "APPROVED" && (!approvalAmount || Number(approvalAmount) <= 0)) {
        toast.error("Please enter a valid approved loan amount for APPROVED status");
        setSubmitLoading(false);
        return;
      }

      const previousAppData = applicationData ? { ...applicationData } : null;

      if (applicationData) {
        setApplicationData({
          ...applicationData,
          status: status,
        });
      }

      const requestBody = {
        to: status,
        note: remark,
      };

      // Only send approvedLoanAmount when moving to APPROVED
      if (status === "APPROVED" && approvalAmount) {
        requestBody.approvedLoanAmount = parseInt(approvalAmount, 10);
      }

      const result = await dispatch(transitionRsmApplication({
        applicationId: applicationData._id,
        ...requestBody,
      }));

      if (transitionRsmApplication.fulfilled.match(result)) {
        if (result.payload && applicationData) {
          setApplicationData({
            ...applicationData,
            status: result.payload.status || status,
            approvedLoanAmount: result.payload.approvedLoanAmount || applicationData.approvedLoanAmount,
          });
        }

        setSubmittedStatus({
          status,
          remark,
          approvedLoanAmount: approvalAmount,
        });

        setRemark("");
        setApprovalAmount("");

        toast.success(`Application status updated to ${status} successfully!`, {
          duration: 3000,
          position: "top-right",
        });
      } else {
        if (previousAppData) {
          setApplicationData(previousAppData);
        }
        toast.error(result.payload || "Failed to update application status", {
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      toast.error(err.message || "Failed to update application status", {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusColor = (status) => `${getLoanStatusBadgeClass(status)} border border-gray-200`;

  const getDocStatusColor = (status) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "UPDATED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDocStatusIcon = (status) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "REJECTED":
        return <AlertCircle className="w-4 h-4" />;
      case "UPDATED":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const statusColors = (status) => `${getLoanStatusBadgeClass(status)} border border-gray-200`;

  // Helper functions for rendering
  const renderFields = (fields, data) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field, idx) => (
        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">{field.label}</p>
          <p className="font-bold text-gray-900">{field.value(data) || "N/A"}</p>
        </div>
      ))}
    </div>
  );

  const renderReferences = (references = []) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {references.map((ref, idx) => (
        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Reference {idx + 1}</p>
          <p className="font-bold text-gray-900">{ref.name || "N/A"}</p>
          <p className="text-gray-600">{ref.phone || "N/A"}</p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            <span className="text-gray-700 text-lg">Loading application data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Application</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchApplicationData}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Application Data</h2>
          <p className="text-gray-600">Application data not available</p>
        </div>
      </div>
    );
  }

  // ✅ Get allowed statuses based on current status
  const getAllowedStatuses = () => {
    const currentStatus = applicationData.status;
    const allowedTransitions = {
      DOC_COMPLETE: ["LOGIN"],
      LOGIN: ["UNDER_REVIEW"],
      UNDER_REVIEW: ["APPROVED", "REJECTED"],
      APPROVED: ["AGREEMENT", "DISBURSED"],
      AGREEMENT: ["DISBURSED"],
    };
    return allowedTransitions[currentStatus] || [];
  };

  const allowedStatuses = getAllowedStatuses();

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-6 w-[800px] max-h-[90vh] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDoc ? toDocLabelByRule(selectedDoc.docType) : "Document Preview"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  if (selectedDoc?.previewUrl) {
                    window.URL.revokeObjectURL(selectedDoc.previewUrl);
                  }
                  setSelectedDoc(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {selectedDoc ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Document Type: {toDocLabelByRule(selectedDoc.docType)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDocStatusColor(selectedDoc.status)}`}>
                      {selectedDoc.status}
                    </span>
                  </div>

                  {previewLoading && (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {!previewLoading && selectedDoc.previewUrl && (
                    <div className="w-full h-96 border rounded overflow-hidden bg-gray-50">
                      {selectedDoc.isImage ? (
                        <img
                          src={selectedDoc.previewUrl}
                          alt={`Preview of ${selectedDoc.docType}`}
                          className="w-full h-full object-contain bg-white"
                        />
                      ) : (
                        <iframe
                          src={selectedDoc.previewUrl}
                          className="w-full h-full bg-white"
                          title={`Preview of ${selectedDoc.docType}`}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      if (selectedDoc?.previewUrl) {
                        window.URL.revokeObjectURL(selectedDoc.previewUrl);
                      }
                      setSelectedDoc(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">{modalMessage}</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-primary-hover px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="text-white">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    Loan Application #{applicationData.appNo}
                  </h1>
                  <p className="text-teal-100 text-sm sm:text-base opacity-90">
                    Application ID: {applicationData._id}
                  </p>
                </div>
                <div className="text-white text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                    <p className="text-sm font-medium opacity-90 mb-1">Applied Date</p>
                    <div className="flex items-center justify-end">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm font-semibold">
                        {formatDate(applicationData.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 sm:p-8">
              {/* Customer, Partner, Loan Summary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Customer Information */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-brand-primary/10">
                      <User className="w-6 h-6 text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-3">Customer Details</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                      <p className="font-semibold text-gray-900">
                        {applicationData.customerId?.firstName
                          ? `${applicationData.customerId.firstName} ${applicationData.customerId.lastName || ""}`.trim()
                          : applicationData.customer?.firstName
                          ? `${applicationData.customer.firstName} ${applicationData.customer.lastName || ""}`.trim()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                      <p className="font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-brand-primary" />
                        {applicationData.customerId?.email || applicationData.customer?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                      <p className="font-medium text-gray-700 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-brand-primary" />
                        {applicationData.customerId?.phone || applicationData.customer?.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partner Information */}
                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <User className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-3">Partner Details</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Partner Name</p>
                      <p className="font-semibold text-gray-900">
                        {applicationData.partnerId?.firstName || applicationData.partner?.firstName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                      <p className="font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-amber-600" />
                        {applicationData.partnerId?.email || applicationData.partner?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                      <p className="font-medium text-gray-700 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-amber-600" />
                        {applicationData.partnerId?.phone || applicationData.partner?.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loan Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-3">Loan Summary</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Loan Type</p>
                      <p className="font-semibold text-gray-900">
                        {applicationData.loanType || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Loan Amount</p>
                      <p className="font-bold text-3xl text-brand-primary">
                        {formatCurrency(applicationData.customer?.loanAmount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Section */}
              <div className="mb-8 bg-gradient-to-r from-slate-50 to-white rounded-xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Details</h2>
                {renderFields(customerFields, applicationData.customer || applicationData.customerId)}
              </div>

              {/* Loan Type Conditional Section */}
              <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {applicationData.loanType === "PERSONAL" ? "Employment Information" : "Business Information"}
                </h2>
                {applicationData.loanType === "PERSONAL"
                  ? renderFields(employmentFields, applicationData.employmentInfo)
                  : renderFields(businessFields, applicationData.businessInfo)}
              </div>

              {/* References Section */}
              <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">References</h2>
                {renderReferences(applicationData.references)}
              </div>

              {/* Address Information */}
              <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 ml-3">Address Information</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                      Current Address
                    </p>
                    <p className="font-medium text-gray-900 mb-2">
                      {applicationData.customer?.currentAddress || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      PIN: <span className="font-medium">{applicationData?.customer?.currentAddressPinCode || "N/A"}</span>
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                      Permanent Address
                    </p>
                    <p className="font-medium text-gray-900 mb-2">
                      {applicationData.customer?.permanentAddress || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      PIN: <span className="font-medium">{applicationData.customer?.permanentAddressPinCode || "N/A"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Section - READ ONLY for RSM */}
              <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-3">Document Portfolio</h2>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <Lock className="w-4 h-4 text-yellow-700" />
                    <span className="text-sm font-medium text-yellow-800">Read Only - Documents managed by RM</span>
                  </div>
                </div>

                {(() => {
                  const rules = getEffectiveRules();
                  const docs = applicationData.docs || [];
                  const requiredCount = rules.length;
                  const uploadedCount = rules.filter((rule) => hasRuleUpload(rule, docs)).length;
                  const verifiedCount = rules.filter((rule) => hasRuleVerified(rule, docs)).length;
                  const pendingCount = Math.max(requiredCount - verifiedCount, 0);

                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Required</p>
                          <p className="text-lg font-bold text-gray-900">{requiredCount}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Uploaded</p>
                          <p className="text-lg font-bold text-blue-700">{uploadedCount}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Verified</p>
                          <p className="text-lg font-bold text-green-700">{verifiedCount}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-gray-500">Pending</p>
                          <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Required Documents Checklist</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {rules.map((rule, idx) => {
                            const isUploaded = hasRuleUpload(rule, docs);
                            const isVerified = hasRuleVerified(rule, docs);
                            const stateText = isVerified ? "Verified" : isUploaded ? "Uploaded" : "Missing";
                            const stateClass = isVerified
                              ? "text-green-700 bg-green-100"
                              : isUploaded
                              ? "text-blue-700 bg-blue-100"
                              : "text-amber-700 bg-amber-100";
                            return (
                              <div
                                key={`${rule?.key || "rule"}-${idx}`}
                                className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                              >
                                <span className="text-sm font-medium text-gray-800">{toDocLabel(rule?.key)}</span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${stateClass}`}>
                                  {stateText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {(applicationData.docs || []).map((doc, index) => {
                    const getDocIcon = (docType) => {
                      const docTypeLower = docType?.toLowerCase() || "";
                      if (docTypeLower.includes("pan")) return FileText;
                      if (docTypeLower.includes("aadhar")) return FileText;
                      if (docTypeLower.includes("salary")) return Receipt;
                      if (docTypeLower.includes("address")) return Building2;
                      if (docTypeLower.includes("bank")) return CreditCard;
                      if (docTypeLower.includes("photo") || docTypeLower.includes("selfie")) return Camera;
                      return FileText;
                    };

                    const IconComponent = getDocIcon(doc.docType);

                    return (
                      <div
                        key={index}
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center flex-1">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <IconComponent className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="ml-3 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {toDocLabelByRule(doc.docType)}
                              </h3>
                              {doc.remarks && (
                                <p className="text-xs text-gray-600 mt-1">Remark: {doc.remarks}</p>
                              )}
                              {doc.uploadedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold border-2 ml-2 ${getDocStatusColor(doc.status)}`}>
                            {getDocStatusIcon(doc.status)}
                            <span className="ml-1">{doc.status}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-4 truncate">
                          {doc.url ? doc.url.split(/[\\\/]/).pop() : "No file"}
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading}
                            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-primary-hover rounded-lg hover:from-brand-primary-hover hover:to-brand-primary transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            {downloading ? "Downloading..." : "Download"}
                          </button>
                          <button
                            onClick={() => handleView(doc)}
                            disabled={previewLoading}
                            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {previewLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Application Management - RSM can only change processing statuses */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 ml-3">Application Management</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Update Application Status
                    </h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Select New Status
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={allowedStatuses.length === 0}
                      >
                        <option value="">Select Status</option>
                        {allowedStatuses.map((allowedStatus) => (
                          <option key={allowedStatus} value={allowedStatus}>
                            {allowedStatus}
                          </option>
                        ))}
                      </select>
                      
                      {allowedStatuses.length === 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800">
                                No status transitions available
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Current status: {getLoanStatusLabel(applicationData.status)}. No further transitions are allowed from this status.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {status && allowedStatuses.includes(status) && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-800">
                                Transitioning to {status}
                              </p>
                              <p className="text-xs text-blue-700 mt-1">
                                {status === "DISBURSED" 
                                  ? "Please enter the approved loan amount below."
                                  : "Please add a remark explaining this status change."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Add Remark
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                          placeholder="Enter your remarks here..."
                          className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 resize-none h-20"
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Approval Amount Field - Only show when APPROVED is selected */}
                    {status === "APPROVED" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Approved Loan Amount (₹) *
                        </label>
                        <input
                          type="number"
                          placeholder="Enter approved loan amount"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300"
                          value={approvalAmount}
                          onChange={(e) => setApprovalAmount(e.target.value)}
                          min="0"
                          required
                        />
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={submitLoading || !status || !remark.trim() || (status === "APPROVED" && !approvalAmount)}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white py-3 px-6 rounded-xl shadow-lg hover:from-brand-primary-hover hover:to-brand-primary transition-all duration-300 hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          <span>Update Application Status</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Status</h3>
                    <div className="space-y-4">
                      {submittedStatus ? (
                        <div className="space-y-3">
                          <div className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold text-sm ${statusColors(submittedStatus.status)}`}>
                            {getLoanStatusLabel(submittedStatus.status)}
                          </div>
                          {submittedStatus.remark && (
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">Latest Remark:</p>
                              <p className="text-gray-600">{submittedStatus.remark}</p>
                            </div>
                          )}
                          {submittedStatus.approvedLoanAmount && (
                            <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                              <p className="text-sm font-medium text-green-700 mb-1">Approved Loan Amount:</p>
                              <p className="text-green-800 font-semibold text-lg">
                                ₹{formatCurrency(submittedStatus.approvedLoanAmount)}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            Current Status: {getLoanStatusLabel(applicationData.status) || "N/A"}
                          </p>
                          <p className="text-gray-500 font-medium">
                            Approved Loan Amount: {applicationData.approvedLoanAmount ? formatCurrency(applicationData.approvedLoanAmount) : "N/A"}
                          </p>
                          {applicationData.stageHistory && applicationData.stageHistory.length > 0 && (
                            <div className="mt-4 text-left">
                              <p className="text-sm font-medium text-gray-700 mb-2">Stage History:</p>
                              <div className="space-y-2">
                                {applicationData.stageHistory.map((stage, index) => (
                                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{stage.from} → {stage.to}</span>
                                    <br />
                                    <span>{stage.note} - {new Date(stage.at).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RsmApplicationView;

