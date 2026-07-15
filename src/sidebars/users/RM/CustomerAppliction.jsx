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
  Phone,
  Mail,
  MessageSquare,
  Send,
  Clock,
  Plus,
  Download,
  Camera,
  Building2,
  Receipt,
  FileImage,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { backendurl } from "../../../feature/urldata";
import { getLoanStatusLabel } from "../../../utils/loanStatus";

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

const toIndianWords = (num) => {
  if (isNaN(num) || num <= 0) return "";
  const n = Math.floor(num);
  if (n === 0) return "Zero Rupees";

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatGroup = (v) => {
    let s = "";
    if (v >= 100) {
      s += units[Math.floor(v / 100)] + " Hundred ";
      v %= 100;
    }
    if (v >= 20) {
      s += tens[Math.floor(v / 10)] + " ";
      v %= 10;
    }
    if (v > 0) {
      s += units[v] + " ";
    }
    return s.trim();
  };

  let res = "";
  let crores = Math.floor(n / 10000000);
  let remaining = n % 10000000;
  let lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;
  let thousands = Math.floor(remaining / 1000);
  remaining %= 1000;
  let hundreds = remaining;

  if (crores > 0) {
    res += formatGroup(crores) + " Crore ";
  }
  if (lakhs > 0) {
    res += formatGroup(lakhs) + " Lakh ";
  }
  if (thousands > 0) {
    res += formatGroup(thousands) + " Thousand ";
  }
  if (hundreds > 0) {
    res += formatGroup(hundreds) + " ";
  }

  return res.trim() + " Rupees Only";
};

const CustomerApplication = () => {
  // State for API data
  
  const [applicationData, setApplicationData] = useState(null);
  const [requiredDocRules, setRequiredDocRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [previewLoadingDoc, setPreviewLoadingDoc] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docStatusModal, setDocStatusModal] = useState(false);
  const [selectedDocForStatus, setSelectedDocForStatus] = useState(null);
  const [docStatusRemark, setDocStatusRemark] = useState("");
  const [docNewStatus, setDocNewStatus] = useState("PENDING");
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [previewRejectMode, setPreviewRejectMode] = useState(false);
  const [previewRejectRemark, setPreviewRejectRemark] = useState("");

  const location = useLocation();
  const { customerId, applicationId } = location.state || {};

  

  // Fetch application data from API
  const fetchApplicationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rm/customers/${customerId}/applications/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
        }
      );

     
      setApplicationData(response.data);
      const rules = await fetchRequiredDocRules(response.data, rmToken);
      setRequiredDocRules(rules);
    } catch (err) {
      console.error("Error fetching application data:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch application data"
      );
      // Keep using static data on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchApplicationData();
  }, []);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (selectedDoc?.previewUrl) {
        window.URL.revokeObjectURL(selectedDoc.previewUrl);
      }
    };
  }, [selectedDoc]);

  

  const handleView = async (doc) => {
    setPreviewLoadingDoc(doc.docType);
    try {
      const { rmToken } = getAuthData();
  
      const response = await axios.get(
        `${backendurl}/rm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
          responseType: "blob",
        }
      );

      // Check if response is an error (blob with JSON error message)
      if (response.data.type === "application/json" || response.status >= 400) {
        // Try to parse error message from blob
        const text = await response.data.text();
        let errorMessage = `Failed to load ${doc.docType}`;
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          // If not JSON, use the text or default message
          if (text && text.length < 200) {
            errorMessage = text;
          }
        }
        setModalMessage(errorMessage);
        setShowModal(true);
        setSelectedDoc(null);
        return;
      }
  
      // Prefer response.headers, fallback to blob.type
      let contentType =
        response.headers["content-type"] || response.data.type || "application/octet-stream";
  
      // If axios already gives a blob, no need to wrap again
      const fileBlob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType });
  
      const url = window.URL.createObjectURL(fileBlob);
  
      // Decide if preview is an image
      const isImage =
        contentType.startsWith("image/") ||
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
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      
      // Try to extract error message from response
      let errorMessage = `Failed to load ${doc.docType}. Please try downloading the document instead.`;
      
      if (err.response) {
        // If response is a blob (error with blob responseType), try to parse it
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            console.log("Error blob text:", text);
            
            // Try to parse as JSON
            try {
              const errorJson = JSON.parse(text);
              errorMessage = errorJson.message || errorMessage;
              if (errorJson.error) {
                errorMessage += `: ${errorJson.error}`;
              }
            } catch (parseErr) {
              // If not JSON, check if it's a readable error message
              if (text && text.length < 500 && text.trim().length > 0) {
                errorMessage = text;
              }
            }
          } catch (blobErr) {
            console.error("Error reading blob:", blobErr);
            // Fall back to status text or default message
            errorMessage = err.response.statusText || errorMessage;
          }
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.statusText) {
          errorMessage = `${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.message) {
        errorMessage = `${err.message}. Please try downloading the document instead.`;
      }
      
      setModalMessage(errorMessage);
      setShowModal(true);
      setSelectedDoc(null);
    } finally {
      setPreviewLoadingDoc(null);
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

  const [docs, setDocs] = useState([]);

  // Update docs when applicationData changes
  useEffect(() => {
    if (applicationData && applicationData.docs) {
      setDocs(applicationData.docs);
    }
  }, [applicationData]);

  const [expandedDocs, setExpandedDocs] = useState(false);

  const [approvalAmount, setApprovalAmount] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);

  const handleApprovalSubmit = async () => {
    if (!approvalAmount || approvalAmount <= 0) {
      toast.error("Please enter a valid approval amount");
      return;
    }

    setApprovalLoading(true);
    setError("");
    const previousAppData = applicationData ? { ...applicationData } : null;

    try {
      const { rmToken } = getAuthData();
      
      // Optimistic update
      if (applicationData) {
        setApplicationData({
          ...applicationData,
          status: "DISBURSED",
          approvedLoanAmount: parseInt(approvalAmount),
        });
      }

      const response = await axios.post(
        `${backendurl}/rm/applications/${applicationData._id}/transition`,
        {
          to: "DISBURSED",
          note: "Disbursing approved loan to customer",
          approvedLoanAmount: parseInt(approvalAmount),
        },
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // Sync with backend response
      if (response.data && applicationData) {
        setApplicationData({
          ...applicationData,
          status: response.data.status || "DISBURSED",
          approvedLoanAmount: response.data.approvedLoanAmount || parseInt(approvalAmount),
        });
      }

      // Update local state
      setSubmittedStatus((prev) => ({
        ...prev,
        approvedLoanAmount: approvalAmount,
      }));

      // Clear form
      setApprovalAmount("");

      // Show success toast
      toast.success(`Approval amount of ₹${approvalAmount} saved successfully!`, {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      console.error("Error saving approval amount:", err);
      
      // Revert optimistic update on error
      if (previousAppData) {
        setApplicationData(previousAppData);
      }
      
      const errorMessage = err.response?.data?.message ||
        err.message ||
        "Failed to save approval amount";
      setError(errorMessage);
      
      toast.error(errorMessage, {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    setDownloading(true);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rm/applications/${applicationData._id}/docs/${doc.docType}/download`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
          responseType: "blob", // Important for file downloads
        }
      );

      // Get file extension from Content-Type header
      const contentType = response.headers["content-type"];
      let fileExtension = ".pdf"; // default fallback

      if (contentType) {
        if (
          contentType.includes("image/jpeg") ||
          contentType.includes("image/jpg")
        ) {
          fileExtension = ".jpg";
        } else if (contentType.includes("image/png")) {
          fileExtension = ".png";
        } else if (contentType.includes("image/gif")) {
          fileExtension = ".gif";
        } else if (contentType.includes("image/webp")) {
          fileExtension = ".webp";
        } else if (contentType.includes("application/pdf")) {
          fileExtension = ".pdf";
        } else if (contentType.includes("text/plain")) {
          fileExtension = ".txt";
        } else if (contentType.includes("application/msword")) {
          fileExtension = ".doc";
        } else if (
          contentType.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          )
        ) {
          fileExtension = ".docx";
        }
      } else {
        // If no content-type header, try to detect from file content
        const blob = new Blob([response.data]);
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Check file signatures (magic numbers)
        if (uint8Array.length >= 4) {
          // PNG signature: 89 50 4E 47
          if (
            uint8Array[0] === 0x89 &&
            uint8Array[1] === 0x50 &&
            uint8Array[2] === 0x4e &&
            uint8Array[3] === 0x47
          ) {
            fileExtension = ".png";
          }
          // JPEG signature: FF D8 FF
          else if (
            uint8Array[0] === 0xff &&
            uint8Array[1] === 0xd8 &&
            uint8Array[2] === 0xff
          ) {
            fileExtension = ".jpg";
          }
          // PDF signature: 25 50 44 46 (%PDF)
          else if (
            uint8Array[0] === 0x25 &&
            uint8Array[1] === 0x50 &&
            uint8Array[2] === 0x44 &&
            uint8Array[3] === 0x46
          ) {
            fileExtension = ".pdf";
          }
          // GIF signature: 47 49 46 38 (GIF8)
          else if (
            uint8Array[0] === 0x47 &&
            uint8Array[1] === 0x49 &&
            uint8Array[2] === 0x46 &&
            uint8Array[3] === 0x38
          ) {
            fileExtension = ".gif";
          }
        }
      }

      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${doc.docType}_${applicationData.appNo}${fileExtension}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create a download link with proper extension
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
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      
      // Try to extract error message from response
      let errorMessage = `Failed to download ${doc.docType}`;
      
      if (err.response) {
        // If response is a blob (error with blob responseType), try to parse it
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            console.log("Error blob text:", text);
            
            // Try to parse as JSON
            try {
              const errorJson = JSON.parse(text);
              errorMessage = errorJson.message || errorMessage;
              if (errorJson.error) {
                errorMessage += `: ${errorJson.error}`;
              }
            } catch (parseErr) {
              // If not JSON, check if it's a readable error message
              if (text && text.length < 500 && text.trim().length > 0) {
                errorMessage = text;
              }
            }
          } catch (blobErr) {
            console.error("Error reading blob:", blobErr);
            // Fall back to status text or default message
            errorMessage = err.response.statusText || errorMessage;
          }
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.statusText) {
          errorMessage = `${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        position: "top-right",
      });
      setError(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpdateDocStatus = async (docObj, forcedStatus, forcedRemark) => {
    const targetDoc = docObj || selectedDocForStatus;
    const targetStatus = forcedStatus || docNewStatus;
    const targetRemark = forcedRemark !== undefined ? forcedRemark : docStatusRemark;

    if (!targetDoc || !targetStatus) {
      toast.error("Please select a document and status");
      return;
    }

    if (targetStatus === "REJECTED" && !targetRemark.trim()) {
      toast.error("Please add a remark when rejecting a document");
      return;
    }

    setUpdateStatusLoading(true);
    const { rmToken } = getAuthData();
    const updatingDocType = targetDoc.docType;
    const docTypeParam = encodeURIComponent(updatingDocType);
    
    // Optimistic update - update UI immediately for fast response
    const previousDocs = [...docs];
    const previousAppData = applicationData ? { ...applicationData } : null;
    
    const optimisticUpdatedDocs = docs.map((doc) => {
      if (doc.docType === updatingDocType) {
        return {
          ...doc,
          status: targetStatus,
          remarks: targetRemark.trim() || doc.remarks || "",
          updatedAt: new Date().toISOString(),
        };
      }
      return doc;
    });
    
    // Optimistically update application status if needed
    let optimisticAppStatus = applicationData?.status;
    const hasRejectedDocs = optimisticUpdatedDocs.some(doc => doc.status === "REJECTED");
    if (hasRejectedDocs && applicationData?.status !== "DOC_INCOMPLETE") {
      optimisticAppStatus = "DOC_INCOMPLETE";
    }
    
    // Update UI immediately (optimistic update)
    setDocs(optimisticUpdatedDocs);
    if (applicationData) {
      setApplicationData({
        ...applicationData,
        docs: optimisticUpdatedDocs,
        status: optimisticAppStatus,
      });
    }
    
    // Close modal immediately for better UX
    setDocStatusModal(false);
    setSelectedDocForStatus(null);
    setDocStatusRemark("");
    setDocNewStatus("PENDING");
    
    try {
      // Update document status via backend endpoint
      let response;
      try {
        response = await axios.put(
          `${backendurl}/rm/applications/${applicationData._id}/docs/${docTypeParam}`,
          {
            status: targetStatus,
            remarks: targetRemark.trim() || "",
          },
          {
            headers: {
              Authorization: `Bearer ${rmToken}`,
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
          }
        );
      } catch (putErr) {
        // If PUT fails with 404, try POST alternative route
        if (putErr.response?.status === 404) {
          response = await axios.post(
            `${backendurl}/rm/applications/${applicationData._id}/docs/${docTypeParam}/update-status`,
            {
              status: targetStatus,
              remarks: targetRemark.trim() || "",
            },
            {
              headers: {
                Authorization: `Bearer ${rmToken}`,
                "Content-Type": "application/json",
              },
              timeout: 10000,
            }
          );
        } else {
          throw putErr;
        }
      }

      // Update with backend response (sync with server; use optimistic list — not stale `docs` closure)
      if (response.data && response.data.document) {
        const syncedDocs = optimisticUpdatedDocs.map((doc) => {
          if (doc.docType === updatingDocType) {
            return response.data.document;
          }
          return doc;
        });
        setDocs(syncedDocs);

        setApplicationData((prev) =>
          prev
            ? {
                ...prev,
                docs: syncedDocs,
                status: response.data.applicationStatus || prev.status,
              }
            : prev
        );
      }
      
      // Also update selectedDoc if it is the one being updated
      setSelectedDoc((prev) =>
        prev && prev.docType === updatingDocType
          ? { ...prev, status: response.data?.document?.status || targetStatus, remarks: response.data?.document?.remarks || targetRemark.trim() || "" }
          : prev
      );
      setPreviewRejectMode(false);
      setPreviewRejectRemark("");
      
      // Show success toast
      toast.success(`Document status updated to ${targetStatus} successfully!`, {
        duration: 3000,
        position: "top-right",
      });
      
    } catch (err) {
      console.error("Error updating document status:", err);
      
      // Revert optimistic update on error
      setDocs(previousDocs);
      if (previousAppData) {
        setApplicationData(previousAppData);
      }
      
      // Show error toast
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update document status. Please try again.",
        {
          duration: 4000,
          position: "top-right",
        }
      );
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rm/applications/${applicationData._id}/docs/download-all`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
          responseType: "blob", // Important for file downloads
        }
      );

      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `All_Documents_${applicationData.appNo}.zip`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create a download link for all documents
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

     
    } catch (err) {
      console.error("Error downloading all documents:", err);
      toast.error("Failed to download all documents", {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setDownloading(false);
    }
  };

  // status

  const [status, setStatus] = useState("SUBMITTED");

  const [remark, setRemark] = useState("");

  const [submittedStatus, setSubmittedStatus] = useState(null);

  // Keep status dropdown aligned with server state (was stuck on default SUBMITTED after load).
  useEffect(() => {
    if (!applicationData?.status) return;
    const s = applicationData.status;
    if (["SUBMITTED", "DOC_INCOMPLETE", "DOC_COMPLETE"].includes(s)) {
      setStatus(s);
    } else if (s === "LOGIN") {
      setStatus("DOC_COMPLETE");
    }
  }, [applicationData?._id, applicationData?.status]);

  const statusColors = {
    KYC_PENDING: "bg-orange-100 text-orange-700 border border-orange-300",
    KYC_COMPLETE: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    UNDER_REVIEW: "bg-indigo-100 text-indigo-700 border border-indigo-300",
    IN_PROCESS: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    SUBMITTED: "bg-blue-100 text-blue-700 border border-blue-300",
    APPROVED: "bg-green-100 text-green-700 border border-green-300",
    AGREEMENT: "bg-cyan-100 text-cyan-700 border border-cyan-300",
    DISBURSED: "bg-purple-100 text-purple-700 border border-purple-300",
    REJECTED: "bg-red-100 text-red-700 border border-red-300",
  };

  const getDocStatusColor = (status) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800 border-green-200";

      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";

      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";

      case "UPDATED":
        return "bg-blue-100 text-blue-800 border-blue-300 animate-pulse"; // Highlight re-uploaded docs

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
        return <AlertCircle className="w-4 h-4 text-blue-600" />; // Special icon for updated docs

      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const [submitLoading, setSubmitLoading] = useState(false);

  const getLocalRequiredDocRules = (loanType) => {
    const baseDocs = ["PAN", "AADHAR_FRONT", "AADHAR_BACK"];
    const key = String(loanType || "").toUpperCase();
    if (key === "PERSONAL" || key === "HOME_LOAN_SALARIED") {
      return [
        ...baseDocs.map((docType) => ({ key: docType, acceptedDocTypes: [docType] })),
        { key: "SALARY_SLIP_1", acceptedDocTypes: ["SALARY_SLIP_1"] },
        { key: "BANK_STATEMENT_1", acceptedDocTypes: ["BANK_STATEMENT_1", "BANK_STATEMENT"] },
      ];
    }
    if (key === "BUSINESS" || key === "HOME_LOAN_SELF_EMPLOYED") {
      return [
        ...baseDocs.map((docType) => ({ key: docType, acceptedDocTypes: [docType] })),
        { key: "BANK_STATEMENT_1", acceptedDocTypes: ["BANK_STATEMENT_1", "BANK_STATEMENT"] },
      ];
    }
    return baseDocs.map((docType) => ({ key: docType, acceptedDocTypes: [docType] }));
  };

  const getEffectiveRules = () => {
    if (Array.isArray(requiredDocRules) && requiredDocRules.length) return requiredDocRules;
    return getLocalRequiredDocRules(applicationData?.loanType);
  };

  const normalizeDocKey = (value) => String(value || "").trim().toUpperCase();

  const isRuleMatchedByDoc = (rule, doc) => {
    const acceptedDocTypes = Array.isArray(rule?.acceptedDocTypes) ? rule.acceptedDocTypes : [];
    const docType = normalizeDocKey(doc?.docType);
    return acceptedDocTypes.some(
      (type) => normalizeDocKey(type) === docType
    );
  };

  const findDocForRule = (rule, docs = []) => {
    return docs.find((doc) => isRuleMatchedByDoc(rule, doc));
  };

  const docTypeDisplayNames = {
    PAN: "PAN Card",
    AADHAR_FRONT: "Aadhaar Front",
    AADHAR_BACK: "Aadhaar Back",
    PHOTO: "Photo",
    SELFIE: "Selfie",
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
  };

  const toDocLabel = (docType) => {
    const key = normalizeDocKey(docType);
    return docTypeDisplayNames[key] || key || "Document";
  };

  const getCanonicalRuleKeyForDoc = (docType) => {
    const key = normalizeDocKey(docType);
    const match = getEffectiveRules().find((rule) =>
      Array.isArray(rule?.acceptedDocTypes) &&
      rule.acceptedDocTypes.some((type) => normalizeDocKey(type) === key)
    );
    return normalizeDocKey(match?.key) || key;
  };

  const toDocLabelByRule = (docType) => toDocLabel(getCanonicalRuleKeyForDoc(docType));

  const fetchRequiredDocRules = async (application, rmToken) => {
    try {
      const response = await axios.get(`${backendurl}/partner/loan-doc-rules`, {
        params: {
          loanType: application?.loanType,
          gender: application?.customer?.gender || "",
        },
        headers: { Authorization: `Bearer ${rmToken}` },
      });
      if (Array.isArray(response?.data?.rules) && response.data.rules.length) {
        return response.data.rules;
      }
    } catch (_err) {}

    return getLocalRequiredDocRules(application?.loanType);
  };

  // Check if all required documents are verified
  const areAllDocumentsVerified = () => {
    if (!applicationData) return false;
    
    const requiredRules = getEffectiveRules();
    const uploadedDocs = applicationData.docs || [];

    // Do not allow completion if partner hasn't uploaded anything
    if (!uploadedDocs.length) return false;
    
    for (const rule of requiredRules) {
      const doc = findDocForRule(rule, uploadedDocs);
      
      if (!doc || doc.status !== "VERIFIED") {
        return false;
      }
    }

    // Optional/Other documents should not block unless explicitly REJECTED
    for (const doc of uploadedDocs) {
      const isRequired = requiredRules.some((rule) => isRuleMatchedByDoc(rule, doc));
      if (!isRequired && doc?.status === "REJECTED") {
        return false;
      }
    }

    return true;
  };

  // Get missing or unverified documents
  const getDocumentIssues = () => {
    if (!applicationData) return { missing: [], unverified: [] };
    
    const requiredRules = getEffectiveRules();
    const uploadedDocs = applicationData.docs || [];
    const missing = [];
    const unverifiedMap = new Map();

    const addUnverified = (docType, status) => {
      const key = String(docType || "").toUpperCase();
      if (!key) return;
      unverifiedMap.set(key, { docType, status });
    };
    
    for (const rule of requiredRules) {
      const doc = findDocForRule(rule, uploadedDocs);
      const key = String(rule?.key || "").toUpperCase();
      
      if (!doc) {
        if (key) missing.push(key);
      } else if (doc.status !== "VERIFIED") {
        addUnverified(key || doc.docType, doc.status);
      }
    }

    // Include optional documents only if they are REJECTED
    uploadedDocs.forEach((doc) => {
      const isRequired = requiredRules.some((rule) => isRuleMatchedByDoc(rule, doc));
      if (!isRequired && doc?.status === "REJECTED") {
        addUnverified(doc?.docType, doc?.status);
      }
    });
  
    return { missing, unverified: Array.from(unverifiedMap.values()) };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");
    const previousAppData = applicationData ? { ...applicationData } : null;

    try {
      // Validation
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

      // ✅ Validate DOC_COMPLETE - all documents must be verified
      if (status === "DOC_COMPLETE") {
        const allVerified = areAllDocumentsVerified();
        if (!allVerified) {
          const issues = getDocumentIssues();
          let errorMsg = "Cannot set DOC_COMPLETE status. ";
          
          if (issues.missing.length > 0) {
            errorMsg += `Missing documents: ${issues.missing.map(toDocLabel).join(", ")}. `;
          }
          if (issues.unverified.length > 0) {
            const unverifiedList = issues.unverified
              .map((u) => `${toDocLabel(u.docType)} (${u.status})`)
              .join(", ");
            errorMsg += `Unverified documents: ${unverifiedList}. `;
          }
          errorMsg +=
            "Please verify all documents first (no PENDING/UPDATED/REJECTED allowed) or change status to DOC_INCOMPLETE.";
          
          toast.error(errorMsg, {
            duration: 6000,
            position: "top-right",
          });
          setSubmitLoading(false);
          return;
        }
      }

      if (status === "DISBURSED") {
        const approvedAmt = parseInt(approvalAmount);
        const requestedAmt = applicationData.customer?.loanAmount || applicationData.loan?.amount || 0;
        
        if (!approvalAmount || approvedAmt <= 0) {
          toast.error("Please enter a valid approval amount for DISBURSED status");
          setSubmitLoading(false);
          return;
        }
        
        if (requestedAmt > 0 && approvedAmt > requestedAmt) {
          toast.error(`Approved loan amount cannot exceed the requested loan amount of ₹${requestedAmt.toLocaleString("en-IN")}`);
          setSubmitLoading(false);
          return;
        }
      }

      const { rmToken } = getAuthData();

      // Optimistic update - update UI immediately for fast response
      if (applicationData) {
        setApplicationData({
          ...applicationData,
          status: status,
        });
      }

      // Prepare the request body
      const requestBody = {
        to: status,
        note: remark,
      };

      // Add approvedLoanAmount only if status is DISBURSED
      if (status === "DISBURSED" && approvalAmount) {
        requestBody.approvedLoanAmount = parseInt(approvalAmount);
      }

      const response = await axios.post(
        `${backendurl}/rm/applications/${applicationData._id}/transition`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      // Sync with backend response (merge rsmId/asmId set on DOC_COMPLETE)
      const nextStatus = response.data?.status || status;
      if (response.data && applicationData) {
        setApplicationData((prev) => {
          if (!prev) return prev;
          const merged = {
            ...prev,
            status: nextStatus,
          };
          if (response.data.rsmId != null) merged.rsmId = response.data.rsmId;
          if (response.data.asmId != null) merged.asmId = response.data.asmId;
          return merged;
        });
      }
      if (["SUBMITTED", "DOC_INCOMPLETE", "DOC_COMPLETE"].includes(nextStatus)) {
        setStatus(nextStatus);
      } else if (nextStatus === "LOGIN") {
        setStatus("DOC_COMPLETE");
      }

      // Update local state
      setSubmittedStatus({
        status: nextStatus,
        remark,
        approvedLoanAmount: approvalAmount,
      });

      // Clear form
      setRemark("");
      setApprovalAmount("");

      // Show success toast
      toast.success(`Application status updated to ${nextStatus} successfully!`, {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      console.error("Error updating application status:", err);
      
      // Revert optimistic update on error
      if (previousAppData) {
        setApplicationData(previousAppData);
      }
      
      // Handle validation errors with detailed messages
      let errorMessage = err.response?.data?.message ||
        err.message ||
        "Failed to update application status";
      
      // If backend returned missing/unverified docs info, show it
      if (err.response?.data?.missingDocs || err.response?.data?.unverifiedDocs) {
        const missing = err.response.data.missingDocs || [];
        const unverified = err.response.data.unverifiedDocs || [];
        let details = "";
        if (missing.length > 0) {
          details += `Missing: ${missing.map(toDocLabel).join(", ")}. `;
        }
        if (unverified.length > 0) {
          details += `Unverified: ${unverified.map(toDocLabel).join(", ")}. `;
        }
        if (details) {
          errorMessage = `${errorMessage} ${details}`;
        }
      }
      
      setError(errorMessage);
      
      toast.error(errorMessage, {
        duration: 6000,
        position: "top-right",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Don't render anything if no data and still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            <span className="text-gray-700 text-lg">
              Loading application data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if there's an error and no data
  if (error && !applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Application
          </h2>
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

  // Don't render anything if no data
  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Application Data
          </h2>
          <p className="text-gray-600">Application data not available</p>
        </div>
      </div>
    );
  }

  const summaryRequiredRules = getEffectiveRules();
  const summaryRequiredCount = summaryRequiredRules.length;
  const summaryUploadedCount = summaryRequiredRules.filter((rule) =>
    findDocForRule(rule, docs)?.url
  ).length;
  const summaryVerifiedCount = summaryRequiredRules.filter((rule) => {
    const matched = findDocForRule(rule, docs);
    return matched?.status === "VERIFIED";
  }).length;
  const summaryPendingCount = Math.max(summaryRequiredCount - summaryVerifiedCount, 0);

  // Optional/Other docs counts
  const optionalDocs = docs.filter(doc => 
    !summaryRequiredRules.some(rule => isRuleMatchedByDoc(rule, doc))
  );
  const summaryOptionalCount = optionalDocs.length;
  const summaryOptionalVerifiedCount = optionalDocs.filter(doc => doc.status === "VERIFIED").length;
  const summaryOptionalPendingCount = optionalDocs.filter(doc => ["PENDING", "UPDATED", "REJECTED"].includes(doc.status)).length;

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

  return (
    <>
      {/* Error message banner */}
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

      {/* Prominent Notification for UPDATED Documents */}
      {applicationData && applicationData.docs && applicationData.docs.some(doc => doc.status === "UPDATED") && (
        <div className="sticky top-0 z-50 mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl shadow-xl border-2 border-blue-400 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg mb-1">⚠️ New Documents Uploaded by Partner</p>
                <p className="text-sm text-blue-100">
                  <span className="font-bold text-white text-base">
                    {applicationData.docs.filter(doc => doc.status === "UPDATED").length}
                  </span> document(s) need your verification. Please review and verify below.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Scroll to documents section
                const docSection = document.querySelector('[data-documents-section]');
                if (docSection) {
                  docSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Review Now →
            </button>
          </div>
        </div>
      )}

      {/* Document Status Management Modal */}
      {docStatusModal && selectedDocForStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100/80 overflow-hidden transform scale-100 transition-all">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold">Reject Document</h3>
              </div>
              <button
                onClick={() => {
                  setDocStatusModal(false);
                  setSelectedDocForStatus(null);
                  setDocStatusRemark("");
                  setDocNewStatus("PENDING");
                }}
                className="text-white/80 hover:text-white text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Document Type
                </p>
                <p className="text-base font-bold text-slate-800">
                  {toDocLabelByRule(selectedDocForStatus.docType)}
                </p>
              </div>

              {selectedDocForStatus?.status === "UPDATED" && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">New partner upload</p>
                    <p className="text-xs text-blue-600/90 mt-0.5">Verification is currently pending review.</p>
                  </div>
                </div>
              )}

              {/* Remarks & Submit Rejection directly */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Provide a clear explanation for the partner (e.g. details are blurry, incorrect document uploaded)..."
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 resize-none h-28 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white"
                    value={docStatusRemark}
                    onChange={(e) => setDocStatusRemark(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDocStatusModal(false);
                      setSelectedDocForStatus(null);
                      setDocStatusRemark("");
                      setDocNewStatus("PENDING");
                    }}
                    className="flex-1 px-5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-600 text-sm text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateDocStatus(selectedDocForStatus, "REJECTED", docStatusRemark)}
                    disabled={updateStatusLoading || !docStatusRemark.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {updateStatusLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      "Submit Rejection"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedDoc ? toDocLabelByRule(selectedDoc.docType) : "Document Preview"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreviewRejectMode(false);
                  setPreviewRejectRemark("");
                  if (selectedDoc?.previewUrl) {
                    window.URL.revokeObjectURL(selectedDoc.previewUrl);
                  }
                  setSelectedDoc(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {selectedDoc ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Meta details bar */}
                <div className="px-6 py-3 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-500">
                      File Type: <span className="text-slate-800 font-bold">{selectedDoc.contentType || "Document"}</span>
                    </span>
                    {selectedDoc?.docType?.includes("BANK_STATEMENT") && (applicationData?.customer?.bankStatementPassword || applicationData?.bankStatementPassword) && (
                      <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        Password: <span className="font-bold tracking-wider">{applicationData?.customer?.bankStatementPassword || applicationData?.bankStatementPassword}</span>
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 font-bold">
                    Status: 
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getDocStatusColor(selectedDoc.status)}`}>
                      {selectedDoc.status}
                    </span>
                  </span>
                </div>

                {/* Document Preview Content */}
                <div className="flex-1 min-h-[45vh] bg-slate-100/50 p-6 flex flex-col justify-center items-center overflow-y-auto">

                  {/* Loading state */}
                  {previewLoadingDoc !== null && (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {/* Document Preview */}
                  {previewLoadingDoc === null && selectedDoc.previewUrl && (
                    <div className="w-full h-96 border rounded overflow-hidden bg-gray-50">
                      {selectedDoc.isImage ? (
                        // Image preview
                        <img
                          src={selectedDoc.previewUrl}
                          alt={`Preview of ${selectedDoc.docType}`}
                          className="w-full h-full object-contain bg-white"
                          onError={(e) => {
                            console.error("Image preview failed:", e);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : (
                        // PDF or other document preview
                        <iframe
                          src={selectedDoc.previewUrl}
                          className="w-full h-full bg-white"
                          title={`Preview of ${selectedDoc.docType}`}
                          onError={(e) => {
                            console.error("Iframe preview failed:", e);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Fallback message */}
                  <div
                    className="w-full h-96 flex items-center justify-center bg-gray-50 text-gray-500 rounded-xl border border-slate-200"
                    style={{ display: "none" }}
                  >
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-bold text-slate-800">
                        Preview not available
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Please download this file type to view its contents
                      </p>
                      <p className="text-xs text-slate-400 mt-3 bg-slate-100 px-3 py-1.5 rounded-full inline-block">
                        Content-Type: {selectedDoc.contentType || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls Area */}
                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
                  {/* Rejection input inline in preview */}
                  {previewRejectMode ? (
                    <div className="space-y-4">
                      <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl space-y-3">
                        <label className="block text-sm font-bold text-rose-700">
                          Rejection Remark <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          placeholder="Why is this document invalid? (e.g. Blurry photo, mismatched names)..."
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 resize-none h-20 text-sm bg-white"
                          value={previewRejectRemark}
                          onChange={(e) => setPreviewRejectRemark(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewRejectMode(false);
                            setPreviewRejectRemark("");
                          }}
                          className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold text-slate-600 text-sm"
                        >
                          Cancel Rejection
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateDocStatus(selectedDoc, "REJECTED", previewRejectRemark);
                          }}
                          disabled={updateStatusLoading || !previewRejectRemark.trim()}
                          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition text-sm disabled:opacity-50"
                        >
                          {updateStatusLoading ? "Submitting..." : "Submit Rejection"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Main Action Buttons Grid */
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      {/* Left: Verification controls */}
                      <div className="flex flex-wrap gap-2.5">
                        {selectedDoc.status !== "VERIFIED" && (
                          <button
                            onClick={() => {
                              handleUpdateDocStatus(selectedDoc, "VERIFIED", "");
                            }}
                            disabled={updateStatusLoading}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 text-sm flex items-center gap-1.5"
                          >
                            <span>Approve ✓</span>
                          </button>
                        )}
                        {selectedDoc.status !== "REJECTED" && (
                          <button
                            onClick={() => {
                              setPreviewRejectMode(true);
                              setPreviewRejectRemark(selectedDoc.remarks || "");
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition shadow-md hover:shadow-lg text-sm flex items-center gap-1.5"
                          >
                            <span>Reject ✗</span>
                          </button>
                        )}
                        {(selectedDoc.status === "VERIFIED" || selectedDoc.status === "REJECTED") && (
                          <button
                            onClick={() => {
                              handleUpdateDocStatus(selectedDoc, "PENDING", "");
                            }}
                            disabled={updateStatusLoading}
                            className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition disabled:opacity-50 text-sm flex items-center gap-1.5"
                          >
                            <span>Mark Pending</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Right: Actions and close */}
                      <div className="flex gap-2.5 sm:self-auto self-end">
                        <button
                          onClick={() => handleDownload(selectedDoc)}
                          className="px-5 py-2.5 bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white rounded-xl hover:from-brand-primary-hover hover:to-brand-primary transition flex items-center gap-2 text-sm font-semibold shadow-md"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            setPreviewRejectMode(false);
                            setPreviewRejectRemark("");
                            if (selectedDoc?.previewUrl) {
                              window.URL.revokeObjectURL(selectedDoc.previewUrl);
                            }
                            setSelectedDoc(null);
                          }}
                          className="px-5 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-xl transition text-sm font-semibold shadow-sm"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <p className="text-slate-600 text-base font-semibold">{modalMessage}</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-6 px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover transition font-bold shadow-md"
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
            {/* Enhanced Header with Gradient */}

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
                    <p className="text-sm font-medium opacity-90 mb-1">
                      Applied Date
                    </p>

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

                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-brand-primary/10">
                      <User className="w-6 h-6 text-brand-primary" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Customer Details
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Full Name
                      </p>

                      <p className="font-semibold text-gray-900">
                        {applicationData.customer?.firstName
                          ? `${applicationData.customer.firstName} ${
                              applicationData.customer.lastName || ""
                            }`.trim()
                          : applicationData.customer?.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Email Address
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-brand-primary" />

                        {applicationData.customer?.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Phone Number
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-brand-primary" />

                        {applicationData.customer?.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partner Information */}

                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <User className="w-6 h-6 text-amber-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Partner Details
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Partner Name
                      </p>

                      <p className="font-semibold text-gray-900">
                        {applicationData.partnerId?.firstName ||
                          applicationData.partner?.firstName ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Email Address
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-amber-600" />

                        {applicationData.partnerId?.email ||
                          applicationData.partner?.email ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Phone Number
                      </p>

                      <p className="font-medium text-gray-700 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-amber-600" />

                        {applicationData.partnerId?.phone ||
                          applicationData.partner?.phone ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loan Summary */}

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Loan Summary
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Loan Type
                      </p>

                      <p className="font-semibold text-gray-900">
                        {applicationData.loanType ||
                          applicationData.loan?.type ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Loan Amount
                      </p>

                      <p className="font-bold text-3xl text-brand-primary">
                        {formatCurrency(
                          applicationData.customer?.loanAmount ||
                            applicationData.loan?.amount ||
                            0
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Tenure
                        </p>

                        <p className="font-semibold text-gray-900">
  {applicationData.loan?.tenorMonths || 'N/A'} months
</p>



                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Interest Rate
                        </p>

                        <p className="font-semibold text-gray-900">
                          {applicationData.loan?.roiPercent || 'N/A'}%
                        </p>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Details */}



{/* Customer Section */}
<div className="mb-8 bg-gradient-to-r from-slate-50 to-white rounded-xl p-6 border border-gray-100">
  <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Details</h2>
  {renderFields(customerFields, applicationData.customer)}
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

{/* Co-Applicant Section (only if Female + Business loan) */}
{applicationData.customer?.gender === "Female" &&
  applicationData.loanType === "BUSINESS" &&
  applicationData.coApplicant && (
    <div className="mb-8 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Co-Applicant Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
          <p className="font-bold text-gray-900">
            {applicationData.coApplicant.phone || "N/A"}
          </p>
        </div>
      </div>
    </div>
  )}


              {/* Address Information */}

              <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 ml-3">
                    Address Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                      Current Address
                    </p>

                    <p className="font-medium text-gray-900 mb-2">
                      {applicationData.customer?.currentAddress ||
                        applicationData.product?.currentAddress ||
                        applicationData.loan?.currentAddress ||
                        "N/A"}
                    </p>

                    <p className="text-sm text-gray-600">
                      PIN:{" "}
                      <span className="font-medium">
                        {applicationData?.customer?.currentAddressPinCode || "N/A"}
                      </span>
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                      Permanent Address
                    </p>

                    <p className="font-medium text-gray-900 mb-2">
                      {applicationData.customer?.permanentAddress ||
                        applicationData.product?.permanentAddress ||
                        applicationData.loan?.permanentAddress ||
                        "N/A"}
                    </p>

                    <p className="text-sm text-gray-600">
                      PIN:{" "}
                      <span className="font-medium">
                        {applicationData.customer?.permanentAddressPinCode || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Documents Section */}
              <div data-documents-section className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 ml-3">
                      Document Portfolio
                    </h2>
                    {applicationData?.docs && applicationData.docs.some(doc => doc.status === "UPDATED") && (
                      <span className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {applicationData.docs.filter(doc => doc.status === "UPDATED").length} NEW
                      </span>
                    )}
                  </div>
                </div>

                {/* Show info if there are UPDATED documents */}
                {docs.filter(doc => doc.status === "UPDATED").length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">
                      📋 {docs.filter(doc => doc.status === "UPDATED").length} document(s) uploaded by partner - needs verification (shown at top)
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Required</p>
                    <p className="text-lg font-bold text-gray-900">{summaryRequiredCount}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Uploaded</p>
                    <p className="text-lg font-bold text-blue-700">
                      {summaryUploadedCount} <span className="text-xs font-normal text-gray-500">({summaryOptionalCount} optional)</span>
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Verified</p>
                    <p className="text-lg font-bold text-green-700">
                      {summaryVerifiedCount} <span className="text-xs font-normal text-gray-500">({summaryOptionalVerifiedCount} optional)</span>
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-lg font-bold text-amber-700">
                      {summaryPendingCount} <span className="text-xs font-normal text-gray-500">({summaryOptionalPendingCount} optional)</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Required Documents Checklist</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {summaryRequiredRules.map((rule, idx) => {
                      const matchedDoc = findDocForRule(rule, docs);
                      const isUploaded = Boolean(matchedDoc?.url);
                      const isVerified = matchedDoc?.status === "VERIFIED";
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
                          <span className="text-sm font-medium text-gray-800">
                            {toDocLabel(rule?.key)}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${stateClass}`}>
                            {stateText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                  {(() => {
                    // Sort: UPDATED documents first
                    const sortedDocs = [...docs].sort((a, b) => {
                      if (a.status === "UPDATED" && b.status !== "UPDATED") return -1;
                      if (a.status !== "UPDATED" && b.status === "UPDATED") return 1;
                      return 0;
                    });
                    return sortedDocs;
                  })().map((doc, index) => {
                    // Map document types to appropriate icons
                    const getDocIcon = (docType) => {
                      const docTypeLower = docType?.toLowerCase() || "";
                      if (docTypeLower.includes("pan")) return FileText;
                      if (docTypeLower.includes("aadhar")) return FileText;
                      if (docTypeLower.includes("salary")) return Receipt;
                      if (docTypeLower.includes("address")) return Building2;
                      if (docTypeLower.includes("bank")) return CreditCard;
                      if (
                        docTypeLower.includes("photo") ||
                        docTypeLower.includes("selfie")
                      )
                        return Camera;
                      if (docTypeLower.includes("agreement")) return FileText;
                      if (docTypeLower.includes("receipt")) return Receipt;
                      if (docTypeLower.includes("deed")) return FileText;
                      if (docTypeLower.includes("allotment")) return FileText;
                      return FileText;
                    };

                    const IconComponent = getDocIcon(doc.docType);

                    return (
                      <div
                        key={index}
                        className={`relative bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 group ${
                          doc.status === "UPDATED" 
                            ? "border-blue-500 border-2 bg-gradient-to-br from-blue-50 to-blue-100 ring-2 ring-blue-300" 
                            : "border-gray-200"
                        }`}
                      >
                        {doc.status === "UPDATED" && (
                          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce z-10">
                            NEW
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center flex-1">
                            <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors">
                              <IconComponent className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
                            </div>

                            <div className="ml-3 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {toDocLabelByRule(doc.docType)}
                              </h3>
                              {doc.status === "UPDATED" && (
                                <p className="text-xs text-blue-600 font-semibold mt-1">
                                  🔄 Partner Uploaded - Verification Pending
                                </p>
                              )}
                              {doc.remarks && doc.status !== "UPDATED" && (
                                <p className="text-xs text-red-600 mt-1">
                                  Remark: {doc.remarks}
                                </p>
                              )}
                              {doc.updatedAt && doc.status === "UPDATED" && (
                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                  Re-uploaded: {new Date(doc.updatedAt).toLocaleDateString()} {new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                              {doc.uploadedAt && doc.status !== "UPDATED" && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Updated: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              )}
                              {doc.docType && doc.docType.includes("BANK_STATEMENT") && (applicationData?.customer?.bankStatementPassword || applicationData?.bankStatementPassword) && (
                                <p className="text-sm font-semibold text-gray-700 mt-2">
                                  Password: {applicationData?.customer?.bankStatementPassword || applicationData?.bankStatementPassword}
                                </p>
                              )}
                            </div>
                          </div>

                          <div
                            className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold border-2 ml-2 ${
                              doc.status === "UPDATED" 
                                ? "bg-blue-600 text-white border-blue-700 shadow-lg animate-pulse" 
                                : getDocStatusColor(doc.status)
                            }`}
                          >
                            {getDocStatusIcon(doc.status)}
                            <span className="ml-1">
                              {doc.status === "UPDATED" ? "UPDATED - VERIFY NOW" : doc.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-4 truncate">
                          {doc.url ? doc.url.split(/[\\\/]/).pop() : "No file"}
                        </p>

                        {/* Action buttons (Download + View + Manage) */}
                        <div className="flex flex-col gap-2">
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
                              disabled={previewLoadingDoc !== null}
                              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {previewLoadingDoc === doc.docType ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                              ) : (
                                "View"
                              )}
                            </button>
                          </div>
                          
                          {doc.status === "VERIFIED" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedDocForStatus(doc);
                                  setDocStatusRemark(doc.remarks || "");
                                  setDocNewStatus("REJECTED");
                                  setDocStatusModal(true);
                                }}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-all duration-300"
                              >
                                Reject ✗
                              </button>
                              <button
                                onClick={() => {
                                  handleUpdateDocStatus(doc, "PENDING", "");
                                }}
                                disabled={updateStatusLoading}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-300"
                              >
                                {updateStatusLoading && selectedDocForStatus?.docType === doc.docType ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                  "Mark Pending"
                                )}
                              </button>
                            </div>
                          ) : doc.status === "REJECTED" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  handleUpdateDocStatus(doc, "VERIFIED", "");
                                }}
                                disabled={updateStatusLoading}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-300 shadow-sm disabled:opacity-50"
                              >
                                {updateStatusLoading && selectedDocForStatus?.docType === doc.docType ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  "Approve ✓"
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  handleUpdateDocStatus(doc, "PENDING", "");
                                }}
                                disabled={updateStatusLoading}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-300"
                              >
                                {updateStatusLoading && selectedDocForStatus?.docType === doc.docType ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                  "Mark Pending"
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  handleUpdateDocStatus(doc, "VERIFIED", "");
                                }}
                                disabled={updateStatusLoading}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-300 shadow-sm disabled:opacity-50"
                              >
                                {updateStatusLoading && selectedDocForStatus?.docType === doc.docType ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  "Approve ✓"
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDocForStatus(doc);
                                  setDocStatusRemark(doc.remarks || "");
                                  setDocNewStatus("REJECTED");
                                  setDocStatusModal(true);
                                }}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-300 shadow-sm"
                              >
                                Reject ✗
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Download All Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloading}
                    className="flex items-center px-6 py-3 text-sm font-semibold text-white rounded-xl hover:shadow-xl bg-gradient-to-r from-brand-primary to-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Download className="w-5 h-5 mr-2" />
                    )}
                    {downloading
                      ? "Downloading All..."
                      : "Download All Documents"}
                  </button>
                </div>
              </div>

              {/* Enhanced Stage History */}

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 ml-3">
                    Application Management
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6"
                  >
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
                        disabled={applicationData?.rsmId && !["DRAFT", "SUBMITTED", "DOC_INCOMPLETE", "DOC_COMPLETE", "DOC_SUBMITTED"].includes(applicationData?.status)}
                      >
                        <option value="">Select Status</option>
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="DOC_INCOMPLETE">DOC_INCOMPLETE</option>
                        <option 
                          value="DOC_COMPLETE"
                        >
                          DOC_COMPLETE {!areAllDocumentsVerified() ? "(All docs must be verified)" : ""}
                        </option>
                        {/* ✅ RM can only set statuses up to DOC_COMPLETE. Beyond that, RSM handles it */}
                        {applicationData?.rsmId && !["DRAFT", "SUBMITTED", "DOC_INCOMPLETE", "DOC_COMPLETE", "DOC_SUBMITTED"].includes(applicationData?.status) && (
                          <option value="" disabled>
                            ⚠️ Application transferred to RSM - Status changes handled by RSM
                          </option>
                        )}
                      </select>
                      
                      {/* Show warning if trying to select DOC_COMPLETE without all docs verified */}
                      {status === "DOC_COMPLETE" && !areAllDocumentsVerified() && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800">
                                Cannot set DOC_COMPLETE status
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                {(() => {
                                  const issues = getDocumentIssues();
                                  let msg = "All documents must be verified first (no PENDING/UPDATED/REJECTED allowed). ";
                                  if (issues.missing.length > 0) {
                                    msg += `Missing: ${issues.missing.map(toDocLabel).join(", ")}. `;
                                  }
                                  if (issues.unverified.length > 0) {
                                    const unverifiedList = issues.unverified
                                      .map((u) => `${toDocLabel(u.docType)} (${u.status})`)
                                      .join(", ");
                                    msg += `Unverified: ${unverifiedList}. `;
                                  }
                                  return (
                                    msg +
                                    "Please verify all documents (no PENDING/UPDATED/REJECTED allowed) or select DOC_INCOMPLETE to allow document uploads."
                                  );
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show success message when DOC_COMPLETE is valid */}
                      {status === "DOC_COMPLETE" && areAllDocumentsVerified() && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800">
                                ✓ All documents verified
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                All documents are verified. You can proceed with DOC_COMPLETE status.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show info when application has been transferred to RSM */}
                      {applicationData?.rsmId && !["DRAFT", "SUBMITTED", "DOC_INCOMPLETE", "DOC_COMPLETE", "DOC_SUBMITTED"].includes(applicationData?.status) && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-800">
                                Application Transferred to RSM
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                Current Status: {getLoanStatusLabel(applicationData?.status)}. This application has been transferred to RSM. Further status changes (UNDER_REVIEW, APPROVED, DISBURSED, etc.) are handled by RSM only.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show info when current status is DOC_COMPLETE - can revert to DOC_INCOMPLETE but not go forward */}
                      {applicationData?.status === "DOC_COMPLETE" && !applicationData?.rsmId && status !== "DOC_INCOMPLETE" && status !== "DOC_COMPLETE" && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800">
                                Current Status: DOC_COMPLETE
                              </p>
                              <p className="text-xs text-yellow-600 mt-1">
                                Once you submit DOC_COMPLETE, this application will be automatically transferred to RSM. You can only revert to DOC_INCOMPLETE if needed.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show info when current status is DOC_COMPLETE - can always revert to DOC_INCOMPLETE */}
                      {applicationData?.status === "DOC_COMPLETE" && !applicationData?.rsmId && status === "DOC_INCOMPLETE" && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-800">
                                Reverting to DOC_INCOMPLETE
                              </p>
                              <p className="text-xs text-blue-700 mt-1">
                                You can change status to <strong>DOC_INCOMPLETE</strong> at any time if documents need to be re-uploaded or re-verified.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show confirmation when reverting from DOC_COMPLETE to DOC_INCOMPLETE */}
                      {applicationData?.status === "DOC_COMPLETE" && status === "DOC_INCOMPLETE" && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800">
                                Reverting to DOC_INCOMPLETE
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                This will allow the partner to upload or update documents. You can set it back to DOC_COMPLETE once all required documents are verified.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show info when selecting DOC_INCOMPLETE - always available */}
                      {status === "DOC_INCOMPLETE" && applicationData?.status !== "DOC_INCOMPLETE" && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-800">
                                Setting Status to DOC_INCOMPLETE
                              </p>
                              <p className="text-xs text-blue-700 mt-1">
                                This status allows partners to upload or update documents. You can change it to DOC_COMPLETE once all required documents are verified.
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

                    {/* Approval Amount Field - Only show when DISBURSED is selected */}
                    {status === "DISBURSED" && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-semibold text-gray-700">
                            Approved Loan Amount (₹) *
                          </label>
                          <span className="text-xs text-gray-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                            Requested: ₹{(applicationData.customer?.loanAmount || applicationData.loan?.amount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <input
                          type="number"
                          placeholder="Enter approved loan amount"
                          className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 ${
                            approvalAmount && (
                              parseInt(approvalAmount) <= 0 || 
                              parseInt(approvalAmount) > (applicationData.customer?.loanAmount || applicationData.loan?.amount || 0)
                            ) ? "border-red-500 ring-2 ring-red-200" : "border-gray-300"
                          }`}
                          value={approvalAmount}
                          onChange={(e) => setApprovalAmount(e.target.value)}
                          min="1"
                          required
                        />
                        {approvalAmount && (
                          <div className="mt-2 space-y-1">
                            {parseInt(approvalAmount) > (applicationData.customer?.loanAmount || applicationData.loan?.amount || 0) && (
                              <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Approved amount cannot exceed requested amount
                              </p>
                            )}
                            {parseInt(approvalAmount) <= 0 && (
                              <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Approved amount must be greater than zero
                              </p>
                            )}
                            {parseInt(approvalAmount) > 0 && parseInt(approvalAmount) <= (applicationData.customer?.loanAmount || applicationData.loan?.amount || 0) && (
                              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Valid approved amount
                              </p>
                            )}
                            <p className="text-xs font-medium text-brand-primary italic mt-1 bg-brand-primary/5 px-2.5 py-1.5 rounded-lg border border-brand-primary/10">
                              In words: {toIndianWords(parseInt(approvalAmount))}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={submitLoading}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Current Status
                    </h3>

                    <div className="space-y-4">
                      {submittedStatus ? (
                        <div className="space-y-3">
                          {/* Status Display */}
                          <div
                            className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold text-sm ${
                              statusColors[submittedStatus.status]
                            }`}
                          >
                            {submittedStatus.status}
                          </div>

                          {/* Remark Display */}
                          {submittedStatus.remark && (
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Latest Remark:
                              </p>
                              <p className="text-gray-600">
                                {submittedStatus.remark}
                              </p>
                            </div>
                          )}

                          {/* Approved Amount Display */}
                          {submittedStatus.approvedLoanAmount && (
                            <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                              <p className="text-sm font-medium text-green-700 mb-1">
                                Approved Loan Amount:
                              </p>
                              <p className="text-green-800 font-semibold text-lg">
                                ₹
                                {formatCurrency(
                                  submittedStatus.approvedLoanAmount
                                )}
                              </p>
                            </div>
                          )}

                          {/* Extra Input + Button ONLY when DISBURSED */}
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
                            Approved Loan Amount: {applicationData.approvedLoanAmount || "N/A"}
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

export default CustomerApplication;






// {applicationData.loanType === "PERSONAL" ? (
//   <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-gray-100 ">
//     <div className="flex items-center mb-6">
//       <div className="p-2 rounded-lg bg-emerald-100">
//         <MapPin className="w-6 h-6 text-emerald-600" />
//       </div>

//       <h2 className="text-xl font-bold text-gray-900 ml-3">
//         Company Information
//       </h2>
//     </div>

//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//       {/* Company Name */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Company Name
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.employmentInfo?.companyName ||
          
//             "N/A"}
//         </p>
//       </div>

//       {/* Company Address */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Company Address
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.employmentInfo?.companyAddress ||
       
//             "N/A"}
//         </p>
// {/* 
//         <p className="text-sm text-gray-600">
//           PIN:{" "}
//           <span className="font-medium">
//             {applicationData.employmentInfo?.permanentPin || "N/A"}
//           </span>
//         </p> */}
//       </div>
//     </div>

//     {/* ✅ One row for Experience & Designation */}

//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Total Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.totalExperience ||
        
//             "N/A"}{" "}
//           years
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData?.employmentInfo?.currentExperience ??
//             "N/A"}
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Designation
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.designation ||
 
//             "N/A"}
//         </p>
//       </div>
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Monthly Salary
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.monthlySalary ||
 
//             "N/A"}
//         </p>
//       </div>
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Salary In Hand
//         </p>

//         <p className="font-bold text-gray-900">
//           {
//             applicationData.employmentInfo?.salaryInHand ||
 
//             "N/A"}
//         </p>
//       </div>
//     </div>
//   </div>
// ) : (
//   <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-gray-100 ">
//     <div className="flex items-center mb-6">
//       <div className="p-2 rounded-lg bg-emerald-100">
//         <MapPin className="w-6 h-6 text-emerald-600" />
//       </div>

//       <h2 className="text-xl font-bold text-gray-900 ml-3">
//         Bussiness Information
//       </h2>
//     </div>

//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//       {/* Company Name */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Business Name
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.product?.companyName ||
//             applicationData.employmentInfo?.companyName ||
//             applicationData.loan?.currentAddress ||
//             "N/A"}
//         </p>
//       </div>

//       {/* Company Address */}

//       <div className="bg-white rounded-lg p-5 shadow-sm">
//         <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//           <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
//           Company Address
//         </p>

//         <p className="font-medium text-gray-900 mb-2">
//           {applicationData.product?.currentAddress ||
//             applicationData.employmentInfo?.companyAddress ||
//             applicationData.loan?.permanentAddress ||
//             "N/A"}
//         </p>

//         <p className="text-sm text-gray-600">
//           PIN:{" "}
//           <span className="font-medium">
//             {applicationData.loan?.permanentPin || "N/A"}
//           </span>
//         </p>
//       </div>
//     </div>

//     {/* ✅ One row for Experience & Designation */}

//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Total Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData.product?.totalExperience ||
//             applicationData.employmentInfo?.totalExperience ||
//             applicationData.loan?.totalExperience ||
//             "N/A"}{" "}
//           years
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Experience
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData?.employmentInfo?.currentExperience ??
//             "N/A"}
//         </p>
//       </div>

//       <div className="bg-white rounded-lg p-4 shadow-sm">
//         <p className="text-sm font-medium text-gray-500 mb-2">
//           Current Designation
//         </p>

//         <p className="font-bold text-gray-900">
//           {applicationData.product?.designation ||
//             applicationData.employmentInfo?.designation ||
//             applicationData.loan?.currentDesignation ||
//             "N/A"}
//         </p>
//       </div>
//     </div>
//   </div>
// )}
// )}